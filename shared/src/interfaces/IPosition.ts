export interface IPosition {
  id: string;
  mmsi: string;
  latitude: number;
  longitude: number;
  positionTimeMetaData: string;
  shipTimeMetaData?: string;
  cog?: number;
  sog?: number;
  navigationalStatus?: number;
  positionReportType?: string;
  name?: string;
  callSign?: string;
  destination?: string;
  eta?: number;
}
