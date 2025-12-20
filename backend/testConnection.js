const WebSocket = require("ws");

const API_KEY = process.env.AISSTREAM_API_KEY || "YOUR_API_KEY";

const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

ws.on("open", () => {
  console.log("Connected. Sending subscription...");
  // Simple test: small area, no filters
  ws.send(JSON.stringify({
    APIKey: API_KEY,
    BoundingBoxes: [[[43, 8], [45, 10]]], // Mediterranean near Genoa
  }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(data);
  console.log("Received:", msg.MessageType, msg.MetaData?.ShipName || JSON.stringify(msg));
  ws.close();
  process.exit(0);
});

ws.on("close", (code, reason) => {
  console.log(`Closed: code=${code}, reason=${reason || 'none'}`);
  process.exit(1);
});

ws.on("error", (err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log("Timeout after 30s");
  ws.close();
  process.exit(1);
}, 30000);
