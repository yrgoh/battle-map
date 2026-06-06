import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '../../store/battleStore';
import { THEATRE_COLORS, THEATRE_LABELS } from '../../data/globalEvents';

export function TheatreSelector() {
  const navigate = useNavigate();
  const battleList = useBattleStore((s) => s.battleList);
  const loadBattleList = useBattleStore((s) => s.loadBattleList);
  const currentBattleId = useBattleStore((s) => s.currentBattleId);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBattleList();
  }, [loadBattleList]);

  const filtered = useMemo(() => {
    if (!search.trim()) return battleList;
    const q = search.toLowerCase();
    return battleList.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.theatre.toLowerCase().includes(q),
    );
  }, [battleList, search]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
    [filtered],
  );

  if (battleList.length === 0) {
    return (
      <div style={{ padding: 16, color: '#888', fontSize: '0.85em' }}>
        No battles loaded. Ensure the server is running.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, background: '#111122', borderRight: '1px solid #333', height: '100%', overflowY: 'auto', minWidth: 240 }}>
      <h3 style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#ccc', margin: '0 0 8px' }}>Battles</h3>
      <input
        type="text"
        placeholder="Search battles..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '4px 8px',
          background: '#1a1a2e',
          border: '1px solid #444',
          borderRadius: 4,
          color: '#ccc',
          fontSize: '0.8em',
          marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((battle) => (
          <button
            key={battle.id}
            onClick={() => navigate(`/battle/${battle.id}`)}
            style={{
              textAlign: 'left',
              padding: '6px 8px',
              background: currentBattleId === battle.id ? '#222244' : 'transparent',
              border: currentBattleId === battle.id ? '1px solid #4444aa' : '1px solid transparent',
              borderRadius: 4,
              color: currentBattleId === battle.id ? '#fff' : '#aaa',
              cursor: 'pointer',
              fontSize: '0.82em',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: THEATRE_COLORS[battle.theatre] ?? '#666',
                  flexShrink: 0,
                }}
              />
              <span>{battle.name}</span>
            </div>
            <div style={{ fontSize: '0.75em', color: '#666', marginTop: 2, marginLeft: 14 }}>
              {battle.dateStart} — {battle.dateEnd}
              <span style={{ marginLeft: 6 }}>
                {THEATRE_LABELS[battle.theatre] ?? battle.theatre}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
