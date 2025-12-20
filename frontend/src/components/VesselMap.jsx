import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const shipIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function VesselMap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('./position.json')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div className="loading">Loading...</div>;
  if (!data.positions || data.positions.length === 0) {
    return <div className="no-data">No positions recorded yet</div>;
  }

  const positions = data.positions.map((p) => [p.latitude, p.longitude]);
  const lastPosition = positions[positions.length - 1];

  return (
    <div className="map-container">
      <h1>{data.vessel}</h1>
      <p>{data.positions.length} positions recorded</p>
      <MapContainer
        center={lastPosition}
        zoom={6}
        style={{ height: '70vh', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="blue" weight={2} />
        {data.positions.map((pos, index) => (
          <Marker
            key={index}
            position={[pos.latitude, pos.longitude]}
            icon={shipIcon}
          >
            <Popup>
              <strong>{index === data.positions.length - 1 ? 'Current' : `#${index + 1}`}</strong>
              <br />
              Lat: {pos.latitude.toFixed(5)}
              <br />
              Lon: {pos.longitude.toFixed(5)}
              <br />
              Time: {pos.time}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
