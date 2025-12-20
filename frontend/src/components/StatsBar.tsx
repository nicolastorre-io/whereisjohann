import type { Position } from 'shared';

interface StatsBarProps {
  positionsCount: number;
  lastPosition: Position;
  mmsi: string;
}

export default function StatsBar({ positionsCount, lastPosition, mmsi }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="value">{positionsCount}</div>
        <div className="label">Positions</div>
      </div>
      <div className="stat-card">
        <div className="value">{lastPosition.latitude.toFixed(4)}°</div>
        <div className="label">Latitude</div>
      </div>
      <div className="stat-card">
        <div className="value">{lastPosition.longitude.toFixed(4)}°</div>
        <div className="label">Longitude</div>
      </div>
      <div className="stat-card">
        <div className="value">{mmsi}</div>
        <div className="label">MMSI</div>
      </div>
    </div>
  );
}
