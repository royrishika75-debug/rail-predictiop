import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTrainData } from '../context/TrainContext';
import { railradarService } from '../services/railradarService';

interface LiveTrainAtStation {
  id: string; // train number
  name: string;
  from: string; // formatted HH:MM (DERIVED occupancy start)
  to: string; // formatted HH:MM (DERIVED occupancy end)
  startMinutes: number;
  endMinutes: number;
  status: string; // 'upcoming' | 'at-station' | 'departed' | 'not-started'
  delay: number;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  expectedArrival: string | null;
  expectedDeparture: string | null;
  platform: string | null; // LIVE platform string (e.g. '1', '6')
  isConflict?: boolean;
}

interface PlatformGroup {
  num: string;
  status: 'conflict' | 'occupied' | 'expected' | 'available';
  statusLabel: string;
  color: string;
  trains: LiveTrainAtStation[];
  available: boolean;
}

interface PlatformConflict {
  platform: string;
  trainA: LiveTrainAtStation;
  trainB: LiveTrainAtStation;
  overlapMinutes: number;
}

function parseMinutes(s?: string | null): number | null {
  if (!s || s === '--:--') return null;
  const str = String(s).trim();
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    if (timePart) {
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
      }
    }
  }
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
  }
  return null;
}

function formatMinutes(mins: number | null): string {
  if (mins === null || isNaN(mins)) return '--:--';
  const m = ((mins % 1440) + 1440) % 1440;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatTimeHHMM(raw?: string | null): string {
  if (!raw) return '--:--';
  const m = parseMinutes(raw);
  return formatMinutes(m);
}

function cleanPlatform(raw?: string | null): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'none') return null;
  const match = str.match(/^(?:PF\s*|Platform\s*)?([A-Za-z0-9]+)$/i);
  return match ? match[1] : str;
}

function timeToPct(timeMins: number, startMins: number, totalSpan: number): number {
  let diff = timeMins - startMins;
  if (diff < -720) diff += 1440;
  else if (diff > 720) diff -= 1440;
  const pct = (diff / totalSpan) * 100;
  return Math.max(0, Math.min(100, pct));
}

function Card({ children, className = '' }: { children: ReactNode; className?: string; key?: string | number }) {
  return (
    <div className={`bg-[#0C1526] border border-[#1A2840] rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function PlatformForecast() {
  const { selectedTrainNumber, trainData, isLoading: isTrainLoading } = useTrainData();

  // Active station state
  const [stationCode, setStationCode] = useState<string>('');
  const [stationName, setStationName] = useState<string>('');

  // Loaded data state
  const [platformGroups, setPlatformGroups] = useState<PlatformGroup[]>([]);
  const [unassignedTrains, setUnassignedTrains] = useState<LiveTrainAtStation[]>([]);
  const [conflicts, setConflicts] = useState<PlatformConflict[]>([]);
  const [timelineTicks, setTimelineTicks] = useState<string[]>([]);
  const [timelineStartMins, setTimelineStartMins] = useState<number>(0);
  const [timelineSpanMins, setTimelineSpanMins] = useState<number>(120);

  // Status states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Available halts on the selected train's route
  const availableHalts = useMemo(() => {
    if (!trainData?.route) return [];
    return trainData.route.filter((s) => s.isHalt && s.stationCode);
  }, [trainData]);

  // 15. When selected train changes, completely reload relevant station and platform data.
  // Do not retain stale data from the previous train.
  useEffect(() => {
    setPlatformGroups([]);
    setUnassignedTrains([]);
    setConflicts([]);
    setError(null);

    if (!selectedTrainNumber || !trainData) {
      setStationCode('');
      setStationName('');
      setIsLoading(false);
      return;
    }

    // 2. Determine relevant station dynamically from selected train's REAL route/current/next halt data
    const nextHaltCode = trainData.nextHalt?.stationCode;
    const curLocCode = trainData.currentLocation?.stationCode;
    const routeHalts = (trainData.route || []).filter((s) => s.isHalt);

    let targetCode = '';
    let targetName = '';

    if (nextHaltCode) {
      targetCode = nextHaltCode;
      targetName = trainData.nextHalt?.stationName || nextHaltCode;
    } else if (curLocCode) {
      targetCode = curLocCode;
      targetName = trainData.currentLocation?.stationName || curLocCode;
    } else if (routeHalts.length > 0) {
      targetCode = routeHalts[0].stationCode;
      targetName = routeHalts[0].stationName || routeHalts[0].stationCode;
    }

    if (!targetCode) {
      setError('No valid station halts found along the selected train route.');
      return;
    }

    setStationCode(targetCode);
    setStationName(targetName);
  }, [selectedTrainNumber, trainData]);

  // Query RailRadar station live board for that actual station
  useEffect(() => {
    if (!stationCode) return;

    let isCancelled = false;

    async function loadStationPlatforms() {
      setIsLoading(true);
      setError(null);
      setPlatformGroups([]);
      setUnassignedTrains([]);
      setConflicts([]);

      try {
        // Query RailRadar station live board via centralized service
        const json = await railradarService.fetchStationLive(stationCode, {
          hours: 4,
          includeIntermediate: true,
          authoritative: false,
        });
        if (isCancelled) return;

        if (!json.success || !json.data) {
          if (json.status === 429) {
            setError('Platform data unavailable: RailRadar API rate limit reached. Please wait before refreshing.');
          } else {
            setError(json.error?.message || 'Platform data unavailable from upstream railway telemetry.');
          }
          setIsLoading(false);
          return;
        }

        // 14. Use the actual station name returned by RailRadar / train route
        const returnedStationName = json.meta?.stationName || json.data?.stationName || json.data?.station?.name;
        if (returnedStationName) {
          setStationName(returnedStationName);
        }

        const rawTrains: any[] = json.data?.trains || [];
        if (rawTrains.length === 0) {
          setError(`Platform data unavailable. No active or scheduled trains found on station board for ${stationName || stationCode}.`);
          setIsLoading(false);
          return;
        }

        // 4 & 5. Use REAL trains from station board to build platform forecast
        const unassigned: LiveTrainAtStation[] = [];
        const platformMap: Record<string, LiveTrainAtStation[]> = {};

        for (const t of rawTrains) {
          const trainNum = t.train?.number;
          if (!trainNum) continue;
          const tName = t.train?.name || `Train ${trainNum}`;
          const rawPlatform = t.stop?.platform;
          const pf = cleanPlatform(rawPlatform);
          const delay = typeof t.live?.delayMinutes === 'number' ? t.live.delayMinutes : 0;
          const status = t.live?.type || 'upcoming';

          const schArrStr = t.stop?.arrival;
          const schDepStr = t.stop?.departure;
          const expArrIso = t.live?.expectedArrivalTime;
          const expDepIso = t.live?.expectedDepartureTime;

          const schArrM = parseMinutes(schArrStr);
          const schDepM = parseMinutes(schDepStr);
          const expArrM = parseMinutes(expArrIso);
          const expDepM = parseMinutes(expDepIso);

          let startM: number | null = null;
          let endM: number | null = null;

          if (expArrM !== null) {
            startM = expArrM;
          } else if (schArrM !== null) {
            startM = schArrM + Math.max(0, delay);
          }

          if (expDepM !== null) {
            endM = expDepM;
          } else if (schDepM !== null) {
            endM = schDepM + Math.max(0, delay);
          }

          // 11. Calculate platform occupancy intervals from actual arrival/departure times
          if (startM === null && endM !== null) {
            // Originating train: placed on platform ~20 mins before departure
            startM = endM - 20;
          } else if (endM === null && startM !== null) {
            // Terminating train: occupies platform ~15 mins after arrival
            endM = startM + 15;
          } else if (startM !== null && endM !== null) {
            // Through train: ensure minimum 5 min clearance interval
            if (endM <= startM) {
              endM = startM + 5;
            }
          }

          const trainObj: LiveTrainAtStation = {
            id: trainNum,
            name: tName,
            from: formatMinutes(startM),
            to: formatMinutes(endM),
            startMinutes: startM ?? 0,
            endMinutes: endM ?? (startM ? startM + 10 : 0),
            status,
            delay,
            scheduledArrival: schArrStr ? formatTimeHHMM(schArrStr) : null,
            scheduledDeparture: schDepStr ? formatTimeHHMM(schDepStr) : null,
            expectedArrival: expArrM !== null ? formatMinutes(expArrM) : null,
            expectedDeparture: expDepM !== null ? formatMinutes(expDepM) : null,
            platform: pf,
          };

          if (pf) {
            if (!platformMap[pf]) platformMap[pf] = [];
            platformMap[pf].push(trainObj);
          } else {
            // 10. If train has no platform, keep in unassigned rather than assigning fake platform
            unassigned.push(trainObj);
          }
        }

        // 18. If station board does not provide enough platform information, show "Platform data unavailable"
        const platformKeys = Object.keys(platformMap);
        if (platformKeys.length === 0) {
          setUnassignedTrains(unassigned);
          setError(
            `Platform data unavailable. Station board for ${stationName || stationCode} returned ${rawTrains.length} trains, but no live platform assignments have been announced yet by station operations.`
          );
          setIsLoading(false);
          return;
        }

        // Sort platforms numerically where possible
        platformKeys.sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });

        // 12. Detect overlapping trains on SAME platform and label as: "Potential conflict — Derived"
        const detectedConflicts: PlatformConflict[] = [];
        const groups: PlatformGroup[] = [];

        for (const pKey of platformKeys) {
          const trs = platformMap[pKey];
          trs.sort((a, b) => a.startMinutes - b.startMinutes);

          let platformHasConflict = false;

          for (let i = 0; i < trs.length; i++) {
            for (let j = i + 1; j < trs.length; j++) {
              const t1 = trs[i];
              const t2 = trs[j];
              const ovStart = Math.max(t1.startMinutes, t2.startMinutes);
              const ovEnd = Math.min(t1.endMinutes, t2.endMinutes);
              if (ovStart < ovEnd) {
                const overlapMins = ovEnd - ovStart;
                t1.isConflict = true;
                t2.isConflict = true;
                platformHasConflict = true;
                detectedConflicts.push({
                  platform: pKey,
                  trainA: t1,
                  trainB: t2,
                  overlapMinutes: overlapMins,
                });
              }
            }
          }

          let status: 'conflict' | 'occupied' | 'expected' | 'available' = 'available';
          let statusLabel = 'Available';
          let color = '#10B981';

          if (platformHasConflict) {
            status = 'conflict';
            statusLabel = 'Potential conflict — Derived';
            color = '#EF4444';
          } else if (trs.some((t) => t.status === 'at-station')) {
            status = 'occupied';
            statusLabel = 'Occupied';
            color = '#F59E0B';
          } else if (trs.length > 0) {
            status = 'expected';
            statusLabel = 'Expected Arrival';
            color = '#3B82F6';
          }

          groups.push({
            num: pKey,
            status,
            statusLabel,
            color,
            trains: trs,
            available: trs.length === 0,
          });
        }

        // Compute dynamic timeline window
        const allScheduledTimes = Object.values(platformMap).flat().filter((t) => t.startMinutes > 0 && t.endMinutes > 0);
        let startWindow = 0;
        let spanWindow = 120;

        if (allScheduledTimes.length > 0) {
          const minTime = Math.min(...allScheduledTimes.map((t) => t.startMinutes));
          const maxTime = Math.max(...allScheduledTimes.map((t) => t.endMinutes));
          startWindow = Math.floor(minTime / 30) * 30;
          spanWindow = Math.max(120, Math.min(240, Math.ceil((maxTime - startWindow) / 30) * 30));
        } else {
          const now = new Date();
          const istMins = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
          startWindow = Math.floor(istMins / 30) * 30;
          spanWindow = 120;
        }

        const step = spanWindow <= 150 ? 15 : 30;
        const ticks: string[] = [];
        for (let m = startWindow; m <= startWindow + spanWindow; m += step) {
          ticks.push(formatMinutes(m));
        }

        setTimelineTicks(ticks);
        setTimelineStartMins(startWindow);
        setTimelineSpanMins(spanWindow);
        setPlatformGroups(groups);
        setUnassignedTrains(unassigned);
        setConflicts(detectedConflicts);
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || 'Platform data unavailable due to network error.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadStationPlatforms();

    return () => {
      isCancelled = true;
    };
  }, [stationCode]);

  // Current time in IST for timeline reference
  const now = new Date();
  const currentIstMins = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % 1440;
  const isCurrentTimeInWindow = (() => {
    let diff = currentIstMins - timelineStartMins;
    if (diff < -720) diff += 1440;
    else if (diff > 720) diff -= 1440;
    return diff >= 0 && diff <= timelineSpanMins;
  })();

  // View: No train selected
  if (!selectedTrainNumber || !trainData) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Operations
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Platform Occupancy Forecast
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Forecast-based platform occupancy and turnaround assessment. Not a booking or rebooking system.
          </p>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-3">
          <div className="w-12 h-12 bg-[#112035] border border-[#1A2840] rounded-xl flex items-center justify-center mx-auto text-2xl">
            🚉
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            No Train Selected
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            Please search or select an express train in the top bar to analyze live station platform forecasts and occupancy intervals.
          </p>
        </div>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          RailPredict does not automatically reallocate platforms or make operational decisions. All assessments are decision support.
        </div>
      </div>
    );
  }

  // View: Loading station platform data
  if (isLoading || isTrainLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Operations
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Platform Occupancy Forecast
          </h1>
          <div className="text-sm text-[#4A6080] mt-1">
            Station: <span className="text-[#B8D0E8]">{stationName || stationCode}</span>
          </div>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-data text-[#7A95B0]">
            Querying live RailRadar station board & platform assignments for {stationName || stationCode}...
          </div>
        </div>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          RailPredict does not automatically reallocate platforms or make operational decisions. All assessments are decision support.
        </div>
      </div>
    );
  }

  // View: Platform data unavailable
  if (platformGroups.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Operations
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Platform Occupancy Forecast
          </h1>
          <div className="text-sm text-[#4A6080] mt-1 flex items-center gap-2 flex-wrap">
            <span>Station:</span>
            <span className="text-[#B8D0E8] font-semibold">{stationName || stationCode}</span>
            {availableHalts.length > 1 && (
              <select
                value={stationCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setStationCode(newCode);
                  const match = availableHalts.find((h) => h.stationCode === newCode);
                  if (match?.stationName) setStationName(match.stationName);
                }}
                className="bg-[#112035] border border-[#1A2840] rounded px-2 py-0.5 text-xs text-[#B8D0E8] outline-none focus:border-[#3B82F6]"
              >
                {availableHalts.map((h) => (
                  <option key={h.stationCode} value={h.stationCode}>
                    {h.stationName || h.stationCode} ({h.stationCode})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <Card className="p-8 text-center space-y-3">
          <div className="w-10 h-10 bg-[#112035] border border-[#1A2840] rounded-lg flex items-center justify-center mx-auto text-xl text-[#7A95B0]">
            ⚠️
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Platform data unavailable
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            {error || `Station board for ${stationName || stationCode} does not provide active platform allocations. Station operations may announce platforms closer to arrival.`}
          </p>

          {unassignedTrains.length > 0 && (
            <div className="pt-4 border-t border-[#1A2840] mt-4">
              <div className="text-xs font-data text-[#4A6080] mb-3 uppercase tracking-wider">
                Scheduled Trains at {stationCode} ({unassignedTrains.length}) — Platform not available
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-w-3xl mx-auto text-left">
                {unassignedTrains.slice(0, 6).map((t) => (
                  <div key={t.id} className="text-[11px] bg-[#112035] rounded p-2.5 border border-[#1A2840]">
                    <div className="flex items-center justify-between">
                      <span className="font-data text-[#3B82F6] font-semibold">{t.id}</span>
                      <span className="text-[9px] text-[#F59E0B] font-data bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
                        Platform not available
                      </span>
                    </div>
                    <div className="text-[#B8D0E8] truncate mt-0.5">{t.name}</div>
                    <div className="text-[#4A6080] font-data mt-1">
                      {t.scheduledArrival ? `Arr: ${t.scheduledArrival}` : ''}{' '}
                      {t.scheduledDeparture ? `Dep: ${t.scheduledDeparture}` : ''}
                      {t.delay > 0 ? ` (+${t.delay}m delay)` : ' (On Time)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          RailPredict does not automatically reallocate platforms or make operational decisions. All assessments are decision support.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold">
            LIVE • RailRadar
          </span>
          <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/30 font-semibold">
            RailPredict Derived
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Platform Utilization & Conflict Forecast
        </h1>
        <div className="text-sm text-[#4A6080] mt-1 flex items-center gap-2 flex-wrap">
          <span>Station:</span>
          <span className="text-[#B8D0E8] font-semibold">{stationName} ({stationCode})</span>
          {availableHalts.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-[#4A6080]">Switch halt:</span>
              <select
                value={stationCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setStationCode(newCode);
                  const match = availableHalts.find((h) => h.stationCode === newCode);
                  if (match?.stationName) setStationName(match.stationName);
                }}
                className="bg-[#112035] border border-[#1A2840] rounded px-2 py-0.5 text-xs text-[#B8D0E8] outline-none focus:border-[#3B82F6]"
              >
                {availableHalts.map((h) => (
                  <option key={h.stationCode} value={h.stationCode}>
                    {h.stationName || h.stationCode} ({h.stationCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="inline-block mt-2 text-[10px] font-data text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded px-2.5 py-1">
          Platform assignments provided by RailRadar when available · Platform utilization forecast, conflict risk & pressure derived by RailPredict from live train movements · Physical passenger occupancy is not measured
        </div>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platformGroups.map((p) => (
          <Card key={p.num} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="font-display font-semibold text-white">
                  Platform {p.num}
                </div>
                {/* 9. If RailRadar provides a platform number, display it as LIVE */}
                <span className="text-[9px] font-data px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold uppercase">
                  LIVE
                </span>
              </div>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            </div>
            <div
              className="text-xs font-data font-semibold mb-2"
              style={{ color: p.color }}
            >
              {p.statusLabel}
            </div>
            {p.trains.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {p.trains.map((t) => (
                  <div
                    key={t.id}
                    className={`text-[10px] rounded p-1.5 border ${
                      t.id === selectedTrainNumber
                        ? 'bg-[#1E3354] border-[#3B82F6]'
                        : 'bg-[#112035] border-[#1A2840]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data text-[#3B82F6] font-semibold flex items-center gap-1">
                        {t.id}
                        {t.id === selectedTrainNumber && (
                          <span className="text-[8px] bg-[#3B82F6] text-white px-1 rounded">Selected</span>
                        )}
                      </span>
                      {t.delay > 0 ? (
                        <span className="text-[#F59E0B] font-data">+{t.delay}m</span>
                      ) : (
                        <span className="text-[#10B981] font-data">On Time</span>
                      )}
                    </div>
                    <div className="text-[#7A95B0] truncate">{t.name}</div>
                    <div className="text-[#4A6080] font-data flex items-center justify-between mt-0.5">
                      <span>{t.from}–{t.to}</span>
                      <span className="text-[8px] text-[#4A6080]">DERIVED</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[#10B981]">No trains scheduled (Available)</div>
            )}
          </Card>
        ))}
      </div>

      {/* Unassigned Platform Notice (if any) */}
      {unassignedTrains.length > 0 && (
        <Card className="p-4 bg-[#0A1220] border-[#1A2840]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-[#7A95B0] flex items-center gap-2">
              <span>Trains With Platform Pending / Unannounced</span>
              <span className="text-[10px] font-data text-[#4A6080] bg-[#112035] px-1.5 py-0.5 rounded">
                {unassignedTrains.length}
              </span>
            </div>
            {/* 10. Display "Platform not available" rather than assigning a fake platform */}
            <span className="text-[10px] font-data text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2 py-0.5 rounded">
              Platform not available
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {unassignedTrains.slice(0, 6).map((t) => (
              <div key={t.id} className="text-[10px] bg-[#112035] rounded p-2 border border-[#1A2840]">
                <div className="flex items-center justify-between">
                  <span className="font-data text-[#3B82F6] font-semibold">{t.id}</span>
                  <span className="text-[9px] text-[#F59E0B] font-data">Platform not available</span>
                </div>
                <div className="text-[#B8D0E8] truncate">{t.name}</div>
                <div className="text-[#4A6080] font-data mt-0.5">
                  {t.scheduledArrival ? `Arr: ${t.scheduledArrival}` : ''}{' '}
                  {t.scheduledDeparture ? `Dep: ${t.scheduledDeparture}` : ''}
                  {t.delay > 0 ? ` (+${t.delay}m delay)` : ' (On Time)'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Platform Occupancy Timeline */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest flex items-center gap-2">
            <span>
              Platform Occupancy Timeline — {timelineTicks[0] || '00:00'} to {timelineTicks[timelineTicks.length - 1] || '00:00'}
            </span>
            <span className="text-[9px] font-data text-[#88A4C4] bg-[#1E3354] px-1 py-0.5 rounded">
              DERIVED FROM LIVE NTES DATA
            </span>
          </div>
        </div>

        <div className="flex mb-2 ml-20">
          {timelineTicks.map((t, idx) => (
            <div key={`${t}-${idx}`} className="flex-1 text-[9px] font-data text-[#3B5E8C]">
              {t}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {platformGroups.map((p) => (
            <div key={p.num} className="flex items-center gap-3">
              <div className="w-20 text-xs text-[#7A95B0] flex-shrink-0 font-data">
                Platform {p.num}
              </div>
              <div className="flex-1 relative bg-[#080F1E] rounded h-9 overflow-hidden">
                {p.trains.map((t) => {
                  const left = timeToPct(t.startMinutes, timelineStartMins, timelineSpanMins);
                  const right = timeToPct(t.endMinutes, timelineStartMins, timelineSpanMins);
                  const width = Math.max(2, right - left);
                  const barColor = t.isConflict ? '#EF4444' : p.color;

                  return (
                    <div
                      key={t.id}
                      className="absolute top-1 bottom-1 rounded flex items-center px-2 cursor-pointer transition-all hover:brightness-125"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: barColor + '30',
                        borderLeft: `2px solid ${barColor}`,
                      }}
                      title={`Train ${t.id} (${t.name}): ${t.from}–${t.to}${t.isConflict ? ' [Potential conflict — Derived]' : ''}`}
                    >
                      <span
                        className="font-data text-[9px] font-semibold truncate"
                        style={{ color: barColor }}
                      >
                        {t.id}
                      </span>
                    </div>
                  );
                })}

                {p.available && (
                  <div className="absolute inset-1 flex items-center px-2">
                    <span className="text-[9px] font-data text-[#10B981] opacity-50">
                      Available
                    </span>
                  </div>
                )}

                {/* Current time indicator */}
                {isCurrentTimeInWindow && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-[#3B82F6] z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    style={{ left: `${timeToPct(currentIstMins, timelineStartMins, timelineSpanMins)}%` }}
                    title={`Current IST: ${formatMinutes(currentIstMins)}`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-4 text-[10px] font-data text-[#4A6080] flex-wrap">
          {[
            { color: '#F59E0B', label: 'Occupied' },
            { color: '#EF4444', label: 'Potential conflict — Derived' },
            { color: '#10B981', label: 'Available' },
            { color: '#3B82F6', label: 'Expected' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-sm inline-block"
                style={{
                  backgroundColor: item.color + '60',
                  border: `1px solid ${item.color}`,
                }}
              />
              {item.label}
            </div>
          ))}
          {isCurrentTimeInWindow && (
            <div className="flex items-center gap-1.5 ml-4">
              <span className="w-px h-3 bg-[#3B82F6] inline-block shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              Current time (IST: {formatMinutes(currentIstMins)})
            </div>
          )}
        </div>
      </Card>

      {/* 12 & 13. Conflict Alert or Conflict-Free Card */}
      {conflicts.length > 0 ? (
        <Card className="p-5 border-[#EF4444]/30">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#EF4444] mt-1.5 flex-shrink-0 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="text-sm font-semibold text-[#EF4444] flex items-center justify-between">
                <span>Platform Conflict Detected — Potential conflict — Derived</span>
                <span className="text-[10px] font-data text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 px-2 py-0.5 rounded">
                  {conflicts.length} Overlap{conflicts.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[#7A95B0]">
                {conflicts.map((c, i) => (
                  <div key={i} className="bg-[#112035] p-2.5 rounded border border-[#1A2840]">
                    <span className="font-semibold text-white">Platform {c.platform}:</span> Train{' '}
                    <span className="text-[#3B82F6] font-data font-semibold">{c.trainA.id}</span> ({c.trainA.name}) occupancy{' '}
                    <span className="text-white font-data">{c.trainA.from}–{c.trainA.to}</span> overlaps with Train{' '}
                    <span className="text-[#10B981] font-data font-semibold">{c.trainB.id}</span> ({c.trainB.name}){' '}
                    <span className="text-white font-data">{c.trainB.from}–{c.trainB.to}</span>. Overlap window:{' '}
                    <span className="font-data text-[#EF4444] font-semibold">{c.overlapMinutes} minutes</span>. (Potential conflict — Derived)
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-data text-[#3B5E8C] pt-1">
                This forecast is decision support. Platform allocation is the responsibility of station operations staff.
                Physical platform occupancy is not directly telemetry-measured; occupancy and conflicts are derived from live arrival/departure timings.
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-5 border-[#10B981]/30">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#10B981] mt-1.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-[#10B981] mb-1">
                No Platform Conflicts Detected
              </div>
              <div className="text-xs text-[#7A95B0]">
                All scheduled trains at {stationName} ({stationCode}) maintain segregated occupancy intervals according to current RailRadar live timings. (Derived from live NTES feeds)
              </div>
              <div className="mt-2 text-[10px] font-data text-[#3B5E8C]">
                This forecast is decision support. Platform allocation is the responsibility of station operations staff.
                Physical platform occupancy is not directly telemetry-measured; intervals are derived from live arrival/departure data.
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
        RailPredict does not automatically reallocate platforms or make operational decisions. All assessments are decision support.
      </div>
    </div>
  );
}
