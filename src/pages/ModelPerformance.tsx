import { useMemo, type ReactNode } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

const modelList = [
  { name: 'Baseline', mae: 12.4, rmse: 16.8, accuracy: '52%', inference: '4 ms', badge: null },
  { name: 'Random Forest', mae: 7.2, rmse: 9.6, accuracy: '71%', inference: '18 ms', badge: null },
  { name: 'XGBoost', mae: 5.8, rmse: 7.9, accuracy: '78%', inference: '12 ms', badge: null },
  { name: 'RailPredict V2', mae: 3.9, rmse: 5.4, accuracy: '87%', inference: '28 ms', badge: 'ACTIVE' },
];

const maeTrendData = [
  { date: 'Aug 1', mae: 4.8 },
  { date: 'Aug 8', mae: 4.5 },
  { date: 'Aug 15', mae: 4.1 },
  { date: 'Aug 22', mae: 3.9 },
  { date: 'Aug 29', mae: 3.9 },
  { date: 'Sep 1', mae: 3.9 },
];

export function ModelPerformance() {
  const scatterData = useMemo(() => {
    // Generate deterministic 28 points around the line
    const points = [];
    const seeds = [
      [5, 4], [8, 9], [12, 11], [15, 17], [18, 16], [22, 24], [25, 23],
      [28, 30], [32, 31], [35, 33], [7, 6], [11, 13], [14, 12], [19, 21],
      [23, 20], [27, 29], [30, 28], [34, 35], [9, 8], [13, 15], [17, 18],
      [21, 19], [24, 26], [29, 27], [33, 31], [10, 12], [16, 15], [26, 25]
    ];
    for (const [actual, predicted] of seeds) {
      points.push({ actual, predicted });
    }
    return points;
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Analysis
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Model Performance
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Comparison across model versions — Demo Data only.
          </p>
        </div>
        <div className="text-right text-[10px] font-data text-[#4A6080]">
          <div className="text-[#F59E0B] font-semibold mb-1">⚠ DEMO DATA</div>
          Values require validation against production traffic
        </div>
      </div>

      <Card className="p-5">
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4">
          Model Comparison — Demo Data
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A2840]">
                {[
                  'Model',
                  'MAE (min)',
                  'RMSE (min)',
                  'Prediction Accuracy',
                  'Inference Time',
                  'Status',
                ].map((header) => (
                  <th
                    key={header}
                    className="text-left py-2 px-4 text-[11px] font-data text-[#4A6080] uppercase tracking-wider font-medium"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelList.map((m, idx) => {
                const isActive = m.badge === 'ACTIVE';
                return (
                  <tr
                    key={m.name}
                    className={`border-b border-[#112035] hover:bg-[#112035] transition-colors ${
                      isActive ? 'bg-[#0F1E38]' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium text-sm ${
                            isActive ? 'text-[#3B82F6]' : 'text-[#7A95B0]'
                          }`}
                        >
                          {m.name}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-data bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 font-data text-sm"
                      style={{ color: idx === modelList.length - 1 ? '#10B981' : '#7A95B0' }}
                    >
                      {m.mae}
                    </td>
                    <td
                      className="py-3 px-4 font-data text-sm"
                      style={{ color: idx === modelList.length - 1 ? '#10B981' : '#7A95B0' }}
                    >
                      {m.rmse}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-[80px] bg-[#112035] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-[#3B82F6]"
                            style={{ width: m.accuracy }}
                          />
                        </div>
                        <span className="font-data text-xs text-[#B8D0E8]">
                          {m.accuracy}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-data text-xs text-[#7A95B0]">
                      {m.inference}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="text-[10px] font-data"
                        style={{
                          color: idx < modelList.length - 1 ? '#3B5E8C' : '#10B981',
                        }}
                      >
                        {idx < modelList.length - 1 ? 'Archived' : '● Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            Predicted vs. Actual Arrival Delay
          </div>
          <div className="text-[10px] text-[#3B5E8C] mb-4 font-data">
            RailPredict V2 · Demo Data · Historical Replay Sample
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#112035" />
              <XAxis
                dataKey="actual"
                name="Actual"
                type="number"
                domain={[0, 40]}
                tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Actual (min)',
                  position: 'insideBottom',
                  offset: -2,
                  fill: '#4A6080',
                  fontSize: 10,
                }}
              />
              <YAxis
                dataKey="predicted"
                name="Predicted"
                type="number"
                domain={[0, 40]}
                tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Predicted',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#4A6080',
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0C1526',
                  border: '1px solid #1A2840',
                  borderRadius: 4,
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                }}
                cursor={{ strokeDasharray: '3 3', stroke: '#2A4470' }}
              />
              <ReferenceLine
                stroke="#2A4470"
                segment={[{ x: 0, y: 0 }, { x: 40, y: 40 }]}
                strokeDasharray="4 2"
                label={{ value: 'Perfect', fill: '#3B5E8C', fontSize: 9 }}
              />
              <Scatter data={scatterData} fill="#3B82F6" opacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
            MAE Trend — V2 Training History
          </div>
          <div className="text-[10px] text-[#3B5E8C] mb-4 font-data">
            Demo Data
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={maeTrendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#112035" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#4A6080', fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                unit=" min"
                domain={[3, 5.5]}
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
                strokeWidth={2.5}
                dot={{ fill: '#10B981', r: 4 }}
                name="MAE"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-5">
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4">
          Validation Strategy
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Chronological / Time-Based Split',
              desc: 'Training on earlier periods, testing on later periods. No future information leaks into the training set.',
              icon: '◷',
              color: '#3B82F6',
            },
            {
              title: 'No Future Information',
              desc: 'Feature engineering and model training use only data available at prediction time. No look-ahead bias.',
              icon: '▣',
              color: '#10B981',
            },
            {
              title: 'Continuous Drift Monitoring',
              desc: 'Ongoing monitoring for feature drift and prediction distribution shift. Retraining triggered by threshold breaches.',
              icon: '⬡',
              color: '#F59E0B',
            },
          ].map((item) => (
            <div key={item.title} className="bg-[#112035] rounded-lg p-4">
              <div className="text-lg mb-3" style={{ color: item.color }}>
                {item.icon}
              </div>
              <div className="font-medium text-sm text-white mb-2">{item.title}</div>
              <div className="text-xs text-[#4A6080] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
