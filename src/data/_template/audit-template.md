# Battle Audit: {battleId}

## Research Completeness

- [ ] Dossier exists at `src/data/{battleId}/dossier.md`
- [ ] 3+ independent sources consulted for ORBAT
- [ ] All sources listed in dossier with URLs
- [ ] All discrepancies between sources documented and resolved

## ORBAT Completeness

- [ ] All army groups / fronts present
- [ ] All armies present (including allied/minor nation armies)
- [ ] All corps present
- [ ] All divisions present (at minimum, every division that participated)
- [ ] Key independent regiments/battalions for critical engagements
- [ ] Commanders listed for every army-level and corps-level unit
- [ ] All allied/minor nation formations included (Romanian, Hungarian, Italian, etc.)
- [ ] **MAXIMUM GRANULARITY**: Every army on every side has subordinate corps/divisions — no bare army-level units without children
- [ ] **SYMMETRIC DETAIL**: Opposing forces have equivalent echelon depth. If Axis allies have corps+divisions listed, the Soviet forces facing them must too.

## Temporal Accuracy

- [ ] Every unit has an `arrivalDate` (or defaults to battle start)
- [ ] Every unit has a `departureDate` (or defaults to battle end)
- [ ] No unit appears before its documented arrival
- [ ] No unit persists past its documented departure/surrender/destruction
- [ ] Arrival/departure dates cross-referenced across 2+ sources
- [ ] Keyframes align with known operational phase boundaries
- [ ] **Unit incapacitation verified**: Destroyed/encircled/captured units (e.g. Romanian 3rd Army, Italian II Corps, Hungarian 2nd Army) have `departureDate` set and do NOT render on the map after that date. Scrub timeline through the full battle range to confirm.
- [ ] Units that arrived mid-battle have `arrivalDate` set and do NOT render before that date
- [ ] `useUnitPositions` hook correctly filters out units where `currentDate > departureDate` or `currentDate < arrivalDate`
- [ ] `metadata.strength` populated for every unit that has a `departureDate` set (required for casualties counter and floating map numbers)

## Destruction Visualization

- [ ] Units with `departureDate` set enter the 4-phase lifecycle: `under_attack` → `dying` → `eliminated` → `gone`
- [ ] Destruction vectors (dashed red lines) connect destroyed units to nearest enemy unit
- [ ] Pulse rings appear at destruction sites during `dying` phase
- [ ] Floating casualty numbers appear above destroyed units with `metadata.strength > 0`
- [ ] Cumulative losses counter in top bar increments correctly as units are destroyed
- [ ] `hasExplicitDeparture` Set pattern used (NOT string comparison) — units destroyed on battle end date still enter lifecycle

## Position Data

- [ ] Every unit has at least 1 keyframe per operational phase it participated in
- [ ] Keyframe positions cross-referenced with historical maps
- [ ] Front line geometry matches documented phase boundaries
- [ ] Confidence levels assigned to all keyframes (high/medium/low)

## Events

- [ ] All major operational phase transitions have events
- [ ] Critical moments documented (encirclement closed, surrender, relief attempts)
- [ ] Events have accurate lat/lng positions

## Historical Maps (optional, for editor)

- [ ] At least one historical map sourced for georeferencing
- [ ] Map dates align with operational phases

## Cross-Battle Consistency

- [ ] Unit IDs follow naming convention (e.g. `ger-6a`, `sov-62a`)
- [ ] Units that appear in multiple battles use the same ID
- [ ] Parent/child relationships consistent across battles

## Sign-off

- [ ] Dossier reviewed and verified
- [ ] Audit checklist completed
- [ ] Battle loads without errors (`GET /api/battles/{battleId}`)
- [ ] Timeline scrubbing shows correct unit movement
- [ ] All units visible and clickable in the ORBAT panel

**Auditor**: [name]
**Date**: [YYYY-MM-DD]
