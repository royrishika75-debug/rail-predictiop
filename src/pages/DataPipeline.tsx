import type { ReactNode } from 'react';

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

const kV = [
  {
    id: 'input',
    label: 'Live Train Data',
    icon: '◉',
    status: 'active',
    latency: '120ms',
    description: 'GPS, Signal Aspects, Station Reports',
  },
  {
    id: 'validate',
    label: 'Data Validation',
    icon: '▣',
    status: 'active',
    latency: '18ms',
    description: 'Schema checks, outlier detection, completeness',
  },
  {
    id: 'features',
    label: 'Feature Engineering',
    icon: '⚙',
    status: 'active',
    latency: '45ms',
    description: 'Section running time, lag features, congestion index',
  },
  {
    id: 'ml',
    label: 'ML ETA Forecast',
    icon: '▲',
    status: 'active',
    latency: '28ms',
    description: 'XGBoost + Neural ensemble — Model V2',
  },
  {
    id: 'network',
    label: 'Network Intelligence',
    icon: '⬡',
    status: 'active',
    latency: '35ms',
    description: 'Graph-based propagation analysis',
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty Layer',
    icon: '◷',
    status: 'active',
    latency: '12ms',
    description: 'Quantile regression — P10/P50/P90',
  },
  {
    id: 'explain',
    label: 'Explainability',
    icon: '◬',
    status: 'active',
    latency: '8ms',
    description: 'SHAP feature attribution',
  },
  {
    id: 'api',
    label: 'Prediction API',
    icon: '⟶',
    status: 'active',
    latency: '31ms p95',
    description: 'REST / gRPC — authenticated endpoints',
  },
  {
    id: 'dashboards',
    label: 'Passenger + Railway Dashboards',
    icon: '⊟',
    status: 'active',
    latency: null,
    description: 'Real-time display, alerts, decision support',
  },
];

const AV = [
  { label: 'GPS / Location', status: 'active', rate: '1 Hz per train' },
  { label: 'Signal Aspects', status: 'active', rate: 'Event-driven' },
  { label: 'Historical Delay', status: 'active', rate: 'Hourly batch' },
  { label: 'Section Running Time', status: 'active', rate: 'Trip-level' },
  { label: 'Weather', status: 'active', rate: '15 min refresh' },
  { label: 'Congestion Index', status: 'active', rate: '5 min refresh' },
  { label: 'Operational Restrictions', status: 'active', rate: 'Event-driven' },
];

const jV = [
  { label: 'Completeness', value: 98.4, color: '#10B981' },
  { label: 'Timeliness', value: 96.1, color: '#10B981' },
  { label: 'Validity', value: 99.2, color: '#10B981' },
  { label: 'GPS Coverage', value: 91.8, color: '#F59E0B' },
];

export function DataPipeline() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div>
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
          System Architecture
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Data Pipeline
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-5">
            Processing Pipeline
          </div>
          <div className="space-y-0">
            {kV.map((item, idx) => (
              <div key={item.id}>
                <div className="flex items-start gap-4 py-3 group">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-9 h-9 rounded-lg bg-[#112035] border border-[#1A2840] group-hover:border-[#3B82F6] transition-colors flex items-center justify-center text-[#3B82F6] text-sm">
                      {item.icon}
                    </div>
                    {idx < kV.length - 1 && (
                      <div className="w-px flex-1 bg-[#1A2840] mt-1" style={{ height: 20 }} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-white">{item.label}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot inline-block" />
                      </div>
                      {item.latency && (
                        <span className="font-data text-xs text-[#4A6080]">{item.latency}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#4A6080] mt-0.5">{item.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Input Data Sources
            </div>
            <div className="space-y-2">
              {AV.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-1.5 border-b border-[#112035] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-xs text-[#B8D0E8]">{item.label}</span>
                  </div>
                  <span className="font-data text-[10px] text-[#4A6080]">{item.rate}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              Data Quality Indicators
            </div>
            <div className="space-y-3">
              {jV.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#7A95B0]">{item.label}</span>
                    <span className="font-data text-xs font-semibold" style={{ color: item.color }}>
                      {item.value}%
                    </span>
                  </div>
                  <div className="bg-[#112035] rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-3">
              System Notes
            </div>
            <div className="space-y-2 text-[11px] text-[#4A6080] leading-relaxed font-data">
              <div>• Designed for scalable multi-train prediction</div>
              <div>• Horizontal scaling via stateless microservices</div>
              <div>• Feature store shared across model versions</div>
              <div>• Event-driven architecture with Kafka-like messaging</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
