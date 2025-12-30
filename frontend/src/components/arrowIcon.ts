import L from 'leaflet';

const iconCache = new Map<string, L.DivIcon>();

function buildArrowIcon(cog: number, isCurrent: boolean): L.DivIcon {
  const size = isCurrent ? 32 : 24;
  const color = isCurrent ? '#ff6b35' : '#00b4d8';

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

export function createArrowIcon(cog = 0, isCurrent = false): L.DivIcon {
  const key = `${cog}-${isCurrent}`;
  const cached = iconCache.get(key);
  if (cached) {
    return cached;
  }
  const icon = buildArrowIcon(cog, isCurrent);
  iconCache.set(key, icon);
  return icon;
}

export const defaultIcon = createArrowIcon(0, false);
export const defaultCurrentIcon = createArrowIcon(0, true);
