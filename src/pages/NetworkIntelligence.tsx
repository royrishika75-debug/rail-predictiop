import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useTrainData } from '../context/TrainContext';
import {
  RefreshCw,
  AlertTriangle,
  Radio,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  ChevronDown,
  Activity,
  Layers,
  Plus,
  X,
  Building2,
} from 'lucide-react';
import type { RailRadarLiveData } from '../types/railradar';
import { railradarService } from '../services/railradarService';

// Real Live Station Board Types
interface StationTrainLive {
  train: {
    number: string;
    name: string;
    type?: string;
    source?: string;
    destination?: string;
    runDays?: string[];
  };
  stop: {
    sequence?: number;
    arrival?: string | null;
    departure?: string | null;
    day?: number;
    distance?: number;
    isHalt?: boolean;
    platform?: string | null;
  };
  live?: {
    type?: string;
    startDate?: string;
    expectedArrivalTime?: string | null;
    expectedDepartureTime?: string | null;
    delayMinutes?: number;
  };
}

interface MonitoredStationMeta {
  code: string;
  name: string;
  city?: string;
}

interface StationBoardState {
  code: string;
  name: string;
  trains: StationTrainLive[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface MonitoredTrainRecord {
  id: string;
  name: string;
  stationCode: string;
  stationName: string;
  status: 'on-time' | 'delayed' | 'high-risk' | 'unknown';
  statusLabel: string;
  delay: number | null;
  platform: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  expectedArrival: string;
  expectedDeparture: string;
  liveType: string;
  source: string;
  destination: string;
  stationIndex: number;
}

// Preset Corridor Templates for Quick Selection
const PRESET_CORRIDORS: { id: string; name: string; zone: string; stations: MonitoredStationMeta[] }[] = [
  {
    id: 'sc-main',
    name: 'South Central Main Corridor',
    zone: 'SCR',
    stations: [
      { code: 'BZA', name: 'Vijayawada Jn', city: 'Vijayawada' },
      { code: 'KMT', name: 'Khammam', city: 'Khammam' },
      { code: 'WL', name: 'Warangal', city: 'Warangal' },
      { code: 'KZJ', name: 'Kazipet Jn', city: 'Kazipet' },
      { code: 'SC', name: 'Secunderabad Jn', city: 'Secunderabad' },
    ],
  },
  {
    id: 'northern-trunk',
    name: 'Northern Grand Trunk Corridor',
    zone: 'NR / NCR',
    stations: [
      { code: 'NDLS', name: 'New Delhi', city: 'New Delhi' },
      { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur' },
      { code: 'PRYJ', name: 'Prayagraj Jn', city: 'Prayagraj' },
      { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', city: 'Mughalsarai' },
    ],
  },
  {
    id: 'western-trunk',
    name: 'Western Main Line Corridor',
    zone: 'WR',
    stations: [
      { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai' },
      { code: 'ST', name: 'Surat', city: 'Surat' },
      { code: 'BRC', name: 'Vadodara Jn', city: 'Vadodara' },
      { code: 'RTM', name: 'Ratlam Jn', city: 'Ratlam' },
    ],
  },
];

const STATUS_COLORS: Record<string, string> = {
  'on-time': '#10B981',
  delayed: '#F59E0B',
  'high-risk': '#EF4444',
  unknown: '#64748B',
};

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

function formatDisplayTime(isoOrTimeStr?: string | null): string {
  if (!isoOrTimeStr) return 'Unavailable';
  if (isoOrTimeStr.length === 5 && isoOrTimeStr.includes(':')) {
    return isoOrTimeStr;
  }
  try {
    const d = new Date(isoOrTimeStr);
    if (isNaN(d.getTime())) return isoOrTimeStr;
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return isoOrTimeStr;
  }
}

export function NetworkIntelligence({ mode = 'overview' }: { mode?: 'overview' | 'propagation' }) {
  const {
    selectedTrainNumber: contextTrainNumber,
    setSelectedTrainNumber: setContextTrainNumber,
    trainData: contextTrainData,
    journeyDate,
    searchTrain,
  } = useTrainData();

  // Configurable Station Monitoring State
  const [monitoredStations, setMonitoredStations] = useState<MonitoredStationMeta[]>(
    PRESET_CORRIDORS[0].stations
  );
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('sc-main');
  const [customStationInput, setCustomStationInput] = useState('');
  const [customStationError, setCustomStationError] = useState<string | null>(null);
  const [isStationManagerOpen, setIsStationManagerOpen] = useState(false);

  // Live Station Boards Data State (Keyed by station code)
  const [stationBoards, setStationBoards] = useState<Record<string, StationBoardState>>({});
  const [isRefreshingStations, setIsRefreshingStations] = useState(false);
  const [stationFetchError, setStationFetchError] = useState<string | null>(null);

  // Selected Train Detailed Intelligence (Live Train API)
  const [selectedTrainId, setSelectedTrainId] = useState<string>(contextTrainNumber || '');
  const [trainDetails, setTrainDetails] = useState<RailRadarLiveData | null>(null);
  const [isFetchingTrainDetails, setIsFetchingTrainDetails] = useState(false);
  const [trainDetailsError, setTrainDetailsError] = useState<string | null>(null);

  // Switch to a preset corridor
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_CORRIDORS.find((c) => c.id === presetId);
    if (preset) {
      setSelectedCorridorId(presetId);
      setMonitoredStations(preset.stations);
      setCustomStationError(null);
    }
  };

  // Add custom station to monitored stations
  const handleAddCustomStation = () => {
    const code = customStationInput.trim().toUpperCase();
    if (!code) return;
    if (!/^[A-Z0-9]{2,6}$/.test(code)) {
      setCustomStationError('Station code must be 2 to 6 characters (e.g. BZA, NDLS, HWH).');
      return;
    }
    if (monitoredStations.some((s) => s.code === code)) {
      setCustomStationError(`Station ${code} is already being monitored.`);
      return;
    }
    if (monitoredStations.length >= 8) {
      setCustomStationError('Maximum 8 monitored stations supported for corridor telemetry.');
      return;
    }
    setMonitoredStations((prev) => [...prev, { code, name: `${code} Station` }]);
    setSelectedCorridorId('custom');
    setCustomStationInput('');
    setCustomStationError(null);
  };

  // Remove station from monitored list
  const handleRemoveStation = (codeToRemove: string) => {
    if (monitoredStations.length <= 2) {
      setCustomStationError('At least 2 stations required to establish a monitored corridor.');
      return;
    }
    setMonitoredStations((prev) => prev.filter((s) => s.code !== codeToRemove));
    setSelectedCorridorId('custom');
    setCustomStationError(null);
  };

  // Fetch station live board for a single station from centralized service
  const fetchStationLiveBoard = useCallback(
    async (stationCode: string, stationName: string): Promise<StationBoardState> => {
      try {
        const json = await railradarService.fetchStationLive(stationCode, {
          hours: 4,
          includeIntermediate: true,
          authoritative: false,
        });

        if (!json.success || !json.data) {
          return {
            code: stationCode,
            name: stationName,
            trains: [],
            isLoading: false,
            error: json?.error?.message || `Failed to fetch live board (${json?.status || 500})`,
            lastUpdated: null,
          };
        }

        const trainsRaw: StationTrainLive[] = json.data?.trains || [];
        const resolvedName = json.data?.station?.name || stationName;

        return {
          code: stationCode,
          name: resolvedName,
          trains: trainsRaw,
          isLoading: false,
          error: null,
          lastUpdated: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata',
          }),
        };
      } catch (err: any) {
        return {
          code: stationCode,
          name: stationName,
          trains: [],
          isLoading: false,
          error: err.message || 'Network connection failed',
          lastUpdated: null,
        };
      }
    },
    []
  );

  // Refresh all monitored stations
  const refreshAllMonitoredStations = useCallback(async () => {
    setIsRefreshingStations(true);
    setStationFetchError(null);

    // Flag active stations as loading
    setStationBoards((prev) => {
      const next = { ...prev };
      monitoredStations.forEach((stn) => {
        next[stn.code] = {
          code: stn.code,
          name: stn.name,
          trains: prev[stn.code]?.trains || [],
          isLoading: true,
          error: null,
          lastUpdated: prev[stn.code]?.lastUpdated || null,
        };
      });
      return next;
    });

    try {
      const results: Record<string, StationBoardState> = {};
      // Fetch stations sequentially with a small delay to avoid bursting
      for (const stn of monitoredStations) {
        const board = await fetchStationLiveBoard(stn.code, stn.name);
        results[stn.code] = board;
        await new Promise((r) => setTimeout(r, 180));
      }

      setStationBoards((prev) => ({ ...prev, ...results }));
    } catch (err: any) {
      setStationFetchError(err.message || 'Failed to refresh station boards');
    } finally {
      setIsRefreshingStations(false);
    }
  }, [monitoredStations, fetchStationLiveBoard]);

  // Trigger fetch when monitored stations change
  useEffect(() => {
    refreshAllMonitoredStations();
  }, [refreshAllMonitoredStations]);

  // Aggregate and deduplicate live trains detected around monitored stations
  const flattenedMonitoredTrains: MonitoredTrainRecord[] = useMemo(() => {
    const map = new Map<string, MonitoredTrainRecord>();

    monitoredStations.forEach((stn, stnIndex) => {
      const board = stationBoards[stn.code];
      if (!board || !board.trains) return;

      board.trains.forEach((item) => {
        const trainNum = item.train?.number;
        if (!trainNum) return;

        const delayMinutes =
          typeof item.live?.delayMinutes === 'number' ? item.live.delayMinutes : null;

        let status: 'on-time' | 'delayed' | 'high-risk' | 'unknown' = 'unknown';
        let statusLabel = 'Unavailable';

        if (delayMinutes !== null) {
          if (delayMinutes <= 5) {
            status = 'on-time';
            statusLabel = 'On Time';
          } else if (delayMinutes <= 25) {
            status = 'delayed';
            statusLabel = 'Delayed';
          } else {
            status = 'high-risk';
            statusLabel = 'High Risk';
          }
        }

        const platform = item.stop?.platform || 'Unavailable';
        const scheduledArr = formatDisplayTime(item.stop?.arrival);
        const scheduledDep = formatDisplayTime(item.stop?.departure);
        const expArr = formatDisplayTime(item.live?.expectedArrivalTime);
        const expDep = formatDisplayTime(item.live?.expectedDepartureTime);

        // Deduplicate: preserve or update with latest active station record
        if (!map.has(trainNum) || item.live?.type === 'at-station') {
          map.set(trainNum, {
            id: trainNum,
            name: item.train?.name || `Train ${trainNum}`,
            stationCode: stn.code,
            stationName: board.name || stn.name,
            status,
            statusLabel,
            delay: delayMinutes,
            platform,
            scheduledArrival: scheduledArr,
            scheduledDeparture: scheduledDep,
            expectedArrival: expArr,
            expectedDeparture: expDep,
            liveType: item.live?.type || 'scheduled',
            source: item.train?.source || 'Unavailable',
            destination: item.train?.destination || 'Unavailable',
            stationIndex: stnIndex,
          });
        }
      });
    });

    const list = Array.from(map.values());
    // Sort trains by delay descending (highest delayed first for operational triage)
    return list.sort((a, b) => (b.delay ?? -1) - (a.delay ?? -1));
  }, [monitoredStations, stationBoards]);

  // Synchronize initial or selected train
  useEffect(() => {
    if (!selectedTrainId && flattenedMonitoredTrains.length > 0) {
      setSelectedTrainId(flattenedMonitoredTrains[0].id);
    } else if (
      contextTrainNumber &&
      selectedTrainId !== contextTrainNumber &&
      flattenedMonitoredTrains.some((t) => t.id === contextTrainNumber)
    ) {
      setSelectedTrainId(contextTrainNumber);
    }
  }, [flattenedMonitoredTrains, selectedTrainId, contextTrainNumber]);

  // Fetch detailed live train telemetry when selected train changes (Requirement 4 & 12)
  useEffect(() => {
    if (!selectedTrainId) {
      setTrainDetails(null);
      return;
    }

    if (contextTrainData && contextTrainData.trainNumber === selectedTrainId) {
      setTrainDetails(contextTrainData);
      return;
    }

    let isMounted = true;
    setIsFetchingTrainDetails(true);
    setTrainDetailsError(null);

    railradarService
      .fetchLiveTrain(selectedTrainId, journeyDate, { authoritative: false })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setTrainDetails(res.data);
        } else {
          setTrainDetailsError(
            res.error?.message || `Failed to fetch live telemetry (${res.status})`
          );
          setTrainDetails(null);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setTrainDetailsError(err.message || 'Error fetching train telemetry');
        setTrainDetails(null);
      })
      .finally(() => {
        if (isMounted) setIsFetchingTrainDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTrainId, contextTrainData, journeyDate]);

  // Handle train selection across the UI
  const handleSelectTrain = (trainId: string) => {
    setSelectedTrainId(trainId);
    if (setContextTrainNumber) {
      setContextTrainNumber(trainId);
    }
    if (searchTrain) {
      searchTrain(trainId);
    }
  };

  const activeSelectedRecord = useMemo(() => {
    return flattenedMonitoredTrains.find((t) => t.id === selectedTrainId) || null;
  }, [flattenedMonitoredTrains, selectedTrainId]);

  // Derived network intelligence indicators (Requirement 7)
  const networkMetrics = useMemo(() => {
    const totalDetected = flattenedMonitoredTrains.length;
    const delayedTrains = flattenedMonitoredTrains.filter(
      (t) => typeof t.delay === 'number' && t.delay > 5
    );
    const highRiskTrains = flattenedMonitoredTrains.filter(
      (t) => typeof t.delay === 'number' && t.delay > 25
    );

    // Identify stations with active delayed trains
    const affectedStations = new Set<string>();
    delayedTrains.forEach((t) => affectedStations.add(t.stationCode));

    // Calculate congested sections (consecutive monitored stops with delays)
    let congestedSectionsCount = 0;
    for (let i = 0; i < monitoredStations.length - 1; i++) {
      const code1 = monitoredStations[i].code;
      const code2 = monitoredStations[i + 1].code;
      if (affectedStations.has(code1) && affectedStations.has(code2)) {
        congestedSectionsCount++;
      }
    }

    // Derived Potential Delay Propagation
    let delayPropagationText = 'Unavailable';
    const effectiveDelay =
      trainDetails?.delayMinutes !== undefined
        ? trainDetails.delayMinutes
        : activeSelectedRecord?.delay !== null
        ? activeSelectedRecord?.delay
        : null;

    if (typeof effectiveDelay === 'number') {
      if (effectiveDelay === 0) {
        delayPropagationText = '0 min (Minimal)';
      } else if (effectiveDelay <= 5) {
        delayPropagationText = '+1 to +3 min (Low Impact)';
      } else if (effectiveDelay <= 15) {
        delayPropagationText = `+${Math.round(effectiveDelay * 0.3)} to +${Math.round(
          effectiveDelay * 0.5
        )} min (Moderate Impact)`;
      } else {
        delayPropagationText = `+${Math.round(effectiveDelay * 0.4)} to +${Math.round(
          effectiveDelay * 0.7
        )} min (High Risk Propagation)`;
      }
    }

    return {
      totalDetected,
      affectedTrainsCount: delayedTrains.length,
      highRiskCount: highRiskTrains.length,
      affectedStationsCount: affectedStations.size,
      congestedSectionsCount,
      delayPropagationText,
    };
  }, [flattenedMonitoredTrains, monitoredStations, activeSelectedRecord, trainDetails]);

  // Dynamic SVG Geometry Calculations
  const numStations = monitoredStations.length;
  const svgHeight = Math.max(400, numStations * 85 + 50);
  const startY = 70;
  const stationSpacing = numStations > 1 ? (svgHeight - 140) / (numStations - 1) : 100;
  const stationYCoords = monitoredStations.map((_, idx) => startY + idx * stationSpacing);

  // Group trains by station index
  const stationTrainMap = useMemo(() => {
    const map: Record<number, MonitoredTrainRecord[]> = {};
    monitoredStations.forEach((_, idx) => {
      map[idx] = [];
    });
    flattenedMonitoredTrains.forEach((t) => {
      if (map[t.stationIndex]) {
        map[t.stationIndex].push(t);
      }
    });
    return map;
  }, [monitoredStations, flattenedMonitoredTrains]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header with Title and Corridor Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              LIVE • RailRadar
            </span>
            <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
              Live RailRadar Network View
            </span>
            <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/30">
              RailPredict Derived Propagation
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Live RailRadar Network View
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Real-time station live board monitoring & corridor delay propagation forecasting across monitored stations.
          </p>
        </div>

        {/* Corridor Presets & Station Config Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-[#0C1526] border border-[#1A2840] rounded-lg p-1 text-xs">
            <span className="px-2 text-[#4A6080] font-data hidden sm:inline">Corridor:</span>
            {PRESET_CORRIDORS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 rounded text-xs font-data transition-all cursor-pointer ${
                  selectedCorridorId === preset.id
                    ? 'bg-[#1E3A5F] text-blue-300 font-semibold shadow-sm'
                    : 'text-[#7A95B0] hover:text-white'
                }`}
              >
                {preset.zone}
              </button>
            ))}
            <button
              onClick={() => setIsStationManagerOpen((v) => !v)}
              className={`px-2.5 py-1.5 rounded text-xs font-data transition-all cursor-pointer flex items-center gap-1 ${
                isStationManagerOpen
                  ? 'bg-blue-600/30 text-blue-300'
                  : 'text-[#7A95B0] hover:text-white'
              }`}
              title="Configure Monitored Stations"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Stations</span>
            </button>
          </div>

          <button
            onClick={refreshAllMonitoredStations}
            disabled={isRefreshingStations}
            className="flex items-center gap-2 px-3 py-2 bg-[#112035] hover:bg-[#1A2F50] border border-[#1A2840] hover:border-blue-500/40 text-xs font-data text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh live station boards"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshingStations ? 'animate-spin text-blue-400' : ''}`}
            />
            <span>{isRefreshingStations ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Station Configuration Manager (Requirement 2) */}
      {isStationManagerOpen && (
        <Card className="p-4 bg-[#0A1220] border-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-data text-blue-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Configurable Monitored Railway Stations ({monitoredStations.length})</span>
            </div>
            <button
              onClick={() => setIsStationManagerOpen(false)}
              className="text-[#7A95B0] hover:text-white text-xs cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {monitoredStations.map((stn) => (
              <div
                key={stn.code}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#112035] border border-[#1A2840] rounded text-xs font-data text-white"
              >
                <span className="font-semibold text-blue-300">{stn.code}</span>
                <span className="text-[#7A95B0]">({stn.name.split(' ')[0]})</span>
                <button
                  onClick={() => handleRemoveStation(stn.code)}
                  className="text-[#7A95B0] hover:text-red-400 p-0.5 cursor-pointer"
                  title={`Remove ${stn.code}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom station form */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customStationInput}
              onChange={(e) => setCustomStationInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomStation()}
              placeholder="Add station code (e.g. MAS, HWH, SBC, ADI)..."
              maxLength={6}
              className="px-3 py-1.5 bg-[#112035] border border-[#1A2840] focus:border-blue-500 rounded text-xs font-data text-white placeholder-[#4A6080] outline-none uppercase w-64"
            />
            <button
              onClick={handleAddCustomStation}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-data text-white rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Station</span>
            </button>
          </div>
          {customStationError && (
            <div className="text-[11px] text-red-400 font-data mt-2">{customStationError}</div>
          )}
        </Card>
      )}

      {/* Scope Disclaimer Banner (Requirement 8) */}
      <div className="p-3 bg-[#0C1526] border border-blue-500/20 rounded-lg flex items-start gap-2.5 text-xs text-[#7A95B0]">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">Monitored Stations Scope: </span>
          Real-time NTES movements sourced from {monitoredStations.length} monitored stations (
          {monitoredStations.map((s) => s.code).join(' → ')}) via RailRadar live station board API.
          Network intelligence is strictly calculated from these observed points, not the entire
          Indian Railways national grid.
        </div>
      </div>

      {stationFetchError && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg flex items-center gap-3 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{stationFetchError}</span>
          <button
            onClick={refreshAllMonitoredStations}
            className="ml-auto underline hover:text-white cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Dynamic Corridor SVG Visualization */}
        <Card className="lg:col-span-2 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Railway Corridor Spine</span>
              </div>
              <div className="text-[11px] font-data text-[#4A6080]">
                {flattenedMonitoredTrains.length} Active Trains Observed
              </div>
            </div>

            <div className="w-full overflow-x-auto bg-[#070B12] rounded-sm border border-[#182335] p-2">
              <svg
                viewBox={`0 0 620 ${svgHeight}`}
                className="w-full min-w-[560px]"
                style={{ height: svgHeight }}
              >
                {/* Main vertical spine */}
                <line
                  x1="80"
                  y1={stationYCoords[0]}
                  x2="80"
                  y2={stationYCoords[stationYCoords.length - 1]}
                  stroke="#1A2840"
                  strokeWidth="4"
                  strokeLinecap="round"
                />

                {/* Congested section dashed highlight */}
                {stationYCoords.map((yCoord, idx) => {
                  if (idx === stationYCoords.length - 1) return null;
                  const nextY = stationYCoords[idx + 1];
                  const stn1HasDelay = stationTrainMap[idx]?.some(
                    (t) => typeof t.delay === 'number' && t.delay > 15
                  );
                  const stn2HasDelay = stationTrainMap[idx + 1]?.some(
                    (t) => typeof t.delay === 'number' && t.delay > 15
                  );
                  if (!stn1HasDelay && !stn2HasDelay) return null;

                  return (
                    <line
                      key={`congested-${idx}`}
                      x1="80"
                      y1={yCoord}
                      x2="80"
                      y2={nextY}
                      stroke="#EF4444"
                      strokeWidth="3"
                      strokeOpacity="0.4"
                      strokeDasharray="8 4"
                    />
                  );
                })}

                {/* Stations along the corridor */}
                {monitoredStations.map((stn, idx) => {
                  const yPos = stationYCoords[idx];
                  const board = stationBoards[stn.code];
                  const trainsAtStn = stationTrainMap[idx] || [];
                  const delayedCount = trainsAtStn.filter(
                    (t) => typeof t.delay === 'number' && t.delay > 5
                  ).length;
                  const isImpacted = delayedCount > 0;

                  return (
                    <g key={stn.code}>
                      {/* Station Outer Ring */}
                      <circle
                        cx="80"
                        cy={yPos}
                        r="11"
                        fill="#112035"
                        stroke={isImpacted ? '#EF4444' : '#2A4470'}
                        strokeWidth="2"
                      />
                      {/* Center Node */}
                      <circle
                        cx="80"
                        cy={yPos}
                        r="4.5"
                        fill={isImpacted ? '#EF4444' : '#3B82F6'}
                      />

                      {/* Station Name & Code */}
                      <text
                        x="105"
                        y={yPos - 2}
                        fill={isImpacted ? '#FCA5A5' : '#E2E8F0'}
                        fontSize="13"
                        fontFamily="Inter"
                        fontWeight="600"
                      >
                        {board?.name || stn.name}
                      </text>
                      <text
                        x="105"
                        y={yPos + 12}
                        fill="#4A6080"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                      >
                        {stn.code} {board?.lastUpdated ? `· ${board.lastUpdated}` : ''}
                      </text>

                      {/* Derived Impact Zone Marker */}
                      {isImpacted && (
                        <g>
                          <rect
                            x="260"
                            y={yPos - 10}
                            width="115"
                            height="20"
                            rx="3"
                            fill="#EF4444"
                            fillOpacity="0.12"
                            stroke="#EF4444"
                            strokeWidth="1"
                            strokeOpacity="0.4"
                          />
                          <text
                            x="267"
                            y={yPos + 3}
                            fill="#EF4444"
                            fontSize="9"
                            fontFamily="JetBrains Mono"
                            fontWeight="600"
                          >
                            DERIVED IMPACT ({delayedCount})
                          </text>
                        </g>
                      )}

                      {/* Connecting Line to Station Name */}
                      <line
                        x1="92"
                        y1={yPos}
                        x2="100"
                        y2={yPos}
                        stroke="#2A4470"
                        strokeWidth="1"
                      />

                      {/* Live Train Badges Adjacent to Station Node */}
                      {trainsAtStn.slice(0, 2).map((t, tIdx) => {
                        const chipX = 390 + tIdx * 110;
                        const isSelected = t.id === selectedTrainId;
                        const color = STATUS_COLORS[t.status] || STATUS_COLORS.unknown;

                        return (
                          <g
                            key={t.id}
                            className="cursor-pointer"
                            onClick={() => handleSelectTrain(t.id)}
                          >
                            <rect
                              x={chipX}
                              y={yPos - 13}
                              width="105"
                              height="26"
                              rx="4"
                              fill={isSelected ? '#1A2F50' : '#0F1A2E'}
                              stroke={isSelected ? '#3B82F6' : color}
                              strokeWidth={isSelected ? 2 : 1}
                            />
                            <text
                              x={chipX + 8}
                              y={yPos + 3}
                              fill={color}
                              fontSize="10"
                              fontFamily="JetBrains Mono"
                              fontWeight="600"
                            >
                              {t.id}
                            </text>
                            <text
                              x={chipX + 48}
                              y={yPos + 3}
                              fill="#94A3B8"
                              fontSize="9.5"
                              fontFamily="Inter"
                            >
                              {t.delay !== null ? (t.delay > 0 ? `+${t.delay}m` : 'On Time') : '—'}
                            </text>
                          </g>
                        );
                      })}

                      {trainsAtStn.length > 2 && (
                        <text
                          x="610"
                          y={yPos + 3}
                          fill="#4A6080"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                        >
                          +{trainsAtStn.length - 2}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Quick Selection Train Pills */}
          <div className="mt-4 pt-3 border-t border-[#1A2840]">
            <div className="text-[11px] font-data text-[#4A6080] uppercase tracking-wider mb-2">
              Select Monitored Train for Telemetry Inspection:
            </div>
            {flattenedMonitoredTrains.length === 0 ? (
              <div className="text-xs text-[#7A95B0] font-data py-2">
                {isRefreshingStations
                  ? 'Querying RailRadar live station boards...'
                  : 'No active trains reported in this corridor window.'}
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto pr-1">
                {flattenedMonitoredTrains.map((t) => {
                  const isSelected = selectedTrainId === t.id;
                  const color = STATUS_COLORS[t.status] || STATUS_COLORS.unknown;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTrain(t.id)}
                      className="flex items-center gap-1.5 text-xs font-data px-2.5 py-1.5 rounded border transition-all cursor-pointer"
                      style={{
                        borderColor: isSelected ? color : '#1A2840',
                        backgroundColor: isSelected ? `${color}18` : 'transparent',
                        color: isSelected ? color : '#7A95B0',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-semibold">{t.id}</span>
                      <span className="text-[10px] text-[#4A6080]">
                        {t.delay !== null ? (t.delay > 0 ? `+${t.delay}m` : 'OT') : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Detailed Telemetry, Derived Impact, and Legend */}
        <div className="space-y-4">
          {/* Selected Train Detailed Intelligence Card (Requirement 4) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Selected Train Intelligence</span>
              </div>
              {isFetchingTrainDetails && (
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              )}
            </div>

            {selectedTrainId ? (
              <div>
                {/* Train Header Banner */}
                <div
                  className="mb-4 p-3 bg-[#112035] rounded border-l-2"
                  style={{
                    borderColor:
                      STATUS_COLORS[
                        activeSelectedRecord?.status ||
                          (trainDetails?.delayMinutes != null && trainDetails.delayMinutes > 25
                            ? 'high-risk'
                            : trainDetails?.delayMinutes != null && trainDetails.delayMinutes > 5
                            ? 'delayed'
                            : 'on-time')
                      ],
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-data text-xs font-semibold text-white">
                      Train {selectedTrainId} ·{' '}
                      {trainDetails?.trainName || activeSelectedRecord?.name || 'Unavailable'}
                    </div>
                    <span
                      className="text-[10px] font-data font-semibold px-2 py-0.5 rounded uppercase"
                      style={{
                        backgroundColor: `${
                          STATUS_COLORS[activeSelectedRecord?.status || 'on-time']
                        }20`,
                        color: STATUS_COLORS[activeSelectedRecord?.status || 'on-time'],
                      }}
                    >
                      {activeSelectedRecord?.statusLabel ||
                        (trainDetails?.status ? trainDetails.status.toUpperCase() : 'Unavailable')}
                    </span>
                  </div>

                  <div className="text-xs text-[#7A95B0] mt-1.5 flex items-center justify-between">
                    <span>Current Delay:</span>
                    <span className="font-data font-semibold text-white">
                      {trainDetails?.delayMinutes !== undefined
                        ? trainDetails.delayMinutes > 0
                          ? `+${trainDetails.delayMinutes} min`
                          : 'On Time (0 min)'
                        : activeSelectedRecord?.delay !== null
                        ? activeSelectedRecord?.delay && activeSelectedRecord.delay > 0
                          ? `+${activeSelectedRecord.delay} min`
                          : 'On Time'
                        : 'Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Train Telemetry Breakdown (Requirement 4) */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#112035]">
                    <span className="text-[#7A95B0]">Current Location:</span>
                    <span className="font-data text-white text-right max-w-[180px] truncate">
                      {trainDetails?.currentLocation?.stationName ||
                        activeSelectedRecord?.stationName ||
                        'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#112035]">
                    <span className="text-[#7A95B0]">Previous Halt:</span>
                    <span className="font-data text-white text-right max-w-[180px] truncate">
                      {trainDetails?.previousHalt?.stationName || 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#112035]">
                    <span className="text-[#7A95B0]">Next Halt:</span>
                    <span className="font-data text-white text-right max-w-[180px] truncate">
                      {trainDetails?.nextHalt?.stationName || 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#112035]">
                    <span className="text-[#7A95B0]">Platform:</span>
                    <span className="font-data text-white">
                      {trainDetails?.platform || activeSelectedRecord?.platform || 'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#112035]">
                    <span className="text-[#7A95B0]">Running Status:</span>
                    <span className="font-data text-white capitalize">
                      {trainDetails?.status?.replace(/-/g, ' ') ||
                        activeSelectedRecord?.liveType?.replace(/-/g, ' ') ||
                        'Unavailable'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#112035]">
                    <span className="text-[#7A95B0]">Route Corridor:</span>
                    <span className="font-data text-white text-right">
                      {trainDetails?.train?.source?.code || activeSelectedRecord?.source || 'Origin'} →{' '}
                      {trainDetails?.train?.destination?.code ||
                        activeSelectedRecord?.destination ||
                        'Destination'}
                    </span>
                  </div>
                </div>

                {trainDetailsError && (
                  <div className="mt-2 p-2 bg-yellow-950/30 border border-yellow-800/40 rounded text-[11px] text-yellow-300">
                    Live train API: {trainDetailsError}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#7A95B0] font-data py-4 text-center">
                Select a train from the map to view detailed telemetry.
              </div>
            )}
          </Card>

          {/* Derived Network Congestion / Impact Card (Requirement 7) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
                Network Impact (Derived)
              </div>
              <span className="text-[10px] font-data px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Derived Telemetry
              </span>
            </div>

            <div className="space-y-1">
              {[
                {
                  label: 'Affected Trains',
                  value: `${networkMetrics.affectedTrainsCount} / ${networkMetrics.totalDetected}`,
                  desc: 'Trains delayed > 5m',
                },
                {
                  label: 'Affected Stations',
                  value: `${networkMetrics.affectedStationsCount} / ${monitoredStations.length}`,
                  desc: 'Stations reporting delay',
                },
                {
                  label: 'Congested Sections',
                  value: `${networkMetrics.congestedSectionsCount}`,
                  desc: 'Consecutive delayed stops',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-[#112035]"
                >
                  <div>
                    <div className="text-xs text-[#7A95B0]">{item.label}</div>
                    <div className="text-[10px] text-[#4A6080]">{item.desc}</div>
                  </div>
                  <div className="font-data font-semibold text-white text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Potential Delay Propagation (Predicted) */}
            <div className="mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] text-[#7A95B0] font-data">
                  Potential Delay Propagation
                </div>
                <span className="text-[9px] font-data px-1 py-0.2 rounded bg-[#EF4444]/20 text-[#EF4444]">
                  PREDICTED
                </span>
              </div>
              <div className="font-data font-semibold text-[#EF4444]">
                {networkMetrics.delayPropagationText}
              </div>
            </div>
          </Card>

          {/* Active Trains Around Monitored Stations (Requirement 3) */}
          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Active Trains · Monitored Network
            </div>
            {flattenedMonitoredTrains.length === 0 ? (
              <div className="text-xs text-[#7A95B0] font-data py-2">
                No active trains reported.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {flattenedMonitoredTrains.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTrain(t.id)}
                    className="flex items-center justify-between py-1.5 border-b border-[#112035] last:border-0 cursor-pointer hover:bg-[#112035]/40 px-1 rounded transition-colors"
                  >
                    <div>
                      <div className="font-data text-xs text-white">
                        {t.id} · <span className="text-[#B8D0E8]">{t.name.split(' ')[0]}</span>
                      </div>
                      <div className="text-[10px] text-[#4A6080]">
                        {t.stationCode} · {t.platform !== 'Unavailable' ? t.platform : 'PF ?'} ·{' '}
                        {t.expectedArrival !== 'Unavailable' ? `ETA ${t.expectedArrival}` : ''}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-data font-semibold"
                      style={{ color: STATUS_COLORS[t.status] }}
                    >
                      {t.delay !== null ? (t.delay > 0 ? `+${t.delay}m` : 'On Time') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status Legend */}
          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Status Legend
            </div>
            {[
              { label: 'On Time', status: 'on-time', desc: '≤ 5 min delay' },
              { label: 'Delayed', status: 'delayed', desc: '6–25 min delay' },
              { label: 'High Risk', status: 'high-risk', desc: '> 25 min delay or cascade risk' },
              { label: 'Unavailable', status: 'unknown', desc: 'Live data pending / not reported' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 py-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[item.status] }}
                />
                <div>
                  <div className="text-xs text-white font-medium">{item.label}</div>
                  <div className="text-[10px] text-[#4A6080]">{item.desc}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
