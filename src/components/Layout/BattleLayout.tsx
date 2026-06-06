import { useMemo } from 'react';
import type { BattleConfig } from '../../types/battle';
import { BattleMap } from '../BattleMap/BattleMap';
import { TimelineScrubber } from '../Timeline/TimelineScrubber';
import { UnitPanel } from '../UnitPanel/UnitTree';
import { TimelineProvider, useTimeline } from '../../hooks/useTimeline';
import { MapProvider } from '../../hooks/useMapSelection';
import { EditorProvider } from '../../hooks/useEditorMode';
import { EditorToolbar } from '../Editor/EditorToolbar';
import { EditorKeyframePanel } from '../Editor/EditorKeyframePanel';
import { ErrorBoundary } from './ErrorBoundary';

const EDITOR_PARAM = 'edit=true';

function useEditorActive(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.search.includes(EDITOR_PARAM);
  }, []);
}

export function BattleLayout({ battle }: { battle: BattleConfig }) {
  const isEditorActive = useEditorActive();

  return (
    <TimelineProvider battle={battle}>
      <MapProvider>
        <EditorProvider isActive={isEditorActive}>
          <BattleLayoutInner battle={battle} isEditorActive={isEditorActive} />
        </EditorProvider>
      </MapProvider>
    </TimelineProvider>
  );
}

function formatLosses(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function BattleLayoutInner({ battle, isEditorActive }: { battle: BattleConfig; isEditorActive: boolean }) {
  const { currentDate } = useTimeline();

  const cumulativeLosses = useMemo(() => {
    const today = currentDate.toISOString().slice(0, 10);
    let total = 0;
    for (const unit of battle.units) {
      if (!unit.departureDate) continue;
      if (unit.departureDate <= today) {
        total += unit.metadata.strength ?? 0;
      }
    }
    return total;
  }, [battle.units, currentDate]);

  return (
    <ErrorBoundary>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          background: isEditorActive ? '#1a0a0a' : '#0a0a1a',
          color: '#fff',
          padding: '8px 16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{battle.name}</div>
          {isEditorActive && (
            <span style={{ fontSize: '0.75em', padding: '2px 8px', background: '#ff4444', color: '#fff', borderRadius: 4 }}>
              EDITING
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* ─── Cumulative Losses Counter ─── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: cumulativeLosses > 0 ? 'rgba(180, 30, 30, 0.25)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cumulativeLosses > 0 ? 'rgba(220, 60, 60, 0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6,
              transition: 'background 0.5s, border-color 0.5s',
            }}
            title="Cumulative manpower from destroyed/encircled units"
          >
            <span style={{ fontSize: '0.85em', opacity: 0.6 }}>☠</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.95em',
                color: cumulativeLosses > 0 ? '#ff6666' : '#666',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.5s',
                minWidth: cumulativeLosses > 0 ? 'auto' : '3ch',
              }}
            >
              {cumulativeLosses > 0 ? formatLosses(cumulativeLosses) : '—'}
            </span>
            <span style={{ fontSize: '0.7em', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Losses</span>
          </div>
          {isEditorActive && (
            <a href="?" style={{ fontSize: '0.8em', color: '#ff7f7f', textDecoration: 'none', padding: '2px 8px', border: '1px solid #ff4444', borderRadius: 4 }}>
              Exit Editor
            </a>
          )}
          <div style={{ fontSize: '0.8em', color: '#888', whiteSpace: 'nowrap' }}>
            {battle.dateRange.start} — {battle.dateRange.end}
          </div>
        </div>
      </div>

      {/* Middle: sidebar + map */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <UnitPanel battle={battle} />
        <div style={{ flex: 1, position: 'relative' }}>
          <BattleMap battle={battle} />
          {/* Editor overlays (positioned above the map) */}
          {isEditorActive && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999 }}>
              <div style={{ pointerEvents: 'auto' }}>
                <EditorToolbar battle={battle} />
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'auto' }}>
                <EditorKeyframePanel battle={battle} keyframes={battle.keyframes} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: timeline */}
      <div style={{ zIndex: 10 }}>
        <TimelineScrubber events={battle.events} />
      </div>
    </div>
    </ErrorBoundary>
  );
}
