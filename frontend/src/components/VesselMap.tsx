import { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { IPosition } from 'shared';
import MapController from './MapController';
import VesselMarker from './VesselMarker';

interface VesselMapProps {
  positions: IPosition[];
}

// --- NEW: split polyline when crossing the dateline ---
function splitAtDateLine(coords: LatLngTuple[]): LatLngTuple[][] {
  if (coords.length < 2) return [coords];

  const segments: LatLngTuple[][] = [[coords[0]]];

  for (let i = 1; i < coords.length; i++) {
    const [lat, lng] = coords[i];
    const [, prevLng] = coords[i - 1];

    if (Math.abs(lng - prevLng) > 180) {
      // dateline crossed → start new segment
      segments.push([[lat, lng]]);
    } else {
      segments[segments.length - 1].push([lat, lng]);
    }
  }

  return segments;
}

export default function VesselMap({ positions }: Readonly<VesselMapProps>) {
  const coords = useMemo<LatLngTuple[]>(
    () => positions.map((p) => [p.latitude, p.longitude]),
    [positions]
  );

  const polylineSegments = useMemo(
    () => splitAtDateLine(coords),
    [coords]
  );

  const lastPosition = useMemo(() => positions.at(-1)!, [positions]);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[lastPosition.latitude, lastPosition.longitude]}
        zoom={6}
        className="map-container"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController positions={coords} />

        {/* --- UPDATED: render multiple polyline segments --- */}
        {polylineSegments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment}
            color="#00b4d8"
            weight={3}
            opacity={0.7}
            dashArray="10, 5"
          />
        ))}

        {positions.map((pos, index) => (
          <VesselMarker
            key={pos.id}
            position={pos}
            index={index}
            isFirst={index === 0}
            isLast={index === positions.length - 1}
          />
        ))}
      </MapContainer>
    </div>
  );
}
