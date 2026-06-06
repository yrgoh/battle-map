import { useEditorMode, type EditorTool } from '../../hooks/useEditorMode';
import { exportBattle, saveKeyframe, seedBattle } from '../../lib/editorApi';
import { useTimeline } from '../../hooks/useTimeline';
import { useMapSelection } from '../../hooks/useMapSelection';
import type { BattleConfig } from '../../types/battle';

interface EditorToolbarProps {
  battle: BattleConfig;
}

const TOOLS: Array<{ id: EditorTool; label: string; shortcut: string }> = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'place-unit', label: 'Place Unit', shortcut: 'P' },
  { id: 'move-unit', label: 'Move Unit', shortcut: 'M' },
  { id: 'add-event', label: 'Add Event', shortcut: 'E' },
];

export function EditorToolbar({ battle }: EditorToolbarProps) {
  const { activeTool, setTool, showKeyframes, toggleKeyframes, showMaps, toggleMaps, selectedUnitId, selectEditorUnit } = useEditorMode();
  const { currentDate } = useTimeline();
  const { selectedUnitId: mapSelectedId } = useMapSelection();

  const effectiveUnitId = selectedUnitId ?? mapSelectedId;

  const handlePlaceKeyframe = async () => {
    if (!effectiveUnitId) {
      alert('Select a unit from the ORBAT tree first');
      return;
    }
    // Save a keyframe at current time for the selected unit
    // Default position: will be overridden by map click in place-unit mode
    const dateStr = currentDate.toISOString().slice(0, 10);
    try {
      await saveKeyframe(battle.id, {
        unitId: effectiveUnitId,
        date: dateStr,
        lat: 48.71,
        lng: 44.51,
        confidence: 'medium',
        sourceMapId: null,
      });
      alert(`Keyframe saved for ${effectiveUnitId} on ${dateStr}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportBattle(battle.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${battle.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleSeed = async () => {
    try {
      await seedBattle();
      alert('Database seeded. Restart to reload.');
    } catch (err: any) {
      alert(`Seed error: ${err.message}`);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 10, left: 10, zIndex: 1000,
      background: '#0a0a2e', border: '1px solid #444', borderRadius: 6,
      padding: '8px 12px', color: '#fff', fontSize: '0.85em',
      boxShadow: '0 2px 12px rgba(0,0,0,0.5)', minWidth: 200,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: '0.9em', color: '#ffdd00' }}>
        EDITOR MODE
      </div>

      {/* Tool buttons */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            style={{
              padding: '4px 10px', borderRadius: 4, border: '1px solid #555',
              background: activeTool === t.id ? '#2a5a9a' : '#1a1a3e',
              color: '#fff', cursor: 'pointer', fontSize: '0.8em',
            }}
          >
            {t.label} <span style={{ opacity: 0.5, fontSize: '0.75em' }}>({t.shortcut})</span>
          </button>
        ))}
      </div>

      {/* Unit selection info */}
      <div style={{ marginBottom: 8, fontSize: '0.8em', color: '#aaa' }}>
        Selected unit: <span style={{ color: effectiveUnitId ? '#7fdbff' : '#ff7f7f' }}>
          {effectiveUnitId ?? 'none'}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={handlePlaceKeyframe} disabled={!effectiveUnitId}
          style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid #2a8a2a',
            background: '#1a4a1a', color: '#8f8', cursor: effectiveUnitId ? 'pointer' : 'default',
            fontSize: '0.8em', opacity: effectiveUnitId ? 1 : 0.5,
          }}>
          Save Keyframe ({currentDate.toISOString().slice(0, 10)})
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.8em' }}>
            <input type="checkbox" checked={showKeyframes} onChange={toggleKeyframes} />
            Keyframes
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.8em' }}>
            <input type="checkbox" checked={showMaps} onChange={toggleMaps} />
            Maps
          </label>
        </div>

        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button onClick={handleExport} style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid #555',
            background: '#333', color: '#fff', cursor: 'pointer', fontSize: '0.8em',
          }}>
            Export JSON
          </button>
          <button onClick={handleSeed} style={{
            padding: '4px 10px', borderRadius: 4, border: '1px solid #555',
            background: '#3a2a1a', color: '#da8', cursor: 'pointer', fontSize: '0.8em',
          }}>
            Seed DB
          </button>
        </div>
      </div>

      {activeTool === 'place-unit' && (
        <div style={{ marginTop: 8, padding: 6, background: '#1a2a1a', borderRadius: 4, fontSize: '0.75em', color: '#8a8' }}>
          Click on the map to place the selected unit at the current date.
        </div>
      )}
    </div>
  );
}
