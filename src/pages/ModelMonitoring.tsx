import type { ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function Card({ children, className = '' }: { children: ReactNode; className?: string; key?: string | number }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

const CV = [
  { t: '06:00', mae: 4.1 },
  { t: '08:00', mae: 3.8 },
  { t: '10:00', mae: 3.6 },
  { t: '12:00', mae: 3.9 },
  { t: '14:00', mae: 4.2 },
  { t: '16:00', mae: 3.9 },
  { t: '18:00', mae: 3.7 },
  { t: '20:00', mae: 3.9 },
];

const wV = [
  { label: 'Current MAE', value: '3.9 min', status: 'healthy', threshold: '< 6.0 min' },
  { label: 'Data Drift Score', value: '0.04', status: 'healthy', threshold: '< 0.10' },
  { label: 'Feature Drift', value: '0.07', status: 'warning', threshold: '< 0.10' },
  { label: 'Prediction Volume', value: '18,420 / hr', status: 'healthy', threshold: '> 5,000 / hr' },
  { label: 'API Latency (p95)', value: '31 ms', status: 'healthy', threshold: '< 100 ms' },
  { label: 'Model Version', value: 'V2.1.3', status: 'healthy', threshold: 'Current' },
];

const TV = [
  { name: 'Section Running Time', drift: 0.02, status: 'stable' },
  { name: 'Historical Delay', drift: 0.04, status: 'stable' },
  { name: 'Downstream Congestion', drift: 0.07, status: 'watch' },
  { name: 'Weather Impact', drift: 0.09, status: 'watch' },
  { name: 'Junction Load', drift: 0.03, status: 'stable' },
  { name: 'Signal Aspects', drift: 0.01, status: 'stable' },
];

export function ModelMonitoring() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            System
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            AI Model Health
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[10px] font-data text-[#4A6080] mb-1">MODEL</div>
            <span className="font-data text-xs text-[#3B82F6] border border-[#1E3354] rounded px-2 py-1">
              V2.1.3
            </span>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-data text-[#4A6080] mb-1">STATUS</div>
            <span className="font-data text-xs text-[#10B981] border border-[#10B981]/30 rounded px-2 py-1">
              ● HEALTHY
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {wV.map((item) => {
          const color =
            item.status === 'healthy'
              ? '#10B981'
              : item.status === 'warning'
              ? '#F59E0B'
              : '#EF4444';
          return (
            <Card key={item.label} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-data text-[#4A6080]">{item.label}</div>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              </div>
              <div className="font-data font-bold text-xl text-white mb-1">{item.value}</div>
              <div className="text-[10px] text-[#3B5E8C] font-data">
                Threshold: {item.threshold}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4">
          MAE Over Time — Today
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={CV} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#112035" />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              unit="m"
              domain={[3, 5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0C1526',
                border: '1px solid #1A2840',
                borderRadius: 4,
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
              }}
              labelStyle={{ color: '#7A95B0' }}
            />
            <Line
              type="monotone"
              dataKey="mae"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 3 }}
              name="MAE"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-5">
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4">
          Feature Drift Monitor
        </div>
        <div className="space-y-3">
          {TV.map((item) => {
            const color =
              item.status === 'stable'
                ? '#10B981'
                : item.status === 'watch'
                ? '#F59E0B'
                : '#EF4444';
            return (
              <div key={item.name} className="flex items-center gap-4">
                <div className="text-xs text-[#7A95B0] w-44 flex-shrink-0">{item.name}</div>
                <div className="flex-1 bg-[#112035] rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${item.drift * 500}%`, backgroundColor: color }}
                  />
                </div>
                <div className="font-data text-xs w-12 text-right" style={{ color }}>
                  {item.drift.toFixed(2)}
                </div>
                <span
                  className="text-[9px] font-data px-1.5 py-0.5 rounded capitalize"
                  style={{ color, backgroundColor: color + '15' }}
                >
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5 border-[#F59E0B]/30">
        <div className="flex items-start gap-3">
          <span className="text-[#F59E0B] text-xl flex-shrink-0">⚠</span>
          <div>
            <div className="font-medium text-[#F59E0B] mb-1">Retraining Recommendation</div>
            <div className="text-sm text-[#7A95B0] leading-relaxed">
              Retraining is recommended when prediction error or data distribution exceeds configured thresholds. Weather Impact and Downstream Congestion features show elevated drift scores and should be monitored.
            </div>
            <div className="mt-2 text-[10px] font-data text-[#3B5E8C]">
              Automated retraining is not deployed. This is a manual decision-support alert.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
