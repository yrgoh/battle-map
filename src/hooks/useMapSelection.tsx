import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

export interface FlyToTarget {
  lat: number;
  lng: number;
  zoom: number;
}

interface MapState {
  selectedUnitId: string | null;
  hoveredUnitId: string | null;
  flyTo: FlyToTarget | null;
}

interface MapActions {
  selectUnit: (id: string | null) => void;
  hoverUnit: (id: string | null) => void;
  navigateTo: (lat: number, lng: number, zoom: number) => void;
  clearNavigation: () => void;
  resetSelection: () => void;
}

const MapContext = createContext<(MapState & MapActions) | null>(null);

export function MapProvider({
  children,
  battleId,
}: {
  children: React.ReactNode;
  battleId?: string;
}) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<FlyToTarget | null>(null);

  // Reset selection state when battleId changes
  useEffect(() => {
    setSelectedUnitId(null);
    setHoveredUnitId(null);
    setFlyTo(null);
  }, [battleId]);

  const navigateTo = useCallback((lat: number, lng: number, zoom: number) => {
    setFlyTo({ lat, lng, zoom });
  }, []);

  const clearNavigation = useCallback(() => {
    setFlyTo(null);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedUnitId(null);
    setHoveredUnitId(null);
    setFlyTo(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedUnitId,
      hoveredUnitId,
      flyTo,
      selectUnit: setSelectedUnitId,
      hoverUnit: setHoveredUnitId,
      navigateTo,
      clearNavigation,
      resetSelection,
    }),
    [selectedUnitId, hoveredUnitId, flyTo, navigateTo, clearNavigation, resetSelection]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapSelection() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapSelection must be used within MapProvider');
  return ctx;
}
