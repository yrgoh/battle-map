import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

export type EditorTool = 'select' | 'place-unit' | 'move-unit' | 'georeference' | 'add-event';

interface EditorState {
  isActive: boolean;
  activeTool: EditorTool;
  selectedUnitId: string | null;
  showKeyframes: boolean;
  showMaps: boolean;
}

interface EditorActions {
  setTool: (tool: EditorTool) => void;
  selectEditorUnit: (id: string | null) => void;
  toggleKeyframes: () => void;
  toggleMaps: () => void;
  reset: () => void;
}

const EditorContext = createContext<(EditorState & EditorActions) | null>(null);

export function EditorProvider({
  children,
  isActive,
  battleId,
}: {
  children: React.ReactNode;
  isActive: boolean;
  battleId?: string;
}) {
  const [activeTool, setTool] = useState<EditorTool>('select');
  const [selectedUnitId, selectEditorUnit] = useState<string | null>(null);
  const [showKeyframes, setShowKeyframes] = useState(true);
  const [showMaps, setShowMaps] = useState(false);

  const toggleKeyframes = useCallback(() => setShowKeyframes((s) => !s), []);
  const toggleMaps = useCallback(() => setShowMaps((s) => !s), []);

  // Reset editor state when battleId changes
  useEffect(() => {
    setTool('select');
    selectEditorUnit(null);
  }, [battleId]);

  const reset = useCallback(() => {
    setTool('select');
    selectEditorUnit(null);
  }, []);

  const value = useMemo(
    () => ({
      isActive,
      activeTool,
      selectedUnitId,
      showKeyframes,
      showMaps,
      setTool,
      selectEditorUnit,
      toggleKeyframes,
      toggleMaps,
      reset,
    }),
    [isActive, activeTool, selectedUnitId, showKeyframes, showMaps, setTool, selectEditorUnit, toggleKeyframes, toggleMaps, reset]
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorMode() {
  const ctx = useContext(EditorContext);
  return ctx ?? {
    isActive: false,
    activeTool: 'select' as EditorTool,
    selectedUnitId: null,
    showKeyframes: false,
    showMaps: false,
    setTool: () => {},
    selectEditorUnit: () => {},
    toggleKeyframes: () => {},
    toggleMaps: () => {},
    reset: () => {},
  };
}
