import { useState, useEffect, useCallback, useMemo, type ReactNode, type MouseEvent } from 'react';
import { useTrainData } from '../context/TrainContext';
import { RefreshCw, Plus, X } from 'lucide-react';
import type { RailRadarLiveData } from '../types/railradar';
import { railradarService } from '../services/railradarService';

const RISK_COLORS: Record<string, string> = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
};

const DEFAULT_WATCHLIST = ['12625', '12760', '17016', '12028', '11013', '16031', '12951', '12301'];
const WATCHLIST_STORAGE_KEY = 'railpredict_operations_watchlist';

const POPULAR_PRESETS = [
  { num: '12625', name: 'Kerala Express' },
  { num: '12760', name: 'Charminar SF' },
  { num: '17016', name: 'Visakha Exp' },
  { num: '12028', name: 'Shatabdi Exp' },
  { num: '11013', name: 'Coimbatore Exp' },
  { num: '16031', name: 'Andaman Exp' },
  { num: '12951', name: 'Tejas Rajdhani' },
  { num: '12301', name: 'Howrah Rajdhani' },
  { num: '12919', name: 'Malwa SF Exp' },
  { num: '12245', name: 'Howrah Duronto' },
];

const HOTSPOT_STATIONS = [
  { x: 160, label: 'Vijayawada', code: 'BZA' },
  { x: 280, label: 'Khammam', code: 'KMT' },
  { x: 400, label: 'Warangal', code: 'WL' },
  { x: 490, label: 'Kazipet', code: 'KZJ' },
  { x: 590, label: 'Secunderabad', code: 'SC' },
];

interface WatchlistTrainTelemetry {
  num: string;
  name: string;
  current: number;
  predicted: number;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  factor: string;
  status: string;
  currentLocation: string;
  speedKmh: number;
  destination: string;
  isLoading: boolean;
  error: string | null;
  raw?: RailRadarLiveData | null;
}

function loadInitialWatchlist(): string[] {
  try {
    const saved = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 5 && parsed.length <= 10) {
        return parsed.map((n) => String(n).trim()).filter(Boolean);
      }
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_WATCHLIST;
}

function computePredictedDelay(currentDelay: number, status?: string, route?: any[]): number {
  if (status === 'completed') return Math.max(0, currentDelay);
  if (status === 'not-started') return 0;
  if (route && route.length > 0) {
    const destHalt = route[route.length - 1];
    if (destHalt && typeof destHalt.delayArrival === 'number') {
      return Math.max(0, destHalt.delayArrival);
    }
  }
  // Standard recovery curve: express runs usually recover ~12% delay over remaining route
  return Math.max(0, Math.round(currentDelay * 0.88));
}

function deriveOperationalFactor(delay: number, status?: string): string {
  if (status === 'completed') return 'Terminated';
  if (status === 'not-started') return 'Origin Yard';
  if (delay > 35) return 'Section Congestion';
  if (delay > 20) return 'Junction Load';
  if (delay > 10) return 'Signal Hold';
  if (delay > 4) return 'Speed Limit';
  return 'Normal';
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color = '#E2E8F0',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0B111D] border border-[#182335] rounded-sm p-3.5 space-y-1">
      <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
        {label}
      </div>
      <div className="font-mono font-bold text-2xl" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-[10px] font-mono text-[#64748B] truncate">{sub}</div>}
    </div>
  );
}

export function OperationsDashboard() {
  const [filter, setFilter] = useState<string>('all');
  const [watchlist, setWatchlist] = useState<string[]>(loadInitialWatchlist);
  const [fleetMap, setFleetMap] = useState<Record<string, WatchlistTrainTelemetry>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [newTrainInput, setNewTrainInput] = useState<string>('');
  const [inputError, setInputError] = useState<string>('');
  const [showWatchlistEditor, setShowWatchlistEditor] = useState<boolean>(false);

  const {
    trainData,
    selectedTrainNumber,
    searchTrain,
    isFallback,
    journeyDate,
    currentISTDate,
  } = useTrainData();

  const activeDate = journeyDate || currentISTDate;

  // Persist watchlist changes
  const updateWatchlist = (newList: string[]) => {
    setWatchlist(newList);
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const handleAddTrain = (trainToAdd?: string) => {
    const target = (trainToAdd || newTrainInput).trim();
    const cleanNum = target.replace(/\D/g, '');

    if (!cleanNum || cleanNum.length < 4 || cleanNum.length > 5) {
      setInputError('Enter 4-5 numeric digits (e.g. 12951)');
      return;
    }
    if (watchlist.includes(cleanNum)) {
      setInputError(`Train ${cleanNum} is already on the watchlist`);
      return;
    }
    if (watchlist.length >= 10) {
      setInputError('Watchlist capacity reached (maximum 10 trains)');
      return;
    }

    setInputError('');
    setNewTrainInput('');
    const updated = [...watchlist, cleanNum];
    updateWatchlist(updated);
  };

  const handleRemoveTrain = (numToRemove: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    if (watchlist.length <= 5) {
      setInputError('Watchlist minimum reached (at least 5 trains required)');
      return;
    }
    setInputError('');
    const updated = watchlist.filter((n) => n !== numToRemove);
    updateWatchlist(updated);
  };

  // Asynchronous telemetry fetch across all watchlist trains
  const syncWatchlistTelemetry = useCallback(
    async (trainList: string[], dateStr: string) => {
      setIsSyncing(true);

      // Set initial loading indicator for trains without data
      setFleetMap((prev) => {
        const next = { ...prev };
        trainList.forEach((num) => {
          next[num] = {
            ...(next[num] || {
              num,
              name: `Train ${num}`,
              current: 0,
              predicted: 0,
              risk: 'LOW',
              factor: 'Connecting...',
              status: 'running',
              currentLocation: '',
              speedKmh: 0,
              destination: '',
              error: null,
            }),
            isLoading: true,
          };
        });
        return next;
      });

      for (let i = 0; i < trainList.length; i++) {
        const num = trainList[i];
        try {
          // If this train is already loaded in global TrainContext, reuse directly
          if (trainData && trainData.trainNumber === num) {
            const data: RailRadarLiveData = trainData;
            const curDelay = Math.max(0, data.delayMinutes ?? 0);
            const predicted = computePredictedDelay(curDelay, data.status, data.route);
            const risk: 'HIGH' | 'MEDIUM' | 'LOW' =
              curDelay > 20 || predicted > 25
                ? 'HIGH'
                : curDelay > 10 || predicted > 12
                ? 'MEDIUM'
                : 'LOW';
            const factor = deriveOperationalFactor(curDelay, data.status);
            const trainName = data.trainName || data.train?.name || `Train ${num}`;

            setFleetMap((prev) => ({
              ...prev,
              [num]: {
                num,
                name: trainName,
                current: curDelay,
                predicted,
                risk,
                factor,
                status: data.status || 'running',
                currentLocation:
                  data.currentLocation?.stationName ||
                  data.currentLocation?.stationCode ||
                  '',
                speedKmh: data.currentLocation?.speedKmh ?? 0,
                destination: data.route?.[data.route.length - 1]?.stationName || '',
                isLoading: false,
                error: null,
                raw: data,
              },
            }));
            continue;
          }

          // If in rate-limit cooldown, check if cached data exists before querying
          if (railradarService.isCurrentlyRateLimited()) {
            const cachedRes = railradarService.getCachedTrain(num, dateStr);
            if (!cachedRes) {
              setFleetMap((prev) => ({
                ...prev,
                [num]: {
                  ...(prev[num] || {
                    num,
                    name: `Train ${num}`,
                    current: 0,
                    predicted: 0,
                    risk: 'LOW',
                    factor: 'Cooldown',
                    status: 'not-started',
                    currentLocation: '',
                    speedKmh: 0,
                    destination: '',
                  }),
                  isLoading: false,
                  error: 'Rate limit cooldown active',
                },
              }));
              continue;
            }
          }

          const json = await railradarService.fetchLiveTrain(num, dateStr, {
            authoritative: false,
          });

          if (json.success && json.data) {
            const data: RailRadarLiveData = json.data;
            const curDelay = Math.max(0, data.delayMinutes ?? 0);
            const predicted = computePredictedDelay(curDelay, data.status, data.route);
            const risk: 'HIGH' | 'MEDIUM' | 'LOW' =
              curDelay > 20 || predicted > 25
                ? 'HIGH'
                : curDelay > 10 || predicted > 12
                ? 'MEDIUM'
                : 'LOW';
            const factor = deriveOperationalFactor(curDelay, data.status);
            const trainName = data.trainName || data.train?.name || `Train ${num}`;

            setFleetMap((prev) => ({
              ...prev,
              [num]: {
                num,
                name: trainName,
                current: curDelay,
                predicted,
                risk,
                factor,
                status: data.status || 'running',
                currentLocation:
                  data.currentLocation?.stationName ||
                  data.currentLocation?.stationCode ||
                  '',
                speedKmh: data.currentLocation?.speedKmh ?? 0,
                destination: data.route?.[data.route.length - 1]?.stationName || '',
                isLoading: false,
                error: null,
                raw: data,
              },
            }));
          } else {
            setFleetMap((prev) => ({
              ...prev,
              [num]: {
                ...(prev[num] || {
                  num,
                  name: `Train ${num}`,
                  current: 0,
                  predicted: 0,
                  risk: 'LOW',
                  factor: 'Standby',
                  status: 'not-started',
                  currentLocation: '',
                  speedKmh: 0,
                  destination: '',
                }),
                isLoading: false,
                error: json.error?.message || 'Data unavailable',
              },
            }));
          }
        } catch (err: any) {
          setFleetMap((prev) => ({
            ...prev,
            [num]: {
              ...(prev[num] || {
                num,
                name: `Train ${num}`,
                current: 0,
                predicted: 0,
                risk: 'LOW',
                factor: 'Connection Issue',
                status: 'not-started',
                currentLocation: '',
                speedKmh: 0,
                destination: '',
              }),
              isLoading: false,
              error: err.message,
            },
          }));
        }
      }

      setIsSyncing(false);
      setLastSyncTime(new Date());
    },
    [trainData]
  );

  // Initial and reactive load on watchlist or date change
  useEffect(() => {
    syncWatchlistTelemetry(watchlist, activeDate);
  }, [watchlist, activeDate, syncWatchlistTelemetry]);

  // Synchronize when active train in TrainContext is updated
  useEffect(() => {
    if (trainData && selectedTrainNumber && watchlist.includes(selectedTrainNumber)) {
      const curDelay = Math.max(0, trainData.delayMinutes ?? 0);
      const predicted = computePredictedDelay(curDelay, trainData.status, trainData.route);
      const risk: 'HIGH' | 'MEDIUM' | 'LOW' =
        curDelay > 20 || predicted > 25
          ? 'HIGH'
          : curDelay > 10 || predicted > 12
          ? 'MEDIUM'
          : 'LOW';
      const factor = deriveOperationalFactor(curDelay, trainData.status);
      const trainName =
        trainData.trainName || trainData.train?.name || `Train ${selectedTrainNumber}`;

      setFleetMap((prev) => ({
        ...prev,
        [selectedTrainNumber]: {
          num: selectedTrainNumber,
          name: trainName,
          current: curDelay,
          predicted,
          risk,
          factor,
          status: trainData.status || 'running',
          currentLocation:
            trainData.currentLocation?.stationName ||
            trainData.currentLocation?.stationCode ||
            '',
          speedKmh: trainData.currentLocation?.speedKmh ?? 0,
          destination:
            trainData.route?.[trainData.route.length - 1]?.stationName || '',
          isLoading: false,
          error: null,
          raw: trainData,
        },
      }));
    }
  }, [trainData, selectedTrainNumber, watchlist]);

  // Formatted list of fleet items matching current watchlist order
  const fleetList: WatchlistTrainTelemetry[] = useMemo(() => {
    return watchlist.map((num) => {
      return (
        fleetMap[num] || {
          num,
          name: `Train ${num}`,
          current: 0,
          predicted: 0,
          risk: 'LOW',
          factor: 'Syncing...',
          status: 'running',
          currentLocation: '',
          speedKmh: 0,
          destination: '',
          isLoading: true,
          error: null,
        }
      );
    });
  }, [watchlist, fleetMap]);

  // Dynamically calculate operational metrics from live fleet
  const activeRunningCount = fleetList.filter((t) => t.status === 'running').length;
  const notStartedCount = fleetList.filter((t) => t.status === 'not-started').length;
  const delayedTrains = fleetList.filter((t) => t.current > 5 || t.predicted > 5);
  const highRiskTrains = fleetList.filter((t) => t.risk === 'HIGH');
  const delayPercentage =
    fleetList.length > 0
      ? Math.round((delayedTrains.length / fleetList.length) * 100)
      : 0;

  // Recalculate hotspot station severity and radius from live train delays
  const hotspotNodes = useMemo(() => {
    return HOTSPOT_STATIONS.map((station) => {
      // Find monitored trains that interact with this station
      const relevantTrains = fleetList.filter((t) => {
        if (!t.raw) return false;
        const isCurrentStation =
          t.raw.currentLocation?.stationCode === station.code ||
          t.raw.currentLocation?.stationName
            ?.toLowerCase()
            .includes(station.label.toLowerCase());
        const hasRouteHalt = t.raw.route?.some((h) => h.stationCode === station.code);
        return isCurrentStation || hasRouteHalt;
      });

      let calculatedDelay = 0;
      if (relevantTrains.length > 0) {
        calculatedDelay = Math.max(
          ...relevantTrains.map((t) => {
            const halt = t.raw?.route?.find((h) => h.stationCode === station.code);
            return halt && typeof halt.delayArrival === 'number'
              ? Math.max(0, halt.delayArrival)
              : t.current;
          })
        );
      } else {
        // Ambient corridor interpolation from active running fleet
        const runningDelays = fleetList
          .filter((t) => t.status === 'running')
          .map((t) => t.current);
        calculatedDelay =
          runningDelays.length > 0
            ? Math.round(runningDelays.reduce((a, b) => a + b, 0) / runningDelays.length)
            : 0;
      }

      const severity: 'HIGH' | 'MEDIUM' | 'LOW' =
        calculatedDelay > 20 ? 'HIGH' : calculatedDelay > 8 ? 'MEDIUM' : 'LOW';
      const color = RISK_COLORS[severity];
      const r = severity === 'HIGH' ? 28 : severity === 'MEDIUM' ? 20 : 14;

      return {
        ...station,
        delay: severity,
        delayMinutes: calculatedDelay,
        r,
        color,
      };
    });
  }, [fleetList]);

  const criticalHotspotsCount = hotspotNodes.filter((h) => h.delay === 'HIGH').length;
  const moderateHotspotsCount = hotspotNodes.filter((h) => h.delay === 'MEDIUM').length;
  const congestedSectionsCount = criticalHotspotsCount + moderateHotspotsCount;

  // Dynamically place monitored trains onto the Hotspot SVG diagram
  const activeMapTrains = useMemo(() => {
    const running = fleetList.filter((t) => t.status === 'running');
    if (running.length === 0) return [];

    return running.slice(0, 3).map((t, idx) => {
      // Find station match or interpolate along line (80 to 620)
      let targetX = 140 + idx * 160;
      if (t.raw?.currentLocation?.stationCode) {
        const found = HOTSPOT_STATIONS.find(
          (s) => s.code === t.raw?.currentLocation?.stationCode
        );
        if (found) targetX = found.x - 20;
      }
      return {
        num: t.num,
        x: Math.max(100, Math.min(600, targetX)),
        color: RISK_COLORS[t.risk],
      };
    });
  }, [fleetList]);

  // Recalculate operational conflicts dynamically from live telemetry
  const dynamicConflicts = useMemo(() => {
    const conflicts: Array<{
      type: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      station: string;
      detail: string;
    }> = [];

    // 1. Check for trains with severe delay (>25m)
    fleetList
      .filter((t) => t.current >= 25 && t.status === 'running')
      .slice(0, 2)
      .forEach((t) => {
        conflicts.push({
          type: 'Section Congestion',
          severity: 'HIGH',
          station: t.currentLocation || t.destination || 'Active Section',
          detail: `Train ${t.num} (${t.name}) delayed by +${t.current} min due to section congestion`,
        });
      });

    // 2. Check for high-delay hotspot junctions
    hotspotNodes
      .filter((h) => h.delay === 'HIGH')
      .slice(0, 1)
      .forEach((h) => {
        conflicts.push({
          type: 'Junction Congestion',
          severity: 'HIGH',
          station: h.label,
          detail: `Cumulative junction delay +${h.delayMinutes} min across approaching services`,
        });
      });

    // 3. Moderate delay / speed restriction conflicts
    fleetList
      .filter((t) => t.current > 10 && t.current < 25 && t.status === 'running')
      .slice(0, 2)
      .forEach((t) => {
        conflicts.push({
          type: 'Track Restriction',
          severity: 'MEDIUM',
          station: t.currentLocation || 'Transit Corridor',
          detail: `Train ${t.num} regulated to maintain headway (+${t.current} min)`,
        });
      });

    // 4. Default nominal status if network is flowing smoothly
    if (conflicts.length < 4) {
      const onTimeCount = fleetList.filter((t) => t.current <= 5).length;
      conflicts.push({
        type: 'Corridor Dispatch',
        severity: 'LOW',
        station: 'South Central Mainline',
        detail: `${onTimeCount} monitored trains operating within nominal schedule tolerance`,
      });
    }

    return conflicts.slice(0, 4);
  }, [fleetList, hotspotNodes]);

  const filteredTrains = fleetList.filter(
    (t) => filter === 'all' || t.risk === filter
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
              Operations Center
            </span>
            <span className="text-[9px] font-data px-1.5 py-0.2 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/30">
              {!isFallback ? 'RailRadar Live Fleet' : 'Authoritative Stream'}
            </span>
            <span className="text-[9px] font-data px-1.5 py-0.2 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
              {watchlist.length} Monitored Trains
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Railway Operations Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => syncWatchlistTelemetry(watchlist, activeDate)}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-[11px] font-data px-2.5 py-1.5 rounded bg-[#1A2840] hover:bg-[#223657] text-[#93C5FD] border border-[#2B4366] transition-colors cursor-pointer disabled:opacity-50"
            title="Sync live telemetry across all monitored trains"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Fleet'}</span>
          </button>
          <div className="text-[10px] font-data text-[#4A6080]">
            Last sync:{' '}
            {lastSyncTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            IST
          </div>
        </div>
      </div>

      {/* Dynamic Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Trains"
          value={String(activeRunningCount)}
          sub={`${fleetList.length} on watchlist • ${notStartedCount} scheduled`}
        />
        <MetricCard
          label="Predicted Delays"
          value={String(delayedTrains.length)}
          sub={`${delayPercentage}% of monitored fleet (>5 min)`}
          color="#F59E0B"
        />
        <MetricCard
          label="High Risk Trains"
          value={String(highRiskTrains.length)}
          sub={
            highRiskTrains.length > 0
              ? `${highRiskTrains.length} exceed tolerance (>20m)`
              : 'All within tolerance'
          }
          color="#EF4444"
        />
        <MetricCard
          label="Congested Sections"
          value={String(congestedSectionsCount)}
          sub={`${criticalHotspotsCount} critical, ${moderateHotspotsCount} moderate`}
          color="#F97316"
        />
      </div>

      {/* Delay Hotspot Map with Live Recalculated Severity */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
            Delay Hotspot Map — South Central Zone (Live Delay Severity)
          </div>
          <div className="text-[10px] font-data text-[#3B82F6]">
            Live Node Headway & Telemetry
          </div>
        </div>
        <div className="relative bg-[#080F1E] rounded-lg overflow-hidden" style={{ height: 220 }}>
          <svg viewBox="0 0 700 220" width="100%" height="100%">
            <defs>
              <pattern
                id="opsgrid"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#0E1E35"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="700" height="220" fill="url(#opsgrid)" />

            {/* Corridor track lines */}
            <line x1="80" y1="110" x2="620" y2="110" stroke="#1E3354" strokeWidth="3" />
            <line x1="350" y1="110" x2="350" y2="50" stroke="#1E3354" strokeWidth="2" />
            <line x1="500" y1="110" x2="550" y2="60" stroke="#1E3354" strokeWidth="2" />

            {/* Recalculated Hotspot Station Nodes */}
            {hotspotNodes.map((node) => (
              <g key={node.label}>
                <circle cx={node.x} cy={110} r={node.r} fill={node.color} opacity={0.15} />
                <circle cx={node.x} cy={110} r={8} fill={node.color} opacity={0.8} />
                <circle cx={node.x} cy={110} r={4} fill={node.color} />
                <text
                  x={node.x}
                  y={137}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                >
                  {node.label.split(' ')[0]}
                </text>
                <text
                  x={node.x}
                  y={149}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                  opacity={0.8}
                >
                  {node.delay} {node.delayMinutes > 0 ? `(+${node.delayMinutes}m)` : ''}
                </text>
              </g>
            ))}

            {/* Live Train Badges positioned along the corridor */}
            {activeMapTrains.map((t) => (
              <g key={t.num}>
                <rect
                  x={t.x}
                  y={98}
                  width="40"
                  height="14"
                  rx="2"
                  fill="#0E1A2E"
                  stroke={t.color}
                  strokeWidth="1"
                />
                <text
                  x={t.x + 20}
                  y={109}
                  textAnchor="middle"
                  fill={t.color}
                  fontSize="8"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  {t.num}
                </text>
              </g>
            ))}
          </svg>

          <div className="absolute bottom-3 right-3 flex items-center gap-4 text-[9px] font-data">
            {[
              ['HIGH (>20m)', '#EF4444'],
              ['MEDIUM (8-20m)', '#F59E0B'],
              ['LOW (≤8m)', '#10B981'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                <span style={{ color }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Train Risk Table with Configurable Watchlist */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
                Train Risk & Telemetry Monitor
              </span>
              <span className="text-[10px] font-data px-2 py-0.5 rounded bg-[#1A2F50] text-[#60A5FA]">
                {watchlist.length}/10 in Watchlist
              </span>
            </div>
            <div className="text-xs text-[#3B5E8C] mt-0.5">
              Live telemetry fetched asynchronously • Click any train to track
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowWatchlistEditor(!showWatchlistEditor)}
              className="text-[10px] font-data px-2.5 py-1 rounded bg-[#132238] hover:bg-[#1A2F50] text-[#93C5FD] border border-[#233A5C] transition-colors cursor-pointer"
            >
              {showWatchlistEditor ? 'Close Watchlist' : 'Configure Watchlist (5–10)'}
            </button>

            <div className="flex gap-1">
              {['all', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilter(lvl)}
                  className={`text-[10px] font-data px-2.5 py-1 rounded transition-all cursor-pointer ${
                    filter === lvl
                      ? 'bg-[#1A2F50] text-[#3B82F6] border border-[#3B82F6]'
                      : 'text-[#4A6080] border border-transparent hover:text-[#7A95B0]'
                  }`}
                >
                  {lvl === 'all' ? 'All' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inline Watchlist Editor (Configurable 5-10 trains) */}
        {showWatchlistEditor && (
          <div className="mb-4 p-3 bg-[#0A1322] border border-[#1C2C45] rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] font-data text-[#88A3C7]">
                Manage Active Watchlist ({watchlist.length}/10 trains, minimum 5 required):
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Train # (e.g. 12951)"
                  value={newTrainInput}
                  onChange={(e) => setNewTrainInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTrain();
                  }}
                  className="bg-[#0D192C] border border-[#233957] rounded px-2.5 py-1 text-xs text-white font-data placeholder-[#3E5676] w-36 focus:outline-none focus:border-[#3B82F6]"
                />
                <button
                  onClick={() => handleAddTrain()}
                  disabled={watchlist.length >= 10}
                  className="flex items-center gap-1 text-xs font-data px-2.5 py-1 rounded bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {inputError && (
              <div className="text-xs text-[#EF4444] font-data">{inputError}</div>
            )}

            {/* Quick Add Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-data text-[#4A6080]">Quick Presets:</span>
              {POPULAR_PRESETS.map((preset) => {
                const isAdded = watchlist.includes(preset.num);
                return (
                  <button
                    key={preset.num}
                    onClick={() => (isAdded ? handleRemoveTrain(preset.num) : handleAddTrain(preset.num))}
                    className={`text-[10px] font-data px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      isAdded
                        ? 'bg-[#1E3A5F] text-[#60A5FA] border border-[#3B82F6]'
                        : 'bg-[#112035] text-[#7A95B0] hover:text-white border border-[#1A2840]'
                    }`}
                  >
                    {isAdded ? '✓ ' : '+ '}
                    {preset.num} {preset.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A2840]">
                {['Train', 'Name', 'Current Delay', 'Predicted Dest.', 'Risk', 'Main Factor', 'Action'].map(
                  (header) => (
                    <th
                      key={header}
                      className="text-left py-2 px-3 text-[11px] font-data text-[#4A6080] uppercase tracking-wider font-medium"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredTrains.map((t) => {
                const isCurrent = t.num === selectedTrainNumber;
                return (
                  <tr
                    key={t.num}
                    onClick={() => searchTrain(t.num)}
                    className={`border-b border-[#112035] hover:bg-[#112035] transition-colors cursor-pointer ${
                      isCurrent ? 'bg-[#1A2F50]/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-data text-white font-semibold flex items-center gap-2">
                      <span>{t.num}</span>
                      {isCurrent && (
                        <span className="text-[9px] font-data bg-[#3B82F6]/20 text-[#60A5FA] px-1 rounded border border-[#3B82F6]/30">
                          Active
                        </span>
                      )}
                      {t.isLoading && (
                        <RefreshCw className="w-2.5 h-2.5 text-[#3B82F6] animate-spin" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-[#7A95B0] truncate max-w-[200px]" title={t.name}>
                      {t.name}
                    </td>
                    <td
                      className="py-3 px-3 font-data font-semibold"
                      style={{
                        color:
                          t.current > 15
                            ? '#EF4444'
                            : t.current > 5
                            ? '#F59E0B'
                            : '#10B981',
                      }}
                    >
                      {t.current > 0 ? `+${t.current}` : '0'} min
                    </td>
                    <td
                      className="py-3 px-3 font-data"
                      style={{
                        color:
                          t.predicted > 20
                            ? '#EF4444'
                            : t.predicted > 10
                            ? '#F59E0B'
                            : '#10B981',
                      }}
                    >
                      +{t.predicted} min
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="text-[10px] font-data font-semibold px-2 py-0.5 rounded border"
                        style={{
                          color: RISK_COLORS[t.risk],
                          borderColor: RISK_COLORS[t.risk] + '40',
                          backgroundColor: RISK_COLORS[t.risk] + '10',
                        }}
                      >
                        {t.risk}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#7A95B0]">{t.factor}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            searchTrain(t.num);
                          }}
                          className="text-[11px] text-[#3B82F6] hover:text-white px-2 py-0.5 rounded bg-[#112035] hover:bg-[#3B82F6] transition-colors cursor-pointer"
                        >
                          Track
                        </button>
                        {watchlist.length > 5 && (
                          <button
                            onClick={(e) => handleRemoveTrain(t.num, e)}
                            title="Remove from watchlist"
                            className="text-[#4A6080] hover:text-[#EF4444] p-0.5 rounded hover:bg-[#1A2840] transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Dynamic Upcoming Operational Conflicts */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
            Upcoming Operational Conflicts
          </div>
          <div className="text-[10px] font-data text-[#4A6080]">
            Derived from live watchlist telemetry
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dynamicConflicts.map((item, idx) => (
            <div
              key={`${item.station}-${idx}`}
              className="flex items-start gap-3 p-3 bg-[#112035] rounded-lg border-l-2"
              style={{ borderColor: RISK_COLORS[item.severity] }}
            >
              <div className="flex-shrink-0 mt-0.5">
                <span
                  className="text-[10px] font-data font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    color: RISK_COLORS[item.severity],
                    backgroundColor: RISK_COLORS[item.severity] + '15',
                  }}
                >
                  {item.severity}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">{item.type}</div>
                <div className="text-xs text-[#4A6080] mt-0.5">{item.station}</div>
                <div className="text-xs text-[#3B5E8C] mt-0.5">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
