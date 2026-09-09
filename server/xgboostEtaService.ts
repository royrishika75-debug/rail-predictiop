/**
 * XGBoost ETA Prediction & Feature Extraction Service
 * 
 * Pipeline:
 * RailRadar Live Data → Feature Extraction → XGBoost ETA Model Interface → ETA Forecast
 * 
 * NOTE ON ML MODEL ARTIFACT:
 * Real features are extracted from genuine RailRadar live train telemetry.
 * If a trained XGBoost model file (booster JSON/ONNX) and training dataset
 * are not present in the workspace, this service explicitly flags
 * `isMlInference: false` and status `MODEL_ARTIFACT_MISSING`. It DOES NOT
 * fake or simulate ML predictions. RailRadar live ETA serves as the independent baseline.
 */

import fs from 'fs';
import path from 'path';
import type { RailRadarLiveData, RailRadarRouteStop } from '../src/types/railradar';

export interface EtaFeatureVector {
  // Identification & Temporal
  train_number: string;
  train_number_numeric: number;
  journey_date: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  departure_hour_ist: number; // 0-23
  
  // Operational Status
  status: string;
  current_delay_minutes: number;
  speed_kmh: number | null;
  
  // Spatial & Network Positions
  current_station_code: string;
  current_station_name: string;
  current_sequence: number;
  next_station_code: string;
  next_station_name: string;
  next_station_distance_km: number | null;
  destination_station_code: string;
  destination_station_name: string;
  
  // Topological & Progress Metrics
  total_halts_count: number;
  remaining_halts_count: number;
  distance_covered_km: number;
  distance_remaining_km: number;
  total_route_distance_km: number;
  route_completion_ratio: number; // 0.0 to 1.0
  scheduled_remaining_duration_min: number;
  
  // Categorical & Train Metadata
  train_type: string;
  train_category: string;
}

export interface EtaPredictionResponse {
  success: boolean;
  trainNumber: string;
  journeyDate: string;
  trainName: string;
  status: string;
  
  // 1. Independent RailRadar Live Baseline
  baseline: {
    source: 'RailRadar';
    currentDelayMinutes: number;
    destinationScheduledArrival: string;
    destinationExpectedArrival: string;
    liveEta: string;
    nextHaltEta: string;
    description: string;
  };
  
  // 2. XGBoost Prediction State
  xgboost: {
    status: 'READY' | 'MODEL_ARTIFACT_MISSING' | 'INFERENCE_FAILED';
    modelName: string;
    modelVersion: string;
    isMlInference: boolean;
    predictedDelayMinutes: number | null;
    predictedEta: string | null;
    confidenceScore: number | null;
    featureCount: number;
    message: string;
    missingArtifacts?: string[];
  };
  
  // 3. Extracted Feature Vector for Model Input
  features: EtaFeatureVector;
  
  meta: {
    timestamp: string;
    source: string;
    executionTimeMs: number;
  };
}

// Helper: parse HH:MM or ISO time to total minutes from midnight
function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  if (timeStr.includes('T')) {
    try {
      const d = new Date(timeStr);
      if (!isNaN(d.getTime())) {
        return d.getHours() * 60 + d.getMinutes();
      }
    } catch {
      // fallback
    }
  }
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
}

// Helper: add minutes to HH:MM string
function addMinutesToHHMM(timeStr: string, minutes: number): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const total = (mins + Math.round(minutes) + 1440 * 2) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Helper: format date / time to HH:MM
function formatTimeHHMM(timeStr?: string | null): string {
  if (!timeStr) return '--:--';
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return timeStr;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export class XgboostEtaService {
  private modelPath: string | null = null;
  private isModelLoaded = false;
  private modelWeights: any = null;

  constructor() {
    this.checkModelArtifactAvailability();
  }

  /**
   * Check whether a trained XGBoost model artifact (JSON/UBJ/ONNX) is present.
   */
  public checkModelArtifactAvailability(): { available: boolean; path: string | null } {
    const candidatePaths = [
      process.env.XGBOOST_MODEL_PATH,
      path.join(process.cwd(), 'models', 'xgboost_eta_model.json'),
      path.join(process.cwd(), 'models', 'xgboost_eta_model.ubj'),
      path.join(process.cwd(), 'models', 'xgboost_eta_model.bin'),
      path.join(process.cwd(), 'models', 'xgboost_eta.onnx'),
    ].filter(Boolean) as string[];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        this.modelPath = p;
        this.isModelLoaded = true;
        try {
          if (p.endsWith('.json')) {
            this.modelWeights = JSON.parse(fs.readFileSync(p, 'utf-8'));
          }
        } catch {
          // ignore parsing error
        }
        return { available: true, path: p };
      }
    }

    this.modelPath = null;
    this.isModelLoaded = false;
    return { available: false, path: null };
  }

  /**
   * Feature Extraction: Transforms genuine RailRadar live train telemetry
   * into a standardized numerical and categorical feature vector for XGBoost.
   */
  public extractFeatures(data: RailRadarLiveData): EtaFeatureVector {
    const route = Array.isArray(data.route) ? data.route : [];
    const halts = route.filter((r) => r.isHalt);
    const activeRoute = halts.length > 0 ? halts : route;
    
    const trainNumStr = String(data.trainNumber || data.train?.number || '0').replace(/\D/g, '');
    const trainNumNumeric = parseInt(trainNumStr, 10) || 0;
    
    const journeyDateStr = data.startDate || data.requestedDate || '';
    let dayOfWeek = 0;
    if (journeyDateStr) {
      const d = new Date(journeyDateStr + 'T00:00:00Z');
      if (!isNaN(d.getTime())) {
        dayOfWeek = d.getUTCDay();
      }
    }

    const currLoc = data.currentLocation;
    const currSeq = currLoc?.sequence || 0;
    const currDelay = Number(data.delayMinutes) || 0;

    const originHalt = activeRoute[0];
    const destHalt = activeRoute.length > 0 ? activeRoute[activeRoute.length - 1] : undefined;

    const originDepTime = originHalt?.scheduledDeparture || originHalt?.scheduledArrival;
    const originDepMinutes = parseTimeToMinutes(originDepTime);
    const departureHour = originDepMinutes !== null ? Math.floor(originDepMinutes / 60) : 0;

    // Distances
    const totalDistance = destHalt?.distance || 0;
    let coveredDistance = 0;
    let remainingDistance = totalDistance;
    let remainingHaltsCount = 0;

    // Locate current halt index in activeRoute
    const currIdx = activeRoute.findIndex(
      (s) => (currLoc?.stationCode && s.stationCode === currLoc.stationCode) || (currSeq > 0 && s.sequence === currSeq)
    );

    if (currIdx !== -1) {
      coveredDistance = activeRoute[currIdx].distance || 0;
      remainingDistance = Math.max(0, totalDistance - coveredDistance);
      remainingHaltsCount = Math.max(0, activeRoute.length - 1 - currIdx);
    } else {
      // Approximate from sequence ratio
      const seqRatio = activeRoute.length > 0 ? Math.min(1, Math.max(0, currSeq / activeRoute.length)) : 0;
      coveredDistance = Math.round(totalDistance * seqRatio);
      remainingDistance = Math.max(0, totalDistance - coveredDistance);
      remainingHaltsCount = Math.max(0, activeRoute.length - currSeq);
    }

    const completionRatio = totalDistance > 0 ? Math.min(1, Math.max(0, coveredDistance / totalDistance)) : 0;

    // Scheduled remaining duration
    let scheduledRemainingMin = 0;
    if (currIdx !== -1 && destHalt) {
      const currentSchedMin = parseTimeToMinutes(activeRoute[currIdx].scheduledDeparture || activeRoute[currIdx].scheduledArrival);
      const destSchedMin = parseTimeToMinutes(destHalt.scheduledArrival);
      if (currentSchedMin !== null && destSchedMin !== null) {
        scheduledRemainingMin = destSchedMin >= currentSchedMin
          ? destSchedMin - currentSchedMin
          : (destSchedMin + 1440) - currentSchedMin;
      }
    }

    const nextHalt = data.nextHalt;

    return {
      train_number: trainNumStr,
      train_number_numeric: trainNumNumeric,
      journey_date: journeyDateStr,
      day_of_week: dayOfWeek,
      departure_hour_ist: departureHour,
      
      status: data.status || 'running',
      current_delay_minutes: currDelay,
      speed_kmh: currLoc?.speedKmh ?? null,
      
      current_station_code: currLoc?.stationCode || data.previousHalt?.stationCode || '',
      current_station_name: currLoc?.stationName || data.previousHalt?.stationName || 'In Transit',
      current_sequence: currSeq,
      
      next_station_code: nextHalt?.stationCode || '',
      next_station_name: nextHalt?.stationName || '',
      next_station_distance_km: nextHalt?.distance ?? null,
      
      destination_station_code: destHalt?.stationCode || data.train?.destination?.code || '',
      destination_station_name: destHalt?.stationName || data.train?.destination?.name || '',
      
      total_halts_count: activeRoute.length,
      remaining_halts_count: remainingHaltsCount,
      distance_covered_km: coveredDistance,
      distance_remaining_km: remainingDistance,
      total_route_distance_km: totalDistance,
      route_completion_ratio: Math.round(completionRatio * 1000) / 1000,
      scheduled_remaining_duration_min: scheduledRemainingMin,
      
      train_type: data.train?.type || 'EXPRESS',
      train_category: data.train?.category || 'Express',
    };
  }

  /**
   * RailRadar Live Baseline:
   * Returns destination ETA calculated purely from official schedule + live reported delay.
   * Completely decoupled from any ML layer.
   */
  public computeRailRadarBaseline(data: RailRadarLiveData) {
    const route = Array.isArray(data.route) ? data.route : [];
    const destStop = route.length > 0 ? route[route.length - 1] : undefined;
    
    const schedArrival = formatTimeHHMM(destStop?.scheduledArrival || destStop?.scheduledDeparture);
    const delay = Number(data.delayMinutes) || 0;
    
    // Direct official expected time if provided by RailRadar
    const directExpected = (destStop as any)?.expectedArrival || (destStop as any)?.eta || (data as any)?.destinationEta;
    
    let destinationExpectedArrival = '--:--';
    if (directExpected) {
      destinationExpectedArrival = formatTimeHHMM(directExpected);
    } else if (schedArrival !== '--:--') {
      destinationExpectedArrival = addMinutesToHHMM(schedArrival, Math.max(0, delay));
    }

    // Next halt baseline ETA
    let nextHaltEta = '--:--';
    if (data.nextHalt) {
      const nextSched = formatTimeHHMM(data.nextHalt.scheduledArrival || data.nextHalt.scheduledDeparture);
      if (nextSched !== '--:--') {
        nextHaltEta = addMinutesToHHMM(nextSched, Math.max(0, delay));
      }
    }

    return {
      source: 'RailRadar' as const,
      currentDelayMinutes: delay,
      destinationScheduledArrival: schedArrival,
      destinationExpectedArrival,
      liveEta: destinationExpectedArrival,
      nextHaltEta,
      description: 'RailRadar live schedule & current telemetry baseline',
    };
  }

  /**
   * Predict ETA: Runs feature extraction and either invokes XGBoost
   * or explicitly reports MODEL_ARTIFACT_MISSING with the baseline.
   */
  public async predictEta(data: RailRadarLiveData): Promise<EtaPredictionResponse> {
    const startTime = Date.now();
    const features = this.extractFeatures(data);
    const baseline = this.computeRailRadarBaseline(data);

    const artifactCheck = this.checkModelArtifactAvailability();

    if (!artifactCheck.available) {
      // Explicitly report missing model without pretending to have run ML inference
      return {
        success: true,
        trainNumber: features.train_number,
        journeyDate: features.journey_date,
        trainName: data.trainName || data.train?.name || `Train ${features.train_number}`,
        status: data.status || 'running',
        baseline,
        xgboost: {
          status: 'MODEL_ARTIFACT_MISSING',
          modelName: 'XGBoost Regressor (ETA)',
          modelVersion: 'unloaded',
          isMlInference: false,
          predictedDelayMinutes: null,
          predictedEta: null,
          confidenceScore: null,
          featureCount: Object.keys(features).length,
          message:
            'Features successfully extracted from live RailRadar telemetry. Trained XGBoost model artifact is not currently loaded in the repository.',
          missingArtifacts: [
            'Trained XGBoost model weights (e.g. models/xgboost_eta_model.json or models/xgboost_eta.onnx)',
            'Historical Indian Railways NTES delay dataset with section clearance times for training',
            'Pre-computed scaler / one-hot feature encoding map for station categorical features',
          ],
        },
        features,
        meta: {
          timestamp: new Date().toISOString(),
          source: 'RailRadar + XGBoost Feature Extraction Layer',
          executionTimeMs: Date.now() - startTime,
        },
      };
    }

    // When trained model artifact is plugged in:
    try {
      const mlPrediction = await this.executeBoosterInference(features);
      return {
        success: true,
        trainNumber: features.train_number,
        journeyDate: features.journey_date,
        trainName: data.trainName || data.train?.name || `Train ${features.train_number}`,
        status: data.status || 'running',
        baseline,
        xgboost: {
          status: 'READY',
          modelName: 'XGBoost Regressor (ETA)',
          modelVersion: 'V2.1',
          isMlInference: true,
          predictedDelayMinutes: mlPrediction.predictedDelayMinutes,
          predictedEta: mlPrediction.predictedEta,
          confidenceScore: mlPrediction.confidenceScore,
          featureCount: Object.keys(features).length,
          message: 'ETA generated via trained XGBoost booster inference.',
        },
        features,
        meta: {
          timestamp: new Date().toISOString(),
          source: 'RailRadar + XGBoost Live Inference',
          executionTimeMs: Date.now() - startTime,
        },
      };
    } catch (err: any) {
      return {
        success: true,
        trainNumber: features.train_number,
        journeyDate: features.journey_date,
        trainName: data.trainName || data.train?.name || `Train ${features.train_number}`,
        status: data.status || 'running',
        baseline,
        xgboost: {
          status: 'INFERENCE_FAILED',
          modelName: 'XGBoost Regressor (ETA)',
          modelVersion: 'unknown',
          isMlInference: false,
          predictedDelayMinutes: null,
          predictedEta: null,
          confidenceScore: null,
          featureCount: Object.keys(features).length,
          message: `Inference execution error: ${err.message || 'Unknown error'}. Falling back to baseline.`,
        },
        features,
        meta: {
          timestamp: new Date().toISOString(),
          source: 'RailRadar Baseline Fallback',
          executionTimeMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Real XGBoost inference execution placeholder.
   * Invoked once model weights file is present.
   */
  private async executeBoosterInference(features: EtaFeatureVector): Promise<{
    predictedDelayMinutes: number;
    predictedEta: string;
    confidenceScore: number;
  }> {
    // If JSON model exists, parse trees or call native/onnx runtime
    throw new Error('XGBoost runtime execution requires compiled model binary.');
  }
}

export const xgboostEtaService = new XgboostEtaService();
