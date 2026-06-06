import { useMemo } from 'react';
import { ImageOverlay } from 'react-leaflet';
import L from 'leaflet';
import type { HistoricalMap } from '../../types/battle';

interface Props {
  maps: HistoricalMap[];
  show: boolean;
}

/** Compute ImageOverlay bounds from GCPs: use extreme lat/lng as bounding box */
function computeBounds(gcps: HistoricalMap['gcps']): L.LatLngBoundsExpression | null {
  if (gcps.length < 2) return null;
  const lats = gcps.map((g) => g.lat);
  const lngs = gcps.map((g) => g.lng);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ] as L.LatLngBoundsExpression;
}

export function HistoricalMapLayer({ maps, show }: Props) {
  const activeMaps = useMemo(() => maps.filter((m) => m.imageUrl), [maps]);

  if (!show || activeMaps.length === 0) return null;

  return (
    <>
      {activeMaps.map((map) => {
        const bounds = computeBounds(map.gcps);
        if (!bounds || !map.imageUrl) return null;
        return (
          <ImageOverlay
            key={map.id}
            url={map.imageUrl}
            bounds={bounds}
            opacity={map.opacity ?? 0.6}
          />
        );
      })}
    </>
  );
}
