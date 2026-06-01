import { useState, useEffect, useCallback, FC } from 'react';
import { mockArchetypes, mockInstances, mockLocations } from './src/data/mockData';
import { PlantInstance, PlantArchetype } from './src/types';
import { Dashboard } from './src/components/Dashboard';
import { PlantDetail } from './src/components/PlantDetail';
import { Scanner } from './src/components/Scanner';

export const App: FC = () => {
  const [instances, setInstances] = useState<PlantInstance[]>(() => {
    const saved = localStorage.getItem('flora_instances');
    return saved ? JSON.parse(saved) : mockInstances;
  });
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>(() => {
    const saved = localStorage.getItem('flora_archetypes');
    return saved ? JSON.parse(saved) : mockArchetypes;
  });
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'scanner'>('dashboard');
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('flora_instances', JSON.stringify(instances));
  }, [instances]);

  useEffect(() => {
    localStorage.setItem('flora_archetypes', JSON.stringify(archetypes));
  }, [archetypes]);

  // Router mimicking layer: Extracts specific URL query contexts to determine view execution
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qrParam = params.get('qr');
    const actionParam = params.get('action');

    if (qrParam) {
      setActiveQr(qrParam);
      setInitialAction(actionParam);
      setCurrentView('detail');
    }
  }, []);

  const handleBatchWater = (locationId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { ...inst, lastWatered: now } : inst
    ));
  };

  const handleWater = useCallback((qrId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.qrId === qrId ? { ...inst, lastWatered: now } : inst
    ));
  }, []);

  const handleClearAction = useCallback(() => {
    setInitialAction(null);
  }, []);

  const handleRegister = (qrId: string, name: string) => {
    // Mock external architectural fetch and ID sanitization
    const newArchetypeId = name.toLowerCase().replace(/\s+/g, '-');
    const newArchetype: PlantArchetype = {
      id: newArchetypeId,
      commonName: name,
      sunRequirement: 'Full Sun', // In a production app, this fetches from OpenFarm API
      waterIntervalDays: 4,
      feedingIntervalDays: 14,
      pruningTips: 'Trim baseline leaves to improve airflow.',
    };

    setArchetypes(prev => [...prev, newArchetype]);

    const newInstance: PlantInstance = {
      qrId,
      archetypeId: newArchetypeId,
      locationId: 'greenhouse-shelf-a', // Automatically pre-mapped using ID tag ranges
      datePlanted: new Date().toISOString(),
      lastWatered: new Date().toISOString(),
      lastFed: new Date().toISOString(),
    };

    setInstances(prev => [...prev, newInstance]);
  };

  const handleNavigate = (qrId: string) => {
    setActiveQr(qrId);
    setInitialAction(null);
    setCurrentView('detail');
    window.history.pushState({}, '', `/?qr=${qrId}`);
  };

  const handleGoHome = () => {
    setCurrentView('dashboard');
    setActiveQr(null);
    setInitialAction(null);
    window.history.pushState({}, '', `/`);
  };

  const handleScanResult = (qrString: string) => {
    // If the scanned string is a full URL (e.g. from physical printout), extract the query params
    try {
      const url = new URL(qrString);
      const qrParam = url.searchParams.get('qr');
      if (qrParam) {
        handleNavigate(qrParam);
        return;
      }
    } catch (e) {
      // Ignore error; it's likely just a raw string like "qr-001"
    }
    // Fallback: assume raw text ID
    handleNavigate(qrString);
  };

  if (currentView === 'detail' && activeQr) {
    const instance = instances.find(i => i.qrId === activeQr);
    const archetype = instance ? archetypes.find(a => a.id === instance.archetypeId) : undefined;
    const location = instance ? mockLocations.find(l => l.id === instance.locationId) : undefined;

    return (
      <PlantDetail qrId={activeQr} initialAction={initialAction} instance={instance} archetype={archetype} location={location} onWater={handleWater} onRegister={handleRegister} onGoHome={handleGoHome} onClearAction={handleClearAction} />
    );
  }

  if (currentView === 'scanner') {
    return <Scanner onScan={handleScanResult} onClose={handleGoHome} />;
  }

  return <Dashboard instances={instances} archetypes={archetypes} locations={mockLocations} onBatchWater={handleBatchWater} onNavigate={handleNavigate} onOpenScanner={() => setCurrentView('scanner')} />;
};

export default App;