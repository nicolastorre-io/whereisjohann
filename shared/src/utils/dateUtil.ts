import { IShipEta } from "../interfaces/IShipStaticData";

export function etaToTimestamp(eta: IShipEta): number {
  const now = new Date();
  let year = now.getUTCFullYear();
  if (eta.Month < now.getUTCMonth() + 1) {
    year++;
  }
  return Date.UTC(year, eta.Month - 1, eta.Day, eta.Hour, eta.Minute);
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString();
  } catch {
    return dateStr;
  }
}

export function formatEta(eta: number): string {
  return new Date(eta).toLocaleString();
}