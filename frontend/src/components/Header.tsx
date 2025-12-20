interface HeaderProps {
  vesselName: string;
}

export default function Header({ vesselName }: Readonly<HeaderProps>) {
  return (
    <div className="header">
      <h1>Where is Johann?</h1>
      <p className="subtitle">{vesselName}</p>
      <p className="subtext">
        Track Johann's cruise journey in real-time. Each marker shows a recorded position,
        and the line traces the ship's route across the Mediterranean.
      </p>
    </div>
  );
}
