const KNOTS_TO_KMH = 1.852;

export function knotsToKmh(knots: number): number {
  return knots * KNOTS_TO_KMH;
}
