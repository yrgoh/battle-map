import { useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEditorMode } from '../../hooks/useEditorMode';
import { useMapSelection } from '../../hooks/useMapSelection';
import { useTimeline } from '../../hooks/useTimeline';
import { saveKeyframe } from '../../lib/editorApi';
import type { BattleConfig } from '../../types/battle';

interface Props {
  battle: BattleConfig;
}

export function EditorMapLayer({ battle }: Props) {
  const map = useMap();
  const { isActive, activeTool, selectedUnitId, selectEditorUnit, setTool } = useEditorMode();
  const { selectUnit } = useMapSelection();
  const { currentDate } = useTimeline();

  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    if (activeTool !== 'place-unit') return;
    const uid = selectedUnitId;
    if (!uid) return;
    const dateStr = currentDate.toISOString().slice(0, 10);
    const { lat, lng } = e.latlng;

    try {
      await saveKeyframe(battle.id, {
        unitId: uid,
        date: dateStr,
        lat,
        lng,
        confidence: 'medium',
        sourceMapId: null,
      });
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'temp-placement-marker',
          html: `<div style="background:#ffdd00;width:10px;height:10px;border-radius:50%;border:2px solid #fff;opacity:0.8"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        }),
      }).addTo(map);
      setTimeout(() => map.removeLayer(marker), 2000);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }, [activeTool, selectedUnitId, currentDate, battle.id, map]);

  useEffect(() => {
    if (!isActive) return;
    if (activeTool === 'place-unit') {
      map.on('click', handleMapClick);
      map.getContainer().style.cursor = 'crosshair';
    } else if (activeTool === 'select') {
      map.getContainer().style.cursor = 'default';
    } else {
      map.getContainer().style.cursor = 'grab';
    }

    return () => {
      map.off('click', handleMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, isActive, activeTool, handleMapClick]);

  // Register keyboard shortcuts for tool switching
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      const keyMap: Record<string, () => void> = {
        v: () => setTool('select'), V: () => setTool('select'),
        p: () => setTool('place-unit'), P: () => setTool('place-unit'),
        m: () => setTool('move-unit'), M: () => setTool('move-unit'),
        e: () => setTool('add-event'), E: () => setTool('add-event'),
      };
      const action = keyMap[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, setTool]);

  return null;
}
