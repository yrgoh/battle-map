import { useState } from 'react';

interface LegendEntry {
  label: string;
  color: string;
  textColor?: string;
  symbol?: string;
}

const LEGEND_DATA: LegendEntry[] = [
  // Soviet formations
  { label: 'Soviet Army Group (Front)', color: '#cc0000', textColor: '#fff', symbol: 'XXXXX' },
  { label: 'Soviet Army / Tank', color: '#cc0000', textColor: '#fff', symbol: 'XXXX' },
  { label: 'Soviet Corps', color: '#cc0000', textColor: '#fff', symbol: 'XXX' },
  { label: 'Soviet Division / Regt', color: '#cc0000', textColor: '#fff', symbol: 'XX' },
  // German formations
  { label: 'German Army Group', color: '#d0d0d0', textColor: '#000', symbol: 'XXXXX' },
  { label: 'German Army', color: '#d0d0d0', textColor: '#000', symbol: 'XXXX' },
  { label: 'German Panzer Corps', color: '#d0d0d0', textColor: '#000', symbol: 'XXX' },
  { label: 'German Infantry Div', color: '#d0d0d0', textColor: '#000', symbol: 'XX' },
  // Axis allies
  { label: 'Romanian (3rd & 4th)', color: '#b0a090', textColor: '#000', symbol: 'XXXX' },
  { label: 'Italian 8th Army', color: '#7a8a60', textColor: '#fff', symbol: 'XXXX' },
  { label: 'Hungarian 2nd Army', color: '#789a9a', textColor: '#fff', symbol: 'XXXX' },
  // Map features
  { label: 'Soviet offensive', color: '#cc0000', symbol: 'Arrow' },
  { label: 'Axis advance', color: '#68798a', symbol: 'Arrow' },
  { label: 'Front line / sector', color: '#cc6600', symbol: 'Line' },
  { label: 'Encirclement pocket', color: '#999', symbol: 'Ring' },
];

export function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 500,
        background: 'rgba(255,255,255,0.94)',
        border: '1px solid #ccc',
        borderRadius: 6,
        padding: collapsed ? '6px 10px' : '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        fontSize: '0.8rem',
        fontFamily: 'Arial, sans-serif',
        maxWidth: collapsed ? 'auto' : 240,
        userSelect: 'none',
      }}
    >
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: collapsed ? 0 : 8,
          color: '#333',
          padding: collapsed ? 0 : '0 0 4px 0',
        }}
        title={collapsed ? 'Click to expand legend' : 'Click to collapse legend'}
      >
        <span>{collapsed ? '▼ Legend' : '▲ Legend'}</span>
        {collapsed && <span style={{ fontSize: '0.7em', color: '#888', marginLeft: 8 }}>show</span>}
      </div>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {LEGEND_DATA.map((entry) => (
            <div key={entry.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {entry.symbol === 'Arrow' ? (
                <svg width="22" height="10" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="16" y2="5" stroke={entry.color} strokeWidth="2" />
                  <polygon points="16,2 16,8 22,5" fill={entry.color} />
                </svg>
              ) : entry.symbol === 'Line' ? (
                <svg width="22" height="10" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="22" y2="5" stroke={entry.color} strokeWidth="2" strokeDasharray="6,2" />
                </svg>
              ) : entry.symbol === 'Ring' ? (
                <svg width="22" height="10" style={{ flexShrink: 0 }}>
                  <ellipse cx="11" cy="5" rx="10" ry="4" fill="none" stroke={entry.color} strokeWidth="2" />
                </svg>
              ) : (
                <div
                  style={{
                    width: 30,
                    height: 18,
                    background: entry.color,
                    border: `1px solid ${entry.textColor === '#fff' ? '#600' : '#888'}`,
                    color: entry.textColor ?? '#000',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    borderRadius: 2,
                  }}
                >
                  {entry.symbol}
                </div>
              )}
              <span style={{ color: '#333', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{entry.label}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #ddd', marginTop: 6, paddingTop: 6, fontSize: '0.7em', color: '#666' }}>
            Echelon: XXXXX=Army Group / XXXX=Army / XXX=Corps / XX=Division / X=Regiment / III=Battalion
          </div>
        </div>
      )}
    </div>
  );
}
