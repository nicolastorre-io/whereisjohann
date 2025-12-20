interface HeaderProps {
  vesselName: string;
}

export default function Header({ vesselName }: HeaderProps) {
  return (
    <div className="header">
      <h1>{vesselName}</h1>
      <p className="subtitle">Real-time vessel tracking powered by AIS</p>
    </div>
  );
}
