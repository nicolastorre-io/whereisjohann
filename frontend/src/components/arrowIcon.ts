import L from 'leaflet';
import type { EPositionReportType } from 'shared';

const iconCache = new Map<string, L.DivIcon>();

type DataSource = 'AISStream' | 'MyShipTracking';

function getDataSource(positionReportType?: EPositionReportType): DataSource {
  if (positionReportType === 'MyShipTrackingScrape') {
    return 'MyShipTracking';
  }
  return 'AISStream';
}

function getColor(source: DataSource, isCurrent: boolean): string {
  if (isCurrent) {
    return '#e74c3c'; // Red for current position
  }
  if (source === 'MyShipTracking') {
    return '#2ecc71'; // Green
  }
  return '#00b4d8'; // Blue
}

function buildArrowIcon(cog: number, isCurrent: boolean, source: DataSource): L.DivIcon {
  const size = isCurrent ? 32 : 24;
  const color = getColor(source, isCurrent);

  return new L.DivIcon({
    className: isCurrent ? 'current-marker' : 'ship-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
    ">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="transform: rotate(${cog}deg);">
        <path
          d="M12 2 L20 22 L4 22 Z"
          fill="${color}"
          stroke="white"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function buildCircleIcon(isCurrent: boolean, source: DataSource): L.DivIcon {
  const size = isCurrent ? 24 : 16;
  const color = getColor(source, isCurrent);

  return new L.DivIcon({
    className: isCurrent ? 'current-marker' : 'ship-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
    ">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="${color}"
          stroke="white"
          stroke-width="2"
        />
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export function createMarkerIcon(cog: number | undefined, isCurrent: boolean, positionReportType?: EPositionReportType): L.DivIcon {
  const source = getDataSource(positionReportType);
  const hasCog = cog !== undefined;
  const key = hasCog ? `arrow-${cog}-${isCurrent}-${source}` : `circle-${isCurrent}-${source}`;
  const cached = iconCache.get(key);
  if (cached) {
    return cached;
  }
  const icon = hasCog ? buildArrowIcon(cog, isCurrent, source) : buildCircleIcon(isCurrent, source);
  iconCache.set(key, icon);
  return icon;
}

