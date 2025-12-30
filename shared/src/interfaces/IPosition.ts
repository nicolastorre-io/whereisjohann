import { EPositionReportType } from '../enums/EPositionReportType';

export interface IPosition {
  id: string;
  mmsi: number;
  latitude: number;
  longitude: number;
  positionTimeMetaData: string;
  shipTimeMetaData?: string;
  cog?: number;
  sog?: number;
  navigationalStatus?: number;
  positionReportType?: EPositionReportType;
  name?: string;
  destination?: string;
  eta?: number;
}
