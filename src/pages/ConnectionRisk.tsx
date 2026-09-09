import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTrainData } from '../context/TrainContext';
import { railradarService } from '../services/railradarService';

interface ConnectionScenario {
  stationName: string;
  stationCode: string;
  trainA: {
    num: string;
    name: string;
    scheduled: string; // LIVE
    arrival: string; // predicted arrival (DERIVED)
    delay: number; // minutes (LIVE)
    p10: string; // DERIVED
    p90: string; // DERIVED
    platform: string | null; // LIVE
  };
  trainB: {
    num: string;
    name: string;
    scheduled: string; // LIVE
    departure: string; // expected departure (LIVE)
    delay: number; // minutes (LIVE)
    platform: string | null; // LIVE
  };
  buffer: number | null; // minutes (DERIVED)
  platform: {
    from: string | null; // LIVE
    to: string | null; // LIVE
  };
  risk: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE';
}

const RISK_COLORS: Record<string, string> = {
  HIGH: '#EF4444',
  MEDIUM: '#F59E0B',
  LOW: '#10B981',
  UNAVAILABLE: '#7A95B0',
};

function cleanPlatform(raw?: string | null): string | null {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'none') return null;
  const match = str.match(/^(?:PF\s*|Platform\s*)?([A-Za-z0-9]+)$/i);
  return match ? match[1] : str;
}

function formatToHHMM(timeVal?: string | null): string {
  if (!timeVal) return '--:--';
  const str = String(timeVal).trim();
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    if (timePart) {
      const parts = timePart.split(':');
      if (parts.length >= 2) {
        return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
      }
    }
  }
  if (str.includes(':')) {
    const parts = str.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return '--:--';
}

function addMinutes(timeStr: string, minutesToAdd: number): string {
  if (!timeStr || timeStr === '--:--') return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  let totalMins = (h * 60 + m + minutesToAdd) % 1440;
  if (totalMins < 0) totalMins += 1440;
  const newH = Math.floor(totalMins / 60);
  const newM = totalMins % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function calculateTimeDiffMinutes(arrHHMM: string, depHHMM: string): number | null {
  if (!arrHHMM || !depHHMM || arrHHMM === '--:--' || depHHMM === '--:--') return null;
  const [ah, am] = arrHHMM.split(':').map(Number);
  const [dh, dm] = depHHMM.split(':').map(Number);
  if (isNaN(ah) || isNaN(am) || isNaN(dh) || isNaN(dm)) return null;
  const arrM = ah * 60 + am;
  const depM = dh * 60 + dm;
  let diff = depM - arrM;
  if (diff < -720) diff += 1440;
  else if (diff > 720) diff -= 1440;
  return diff;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string; key?: string | number }) {
  return (
    <div className={`bg-[#0C1526] border border-[#1A2840] rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function ConnectionRisk() {
  const { selectedTrainNumber, journeyDate, trainData, isLoading: isTrainLoading, calculated } = useTrainData();

  const [scenarios, setScenarios] = useState<ConnectionScenario[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // 14. When the selected train changes, clear the previous connection state and load the new train's connection data.
    // Do not allow stale data from the previous train to remain visible.
    setScenarios([]);
    setConnectionError(null);

    if (!selectedTrainNumber || !trainData) {
      setIsLoadingConnections(false);
      return;
    }

    let isCancelled = false;

    async function fetchConnections() {
      setIsLoadingConnections(true);
      setConnectionError(null);

      try {
        // 1 & 2. Verify selected train number and journey date
        const incomingNum = trainData!.trainNumber || selectedTrainNumber;
        const incomingName = trainData!.trainName || `Train ${incomingNum}`;
        const incomingDelay = Math.max(0, trainData!.delayMinutes ?? 0);

        // 3. Identify potential connection stations from REAL incoming route
        const currentSeq = trainData!.currentLocation?.sequence ?? 0;
        const route = trainData!.route || [];

        // Candidate connection stations: upcoming stops where the incoming train halts
        let candidateHalts = route.filter(
          (s) => s.isHalt && (s.sequence ?? 0) >= currentSeq && (s.status === 'upcoming' || s.status === 'arrived' || s.sequence === currentSeq)
        );

        if (candidateHalts.length === 0 && trainData!.nextHalt?.stationCode) {
          candidateHalts = [
            {
              sequence: trainData!.nextHalt.sequence || 1,
              stationCode: trainData!.nextHalt.stationCode,
              stationName: trainData!.nextHalt.stationName || trainData!.nextHalt.stationCode,
              isHalt: true,
              scheduledArrival: null,
              scheduledDeparture: null,
              actualArrival: null,
              actualDeparture: null,
              delayArrival: 0,
              delayDeparture: 0,
              status: 'upcoming',
            },
          ];
        }

        if (candidateHalts.length === 0 && trainData!.currentLocation?.stationCode) {
          candidateHalts = [
            {
              sequence: trainData!.currentLocation.sequence || 0,
              stationCode: trainData!.currentLocation.stationCode,
              stationName: trainData!.currentLocation.stationName || trainData!.currentLocation.stationCode,
              isHalt: true,
              scheduledArrival: null,
              scheduledDeparture: null,
              actualArrival: null,
              actualDeparture: null,
              delayArrival: 0,
              delayDeparture: 0,
              status: 'at-station',
            },
          ];
        }

        if (candidateHalts.length === 0) {
          if (!isCancelled) {
            setConnectionError('No upcoming halts found for selected train to assess connection interchange.');
          }
          return;
        }

        // Query up to 2 candidate stations along the route to find real connecting departures
        const discoveredScenarios: ConnectionScenario[] = [];

        for (const candidateStation of candidateHalts.slice(0, 2)) {
          if (isCancelled) return;

          const stationCode = candidateStation.stationCode;
          const stationName = candidateStation.stationName || stationCode;

          // Calculate incoming train's predicted arrival at this station
          const incomingStop = route.find((s) => s.stationCode === stationCode) || candidateStation;
          const incomingSchedRaw = incomingStop.scheduledArrival || incomingStop.scheduledDeparture;
          const incomingSched = formatToHHMM(incomingSchedRaw);

          let incomingPredicted = '--:--';
          if (incomingStop.actualArrival) {
            incomingPredicted = formatToHHMM(incomingStop.actualArrival);
          } else {
            const timelineItem = calculated?.timeline?.find((t) => t.stationCode === stationCode);
            if (timelineItem && timelineItem.predicted && timelineItem.predicted !== '--:--') {
              incomingPredicted = timelineItem.predicted;
            } else if (incomingSched !== '--:--') {
              incomingPredicted = addMinutes(incomingSched, incomingDelay);
            }
          }

          // Compute incoming uncertainty window (DERIVED)
          const p10 = incomingPredicted !== '--:--'
            ? addMinutes(incomingPredicted, -Math.max(2, Math.round(incomingDelay * 0.15)))
            : '--:--';
          const p90 = incomingPredicted !== '--:--'
            ? addMinutes(incomingPredicted, Math.max(4, Math.round(incomingDelay * 0.35)))
            : '--:--';

          const incomingPlatform = cleanPlatform(incomingStop.platform || trainData!.platform);

          // 6. Query REAL station board for connecting trains via centralized service
          try {
            const stationJson = await railradarService.fetchStationLive(stationCode, {
              hours: 4,
              includeIntermediate: true,
              authoritative: false,
            });
            if (!stationJson.success || !stationJson.data) continue;
            const stationTrains: any[] = stationJson.data.trains || [];

            // Filter real departing trains:
            // - Cannot be the incoming train itself
            // - Must have a scheduled or expected departure from this SAME station
            const departingCandidates = stationTrains.filter((t: any) => {
              const num = t.train?.number;
              const dep = t.stop?.departure || t.live?.expectedDepartureTime;
              return num && num !== incomingNum && Boolean(dep);
            });

            // Find valid connecting train pairs
            for (const depItem of departingCandidates) {
              if (isCancelled) return;
              if (discoveredScenarios.length >= 3) break;

              const connectingNum = depItem.train.number;
              let connectingName = depItem.train.name || `Train ${connectingNum}`;
              const connectingSchedRaw = depItem.stop?.departure;
              const connectingSched = formatToHHMM(connectingSchedRaw);

              let connectingDelay = depItem.live?.delayMinutes ?? 0;
              let connectingPlatform = cleanPlatform(depItem.stop?.platform);

              // 7. Query connecting train's live data via centralized service
              try {
                const trainLiveJson = await railradarService.fetchLiveTrain(connectingNum, journeyDate, {
                  authoritative: false,
                });
                if (trainLiveJson.success && trainLiveJson.data) {
                  const cData = trainLiveJson.data;
                  if (cData.trainName) connectingName = cData.trainName;
                  if (typeof cData.delayMinutes === 'number') connectingDelay = cData.delayMinutes;
                  const cPlat = cleanPlatform(cData.platform);
                  if (cPlat) connectingPlatform = cPlat;
                }
              } catch {
                // If secondary train fetch fails or rate limits, use the station board's live info
              }

              // Compute expected departure
              let connectingExpected = connectingSched;
              if (depItem.live?.expectedDepartureTime) {
                connectingExpected = formatToHHMM(depItem.live.expectedDepartureTime);
              } else if (connectingSched !== '--:--') {
                connectingExpected = addMinutes(connectingSched, Math.max(0, connectingDelay));
              }

              // 9. Calculate transfer buffer
              const buffer = calculateTimeDiffMinutes(incomingPredicted, connectingExpected);

              // Valid connection window: from -45 min (missed) up to 360 min (6 hours)
              if (buffer !== null && buffer >= -45 && buffer <= 360) {
                // Determine risk
                let risk: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNAVAILABLE' = 'LOW';
                if (buffer < 15) {
                  risk = 'HIGH';
                } else if (buffer < 30) {
                  risk = 'MEDIUM';
                } else {
                  risk = 'LOW';
                }

                discoveredScenarios.push({
                  stationName,
                  stationCode,
                  trainA: {
                    num: incomingNum,
                    name: incomingName,
                    scheduled: incomingSched,
                    arrival: incomingPredicted,
                    delay: incomingDelay,
                    p10,
                    p90,
                    platform: incomingPlatform,
                  },
                  trainB: {
                    num: connectingNum,
                    name: connectingName,
                    scheduled: connectingSched,
                    departure: connectingExpected,
                    delay: connectingDelay,
                    platform: connectingPlatform,
                  },
                  buffer,
                  platform: {
                    from: incomingPlatform,
                    to: connectingPlatform,
                  },
                  risk,
                });
              }
            }
          } catch (stErr) {
            console.warn(`Could not load station board for ${stationCode}:`, stErr);
          }

          if (discoveredScenarios.length >= 3) break;
        }

        if (!isCancelled) {
          setScenarios(discoveredScenarios);
          if (discoveredScenarios.length === 0) {
            setConnectionError(
              `Connection data unavailable. No compatible connecting departures found at upcoming halts for Train ${incomingNum} on ${journeyDate}.`
            );
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setConnectionError(err.message || 'Connection data unavailable due to network error.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingConnections(false);
        }
      }
    }

    fetchConnections();

    return () => {
      isCancelled = true;
    };
  }, [selectedTrainNumber, journeyDate, trainData, calculated]);

  // View: No train selected
  if (!selectedTrainNumber || !trainData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Passenger Intelligence
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Connection Risk
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Forecast-based connection reliability assessment. Not a booking or rebooking system.
          </p>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-3">
          <div className="w-12 h-12 bg-[#112035] border border-[#1A2840] rounded-xl flex items-center justify-center mx-auto text-2xl">
            🔄
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            No Train Selected
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            Please search or select an express train in the top bar to analyze live interchange connection risks and transfer buffers.
          </p>
        </div>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          RailPredict does not automatically rebook tickets or make operational decisions. All assessments are decision support.
        </div>
      </div>
    );
  }

  // View: Loading connections
  if (isLoadingConnections || isTrainLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Passenger Intelligence
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Connection Risk
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Forecast-based connection reliability assessment. Not a booking or rebooking system.
          </p>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-data text-[#7A95B0]">
            Querying live station boards and connecting departures for Train {selectedTrainNumber}...
          </div>
        </div>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          RailPredict does not automatically rebook tickets or make operational decisions. All assessments are decision support.
        </div>
      </div>
    );
  }

  // View: No connections or error
  if (scenarios.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Passenger Intelligence
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Connection Risk
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Forecast-based connection reliability assessment. Not a booking or rebooking system.
          </p>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-3">
          <div className="w-10 h-10 bg-[#112035] border border-[#1A2840] rounded-lg flex items-center justify-center mx-auto text-xl text-[#7A95B0]">
            ⚠️
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Connection data unavailable
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            {connectionError || `No connecting departures currently found at upcoming interchange halts for Train ${selectedTrainNumber} on ${journeyDate}.`}
          </p>
        </div>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          RailPredict does not automatically rebook tickets or make operational decisions. All assessments are decision support.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
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
          Connection Risk Assessment
        </h1>
        <p className="text-sm text-[#4A6080] mt-1">
          Real connecting trains from RailRadar live station board · Interchange buffer & connection risk derived by RailPredict. Not a booking or rebooking system.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((item, idx) => {
          const platFromNum = item.platform.from ? parseInt(item.platform.from, 10) : NaN;
          const platToNum = item.platform.to ? parseInt(item.platform.to, 10) : NaN;
          const hasBothNumericPlatforms = !isNaN(platFromNum) && !isNaN(platToNum);
          const platDiff = hasBothNumericPlatforms ? Math.abs(platToNum - platFromNum) : null;

          const uncertaintyMetric = (() => {
            if (item.trainA.arrival === '--:--' || !item.trainA.p90 || item.trainA.p90 === '--:--') {
              return {
                label: 'Arrival Uncertainty',
                detail: 'Telemetry pending',
                risk: 'Unavailable',
                color: '#7A95B0',
              };
            }
            const delay = item.trainA.delay;
            return {
              label: 'Arrival Uncertainty',
              detail: `${item.trainA.p90} worst case`,
              risk: delay > 30 ? 'High' : delay > 10 ? 'Moderate' : 'Low',
              color: delay > 30 ? '#EF4444' : delay > 10 ? '#F59E0B' : '#10B981',
            };
          })();

          const platformMetric = (() => {
            if (hasBothNumericPlatforms && platDiff !== null) {
              return {
                label: 'Platform Transfer',
                detail: `${platDiff} platform(s) apart`,
                risk: platDiff > 2 ? 'Moderate' : 'Low',
                color: platDiff > 2 ? '#F59E0B' : '#10B981',
              };
            }
            if (item.platform.from && item.platform.to) {
              return {
                label: 'Platform Transfer',
                detail: `Plat. ${item.platform.from} to ${item.platform.to}`,
                risk: 'Low',
                color: '#10B981',
              };
            }
            return {
              label: 'Platform Transfer',
              detail: 'Platform unassigned',
              risk: 'Unavailable',
              color: '#7A95B0',
            };
          })();

          const bufferMetric = (() => {
            if (item.buffer === null) {
              return {
                label: 'Buffer Adequacy',
                detail: 'Schedule unavailable',
                risk: 'Unavailable',
                color: '#7A95B0',
              };
            }
            if (item.buffer < 0) {
              return {
                label: 'Buffer Adequacy',
                detail: `${Math.abs(item.buffer)} min late (Missed)`,
                risk: 'Missed',
                color: '#EF4444',
              };
            }
            return {
              label: 'Buffer Adequacy',
              detail: `${item.buffer} min available`,
              risk: item.buffer < 15 ? 'Tight' : item.buffer < 30 ? 'Moderate' : 'Comfortable',
              color: item.buffer < 15 ? '#EF4444' : item.buffer < 30 ? '#F59E0B' : '#10B981',
            };
          })();

          return (
            <Card key={`${item.stationCode}-${item.trainB.num}-${idx}`} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-display font-semibold text-white flex items-center gap-2">
                  <span>Connection Scenario {idx + 1}</span>
                  <span className="text-xs font-normal text-[#7A95B0]">
                    · {item.stationName} ({item.stationCode})
                  </span>
                </div>
                <span
                  className="text-xs font-data font-bold px-3 py-1 rounded border flex items-center gap-1.5"
                  style={{
                    color: RISK_COLORS[item.risk],
                    borderColor: RISK_COLORS[item.risk] + '40',
                    backgroundColor: RISK_COLORS[item.risk] + '10',
                  }}
                >
                  <span>{item.risk} RISK</span>
                  <span className="text-[10px] opacity-75 font-normal">(DERIVED)</span>
                </span>
              </div>

              <div className="flex items-stretch gap-0 mb-5 flex-col md:flex-row">
                {/* Incoming Train Box */}
                <div className="flex-1 bg-[#112035] rounded-t-lg md:rounded-tr-none md:rounded-l-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-data text-[#4A6080] uppercase">
                      Arriving Train
                    </div>
                    <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 uppercase font-semibold">
                      Live NTES
                    </span>
                  </div>
                  <div className="font-data text-[#3B82F6] font-semibold">
                    {item.trainA.num}
                  </div>
                  <div className="text-sm text-[#B8D0E8] mb-3 truncate">{item.trainA.name}</div>
                  <div className="font-display text-2xl text-white font-bold">
                    {item.trainA.arrival}
                  </div>
                  <div className="text-xs text-[#4A6080] mt-1 flex items-center gap-1.5">
                    <span>Predicted arrival</span>
                    <span className="text-[9px] font-data text-[#88A4C4] bg-[#1E3354] px-1 py-0.5 rounded">DERIVED</span>
                  </div>
                  <div className="mt-2 text-[10px] font-data text-[#7A95B0] space-y-0.5">
                    <div>
                      Sched: <span className="text-white">{item.trainA.scheduled}</span>
                      {' · '}Delay: <span className={item.trainA.delay > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}>{item.trainA.delay > 0 ? `+${item.trainA.delay}m` : 'On Time'}</span>
                      <span className="text-[9px] text-[#4A6080] ml-1">(LIVE)</span>
                    </div>
                    <div>
                      P10: {item.trainA.p10} · P90: {item.trainA.p90}
                      <span className="text-[9px] text-[#4A6080] ml-1">(DERIVED)</span>
                    </div>
                  </div>
                </div>

                {/* Transfer Buffer Middle Separator */}
                <div className="flex flex-col items-center justify-center bg-[#0A1220] px-4 py-4 border-y md:border-y-0 md:border-x border-[#1A2840]">
                  <div className="text-[10px] font-data text-[#4A6080] mb-1 whitespace-nowrap flex items-center gap-1">
                    <span>Transfer Buffer</span>
                    <span className="text-[9px] font-data text-[#88A4C4] bg-[#1E3354] px-1 py-0.5 rounded">DERIVED</span>
                  </div>
                  <div
                    className="font-data text-xl font-bold"
                    style={{ color: RISK_COLORS[item.risk] }}
                  >
                    {item.buffer !== null ? `${item.buffer} min` : 'Unavailable'}
                  </div>
                  <div className="text-[10px] font-data text-[#7A95B0] mt-1 whitespace-nowrap">
                    {item.platform.from || item.platform.to ? (
                      <>
                        Plat. {item.platform.from || 'TBD'} → {item.platform.to || 'TBD'}
                        <span className="text-[9px] text-[#4A6080] ml-1">(LIVE)</span>
                      </>
                    ) : (
                      <span>Plat. Unassigned</span>
                    )}
                  </div>
                  <div className="mt-2 text-[#2A4470] text-lg">→</div>
                </div>

                {/* Departing Train Box */}
                <div className="flex-1 bg-[#112035] rounded-b-lg md:rounded-bl-none md:rounded-r-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-data text-[#4A6080] uppercase">
                      Departing Train
                    </div>
                    <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 uppercase font-semibold">
                      Live Station Board
                    </span>
                  </div>
                  <div className="font-data text-[#10B981] font-semibold">
                    {item.trainB.num}
                  </div>
                  <div className="text-sm text-[#B8D0E8] mb-3 truncate">{item.trainB.name}</div>
                  <div className="font-display text-2xl text-white font-bold">
                    {item.trainB.departure}
                  </div>
                  <div className="text-xs text-[#4A6080] mt-1 flex items-center gap-1.5">
                    <span>Expected departure</span>
                    <span className="text-[9px] font-data text-[#88A4C4] bg-[#1E3354] px-1 py-0.5 rounded">LIVE</span>
                  </div>
                  <div className="mt-2 text-[10px] font-data text-[#7A95B0]">
                    Sched: <span className="text-white">{item.trainB.scheduled}</span>
                    {' · '}Delay: <span className={item.trainB.delay > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}>{item.trainB.delay > 0 ? `+${item.trainB.delay}m` : 'On Time'}</span>
                    <span className="text-[9px] text-[#4A6080] ml-1">(LIVE)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[uncertaintyMetric, platformMetric, bufferMetric].map((m) => (
                  <div key={m.label} className="bg-[#080F1E] rounded p-3">
                    <div className="text-[10px] font-data text-[#4A6080] mb-1 flex items-center justify-between">
                      <span>{m.label}</span>
                      <span className="text-[9px] opacity-75">{m.label.includes('Platform') ? 'LIVE' : 'DERIVED'}</span>
                    </div>
                    <div className="text-xs font-semibold mb-1" style={{ color: m.color }}>
                      {m.risk}
                    </div>
                    <div className="text-[10px] text-[#7A95B0]">{m.detail}</div>
                  </div>
                ))}
              </div>

              {item.risk !== 'LOW' && (
                <div
                  className="mt-3 p-3 rounded border text-xs"
                  style={{
                    borderColor: RISK_COLORS[item.risk] + '30',
                    backgroundColor: RISK_COLORS[item.risk] + '08',
                    color: RISK_COLORS[item.risk],
                  }}
                >
                  {item.buffer !== null && item.buffer < 0
                    ? `Incoming train is predicted to arrive ${Math.abs(item.buffer)} min after connecting departure. Transfer is unviable (missed connection expected). RailPredict does not automatically rebook.`
                    : item.risk === 'HIGH'
                    ? 'Connection may be at risk due to tight transfer buffer or incoming delay. Passenger should plan for alternative options. RailPredict does not automatically rebook.'
                    : 'Connection is possible but buffer is limited. Monitor predicted arrival for updates.'}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
        RailPredict does not automatically rebook tickets or make operational decisions. All assessments are decision support.
      </div>
    </div>
  );
}
