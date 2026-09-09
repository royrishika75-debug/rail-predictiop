/**
 * RailwayDataService - Client Telemetry Layer
 * 
 * Manages live railway telemetry requests with:
 * - Dedicated RailRadar Telemetry Provider (https://railradar.in/api)
 * - In-flight promise deduplication
 * - In-memory client cache with TTL
 * - Rate-limit circuit breaking
 * - Last successful update tracking
 */

import type { LiveTrainApiResponse, RailRadarLiveData } from '../types/railradar';

export interface RateLimitStatus {
  isRateLimited: boolean;
  retryAfterSeconds: number;
  message?: string;
  rateLimitedUntil: number;
}

interface TrainCacheEntry {
  response: LiveTrainApiResponse;
  timestamp: number;
}

interface StationCacheEntry {
  data: any;
  timestamp: number;
}

export class RailwayDataService {
  private trainCache = new Map<string, TrainCacheEntry>();
  private stationCache = new Map<string, StationCacheEntry>();

  // In-flight request deduplication maps
  private inFlightTrains = new Map<string, Promise<LiveTrainApiResponse>>();
  private inFlightStations = new Map<string, Promise<any>>();

  // Cache configuration
  private readonly TRAIN_CACHE_TTL_MS = 60 * 1000; // 60-second cache for successful responses
  private readonly STATION_CACHE_TTL_MS = 90 * 1000; // 90 seconds

  // Rate-limit state tracker
  private rateLimitedUntil = 0;
  private lastRetryAfterSeconds = 30;
  private lastRateLimitMessage = '';

  // Last successful updates tracker per train
  private lastSuccessfulMap = new Map<
    string,
    { time: Date; lastUpdatedAt?: string; source?: string }
  >();

  /**
   * Check if the railway telemetry service is currently in a 429 rate-limited cooldown
   */
  public isCurrentlyRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil;
  }

  /**
   * Get current rate-limit cooldown details
   */
  public getRateLimitStatus(): RateLimitStatus {
    const remaining = Math.max(0, Math.ceil((this.rateLimitedUntil - Date.now()) / 1000));
    return {
      isRateLimited: this.isCurrentlyRateLimited(),
      retryAfterSeconds: remaining || this.lastRetryAfterSeconds,
      message: this.lastRateLimitMessage,
      rateLimitedUntil: this.rateLimitedUntil,
    };
  }

  /**
   * Clear the rate limit circuit breaker
   */
  public resetRateLimit(): void {
    this.rateLimitedUntil = 0;
    this.lastRetryAfterSeconds = 30;
    this.lastRateLimitMessage = '';
  }

  /**
   * Completely clear all client cached telemetry and reset any rate limit state
   */
  public clearAllCache(): void {
    this.trainCache.clear();
    this.stationCache.clear();
    this.betweenCache.clear();
    this.inFlightTrains.clear();
    this.inFlightStations.clear();
    this.inFlightBetween.clear();
    this.lastSuccessfulMap.clear();
    this.rateLimitedUntil = 0;
    this.lastRetryAfterSeconds = 30;
    this.lastRateLimitMessage = '';
  }

  /**
   * Get cached train response if within 60s TTL
   */
  public getCachedTrain(trainNumber: string, journeyDate: string): LiveTrainApiResponse | null {
    const cleanNum = trainNumber.trim();
    const cacheKey = `${cleanNum}_${journeyDate}`;
    const cached = this.trainCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.TRAIN_CACHE_TTL_MS) {
      return {
        ...cached.response,
        status: 200,
        lastUpdated: this.lastSuccessfulMap.get(cleanNum)?.time,
        meta: {
          ...cached.response.meta,
          cached: true,
        },
      };
    }
    return null;
  }

  /**
   * Get the timestamp of the last successful live data update for a train
   */
  public getLastSuccessfulUpdate(trainNumber: string): Date | null {
    const cleanNum = trainNumber.trim();
    return this.lastSuccessfulMap.get(cleanNum)?.time || null;
  }

  /**
   * Get the provider source of the last successful live data update
   */
  public getLastSuccessfulSource(trainNumber: string): string | null {
    const cleanNum = trainNumber.trim();
    return this.lastSuccessfulMap.get(cleanNum)?.source || null;
  }

  /**
   * Centralized method to fetch live train data with deduplication and 60-second caching.
   * Strictly one request per unique train number + journey date at a time.
   */
  public async fetchLiveTrain(
    trainNumber: string,
    journeyDate: string,
    options: { authoritative?: boolean; force?: boolean } = {}
  ): Promise<LiveTrainApiResponse> {
    const cleanNum = trainNumber.trim();
    const cacheKey = `${cleanNum}_${journeyDate}`;
    const now = Date.now();

    // 1. Check 60-second cache: return immediately if available and fresh
    const cached = this.trainCache.get(cacheKey);
    if (cached && (now - cached.timestamp < this.TRAIN_CACHE_TTL_MS)) {
      // If force requested but fetched less than 30s ago, still serve cache to avoid burst rate-limiting
      if (!options.force || (now - cached.timestamp < 30000)) {
        return {
          ...cached.response,
          status: 200,
          lastUpdated: this.lastSuccessfulMap.get(cleanNum)?.time,
          meta: {
            ...cached.response.meta,
            cached: true,
            cacheExpiresIn: Math.round((this.TRAIN_CACHE_TTL_MS - (now - cached.timestamp)) / 1000),
          },
        };
      }
    }

    // 2. Check 429 rate limit circuit breaker (minimum 30-second cooldown)
    if (this.isCurrentlyRateLimited()) {
      const remainingSec = Math.max(1, Math.ceil((this.rateLimitedUntil - now) / 1000));
      // Serve stale cache if available during cooldown
      if (cached) {
        return {
          ...cached.response,
          status: 200,
          lastUpdated: this.lastSuccessfulMap.get(cleanNum)?.time,
          meta: {
            ...cached.response.meta,
            cached: true,
            cooldownActive: true,
            cooldownRemaining: remainingSec,
          },
        };
      }
      return {
        success: false,
        status: 429,
        retryAfter: remainingSec,
        isConfigured: true,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message:
            this.lastRateLimitMessage ||
            `RailRadar rate limit reached. Cooldown active: please wait ${remainingSec}s before retrying.`,
        },
      };
    }

    // 3. Deduplicate in-flight requests: strictly one request per unique train number + journey date at a time
    const dedupeKey = `${cleanNum}_${journeyDate}`;
    const existingPromise = this.inFlightTrains.get(dedupeKey);
    if (existingPromise) {
      return existingPromise;
    }

    // 4. Create and execute single network request to backend proxy
    const isAuthoritative = Boolean(options.authoritative);
    const fetchPromise = (async (): Promise<LiveTrainApiResponse> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('date', journeyDate);
        queryParams.set('authoritative', isAuthoritative ? 'true' : 'false');
        queryParams.set('haltsOnly', 'true');
        queryParams.set('includeCoordinates', 'true');

        const res = await fetch(`/api/trains/${cleanNum}/live?${queryParams.toString()}`);
        const json: LiveTrainApiResponse = await res.json().catch(() => ({
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: 'Invalid response from railway telemetry proxy.',
          },
        }));

        if (res.status === 429) {
          const rawRetry = (json as any)?.error?.retryAfter || (json as any)?.retryAfter || 30;
          const retryAfter = Math.max(30, rawRetry); // Minimum 30-second cooldown
          this.rateLimitedUntil = Date.now() + retryAfter * 1000;
          this.lastRetryAfterSeconds = retryAfter;
          this.lastRateLimitMessage =
            json.error?.message ||
            `RailRadar rate limit reached. Cooldown active for ${retryAfter}s.`;

          return {
            success: false,
            status: 429,
            retryAfter,
            isConfigured: true,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: this.lastRateLimitMessage,
            },
          };
        }

        const updateTime = new Date();
        if (res.ok && json.success && json.data) {
          // Normalize source & provider on data
          const providerSource =
            json.data.source ||
            json.data.provider ||
            (json.meta as any)?.source ||
            'RailRadar';
          json.data.source = providerSource;
          json.data.provider = providerSource;

          // Record successful update
          const sourceLastUpdatedAt = json.data.lastUpdatedAt;
          this.lastSuccessfulMap.set(cleanNum, {
            time: updateTime,
            lastUpdatedAt: sourceLastUpdatedAt,
            source: providerSource,
          });

          // Cache fresh response for 60 seconds
          this.trainCache.set(cacheKey, {
            response: json,
            timestamp: Date.now(),
          });
        }

        return {
          ...json,
          status: res.status,
          lastUpdated: json.success ? updateTime : undefined,
        };
      } catch (err: any) {
        return {
          success: false,
          status: 0,
          error: {
            code: 'NETWORK_FAILURE',
            message: `Failed to connect to railway telemetry proxy: ${err.message || 'Network error'}`,
          },
        };
      } finally {
        this.inFlightTrains.delete(dedupeKey);
      }
    })();

    this.inFlightTrains.set(dedupeKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Centralized method to fetch live station telemetry with deduplication and caching.
   */
  public async fetchStationLive(
    stationCode: string,
    options: {
      hours?: number;
      force?: boolean;
      includeIntermediate?: boolean;
      authoritative?: boolean;
    } = {}
  ): Promise<any> {
    const cleanCode = stationCode.trim().toUpperCase();
    const hours = options.hours || 4;
    const includeIntermediate = options.includeIntermediate ?? false;
    const isAuthoritative = options.authoritative ?? false;
    const cacheKey = `${cleanCode}_${hours}_${includeIntermediate}_${isAuthoritative ? 'auth' : 'norm'}`;
    const now = Date.now();

    // Check rate-limit circuit breaker
    if (this.isCurrentlyRateLimited()) {
      const remainingSec = Math.max(1, Math.ceil((this.rateLimitedUntil - now) / 1000));
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Railway telemetry rate limit reached. Please wait ${remainingSec}s before refreshing.`,
        },
      };
    }

    // Return cached if valid
    const cached = this.stationCache.get(cacheKey);
    if (!options.force && cached && now - cached.timestamp < this.STATION_CACHE_TTL_MS) {
      return cached.data;
    }

    // Deduplicate in-flight station requests
    const existingPromise = this.inFlightStations.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch(
          `/api/stations/${cleanCode}/live?hours=${hours}${includeIntermediate ? '&includeIntermediate=true' : ''}${isAuthoritative ? '&authoritative=true' : ''}`
        );
        const json = await res.json().catch(() => ({
          success: false,
          error: { code: 'PARSE_ERROR', message: 'Failed to parse station response' },
        }));

        if (res.status === 429) {
          const retryAfter = json?.error?.retryAfter || 30;
          this.rateLimitedUntil = Date.now() + retryAfter * 1000;
          this.lastRetryAfterSeconds = retryAfter;
          this.lastRateLimitMessage =
            json?.error?.message ||
            `Railway API rate limit reached. Please wait ${retryAfter}s before refreshing.`;
        }

        if (res.ok && json.success) {
          this.stationCache.set(cacheKey, {
            data: json,
            timestamp: Date.now(),
          });
        }

        return json;
      } catch (err: any) {
        return {
          success: false,
          error: {
            code: 'NETWORK_FAILURE',
            message: `Failed to fetch station data: ${err.message || 'Network error'}`,
          },
        };
      } finally {
        this.inFlightStations.delete(cacheKey);
      }
    })();

    this.inFlightStations.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Invalidate cache for a specific train
   */
  public invalidateTrain(trainNumber: string, journeyDate?: string): void {
    const cleanNum = trainNumber.trim();
    if (journeyDate) {
      this.trainCache.delete(`${cleanNum}_${journeyDate}`);
    } else {
      for (const key of this.trainCache.keys()) {
        if (key.startsWith(`${cleanNum}_`)) {
          this.trainCache.delete(key);
        }
      }
    }
  }

  /**
   * Alias for invalidateTrain for backward compatibility
   */
  public invalidateTrainCache(trainNumber?: string): void {
    if (trainNumber) {
      this.invalidateTrain(trainNumber);
    } else {
      this.trainCache.clear();
    }
  }

  /**
   * Fetch XGBoost ETA prediction and extracted feature vector for a live train.
   * Leverages real RailRadar live telemetry and maintains baseline ETA independence.
   */
  public async fetchXgboostEtaPrediction(
    trainNumber: string,
    journeyDate: string,
    trainData?: RailRadarLiveData
  ): Promise<any> {
    try {
      if (trainData) {
        // Send existing live train data directly to avoid duplicate network fetching
        const res = await fetch('/api/predict/eta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainNumber, journeyDate, trainData }),
        });
        return await res.json();
      }

      // Query by trainNumber and journeyDate
      const res = await fetch(
        `/api/predict/eta?trainNumber=${encodeURIComponent(trainNumber)}&date=${encodeURIComponent(journeyDate)}`
      );
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'PREDICTION_CLIENT_ERROR',
          message: `Failed to query ETA prediction endpoint: ${err.message || 'Network error'}`,
        },
      };
    }
  }

  private betweenCache = new Map<string, { data: any; timestamp: number }>();
  private inFlightBetween = new Map<string, Promise<any>>();

  /**
   * Fetch real connecting trains between two stations using RailRadar API
   */
  public async fetchTrainsBetween(
    fromCode: string,
    toCode: string,
    journeyDate: string
  ): Promise<any> {
    const cleanFrom = fromCode.trim().toUpperCase();
    const cleanTo = toCode.trim().toUpperCase();
    const cacheKey = `${cleanFrom}_${cleanTo}_${journeyDate}`;
    const now = Date.now();

    // Check circuit breaker
    if (this.isCurrentlyRateLimited()) {
      const remainingSec = Math.max(1, Math.ceil((this.rateLimitedUntil - now) / 1000));
      return {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Railway telemetry rate limit reached. Please wait ${remainingSec}s before refreshing.`,
        },
      };
    }

    // Return cached if within TTL
    const cached = this.betweenCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.STATION_CACHE_TTL_MS) {
      return cached.data;
    }

    // Deduplicate in-flight
    const existing = this.inFlightBetween.get(cacheKey);
    if (existing) {
      return existing;
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch(
          `/api/trains/between/${encodeURIComponent(cleanFrom)}/${encodeURIComponent(cleanTo)}?date=${encodeURIComponent(journeyDate)}`
        );
        const json = await res.json().catch(() => ({
          success: false,
          error: { code: 'PARSE_ERROR', message: 'Failed to parse trains between response' },
        }));

        if (res.status === 429) {
          const retryAfter = json?.error?.retryAfter || 30;
          this.rateLimitedUntil = Date.now() + retryAfter * 1000;
          this.lastRetryAfterSeconds = retryAfter;
          this.lastRateLimitMessage =
            json?.error?.message ||
            `Railway API rate limit reached. Please wait ${retryAfter}s before refreshing.`;
        }

        if (res.ok && json.success) {
          this.betweenCache.set(cacheKey, {
            data: json,
            timestamp: Date.now(),
          });
        }

        return json;
      } catch (err: any) {
        return {
          success: false,
          error: {
            code: 'NETWORK_FAILURE',
            message: `Failed to fetch trains between: ${err.message || 'Network error'}`,
          },
        };
      } finally {
        this.inFlightBetween.delete(cacheKey);
      }
    })();

    this.inFlightBetween.set(cacheKey, fetchPromise);
    return fetchPromise;
  }
}

// Global singleton instance
export const railwayDataService = new RailwayDataService();
