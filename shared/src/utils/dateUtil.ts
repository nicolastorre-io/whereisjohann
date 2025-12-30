import { IShipEta } from "../interfaces/IShipStaticData";

export function etaToTimestamp(eta: IShipEta): number {
  const now = new Date();
  let year = now.getFullYear();
  if (eta.Month < now.getMonth() + 1) {
    year++;
  }
  return new Date(year, eta.Month - 1, eta.Day, eta.Hour, eta.Minute).getTime();
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