import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '../../store/battleStore';
import { THEATRE_COLORS } from '../../data/globalEvents';

// Default centers for common theatres
const THEATRE_CENTERS: Record<string, [number, number]> = {
  eastern_front: [51, 35],
  western_front: [49, 2],
  pacific: [15, 150],
  north_africa: [30, 20],
  mediterranean: [40, 15],
};

function createBattleMarker(isCurrent: boolean, theatre: string): L.DivIcon {
  const color = THEATRE_COLORS[theatre] ?? '#666';
  const size = isCurrent ? 14 : 10;
  const strokeColor = isCurrent ? '#fff' : 'rgba(0,0,0,0.3)';
  const strokeW = isCurrent ? '2' : '1';
  return L.divIcon({
    className: 'context-battle-marker',
    html: '<svg width="' + size + '" height="' + size + '">' +
      '<circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + (size / 2 - 1) + '"' +
      ' fill="' + color + '" stroke="' + strokeColor + '"' +
      ' stroke-width="' + strokeW + '" />' +
      '</svg>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function ContextMap() {
  const navigate = useNavigate();
  const battleList = useBattleStore((s) => s.battleList);
  const currentBattleId = useBattleStore((s) => s.currentBattleId);

  return (
    <div style={{ height: 180, width: '100%', borderTop: '1px solid #333' }}>
      <MapContainer
        center={[30, 20]}
        zoom={2}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%', background: '#0d0d1f' }}
        dragging={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={6}
        />
        {battleList.map((battle) => {
          // Use theatre center as approximate position for context map
          const center = THEATRE_CENTERS[battle.theatre] ?? [48, 44];
          // Slight offset per battle to avoid overlap
          const idx = battleList.indexOf(battle);
          const offset = (idx % 3) * 1.5 - 1.5;
          return (
            <Marker
              key={battle.id}
              position={[center[0] + offset * 0.5, center[1] + offset * 0.7]}
              icon={createBattleMarker(battle.id === currentBattleId, battle.theatre)}
              eventHandlers={{
                click: () => navigate(`/battle/${battle.id}`),
              }}
            >
              <Popup>
                <div style={{ fontSize: '0.85em' }}>
                  <strong>{battle.name}</strong>
                  <br />
                  {battle.dateStart} — {battle.dateEnd}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
