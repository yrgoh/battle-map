import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BattleConfig, BattlePhase, Unit } from '../../types/battle';
import { useTimeline } from '../../hooks/useTimeline';
import { useMapSelection, type FlyToTarget } from '../../hooks/useMapSelection';
import { useUnitPositions, type UnitStatus, type DestructionVector } from '../../hooks/useUnitPositions';
import { useEditorMode } from '../../hooks/useEditorMode';
import { EditorMapLayer } from '../Editor/EditorMapLayer';
import { HistoricalMapLayer } from '../Editor/HistoricalMapLayer';
import { MapLegend } from './MapLegend';

const ZOOM_THRESHOLDS: Record<string, number> = {
  army_group: 0,
  army: 7,
  corps: 8,
  division: 9,
  regiment: 10,
  battalion: 11,
};

// Max zoom — above this, the echelon is too big for the zoom level and disappears.
// Each band has a 1-zoom overlap so transitions aren't jarring.
const ZOOM_CEILINGS: Record<string, number> = {
  army_group: 7,
  army: 9,
  corps: 11,
  division: 14,
  regiment: 17,
  battalion: Infinity,
};

const DEFAULT_CENTER: [number, number] = [48.71, 44.51];
const DEFAULT_ZOOM = 8;

function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onZoom(map.getZoom());
    map.on('zoomend', handler);
    onZoom(map.getZoom());
    return () => { map.off('zoomend', handler); };
  }, [map, onZoom]);
  return null;
}

function MapNavigationController({ target, onDone }: { target: FlyToTarget | null; onDone: () => void }) {
  const map = useMap();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!target) return;
    if (!isFinite(target.lat) || !isFinite(target.lng) || !isFinite(target.zoom)) return;
    try {
      map.flyTo([target.lat, target.lng], target.zoom, { duration: 1.5 });
    } catch (_) { /* Leaflet may throw on invalid coords */ }
    // Use setTimeout to defer onDone so flyTo has a chance to start
    const timer = setTimeout(() => onDoneRef.current(), 0);
    return () => clearTimeout(timer);
  }, [target, map]);
  return null;
}

// Classic military map echelon notation
function getEchelonSymbol(type: string): string {
  switch (type) {
    case 'army_group': return 'XXXXX';
    case 'army': return 'XXXX';
    case 'corps': return 'XXX';
    case 'division': return 'XX';
    case 'regiment': return 'X';
    case 'battalion': return 'III';
    case 'company': return 'II';
    default: return 'X';
  }
}

function getUnitBoxColor(unit: Unit): { bg: string; border: string; text: string } {
  if (unit.side === 'soviet') return { bg: '#cc0000', border: '#990000', text: '#fff' };
  if (unit.nation === 'romania') return { bg: '#b0a090', border: '#8a7a6a', text: '#000' };
  if (unit.nation === 'italy') return { bg: '#7a8a60', border: '#5a6a40', text: '#fff' };
  if (unit.nation === 'hungary') return { bg: '#789a9a', border: '#587a7a', text: '#fff' };
  return { bg: '#d0d0d0', border: '#b0b0b0', text: '#000' };
}

function createVectorUnitIcon(unit: Unit, isSelected: boolean): L.DivIcon {
  const colors = getUnitBoxColor(unit);
  const echelon = getEchelonSymbol(unit.type);
  const key = unit.id.split('-').pop() ?? '';

  const w = unit.type === 'army_group' || unit.type === 'army' ? 52 : unit.type === 'corps' ? 46 : unit.type === 'division' ? 40 : 34;
  const h = 32;
  const fontSize = unit.type === 'army_group' || unit.type === 'army' ? 14 : unit.type === 'corps' ? 12 : 11;
  const idSize = fontSize * 0.7;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="1"
      fill="${colors.bg}" stroke="${isSelected ? '#ffdd00' : colors.border}"
      stroke-width="${isSelected ? '2.5' : '1.5'}" ${isSelected ? 'filter="drop-shadow(0 0 2.5px #ffdd00)"' : ''} stroke-linejoin="round"/>
    <text x="${w / 2}" y="${h * 0.52}" text-anchor="middle"
      font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold"
      fill="${colors.text}" letter-spacing="0.5">${echelon}</text>
    <text x="${w / 2}" y="${h * 0.82}" text-anchor="middle"
      font-family="Arial,Helvetica,sans-serif" font-size="${idSize}" font-weight="bold"
      fill="${colors.text}">${key}</text>
  </svg>`;

  return L.divIcon({
    className: 'vector-unit-marker',
    html: `<div style="width:${w}px;height:${h}px;">${svg}</div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    popupAnchor: [0, -h / 2],
  });
}

/** Destroyed unit — skull/cross icon for the "eliminated" ghost phase */
function createEliminatedIcon(): L.DivIcon {
  const size = 18;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <line x1="3" y1="3" x2="${size - 3}" y2="${size - 3}" stroke="#cc3333" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${size - 3}" y1="3" x2="3" y2="${size - 3}" stroke="#cc3333" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;
  return L.divIcon({
    className: 'destroyed-marker',
    html: `<div style="width:${size}px;height:${size}px;opacity:0.6;" title="Destroyed">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Pulse ring for dying units — expanding red circle */
function createDestructionPulseIcon(): L.DivIcon {
  return L.divIcon({
    className: 'destruction-pulse',
    html: `<div class="destruction-pulse-ring"></div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function formatLossesCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/** Floating casualty number that appears above destroyed units */
function createCasualtyNumberIcon(strength: number): L.DivIcon {
  const label = formatLossesCompact(strength);
  return L.divIcon({
    className: '',
    html: `<div class="casualty-number">☠ ${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Create a unit icon with status-aware rendering:
 * - active: normal colors
 * - under_attack: red border, subtle pulse
 * - dying: red background, strong pulse, fading opacity
 * - eliminated: skull/cross icon
 */
function createStatusUnitIcon(unit: Unit, isSelected: boolean, status: UnitStatus): L.DivIcon {
  if (status === 'eliminated') return createEliminatedIcon();

  const baseColors = getUnitBoxColor(unit);
  const isDestroyed = status === 'dying' || status === 'under_attack';
  const colors = isDestroyed
    ? { bg: '#550000', border: status === 'dying' ? '#ff2222' : '#cc4444', text: '#ffaaaa' }
    : baseColors;

  const echelon = getEchelonSymbol(unit.type);
  const key = unit.id.split('-').pop() ?? '';
  const w = unit.type === 'army_group' || unit.type === 'army' ? 52 : unit.type === 'corps' ? 46 : unit.type === 'division' ? 40 : 34;
  const h = 32;
  const fontSize = unit.type === 'army_group' || unit.type === 'army' ? 14 : unit.type === 'corps' ? 12 : 11;
  const idSize = fontSize * 0.7;

  const selStroke = isSelected ? '#ffdd00' : colors.border;
  const selWidth = isSelected ? '2.5' : '1.5';
  const selFilter = isSelected ? 'filter="drop-shadow(0 0 2.5px #ffdd00)"' : '';

  // Flash animation class for under_attack
  const animClass = status === 'under_attack' ? 'unit-under-attack' : status === 'dying' ? 'unit-dying' : '';
  // Opacity fade for dying
  const opacity = status === 'dying' ? 'opacity:0.6;' : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="1"
      fill="${colors.bg}" stroke="${selStroke}"
      stroke-width="${selWidth}" ${selFilter} stroke-linejoin="round"/>
    <text x="${w / 2}" y="${h * 0.52}" text-anchor="middle"
      font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold"
      fill="${colors.text}" letter-spacing="0.5">${echelon}</text>
    <text x="${w / 2}" y="${h * 0.82}" text-anchor="middle"
      font-family="Arial,Helvetica,sans-serif" font-size="${idSize}" font-weight="bold"
      fill="${colors.text}">${key}</text>
  </svg>`;

  return L.divIcon({
    className: `vector-unit-marker ${animClass}`,
    html: `<div style="width:${w}px;height:${h}px;${opacity}">${svg}</div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h / 2],
    popupAnchor: [0, -h / 2],
  });
}

function createArrowheadIcon(color: string): L.DivIcon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
    <polygon points="0,0 0,16 14,8" fill="${color}"/>
  </svg>`;
  return L.divIcon({
    className: 'arrowhead',
    html: `<div style="width:16px;height:16px;">${svg}</div>`,
    iconSize: [16, 16],
    iconAnchor: [0, 8],
  });
}

/**
 * Find the active phase for a given date by scanning battle.phases.
 * Phases are sorted by date; returns the last phase whose date <= current.
 * Returns null if no phase matches (before the first defined phase).
 */
function getActivePhase(phases: BattlePhase[], currentDate: Date): BattlePhase | null {
  if (!phases || phases.length === 0) return null;
  const target = currentDate.toISOString().slice(0, 10);
  let active: BattlePhase | null = null;
  for (const phase of phases) {
    if (phase.date <= target) active = phase;
    else break;
  }
  return active;
}

// Compute midpoint of a path for label placement
function pathMidpoint(path: Array<[number, number]>): [number, number] {
  if (path.length === 0) return [0, 0];
  const mid = Math.floor(path.length / 2);
  return path[mid];
}

// Generate a label marker for a front sector
function createSectorLabel(name: string, color: string): L.DivIcon {
  return L.divIcon({
    className: 'sector-label',
    html: `<div style="
      background:${color};
      color:${color === '#b0a090' || color === '#789a9a' ? '#000' : '#fff'};
      font-size:9px;
      font-weight:bold;
      padding:1px 4px;
      border-radius:2px;
      white-space:nowrap;
      font-family:Arial,Helvetica,sans-serif;
      border:1px solid rgba(0,0,0,0.3);
      box-shadow:0 0 3px rgba(0,0,0,0.3);
    ">${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** Unit marker that renders destruction status and shows a popup with annihilation context */
function UnitMarkerWithAttackEffect({
  unit, pos, isSelected, currentZoom,
  onSelect, onHover,
}: {
  unit: Unit;
  pos: { lat: number; lng: number; status: UnitStatus };
  isSelected: boolean;
  currentZoom: number;
  onSelect: (lat: number, lng: number) => void;
  onHover: (id: string | null) => void;
}) {
  const isDestroyed = pos.status === 'under_attack' || pos.status === 'dying' || pos.status === 'eliminated';

  return (
    <Marker
      position={[pos.lat, pos.lng]}
      icon={createStatusUnitIcon(unit, isSelected, pos.status)}
      eventHandlers={{
        click: (e) => {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          onSelect(pos.lat, pos.lng);
        },
        mouseover: () => onHover(unit.id),
        mouseout: () => onHover(null),
      }}
    >
      <Popup>
        <div style={{ maxWidth: 260 }}>
          <strong>{unit.name}</strong>
          {unit.commander && (
            <div style={{ color: '#888', fontSize: '0.8em' }}>{unit.commander}</div>
          )}
          <div style={{ fontSize: '0.85em', marginTop: 4 }}>
            {unit.side === 'axis' ? 'Axis' : 'Soviet'} &middot; {unit.nation} &middot; {unit.type.replace('_', ' ')}
          </div>
          {isDestroyed && (
            <div style={{
              marginTop: 6,
              padding: '4px 8px',
              background: pos.status === 'under_attack' ? '#442200' : pos.status === 'dying' ? '#440000' : '#222',
              borderLeft: `3px solid ${pos.status === 'under_attack' ? '#ff8800' : pos.status === 'dying' ? '#ff2222' : '#884444'}`,
              fontSize: '0.82em',
              color: '#ff9999',
            }}>
              {pos.status === 'under_attack' && (
                <><strong>Under Attack</strong> — enemy forces engaging</>
              )}
              {pos.status === 'dying' && (
                <><strong>DESTROYED</strong> — unit annihilated by enemy action</>
              )}
              {pos.status === 'eliminated' && (
                <><strong>Eliminated</strong> — unit no longer operational</>
              )}
            </div>
          )}
          {unit.metadata.strength && (
            <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: 2 }}>
              Est. strength: {unit.metadata.strength.toLocaleString()}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export function BattleMap({ battle }: { battle: BattleConfig }) {
  const { currentDate } = useTimeline();
  const { selectedUnitId, selectUnit, hoverUnit, flyTo, clearNavigation, navigateTo } = useMapSelection();
  const { positions, destructionVectors } = useUnitPositions(battle, currentDate);
  const [currentZoom, setCurrentZoom] = useState(battle.defaultZoom ?? 8);

  const onZoomChange = useCallback((z: number) => setCurrentZoom(z), []);

  const visibleUnits = useMemo(() => {
    return battle.units.filter((u) => {
      if (!positions.get(u.id)) return false;
      const minZoom = ZOOM_THRESHOLDS[u.type] ?? 10;
      const maxZoom = ZOOM_CEILINGS[u.type] ?? Infinity;
      return currentZoom >= minZoom && currentZoom <= maxZoom;
    });
  }, [battle.units, positions, currentZoom]);

  const center: [number, number] = battle.defaultCenter ?? DEFAULT_CENTER;
  const zoom = battle.defaultZoom ?? DEFAULT_ZOOM;

  const phaseData = useMemo(() => getActivePhase(battle.phases ?? [], currentDate), [battle.phases, currentDate]);

  const visibleEvents = useMemo(() => {
    const current = currentDate.toISOString().slice(0, 10);
    return battle.events.filter((e) => e.date <= current);
  }, [battle.events, currentDate]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        maxZoom={22}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomWatcher onZoom={onZoomChange} />
        <MapNavigationController target={flyTo} onDone={clearNavigation} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
              maxZoom={22}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='&copy; OpenTopoMap'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxNativeZoom={17}
              maxZoom={22}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={22}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Front line sectors — colored by formation */}
        {phaseData && phaseData.sectors && phaseData.sectors.length > 0 && (
          <>
            {phaseData.sectors.map((sector, i) => (
              <Polyline
                key={`sec-${i}`}
                positions={sector.path}
                pathOptions={{
                  color: sector.color,
                  weight: 3,
                  opacity: 0.9,
                  dashArray: sector.dashArray ?? '',
                }}
              />
            ))}
            {phaseData.sectors.map((sector, i) => {
              const mid = pathMidpoint(sector.path);
              return (
                <Marker
                  key={`seclbl-${i}`}
                  position={mid}
                  icon={createSectorLabel(sector.name, sector.color)}
                  interactive={false}
                />
              );
            })}
          </>
        )}

        {/* Fallback front line (when no sectors defined) */}
        {phaseData && (!phaseData.sectors || phaseData.sectors.length === 0) && phaseData.frontLine && phaseData.frontLine.length > 2 && (
          <Polyline
            positions={phaseData.frontLine}
            pathOptions={{
              color: '#cc6600',
              weight: 2,
              opacity: 0.85,
              dashArray: '6, 2',
            }}
          />
        )}

        {/* Encirclement pocket ring */}
        {phaseData?.pocketRing && phaseData.pocketRing.length > 0 && (
          <Polyline
            positions={phaseData.pocketRing}
            pathOptions={{
              color: '#999999',
              weight: 3,
              opacity: 0.9,
            }}
          />
        )}
        {/* Northern pocket ring (when pocket is split in two) */}
        {phaseData?.pocketNorth && phaseData.pocketNorth.length > 0 && (
          <Polyline
            positions={phaseData.pocketNorth}
            pathOptions={{
              color: '#999999',
              weight: 3,
              opacity: 0.9,
            }}
          />
        )}

        {/* Offensive arrows — inline fragments to avoid array key issues */}
        {phaseData?.arrows && phaseData.arrows.length > 0 && (
          <>
            {phaseData.arrows.map((arrow, i) => (
              <Polyline
                key={i}
                positions={arrow.path}
                pathOptions={{
                  color: arrow.color,
                  weight: 2,
                  opacity: 0.7,
                }}
              />
            ))}
            {phaseData.arrows.map((arrow, i) => {
              const end = arrow.path[arrow.path.length - 1];
              return (
                <Marker
                  key={`ah-${i}`}
                  position={[end[0], end[1]]}
                  icon={createArrowheadIcon(arrow.color)}
                />
              );
            })}
          </>
        )}

        {/* Event markers */}
        {visibleEvents.map((evt) => (
          <Marker
            key={evt.id}
            position={[evt.lat, evt.lng]}
            icon={L.divIcon({
              className: 'event-marker',
              html: `<svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="${evt.type === 'battle' ? '#cc0000' : evt.type === 'encirclement' ? '#ff6600' : evt.type === 'surrender' ? '#9b59b6' : '#333'}" stroke="#fff" stroke-width="1"/></svg>`,
              iconSize: [12, 12],
              iconAnchor: [6, 6],
            })}
          >
            <Popup>
              <div style={{ maxWidth: 240 }}>
                <strong>{evt.title}</strong>
                <div style={{ color: '#666', fontSize: '0.8em' }}>{evt.date}</div>
                <div style={{ fontSize: '0.9em' }}>{evt.description}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Unit markers — status-aware rendering */}
        {visibleUnits.map((unit) => {
          const pos = positions.get(unit.id);
          if (!pos) return null;
          return (
            <UnitMarkerWithAttackEffect
              key={unit.id}
              unit={unit}
              pos={pos}
              isSelected={selectedUnitId === unit.id}
              currentZoom={currentZoom}
              onSelect={(lat, lng) => {
                selectUnit(unit.id);
                navigateTo(lat, lng, currentZoom);
              }}
              onHover={(id) => hoverUnit(id)}
            />
          );
        })}

        {/* Destruction vectors — dashed red lines from enemy to destroyed unit */}
        {destructionVectors.map((dv, i) => (
          <Polyline
            key={`dv-${i}`}
            positions={[[dv.fromLat, dv.fromLng], [dv.toLat, dv.toLng]]}
            pathOptions={{
              color: dv.phase === 'dying' ? '#ff4444' : '#884444',
              weight: dv.phase === 'dying' ? 2 : 1,
              opacity: dv.phase === 'dying' ? 0.7 : 0.35,
              dashArray: dv.phase === 'dying' ? '6, 4' : '4, 6',
            }}
          />
        ))}

        {/* Destruction pulse markers + casualty numbers — expanding rings at destruction sites */}
        {visibleUnits.map((unit) => {
          const pos = positions.get(unit.id);
          if (!pos || pos.status !== 'dying') return null;
          const strength = unit.metadata.strength ?? 0;
          return (
            <React.Fragment key={`destruct-${unit.id}`}>
              <Marker
                key={`pulse-${unit.id}`}
                position={[pos.lat, pos.lng]}
                icon={createDestructionPulseIcon()}
                interactive={false}
              />
              {strength > 0 && (
                <Marker
                  key={`casualty-${unit.id}`}
                  position={[pos.lat, pos.lng]}
                  icon={createCasualtyNumberIcon(strength)}
                  interactive={false}
                />
              )}
            </React.Fragment>
          );
        })}
        {/* Editor mode layers */}
        <EditorMapLayer battle={battle} />
        <HistoricalMapLayer maps={battle.historicalMaps} show={true} />
      </MapContainer>

      {/* Legend overlay — outside MapContainer so Leaflet events don't interfere */}
      <MapLegend />
    </div>
  );
}
