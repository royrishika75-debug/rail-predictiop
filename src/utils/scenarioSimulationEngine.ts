/**
 * RailPredict Common Scenario Simulation Engine
 *
 * Implements deterministic operational simulation for What-If scenarios:
 * 1. Signal / Block Restriction
 * 2. Route Congestion
 * 3. Preceding Train Delay
 * 4. Unscheduled Maintenance Block
 * 5. Level Crossing Delay
 *
 * Sourced strictly from REAL RailRadar live telemetry as baseline.
 * All scenario outputs are DERIVED locally without altering live state.
 */

import type { RailRadarLiveData, RailRadarRouteStation } from '../types/railradar';

export type ScenarioType =
  | 'signal_block'
  | 'congestion'
  | 'preceding_train'
  | 'maintenance_block'
  | 'level_crossing';

export type CongestionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ScenarioDefinition {
  type: ScenarioType;
  title: string;
  shortLabel: string;
  badge: string;
  description: string;
  delayOptions: number[];
  defaultDelay: number;
  delayUnit: string;
}

export const SCENARIO_DEFINITIONS: Record<ScenarioType, ScenarioDefinition> = {
  signal_block: {
    type: 'signal_block',
    title: 'Signal / Block Restriction',
    shortLabel: 'Signal / Block',
    badge: 'Signaling',
    description:
      'Models automatic or absolute block section failure, red/caution aspect holding, and headway disruption.',
    delayOptions: [5, 10, 15, 20, 30],
    defaultDelay: 15,
    delayUnit: 'min',
  },
  congestion: {
    type: 'congestion',
    title: 'Route Congestion',
    shortLabel: 'Congestion',
    badge: 'Traffic Density',
    description:
      'Models increased running time across heavily loaded track sections, speed restrictions, and junction queues.',
    delayOptions: [8, 15, 25, 40],
    defaultDelay: 15,
    delayUnit: 'min',
  },
  preceding_train: {
    type: 'preceding_train',
    title: 'Preceding Train Delay',
    shortLabel: 'Preceding Train',
    badge: 'Headway Regulation',
    description:
      'Models knock-on operational impact caused by a delayed preceding service occupying the same block corridor.',
    delayOptions: [5, 10, 20, 30],
    defaultDelay: 10,
    delayUnit: 'min',
  },
  maintenance_block: {
    type: 'maintenance_block',
    title: 'Unscheduled Maintenance Block',
    shortLabel: 'Maintenance Block',
    badge: 'Track Block',
    description:
      'Models temporary route occupation for emergency track, OHE overhead wire, or point-machine maintenance.',
    delayOptions: [15, 30, 60, 120],
    defaultDelay: 30,
    delayUnit: 'min',
  },
  level_crossing: {
    type: 'level_crossing',
    title: 'Level Crossing Delay',
    shortLabel: 'LC Gate Delay',
    badge: 'Interlock / LC',
    description:
      'Models unexpected interlocked or non-interlocked level crossing gate closure delays and clearance holding.',
    delayOptions: [5, 10, 15, 20],
    defaultDelay: 10,
    delayUnit: 'min',
  },
};

export interface ScenarioInputs {
  scenarioType: ScenarioType;
  locationCode: string;
  delayMinutes: number;
  congestionSeverity?: CongestionSeverity;
  precedingDelayMinutes?: number;
  maintenanceDurationMinutes?: number;
  gateDelayMinutes?: number;
}

export interface SimulationBaseline {
  trainNumber: string;
  trainName: string;
  currentDelay: number;
  destinationCode: string;
  destinationName: string;
  destinationScheduledArrival: string;
  destinationExpectedArrival: string;
  currentStatus: string;
  currentStationName: string;
  totalRemainingHalts: number;
}

export interface SimulatedStationTimelineItem {
  stationCode: string;
  stationName: string;
  sequence: number;
  scheduledTime: string;
  baselineDelay: number;
  baselineETA: string;
  simulatedDelay: number;
  simulatedETA: string;
  impactMinutes: number; // simulatedDelay - baselineDelay
  isPerturbationPoint: boolean;
  isDownstream: boolean;
  distanceKm?: number;
  platform?: string | null;
}

export interface CascadeConnectingImpact {
  stationCode: string;
  stationName: string;
  connectingTrainNumber: string;
  connectingTrainName: string;
  scheduledDeparture: string;
  baselineBufferMinutes: number | null;
  simulatedBufferMinutes: number | null;
  baselineRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNAVAILABLE';
  simulatedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNAVAILABLE';
  riskShift: 'UNCHANGED' | 'ELEVATED' | 'CRITICAL_MISSED';
  isDerived: true;
}

export interface CascadePlatformImpact {
  stationCode: string;
  stationName: string;
  platform: string | null;
  baselineArrival: string;
  simulatedArrival: string;
  delayDifferenceMinutes: number;
  conflictRisk: 'NONE' | 'POSSIBLE_CONFLICT' | 'DATA_UNAVAILABLE';
  details: string;
  isDerived: true;
}

export interface PrecedingOrFollowingDetails {
  type: 'preceding' | 'following' | 'none';
  status: 'IDENTIFIED_FROM_LIVE' | 'INSUFFICIENT_DATA';
  trainNumber?: string;
  trainName?: string;
  assumedDelayMinutes: number;
  modeledImpactOnTrain: number;
  explanation: string;
}

export interface SimulationOutput {
  scenarioType: ScenarioType;
  scenarioTitle: string;
  affectedLocationCode: string;
  affectedLocationName: string;
  assumptionDisclaimer: string;
  baseline: SimulationBaseline;
  simulated: {
    destinationETA: string;
    destinationDelay: number;
    netDelayImpact: number;
  };
  stationTimeline: SimulatedStationTimelineItem[];
  cascade: {
    directImpactMinutes: number;
    derivedImpactMinutes: number;
    downstreamHaltsCount: number;
    affectedSegmentDescription: string;
    precedingOrFollowing: PrecedingOrFollowingDetails;
    connectingTrains: CascadeConnectingImpact[];
    platformConflicts: CascadePlatformImpact[];
    hasSufficientLiveData: boolean;
    dataAvailabilityNote: string;
  };
}

// ---------------------------------------------------------------------------
// Pure Time Utilities
// ---------------------------------------------------------------------------

export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || timeStr === '--:--' || timeStr.toLowerCase() === 'unavailable') return null;
  const s = String(timeStr).trim();
  if (s.includes('T')) {
    const timePart = s.split('T')[1];
    if (timePart) {
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
      }
    }
  }
  if (s.includes(':')) {
    const parts = s.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
  }
  return null;
}

export function formatMinutesToHHMM(minutes: number | null): string {
  if (minutes === null || isNaN(minutes)) return '--:--';
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string | null | undefined, minutesToAdd: number): string {
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return '--:--';
  return formatMinutesToHHMM(mins + minutesToAdd);
}

export function calculateBufferMinutes(arrivalHHMM: string, departureHHMM: string): number | null {
  const arr = parseTimeToMinutes(arrivalHHMM);
  const dep = parseTimeToMinutes(departureHHMM);
  if (arr === null || dep === null) return null;
  let diff = dep - arr;
  if (diff < -720) diff += 1440;
  else if (diff > 720) diff -= 1440;
  return diff;
}

// ---------------------------------------------------------------------------
// Route Halts Extraction from Live RailRadar
// ---------------------------------------------------------------------------

export function getRemainingRouteHalts(trainData: RailRadarLiveData): RailRadarRouteStation[] {
  const route = Array.isArray(trainData.route) ? trainData.route : [];
  if (route.length === 0) return [];

  const halts = route.filter((s) => s.isHalt);
  const activeStations = halts.length > 0 ? halts : route;

  const statusLower = (trainData.status || '').toLowerCase();
  if (statusLower === 'completed' || statusLower === 'arrived') {
    return [];
  }

  if (
    statusLower === 'not-started' ||
    statusLower === 'not_started' ||
    statusLower === 'scheduled'
  ) {
    return activeStations;
  }

  const nextHaltCode = trainData.nextHalt?.stationCode;
  const nextHaltSeq = trainData.nextHalt?.sequence;

  let startIdx = -1;
  if (nextHaltCode || nextHaltSeq) {
    startIdx = activeStations.findIndex(
      (s) =>
        (nextHaltCode && s.stationCode === nextHaltCode) ||
        (nextHaltSeq && s.sequence === nextHaltSeq)
    );
  }

  if (startIdx === -1 && trainData.currentLocation) {
    const curCode = trainData.currentLocation.stationCode;
    const curSeq = trainData.currentLocation.sequence;
    const curIdx = activeStations.findIndex(
      (s) => (curCode && s.stationCode === curCode) || (curSeq && s.sequence === curSeq)
    );
    if (curIdx !== -1) {
      startIdx = curIdx + 1;
    }
  }

  if (startIdx === -1) {
    startIdx = activeStations.findIndex((s) => s.status === 'upcoming');
  }

  if (startIdx === -1) {
    startIdx = 0;
  }

  return activeStations.slice(startIdx);
}

// ---------------------------------------------------------------------------
// Common Simulation Engine Runner
// ---------------------------------------------------------------------------

export function runWhatIfSimulation(
  trainData: RailRadarLiveData,
  inputs: ScenarioInputs,
  options?: {
    knownConnectingDepartures?: Array<{
      stationCode: string;
      stationName: string;
      trainNumber: string;
      trainName: string;
      scheduledDeparture: string;
    }>;
    liveStationBoardTrains?: any[];
  }
): SimulationOutput {
  const remainingHalts = getRemainingRouteHalts(trainData);
  const realBaselineDelay = Math.max(0, trainData.delayMinutes || 0);

  const destHalt = remainingHalts[remainingHalts.length - 1];
  const destSchedTime =
    destHalt?.scheduledArrival ||
    destHalt?.scheduledDeparture ||
    trainData.train?.destination?.code ||
    '--:--';
  const destSchedHHMM = formatMinutesToHHMM(parseTimeToMinutes(destSchedTime));

  const baselineDestETA =
    destSchedHHMM !== '--:--'
      ? addMinutesToTime(destSchedHHMM, realBaselineDelay)
      : '--:--';

  const baseline: SimulationBaseline = {
    trainNumber: trainData.trainNumber,
    trainName: trainData.trainName || `Train ${trainData.trainNumber}`,
    currentDelay: realBaselineDelay,
    destinationCode: destHalt?.stationCode || trainData.train?.destination?.code || '',
    destinationName: destHalt?.stationName || trainData.train?.destination?.name || 'Destination',
    destinationScheduledArrival: destSchedHHMM,
    destinationExpectedArrival: baselineDestETA,
    currentStatus: trainData.status || 'running',
    currentStationName:
      trainData.currentLocation?.stationName ||
      trainData.previousHalt?.stationName ||
      'In Transit',
    totalRemainingHalts: remainingHalts.length,
  };

  // Find index of affected station on remaining halts
  let affectedIdx = remainingHalts.findIndex(
    (s) => s.stationCode.toUpperCase() === inputs.locationCode.toUpperCase()
  );
  if (affectedIdx === -1 && remainingHalts.length > 0) {
    // Default to first upcoming halt if invalid
    affectedIdx = 0;
  }

  const affectedStation = remainingHalts[affectedIdx];
  const affectedLocationCode = affectedStation?.stationCode || inputs.locationCode || 'N/A';
  const affectedLocationName = affectedStation?.stationName || affectedLocationCode;

  // Determine direct impact based on scenario type
  let directDelayMinutes = 0;
  let assumptionDisclaimer =
    'ASSUMPTION: This scenario is hypothetical and is not an active railway disruption.';
  let affectedSegmentDesc = '';

  switch (inputs.scenarioType) {
    case 'signal_block':
      directDelayMinutes = Math.max(1, inputs.delayMinutes);
      assumptionDisclaimer =
        'ASSUMPTION: Hypothetical block signal failure / restriction. Not an active signaling emergency.';
      affectedSegmentDesc = `Signal aspect restriction approaching ${affectedLocationName} (${affectedLocationCode})`;
      break;

    case 'congestion':
      if (inputs.congestionSeverity === 'LOW') {
        directDelayMinutes = 8;
      } else if (inputs.congestionSeverity === 'HIGH') {
        directDelayMinutes = 25;
      } else {
        directDelayMinutes = inputs.delayMinutes || 15;
      }
      assumptionDisclaimer =
        'ASSUMPTION: Simulated traffic saturation & speed restriction along corridor. Sourced from hypothetical track occupancy.';
      affectedSegmentDesc = `Traffic density restriction through ${affectedLocationName} corridor`;
      break;

    case 'preceding_train': {
      const pDelay = inputs.precedingDelayMinutes ?? inputs.delayMinutes ?? 10;
      // Operational rule: trailing train absorbs roughly 70-80% of preceding train's delay
      directDelayMinutes = Math.max(3, Math.round(pDelay * 0.75));
      assumptionDisclaimer =
        'ASSUMPTION: This scenario models headway regulation behind a hypothetical delayed lead train. Not an active train delay incident.';
      affectedSegmentDesc = `Headway spacing behind leading service into ${affectedLocationName}`;
      break;
    }

    case 'maintenance_block':
      directDelayMinutes = inputs.maintenanceDurationMinutes ?? inputs.delayMinutes ?? 30;
      assumptionDisclaimer =
        'ASSUMPTION: This scenario is hypothetical and is not an active railway disruption. Do NOT claim that an actual maintenance block exists unless RailRadar or another verified source reports it.';
      affectedSegmentDesc = `Emergency unscheduled engineering possession around ${affectedLocationName}`;
      break;

    case 'level_crossing':
      directDelayMinutes = inputs.gateDelayMinutes ?? inputs.delayMinutes ?? 10;
      assumptionDisclaimer =
        'ASSUMPTION: Hypothetical level crossing gate closure delay. Not an active gate failure.';
      affectedSegmentDesc = `Interlocked LC gate clearance holding before ${affectedLocationName}`;
      break;
  }

  // Calculate Station-by-Station Ripple Effect
  const N = remainingHalts.length;
  const stationTimeline: SimulatedStationTimelineItem[] = remainingHalts.map((st, idx) => {
    const rawSched =
      st.scheduledArrival || st.scheduledDeparture || (idx === 0 ? st.scheduledDeparture : null);
    const schedHHMM = formatMinutesToHHMM(parseTimeToMinutes(rawSched));

    // Baseline delay at this halt
    let haltBaselineDelay = realBaselineDelay;
    if (typeof st.delayArrival === 'number' && st.delayArrival >= 0) {
      haltBaselineDelay = st.delayArrival;
    } else {
      haltBaselineDelay = Math.max(0, realBaselineDelay - Math.round(idx * 0.5));
    }
    const baselineETA = addMinutesToTime(schedHHMM, haltBaselineDelay);

    const isPerturbationPoint = idx === affectedIdx;
    const isDownstream = idx >= affectedIdx;

    let simulatedDelay = haltBaselineDelay;
    let impact = 0;

    if (isDownstream) {
      // Downstream stations incur the direct delay with realistic running slack allowance
      // Indian Railways timetable contains minor slack (typically 0.5 min per halt or ~2% recovery)
      const downstreamHaltOffset = idx - affectedIdx;
      const slackRecovery = Math.min(
        Math.floor(directDelayMinutes * 0.25),
        Math.floor(downstreamHaltOffset * 0.5)
      );
      impact = Math.max(1, directDelayMinutes - slackRecovery);
      simulatedDelay = haltBaselineDelay + impact;
    } else {
      // Prior stations are completely unaffected
      impact = 0;
      simulatedDelay = haltBaselineDelay;
    }

    const simulatedETA = addMinutesToTime(schedHHMM, simulatedDelay);

    return {
      stationCode: st.stationCode,
      stationName: st.stationName || st.stationCode,
      sequence: st.sequence,
      scheduledTime: schedHHMM,
      baselineDelay: haltBaselineDelay,
      baselineETA,
      simulatedDelay,
      simulatedETA,
      impactMinutes: impact,
      isPerturbationPoint,
      isDownstream,
      distanceKm: st.distance,
      platform: st.platform,
    };
  });

  const lastTimelineItem = stationTimeline[stationTimeline.length - 1];
  const finalSimulatedDelay = lastTimelineItem?.simulatedDelay ?? realBaselineDelay;
  const finalSimulatedETA = lastTimelineItem?.simulatedETA ?? baselineDestETA;
  const netDelayImpact = lastTimelineItem ? lastTimelineItem.impactMinutes : directDelayMinutes;

  // -------------------------------------------------------------------------
  // Cascade Impact: Preceding or Following Train
  // -------------------------------------------------------------------------
  let precedingOrFollowing: PrecedingOrFollowingDetails = {
    type: inputs.scenarioType === 'preceding_train' ? 'preceding' : 'following',
    status: 'INSUFFICIENT_DATA',
    assumedDelayMinutes:
      inputs.scenarioType === 'preceding_train'
        ? (inputs.precedingDelayMinutes ?? inputs.delayMinutes)
        : directDelayMinutes,
    modeledImpactOnTrain: directDelayMinutes,
    explanation:
      inputs.scenarioType === 'preceding_train'
        ? 'Insufficient live data to identify a specific preceding train on this block; modeling operational headway spacing consequences on the selected train.'
        : 'Insufficient live data to identify trailing following services on this block section.',
  };

  // Inspect live station board if provided by caller
  if (options?.liveStationBoardTrains && options.liveStationBoardTrains.length > 0) {
    const boardTrains = options.liveStationBoardTrains;
    if (inputs.scenarioType === 'preceding_train') {
      // Find a train with departure earlier than selected train
      const lead = boardTrains.find(
        (t: any) =>
          t.train?.number &&
          t.train.number !== trainData.trainNumber &&
          (t.stop?.departure || t.live?.expectedDepartureTime)
      );
      if (lead) {
        precedingOrFollowing = {
          type: 'preceding',
          status: 'IDENTIFIED_FROM_LIVE',
          trainNumber: lead.train?.number,
          trainName: lead.train?.name || `Train ${lead.train?.number}`,
          assumedDelayMinutes: inputs.precedingDelayMinutes ?? inputs.delayMinutes,
          modeledImpactOnTrain: directDelayMinutes,
          explanation: `Identified preceding service ${lead.train?.number} (${lead.train?.name}) operating ahead at ${affectedLocationCode}. Trailing train incurs caution aspect headway delay.`,
        };
      }
    } else if (inputs.scenarioType === 'signal_block') {
      // Find trailing train
      const trailing = boardTrains.find(
        (t: any) =>
          t.train?.number &&
          t.train.number !== trainData.trainNumber &&
          (t.stop?.departure || t.live?.expectedDepartureTime)
      );
      if (trailing) {
        precedingOrFollowing = {
          type: 'following',
          status: 'IDENTIFIED_FROM_LIVE',
          trainNumber: trailing.train?.number,
          trainName: trailing.train?.name || `Train ${trailing.train?.number}`,
          assumedDelayMinutes: Math.max(5, Math.round(directDelayMinutes * 0.7)),
          modeledImpactOnTrain: Math.max(5, Math.round(directDelayMinutes * 0.7)),
          explanation: `Trailing service ${trailing.train?.number} (${trailing.train?.name}) projected to absorb knock-on headway holding (+${Math.round(directDelayMinutes * 0.7)}m).`,
        };
      }
    }
  }

  // -------------------------------------------------------------------------
  // Cascade Impact: Connecting Trains & Passenger Connection Risk
  // -------------------------------------------------------------------------
  const connectingTrains: CascadeConnectingImpact[] = [];
  const candidateConnections = options?.knownConnectingDepartures || [];

  if (candidateConnections.length > 0) {
    for (const dep of candidateConnections) {
      // Find arrival of selected train at that connection station
      const stItem = stationTimeline.find((s) => s.stationCode === dep.stationCode);
      if (!stItem) continue;

      const baseBuf = calculateBufferMinutes(stItem.baselineETA, dep.scheduledDeparture);
      const simBuf = calculateBufferMinutes(stItem.simulatedETA, dep.scheduledDeparture);

      const getRisk = (buf: number | null): 'LOW' | 'MEDIUM' | 'HIGH' | 'UNAVAILABLE' => {
        if (buf === null) return 'UNAVAILABLE';
        if (buf < 10) return 'HIGH';
        if (buf < 25) return 'MEDIUM';
        return 'LOW';
      };

      const bRisk = getRisk(baseBuf);
      const sRisk = getRisk(simBuf);

      let shift: 'UNCHANGED' | 'ELEVATED' | 'CRITICAL_MISSED' = 'UNCHANGED';
      if (simBuf !== null && simBuf < 0) {
        shift = 'CRITICAL_MISSED';
      } else if (bRisk !== sRisk && (sRisk === 'HIGH' || sRisk === 'MEDIUM')) {
        shift = 'ELEVATED';
      }

      connectingTrains.push({
        stationCode: dep.stationCode,
        stationName: dep.stationName,
        connectingTrainNumber: dep.trainNumber,
        connectingTrainName: dep.trainName,
        scheduledDeparture: dep.scheduledDeparture,
        baselineBufferMinutes: baseBuf,
        simulatedBufferMinutes: simBuf,
        baselineRisk: bRisk,
        simulatedRisk: sRisk,
        riskShift: shift,
        isDerived: true,
      });
    }
  }

  // -------------------------------------------------------------------------
  // Cascade Impact: Platform Conflict / Utilization Shifts
  // -------------------------------------------------------------------------
  const platformConflicts: CascadePlatformImpact[] = [];
  // Inspect major downstream halts and destination
  const checkHalts = stationTimeline.filter((s) => s.isDownstream && s.platform);
  for (const halt of checkHalts.slice(0, 3)) {
    const delayDiff = halt.impactMinutes;
    let conflictRisk: 'NONE' | 'POSSIBLE_CONFLICT' | 'DATA_UNAVAILABLE' = 'NONE';
    let details = 'Platform occupancy window shifts downstream.';

    if (delayDiff >= 20) {
      conflictRisk = 'POSSIBLE_CONFLICT';
      details = `Arrival delayed by +${delayDiff}m at Platform ${halt.platform}. High risk of overlapping with subsequent scheduled occupancy.`;
    } else if (delayDiff >= 10) {
      conflictRisk = 'POSSIBLE_CONFLICT';
      details = `Arrival delayed by +${delayDiff}m at Platform ${halt.platform}. Operational turnaround compressed.`;
    } else {
      details = `Standard occupancy buffer maintained at Platform ${halt.platform}.`;
    }

    platformConflicts.push({
      stationCode: halt.stationCode,
      stationName: halt.stationName,
      platform: halt.platform,
      baselineArrival: halt.baselineETA,
      simulatedArrival: halt.simulatedETA,
      delayDifferenceMinutes: delayDiff,
      conflictRisk,
      details,
      isDerived: true,
    });
  }

  const downstreamCount = stationTimeline.filter((s) => s.isDownstream).length;
  const hasSufficientLiveData = remainingHalts.length > 0;

  return {
    scenarioType: inputs.scenarioType,
    scenarioTitle: SCENARIO_DEFINITIONS[inputs.scenarioType].title,
    affectedLocationCode,
    affectedLocationName,
    assumptionDisclaimer,
    baseline,
    simulated: {
      destinationETA: finalSimulatedETA,
      destinationDelay: finalSimulatedDelay,
      netDelayImpact,
    },
    stationTimeline,
    cascade: {
      directImpactMinutes: directDelayMinutes,
      derivedImpactMinutes: netDelayImpact,
      downstreamHaltsCount: downstreamCount,
      affectedSegmentDescription: affectedSegmentDesc,
      precedingOrFollowing,
      connectingTrains,
      platformConflicts,
      hasSufficientLiveData,
      dataAvailabilityNote:
        connectingTrains.length === 0
          ? 'Insufficient live connecting departures announced on downstream station boards.'
          : `${connectingTrains.length} connecting service(s) monitored for transfer buffer degradation.`,
    },
  };
}
