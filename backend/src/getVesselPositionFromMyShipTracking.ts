import { PositionRepository } from './repositories/PositionRepository';
import { MyShipTrackingScraperService } from './services/MyShipTrackingScraperService';

const MMSI = process.env.MMSI || '352594000';

if (!MMSI) {
  console.error('MMSI environment variable is required');
  process.exit(1);
}

const positionRepository = new PositionRepository();
const scraperService = new MyShipTrackingScraperService(
  positionRepository,
  MMSI
);

scraperService
  .getVesselPosition()
  .then(() => {
    console.log('MyShipTracking scraping completed successfully');
  })
  .catch((error) => {
    console.error('MyShipTracking scraping failed:', error);
    process.exit(1);
  });
