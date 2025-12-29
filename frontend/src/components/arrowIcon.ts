import L from 'leaflet';

export function createArrowIcon(cog?: number, isCurrent = false) {
  const size = isCurrent ? 32 : 24;
  const color = isCurrent ? '#ff6b35' : '#00b4d8';
  const rotation = cog ?? 0;

  return new L.DivIcon({
    className: isCurrent ? 'current-marker' : 'ship-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      ${isCurrent ? 'animation: pulse 2s infinite;' : ''}
    ">
      <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="transform: rotate(${rotation}deg);">
        <path
          d="M12 2 L20 20 L12 16 L4 20 Z"
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

export const defaultIcon = createArrowIcon(0, false);
export const defaultCurrentIcon = createArrowIcon(0, true);
