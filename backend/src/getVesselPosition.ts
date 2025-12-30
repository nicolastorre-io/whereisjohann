import { PositionRepository } from './repositories/PositionRepository';
import { AISStreamVesselPositionService } from './services/AISStreamVesselPositionService';

const MMSI = process.env.MMSI || '352594000';
const API_KEY = process.env.AISSTREAM_API_KEY || 'YOUR_API_KEY';

const positionRepository = new PositionRepository();
const vesselPositionService = new AISStreamVesselPositionService(positionRepository, MMSI, API_KEY);

vesselPositionService.getVesselPosition();
