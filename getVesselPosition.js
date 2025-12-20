const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

const MMSI = "352594000"; // MSC Magnifica
const API_KEY = process.env.AISSTREAM_API_KEY || "YOUR_API_KEY";
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

  // Timeout after 5 minutes if no message received
  setTimeout(() => {
    console.error("Timeout: No position received");
    ws.close();
    process.exit(1);
  }, 300000);
}

getVesselPosition();
