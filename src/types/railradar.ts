export interface RailRadarLocation {
  stationCode?: string;
  stationName?: string;
  sequence?: number;
  status?: string; // 'departed' | 'arrived' | 'in_transit' | 'scheduled'
  isHalt?: boolean;
  isDiverted?: boolean;
  isActualPosition?: boolean;
  segmentProgress?: number; // 0.0 to 1.0
  speedKmh?: number;
  bearingDegrees?: number;
}

export interface RailRadarHalt {
  stationCode: string;
  stationName: string;
  sequence?: number;
  distance?: number;
  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;
  actualArrival?: string | null;
  actualDeparture?: string | null;
  platform?: string | null;
}

export interface RailRadarRouteStation {
  sequence: number;
  stationCode: string;
  stationName: string;
  isHalt: boolean;
  lat?: number;
  lng?: number;
  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;
  actualArrival?: string | null;
  actualDeparture?: string | null;
  delayArrival?: number | null;
  delayDeparture?: number | null;
  status: 'departed' | 'arrived' | 'upcoming' | string;
  distance?: number;
  speedToNextStationKmph?: number;
  platform?: string | null;
}

export interface RailRadarException {
  type: 'DIVERTED' | 'CANCELLED' | 'RESCHEDULED' | 'PARTIALLY_CANCELLED' | string;
  message: string;
  diverted?: {
    from?: { code: string; name: string; sequence?: number };
    to?: { code: string; name: string; sequence?: number };
    distanceKm?: number;
    skippedStations?: Array<{ code: string; name: string; scheduledArrival?: string; scheduledDeparture?: string }>;
  };
  partiallyCancelled?: any;
  rescheduled?: any;
}

export interface RailRadarTrainMetadata {
  number: string;
  name: string;
  type?: string;
  category?: string;
  source?: { code: string; name: string };
  destination?: { code: string; name: string };
  runDays?: string[];
  distance?: number;
  duration?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  totalHalts?: number;
  returnTrain?: string;
}

export interface RailRadarLiveData {
  trainNumber: string;
  trainName: string;
  startDate?: string;
  lastUpdatedAt?: string;
  status: string; // 'not-started' | 'running' | 'departed' | 'scheduled' | 'arrived' | 'completed' | 'delayed' | 'diverted' | 'cancelled' | 'rescheduled'
  delayMinutes: number;
  train?: RailRadarTrainMetadata;
  currentLocation?: RailRadarLocation;
  previousHalt?: RailRadarHalt;
  nextHalt?: RailRadarHalt;
  exceptions?: RailRadarException[];
  route?: RailRadarRouteStation[];
  platform?: string | null;
  speed?: number | null;
  segmentProgress?: number | null;
  isLive?: boolean;
  trackingMode?: string;
  requestedDate?: string;
  currentISTDate?: string;
  journeyState?: 'NOT_STARTED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'DIVERTED' | 'STALE';
  source?: 'RailRadar';
  provider?: 'RailRadar';
  fetchedAt?: string;
}

export interface LiveTrainApiResponse {
  success: boolean;
  data?: RailRadarLiveData;
  meta?: {
    traceId?: string;
    timestamp?: string;
    source?: string;
    cached?: boolean;
    cacheExpiresIn?: number;
    executionTime?: number;
    requestedDate?: string;
    currentISTDate?: string;
    cooldownActive?: boolean;
    cooldownRemaining?: number;
  };
  error?: {
    code: string;
    message: string;
  };
  isConfigured?: boolean;
  isFallback?: boolean;
  status?: number;
  retryAfter?: number;
  lastUpdated?: Date;
}

export interface ProcessedStationPrediction {
  station: string;
  stationCode: string;
  scheduled: string;
  predicted: string;
  delay: number;
  confidence: number;
  platform: string | null;
  status: string;
  isCurrent: boolean;
  isNext: boolean;
  distance?: number;
}
