export type { Position } from './Position';
export type { VesselData } from './VesselData';
export type { AISMetaData } from './AISMetaData';
export type { PositionReport } from './PositionReport';
export type { StandardClassBPositionReport } from './StandardClassBPositionReport';
export type { ExtendedClassBPositionReport } from './ExtendedClassBPositionReport';
export type { ShipStaticData, ShipStaticDataFile, ShipDimension, ShipEta } from './ShipStaticData';
export type { AISMessage } from './AISMessage';
export type { ShipInfo } from './ShipInfo';
export type { PositionData } from './PositionData';

// Utils
import type { ShipEta } from './ShipStaticData';

export function etaToTimestamp(eta: ShipEta): number {
  const now = new Date();
  let year = now.getFullYear();
  if (eta.Month < now.getMonth() + 1) {
    year++;
  }
  return new Date(year, eta.Month - 1, eta.Day, eta.Hour, eta.Minute).getTime();
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

export function formatEta(eta: number): string {
  return new Date(eta).toLocaleString();
}

const KNOTS_TO_KMH = 1.852;

export function knotsToKmh(knots: number): number {
  return knots * KNOTS_TO_KMH;
}

const NAVIGATIONAL_STATUS: Record<number, string> = {
  0: 'Under way using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted maneuverability',
  4: 'Constrained by her draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  9: 'Reserved (HSC)',
  10: 'Reserved (WIG)',
  11: 'Towing astern',
  12: 'Pushing ahead/towing alongside',
  13: 'Reserved',
  14: 'AIS-SART/MOB-AIS/EPIRB-AIS',
  15: 'Undefined',
};

export function getNavigationalStatus(code: number): string {
  return NAVIGATIONAL_STATUS[code] ?? 'Unknown';
}
