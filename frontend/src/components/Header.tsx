interface HeaderProps {
  mmsi: string;
}

export default function Header({ mmsi }: Readonly<HeaderProps>) {
  return (
    <div className="header">
      <h1>Where is Johann?</h1>
      <p className="subtitle">MMSI: {mmsi}</p>
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
