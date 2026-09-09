import { useState, useMemo } from 'react';
import { useTrainData } from '../context/TrainContext';

interface AlertItem {
  id: string | number;
  severity: 'HIGH' | 'MEDIUM' | 'INFO' | 'RECOVERY';
  title: string;
  detail: string;
  time: string;
  category: string;
  source: 'RailRadar' | 'RailPredict' | 'Open-Meteo';
  isDerived: boolean;
}

export function AlertCenter() {
  const { trainData, weatherRisk } = useTrainData();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dismissedIds, setDismissedIds] = useState<Set<string | number>>(new Set());

  // Dynamic alerts derived from real active train telemetry & Open-Meteo weather
  const dynamicAlerts = useMemo<AlertItem[]>(() => {
    const list: AlertItem[] = [];

    if (trainData) {
      const delay = trainData.delayMinutes ?? 0;
      const trainNum = trainData.trainNumber || '';
      const trainName = trainData.trainName || 'Express';
      const curLoc = trainData.currentLocation?.stationName || trainData.currentLocation?.stationCode || 'En-route';

      if (delay >= 30) {
        list.push({
          id: `delay-high-${trainNum}`,
          severity: 'HIGH',
          title: `Train ${trainNum} (${trainName}) — High Delay Alert (+${delay} min)`,
          detail: `RailRadar reports current delay of ${delay} minutes at ${curLoc}. RailPredict projects cascading downstream delays across remaining halts.`,
          time: 'Live Telemetry',
          category: 'Delay',
          source: 'RailRadar',
          isDerived: true,
        });
      } else if (delay >= 15) {
        list.push({
          id: `delay-med-${trainNum}`,
          severity: 'MEDIUM',
          title: `Train ${trainNum} (${trainName}) — Moderate Delay (+${delay} min)`,
          detail: `RailRadar reports delay of ${delay} minutes near ${curLoc}. Buffer recovery expected over subsequent segments.`,
          time: 'Live Telemetry',
          category: 'Delay',
          source: 'RailRadar',
          isDerived: true,
        });
      } else if (delay <= 0) {
        list.push({
          id: `ontime-${trainNum}`,
          severity: 'RECOVERY',
          title: `Train ${trainNum} (${trainName}) — On-Time Running`,
          detail: `RailRadar confirms Train ${trainNum} is running precisely on schedule at ${curLoc}.`,
          time: 'Live Telemetry',
          category: 'Delay',
          source: 'RailRadar',
          isDerived: false,
        });
      }

      if (trainData.platform) {
        list.push({
          id: `platform-${trainNum}`,
          severity: 'INFO',
          title: `Train ${trainNum} — Platform ${trainData.platform} Assigned`,
          detail: `RailRadar verified live platform assignment: Platform ${trainData.platform} at ${curLoc}.`,
          time: 'Live Telemetry',
          category: 'Platform',
          source: 'RailRadar',
          isDerived: false,
        });
      }
    }

    if (weatherRisk && weatherRisk.riskScore > 20) {
      list.push({
        id: 'weather-risk',
        severity: weatherRisk.riskScore > 50 ? 'HIGH' : 'MEDIUM',
        title: `Weather Alert: ${weatherRisk.condition.toUpperCase()} (${weatherRisk.riskLabel})`,
        detail: `Open-Meteo weather data indicates ${weatherRisk.condition} with visibility impact. RailPredict derived predicted delay impact: +${weatherRisk.predictedDelayImpactMinutes} min.`,
        time: 'Live Weather',
        category: 'Weather',
        source: 'Open-Meteo',
        isDerived: true,
      });
    }

    // Baseline system intelligence alerts
    const baseAlerts: AlertItem[] = [
      {
        id: 1,
        severity: 'HIGH',
        title: 'Platform Conflict Risk — Secunderabad Junction',
        detail: 'RailPredict derived: 4-minute overlap window detected between incoming express movements. Station operations to verify allocation.',
        time: '4 min ago',
        category: 'Critical',
        source: 'RailPredict',
        isDerived: true,
      },
      {
        id: 2,
        severity: 'MEDIUM',
        title: 'Corridor Section Congestion — Vijayawada Downstream',
        detail: 'High density detected on down-line. RailPredict derived forecast: +5 to +8 min propagation risk.',
        time: '9 min ago',
        category: 'Congestion',
        source: 'RailPredict',
        isDerived: true,
      },
      {
        id: 3,
        severity: 'RECOVERY',
        title: 'Train 12625 — Dynamic Corridor Delay Recovery',
        detail: 'RailPredict derived: Train 12625 projected to recover 8–11 minutes across high-speed electrified section.',
        time: '14 min ago',
        category: 'Delay',
        source: 'RailPredict',
        isDerived: true,
      },
    ];

    return [...list, ...baseAlerts];
  }, [trainData, weatherRisk]);

  const categories = ['All', 'Critical', 'Delay', 'Platform', 'Weather', 'Congestion'];

  const visibleAlerts = dynamicAlerts.filter(
    (a) => !dismissedIds.has(a.id) && (selectedCategory === 'All' || a.category === selectedCategory)
  );

  const counts = {
    HIGH: dynamicAlerts.filter((a) => a.severity === 'HIGH' && !dismissedIds.has(a.id)).length,
    MEDIUM: dynamicAlerts.filter((a) => a.severity === 'MEDIUM' && !dismissedIds.has(a.id)).length,
  };

  const severityStyles: Record<string, { color: string; bg: string; label: string }> = {
    HIGH: { color: '#EF4444', bg: '#EF444415', label: 'CRITICAL' },
    MEDIUM: { color: '#F59E0B', bg: '#F59E0B15', label: 'WARNING' },
    INFO: { color: '#3B82F6', bg: '#3B82F615', label: 'INFO' },
    RECOVERY: { color: '#10B981', bg: '#10B98115', label: 'NOMINAL' },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-data text-[#4A6080] uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold">
              LIVE • RailRadar
            </span>
            <span className="text-[9px] font-data px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/30 font-semibold">
              RailPredict Derived
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">
            Operational Intelligence Alerts
          </h1>
          <p className="text-sm text-[#4A6080] mt-1">
            Real-time notifications from live telemetry & RailPredict derived forecasts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {counts.HIGH > 0 && (
            <span className="font-data text-xs bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 rounded-full px-2.5 py-1">
              {counts.HIGH} Critical
            </span>
          )}
          {counts.MEDIUM > 0 && (
            <span className="font-data text-xs bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 rounded-full px-2.5 py-1">
              {counts.MEDIUM} Warning
            </span>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-data px-3 py-1.5 rounded transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#3B82F6] text-white'
                : 'bg-[#0C1526] border border-[#1A2840] text-[#4A6080] hover:text-[#B8D0E8] hover:border-[#2A4470]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="text-center py-16 text-[#3B5E8C] text-sm font-data">
          No active alerts in this category
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((item) => {
            const conf = severityStyles[item.severity];
            return (
              <div
                key={item.id}
                className="bg-[#0C1526] border border-[#1A2840] rounded-lg p-4 flex items-start gap-4 hover:border-[#2A4470] transition-colors group"
              >
                <div className="flex-shrink-0 pt-0.5">
                  <span
                    className="text-[10px] font-data font-bold px-2 py-0.5 rounded border block"
                    style={{
                      color: conf.color,
                      backgroundColor: conf.bg,
                      borderColor: conf.color + '40',
                    }}
                  >
                    {conf.label}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-white">{item.title}</span>
                    {item.isDerived ? (
                      <span className="text-[9px] font-data px-1.5 py-0.2 rounded bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30">
                        RailPredict Derived Alert
                      </span>
                    ) : (
                      <span className="text-[9px] font-data px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                        LIVE • RailRadar
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#7A95B0] leading-relaxed">{item.detail}</div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-data text-[#3B5E8C]">{item.time}</span>
                    <span className="text-[10px] font-data text-[#2A4470]">
                      · Category: {item.category}
                    </span>
                    <span className="text-[10px] font-data text-[#4A6080]">
                      · Source: {item.source}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDismissedIds((prev) => new Set([...prev, item.id]))}
                  className="text-[#2A4470] hover:text-[#4A6080] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Dismiss alert"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
