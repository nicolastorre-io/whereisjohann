import type { IAISMetaData } from './IAISMetaData';
import type { IPositionReport } from './IPositionReport';
import type { IStandardClassBPositionReport } from './IStandardClassBPositionReport';
import type { IExtendedClassBPositionReport } from './IExtendedClassBPositionReport';
import type { IShipStaticData } from './IShipStaticData';

export interface IAISMessage {
  error?: string;
  Error?: string;
  MessageType?: string;
  MetaData?: IAISMetaData;
  Message?: {
    PositionReport?: IPositionReport;
    StandardClassBPositionReport?: IStandardClassBPositionReport;
    ExtendedClassBPositionReport?: IExtendedClassBPositionReport;
    ShipStaticData?: IShipStaticData;
  };
}
