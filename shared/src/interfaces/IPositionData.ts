import { EPositionReportType } from '../enums/EPositionReportType';

export interface IPositionData {
  mmsi: number;
  latitude: number;
  longitude: number;
  time: string;
  cog?: number;
  sog?: number;
  navigationalStatus?: number;
  positionReportType?: EPositionReportType;
  name?: string;
}
