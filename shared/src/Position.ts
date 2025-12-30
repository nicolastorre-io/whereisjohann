export interface Position {
  id: string;
  mmsi: string;
  latitude: number;
  longitude: number;
  time: string;
  cog?: number;
  sog?: number;
  navigationalStatus?: number;
  positionReportType?: string;
  name?: string;
  callSign?: string;
  destination?: string;
  eta?: number;
}
