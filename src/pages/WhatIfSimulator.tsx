import { useState, useEffect, useMemo, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useTrainData } from '../context/TrainContext';
import { railradarService } from '../services/railradarService';
import {
  type ScenarioType,
  type CongestionSeverity,
  type SimulationOutput,
  SCENARIO_DEFINITIONS,
  getRemainingRouteHalts,
  runWhatIfSimulation,
} from '../utils/scenarioSimulationEngine';

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0C1526] border border-[#1A2840] rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function WhatIfSimulator() {
  const { selectedTrainNumber, trainData, isLoading, apiError } = useTrainData();

  // Extract remaining route halts strictly from REAL RailRadar live data
  const remainingHalts = useMemo(() => {
    if (!trainData) return [];
    return getRemainingRouteHalts(trainData);
  }, [trainData]);

  // Real baseline delay from selected train
  const realLiveDelay = useMemo(() => {
    return Math.max(0, trainData?.delayMinutes || 0);
  }, [trainData]);

  // Scenario configuration state
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('signal_block');
  const [selectedLocationCode, setSelectedLocationCode] = useState<string>('');
  const [additionalDelay, setAdditionalDelay] = useState<number>(15);
  const [congestionSeverity, setCongestionSeverity] = useState<CongestionSeverity>('MEDIUM');

  // Secondary live data: station board trains & connecting departures for cascade analysis
  const [liveStationBoardTrains, setLiveStationBoardTrains] = useState<any[]>([]);
  const [knownConnectingDepartures, setKnownConnectingDepartures] = useState<
    Array<{
      stationCode: string;
      stationName: string;
      trainNumber: string;
      trainName: string;
      scheduledDeparture: string;
    }>
  >([]);

  // Simulation execution state
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationOutput | null>(null);

  // Initialize selected location when remaining halts change
  useEffect(() => {
    if (remainingHalts.length > 0) {
      const defaultLoc = remainingHalts[0].stationCode;
      setSelectedLocationCode((prev) => {
        const exists = remainingHalts.some((h) => h.stationCode === prev);
        return exists ? prev : defaultLoc;
      });
    } else {
      setSelectedLocationCode('');
    }
  }, [remainingHalts]);

  // Reset simulation when train changes
  useEffect(() => {
    setHasRun(false);
    setSimulationResult(null);
    setSelectedScenario('signal_block');
    setAdditionalDelay(15);
    setCongestionSeverity('MEDIUM');
    setLiveStationBoardTrains([]);
    setKnownConnectingDepartures([]);
  }, [selectedTrainNumber]);

  // Single-fetch station board for the affected station to enrich cascade analysis
  // Runs once through RailwayDataService with 60-second in-memory client caching
  useEffect(() => {
    if (!selectedLocationCode) return;

    let isCancelled = false;

    async function loadStationBoardData() {
      try {
        const res = await railradarService.fetchStationLive(selectedLocationCode, {
          hours: 4,
          includeIntermediate: true,
          authoritative: false,
        });

        if (!isCancelled && res.success && res.data?.trains) {
          setLiveStationBoardTrains(res.data.trains);

          // Extract real departing connecting candidates (trains other than the selected train)
          const connecting = (res.data.trains || [])
            .filter((t: any) => {
              const num = t.train?.number;
              const dep = t.stop?.departure || t.live?.expectedDepartureTime;
              return num && num !== selectedTrainNumber && Boolean(dep);
            })
            .slice(0, 3)
            .map((t: any) => ({
              stationCode: selectedLocationCode,
              stationName: t.station?.name || selectedLocationCode,
              trainNumber: t.train.number,
              trainName: t.train.name || `Train ${t.train.number}`,
              scheduledDeparture: t.stop?.departure || t.live?.expectedDepartureTime || '--:--',
            }));

          setKnownConnectingDepartures(connecting);
        }
      } catch {
        // Fallback gracefully without breaking local simulation
        if (!isCancelled) {
          setLiveStationBoardTrains([]);
          setKnownConnectingDepartures([]);
        }
      }
    }

    loadStationBoardData();

    return () => {
      isCancelled = true;
    };
  }, [selectedLocationCode, selectedTrainNumber]);

  // Scenario type change handler: adjust default delays according to scenario guidelines
  const handleScenarioChange = (type: ScenarioType) => {
    setSelectedScenario(type);
    const def = SCENARIO_DEFINITIONS[type];
    setAdditionalDelay(def.defaultDelay);
    if (type === 'congestion') {
      setCongestionSeverity('MEDIUM');
    }
  };

  // Run Simulation handler (executes in pure local memory in 0ms from real baseline)
  const handleRunSimulation = () => {
    if (!trainData || remainingHalts.length === 0) return;

    const effectiveDelay =
      selectedScenario === 'congestion'
        ? congestionSeverity === 'LOW'
          ? 8
          : congestionSeverity === 'HIGH'
          ? 25
          : additionalDelay
        : additionalDelay;

    const result = runWhatIfSimulation(
      trainData,
      {
        scenarioType: selectedScenario,
        locationCode: selectedLocationCode || remainingHalts[0].stationCode,
        delayMinutes: effectiveDelay,
        congestionSeverity,
        precedingDelayMinutes: effectiveDelay,
        maintenanceDurationMinutes: effectiveDelay,
        gateDelayMinutes: effectiveDelay,
      },
      {
        knownConnectingDepartures,
        liveStationBoardTrains,
      }
    );

    setSimulationResult(result);
    setHasRun(true);
  };

  // Reset to Live handler: restores pure RailRadar live baseline without altering live data
  const handleResetToLive = () => {
    setHasRun(false);
    setSimulationResult(null);
    const def = SCENARIO_DEFINITIONS[selectedScenario];
    setAdditionalDelay(def.defaultDelay);
    setCongestionSeverity('MEDIUM');
  };

  // Chart data: up to 8 representative stations to prevent cramped bars
  const chartData = useMemo(() => {
    if (!simulationResult) return [];
    const timeline = simulationResult.stationTimeline;
    if (timeline.length <= 8) {
      return timeline.map((st) => ({
        name: st.stationCode || st.stationName.slice(0, 8),
        fullName: st.stationName,
        baseline: st.baselineDelay,
        scenario: st.simulatedDelay,
        impact: st.impactMinutes,
      }));
    }

    // Pick first 4 upcoming halts, affected halt, 1 midpoint, and destination halt
    const selected: typeof timeline = [];
    selected.push(...timeline.slice(0, 4));

    const affectedItem = timeline.find((st) => st.isPerturbationPoint);
    if (affectedItem && !selected.includes(affectedItem)) {
      selected.push(affectedItem);
    }

    const midIdx = Math.floor(timeline.length / 2);
    if (midIdx > 3 && midIdx < timeline.length - 1 && !selected.includes(timeline[midIdx])) {
      selected.push(timeline[midIdx]);
    }

    const last = timeline[timeline.length - 1];
    if (!selected.includes(last)) {
      selected.push(last);
    }

    return selected.map((st) => ({
      name: st.stationCode || st.stationName.slice(0, 8),
      fullName: st.stationName,
      baseline: st.baselineDelay,
      scenario: st.simulatedDelay,
      impact: st.impactMinutes,
    }));
  }, [simulationResult]);

  // View: No train selected
  if (!selectedTrainNumber) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Operational Decision Support
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            What-If Scenario Simulator
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Model operational railway disruptions, route congestion, and cascading delay impacts locally from real RailRadar telemetry.
          </p>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-3">
          <div className="w-12 h-12 bg-[#112035] border border-[#1A2840] rounded-xl flex items-center justify-center mx-auto text-2xl">
            🎛️
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            No Train Selected
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            Please search or select an express train in the top navigation bar to initialize real-time RailRadar route simulation.
          </p>
        </div>

        <div className="text-[11px] font-data text-[#2A4470] text-center pt-2">
          Simulation only — RailPredict What-If Simulator. Sourced from live RailRadar baseline. No commands are sent to railway control systems.
        </div>
      </div>
    );
  }

  // View: Loading live data from RailRadar
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Operational Decision Support
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            What-If Scenario Simulator
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Loading live route & telemetry from RailRadar for Train {selectedTrainNumber}...
          </p>
        </div>

        <div className="p-12 bg-[#0C1526] border border-[#1A2840] rounded-lg text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-data text-[#7A95B0]">
            Establishing live baseline from RailRadar for Train {selectedTrainNumber}...
          </div>
        </div>
      </div>
    );
  }

  // View: API error or missing route
  if (apiError || !trainData) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Operational Decision Support
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            What-If Scenario Simulator
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Train {selectedTrainNumber} route telemetry
          </p>
        </div>

        <Card className="p-8 text-center space-y-3">
          <div className="w-10 h-10 bg-[#112035] border border-[#1A2840] rounded-lg flex items-center justify-center mx-auto text-xl text-[#EF4444]">
            ⚠️
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Route Data Unavailable
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            {apiError?.message || 'Unable to retrieve live route stations from RailRadar telemetry.'}
          </p>
        </Card>
      </div>
    );
  }

  // View: Journey already completed
  const isJourneyCompleted =
    (trainData.status || '').toLowerCase() === 'completed' ||
    (trainData.status || '').toLowerCase() === 'arrived' ||
    remainingHalts.length === 0;

  const currentDef = SCENARIO_DEFINITIONS[selectedScenario];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header & Badges */}
      <div>
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold">
            LIVE • RailRadar Baseline
          </span>
          <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
            SIMULATED • RailPredict Derived
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          What-If Scenario Simulator
        </h1>
        <p className="text-sm text-[#7A95B0] mt-1">
          Evaluate operational railway scenarios against the selected train's real RailRadar live state. All scenario impacts are calculated locally without altering live operations.
        </p>

        {/* Live Train Baseline Telemetry Bar */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          <div className="bg-[#112035] border border-[#1A2840] rounded px-2.5 py-1 flex items-center gap-2">
            <span className="text-[#4A6080]">Train:</span>
            <span className="font-data font-semibold text-white">
              {trainData.trainNumber} — {trainData.trainName}
            </span>
            <span className="text-[9px] font-data bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded uppercase font-semibold">
              LIVE • RailRadar
            </span>
          </div>

          <div className="bg-[#112035] border border-[#1A2840] rounded px-2.5 py-1 flex items-center gap-2">
            <span className="text-[#4A6080]">Current Delay:</span>
            <span
              className={`font-data font-semibold ${
                realLiveDelay > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'
              }`}
            >
              {realLiveDelay > 0 ? `+${realLiveDelay} min` : 'On Time (0 min)'}
            </span>
            <span className="text-[9px] font-data bg-[#3B82F6]/20 text-[#3B82F6] px-1.5 py-0.5 rounded uppercase font-semibold">
              LIVE
            </span>
          </div>

          {trainData.currentLocation?.stationName && (
            <div className="bg-[#112035] border border-[#1A2840] rounded px-2.5 py-1 flex items-center gap-2">
              <span className="text-[#4A6080]">Current Location:</span>
              <span className="text-[#B8D0E8]">{trainData.currentLocation.stationName}</span>
              <span className="text-[9px] font-data bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded uppercase font-semibold">
                LIVE
              </span>
            </div>
          )}

          {trainData.nextHalt?.stationName && (
            <div className="bg-[#112035] border border-[#1A2840] rounded px-2.5 py-1 flex items-center gap-2">
              <span className="text-[#4A6080]">Next Halt:</span>
              <span className="text-[#B8D0E8]">{trainData.nextHalt.stationName}</span>
              <span className="text-[9px] font-data bg-[#10B981]/20 text-[#10B981] px-1.5 py-0.5 rounded uppercase font-semibold">
                LIVE
              </span>
            </div>
          )}

          <div className="bg-[#112035] border border-[#1A2840] rounded px-2.5 py-1 flex items-center gap-2">
            <span className="text-[#4A6080]">Remaining Halts:</span>
            <span className="font-data text-white font-semibold">{remainingHalts.length}</span>
          </div>
        </div>

        {/* Data Honesty Disclaimer */}
        <div className="mt-2 text-[11px] font-data text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded px-3 py-1.5 flex items-center justify-between flex-wrap gap-2">
          <span>
            ⚠️ <strong>SIMULATED • RailPredict Derived:</strong> All scenarios model hypothetical railway conditions. RailRadar provides live baseline telemetry only and does not directly predict these scenarios.
          </span>
          <span className="text-[#7A95B0]">No railway commands sent</span>
        </div>
      </div>

      {isJourneyCompleted ? (
        <Card className="p-8 text-center space-y-3">
          <div className="w-10 h-10 bg-[#112035] border border-[#1A2840] rounded-lg flex items-center justify-center mx-auto text-xl text-[#10B981]">
            🏁
          </div>
          <h3 className="font-display text-lg font-semibold text-white">
            Journey Completed
          </h3>
          <p className="text-sm text-[#7A95B0] max-w-md mx-auto">
            Train {trainData.trainNumber} has arrived at its final destination. The What-If Simulator models future en-route conditions for active or upcoming journeys.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top Control Panel: Scenario Selector & Parameters */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 border-b border-[#1A2840] pb-3">
              <div>
                <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
                  Scenario Selection & Controls
                </div>
                <div className="text-sm font-semibold text-white mt-0.5">
                  Choose an Operational Scenario to Model
                </div>
              </div>
              <div className="text-[11px] font-data text-[#7A95B0]">
                Baseline Delay: <span className="text-[#F59E0B] font-semibold">+{realLiveDelay}m</span>
              </div>
            </div>

            {/* 5 Scenario Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-6">
              {(Object.keys(SCENARIO_DEFINITIONS) as ScenarioType[]).map((type) => {
                const def = SCENARIO_DEFINITIONS[type];
                const isSelected = selectedScenario === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleScenarioChange(type)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#182B48] border-[#3B82F6] text-white shadow-sm'
                        : 'bg-[#0E1624] border-[#1A2840] text-[#7A95B0] hover:border-[#2A4470] hover:text-[#B8D0E8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-data px-1.5 py-0.5 rounded bg-[#112035] text-[#3B82F6] border border-[#1A2840] font-semibold uppercase">
                        {def.badge}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white line-clamp-1">
                      {def.title}
                    </div>
                    <div className="text-[10px] text-[#4A6080] line-clamp-2 mt-1 leading-snug">
                      {def.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Parameter Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#1A2840]">
              {/* Left Input: Affected Location from REAL Route */}
              <div>
                <label className="block text-xs font-data text-[#4A6080] uppercase tracking-wider mb-1.5">
                  Affected Location / Route Segment (from Real Route)
                </label>
                <div className="relative">
                  <select
                    value={selectedLocationCode}
                    onChange={(e) => setSelectedLocationCode(e.target.value)}
                    className="w-full bg-[#112035] border border-[#1A2840] rounded px-3 py-2 text-sm text-white focus:border-[#3B82F6] outline-none cursor-pointer"
                  >
                    {remainingHalts.map((st, idx) => (
                      <option key={`${st.stationCode}-${idx}`} value={st.stationCode}>
                        {idx + 1}. {st.stationName} ({st.stationCode})
                        {st.scheduledArrival ? ` — Arr ${st.scheduledArrival}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-[#4A6080] mt-1">
                  Selected from {remainingHalts.length} active stations on Train {trainData.trainNumber}'s remaining itinerary.
                </p>
              </div>

              {/* Right Input: Scenario Specific Delay / Severity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-data text-[#4A6080] uppercase tracking-wider">
                    {selectedScenario === 'congestion'
                      ? 'Congestion Severity & Running Delay'
                      : selectedScenario === 'preceding_train'
                      ? 'Assumed Preceding Train Delay'
                      : selectedScenario === 'maintenance_block'
                      ? 'Block Possession Duration'
                      : 'Additional Delay / Holding Time'}
                  </label>
                  <span className="font-data text-xs text-[#3B82F6] font-semibold">
                    +{additionalDelay} {currentDef.delayUnit}
                  </span>
                </div>

                {/* Congestion Severity Selector if Congestion Scenario */}
                {selectedScenario === 'congestion' && (
                  <div className="flex items-center gap-2 mb-2.5">
                    {(['LOW', 'MEDIUM', 'HIGH'] as CongestionSeverity[]).map((sev) => {
                      const mins = sev === 'LOW' ? 8 : sev === 'MEDIUM' ? 15 : 25;
                      const isSel = congestionSeverity === sev;
                      return (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => {
                            setCongestionSeverity(sev);
                            setAdditionalDelay(mins);
                          }}
                          className={`flex-1 py-1.5 px-2 text-xs font-data rounded border cursor-pointer transition-colors ${
                            isSel
                              ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white font-semibold'
                              : 'bg-[#112035] border-[#1A2840] text-[#7A95B0] hover:text-white'
                          }`}
                        >
                          {sev} (+{mins}m)
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Preset Delay Buttons for other scenarios */}
                {selectedScenario !== 'congestion' && (
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    {currentDef.delayOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAdditionalDelay(opt)}
                        className={`px-2.5 py-1 text-xs font-data rounded border cursor-pointer transition-colors ${
                          additionalDelay === opt
                            ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white font-semibold'
                            : 'bg-[#112035] border-[#1A2840] text-[#7A95B0] hover:text-white'
                        }`}
                      >
                        +{opt} {currentDef.delayUnit}
                      </button>
                    ))}
                  </div>
                )}

                {/* Slider for fine adjustment */}
                <input
                  type="range"
                  min={5}
                  max={selectedScenario === 'maintenance_block' ? 120 : 60}
                  step={5}
                  value={additionalDelay}
                  onChange={(e) => setAdditionalDelay(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1A2840] rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                />
                <div className="flex justify-between text-[10px] font-data text-[#4A6080] mt-1">
                  <span>+5 {currentDef.delayUnit}</span>
                  <span>+{selectedScenario === 'maintenance_block' ? 120 : 60} {currentDef.delayUnit}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-[#1A2840] flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium rounded text-sm transition-all duration-200 tracking-wide cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>▶</span>
                  <span>RUN SIMULATION</span>
                </button>

                {hasRun && (
                  <button
                    type="button"
                    onClick={handleResetToLive}
                    className="px-4 py-2.5 bg-[#112035] hover:bg-[#182B48] text-[#B8D0E8] hover:text-white border border-[#1A2840] font-data rounded text-xs transition-colors cursor-pointer"
                  >
                    RESET TO LIVE
                  </button>
                )}
              </div>

              <div className="text-[11px] font-data text-[#4A6080] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Baseline: Real RailRadar Telemetry</span>
              </div>
            </div>
          </Card>

          {/* Simulation Output Area */}
          {hasRun && simulationResult ? (
            <div className="space-y-6">
              {/* 1. Clear BEFORE / AFTER Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* BASELINE CARD */}
                <Card className="p-4 border-l-4 border-l-[#3B82F6]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-data uppercase tracking-wider text-[#4A6080]">
                      Baseline
                    </span>
                    <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold">
                      LIVE • RailRadar
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-[#7A95B0]">Destination ETA</div>
                      <div className="text-2xl font-data font-bold text-white mt-0.5">
                        {simulationResult.baseline.destinationExpectedArrival}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#7A95B0]">Current Delay</div>
                      <div className="text-lg font-data font-semibold text-[#F59E0B] mt-0.5">
                        +{simulationResult.baseline.currentDelay} min
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#4A6080] mt-2 pt-2 border-t border-[#1A2840] truncate">
                    Terminus: {simulationResult.baseline.destinationName} ({simulationResult.baseline.destinationCode})
                  </div>
                </Card>

                {/* SIMULATED CARD */}
                <Card className="p-4 border-l-4 border-l-[#EF4444]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-data uppercase tracking-wider text-[#4A6080]">
                      Simulated
                    </span>
                    <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-semibold">
                      SIMULATED • Derived
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-[#7A95B0]">Projected ETA</div>
                      <div className="text-2xl font-data font-bold text-[#EF4444] mt-0.5">
                        {simulationResult.simulated.destinationETA}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#7A95B0]">Projected Delay</div>
                      <div className="text-lg font-data font-semibold text-[#EF4444] mt-0.5">
                        +{simulationResult.simulated.destinationDelay} min
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#EF4444] mt-2 pt-2 border-t border-[#1A2840] truncate">
                    Scenario: {simulationResult.scenarioTitle}
                  </div>
                </Card>

                {/* IMPACT CARD */}
                <Card className="p-4 border-l-4 border-l-[#F59E0B]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-data uppercase tracking-wider text-[#4A6080]">
                      Net Operational Impact
                    </span>
                    <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
                      DERIVED
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-[#7A95B0]">Additional Delay</div>
                      <div className="text-2xl font-data font-bold text-[#F59E0B] mt-0.5">
                        +{simulationResult.simulated.netDelayImpact} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#7A95B0]">Affected Halts</div>
                      <div className="text-lg font-data font-semibold text-white mt-0.5">
                        {simulationResult.cascade.downstreamHaltsCount} halts
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#7A95B0] mt-2 pt-2 border-t border-[#1A2840] truncate">
                    At: {simulationResult.affectedLocationName} ({simulationResult.affectedLocationCode})
                  </div>
                </Card>
              </div>

              {/* Specific Scenario Assumption Callout */}
              <div className="bg-[#112035] border border-[#1A2840] rounded-lg p-3.5 text-xs text-[#B8D0E8] flex items-start gap-2.5">
                <span className="text-base text-[#F59E0B]">ℹ️</span>
                <div className="space-y-1">
                  <div className="font-semibold text-white">
                    {simulationResult.assumptionDisclaimer}
                  </div>
                  <div className="text-[11px] text-[#7A95B0]">
                    {simulationResult.cascade.affectedSegmentDescription}. Sourced locally from live RailRadar telemetry snapshot.
                  </div>
                </div>
              </div>

              {/* 2. CASCADE IMPACT: Selected train -> Affected segment -> Downstream stations -> Connecting trains -> Platform conflicts */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A2840]">
                  <div>
                    <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
                      Cascade Impact Analysis
                    </div>
                    <h3 className="font-display text-base font-semibold text-white mt-0.5">
                      Operational Ripple: Track Segment to Passenger Connections
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-data px-2 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 font-semibold">
                      DIRECT IMPACT
                    </span>
                    <span className="text-[9px] font-data px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
                      DERIVED / ESTIMATED
                    </span>
                  </div>
                </div>

                {/* Cascade Steps Visual Hierarchy */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                  {/* Step 1: Selected Train */}
                  <div className="bg-[#0E1624] border border-[#1A2840] rounded-lg p-3">
                    <div className="text-[10px] font-data text-[#4A6080] uppercase">1. Primary Service</div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {trainData.trainNumber}
                    </div>
                    <div className="text-[11px] text-[#7A95B0] truncate">{trainData.trainName}</div>
                    <div className="mt-2 text-[10px] font-data text-[#10B981]">
                      Live Baseline: +{realLiveDelay}m
                    </div>
                  </div>

                  {/* Step 2: Affected Segment */}
                  <div className="bg-[#0E1624] border border-[#1A2840] rounded-lg p-3">
                    <div className="text-[10px] font-data text-[#4A6080] uppercase">2. Affected Segment</div>
                    <div className="text-xs font-semibold text-white mt-1 truncate">
                      {simulationResult.affectedLocationName}
                    </div>
                    <div className="text-[11px] text-[#F59E0B] font-data font-semibold">
                      Direct: +{simulationResult.cascade.directImpactMinutes}m delay
                    </div>
                    <div className="mt-2 text-[10px] font-data text-[#3B82F6]">
                      DIRECT IMPACT
                    </div>
                  </div>

                  {/* Step 3: Downstream Stations */}
                  <div className="bg-[#0E1624] border border-[#1A2840] rounded-lg p-3">
                    <div className="text-[10px] font-data text-[#4A6080] uppercase">3. Downstream Halts</div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {simulationResult.cascade.downstreamHaltsCount} stations
                    </div>
                    <div className="text-[11px] text-[#EF4444] font-data font-semibold">
                      Destination: +{simulationResult.simulated.netDelayImpact}m
                    </div>
                    <div className="mt-2 text-[10px] font-data text-[#F59E0B]">
                      DERIVED RIPPLE
                    </div>
                  </div>

                  {/* Step 4: Network Impact */}
                  <div className="bg-[#0E1624] border border-[#1A2840] rounded-lg p-3">
                    <div className="text-[10px] font-data text-[#4A6080] uppercase">4. Network / Interchange</div>
                    <div className="text-xs font-semibold text-white mt-1">
                      {simulationResult.cascade.connectingTrains.length > 0
                        ? `${simulationResult.cascade.connectingTrains.length} Connections`
                        : 'No Connecting Trains'}
                    </div>
                    <div className="text-[11px] text-[#7A95B0]">
                      {simulationResult.cascade.platformConflicts.length > 0
                        ? `${simulationResult.cascade.platformConflicts.length} Platforms Checked`
                        : 'Station Board Tracked'}
                    </div>
                    <div className="mt-2 text-[10px] font-data text-[#F59E0B]">
                      DERIVED ESTIMATION
                    </div>
                  </div>
                </div>

                {/* Sub-panels: Preceding/Following Train & Connections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Preceding or Following Train Operational Analysis */}
                  <div className="bg-[#0E1624] border border-[#1A2840] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">
                        {simulationResult.cascade.precedingOrFollowing.type === 'preceding'
                          ? 'Preceding Train Headway Analysis'
                          : 'Following Train Knock-On Analysis'}
                      </span>
                      <span
                        className={`text-[9px] font-data px-1.5 py-0.5 rounded font-semibold ${
                          simulationResult.cascade.precedingOrFollowing.status === 'IDENTIFIED_FROM_LIVE'
                            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                            : 'bg-[#7A95B0]/15 text-[#7A95B0] border border-[#7A95B0]/30'
                        }`}
                      >
                        {simulationResult.cascade.precedingOrFollowing.status === 'IDENTIFIED_FROM_LIVE'
                          ? 'IDENTIFIED FROM LIVE'
                          : 'OPERATIONAL ASSUMPTION'}
                      </span>
                    </div>

                    <p className="text-xs text-[#7A95B0] leading-relaxed">
                      {simulationResult.cascade.precedingOrFollowing.explanation}
                    </p>

                    {simulationResult.cascade.precedingOrFollowing.trainNumber && (
                      <div className="mt-3 p-2 bg-[#112035] border border-[#1A2840] rounded text-xs flex items-center justify-between">
                        <span className="text-[#B8D0E8]">
                          Service: <strong className="text-white">{simulationResult.cascade.precedingOrFollowing.trainNumber}</strong> ({simulationResult.cascade.precedingOrFollowing.trainName})
                        </span>
                        <span className="font-data text-[#F59E0B]">
                          Headway impact: +{simulationResult.cascade.precedingOrFollowing.modeledImpactOnTrain}m
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Connecting Trains & Transfer Risk */}
                  <div className="bg-[#0E1624] border border-[#1A2840] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white">
                        Downstream Interchange & Passenger Connection Risk
                      </span>
                      <span className="text-[9px] font-data text-[#7A95B0]">
                        DERIVED
                      </span>
                    </div>

                    {simulationResult.cascade.connectingTrains.length > 0 ? (
                      <div className="space-y-2">
                        {simulationResult.cascade.connectingTrains.map((c, i) => (
                          <div
                            key={`${c.connectingTrainNumber}-${i}`}
                            className="p-2.5 bg-[#112035] border border-[#1A2840] rounded text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-white">
                                {c.connectingTrainNumber} — {c.connectingTrainName}
                              </div>
                              <div className="text-[10px] text-[#7A95B0]">
                                Dep: {c.scheduledDeparture} at {c.stationCode}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-data text-xs">
                                <span className="text-[#7A95B0]">Buffer: </span>
                                <span className={c.simulatedBufferMinutes !== null && c.simulatedBufferMinutes < 10 ? 'text-[#EF4444] font-bold' : 'text-[#F59E0B]'}>
                                  {c.simulatedBufferMinutes !== null ? `${c.simulatedBufferMinutes}m` : 'N/A'}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] font-data font-semibold uppercase px-1 py-0.5 rounded ${
                                  c.simulatedRisk === 'HIGH'
                                    ? 'bg-[#EF4444]/20 text-[#EF4444]'
                                    : c.simulatedRisk === 'MEDIUM'
                                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                                    : 'bg-[#10B981]/20 text-[#10B981]'
                                }`}
                              >
                                {c.simulatedRisk} RISK
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-[#7A95B0]">
                        <span className="block text-sm mb-1">ℹ️</span>
                        Insufficient live data to model this impact accurately.
                        <div className="text-[10px] text-[#4A6080] mt-1">
                          No connecting departures currently announced on downstream station boards.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Platform Conflict Assessment */}
                {simulationResult.cascade.platformConflicts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#1A2840]">
                    <div className="text-xs font-semibold text-white mb-2">
                      Platform Occupancy & Conflict Assessment (DERIVED)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {simulationResult.cascade.platformConflicts.map((p, idx) => (
                        <div key={`${p.stationCode}-${idx}`} className="p-2.5 bg-[#0E1624] border border-[#1A2840] rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">{p.stationName}</span>
                            <span className="text-[10px] font-data px-1.5 py-0.5 rounded bg-[#112035] text-[#B8D0E8]">
                              Platform {p.platform || 'TBD'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7A95B0] mb-1.5">
                            ETA: {p.baselineArrival} → <strong className="text-[#EF4444]">{p.simulatedArrival}</strong> (+{p.delayDifferenceMinutes}m)
                          </div>
                          <div
                            className={`text-[10px] font-data font-semibold ${
                              p.conflictRisk === 'POSSIBLE_CONFLICT' ? 'text-[#EF4444]' : 'text-[#10B981]'
                            }`}
                          >
                            {p.conflictRisk === 'POSSIBLE_CONFLICT' ? '⚠️ Possible Conflict' : '✓ Normal Turnaround'}
                          </div>
                          <div className="text-[10px] text-[#4A6080] mt-0.5">
                            {p.details}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* 3. Station-by-Station Impact Timeline Table */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1A2840] flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
                      Station-by-Station Impact Timeline
                    </div>
                    <h3 className="font-display text-base font-semibold text-white mt-0.5">
                      Real Route Halts: Baseline vs. Simulated Projection
                    </h3>
                  </div>
                  <div className="text-[11px] font-data text-[#7A95B0]">
                    Showing <strong className="text-white">{simulationResult.stationTimeline.length}</strong> real halts from route
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1A2840] text-[#4A6080] font-data uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Station</th>
                        <th className="py-2.5 px-3">Scheduled</th>
                        <th className="py-2.5 px-3 text-center">Baseline ETA (LIVE)</th>
                        <th className="py-2.5 px-3 text-center">Scenario ETA (SIMULATED)</th>
                        <th className="py-2.5 px-3 text-right">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2840]/60 font-data">
                      {simulationResult.stationTimeline.map((st) => {
                        const isPerturbed = st.isPerturbationPoint;
                        const isAffected = st.isDownstream;
                        return (
                          <tr
                            key={st.stationCode}
                            className={`transition-colors ${
                              isPerturbed
                                ? 'bg-[#3B82F6]/10 font-semibold'
                                : isAffected
                                ? 'hover:bg-[#112035]/60'
                                : 'opacity-60 hover:opacity-100 hover:bg-[#112035]/30'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{st.stationName}</span>
                                <span className="text-[10px] text-[#4A6080]">({st.stationCode})</span>
                                {isPerturbed && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3B82F6] text-white font-semibold uppercase">
                                    Affected Point
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[#7A95B0]">
                              {st.scheduledTime}
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#B8D0E8]">
                              {st.baselineETA}{' '}
                              <span className="text-[10px] text-[#7A95B0]">
                                (+{st.baselineDelay}m)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-[#EF4444] font-semibold">
                              {st.simulatedETA}{' '}
                              <span className="text-[10px] text-[#EF4444]/80">
                                (+{st.simulatedDelay}m)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  st.impactMinutes > 0
                                    ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                                    : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                                }`}
                              >
                                {st.impactMinutes > 0 ? `+${st.impactMinutes}` : '+0'} min
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* 4. Visual Delay BarChart */}
              {chartData.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest">
                        Delay Progression Chart
                      </div>
                      <div className="text-sm font-semibold text-white">
                        Baseline Delay vs. Simulated Delay (Minutes)
                      </div>
                    </div>
                    <span className="text-[10px] font-data text-[#3B5E8C]">
                      SIMULATED • RailPredict Derived
                    </span>
                  </div>

                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#112035" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
                        axisLine={false}
                        tickLine={false}
                        unit="m"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0C1526',
                          border: '1px solid #1A2840',
                          borderRadius: 6,
                          fontFamily: 'JetBrains Mono',
                          fontSize: 11,
                        }}
                        labelStyle={{ color: '#B8D0E8', fontWeight: 600 }}
                        formatter={(val: any, name: string) => [
                          `${val} min`,
                          name.includes('Simulated') ? 'Simulated (DERIVED)' : 'Baseline (LIVE)',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                          fontFamily: 'JetBrains Mono',
                          color: '#7A95B0',
                        }}
                      />
                      <Bar dataKey="baseline" name="Baseline Delay (LIVE)" fill="#2A4470" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="scenario" name="Simulated Delay (DERIVED)" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          ) : (
            /* Idle Placeholder when simulation has not been run yet */
            <Card className="p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-[#112035] border border-[#1A2840] rounded-lg flex items-center justify-center mx-auto text-xl text-[#3B82F6]">
                ⚙️
              </div>
              <h3 className="font-display text-base font-semibold text-white">
                Ready to Run Simulation
              </h3>
              <p className="text-xs text-[#7A95B0] max-w-md mx-auto">
                Select an operational scenario above (Signal Restriction, Congestion, Preceding Train, Maintenance Block, or Level Crossing), choose the affected station from the real route, and click <strong>RUN SIMULATION</strong>.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
