# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo contains two applications sharing the same Express backend + SQLite database:

1. **WWII Battle Map** (primary) — interactive Leaflet map with unit positions animated over time. Multi-battle architecture with React Router routing (`/battle/:battleId`). Stalingrad is the first battle implemented.

2. **S-REIT Dashboard** (secondary) — Singapore REIT financial analysis dashboard at `/`. Fetches data from Yahoo Finance.

## Commands

```bash
npm run dev          # Vite frontend (port 5173-5176)
npm run dev:server   # Express API server (port 3001)
npm run dev:all      # Both concurrently
npm run build        # tsc + Vite production build
npm run lint         # ESLint
npx tsc --noEmit     # Single-file type check
```

## Architecture — Battle Map

### Routing

`App.tsx` uses React Router DOM v7:
- `/` — S-REIT Dashboard
- `/home` — WWII landing page
- `/battle/:battleId` — battle viewer
- `/battle/:battleId/edit` — battle editor (same `BattleView` component, `isEditorActive=true`)

### State: Zustand Store + React Context

**Zustand** (`src/store/battleStore.ts`) handles battle list + config caching:
- `battleList: BattleSummary[]` from `GET /api/battles`
- `configCache: Record<string, BattleConfig>` — max 5 entries, evicts oldest
- `getBattleConfig(id)` / `loadBattleConfig(id)` — cached with in-flight polling
- `loadBattleList()` — fetches once, skips if already loaded

**React Context** providers wrap `BattleViewInner` for runtime state:
- `TimelineProvider` — `currentDate`, `isPlaying`, `speed` (uses `requestAnimationFrame`)
- `MapProvider` — `selectedUnitId`, `hoveredUnitId`, `flyTo` target
- `EditorProvider` — `isActive`, `activeTool`, editor-specific state

### Data Loading

`useBattle(battleId)` in `src/hooks/useBattle.ts` loads battle configs:
1. Fetches from API (`GET /api/battles/:id`)
2. Falls back to static import if DB not seeded or API errors
3. Static import uses dynamic `import()`: `stalingrad: () => import('../data/stalingrad/stalingradData')`

### Unit Position Interpolation

`useUnitPositions(battle, currentDate)` does the core computation:
- Groups keyframes by unit, finds bounding frames around `currentDate`
- Linear interpolation for position; `army_group`/`army` types snap to nearest keyframe (no interpolation)
- Computes unit lifecycle: `active` → `under_attack` (−2d) → `dying` (+4d) → `eliminated` (+25d) → gone
- Builds `hasExplicitDeparture` Set — units with explicitly-set `departureDate` enter lifecycle
- Generates destruction vectors: nearest enemy within ~100km for each dying unit

### Component Tree

```
BattleView → TimelineProvider → MapProvider → EditorProvider → BattleViewInner
  Top Bar: home link, battle name, ☠ losses counter, edit link, date range
  Middle Row:
    Left Panel (280px): TheatreSelector, ReferenceTimeline, ContextMap
    UnitPanel (280px): UnitTree (ORBAT), UnitDetail
    Map Area (flex: 1): BattleMap (Leaflet) + editor overlays
  Bottom Bar: TimelineScrubber (play/pause, speed, slider, event ticks)
```

### Leaflet Map Layers (BattleMap.tsx)

- Tile layers (Standard/Terrain/Satellite) via `LayersControl`
- Front line `Polyline`s from `battle.phases[]`
- Encirclement pocket rings + offensive arrows
- Event dot `CircleMarker`s
- Unit markers with NATO echelon symbols rendered as `L.divIcon` SVGs
- Destruction vectors (dashed red `Polyline`s) + pulse ring `DivIcon`s + floating casualty numbers
- `EditorMapLayer` — invisible click handler for placing units in editor mode

### Editor Mode

URL-driven: `/battle/:battleId/edit`. A layer on top of the viewer, not a separate page:
- `EditorToolbar` — floating panel: Select/Place/Move/Add Event tools, save keyframe, export JSON, seed DB
- `EditorMapLayer` — map click handler for placing units; registers keyboard shortcuts (V/P/M/E)
- `EditorKeyframePanel` — keyframe list at map bottom for selected unit

The editor API client (`src/lib/editorApi.ts`) calls `http://localhost:3001` directly (bypasses Vite proxy). It transforms snake_case DB columns to camelCase `BattleConfig` types.

### Battle Data Quality Workflow

```
/battle-research → dossier.md → implement seed data → fill audit.md → all checkboxes ticked
```

- `src/data/_template/dossier-template.md` — research dossier template
- `src/data/_template/audit-template.md` — per-battle audit checklist (gate before completion)
- Each battle gets `src/data/{battleId}/dossier.md` + `audit.md`

## Architecture — S-REIT Dashboard (secondary)

- `src/App.tsx` → `Dashboard.tsx` → `REITTable.tsx` / `REITDetail.tsx`
- `src/api/client.ts` — Axios with `/api` prefix (Vite proxies to `:3001`)
- Hooks in `src/hooks/useREITData.ts`, `useHistoricalPB.ts`, `useHistoricalData.ts`, etc.
- Charts use Recharts: P/B bands, DPU history, price history, geographic pie
- `REIT_LIST` in `server/index.ts` is the source of truth for tracked tickers

## Server (`server/index.ts`)

One Express server hosts both APIs:

**Battle routes**: `GET/PUT/DELETE /api/battles[/:id]`, `/api/battles/:id/units[/:unitId]`, `/api/battles/:id/keyframes[/:unitId/:date]`, `/api/battles/:id/events[/:eventId]`, `/api/battles/:id/maps[/:mapId]`, `POST /api/battles/seed`, `POST /api/battles/:id/export`

**REIT routes**: `GET /api/reits`, `/api/reits/quotes`, `/api/quote/:ticker`, `/api/history/:ticker`, `/api/historical-pb/:ticker`, `/api/price-history/:ticker`, `/api/sectors`, `/api/bond-yield`, `POST /api/sync`

### SQLite (`server/db.ts`)

Database at `server/data/reit_cache.db`. WAL mode enabled. Two table families:

**Battle**: `battles`, `battle_units`, `battle_keyframes`, `battle_events`, `battle_historical_maps`

**REIT**: `balance_sheet_history`, `price_history`, `pb_history`

## Key Types (`src/types/battle.ts`)

- `BattleConfig` — root: `{ id, name, dateRange, defaultCenter, defaultZoom, theatre, units[], events[], historicalMaps[], keyframes[], phases[] }`
- `Unit` — `{ id, name, commander, side, type, parentId, nation, color, arrivalDate?, departureDate?, metadata }`
- `UnitType` — `'army_group' | 'army' | 'corps' | 'division' | 'regiment' | 'battalion' | 'company'`
- `PositionKeyframe` — `{ unitId, date, lat, lng, confidence }`
- `BattlePhase` — `{ date, frontLine[], sectors[], pocketRing?, pocketNorth?, arrows[] }`
- `HistoricalMap` — `{ id, title, date, imageUrl, gcps[], opacity }` (GCP = ground control points for georeferencing)

## Critical Bug Patterns

- **`hasExplicitDeparture` Set**: Always use `Set<string>` of unit IDs with explicitly-set `departureDate` to detect destroyed units. Never compare `departureDate === battle.dateRange.end` as a string — units destroyed on the last day will be missed.
- **`metadata.strength`**: Must be populated for every unit with a `departureDate`. The losses counter (top bar) and floating casualty numbers (on map) both read this field.
- **`BattleView.tsx` is the active component**: `BattleLayout.tsx` is dead code after the routing restructure. All battle UI changes go in `BattleView.tsx`.
- **Maximum granularity**: Every army MUST have subordinate corps/divisions. Never leave an army with no children. Opposing forces need symmetric echelon depth.

## Skills

- `/battle-research` — systematic WWII ORBAT research methodology (`.claude/skills/battle-research.md`). Research → dossier → implement → audit workflow. Must research down to division level for every formation.
