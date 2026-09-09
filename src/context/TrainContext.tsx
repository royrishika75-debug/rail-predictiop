import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  RailRadarLiveData,
  LiveTrainApiResponse,
} from '../types/railradar';
import type {
  LiveWeatherData,
  WeatherRiskAssessment,
} from '../types/weather';
import {
  fetchLiveWeather,
  deriveWeatherRisk,
  extractCoordinatesFromTrain,
} from '../services/weatherService';
import {
  processTrainCalculations,
  type TrainCalculationResult,
} from '../utils/trainCalculations';
import { railradarService } from '../services/railradarService';

export interface ApiErrorInfo {
  code: string;
  message: string;
  status?: number;
  retryAfter?: number;
}

// Helper to get current date in Indian Standard Time (Asia/Kolkata)
export function getIndianStandardTimeDate(dateObj: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

interface TrainContextValue {
  selectedTrainNumber: string;
  setSelectedTrainNumber: (num: string) => void;
  journeyDate: string;
  setJourneyDate: (date: string) => void;
  currentISTDate: string;
  trainData: RailRadarLiveData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  apiError: ApiErrorInfo | null;
  isConfigured: boolean;
  isFallback: boolean;
  lastUpdated: Date | null;
  lastSuccessfulUpdate: Date | null;
  refreshInterval: number; // 0 = off, 30 = 30s, 60 = 60s, 120 = 2m
  setRefreshInterval: (sec: number) => void;
  refreshTrain: (forceAuthoritative?: boolean) => Promise<void>;
  calculated: TrainCalculationResult;
  searchTrain: (num: string, date?: string) => void;
  dismissError: () => void;
  // Real weather integration (Open-Meteo & RailPredict-derived risk)
  currentWeather: LiveWeatherData | null;
  weatherRisk: WeatherRiskAssessment | null;
  isWeatherLoading: boolean;
  weatherError: string | null;
  refreshWeather: () => Promise<void>;
}

const defaultCalculated: TrainCalculationResult = {
  timeline: [],
  delayEvolution: [],
  contributionFactors: [],
  recoveryCurve: [],
  bottleneckSections: [],
  p10: '--:--',
  p50: '--:--',
  p90: '--:--',
  expectedWindow: '--:--',
  mostLikelyArrival: '--:--',
  destinationName: '',
  destinationEta: '--:--',
  journeyProgressPct: 0,
  totalRecoveryMinutes: 0,
  totalDelayChange: 0,
  isApiProvidedLocation: false,
  isApiProvidedRoute: false,
  journeyState: 'NOT_STARTED',
  journeyStateLabel: 'NOT STARTED',
  scheduledDepartureTime: '--:--',
  scheduledDepartureStation: '',
  destinationScheduledArrival: '--:--',
  journeyDate: '',
};

const TrainContext = createContext<TrainContextValue | undefined>(undefined);

export function TrainProvider({ children }: { children: ReactNode }) {
  const currentISTDate = getIndianStandardTimeDate();
  // Requirement 2: NEVER use a default train such as 12625 unless the user actually selected 12625.
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string>('');
  const [journeyDate, setJourneyDate] = useState<string>(currentISTDate);
  const [trainData, setTrainData] = useState<RailRadarLiveData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<ApiErrorInfo | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<Date | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // 60s default auto-refresh

  // Real weather states (Open-Meteo & RailPredict-derived operational risk)
  const [currentWeather, setCurrentWeather] = useState<LiveWeatherData | null>(null);
  const [weatherRisk, setWeatherRisk] = useState<WeatherRiskAssessment | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const intervalTimerRef = useRef<any>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const activeFetchIdRef = useRef<number>(0);

  // Centralized weather fetcher using real coordinates strictly for the selected train
  const fetchWeatherForTrain = useCallback(async (train: RailRadarLiveData | null) => {
    if (!train) {
      setCurrentWeather(null);
      setWeatherRisk(null);
      setWeatherError(null);
      return;
    }

    const coords = extractCoordinatesFromTrain(train);
    if (!coords) {
      setCurrentWeather(null);
      setWeatherRisk(null);
      setWeatherError('Weather unavailable');
      console.log(
        `[RailPredict Weather Trace]\n` +
        `• Route Station: ${train.currentLocation?.stationName || train.currentLocation?.stationCode || 'N/A'}\n` +
        `• Weather Status: Weather unavailable (no coordinates resolved for this station)`
      );
      return;
    }

    // Requirement 10: Debug log for route station used for weather and Open-Meteo coordinates
    console.log(
      `[RailPredict Weather Trace]\n` +
      `• Route Station used for Weather: ${coords.stationName || coords.stationCode || 'N/A'}\n` +
      `• Latitude / Longitude used for Open-Meteo: ${coords.lat}, ${coords.lng}`
    );

    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchLiveWeather(coords.lat, coords.lng, coords.stationCode);
      setCurrentWeather(data);
      const risk = deriveWeatherRisk(data, train.status);
      setWeatherRisk(risk);
    } catch (err: any) {
      setWeatherError(err.message || 'Failed to fetch live weather from Open-Meteo.');
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Fetch train function with date, train validation, and centralized RailRadar cache layer
  const fetchTrain = useCallback(
    async (trainNum: string, targetDate?: string, authoritative = false) => {
      const cleanNum = trainNum.replace(/\D/g, '');
      if (!cleanNum || cleanNum.length < 4 || cleanNum.length > 5) {
        setApiError({
          code: 'INVALID_TRAIN_NUMBER',
          message: `Please enter a valid 4 or 5 digit train number.`,
          status: 400,
        });
        return;
      }

      const activeDate = targetDate || journeyDate || currentISTDate;
      const fetchId = ++activeFetchIdRef.current;

      // Throttle rapid manual clicks (minimum 1.5 seconds between calls unless forced)
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 1500 && !authoritative) {
        return;
      }
      lastFetchTimeRef.current = now;

      if (!trainData) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const result = await railradarService.fetchLiveTrain(cleanNum, activeDate, { authoritative });

        // Prevent race condition if another train was selected while fetching
        if (fetchId !== activeFetchIdRef.current) {
          return;
        }

        if (result.success && result.data) {
          // Requirement 7: Verify the API response belongs to the requested train & journey
          if (result.data.trainNumber && result.data.trainNumber !== cleanNum) {
            console.warn(`[RailPredict] Mismatched train response: expected ${cleanNum}, got ${result.data.trainNumber}`);
            return;
          }

          // Debug logging showing exact data trace
          const currentStation =
            result.data.currentLocation?.stationName ||
            result.data.currentLocation?.stationCode ||
            'N/A';
          console.log(
            `[RailPredict Live Trace]\n` +
            `• Selected train: ${cleanNum}\n` +
            `• Journey date: ${activeDate}\n` +
            `• RailRadar train number: ${result.data.trainNumber}\n` +
            `• RailRadar status: ${result.data.status}\n` +
            `• RailRadar currentLocation: ${JSON.stringify(result.data.currentLocation)}\n` +
            `• RailRadar current station: ${currentStation}\n` +
            `• RailRadar nextHalt: ${JSON.stringify(result.data.nextHalt)}\n` +
            `• RailRadar delayMinutes: ${result.data.delayMinutes}`
          );

          setTrainData(result.data);
          setApiError(null);
          setIsConfigured(true);
          setIsFallback(false);
          const updateTimestamp = result.lastUpdated || new Date();
          setLastUpdated(updateTimestamp);
          setLastSuccessfulUpdate(updateTimestamp);
        } else {
          // Under Requirement: If a fresh RailRadar request fails, DO NOT present previous response as live.
          setTrainData(null);

          const errCode = result.error?.code || `HTTP_${result.status}`;
          const errMsg =
            result.error?.message ||
            (result.status === 404
              ? `Train ${cleanNum} was not found on RailRadar or is not scheduled to run on ${activeDate}.`
              : result.status === 429
              ? `RailRadar rate limit reached. Auto-refresh paused momentarily.`
              : result.status === 409
              ? `Historical or stale data rejected: ${result.error?.message}`
              : `Unable to fetch live status for train ${cleanNum}.`);

          setApiError({
            code: errCode,
            message: errMsg,
            status: result.status,
            retryAfter: result.retryAfter,
          });

          // Check if key is unconfigured
          if (result.status === 401 && result.error?.code === 'AUTH_KEY_REQUIRED') {
            setIsConfigured(false);
          }
        }
      } catch (err: any) {
        if (fetchId !== activeFetchIdRef.current) return;
        setTrainData(null);
        setApiError({
          code: 'NETWORK_FAILURE',
          message:
            'Failed to connect to the railway telemetry server. Please check your connection.',
          status: 0,
        });
      } finally {
        if (fetchId === activeFetchIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [journeyDate, currentISTDate]
  );

  // Requirement: When the selected train or journey date changes, clear the previous train's data immediately
  useEffect(() => {
    if (selectedTrainNumber) {
      setTrainData(null);
      setCurrentWeather(null);
      setWeatherRisk(null);
      setWeatherError(null);
      setApiError(null);
      setIsLoading(true);
      // Use cached request initially to protect quota
      fetchTrain(selectedTrainNumber, journeyDate, false);
    } else {
      setTrainData(null);
      setIsLoading(false);
    }
  }, [selectedTrainNumber, journeyDate]);

  // Periodic refresh effect (no automatic retry storm during rate limit cooldown)
  useEffect(() => {
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }

    if (refreshInterval > 0 && selectedTrainNumber) {
      intervalTimerRef.current = setInterval(() => {
        // Prevent automatic retry storm if rate-limited
        if (railradarService.isCurrentlyRateLimited()) {
          return;
        }
        fetchTrain(selectedTrainNumber, journeyDate, false);
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [refreshInterval, selectedTrainNumber, journeyDate, fetchTrain]);

  // When user searches a new train, completely clear previous train state
  const searchTrain = (num: string, date?: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean) {
      setTrainData(null);
      setLastSuccessfulUpdate(null);
      setCurrentWeather(null);
      setWeatherRisk(null);
      setWeatherError(null);
      setApiError(null);
      setIsLoading(true);
      if (date && date !== journeyDate) {
        setJourneyDate(date);
      }
      setSelectedTrainNumber(clean);
    }
  };

  const refreshTrain = async (forceAuthoritative = true) => {
    // Manual Retry respects the 429 cooldown
    if (railradarService.isCurrentlyRateLimited()) {
      const status = railradarService.getRateLimitStatus();
      setApiError({
        code: 'RATE_LIMIT_COOLDOWN',
        message: `RailRadar rate limit cooldown active. Please wait ${status.retryAfterSeconds}s before retrying.`,
        status: 429,
        retryAfter: status.retryAfterSeconds,
      });
      return;
    }
    await fetchTrain(selectedTrainNumber, journeyDate, forceAuthoritative);
  };

  const dismissError = () => {
    setApiError(null);
  };

  // Automatically fetch weather when trainData updates
  useEffect(() => {
    if (trainData) {
      fetchWeatherForTrain(trainData);
    }
  }, [trainData, fetchWeatherForTrain]);

  const refreshWeather = async () => {
    await fetchWeatherForTrain(trainData);
  };

  // Derive calculated metrics from current train data using real derived weather risk
  const calculated = trainData
    ? processTrainCalculations(trainData, weatherRisk?.attributionFactor)
    : defaultCalculated;

  return (
    <TrainContext.Provider
      value={{
        selectedTrainNumber,
        setSelectedTrainNumber,
        journeyDate,
        setJourneyDate,
        currentISTDate,
        trainData,
        isLoading,
        isRefreshing,
        apiError,
        isConfigured,
        isFallback,
        lastUpdated,
        lastSuccessfulUpdate,
        refreshInterval,
        setRefreshInterval,
        refreshTrain,
        calculated,
        searchTrain,
        dismissError,
        currentWeather,
        weatherRisk,
        isWeatherLoading,
        weatherError,
        refreshWeather,
      }}
    >
      {children}
    </TrainContext.Provider>
  );
}

export function useTrainData() {
  const context = useContext(TrainContext);
  if (!context) {
    throw new Error('useTrainData must be used within a TrainProvider');
  }
  return context;
}
