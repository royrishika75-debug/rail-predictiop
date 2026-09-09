import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Landing } from './pages/Landing';
import { PassengerDashboard } from './pages/PassengerDashboard';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { NetworkIntelligence } from './pages/NetworkIntelligence';
import { WhatIfSimulator } from './pages/WhatIfSimulator';
import { PlatformForecast } from './pages/PlatformForecast';
import { ConnectionRisk } from './pages/ConnectionRisk';
import { HistoricalReplay } from './pages/HistoricalReplay';
import { ModelPerformance } from './pages/ModelPerformance';
import { ModelMonitoring } from './pages/ModelMonitoring';
import { DataPipeline } from './pages/DataPipeline';
import { AlertCenter } from './pages/AlertCenter';
import { Settings } from './pages/Settings';
import { TrainProvider } from './context/TrainContext';

export default function App() {
  const [page, setPage] = useState('live-trains');
  const [view, setView] = useState<'passenger' | 'operations'>('passenger');

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
      case 'live-trains':
        return <PassengerDashboard mode="live" />;
      case 'eta-forecast':
        return <PassengerDashboard mode="forecast" />;
      case 'network':
        return <NetworkIntelligence mode="overview" />;
      case 'propagation':
        return <NetworkIntelligence mode="propagation" />;
      case 'simulator':
        return <WhatIfSimulator />;
      case 'operations':
        return <OperationsDashboard />;
      case 'platform':
        return <PlatformForecast />;
      case 'connection':
        return <ConnectionRisk />;
      case 'replay':
        return <HistoricalReplay />;
      case 'model-performance':
        return <ModelPerformance />;
      case 'monitoring':
        return <ModelMonitoring />;
      case 'pipeline':
      case 'architecture':
        return <DataPipeline />;
      case 'alerts':
        return <AlertCenter />;
      case 'settings':
        return <Settings />;
      default:
        return <PassengerDashboard mode="live" />;
    }
  };

  return (
    <TrainProvider>
      {page === 'landing' ? (
        <Landing
          onPassenger={() => {
            setView('passenger');
            setPage('live-trains');
          }}
          onOperations={() => {
            setView('operations');
            setPage('operations');
          }}
        />
      ) : (
        <div className="flex h-screen bg-[#070B12] overflow-hidden text-[#E2E8F0] font-sans antialiased">
          <Sidebar page={page} setPage={setPage} view={view} />
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <TopBar
              view={view}
              setView={(v) => {
                setView(v);
                setPage(v === 'operations' ? 'operations' : 'live-trains');
              }}
              setPage={setPage}
            />
            <main className="flex-1 overflow-y-auto bg-[#070B12] min-w-0">
              {renderPage()}
            </main>
          </div>
        </div>
      )}
    </TrainProvider>
  );
}
