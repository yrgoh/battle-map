import React from 'react';
import { useTimeline } from '../../hooks/useTimeline';
import { useMapSelection } from '../../hooks/useMapSelection';
import type { CampaignEvent } from '../../types/battle';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / 86400000);
}

function getEventZoom(evt: CampaignEvent): number {
  switch (evt.type) {
    case 'encirclement': return 10;
    case 'battle': return 12;
    case 'surrender': return 14;
    case 'airdrop': return 12;
    case 'relief': return 10;
    case 'movement': return 8;
    default: return 10;
  }
}

export function TimelineScrubber({ events }: { events: CampaignEvent[] }) {
  const { currentDate, isPlaying, speed, minDate, maxDate, setDate, togglePlay, setSpeed } = useTimeline();
  const { navigateTo } = useMapSelection();

  const totalDays = daysBetween(minDate, maxDate);
  const currentDay = daysBetween(minDate, currentDate);
  const progress = totalDays > 0 ? (currentDay / totalDays) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pct = parseFloat(e.target.value);
    const targetMs = minDate.getTime() + (pct / 100) * (maxDate.getTime() - minDate.getTime());
    setDate(new Date(targetMs));
  };

  const speedOptions = [0.5, 1, 2, 5, 10];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#1a1a2e', color: '#fff' }}>
      <button
        onClick={togglePlay}
        style={{
          background: isPlaying ? '#e74c3c' : '#2ecc71',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          padding: '6px 12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          minWidth: 60,
        }}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <div style={{ fontSize: '0.85em', minWidth: 60 }}>Speed:</div>
      <select
        value={speed}
        onChange={(e) => setSpeed(parseFloat(e.target.value))}
        style={{ background: '#16213e', color: '#fff', border: '1px solid #0f3460', borderRadius: 4, padding: 4 }}
      >
        {speedOptions.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      <div style={{ fontFamily: 'monospace', fontSize: '1.1em', minWidth: 140, textAlign: 'center' }}>
        {formatDate(currentDate)}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={progress}
          onChange={handleSliderChange}
          style={{ width: '100%', cursor: 'pointer' }}
        />
        {/* Event tick marks */}
        <div style={{ position: 'relative', height: 12, marginTop: -4 }}>
          {events.map((evt) => {
            const evtDay = daysBetween(minDate, new Date(evt.date + 'T00:00:00'));
            const evtPct = totalDays > 0 ? (evtDay / totalDays) * 100 : 0;
            return (
              <div
                key={evt.id}
                title={`${evt.title} (${evt.date}) — click to navigate`}
                onClick={() => {
                  setDate(new Date(evt.date + 'T00:00:00'));
                  navigateTo(evt.lat, evt.lng, getEventZoom(evt));
                }}
                style={{
                  position: 'absolute',
                  left: `${evtPct}%`,
                  top: 0,
                  width: 8,
                  height: 8,
                  background: evt.type === 'battle' ? '#e74c3c' : evt.type === 'encirclement' ? '#f39c12' : evt.type === 'surrender' ? '#9b59b6' : '#3498db',
                  borderRadius: '50%',
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  border: '1px solid #fff',
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: '0.75em', color: '#aaa', minWidth: 80, textAlign: 'right' }}>
        Day {currentDay} / {totalDays}
      </div>
    </div>
  );
}
