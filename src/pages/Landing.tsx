interface LandingProps {
  onPassenger: () => void;
  onOperations: () => void;
}

export function Landing({ onPassenger, onOperations }: LandingProps) {
  return (
    <div className="min-h-screen bg-[#070B12] text-[#E2E8F0] font-sans antialiased flex flex-col justify-between select-none">
      {/* Console Top Header */}
      <header className="bg-[#090E17] border-b border-[#182335] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-none" />
          <div className="font-mono text-sm font-bold tracking-widest text-white">
            RAIL<span className="text-[#3B82F6]">PREDICT</span>
          </div>
          <span className="text-[10px] font-mono text-[#64748B] border border-[#182335] px-1.5 py-0.5 rounded-sm">
            TRANSIT OPS CONSOLE v2.4
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-1.5 text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot inline-block" />
            <span>LIVE • RailRadar Telemetry</span>
          </div>
          <div className="hidden sm:block text-[#475569]">|</div>
          <div className="hidden sm:block">
            {new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}{' '}
            IST
          </div>
        </div>
      </header>

      {/* Main Console Workspace */}
      <main className="max-w-6xl w-full mx-auto p-6 md:p-10 space-y-6">
        {/* Operations Overview Banner */}
        <div className="bg-[#0B111D] border border-[#182335] rounded-sm p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#182335] pb-4">
            <div>
              <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-widest">
                RAILWAY NETWORK OPERATIONS CONSOLE
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                Real-Time Telemetry & Predictive Dispatch Analytics
              </h1>
              <p className="text-xs text-[#94A3B8] font-mono mt-1 leading-relaxed max-w-2xl">
                Live NTES satellite tracking, corridor headway monitoring, dynamic platform utilization, and connection transfer risk modeling for Indian Railways operations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onPassenger}
                className="px-4 py-2.5 bg-[#111B2C] hover:bg-[#182335] border border-[#3B82F6] hover:border-[#60A5FA] text-[#E2E8F0] font-mono text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>PASSENGER CONSOLE</span>
                <span>→</span>
              </button>
              <button
                onClick={onOperations}
                className="px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono text-xs font-semibold rounded-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>OPERATIONS HUB</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* System Telemetry Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-[#070B12] border border-[#182335] p-3 rounded-sm">
              <div className="text-[10px] text-[#64748B] uppercase">TELEMETRY INGESTION</div>
              <div className="text-sm font-bold text-white mt-0.5">RailRadar API</div>
              <div className="text-[10px] text-[#10B981] mt-0.5">Direct Server Proxy</div>
            </div>
            <div className="bg-[#070B12] border border-[#182335] p-3 rounded-sm">
              <div className="text-[10px] text-[#64748B] uppercase">MONITORED CORRIDORS</div>
              <div className="text-sm font-bold text-white mt-0.5">3 Major Trunks</div>
              <div className="text-[10px] text-[#94A3B8] mt-0.5">NR, WR, SCR Zones</div>
            </div>
            <div className="bg-[#070B12] border border-[#182335] p-3 rounded-sm">
              <div className="text-[10px] text-[#64748B] uppercase">PREDICTION PIPELINE</div>
              <div className="text-sm font-bold text-white mt-0.5">25 ML Features</div>
              <div className="text-[10px] text-[#8B5CF6] mt-0.5">XGBoost Standby</div>
            </div>
            <div className="bg-[#070B12] border border-[#182335] p-3 rounded-sm">
              <div className="text-[10px] text-[#64748B] uppercase">METEOROLOGICAL</div>
              <div className="text-sm font-bold text-white mt-0.5">Open-Meteo</div>
              <div className="text-[10px] text-[#60A5FA] mt-0.5">Live Weather Grids</div>
            </div>
          </div>
        </div>

        {/* Console Navigation Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={onPassenger}
            className="bg-[#0B111D] border border-[#182335] hover:border-[#3B82F6] rounded-sm p-4 transition-colors cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#3B82F6] font-semibold">01 · OPERATIONS</span>
              <span className="text-[#64748B] group-hover:text-white transition-colors">ENTER ↗</span>
            </div>
            <div className="font-mono text-sm font-bold text-white">Live Train Tracking</div>
            <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
              Real-time route schematics, station halts manifests, delay evolution curves, and statistical arrival windows (P10–P90).
            </p>
          </div>

          <div
            onClick={onOperations}
            className="bg-[#0B111D] border border-[#182335] hover:border-[#3B82F6] rounded-sm p-4 transition-colors cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#10B981] font-semibold">02 · NETWORK</span>
              <span className="text-[#64748B] group-hover:text-white transition-colors">ENTER ↗</span>
            </div>
            <div className="font-mono text-sm font-bold text-white">Corridor & Station Boards</div>
            <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
              Multi-station live arrivals and departures, corridor bottleneck detection, and upstream delay propagation vectors.
            </p>
          </div>

          <div
            onClick={onPassenger}
            className="bg-[#0B111D] border border-[#182335] hover:border-[#3B82F6] rounded-sm p-4 transition-colors cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#F59E0B] font-semibold">03 · FORECASTING</span>
              <span className="text-[#64748B] group-hover:text-white transition-colors">ENTER ↗</span>
            </div>
            <div className="font-mono text-sm font-bold text-white">ETA & Recovery Engine</div>
            <p className="text-xs text-[#94A3B8] font-mono leading-relaxed">
              Analytical comparison between scheduled timetable, linear telemetry extrapolation, and ML feature vector delay forecasts.
            </p>
          </div>
        </div>
      </main>

      {/* Console Footer */}
      <footer className="bg-[#090E17] border-t border-[#182335] px-6 py-2.5 flex items-center justify-between text-[10px] font-mono text-[#64748B]">
        <div>RAILPREDICT OPERATIONAL INTELLIGENCE PLATFORM</div>
        <div>DATA SOURCE: OFFICIAL RAILRADAR API • STRICT OPERATIONAL USE ONLY</div>
      </footer>
    </div>
  );
}
