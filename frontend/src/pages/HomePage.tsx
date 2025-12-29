import { useEffect, useState } from 'react';
import Header from '../components/Header';
import StatsBar from '../components/StatsBar';
import VesselMap from '../components/VesselMap';
import type { VesselData } from 'shared';
import { formatDate } from '../utils/date';

export default function HomePage() {
  const [data, setData] = useState<VesselData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('./position.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <div className="error">Error loading data: {error}</div>;
  if (!data) return <div className="loading">Loading vessel data...</div>;
  if (!data.positions || data.positions.length === 0) {
    return <div className="no-data">No positions recorded yet. Waiting for vessel data...</div>;
  }

  const lastPosition = data.positions[data.positions.length - 1];

  return (
    <>
      <Header mmsi={data.mmsi} />
      <StatsBar
        positionsCount={data.positions.length}
        lastPosition={lastPosition}
        mmsi={data.mmsi}
      />
      <VesselMap positions={data.positions} />
      <div className="last-update">
        Last updated: <span>{formatDate(lastPosition.time)}</span>
      </div>
    </>
  );
}
