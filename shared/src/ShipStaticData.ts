export interface ShipDimension {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface ShipEta {
  Day: number;
  Hour: number;
  Minute: number;
  Month: number;
}

export interface ShipStaticData {
  Name: string;
  CallSign: string;
  Type: number;
  ImoNumber: number;
  Destination: string;
  MaximumStaticDraught: number;
  Dimension: ShipDimension;
  Eta: ShipEta;
}

export interface ShipStaticDataFile {
  mmsi: string;
  lastUpdated: string;
  data: ShipStaticData | null;
}
