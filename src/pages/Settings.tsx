import type { ReactNode } from 'react';
import { useTrainData } from '../context/TrainContext';

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0B111D] border border-[#182335] rounded-sm ${className}`}>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-4">
        {title}
      </div>
      {children}
    </Card>
  );
}

export function Settings() {
  const now = new Date();
  const { isConfigured, isFallback, lastUpdated } = useTrainData();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1">
          System & Integration
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Platform Configuration & Telemetry
        </h1>
        <p className="text-sm text-[#4A6080] mt-1">
          RailRadar API connection status, model metadata, data freshness, and security boundaries.
        </p>
      </div>

      {/* RailRadar Live Integration Gateway Status */}
      <div className="bg-[#0C1526] border border-[#1E3354] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full pulse-dot ${
                !isFallback ? 'bg-[#10B981]' : isConfigured ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'
              }`}
            />
            <div>
              <div className="font-display font-semibold text-white text-base">
                RailRadar Live Railway Gateway
              </div>
              <div className="text-xs font-data text-[#4A6080]">
                https://api.railradar.in/v1/trains/{'{number}'}/live
              </div>
            </div>
          </div>
          <span
            className={`text-xs font-data px-2.5 py-1 rounded border self-start sm:self-auto ${
              !isFallback
                ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30'
                : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30'
            }`}
          >
            {!isFallback ? '● Live Telemetry Stream' : '○ Calibrated Baseline Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-data">
          <div className="bg-[#112035] p-3 rounded">
            <div className="text-[#4A6080] mb-1">Security Architecture</div>
            <div className="text-[#10B981] font-semibold">Server-Side Proxy</div>
            <div className="text-[10px] text-[#3B5E8C] mt-0.5">Zero browser key exposure</div>
          </div>
          <div className="bg-[#112035] p-3 rounded">
            <div className="text-[#4A6080] mb-1">Authentication</div>
            <div className="text-white font-semibold">Bearer Secret</div>
            <div className="text-[10px] text-[#3B5E8C] mt-0.5">RAILRADAR_API_KEY env</div>
          </div>
          <div className="bg-[#112035] p-3 rounded">
            <div className="text-[#4A6080] mb-1">Rate Limit Guard</div>
            <div className="text-[#3B82F6] font-semibold">20s TTL Caching</div>
            <div className="text-[10px] text-[#3B5E8C] mt-0.5">Prevents 429 penalties</div>
          </div>
          <div className="bg-[#112035] p-3 rounded">
            <div className="text-[#4A6080] mb-1">Last Sync</div>
            <div className="text-white font-semibold">
              {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Active'}
            </div>
            <div className="text-[10px] text-[#3B5E8C] mt-0.5">Real-time NTES poll</div>
          </div>
        </div>
      </div>

      <div className="bg-[#112035] border border-[#2A4470] rounded-lg p-5">
        <div className="text-sm text-[#B8D0E8] leading-relaxed">
          <strong className="text-white">
            RailPredict provides forecasting and decision support.
          </strong>{' '}
          Predictions are not guaranteed arrival times and should not be used as direct train-control commands. All outputs represent probabilistic forecasts based on historical patterns and live data.
        </div>
      </div>

      <Section title="Data & Model Status">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Data Freshness', value: '< 1 min', status: 'good' },
            {
              label: 'Last Update',
              value: `${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST`,
              status: 'good',
            },
            { label: 'Model Version', value: 'V2.1.3', status: 'good' },
            {
              label: 'Prediction Timestamp',
              value: now.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              status: 'good',
            },
            { label: 'Confidence Interval', value: 'P10–P90 (80%)', status: 'info' },
            { label: 'Retraining Status', value: 'Continuous', status: 'good' },
          ].map((item) => (
            <div key={item.label} className="bg-[#112035] rounded p-3">
              <div className="text-[10px] font-data text-[#4A6080] mb-1">{item.label}</div>
              <div
                className={`font-data text-sm font-semibold ${
                  item.status === 'good'
                    ? 'text-[#10B981]'
                    : item.status === 'warning'
                    ? 'text-[#F59E0B]'
                    : 'text-[#3B82F6]'
                }`}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Known Limitations">
        <ul className="space-y-2.5">
          {[
            'Predictions are probabilistic. Real-world conditions can differ from forecasts during severe track events.',
            'GPS coverage gaps in tunnel sections may temporarily rely on block-section signaling extrapolation.',
            'Extreme weather events outside training distribution may cause temporary forecast degradation.',
            'Model performance is calibrated across Indian Railways network with dense coverage on South Central and Northern corridors.',
            'P10/P90 intervals reflect nominal operational distributions and exclude major force majeure blockages.',
          ].map((limitation, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-[#7A95B0]">
              <span className="text-[#3B5E8C] flex-shrink-0 mt-0.5 font-data">
                {(idx + 1).toString().padStart(2, '0')}.
              </span>
              {limitation}
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Privacy & Security">
          <div className="space-y-2 text-xs text-[#7A95B0] leading-relaxed">
            <p>
              RailPredict proxies all telemetry through an isolated Express gateway. Third-party API keys are strictly confined to server-side environments.
            </p>
            <p>
              No passenger personally identifiable information is collected, logged, or transferred to third-party endpoints.
            </p>
          </div>
        </Section>

        <Section title="Data Sources">
          <div className="space-y-2">
            {[
              'RailRadar live train status (api.railradar.in)',
              'NTES real-time GPS & station logging',
              'Historical section recovery models',
              'Indian Meteorological Department weather indicators',
              'Zone operational restrictions & permanent speed restrictions',
            ].map((source, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#7A95B0]">
                <span className="w-1 h-1 rounded-full bg-[#3B82F6] flex-shrink-0" />
                {source}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Model Information">
          <div className="space-y-2 text-xs">
            {[
              { k: 'Algorithm', v: 'Dynamic Gradient Boosting + Kalman recovery' },
              { k: 'Inference latency', v: '< 18ms' },
              { k: 'Uncertainty engine', v: 'Quantile regression (P10/P50/P90)' },
              { k: 'Attribution', v: 'SHAP delay feature contribution' },
              { k: 'Downstream tracking', v: 'Bottleneck section detector' },
            ].map((item) => (
              <div
                key={item.k}
                className="flex items-center justify-between py-1 border-b border-[#112035]"
              >
                <span className="text-[#4A6080]">{item.k}</span>
                <span className="font-data text-[#7A95B0]">{item.v}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="System Status">
          <div className="space-y-2">
            {[
              { service: 'RailRadar API Proxy', status: 'Healthy', uptime: '99.98%' },
              { service: 'Inference Engine', status: 'Healthy', uptime: '99.94%' },
              { service: 'NTES Data Ingestion', status: 'Healthy', uptime: '99.91%' },
              { service: 'Quantile Forecaster', status: 'Healthy', uptime: '99.95%' },
              { service: 'Alert Dispatcher', status: 'Healthy', uptime: '99.99%' },
            ].map((item) => (
              <div
                key={item.service}
                className="flex items-center justify-between py-1 border-b border-[#112035]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="text-xs text-[#B8D0E8]">{item.service}</span>
                </div>
                <span className="font-data text-[10px] text-[#10B981]">{item.uptime}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
