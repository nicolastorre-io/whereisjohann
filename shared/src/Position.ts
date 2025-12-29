export interface Position {
  id: string;
  latitude: number;
  longitude: number;
  time: string;
  cog?: number;
  sog?: number;
}
