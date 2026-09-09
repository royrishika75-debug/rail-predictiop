/**
 * RailRadar Service Proxy
 * Re-exports RailwayDataService singleton for unified telemetry and backward compatibility.
 */
import { railwayDataService, RailwayDataService, type RateLimitStatus } from './railwayDataService';

export { railwayDataService, RailwayDataService, type RateLimitStatus };
export const railradarService = railwayDataService;
