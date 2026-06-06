import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '../../store/battleStore';
import { GLOBAL_EVENTS, THEATRE_COLORS } from '../../data/globalEvents';

const TIMELINE_START = '1939-09-01';
const TIMELINE_END = '1945-09-02';
const START_MS = new Date(TIMELINE_START).getTime();
const END_MS = new Date(TIMELINE_END).getTime();
const TOTAL_MS = END_MS - START_MS;

function dateToPercent(dateStr: string): number {
  const ms = new Date(dateStr).getTime();
  return Math.max(0, Math.min(100, ((ms - START_MS) / TOTAL_MS) * 100));
}

export function ReferenceTimeline() {
  const navigate = useNavigate();
  const battleList = useBattleStore((s) => s.battleList);
  const currentBattleId = useBattleStore((s) => s.currentBattleId);

  const currentBattle = useMemo(
    () => battleList.find((b) => b.id === currentBattleId),
    [battleList, currentBattleId],
  );

  return (
    <div style={{ padding: '8px 16px', background: '#0d0d1f', borderTop: '1px solid #333', fontSize: '0.75em' }}>
      <div style={{ color: '#888', marginBottom: 4, fontWeight: 'bold' }}>WWII Timeline</div>
      <div style={{ position: 'relative', height: 24, background: '#1a1a2e', borderRadius: 3, overflow: 'visible' }}>
        {/* Year markers */}
        {['1939', '1940', '1941', '1942', '1943', '1944', '1945'].map((year) => (
          <div
            key={year}
            style={{
              position: 'absolute',
              left: `${dateToPercent(`${year}-01-01`)}%`,
              top: -2,
              fontSize: '0.7em',
              color: '#555',
              transform: 'translateX(-50%)',
            }}
          >
            {year}
          </div>
        ))}

        {/* Global events (small dots) */}
        {GLOBAL_EVENTS.map((evt) => (
          <div
            key={evt.date}
            title={`${evt.date}: ${evt.title}`}
            style={{
              position: 'absolute',
              left: `${dateToPercent(evt.date)}%`,
              top: 10,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: evt.theatre ? (THEATRE_COLORS[evt.theatre] ?? '#666') : '#666',
              transform: 'translateX(-50%)',
              cursor: 'default',
            }}
          />
        ))}

        {/* Battle markers */}
        {battleList.map((battle) => {
          const startPct = dateToPercent(battle.dateStart);
          const endPct = dateToPercent(battle.dateEnd);
          const isCurrent = battle.id === currentBattleId;
          return (
            <div
              key={battle.id}
              title={`${battle.name} (${battle.dateStart} — ${battle.dateEnd})`}
              onClick={() => navigate(`/battle/${battle.id}`)}
              style={{
                position: 'absolute',
                left: `${startPct}%`,
                width: `${Math.max(0.3, endPct - startPct)}%`,
                top: 6,
                height: 12,
                borderRadius: 2,
                background: isCurrent ? '#fff' : THEATRE_COLORS[battle.theatre] ?? '#666',
                opacity: isCurrent ? 1 : 0.5,
                cursor: 'pointer',
                minWidth: 2,
              }}
            />
          );
        })}
      </div>
      {/* Current battle highlight */}
      {currentBattle && (
        <div style={{ color: '#aaa', marginTop: 4, fontSize: '0.85em' }}>
          <span style={{ color: THEATRE_COLORS[currentBattle.theatre] ?? '#fff' }}>&#9679; </span>
          {currentBattle.name} ({currentBattle.dateStart} — {currentBattle.dateEnd})
        </div>
      )}
    </div>
  );
}
