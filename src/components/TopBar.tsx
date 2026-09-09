import { useState, type KeyboardEvent } from 'react';
import { useTrainData } from '../context/TrainContext';
import { POPULAR_TRAINS } from '../utils/referenceTrains';

interface TopBarProps {
  view: 'passenger' | 'operations';
  setView: (v: 'passenger' | 'operations') => void;
  setPage: (p: string) => void;
}

export function TopBar({ view, setView, setPage }: TopBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRefreshMenu, setShowRefreshMenu] = useState(false);

  const {
    searchTrain,
    refreshTrain,
    isRefreshing,
    refreshInterval,
    setRefreshInterval,
    trainData,
    journeyDate,
    setJourneyDate,
    currentISTDate,
  } = useTrainData();

  const shiftDay = (delta: number) => {
    try {
      const [y, m, d] = journeyDate.split('-').map(Number);
      const target = new Date(y, m - 1, d + delta);
      setJourneyDate(target.toISOString().slice(0, 10));
    } catch {
      // ignore
    }
  };

  const suggestions =
    query.length > 0
      ? POPULAR_TRAINS.filter(
          (t) =>
            t.num.includes(query) ||
            t.name.toLowerCase().includes(query.toLowerCase()) ||
            t.route.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  const handleSelectTrain = (num: string, name?: string) => {
    setQuery(`${num}${name ? ` — ${name}` : ''}`);
    setShowSuggestions(false);
    searchTrain(num);
    setPage('live-trains');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const match = query.match(/\d{4,5}/);
      if (match) {
        handleSelectTrain(match[0]);
      } else if (suggestions.length > 0) {
        handleSelectTrain(suggestions[0].num, suggestions[0].name);
      }
    }
  };

  return (
    <header className="bg-[#090E17] border-b border-[#182335] px-3.5 py-2 flex items-center gap-3 flex-shrink-0 z-30 select-none">
      {/* Console Identifier */}
      <div className="flex items-center gap-2 pr-3 border-r border-[#182335] text-xs font-mono font-semibold text-[#94A3B8]">
        <span className="text-[#3B82F6]">OPS-CONSOLE</span>
        <span className="text-[#475569]">/</span>
        <span className="text-white">
          {trainData ? trainData.trainNumber : '12625'}
        </span>
      </div>

      {/* Train Lookup Bar */}
      <div className="relative flex-1 max-w-sm">
        <div className="flex items-center gap-2 bg-[#0C121E] border border-[#182335] focus-within:border-[#3B82F6] rounded-sm px-2.5 py-1 transition-colors">
          <span className="text-[#64748B] text-xs font-mono">№</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onFocus={() => setShowSuggestions(true)}
            placeholder={
              trainData
                ? `${trainData.trainNumber} · ${trainData.trainName}`
                : 'Search train number or name (e.g. 12625)...'
            }
            className="bg-transparent text-xs text-[#E2E8F0] placeholder-[#475569] outline-none w-full font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#64748B] hover:text-[#E2E8F0] text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-[#0C121E] border border-[#182335] rounded-sm shadow-2xl z-50 overflow-hidden">
            <div className="px-2.5 py-1 text-[9px] font-mono text-[#64748B] uppercase tracking-wider bg-[#070B12] border-b border-[#182335]">
              {suggestions.length > 0 ? 'Matching Trains' : 'Quick Reference Express Trains'}
            </div>
            {(suggestions.length > 0 ? suggestions : POPULAR_TRAINS.slice(0, 6)).map((t) => (
              <button
                key={t.num}
                type="button"
                className="w-full text-left px-2.5 py-1.5 hover:bg-[#111B2C] flex items-center justify-between gap-2 transition-colors border-b border-[#121A28] last:border-0 cursor-pointer"
                onMouseDown={() => handleSelectTrain(t.num, t.name)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-1 py-0.2 rounded-sm border border-[#3B82F6]/20">
                    {t.num}
                  </span>
                  <span className="text-xs text-[#E2E8F0] font-medium truncate">
                    {t.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#64748B] truncate max-w-[140px]">
                  {t.route}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Operational Journey Date Stepper */}
      <div className="flex items-center gap-1 bg-[#0C121E] border border-[#182335] rounded-sm px-2 py-1 text-xs font-mono">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="text-[#64748B] hover:text-[#E2E8F0] px-0.5 cursor-pointer text-xs"
          title="Previous day"
        >
          ◀
        </button>
        <span className="text-[#64748B] text-[10px] uppercase hidden sm:inline">DATE:</span>
        <input
          type="date"
          value={journeyDate}
          onChange={(e) => {
            if (e.target.value) setJourneyDate(e.target.value);
          }}
          className="bg-transparent text-[#E2E8F0] text-xs font-mono outline-none cursor-pointer"
        />
        <button
          type="button"
          onClick={() => shiftDay(1)}
          className="text-[#64748B] hover:text-[#E2E8F0] px-0.5 cursor-pointer text-xs"
          title="Next day"
        >
          ▶
        </button>
        {journeyDate === currentISTDate && (
          <span className="text-[8px] font-mono bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/30 px-1 py-0.2 rounded-sm font-semibold hidden md:inline">
            TODAY
          </span>
        )}
      </div>

      {/* Sync & Rate-Limit Shield Controls */}
      <div className="flex items-center gap-1 bg-[#0C121E] border border-[#182335] rounded-sm px-1.5 py-0.5">
        <button
          onClick={() => refreshTrain(true)}
          disabled={isRefreshing}
          title="Force refresh live telemetry"
          className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono text-[#94A3B8] hover:text-white hover:bg-[#182335] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span className={`text-xs ${isRefreshing ? 'animate-spin text-[#F59E0B]' : 'text-[#3B82F6]'}`}>
            ↻
          </span>
          <span className="hidden md:inline">
            {isRefreshing ? 'SYNCING...' : 'SYNC'}
          </span>
        </button>

        <div className="relative border-l border-[#182335] pl-1">
          <button
            onClick={() => setShowRefreshMenu(!showRefreshMenu)}
            className="px-1.5 py-1 text-[10px] font-mono text-[#64748B] hover:text-[#94A3B8] rounded-sm hover:bg-[#182335] transition-colors cursor-pointer"
            title="Auto-refresh cadence"
          >
            {refreshInterval === 0 ? 'MANUAL' : `${refreshInterval}S`} ▾
          </button>

          {showRefreshMenu && (
            <div
              className="absolute top-full right-0 mt-1 w-28 bg-[#0C121E] border border-[#182335] rounded-sm shadow-xl py-1 z-50 text-xs font-mono"
              onMouseLeave={() => setShowRefreshMenu(false)}
            >
              {[
                { label: 'Manual (0s)', val: 0 },
                { label: 'Every 30s', val: 30 },
                { label: 'Every 60s', val: 60 },
                { label: 'Every 2m', val: 120 },
                { label: 'Every 5m', val: 300 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => {
                    setRefreshInterval(opt.val);
                    setShowRefreshMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1 hover:bg-[#111B2C] transition-colors cursor-pointer text-xs ${
                    refreshInterval === opt.val
                      ? 'text-[#3B82F6] font-semibold'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Segmented View Mode Toggle: Passenger vs Operations */}
      <div className="flex items-center bg-[#0C121E] border border-[#182335] rounded-sm p-0.5 ml-auto">
        <button
          onClick={() => {
            setView('passenger');
            setPage('live-trains');
          }}
          className={`px-2.5 py-1 rounded-sm text-[11px] font-mono uppercase transition-colors cursor-pointer ${
            view === 'passenger'
              ? 'bg-[#182335] text-white font-semibold'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Passenger
        </button>
        <button
          onClick={() => {
            setView('operations');
            setPage('network');
          }}
          className={`px-2.5 py-1 rounded-sm text-[11px] font-mono uppercase transition-colors cursor-pointer ${
            view === 'operations'
              ? 'bg-[#182335] text-white font-semibold'
              : 'text-[#64748B] hover:text-[#E2E8F0]'
          }`}
        >
          Operations
        </button>
      </div>

      {/* Telemetry Status Indicator */}
      <div className="hidden xl:flex items-center gap-3 text-[10px] font-mono text-[#64748B] pl-2 border-l border-[#182335]">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full pulse-dot inline-block ${
              trainData?.source === 'RailRadar' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          />
          <span
            className={`font-semibold ${
              trainData?.source === 'RailRadar' ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            LIVE • RailRadar
          </span>
        </div>
        <div className="text-[#475569]">
          {new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}{' '}
          IST
        </div>
      </div>
    </header>
  );
}
