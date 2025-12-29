import type { LatLngTuple } from 'leaflet';
import { useFitBounds } from '../hooks/useFitBounds';

interface MapControllerProps {
  positions: LatLngTuple[];
}

export default function MapController({ positions }: MapControllerProps) {
  useFitBounds(positions);
  return null;
}
