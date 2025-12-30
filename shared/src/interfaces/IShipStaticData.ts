export interface IShipDimension {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface IShipEta {
  Day: number;
  Hour: number;
  Minute: number;
  Month: number;
}

export interface IShipStaticData {
  Name: string;
  CallSign: string;
  Type: number;
  ImoNumber: number;
  Destination: string;
  MaximumStaticDraught: number;
  Dimension: IShipDimension;
  Eta: IShipEta;
}

export interface IShipStaticDataFile {
  mmsi: string;
  lastUpdated: string;
  data: IShipStaticData | null;
}
