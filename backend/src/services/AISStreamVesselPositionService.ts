import WebSocket from 'ws';
import { etaToTimestamp } from 'shared';
import type { IAISMessage, IPosition, IShipStaticData, IShipInfo } from 'shared';
import { PositionRepository } from '../repositories/PositionRepository';

const AISSTREAM_WS_URL = 'wss://stream.aisstream.io/v0/stream';
const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class AISStreamVesselPositionService {
  private readonly positionRepository: PositionRepository;
  private readonly mmsi: string;
  private readonly apiKey: string;

  constructor(
    positionRepository: PositionRepository,
    mmsi: string,
    apiKey: string
  ) {
    this.positionRepository = positionRepository;
    this.mmsi = mmsi;
    this.apiKey = apiKey;
  }

  getVesselPosition(): void {
    const ws = new WebSocket(AISSTREAM_WS_URL);

    let shipInfo: IShipInfo = {};
    let positionData: Omit<IPosition, 'id'> | null = null;

    const saveAndExit = (): void => {
      if (!positionData) return;

      console.log(`\nSaving position:`);
      console.log(`  MMSI:              ${positionData.mmsi}`);
      console.log(`  Name:              ${positionData.name}`);
      console.log(`  CallSign:          ${positionData.callSign}`);
      console.log(`  Destination:       ${positionData.destination}`);
      console.log(`  ETA:               ${positionData.eta ? new Date(positionData.eta).toISOString() : 'N/A'}`);
      console.log(`  Latitude:          ${positionData.latitude}`);
      console.log(`  Longitude:         ${positionData.longitude}`);
      console.log(`  COG:               ${positionData.cog}`);
      console.log(`  SOG:               ${positionData.sog}`);
      console.log(`  Nav Status:        ${positionData.navigationalStatus}`);
      console.log(`  Position Time:     ${positionData.positionTimeMetaData}`);
      console.log(`  Ship Time:         ${positionData.shipTimeMetaData}`);

      this.positionRepository.save(positionData);
      ws.close();
      process.exit(0);
    };

    const timeout = setTimeout(() => {
      console.log('Timeout reached.');
      trySaveOrExit();
    }, DEFAULT_TIMEOUT_MS);

    const trySaveOrExit = (): void => {
      clearTimeout(timeout);
      if (positionData) {
        saveAndExit();
      } else {
        console.log('No position data received. Vessel may not be transmitting.');
        process.exit(0);
      }
    };

    ws.on('open', () => {
      const subscribeMsg = {
        APIKey: this.apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FiltersShipMMSI: [this.mmsi],
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport', 'ShipStaticData'],
      };
      console.log('Connected. Sending subscription for MMSI:', this.mmsi);
      ws.send(JSON.stringify(subscribeMsg));
      console.log('Waiting for messages...');
    });

    ws.on('close', (code: number, reason: Buffer) => {
      const reasonStr = reason ? reason.toString() : 'no reason';
      console.log(`Connection closed: code=${code}, reason=${reasonStr}`);
      trySaveOrExit();
    });

    ws.on('message', (rawData: WebSocket.RawData) => {
      const msg: IAISMessage = JSON.parse(Buffer.from(rawData as Buffer).toString('utf-8'));

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
        const staticData: IShipStaticData = msg.Message.ShipStaticData;
        shipInfo = {
          name: staticData.Name?.trim(),
          callSign: staticData.CallSign?.trim(),
          destination: staticData.Destination?.trim(),
          eta: staticData.Eta ? etaToTimestamp(staticData.Eta) : undefined,
          shipTimeMetaData: msg.MetaData.time_utc,
        };
        console.log(`\nShip Static Data received:`);
        console.log(`  Name:        ${shipInfo.name}`);
        console.log(`  CallSign:    ${shipInfo.callSign}`);
        console.log(`  Destination: ${shipInfo.destination}`);
        console.log(`  ETA:         ${shipInfo.eta ? new Date(shipInfo.eta).toISOString() : 'N/A'}`);
        console.log(`  Time:        ${shipInfo.shipTimeMetaData}`);

        // If we already have position data, update it with ship info and save
        if (positionData) {
          positionData.name = shipInfo.name || positionData.name;
          positionData.callSign = shipInfo.callSign;
          positionData.destination = shipInfo.destination;
          positionData.eta = shipInfo.eta;
          positionData.shipTimeMetaData = shipInfo.shipTimeMetaData;
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
          positionTimeMetaData: time_utc,
          shipTimeMetaData: shipInfo.shipTimeMetaData,
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
}
