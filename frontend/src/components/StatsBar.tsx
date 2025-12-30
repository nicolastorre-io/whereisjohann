import type { IPosition } from 'shared';

interface StatsBarProps {
  positionsCount: number;
  lastPosition: IPosition;
  mmsi: number;
}

const GITHUB_POSITION_URL = 'https://github.com/nicolastorre-io/whereisjohann/blob/main/frontend/public/position.json';

export default function StatsBar({ positionsCount, lastPosition, mmsi }: StatsBarProps) {
  const googleMapsUrl = `https://www.google.com/maps?q=${lastPosition.latitude},${lastPosition.longitude}`;

  return (
    <div className="stats-bar">
      <a
        className="stat-card stat-card-link"
        href={GITHUB_POSITION_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="View position data on GitHub"
      >
        <div className="value">{positionsCount}</div>
        <div className="label">Positions</div>
      </a>
      <a
        className="stat-card stat-card-link"
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Google Maps"
      >
        <div className="value">{lastPosition.latitude.toFixed(4)}, {lastPosition.longitude.toFixed(4)}</div>
        <div className="label">Coordinates</div>
      </a>
      <a
        className="stat-card stat-card-link"
        href={`https://www.vesselfinder.com/?mmsi=${mmsi}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View vessel on VesselFinder"
      >
        <div className="value">{mmsi}</div>
        <div className="label">MMSI</div>
      </a>
    </div>
  );
}
