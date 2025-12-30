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
yarn track:aisstream    # Run vessel tracking via AISStream (requires AISSTREAM_API_KEY, MMSI env vars)
yarn track:vesselfinder # Run vessel tracking via VesselFinder scraping (requires MMSI env var)
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
yarn build              # Compile TypeScript
yarn track:aisstream    # Run vessel tracker via AISStream (needs env vars)
yarn track:vesselfinder # Run vessel tracker via VesselFinder scraping
yarn test               # Test AISStream connection
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
│       ├── getVesselPositionFromAISStream.ts     # AISStream WebSocket tracker
│       └── getVesselPositionFromVesselFinder.ts  # VesselFinder scraper
├── frontend/         # React + Vite + Leaflet map app
│   ├── src/
│   │   ├── components/            # VesselMap, VesselMarker, Header, StatsBar
│   │   ├── pages/HomePage.tsx
│   │   ├── hooks/useFitBounds.ts
│   │   └── utils/                 # date, speed, navigationalStatus helpers
│   └── public/position.json       # Persistent position storage
└── shared/           # TypeScript types (Position, VesselData, AISMessage, etc.)
```

## Data Flow

1. **Backend**: Two tracking methods available:
   - AISStream: WebSocket connection, subscribes to vessel by MMSI, receives position reports
   - VesselFinder: Puppeteer scraper, extracts position data from vessel page
2. **CI/CD**: GitHub Actions runs tracking hourly (AISStream at :00, VesselFinder at :30), saves to `frontend/public/position.json`, commits, triggers deploy
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
