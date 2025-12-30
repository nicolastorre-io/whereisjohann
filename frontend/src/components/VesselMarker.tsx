import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { IPosition } from 'shared';
import { formatDate, formatEta, getNavigationalStatus, knotsToKmh } from 'shared';
import { createArrowIcon, defaultIcon, defaultCurrentIcon } from './arrowIcon';

interface VesselMarkerProps {
  position: IPosition;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

export default function VesselMarker({ position, index, isFirst, isLast }: VesselMarkerProps) {
  const hasCog = useMemo(() => position.cog !== undefined, [position.cog]);
  const icon = useMemo(() => {
    if (hasCog) {
      return createArrowIcon(position.cog, isLast);
    }
    return isLast ? defaultCurrentIcon : defaultIcon;
  }, [hasCog, position.cog, isLast]);

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="popup-title">
          {isLast ? 'Current Position' : isFirst ? 'Start Position' : `Position #${index + 1}`}
        </div>
        {position.name && (
          <div className="popup-row">
            <span className="label">Vessel</span>
            <span className="value">{position.name}</span>
          </div>
        )}
        <div className="popup-row">
          <span className="label">Latitude</span>
          <span className="value">{position.latitude.toFixed(5)}</span>
        </div>
        <div className="popup-row">
          <span className="label">Longitude</span>
          <span className="value">{position.longitude.toFixed(5)}</span>
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
            <span className="value">{position.sog.toFixed(1)} kn ({knotsToKmh(position.sog).toFixed(1)} km/h)</span>
          </div>
        )}
        {position.navigationalStatus !== undefined && (
          <div className="popup-row">
            <span className="label">Status</span>
            <span className="value">{getNavigationalStatus(position.navigationalStatus)}</span>
          </div>
        )}
        {position.destination && (
          <div className="popup-row">
            <span className="label">Destination</span>
            <span className="value">
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(position.destination)}+port`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {position.destination}
              </a>
            </span>
          </div>
        )}
        {position.eta && (
          <div className="popup-row">
            <span className="label">Time of arrival</span>
            <span className="value">{formatEta(position.eta)}</span>
          </div>
        )}
        <div className="popup-row">
          <span className="label">Time</span>
          <span className="value">{formatDate(position.positionTimeMetaData)}</span>
        </div>
      </Popup>
    </Marker>
  );
}
