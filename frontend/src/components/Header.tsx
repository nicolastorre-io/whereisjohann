import type { Position } from 'shared';

interface HeaderProps {
  mmsi: string;
  lastPosition: Position;
}

export default function Header({ mmsi, lastPosition }: Readonly<HeaderProps>) {
  const vesselName = lastPosition.name || null;
  const destination = lastPosition.destination || null;
  const callSign = lastPosition.callSign || null;

  return (
    <div className="header">
      <h1>Where is Johann?</h1>
      {vesselName ? (
        <p className="subtitle">{vesselName}</p>
      ) : (
        <p className="subtitle">MMSI: {mmsi}</p>
      )}
      {(callSign || destination) && (
        <p className="ship-info">
          {callSign && <span>Call Sign: {callSign}</span>}
          {destination && <span>Destination: {destination}</span>}
        </p>
      )}
      <p className="subtext">
        Track the vessel's journey in real-time. Each marker shows a recorded position,
        and the line traces the approximated ship's route.
      </p>
      <p className="subtext">
        Positions are collected via AIS (Automatic Identification System), a network of terrestrial
        stations with ~200km coastal range. Coverage may have gaps far offshore.
        Data provided by <a href="https://aisstream.io/coverage" target="_blank" rel="noopener noreferrer">AISStream.io</a>.
      </p>
    </div>
  );
}
