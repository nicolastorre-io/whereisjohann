export interface PositionData {
  mmsi: string;
  latitude: number;
  longitude: number;
  time: string;
  cog?: number;
  sog?: number;
  navigationalStatus?: number;
  positionReportType?: string;
  name?: string;
}
