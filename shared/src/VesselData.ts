import type { Position } from './Position';

export interface VesselData {
  mmsi: string;
  positions: Position[];
}
