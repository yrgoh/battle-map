import { useMemo, useState } from 'react';
import type { BattleConfig, PositionKeyframe, Unit } from '../../types/battle';
import { useMapSelection } from '../../hooks/useMapSelection';
import { deleteKeyframe } from '../../lib/editorApi';

interface Props {
  battle: BattleConfig;
  keyframes: PositionKeyframe[];
}

export function EditorKeyframePanel({ battle, keyframes }: Props) {
  const { selectedUnitId } = useMapSelection();
  const [filterUnit, setFilterUnit] = useState<string | null>(null);

  const effectiveFilter = filterUnit ?? selectedUnitId;

  const unitKeyframes = useMemo(() => {
    if (!effectiveFilter) return [];
    return keyframes
      .filter((k) => k.unitId === effectiveFilter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [keyframes, effectiveFilter]);

  const units = useMemo(() => {
    return battle.units.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [battle.units]);

  const handleDelete = async (kf: PositionKeyframe) => {
    if (!confirm(`Delete keyframe for ${kf.unitId} on ${kf.date}?`)) return;
    try {
      await deleteKeyframe(battle.id, kf.unitId, kf.date);
      alert('Deleted. Refresh to see changes.');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '8px 12px', borderTop: '1px solid #333', background: '#0f0f23', color: '#ccc', fontSize: '0.8em', maxHeight: 250, overflowY: 'auto' }}>
      <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#7fdbff' }}>Keyframe Editor</div>

      <select
        value={effectiveFilter ?? ''}
        onChange={(e) => setFilterUnit(e.target.value || null)}
        style={{ width: '100%', padding: 4, marginBottom: 6, background: '#1a1a3e', color: '#fff', border: '1px solid #444', borderRadius: 3, fontSize: '0.85em' }}
      >
        <option value="">-- Select unit --</option>
        {units.map((u) => (
          <option key={u.id} value={u.id}>{u.shortName ?? u.name} ({u.id})</option>
        ))}
      </select>

      {unitKeyframes.length === 0 ? (
        <div style={{ color: '#666', fontSize: '0.8em' }}>No keyframes for this unit.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {unitKeyframes.map((kf) => (
            <div key={`${kf.unitId}-${kf.date}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '3px 6px', background: '#1a1a2e', borderRadius: 3,
            }}>
              <span>
                <strong>{kf.date}</strong> — {kf.lat.toFixed(2)}, {kf.lng.toFixed(2)}
                <span style={{ color: '#888', fontSize: '0.85em', marginLeft: 4 }}>
                  ({kf.confidence})
                </span>
              </span>
              <button
                onClick={() => handleDelete(kf)}
                style={{
                  background: 'none', border: 'none', color: '#e74c3c',
                  cursor: 'pointer', fontSize: '0.9em', padding: '0 4px',
                }}
                title="Delete keyframe"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
