import type { AISMetaData } from './AISMetaData';
import type { PositionReport } from './PositionReport';
import type { StandardClassBPositionReport } from './StandardClassBPositionReport';
import type { ExtendedClassBPositionReport } from './ExtendedClassBPositionReport';
import type { ShipStaticData } from './ShipStaticData';

export interface AISMessage {
  error?: string;
  Error?: string;
  MessageType?: string;
  MetaData?: AISMetaData;
  Message?: {
    PositionReport?: PositionReport;
    StandardClassBPositionReport?: StandardClassBPositionReport;
    ExtendedClassBPositionReport?: ExtendedClassBPositionReport;
    ShipStaticData?: ShipStaticData;
  };
}
