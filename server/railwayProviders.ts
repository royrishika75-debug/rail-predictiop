/**
 * RailRadar Centralized Railway Data Layer
 * 
 * SOLE PROVIDER: RailRadar API (https://railradar.in/api)
 * All alternative and legacy railway providers (RapidAPI, RailKit, IndianRailApi)
 * have been completely removed.
 * 
 * Security: RAILRADAR_API_KEY is server-side only and never exposed.
 * Performance: 60-second response cache, in-flight request deduplication,
 * and 30-second circuit-breaker cooldown on HTTP 429.
 */

import dotenv from 'dotenv';
dotenv.config();

export interface NormalizedRouteStation {
  sequence: number;
  stationCode: string;
  stationName: string;
  isHalt: boolean;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  delayArrival: number | null;
  delayDeparture: number | null;
  status: 'departed' | 'arrived' | 'upcoming' | string;
  distance?: number;
  platform: string | null;
}

export interface NormalizedHalt {
  stationCode: string;
  stationName: string;
  sequence?: number;
  distance?: number;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  platform: string | null;
}

export interface NormalizedLocation {
  stationCode: string;
  stationName: string;
  sequence?: number;
  status?: string;
  isHalt?: boolean;
  isActualPosition?: boolean;
  segmentProgress?: number;
  speedKmh?: number | null;
}

export interface NormalizedTrainData {
  trainNumber: string;
  trainName: string;
  startDate: string; // Journey Date (YYYY-MM-DD)
  lastUpdatedAt: string;
  status: 'not-started' | 'running' | 'completed' | 'diverted' | 'cancelled' | string;
  delayMinutes: number;
  train: {
    number: string;
    name: string;
    type?: string;
    category?: string;
    source?: { code: string; name: string };
    destination?: { code: string; name: string };
    totalHalts?: number;
  };
  currentLocation: NormalizedLocation;
  previousHalt?: NormalizedHalt;
  nextHalt?: NormalizedHalt;
  route: NormalizedRouteStation[];
  platform: string | null;
  speed: number | null;
  isLive: boolean;
  source: 'RailRadar';
  provider: 'RailRadar';
  fetchedAt: string;
  requestedDate: string;
  currentISTDate: string;
  exceptions?: any[];
}

export interface ProviderResult {
  success: boolean;
  status: number;
  isConfigured?: boolean;
  data?: NormalizedTrainData;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
  meta?: {
    source: 'RailRadar';
    timestamp: string;
    cached?: boolean;
    cacheExpiresIn?: number;
    executionTime?: number;
    traceId?: string;
    requestedDate: string;
    currentISTDate: string;
  };
}

export interface StationBoardResult {
  success: boolean;
  status: number;
  data?: any;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
  meta?: {
    source: 'RailRadar';
    timestamp: string;
    cached?: boolean;
    cacheExpiresIn?: number;
  };
}

export interface TrainsBetweenResult {
  success: boolean;
  status: number;
  data?: any;
  error?: {
    code: string;
    message: string;
    retryAfter?: number;
  };
  meta?: {
    source: 'RailRadar';
    timestamp: string;
    cached?: boolean;
    cacheExpiresIn?: number;
  };
}

// Helper for Indian Standard Time string
export function getISTDateString(dateObj: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * RailRadar Provider: Direct client for official RailRadar API
 */
export class RailRadarProvider {
  readonly name = 'RailRadar';
  readonly id = 'railradar' as const;
  private readonly baseUrl = 'https://railradar.in/api';

  public isConfigured(): boolean {
    const key = process.env.RAILRADAR_API_KEY?.trim();
    return Boolean(key && key.length > 0);
  }

  private getApiKey(): string {
    return process.env.RAILRADAR_API_KEY?.trim() || '';
  }

  /**
   * 1. Live Train: GET /v1/trains/{number}/live
   */
  public async fetchLiveTrain(
    trainNumber: string,
    journeyDate: string,
    options: { authoritative?: boolean } = {}
  ): Promise<ProviderResult> {
    const apiKey = this.getApiKey();
    const currentISTDate = getISTDateString();

    if (!apiKey) {
      return {
        success: false,
        status: 401,
        error: {
          code: 'AUTH_KEY_REQUIRED',
          message: 'RailRadar API key (RAILRADAR_API_KEY) is not configured in server environment.',
        },
        meta: {
          source: 'RailRadar',
          timestamp: new Date().toISOString(),
          requestedDate: journeyDate,
          currentISTDate,
        },
      };
    }

    const queryParams = new URLSearchParams();
    queryParams.set('date', journeyDate);
    queryParams.set('authoritative', options.authoritative ? 'true' : 'false');
    queryParams.set('haltsOnly', 'true');
    queryParams.set('includeCoordinates', 'true');

    const url = `${this.baseUrl}/v1/trains/${trainNumber}/live?${queryParams.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
          'User-Agent': 'RailPredict-Backend/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const status = res.status;
      const json: any = await res.json().catch(() => null);

      if (!res.ok) {
        if (status === 429) {
          const retryHeader = res.headers.get('retry-after');
          const parsedSec = retryHeader ? parseInt(retryHeader, 10) : 30;
          const retryAfter = Math.max(30, Number.isFinite(parsedSec) ? parsedSec : 30);
          return {
            success: false,
            status: 429,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `RailRadar API rate limit reached. Please wait ${retryAfter} seconds.`,
              retryAfter,
            },
            meta: {
              source: 'RailRadar',
              timestamp: new Date().toISOString(),
              requestedDate: journeyDate,
              currentISTDate,
            },
          };
        }

        return {
          success: false,
          status,
          error: {
            code: json?.error?.code || 'UPSTREAM_API_ERROR',
            message: json?.error?.message || `RailRadar returned HTTP status ${status}.`,
          },
          meta: {
            source: 'RailRadar',
            timestamp: new Date().toISOString(),
            requestedDate: journeyDate,
            currentISTDate,
          },
        };
      }

      const rawData = json?.data || json;
      if (!rawData) {
        return {
          success: false,
          status: 502,
          error: {
            code: 'EMPTY_UPSTREAM_RESPONSE',
            message: 'RailRadar returned an empty payload.',
          },
        };
      }

      // Stale data check: verify response run date matches requested journey date
      if (rawData?.startDate && rawData.startDate !== journeyDate) {
        return {
          success: false,
          status: 409,
          error: {
            code: 'STALE_JOURNEY_DATA',
            message: `RailRadar returned telemetry for run date ${rawData.startDate} instead of requested journey date ${journeyDate}.`,
          },
        };
      }

      const nowIso = new Date().toISOString();
      const normalized: NormalizedTrainData = {
        trainNumber: String(rawData.trainNumber || rawData.train?.number || trainNumber),
        trainName: String(rawData.trainName || rawData.train?.name || `Train ${trainNumber}`),
        startDate: journeyDate,
        lastUpdatedAt: rawData.lastUpdatedAt || nowIso,
        status: String(rawData.status || 'running').toLowerCase(),
        delayMinutes: Number(rawData.delayMinutes) || 0,
        train: {
          number: String(rawData.train?.number || rawData.trainNumber || trainNumber),
          name: String(rawData.train?.name || rawData.trainName || `Train ${trainNumber}`),
          type: rawData.train?.type || 'EXPRESS',
          category: rawData.train?.category || 'Express',
          source: rawData.train?.source,
          destination: rawData.train?.destination,
          totalHalts: rawData.train?.totalHalts || rawData.route?.length || 0,
        },
        currentLocation: {
          stationCode: rawData.currentLocation?.stationCode || '',
          stationName: rawData.currentLocation?.stationName || '',
          sequence: rawData.currentLocation?.sequence,
          status: rawData.currentLocation?.status,
          isHalt: rawData.currentLocation?.isHalt ?? true,
          isActualPosition: rawData.currentLocation?.isActualPosition ?? true,
          speedKmh: rawData.currentLocation?.speedKmh ?? rawData.speed ?? null,
        },
        previousHalt: rawData.previousHalt
          ? {
              stationCode: rawData.previousHalt.stationCode || '',
              stationName: rawData.previousHalt.stationName || '',
              sequence: rawData.previousHalt.sequence,
              distance: rawData.previousHalt.distance,
              scheduledArrival: rawData.previousHalt.scheduledArrival || null,
              scheduledDeparture: rawData.previousHalt.scheduledDeparture || null,
              actualArrival: rawData.previousHalt.actualArrival || null,
              actualDeparture: rawData.previousHalt.actualDeparture || null,
              platform: rawData.previousHalt.platform || null,
            }
          : undefined,
        nextHalt: rawData.nextHalt
          ? {
              stationCode: rawData.nextHalt.stationCode || '',
              stationName: rawData.nextHalt.stationName || '',
              sequence: rawData.nextHalt.sequence,
              distance: rawData.nextHalt.distance,
              scheduledArrival: rawData.nextHalt.scheduledArrival || null,
              scheduledDeparture: rawData.nextHalt.scheduledDeparture || null,
              actualArrival: rawData.nextHalt.actualArrival || null,
              actualDeparture: rawData.nextHalt.actualDeparture || null,
              platform: rawData.nextHalt.platform || null,
            }
          : undefined,
        route: Array.isArray(rawData.route)
          ? rawData.route.map((r: any, idx: number) => ({
              sequence: r.sequence || idx + 1,
              stationCode: r.stationCode || '',
              stationName: r.stationName || '',
              isHalt: Boolean(r.isHalt ?? true),
              scheduledArrival: r.scheduledArrival || null,
              scheduledDeparture: r.scheduledDeparture || null,
              actualArrival: r.actualArrival || null,
              actualDeparture: r.actualDeparture || null,
              delayArrival: r.delayArrival ?? null,
              delayDeparture: r.delayDeparture ?? null,
              status: r.status || 'upcoming',
              distance: r.distance,
              platform: r.platform || null,
            }))
          : [],
        platform: rawData.platform || rawData.currentLocation?.platform || null,
        speed: rawData.speed ?? rawData.currentLocation?.speedKmh ?? null,
        isLive: true,
        source: 'RailRadar',
        provider: 'RailRadar',
        fetchedAt: nowIso,
        requestedDate: journeyDate,
        currentISTDate,
        exceptions: rawData.exceptions || [],
      };

      return {
        success: true,
        status: 200,
        isConfigured: true,
        data: normalized,
        meta: {
          source: 'RailRadar',
          timestamp: nowIso,
          cached: false,
          requestedDate: journeyDate,
          currentISTDate,
          executionTime: json?.meta?.executionTime,
          traceId: json?.meta?.traceId,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        status: isTimeout ? 504 : 502,
        error: {
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'NETWORK_FAILURE',
          message: isTimeout
            ? 'RailRadar API timed out after 12 seconds.'
            : `Failed to connect to RailRadar: ${err.message || 'Network error'}`,
        },
        meta: {
          source: 'RailRadar',
          timestamp: new Date().toISOString(),
          requestedDate: journeyDate,
          currentISTDate,
        },
      };
    }
  }

  /**
   * 2. Live Station Board: GET /v1/stations/{code}/live
   */
  public async fetchLiveStation(
    stationCode: string,
    options: { hours?: number; includeIntermediate?: boolean; authoritative?: boolean } = {}
  ): Promise<StationBoardResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        status: 401,
        error: {
          code: 'AUTH_KEY_REQUIRED',
          message: 'RailRadar API key (RAILRADAR_API_KEY) is not configured in server environment.',
        },
      };
    }

    const hours = Math.min(8, Math.max(1, options.hours || 4));
    const query = new URLSearchParams({
      hours: String(hours),
      includeIntermediate: options.includeIntermediate ? 'true' : 'false',
    });
    if (options.authoritative) query.set('authoritative', 'true');

    const url = `${this.baseUrl}/v1/stations/${encodeURIComponent(stationCode)}/live?${query.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
          'User-Agent': 'RailPredict-Backend/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const status = res.status;
      const json: any = await res.json().catch(() => null);

      if (!res.ok) {
        if (status === 429) {
          const retryHeader = res.headers.get('retry-after');
          const parsedSec = retryHeader ? parseInt(retryHeader, 10) : 30;
          const retryAfter = Math.max(30, Number.isFinite(parsedSec) ? parsedSec : 30);
          return {
            success: false,
            status: 429,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `RailRadar API rate limit reached. Please wait ${retryAfter} seconds.`,
              retryAfter,
            },
          };
        }

        return {
          success: false,
          status,
          error: {
            code: json?.error?.code || 'STATION_API_ERROR',
            message: json?.error?.message || `RailRadar returned HTTP ${status} for station ${stationCode}.`,
          },
        };
      }

      return {
        success: true,
        status: 200,
        data: json?.data || json,
        meta: {
          source: 'RailRadar',
          timestamp: new Date().toISOString(),
          cached: false,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        status: isTimeout ? 504 : 502,
        error: {
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'NETWORK_FAILURE',
          message: isTimeout
            ? 'RailRadar station query timed out.'
            : `Failed to connect to RailRadar: ${err.message || 'Network error'}`,
        },
      };
    }
  }

  /**
   * 3. Trains Between Stations: GET /v1/trains/between/{from}/{to}?date={date}&live=true
   */
  public async fetchTrainsBetween(
    fromCode: string,
    toCode: string,
    journeyDate: string
  ): Promise<TrainsBetweenResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        status: 401,
        error: {
          code: 'AUTH_KEY_REQUIRED',
          message: 'RailRadar API key (RAILRADAR_API_KEY) is not configured in server environment.',
        },
      };
    }

    const query = new URLSearchParams({
      date: journeyDate,
      live: 'true',
    });

    const url = `${this.baseUrl}/v1/trains/between/${encodeURIComponent(fromCode)}/${encodeURIComponent(toCode)}?${query.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
          'User-Agent': 'RailPredict-Backend/1.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const status = res.status;
      const json: any = await res.json().catch(() => null);

      if (!res.ok) {
        if (status === 429) {
          const retryHeader = res.headers.get('retry-after');
          const parsedSec = retryHeader ? parseInt(retryHeader, 10) : 30;
          const retryAfter = Math.max(30, Number.isFinite(parsedSec) ? parsedSec : 30);
          return {
            success: false,
            status: 429,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `RailRadar API rate limit reached. Please wait ${retryAfter} seconds.`,
              retryAfter,
            },
          };
        }

        return {
          success: false,
          status,
          error: {
            code: json?.error?.code || 'TRAINS_BETWEEN_API_ERROR',
            message: json?.error?.message || `RailRadar returned HTTP ${status} for route ${fromCode} → ${toCode}.`,
          },
        };
      }

      return {
        success: true,
        status: 200,
        data: json?.data || json,
        meta: {
          source: 'RailRadar',
          timestamp: new Date().toISOString(),
          cached: false,
        },
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      return {
        success: false,
        status: isTimeout ? 504 : 502,
        error: {
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'NETWORK_FAILURE',
          message: isTimeout
            ? 'RailRadar route query timed out.'
            : `Failed to connect to RailRadar: ${err.message || 'Network error'}`,
        },
      };
    }
  }
}

/**
 * Centralized Server Railway Service
 * Ensures:
 * - RailRadar is the ONLY railway data provider
 * - In-flight request deduplication across simultaneous requests
 * - 60-second successful response caching
 * - 30-second minimum cooldown on 429 rate limit
 * - Strict server-side secret handling
 */
export class ServerRailwayService {
  private readonly provider = new RailRadarProvider();

  // 60-second in-memory caches
  private readonly trainCache = new Map<string, { data: ProviderResult; timestamp: number }>();
  private readonly stationCache = new Map<string, { data: StationBoardResult; timestamp: number }>();
  private readonly betweenCache = new Map<string, { data: TrainsBetweenResult; timestamp: number }>();

  private readonly CACHE_TTL_MS = 60 * 1000; // 60 seconds

  // In-flight deduplication maps
  private readonly inFlightTrains = new Map<string, Promise<ProviderResult>>();
  private readonly inFlightStations = new Map<string, Promise<StationBoardResult>>();
  private readonly inFlightBetween = new Map<string, Promise<TrainsBetweenResult>>();

  // Circuit breaker state
  private rateLimitedUntil = 0;
  private lastRetryAfterSeconds = 30;

  public isConfigured(): boolean {
    return this.provider.isConfigured();
  }

  public isRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil;
  }

  public getCooldownRemaining(): number {
    const rem = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
    return Math.max(0, rem);
  }

  public recordRateLimit(seconds = 30): void {
    const cooldown = Math.max(30, seconds);
    this.rateLimitedUntil = Date.now() + cooldown * 1000;
    this.lastRetryAfterSeconds = cooldown;
  }

  public clearCache(): void {
    this.trainCache.clear();
    this.stationCache.clear();
    this.betweenCache.clear();
    this.inFlightTrains.clear();
    this.inFlightStations.clear();
    this.inFlightBetween.clear();
    this.rateLimitedUntil = 0;
    this.lastRetryAfterSeconds = 30;
  }

  /**
   * Get Live Train Telemetry (GET /v1/trains/{number}/live)
   */
  public async getLiveTrain(
    trainNumber: string,
    journeyDate: string,
    options: { authoritative?: boolean } = {}
  ): Promise<ProviderResult> {
    const cleanNum = trainNumber.trim();
    const cacheKey = `${cleanNum}_${journeyDate}`;

    // 1. Check 60-second cache (unless authoritative bypass requested)
    if (!options.authoritative) {
      const cached = this.trainCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        const expiresIn = Math.max(1, Math.round((this.CACHE_TTL_MS - (Date.now() - cached.timestamp)) / 1000));
        return {
          ...cached.data,
          meta: {
            ...cached.data.meta!,
            cached: true,
            cacheExpiresIn: expiresIn,
          },
        };
      }
    }

    // 2. Circuit Breaker Check
    if (this.isRateLimited()) {
      const cooldownSec = this.getCooldownRemaining();
      // Try serving existing cache regardless of age during cooldown
      const existing = this.trainCache.get(cacheKey);
      if (existing) {
        return {
          ...existing.data,
          meta: {
            ...existing.data.meta!,
            cached: true,
            cacheExpiresIn: 0,
          },
        };
      }
      return {
        success: false,
        status: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `RailRadar API cooldown active. Please wait ${cooldownSec} seconds before retrying.`,
          retryAfter: cooldownSec,
        },
      };
    }

    // 3. In-flight Deduplication
    let pending = this.inFlightTrains.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        try {
          const result = await this.provider.fetchLiveTrain(cleanNum, journeyDate, options);

          if (result.status === 429) {
            this.recordRateLimit(result.error?.retryAfter || 30);
          } else if (result.success && result.data) {
            this.trainCache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
            });
          }
          return result;
        } finally {
          this.inFlightTrains.delete(cacheKey);
        }
      })();
      this.inFlightTrains.set(cacheKey, pending);
    }

    return await pending;
  }

  /**
   * Get Live Station Board (GET /v1/stations/{code}/live)
   */
  public async getLiveStation(
    stationCode: string,
    options: { hours?: number; includeIntermediate?: boolean; authoritative?: boolean } = {}
  ): Promise<StationBoardResult> {
    const cleanCode = stationCode.trim().toUpperCase();
    const hours = options.hours || 4;
    const cacheKey = `${cleanCode}_${hours}_${Boolean(options.includeIntermediate)}`;

    // 1. Check 60-second cache
    if (!options.authoritative) {
      const cached = this.stationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        const expiresIn = Math.max(1, Math.round((this.CACHE_TTL_MS - (Date.now() - cached.timestamp)) / 1000));
        return {
          ...cached.data,
          meta: {
            ...cached.data.meta!,
            cached: true,
            cacheExpiresIn: expiresIn,
          },
        };
      }
    }

    // 2. Circuit Breaker Check
    if (this.isRateLimited()) {
      const cooldownSec = this.getCooldownRemaining();
      const existing = this.stationCache.get(cacheKey);
      if (existing) {
        return {
          ...existing.data,
          meta: {
            ...existing.data.meta!,
            cached: true,
            cacheExpiresIn: 0,
          },
        };
      }
      return {
        success: false,
        status: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `RailRadar API cooldown active. Please wait ${cooldownSec} seconds.`,
          retryAfter: cooldownSec,
        },
      };
    }

    // 3. In-flight Deduplication
    let pending = this.inFlightStations.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        try {
          const result = await this.provider.fetchLiveStation(cleanCode, options);

          if (result.status === 429) {
            this.recordRateLimit(result.error?.retryAfter || 30);
          } else if (result.success && result.data) {
            this.stationCache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
            });
          }
          return result;
        } finally {
          this.inFlightStations.delete(cacheKey);
        }
      })();
      this.inFlightStations.set(cacheKey, pending);
    }

    return await pending;
  }

  /**
   * Get Trains Between Stations (GET /v1/trains/between/{from}/{to})
   */
  public async getTrainsBetween(
    fromCode: string,
    toCode: string,
    journeyDate: string
  ): Promise<TrainsBetweenResult> {
    const cleanFrom = fromCode.trim().toUpperCase();
    const cleanTo = toCode.trim().toUpperCase();
    const cacheKey = `${cleanFrom}_${cleanTo}_${journeyDate}`;

    // 1. Check 60-second cache
    const cached = this.betweenCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      const expiresIn = Math.max(1, Math.round((this.CACHE_TTL_MS - (Date.now() - cached.timestamp)) / 1000));
      return {
        ...cached.data,
        meta: {
          ...cached.data.meta!,
          cached: true,
          cacheExpiresIn: expiresIn,
        },
      };
    }

    // 2. Circuit Breaker Check
    if (this.isRateLimited()) {
      const cooldownSec = this.getCooldownRemaining();
      const existing = this.betweenCache.get(cacheKey);
      if (existing) {
        return {
          ...existing.data,
          meta: {
            ...existing.data.meta!,
            cached: true,
            cacheExpiresIn: 0,
          },
        };
      }
      return {
        success: false,
        status: 429,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `RailRadar API cooldown active. Please wait ${cooldownSec} seconds.`,
          retryAfter: cooldownSec,
        },
      };
    }

    // 3. In-flight Deduplication
    let pending = this.inFlightBetween.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        try {
          const result = await this.provider.fetchTrainsBetween(cleanFrom, cleanTo, journeyDate);

          if (result.status === 429) {
            this.recordRateLimit(result.error?.retryAfter || 30);
          } else if (result.success && result.data) {
            this.betweenCache.set(cacheKey, {
              data: result,
              timestamp: Date.now(),
            });
          }
          return result;
        } finally {
          this.inFlightBetween.delete(cacheKey);
        }
      })();
      this.inFlightBetween.set(cacheKey, pending);
    }

    return await pending;
  }
}

// Global Singleton Instance
export const serverRailwayService = new ServerRailwayService();
