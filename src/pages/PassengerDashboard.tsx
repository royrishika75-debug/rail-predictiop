import { useState, useMemo, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { useTrainData } from '../context/TrainContext';

interface PassengerDashboardProps {
  mode?: 'live' | 'forecast';
}

function OpsPanel({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm overflow-hidden ${className}`}>
      {title && (
        <div className="bg-[#0E1624] border-b border-[#182335] px-3.5 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-none bg-[#3B82F6]" />
            <span className="font-mono text-xs font-semibold tracking-wider text-[#E2E8F0] uppercase">
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] font-mono text-[#64748B] hidden sm:inline">
                · {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {action}
          </div>
        </div>
      )}
      <div className="p-3.5">{children}</div>
    </div>
  );
}

function DelayText({ delay }: { delay: number }) {
  if (delay <= 0) {
    return <span className="font-mono text-xs font-semibold text-[#10B981]">0 min</span>;
  }
  if (delay <= 15) {
    return <span className="font-mono text-xs font-semibold text-[#F59E0B]">+{delay} min</span>;
  }
  return <span className="font-mono text-xs font-semibold text-[#EF4444]">+{delay} min</span>;
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#070B12] border border-[#182335] rounded-sm px-2.5 py-1.5 text-xs font-mono shadow-2xl">
        <div className="text-[#94A3B8] font-semibold mb-1">{label}</div>
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-3" style={{ color: item.color }}>
            <span>{item.name}:</span>
            <span className="font-semibold">+{item.value} min</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function PassengerDashboard({ mode = 'live' }: PassengerDashboardProps) {
  const [showShapDetail, setShowShapDetail] = useState(false);

  const {
    trainData,
    isLoading,
    isRefreshing,
    apiError,
    isFallback,
    lastUpdated,
    calculated,
    refreshTrain,
    dismissError,
    currentWeather,
    weatherRisk,
    searchTrain,
    selectedTrainNumber,
  } = useTrainData();

  if (!selectedTrainNumber && !trainData) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <OpsPanel title="TRAIN DISPATCH TELEMETRY SELECTOR">
          <div className="py-8 text-center max-w-xl mx-auto space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest text-[#64748B]">
              NO ACTIVE TRAIN TRACKING STREAM
            </div>
            <h2 className="text-lg font-semibold text-white">
              Select an Express Corridor Train to Initialize Telemetry
            </h2>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Real-time NTES / RailRadar satellite positions, dynamic ETA forecasting, and delay recovery analysis.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-left">
              {[
                { num: '12625', name: 'Kerala Express', from: 'NDLS', to: 'TVC' },
                { num: '12760', name: 'Charminar SF', from: 'HYB', to: 'MAS' },
                { num: '12951', name: 'Tejas Rajdhani', from: 'MMCT', to: 'NDLS' },
                { num: '12028', name: 'Shatabdi Exp', from: 'SBC', to: 'MAS' },
                { num: '17016', name: 'Visakha Exp', from: 'SC', to: 'BBS' },
                { num: '12301', name: 'Howrah Rajdhani', from: 'HWH', to: 'NDLS' },
              ].map((t) => (
                <button
                  key={t.num}
                  onClick={() => searchTrain(t.num)}
                  className="p-2.5 bg-[#070B12] hover:bg-[#111B2C] border border-[#182335] hover:border-[#3B82F6] rounded-sm transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#3B82F6]">{t.num}</span>
                    <span className="text-[9px] font-mono text-[#64748B]">{t.from}→{t.to}</span>
                  </div>
                  <div className="text-xs text-[#E2E8F0] font-medium truncate mt-0.5">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </OpsPanel>
      </div>
    );
  }

  const delay = trainData?.delayMinutes ?? 0;
  const trainNum = trainData?.trainNumber || selectedTrainNumber || '';
  const trainName = trainData?.trainName || (trainNum ? `Train ${trainNum}` : '');
  const speed = trainData?.currentLocation?.speedKmh ?? trainData?.speed ?? null;
  const platform = trainData?.currentLocation?.isHalt && trainData?.platform
    ? trainData.platform
    : trainData?.route?.[0]?.platform || null;

  const currentStationName =
    trainData?.currentLocation?.stationName ||
    trainData?.currentLocation?.stationCode ||
    trainData?.previousHalt?.stationName ||
    'Location en-route';

  const rawStatus = (trainData?.status || '').toLowerCase().trim();

  const nextStationName =
    trainData?.nextHalt?.stationName ||
    (trainData?.nextHalt?.stationCode ? trainData.nextHalt.stationCode : '') ||
    (rawStatus === 'completed' ? 'Destination Reached' : calculated.timeline.find((t) => t.isNext)?.station || 'Destination');

  const sourceName = trainData?.train?.source?.name || calculated.timeline[0]?.station || 'Origin';
  const destName = trainData?.train?.destination?.name || calculated.destinationName || 'Destination';

  let statusColor = '#10B981';
  let statusText = 'RUNNING';

  if (rawStatus === 'not-started' || rawStatus === 'scheduled') {
    statusText = 'NOT STARTED';
    statusColor = '#3B82F6';
  } else if (rawStatus === 'completed' || rawStatus === 'arrived') {
    statusText = 'COMPLETED';
    statusColor = '#10B981';
  } else if (rawStatus === 'diverted') {
    statusText = 'DIVERTED';
    statusColor = '#F59E0B';
  } else if (rawStatus === 'cancelled' || rawStatus === 'canceled') {
    statusText = 'CANCELLED';
    statusColor = '#EF4444';
  } else {
    if (delay > 20) {
      statusText = 'RUNNING (SEVERE DELAY)';
      statusColor = '#EF4444';
    } else if (delay > 5) {
      statusText = 'RUNNING (MODERATE DELAY)';
      statusColor = '#F59E0B';
    } else {
      statusText = 'RUNNING (ON TIME)';
      statusColor = '#10B981';
    }
  }

  const nextHaltStop = calculated.timeline.find((t) => t.isNext);
  const nextStationEta = rawStatus === 'completed'
    ? 'Arrived'
    : nextHaltStop?.predicted && nextHaltStop.predicted !== '--:--'
    ? nextHaltStop.predicted
    : 'ETA unavailable';

  const updatedString = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live stream active';

  // Extract station nodes for the railway timeline
  const routeStations = calculated.timeline;
  const passedCount = routeStations.filter((s) => s.isPassed).length;

  return (
    <div className="p-3.5 sm:p-5 space-y-4 max-w-7xl mx-auto font-sans">
      {/* Alert Notices */}
      {apiError && (
        <div className="bg-[#18110D] border border-[#F59E0B]/40 rounded-sm p-3 text-xs font-mono flex items-start justify-between gap-3 text-[#F59E0B]">
          <div>
            <span className="font-bold uppercase mr-2">[TELEMETRY NOTICE]:</span>
            <span>{apiError.message}</span>
          </div>
          <button onClick={dismissError} className="text-[#94A3B8] hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. LIVE TRAIN OPERATIONAL COMMAND HEADER                                 */}
      {/* ========================================================================= */}
      <div className="bg-[#0B111D] border border-[#182335] rounded-sm overflow-hidden">
        {/* Top Identification Ribbon */}
        <div className="bg-[#0E1624] border-b border-[#182335] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base sm:text-lg font-bold text-white tracking-wider">
              {trainNum}
            </span>
            <span className="font-mono text-xs sm:text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">
              {trainName}
            </span>
            <span className="text-xs font-mono text-[#64748B] hidden md:inline">
              [{sourceName} → {destName}]
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span
              className="px-2 py-0.5 rounded-sm font-semibold flex items-center gap-1.5 border"
              style={{
                color: statusColor,
                borderColor: `${statusColor}40`,
                backgroundColor: `${statusColor}15`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full pulse-dot inline-block"
                style={{ backgroundColor: statusColor }}
              />
              {statusText}
            </span>
            <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded-sm font-semibold">
              LIVE • RailRadar
            </span>
          </div>
        </div>

        {/* Dense Operational Console Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#182335] bg-[#0B111D]">
          {/* Col 1: Current Location */}
          <div className="p-3.5 space-y-1">
            <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              CURRENT LOCATION
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {currentStationName}
            </div>
            <div className="text-xs font-mono text-[#94A3B8] flex items-center gap-2">
              <span>{platform ? `PF ${platform}` : 'PF: TBD'}</span>
              <span>·</span>
              <span>{speed != null ? `${Math.round(speed)} km/h` : 'Telemetry speed'}</span>
            </div>
          </div>

          {/* Col 2: Next Station & ETA */}
          <div className="p-3.5 space-y-1">
            <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              NEXT STATION / STOP
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {nextStationName}
            </div>
            <div className="text-xs font-mono text-[#3B82F6] font-medium">
              ETA {nextStationEta}
            </div>
          </div>

          {/* Col 3: Current Delay */}
          <div className="p-3.5 space-y-1">
            <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              CURRENT DELAY
            </div>
            <div className="text-sm font-mono font-bold" style={{ color: statusColor }}>
              {delay > 0 ? `+${delay} min` : delay === 0 ? 'ON TIME' : `${delay} min`}
            </div>
            <div className="text-xs font-mono text-[#64748B]">
              {delay > 15 ? '▲ Cascading buffer' : delay > 0 ? '▲ Stable delay' : '● Scheduled pace'}
            </div>
          </div>

          {/* Col 4: Destination ETA & Telemetry Sync */}
          <div className="p-3.5 space-y-1">
            <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
              FINAL DESTINATION ETA
            </div>
            <div className="text-sm font-mono font-bold text-white">
              {calculated.destinationEta || 'ETA unavailable'}
            </div>
            <div className="text-[10px] font-mono text-[#64748B] truncate">
              Updated {updatedString}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. RAILWAY-STYLE ROUTE TIMELINE DIAGRAM                                  */}
      {/* ========================================================================= */}
      <OpsPanel
        title="CORRIDOR ROUTE PROGRESSION"
        subtitle={`Total Stops: ${routeStations.length} · Completed: ${passedCount} · Remaining: ${routeStations.length - passedCount}`}
        badge={
          <span className="text-[9px] font-mono text-[#94A3B8]">
            Progress: {calculated.journeyProgressPct}%
          </span>
        }
      >
        {/* Horizontal Rail Schematic */}
        <div className="overflow-x-auto py-2">
          <div className="min-w-[700px] flex items-center justify-between relative px-4">
            {/* Base Rail Track Line */}
            <div className="absolute left-6 right-6 top-3 h-[2px] bg-[#182335] z-0" />
            {/* Completed Rail Track Section */}
            <div
              className="absolute left-6 top-3 h-[2px] bg-[#3B82F6] z-0 transition-all duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, (passedCount / Math.max(1, routeStations.length - 1)) * 100))}%`,
              }}
            />

            {routeStations.slice(0, 10).map((st, i) => {
              const isPassed = st.isPassed;
              const isCurrent = i === passedCount - 1 || (passedCount === 0 && i === 0);
              const isNext = st.isNext;

              return (
                <div key={st.stationCode || i} className="relative z-10 flex flex-col items-center group">
                  {/* Station Node Indicator */}
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                      isCurrent
                        ? 'bg-[#3B82F6] border-white ring-2 ring-[#3B82F6]/50'
                        : isPassed
                        ? 'bg-[#182335] border-[#3B82F6] text-[#3B82F6]'
                        : isNext
                        ? 'bg-[#0B111D] border-[#F59E0B] ring-2 ring-[#F59E0B]/30'
                        : 'bg-[#0B111D] border-[#2A3B54]'
                    }`}
                  >
                    {isCurrent ? (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    ) : isPassed ? (
                      <span className="w-1.5 h-1.5 bg-[#3B82F6] rounded-full" />
                    ) : (
                      <span className="w-1 h-1 bg-[#475569] rounded-full" />
                    )}
                  </div>

                  {/* Station Label & Telemetry */}
                  <div className="mt-2 text-center">
                    <div className="font-mono text-xs font-semibold text-white">
                      {st.stationCode || st.station.slice(0, 4)}
                    </div>
                    <div className="text-[10px] font-mono text-[#64748B] truncate max-w-[65px]">
                      {st.predicted || st.scheduled}
                    </div>
                    {st.delay > 0 && (
                      <div className="text-[9px] font-mono text-[#EF4444] font-semibold">
                        +{st.delay}m
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </OpsPanel>

      {/* ========================================================================= */}
      {/* 11. ETA FORECAST & ANALYTICAL COMPARISON                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Analytical Comparison Chart & Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <OpsPanel
            title="ANALYTICAL ETA FORECAST & DELAY EVOLUTION"
            subtitle="Scheduled Baseline vs Real-Time RailRadar vs RailPredict Forecast"
            badge={
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 rounded-sm">
                RailPredict Derived
              </span>
            }
          >
            {/* Comparison Metrics Header */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#070B12] border border-[#182335] rounded-sm mb-3">
              <div>
                <div className="text-[9px] font-mono text-[#64748B] uppercase">
                  SCHEDULED ARRIVAL
                </div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-[#94A3B8]">
                  {calculated.timeline[calculated.timeline.length - 1]?.scheduled || '--:--'}
                </div>
                <div className="text-[9px] font-mono text-[#475569]">Official NTES timetable</div>
              </div>
              <div className="border-l border-[#182335] pl-2">
                <div className="text-[9px] font-mono text-[#64748B] uppercase">
                  RAILRADAR LIVE ETA
                </div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-white">
                  {calculated.destinationEta || '--:--'}
                </div>
                <div className="text-[9px] font-mono text-[#10B981]">Live telemetry projection</div>
              </div>
              <div className="border-l border-[#182335] pl-2">
                <div className="text-[9px] font-mono text-[#64748B] uppercase">
                  XGBOOST ML VECTOR
                </div>
                <div className="text-xs sm:text-sm font-mono font-semibold text-[#A78BFA]">
                  25 Features Standby
                </div>
                <div className="text-[9px] font-mono text-[#64748B]">Live features extracted</div>
              </div>
            </div>

            {/* Delay Evolution Recharts Curve */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                <span>EN-ROUTE DELAY PROPAGATION (MINUTES)</span>
                <span>DYNAMIC BLOCK BEHAVIOR</span>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <LineChart data={calculated.delayEvolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#141E2E" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#182335' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#182335' }}
                    tickLine={false}
                    unit="m"
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      color: '#94A3B8',
                      paddingTop: 8,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#475569"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    name="Linear Telemetry Baseline"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', r: 2.5 }}
                    name="RailPredict Dynamic Forecast"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </OpsPanel>
        </div>

        {/* Right Col: Uncertainty Window & Weather Impact */}
        <div className="space-y-4">
          <OpsPanel
            title="UNCERTAINTY BOUNDS (P10–P90)"
            subtitle="Calibrated Confidence"
            badge={
              <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/20 rounded-sm">
                Statistical
              </span>
            }
          >
            <div className="space-y-3">
              <div className="bg-[#070B12] border border-[#182335] p-2.5 rounded-sm">
                <div className="text-[10px] font-mono text-[#64748B] uppercase">
                  P50 MOST LIKELY ARRIVAL
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {calculated.destinationEta}
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] mt-1 pt-1 border-t border-[#182335]">
                  <span>P10 Early: {calculated.p10Arrival}</span>
                  <span>P90 Late: {calculated.p90Arrival}</span>
                </div>
              </div>

              {/* Weather Conditions Panel */}
              <div className="bg-[#070B12] border border-[#182335] p-2.5 rounded-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">
                    METEOROLOGICAL SENSOR
                  </span>
                  <span className="text-[9px] font-mono text-[#10B981]">
                    OPEN-METEO LIVE
                  </span>
                </div>
                {currentWeather ? (
                  <div className="text-xs font-mono">
                    <div className="text-white font-semibold flex items-center justify-between">
                      <span>{currentWeather.condition.toUpperCase()}</span>
                      <span>{Math.round(currentWeather.tempC)}°C</span>
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">
                      Wind: {Math.round(currentWeather.windKmh)} km/h · Delay risk: {weatherRisk?.predictedDelayImpactMinutes ? `+${weatherRisk.predictedDelayImpactMinutes}m` : 'Nominal'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-mono text-[#64748B]">
                    Querying local track coordinates...
                  </div>
                )}
              </div>
            </div>
          </OpsPanel>

          {/* Section Delay Recovery */}
          <OpsPanel
            title="DELAY RECOVERY POTENTIAL"
            badge={
              <span className="text-[9px] font-mono text-[#10B981] font-semibold">
                −{calculated.totalRecoveryMinutes} MIN RECOVERY
              </span>
            }
          >
            <div className="text-xs font-mono text-[#94A3B8] leading-relaxed">
              Model projects up to <strong className="text-white font-mono">{calculated.totalRecoveryMinutes} minutes</strong> recovered along high-speed electrified corridors via schedule slack and block clearance.
            </div>
          </OpsPanel>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DENSE OPERATIONAL TABLE OF ROUTE HALTS                                  */}
      {/* ========================================================================= */}
      <OpsPanel
        title="SCHEDULED HALTS & LIVE TIMINGS MANIFEST"
        subtitle="Complete sequence of route stations and actual NTES live delays"
        badge={
          <span className="text-[9px] font-mono text-[#64748B]">
            {routeStations.length} STATIONS
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#070B12] border-b border-[#182335] text-[#64748B] text-[10px] uppercase">
                <th className="py-2 px-2.5">SEQ</th>
                <th className="py-2 px-2.5">STATION</th>
                <th className="py-2 px-2.5">CODE</th>
                <th className="py-2 px-2.5">SCHED ARR</th>
                <th className="py-2 px-2.5">SCHED DEP</th>
                <th className="py-2 px-2.5">LIVE / FORECAST</th>
                <th className="py-2 px-2.5">DELAY</th>
                <th className="py-2 px-2.5">PF</th>
                <th className="py-2 px-2.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#121A28]">
              {routeStations.map((item, idx) => {
                const isPassed = item.isPassed;
                const isNext = item.isNext;

                return (
                  <tr
                    key={item.stationCode || idx}
                    className={`hover:bg-[#0E1626] transition-colors ${
                      isNext
                        ? 'bg-[#182335]/30 text-white font-semibold'
                        : isPassed
                        ? 'text-[#64748B]'
                        : 'text-[#E2E8F0]'
                    }`}
                  >
                    <td className="py-2 px-2.5 text-[#475569]">{idx + 1}</td>
                    <td className="py-2 px-2.5 font-semibold text-white truncate max-w-[160px]">
                      {item.station}
                    </td>
                    <td className="py-2 px-2.5 text-[#3B82F6] font-bold">
                      {item.stationCode || '—'}
                    </td>
                    <td className="py-2 px-2.5 text-[#64748B]">{item.scheduled}</td>
                    <td className="py-2 px-2.5 text-[#64748B]">
                      {item.scheduledDeparture || item.scheduled}
                    </td>
                    <td className="py-2 px-2.5 font-bold text-white">
                      {item.predicted}
                    </td>
                    <td className="py-2 px-2.5">
                      <DelayText delay={item.delay} />
                    </td>
                    <td className="py-2 px-2.5 text-[#94A3B8]">
                      {item.platform ? `PF ${item.platform}` : '—'}
                    </td>
                    <td className="py-2 px-2.5">
                      {isNext ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40 rounded-sm">
                          NEXT STOP
                        </span>
                      ) : isPassed ? (
                        <span className="text-[9px] text-[#475569]">DEPARTED</span>
                      ) : (
                        <span className="text-[9px] text-[#94A3B8]">UPCOMING</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </OpsPanel>
    </div>
  );
}
