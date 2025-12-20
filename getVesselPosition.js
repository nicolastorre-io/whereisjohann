const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const MMSI = process.env.MMSI || "352594000"; // Default: MSC Magnifica
const API_KEY = process.env.AISSTREAM_API_KEY || "YOUR_API_KEY";
const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS) || 600000; // Default 10 minutes
const POSITION_FILE = path.join(__dirname, "position.json");

function loadPositions() {
  try {
    return JSON.parse(fs.readFileSync(POSITION_FILE, "utf8"));
  } catch {
    return { vessel: "MSC Magnifica", mmsi: MMSI, positions: [] };
  }
}

function savePosition(latitude, longitude, time) {
  const data = loadPositions();
  data.positions.push({ latitude, longitude, time });
  fs.writeFileSync(POSITION_FILE, JSON.stringify(data, null, 2));
  console.log("Position saved to position.json");
}

function getVesselPosition() {
  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ws.on("open", () => {
    const subscribeMsg = {
      APIKey: API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]], // Worldwide
      FiltersShipMMSI: [MMSI],
      FilterMessageTypes: ["PositionReport"],
    };
    ws.send(JSON.stringify(subscribeMsg));
    console.log("Connected. Waiting for MSC Magnifica position...");
  });

  ws.on("close", (code, reason) => {
    console.log(`Connection closed: ${code} ${reason}`);
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    const { latitude, longitude, ShipName, time_utc } = msg.MetaData;
    console.log(`\n${ShipName} Position:`);
    console.log(`  Latitude:  ${latitude}`);
    console.log(`  Longitude: ${longitude}`);
    console.log(`  Time:      ${time_utc}`);
    savePosition(latitude, longitude, time_utc);
    ws.close();
    process.exit(0);
  });

  ws.on("error", (err) => {
    console.error("Error:", err.message);
    process.exit(1);
  });

  // Timeout if no message received
  setTimeout(() => {
    console.error(`Timeout: No position received after ${TIMEOUT_MS / 1000}s`);
    ws.close();
    process.exit(1);
  }, TIMEOUT_MS);
}

getVesselPosition();
