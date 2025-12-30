import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import StatsBar from '../components/StatsBar';
import VesselMap from '../components/VesselMap';
import type { VesselData } from 'shared';
import { formatDate } from 'shared';

export default function HomePage() {
  const [data, setData] = useState<VesselData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('./position.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const lastPosition = useMemo(
    () => data?.positions.at(-1),
    [data]
  );

  const positions = useMemo(
    () => lastPosition
      ? data!.positions.filter((p) => p.mmsi === lastPosition.mmsi)
      : [],
    [data, lastPosition]
  );

  if (error) return <div className="error">Error loading data: {error}</div>;
  if (!data) return <div className="loading">Loading vessel data...</div>;
  if (!lastPosition) {
    return <div className="no-data">No positions recorded yet. Waiting for vessel data...</div>;
  }

  return (
    <>
      <Header />
      <StatsBar
        positionsCount={positions.length}
        lastPosition={lastPosition}
        mmsi={lastPosition.mmsi}
      />
      <VesselMap positions={positions} />
      <div className="last-update">
        Last updated: <span>{formatDate(lastPosition.time)}</span>
      </div>
    </>
  );
}
