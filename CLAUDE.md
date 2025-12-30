# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**whereisjohann** is a real-time vessel tracking application using AIS (Automatic Identification System) data. It's a Yarn workspaces monorepo with three packages: `shared`, `backend`, and `frontend`.

## Common Commands

### Root Level (from /app)

```bash
yarn install          # Install all dependencies
yarn dev              # Start frontend dev server (http://localhost:5173)
yarn build            # Build shared + frontend
yarn track            # Run vessel tracking script (requires AISSTREAM_API_KEY, MMSI env vars)
```

### Frontend (from /app/frontend)

```bash
yarn dev              # Vite dev server with HMR
yarn build            # TypeScript check + Vite build
yarn lint             # ESLint
yarn preview          # Preview production build
```

### Backend (from /app/backend)

```bash
yarn build            # Compile TypeScript
yarn track            # Run vessel tracker (needs env vars)
yarn test             # Test AISStream connection
```

### Shared (from /app/shared)

```bash
yarn build            # Compile TypeScript types
yarn dev              # Watch mode
```

## Architecture

```text
/app
├── backend/          # Node.js AIS data tracker
│   └── src/
│       └── getVesselPosition.ts   # WebSocket connection to AISStream API
├── frontend/         # React + Vite + Leaflet map app
│   ├── src/
│   │   ├── components/            # VesselMap, VesselMarker, Header, StatsBar
│   │   ├── pages/HomePage.tsx
│   │   ├── hooks/useFitBounds.ts
│   │   └── utils/                 # date, speed, navigationalStatus helpers
│   └── public/position.json       # Copied from data/ at build time
├── shared/           # TypeScript types (Position, VesselData, AISMessage, etc.)
└── data/
    └── position.json # Persistent position storage
```

## Data Flow

1. **Backend**: Connects to AISStream WebSocket, subscribes to vessel by MMSI, receives position reports and ship static data, saves to `data/position.json`
2. **CI/CD**: GitHub Actions runs tracking hourly, commits position.json, triggers deploy
3. **Frontend**: Fetches position.json, displays vessel route on Leaflet map with OpenStreetMap tiles

## Key Configuration

- **Base path**: `/whereisjohann/` (GitHub Pages deployment in vite.config.ts)
- **TypeScript**: Strict mode enabled in all packages
- **ES Modules**: All packages use `"type": "module"`

## Environment Variables (Backend)

- `AISSTREAM_API_KEY` - AISStream API key
- `MMSI` - Maritime Mobile Service Identity (vessel identifier)

## External APIs

- **AISStream**: <https://aisstream.io/documentation> - Real-time AIS vessel data via WebSocket
- **OpenStreetMap**: Map tiles for frontend
