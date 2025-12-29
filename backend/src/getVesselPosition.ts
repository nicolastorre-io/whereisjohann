import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { VesselData, AISMessage } from 'shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MMSI = process.env.MMSI || '352594000';
const API_KEY = process.env.AISSTREAM_API_KEY || 'YOUR_API_KEY';
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '600000');
const POSITION_FILE = path.join(__dirname, '..', '..', 'data', 'position.json');

function loadPositions(): VesselData {
  try {
    return JSON.parse(fs.readFileSync(POSITION_FILE, 'utf8'));
  } catch {
    return { vessel: 'MSC Magnifica', mmsi: MMSI, positions: [] };
  }
}

function savePosition(latitude: number, longitude: number, time: string, cog?: number, sog?: number): void {
  const data = loadPositions();
  const id = crypto.randomUUID();
  data.positions.push({ id, latitude, longitude, time, cog, sog });
  fs.writeFileSync(POSITION_FILE, JSON.stringify(data, null, 2));
  console.log('Position saved to position.json');
}

function getVesselPosition(): void {
  const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

  let positionReceived = false;

  ws.on('open', () => {
    const subscribeMsg = {
      APIKey: API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
      FiltersShipMMSI: [MMSI],
      FilterMessageTypes: ['PositionReport'],
    };
    console.log('Connected. Sending subscription for MMSI:', MMSI);
    ws.send(JSON.stringify(subscribeMsg));
    console.log('Waiting for position data...');
  });

  ws.on('close', (code: number, reason: Buffer) => {
    const reasonStr = reason ? reason.toString() : 'no reason';
    console.log(`Connection closed: code=${code}, reason=${reasonStr}`);
    if (!positionReceived) {
      process.exit(1);
    }
  });

  ws.on('message', (data: WebSocket.RawData) => {
    const msg: AISMessage = JSON.parse(data.toString());

    if (msg.error || msg.Error) {
      console.error('Server error:', msg.error || msg.Error);
      return;
    }

    if (!msg.MetaData) {
      console.log('Received message:', JSON.stringify(msg, null, 2));
      return;
    }

    const { latitude, longitude, ShipName, time_utc } = msg.MetaData;
    const cog = msg.Message?.PositionReport?.Cog;
    const sog = msg.Message?.PositionReport?.Sog;
    console.log(`\n${ShipName} Position:`);
    console.log(`  Latitude:  ${latitude}`);
    console.log(`  Longitude: ${longitude}`);
    console.log(`  COG:       ${cog}`);
    console.log(`  SOG:       ${sog}`);
    console.log(`  Time:      ${time_utc}`);
    savePosition(latitude, longitude, time_utc, cog, sog);
    positionReceived = true;
    ws.close();
    process.exit(0);
  });

  ws.on('error', (err: Error) => {
    console.error('Error:', err.message);
    process.exit(1);
  });

  setTimeout(() => {
    console.error(`Timeout: No position received after ${TIMEOUT_MS / 1000}s`);
    ws.close();
    process.exit(1);
  }, TIMEOUT_MS);
}

getVesselPosition();
