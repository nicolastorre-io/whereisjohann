import type { AISMetaData } from './AISMetaData';
import type { PositionReport } from './PositionReport';

export interface AISMessage {
  error?: string;
  Error?: string;
  MetaData?: AISMetaData;
  Message?: {
    PositionReport?: PositionReport;
  };
}
