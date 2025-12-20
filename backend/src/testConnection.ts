import WebSocket from 'ws';

const API_KEY = process.env.AISSTREAM_API_KEY || 'YOUR_API_KEY';

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

interface AISMessage {
  MessageType?: string;
  MetaData?: {
    ShipName?: string;
  };
}

ws.on('open', () => {
  console.log('Connected. Sending subscription...');
  ws.send(JSON.stringify({
    APIKey: API_KEY,
    BoundingBoxes: [[[43, 8], [45, 10]]],
  }));
});

ws.on('message', (data: WebSocket.RawData) => {
  const msg: AISMessage = JSON.parse(data.toString());
  console.log('Received:', msg.MessageType, msg.MetaData?.ShipName || JSON.stringify(msg));
  ws.close();
  process.exit(0);
});

ws.on('close', (code: number, reason: Buffer) => {
  console.log(`Closed: code=${code}, reason=${reason?.toString() || 'none'}`);
  process.exit(1);
});

ws.on('error', (err: Error) => {
  console.error('Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout after 30s');
  ws.close();
  process.exit(1);
}, 30000);
