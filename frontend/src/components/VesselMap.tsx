import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Position } from 'shared';
import { formatDate } from '../utils/date';
import { useFitBounds } from '../hooks/useFitBounds';

function MapController({ positions }: { positions: LatLngTuple[] }) {
  useFitBounds(positions);
  return null;
}

const shipIcon = new L.DivIcon({
  className: 'ship-marker',
  html: `<div style="
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #00b4d8, #0077b6);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const currentIcon = new L.DivIcon({
  className: 'current-marker',
  html: `<div style="
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #ff6b35, #ff4444);
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 4px 15px rgba(255,107,53,0.5);
    animation: pulse 2s infinite;
  "></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface VesselMapProps {
  positions: Position[];
}

export default function VesselMap({ positions }: Readonly<VesselMapProps>) {
  const coords: LatLngTuple[] = positions.map((p) => [p.latitude, p.longitude]);
  const lastPosition = positions[positions.length - 1];

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

        {positions.map((pos, index) => {
          const isLast = index === positions.length - 1;
          const isFirst = index === 0;

          return (
            <Marker
              key={index}
              position={[pos.latitude, pos.longitude]}
              icon={isLast ? currentIcon : shipIcon}
            >
              <Popup>
                <div className="popup-title">
                  {isLast ? 'Current Position' : isFirst ? 'Start Position' : `Position #${index + 1}`}
                </div>
                <div className="popup-row">
                  <span className="label">Latitude</span>
                  <span className="value">{pos.latitude.toFixed(5)}°</span>
                </div>
                <div className="popup-row">
                  <span className="label">Longitude</span>
                  <span className="value">{pos.longitude.toFixed(5)}°</span>
                </div>
                <div className="popup-row">
                  <span className="label">Time</span>
                  <span className="value">{formatDate(pos.time)}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
