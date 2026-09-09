import { useState, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

const fV = [
  { time: '10:00', actual: 0, predicted: 2, error: 2 },
  { time: '10:30', actual: 5, predicted: 6, error: 1 },
  { time: '11:15', actual: 12, predicted: 10, error: -2 },
  { time: '12:00', actual: 18, predicted: 16, error: -2 },
  { time: '13:00', actual: 22, predicted: 24, error: 2 },
  { time: '14:00', actual: 20, predicted: 21, error: 1 },
  { time: '15:00', actual: 17, predicted: 18, error: 1 },
  { time: '16:00', actual: 15, predicted: 14, error: -1 },
  { time: '17:00', actual: 12, predicted: 13, error: 1 },
  { time: '18:00', actual: 10, predicted: 10, error: 0 },
  { time: '19:00', actual: 9, predicted: 10, error: 1 },
];

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#070B12] border border-[#182335] rounded-sm px-3 py-2 text-xs font-mono shadow-xl">
        <div className="text-[#94A3B8] mb-1">{label}</div>
        {payload.map((item: any) => (
          <div key={item.dataKey} style={{ color: item.color }}>
            {item.name}: {item.value} min
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function HistoricalReplay() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [timerId, setTimerId] = useState<any>(null);

  const current = fV[step];

  const handlePlayToggle = () => {
    if (playing) {
      if (timerId) clearInterval(timerId);
      setTimerId(null);
      setPlaying(false);
      return;
    }
    setStep(0);
    setPlaying(true);
    const id = setInterval(() => {
      setStep((prev) => {
        if (prev >= fV.length - 1) {
          clearInterval(id);
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    setTimerId(id);
  };

  const visibleData = fV.slice(0, step + 1);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
          Analysis
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Historical Journey Replay
        </h1>
        <p className="text-sm text-[#4A6080] mt-1">
          Evaluate forecasting system against known historical outcomes.
        </p>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[11px] font-data text-[#4A6080] mb-1">Train</div>
            <select className="w-full bg-[#112035] border border-[#1A2840] rounded text-sm text-[#B8D0E8] px-2 py-1.5 outline-none">
              <option>12625 — Kerala Express</option>
              <option>12760 — Charminar SF</option>
              <option>17016 — Visakha Express</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] font-data text-[#4A6080] mb-1">Date</div>
            <select className="w-full bg-[#112035] border border-[#1A2840] rounded text-sm text-[#B8D0E8] px-2 py-1.5 outline-none">
              <option>2024-09-01</option>
              <option>2024-08-31</option>
              <option>2024-08-30</option>
            </select>
          </div>
          <div>
            <div className="text-[11px] font-data text-[#4A6080] mb-1">Model</div>
            <select className="w-full bg-[#112035] border border-[#1A2840] rounded text-sm text-[#B8D0E8] px-2 py-1.5 outline-none">
              <option>RailPredict V2</option>
              <option>RailPredict V1</option>
              <option>Baseline (XGBoost)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePlayToggle}
              className={`w-full py-1.5 rounded text-sm font-medium transition-all cursor-pointer ${
                playing
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                  : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white'
              }`}
            >
              {playing ? '⏹ Stop' : '⏮ Replay Journey'}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4">
            Journey Timeline
          </div>
          <div className="space-y-0">
            {fV.map((item, idx) => {
              const isCurrent = idx === step;
              const isPast = idx < step;
              return (
                <button
                  key={item.time}
                  onClick={() => {
                    setStep(idx);
                    setPlaying(false);
                    if (timerId) clearInterval(timerId);
                  }}
                  className={`w-full flex items-center gap-3 py-2 px-2 rounded transition-all text-left cursor-pointer ${
                    isCurrent
                      ? 'bg-[#1A2F50]'
                      : isPast
                      ? 'opacity-70 hover:bg-[#112035]'
                      : 'opacity-30 hover:bg-[#112035]'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isCurrent
                        ? 'bg-[#3B82F6]'
                        : isPast
                        ? 'bg-[#2A4470]'
                        : 'bg-[#1A2840]'
                    }`}
                  />
                  <div className="flex-1">
                    <div
                      className={`font-data text-xs ${
                        isCurrent
                          ? 'text-[#3B82F6]'
                          : isPast
                          ? 'text-[#7A95B0]'
                          : 'text-[#3B5E8C]'
                      }`}
                    >
                      {item.time}
                    </div>
                  </div>
                  {isPast || isCurrent ? (
                    <div className="flex gap-3 font-data text-[10px]">
                      <span
                        style={{
                          color:
                            item.actual > 15
                              ? '#EF4444'
                              : item.actual > 8
                              ? '#F59E0B'
                              : '#10B981',
                        }}
                      >
                        A:{item.actual}
                      </span>
                      <span className="text-[#3B82F6]">P:{item.predicted}</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Snapshot @ {current.time}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Actual Delay',
                  value: `+${current.actual} min`,
                  color:
                    current.actual > 15
                      ? '#EF4444'
                      : current.actual > 8
                      ? '#F59E0B'
                      : '#10B981',
                },
                {
                  label: 'Predicted Delay',
                  value: `+${current.predicted} min`,
                  color: '#3B82F6',
                },
                {
                  label: 'Prediction Error',
                  value: `${current.error > 0 ? '+' : ''}${current.error} min`,
                  color: Math.abs(current.error) <= 2 ? '#10B981' : '#F59E0B',
                },
              ].map((item) => (
                <div key={item.label} className="bg-[#112035] rounded p-3 text-center">
                  <div className="text-[10px] font-data text-[#4A6080] mb-1">{item.label}</div>
                  <div className="font-data font-bold text-lg" style={{ color: item.color }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Actual vs. RailPredict Forecast
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={visibleData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#112035" />
                <XAxis
                  dataKey="time"
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
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono',
                    color: '#4A6080',
                  }}
                />
                <ReferenceLine y={0} stroke="#1A2840" />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 3 }}
                  name="Actual"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ fill: '#3B82F6', r: 3 }}
                  name="Predicted"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Replay Summary · Demo Data
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Journey MAE', value: '1.8 min' },
                { label: 'Max Error', value: '3 min' },
                { label: 'Within ±5 min', value: '100%' },
                { label: 'Model Version', value: 'V2' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[10px] text-[#4A6080] font-data">{item.label}</div>
                  <div className="font-data font-semibold text-sm text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
