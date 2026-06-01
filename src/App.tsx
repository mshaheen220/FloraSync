import React, { useState, useEffect, useCallback } from 'react';
import { mockArchetypes, mockInstances, mockLocations } from './data/mockData';
import { PlantInstance, PlantArchetype, Location } from './types';
import { Dashboard } from './components/Dashboard';
import { PlantDetail } from './components/PlantDetail';
import { Scanner } from './components/Scanner';
import { LocationManager } from './components/LocationManager';

export type Theme = 'light' | 'dark' | 'system';

export const App: React.FC = () => {
  const [instances, setInstances] = useState<PlantInstance[]>(mockInstances);
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>(mockArchetypes);
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('florasync_theme') as Theme) || 'system');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'scanner' | 'locations'>('dashboard');
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);

  // Theme persistence and OS matching logic
  useEffect(() => {
    localStorage.setItem('florasync_theme', theme);
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data.instances && data.instances.length > 0) setInstances(data.instances);
        if (data.archetypes && data.archetypes.length > 0) setArchetypes(data.archetypes);
        if (data.locations && data.locations.length > 0) setLocations(data.locations);
        setIsDbLoaded(true);
      })
      .catch(err => {
        console.error('Database connection failed, falling back to mock data:', err);
        setIsDbLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!isDbLoaded) return;
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances, archetypes, locations })
    }).catch(err => console.error('Failed to sync state to database:', err));
  }, [instances, archetypes, locations, isDbLoaded]);

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

  const handleFeed = useCallback((qrId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.qrId === qrId ? { ...inst, lastFed: now } : inst
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

  const handleUpdateInstance = (qrId: string, updates: Partial<PlantInstance>) => {
    setInstances(prev => prev.map(inst => inst.qrId === qrId ? { ...inst, ...updates } : inst));
  };

  const handleDeleteInstance = (qrId: string) => {
    setInstances(prev => prev.filter(inst => inst.qrId !== qrId));
    handleGoHome();
  };

  const handleAddLocation = (name: string, zone: string) => {
    const newId = `loc-${Date.now()}`;
    setLocations(prev => [...prev, { id: newId, name, zone }]);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
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

  if (!isDbLoaded) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-800 font-medium">Syncing with Greenhouse...</div>;
  }

  if (currentView === 'detail' && activeQr) {
    const instance = instances.find(i => i.qrId === activeQr);
    const archetype = instance ? archetypes.find(a => a.id === instance.archetypeId) : undefined;
    const location = instance ? locations.find(l => l.id === instance.locationId) : undefined;

    return (
      <PlantDetail qrId={activeQr} initialAction={initialAction} instance={instance} archetype={archetype} location={location} locations={locations} onWater={handleWater} onFeed={handleFeed} onRegister={handleRegister} onUpdate={handleUpdateInstance} onDelete={handleDeleteInstance} onGoHome={handleGoHome} onClearAction={handleClearAction} />
    );
  }

  if (currentView === 'scanner') {
    return <Scanner onScan={handleScanResult} onClose={handleGoHome} />;
  }

  if (currentView === 'locations') {
    return <LocationManager locations={locations} instances={instances} theme={theme} onThemeChange={setTheme} onAdd={handleAddLocation} onDelete={handleDeleteLocation} onGoHome={handleGoHome} />;
  }

  return <Dashboard instances={instances} archetypes={archetypes} locations={locations} onBatchWater={handleBatchWater} onNavigate={handleNavigate} onOpenScanner={() => setCurrentView('scanner')} onManageLocations={() => setCurrentView('locations')} />;
};

export default App;