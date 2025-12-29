import { Marker, Popup } from 'react-leaflet';
import type { Position } from 'shared';
import { formatDate } from '../utils/date';
import { createArrowIcon, defaultIcon, defaultCurrentIcon } from './arrowIcon';

interface VesselMarkerProps {
  position: Position;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

export default function VesselMarker({ position, index, isFirst, isLast }: VesselMarkerProps) {
  const hasCog = position.cog !== undefined;
  const icon = hasCog
    ? createArrowIcon(position.cog, isLast)
    : isLast ? defaultCurrentIcon : defaultIcon;

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="popup-title">
          {isLast ? 'Current Position' : isFirst ? 'Start Position' : `Position #${index + 1}`}
        </div>
        <div className="popup-row">
          <span className="label">Latitude</span>
          <span className="value">{position.latitude.toFixed(5)}°</span>
        </div>
        <div className="popup-row">
          <span className="label">Longitude</span>
          <span className="value">{position.longitude.toFixed(5)}°</span>
        </div>
        {position.cog !== undefined && (
          <div className="popup-row">
            <span className="label">Cap</span>
            <span className="value">{position.cog.toFixed(1)}°</span>
          </div>
        )}
        {position.sog !== undefined && (
          <div className="popup-row">
            <span className="label">Speed</span>
            <span className="value">{position.sog.toFixed(1)} kn</span>
          </div>
        )}
        <div className="popup-row">
          <span className="label">Time</span>
          <span className="value">{formatDate(position.time)}</span>
        </div>
      </Popup>
    </Marker>
  );
}
