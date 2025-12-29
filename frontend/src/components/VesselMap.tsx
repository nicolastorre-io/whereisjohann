import { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Position } from 'shared';
import MapController from './MapController';
import VesselMarker from './VesselMarker';

interface VesselMapProps {
  positions: Position[];
}

export default function VesselMap({ positions }: Readonly<VesselMapProps>) {
  const coords = useMemo<LatLngTuple[]>(
    () => positions.map((p) => [p.latitude, p.longitude]),
    [positions]
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController positions={coords} />

        <Polyline
          positions={coords}
          color="#00b4d8"
          weight={3}
          opacity={0.7}
          dashArray="10, 5"
        />

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
