export type { IPosition } from './interfaces/IPosition';
export type { IVesselData } from './interfaces/IVesselData';
export type { IAISMetaData } from './interfaces/IAISMetaData';
export type { IPositionReport } from './interfaces/IPositionReport';
export type { IStandardClassBPositionReport } from './interfaces/IStandardClassBPositionReport';
export type { IExtendedClassBPositionReport } from './interfaces/IExtendedClassBPositionReport';
export type { IShipStaticData, IShipStaticDataFile, IShipDimension, IShipEta } from './interfaces/IShipStaticData';
export type { IAISMessage } from './interfaces/IAISMessage';
export type { IShipInfo } from './interfaces/IShipInfo';
export type { IPositionData } from './interfaces/IPositionData';

export { etaToTimestamp, formatDate, formatEta } from './utils/dateUtil';
export { knotsToKmh } from './utils/speedUtil';
export { getNavigationalStatus } from './utils/navigationalStatusUtil';
