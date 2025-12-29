import type { Position } from './Position';

export interface VesselData {
  vessel: string;
  mmsi: string;
  positions: Position[];
}
