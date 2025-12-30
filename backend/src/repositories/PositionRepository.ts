import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { IVesselData, IPosition } from 'shared';

export class PositionRepository {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(__dirname, '..', '..', '..', 'data', 'position.json');
  }

  load(): IVesselData {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch {
      return { positions: [] };
    }
  }

  save(position: Omit<IPosition, 'id'>): void {
    const data = this.load();
    const id = crypto.randomUUID();
    data.positions.push({ id, ...position });
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    console.log('Position saved to position.json');
  }
}
