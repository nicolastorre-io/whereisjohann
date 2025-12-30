import { PositionRepository } from './repositories/PositionRepository';
import { VesselFinderScraperService } from './services/VesselFinderScraperService';

const MMSI = process.env.MMSI || '352594000';

const positionRepository = new PositionRepository();
const vesselFinderService = new VesselFinderScraperService(positionRepository, MMSI);

vesselFinderService.getVesselPosition()
  .then(() => {
    console.log('VesselFinder scraping completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('VesselFinder scraping failed:', error);
    process.exit(1);
  });
