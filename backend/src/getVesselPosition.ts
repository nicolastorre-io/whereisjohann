import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { etaToTimestamp } from 'shared';
import type { VesselData, AISMessage, Position, ShipStaticData, ShipInfo } from 'shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MMSI = process.env.MMSI || '352594000';
const API_KEY = process.env.AISSTREAM_API_KEY || 'YOUR_API_KEY';
const POSITION_FILE = path.join(__dirname, '..', '..', 'data', 'position.json');

function loadPositions(): VesselData {
  try {
    return JSON.parse(fs.readFileSync(POSITION_FILE, 'utf8'));
  } catch {
    return { positions: [] };
  }
}

function savePosition(position: Omit<Position, 'id'>): void {
  const data = loadPositions();
  const id = crypto.randomUUID();
  data.positions.push({ id, ...position });
  fs.writeFileSync(POSITION_FILE, JSON.stringify(data, null, 2));
  console.log('Position saved to position.json');
}

function getVesselPosition(): void {
  const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

  let shipInfo: ShipInfo = {};
  let positionData: Omit<Position, 'id'> | null = null;

  function saveAndExit(): void {
    if (!positionData) return;

    console.log(`\nSaving position:`);
    console.log(`  MMSI:        ${positionData.mmsi}`);
    console.log(`  Name:        ${positionData.name}`);
    console.log(`  CallSign:    ${positionData.callSign}`);
    console.log(`  Destination: ${positionData.destination}`);
    console.log(`  ETA:         ${positionData.eta ? new Date(positionData.eta).toISOString() : 'N/A'}`);
    console.log(`  Latitude:    ${positionData.latitude}`);
    console.log(`  Longitude:   ${positionData.longitude}`);
    console.log(`  COG:         ${positionData.cog}`);
    console.log(`  SOG:         ${positionData.sog}`);
    console.log(`  Nav Status:  ${positionData.navigationalStatus}`);
    console.log(`  Time:        ${positionData.time}`);

    savePosition(positionData);
    ws.close();
    process.exit(0);
  }

  function trySaveOrExit(): void {
    if (positionData) {
      saveAndExit();
    } else {
      console.log('No position data received. Vessel may not be transmitting.');
      process.exit(0);
    }
  }

  ws.on('open', () => {
    const subscribeMsg = {
      APIKey: API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],
      FiltersShipMMSI: [MMSI],
      FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport', 'ShipStaticData'],
    };
    console.log('Connected. Sending subscription for MMSI:', MMSI);
    ws.send(JSON.stringify(subscribeMsg));
    console.log('Waiting for messages...');
  });

  ws.on('close', (code: number, reason: Buffer) => {
    const reasonStr = reason ? reason.toString() : 'no reason';
    console.log(`Connection closed: code=${code}, reason=${reasonStr}`);
    trySaveOrExit();
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

    const messageType = msg.MessageType;

    // Handle ShipStaticData message
    if (messageType === 'ShipStaticData' && msg.Message?.ShipStaticData) {
      const staticData: ShipStaticData = msg.Message.ShipStaticData;
      shipInfo = {
        name: staticData.Name?.trim(),
        callSign: staticData.CallSign?.trim(),
        destination: staticData.Destination?.trim(),
        eta: staticData.Eta ? etaToTimestamp(staticData.Eta) : undefined,
      };
      console.log(`\nShip Static Data received:`);
      console.log(`  Name:        ${shipInfo.name}`);
      console.log(`  CallSign:    ${shipInfo.callSign}`);
      console.log(`  Destination: ${shipInfo.destination}`);
      console.log(`  ETA:         ${shipInfo.eta ? new Date(shipInfo.eta).toISOString() : 'N/A'}`);

      // If we already have position data, update it with ship info and save
      if (positionData) {
        positionData.name = shipInfo.name || positionData.name;
        positionData.callSign = shipInfo.callSign;
        positionData.destination = shipInfo.destination;
        positionData.eta = shipInfo.eta;
        saveAndExit();
      }
      return;
    }

    // Handle Position messages - store and wait for ShipStaticData
    if (!positionData) {
      const { MMSI: msgMmsi, latitude, longitude, ShipName, time_utc } = msg.MetaData;
      const positionReport = msg.Message?.PositionReport;
      const standardClassB = msg.Message?.StandardClassBPositionReport;
      const extendedClassB = msg.Message?.ExtendedClassBPositionReport;

      const cog = positionReport?.Cog ?? standardClassB?.Cog ?? extendedClassB?.Cog;
      const sog = positionReport?.Sog ?? standardClassB?.Sog ?? extendedClassB?.Sog;
      const navigationalStatus = positionReport?.NavigationalStatus;

      positionData = {
        mmsi: msgMmsi,
        latitude,
        longitude,
        time: time_utc,
        cog,
        sog,
        navigationalStatus,
        positionReportType: messageType,
        name: shipInfo.name || ShipName?.trim(),
        callSign: shipInfo.callSign,
        destination: shipInfo.destination,
        eta: shipInfo.eta,
      };

      console.log(`\nPosition received (${messageType}):`);
      console.log(`  Latitude:    ${latitude}`);
      console.log(`  Longitude:   ${longitude}`);
      console.log(`  COG:         ${cog}`);
      console.log(`  SOG:         ${sog}`);
      console.log(`  Nav Status:  ${navigationalStatus}`);
      console.log(`  Time:        ${time_utc}`);

      // If we already have ship info, save immediately
      if (shipInfo.name) {
        saveAndExit();
        return;
      }

      console.log('Waiting for ShipStaticData...');
    }
  });

  ws.on('error', (err: Error) => {
    console.error('Error:', err.message);
    trySaveOrExit();
  });
}

getVesselPosition();
