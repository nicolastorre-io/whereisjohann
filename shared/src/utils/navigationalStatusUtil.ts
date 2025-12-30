const NAVIGATIONAL_STATUS: Record<number, string> = {
  0: 'Under way using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted maneuverability',
  4: 'Constrained by her draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  9: 'Reserved (HSC)',
  10: 'Reserved (WIG)',
  11: 'Towing astern',
  12: 'Pushing ahead/towing alongside',
  13: 'Reserved',
  14: 'AIS-SART/MOB-AIS/EPIRB-AIS',
  15: 'Undefined',
};

export function getNavigationalStatus(code: number): string {
  return NAVIGATIONAL_STATUS[code] ?? 'Unknown';
}
