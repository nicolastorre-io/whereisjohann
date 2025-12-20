import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';

export function useFitBounds(positions: LatLngTuple[]) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 8 });
    }
  }, [positions, map]);
}
