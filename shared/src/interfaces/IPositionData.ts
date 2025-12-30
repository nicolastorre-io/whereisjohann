export interface IPositionData {
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
