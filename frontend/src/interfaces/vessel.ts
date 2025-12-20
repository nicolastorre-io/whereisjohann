export interface Position {
  latitude: number;
  longitude: number;
  time: string;
}

export interface VesselData {
  vessel: string;
  mmsi: string;
  positions: Position[];
}
