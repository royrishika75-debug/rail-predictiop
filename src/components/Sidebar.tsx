import { useTrainData } from '../context/TrainContext';

interface NavItem {
  id: string;
  label: string;
  code: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
  view?: 'passenger' | 'operations';
}

const SECTIONS: NavSection[] = [
  {
    title: 'OPERATIONS',
    items: [
      { id: 'live-trains', label: 'Live Trains', code: 'TRK', badge: 'LIVE' },
      { id: 'network', label: 'Network Intelligence', code: 'NET' },
      { id: 'platform', label: 'Platform Forecast', code: 'PFM' },
      { id: 'connection', label: 'Connection Risk', code: 'CNX' },
    ],
  },
  {
    title: 'PREDICTION',
    items: [
      { id: 'eta-forecast', label: 'ETA Forecast', code: 'ETA' },
      { id: 'propagation', label: 'Delay Propagation', code: 'DPG' },
      { id: 'simulator', label: 'What-If Simulator', code: 'SIM' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { id: 'replay', label: 'Historical Replay', code: 'RPL' },
      { id: 'model-performance', label: 'Model Performance', code: 'PRF' },
      { id: 'monitoring', label: 'Model Monitoring', code: 'MON' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'alerts', label: 'Alert Center', code: 'ALT' },
      { id: 'pipeline', label: 'Data Pipeline', code: 'DPL' },
      { id: 'settings', label: 'Settings', code: 'CFG' },
    ],
  },
];

export function Sidebar({ page, setPage }: SidebarProps) {
  const { trainData, isRefreshing } = useTrainData();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#070B12] border-r border-[#182335] flex flex-col justify-between select-none">
      {/* Platform Branding & Console Header */}
      <div>
        <div
          onClick={() => setPage('live-trains')}
          className="px-3.5 py-3 border-b border-[#182335] cursor-pointer hover:bg-[#0B111D] transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#3B82F6]" />
              <span className="font-mono text-xs font-bold tracking-widest text-white">
                RAIL<span className="text-[#3B82F6]">PREDICT</span>
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#64748B] border border-[#182335] px-1 py-0.2 rounded-sm uppercase">
              v2.4
            </span>
          </div>
          <div className="text-[9px] font-mono text-[#64748B] mt-1 tracking-wider uppercase flex items-center justify-between">
            <span>TRANSIT OPS CONSOLE</span>
            <span className="text-[#10B981] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot inline-block" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Structured Navigation Groups */}
        <nav className="p-2 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)]">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-[#475569] font-semibold">
                {section.title}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    page === item.id ||
                    (item.id === 'live-trains' && page === 'dashboard') ||
                    (item.id === 'network' && page === 'operations');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPage(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-sm text-left transition-colors cursor-pointer text-xs ${
                        isActive
                          ? 'bg-[#111B2C] text-white font-medium border-l-2 border-[#3B82F6]'
                          : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#0B111D]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#475569] w-6">
                          {item.code}
                        </span>
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[8px] font-mono font-semibold px-1 py-0.2 bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-sm">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Telemetry Status Footer */}
      <div className="p-2.5 border-t border-[#182335] bg-[#070B12] text-[10px] font-mono">
        <div className="bg-[#0B111D] border border-[#182335] p-2 rounded-sm space-y-1">
          <div className="flex items-center justify-between text-[#64748B]">
            <span>TELEMETRY</span>
            <span className="text-[#10B981] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] pulse-dot inline-block" />
              RAILRADAR
            </span>
          </div>
          <div className="flex items-center justify-between text-[#64748B]">
            <span>TRAIN TRACK</span>
            <span className="text-[#E2E8F0] font-semibold">
              {trainData ? trainData.trainNumber : '12625'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#64748B]">
            <span>STATUS</span>
            <span
              className={`font-semibold ${
                isRefreshing ? 'text-[#F59E0B]' : 'text-[#3B82F6]'
              }`}
            >
              {isRefreshing ? 'SYNCING...' : 'STEADY'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
