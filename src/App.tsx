import { useState, useEffect, useCallback, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../types';
import { Dashboard } from './components/Dashboard';
import { PlantDetail } from './components/PlantDetail';
import { Scanner } from './components/Scanner';
import { LocationManager } from './components/LocationManager';
import { ArchetypeManager } from './components/ArchetypeManager';
import { LocationDetail } from './components/LocationDetail';
import { ZoneDetail } from './components/ZoneDetail';
import { NavigationMenu, MenuRoute } from './components/NavigationMenu';

export type Theme = 'light' | 'dark' | 'system';

export const App: FC = () => {
  const [instances, setInstances] = useState<PlantInstance[]>([]);
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('florasync_theme') as Theme) || 'system');
  
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'scanner' | 'locations' | 'archetypes' | 'locationDetail' | 'zoneDetail' | 'settings' | 'zones' | 'inventory'>('dashboard');
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [activeLoc, setActiveLoc] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

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
    fetch('/api/state', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.instances && data.instances.length > 0) setInstances(data.instances);
        if (data.archetypes && data.archetypes.length > 0) setArchetypes(data.archetypes);
        
        let loadedZones: Zone[] = data.zones || [];
        let loadedLocations: Location[] = data.locations || [];

        // JIT Data Migration: Convert old text-based zones into fully relational Zone entities!
        loadedLocations = loadedLocations.map((loc: any) => {
          if (loc.zone && !loc.zoneId) {
            let existingZone = loadedZones.find((z) => z.name === loc.zone);
            if (!existingZone) {
              existingZone = { id: `zn-${Date.now()}-${Math.floor(Math.random()*1000)}`, name: loc.zone };
              loadedZones.push(existingZone);
            }
            loc.zoneId = existingZone.id;
            delete loc.zone; // Clean up old property
          }
          return loc;
        });

        setZones(loadedZones);
        setLocations(loadedLocations);
        
        setIsDbLoaded(true);
      })
      .catch(err => {
        console.error('Database connection failed, falling back to mock data:', err);
        setIsDbLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!isDbLoaded) return;
    setSyncStatus('syncing');
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instances, archetypes, locations, zones })
    })
    .then(res => {
      if (!res.ok) {
        console.error(`Server rejected state sync: HTTP ${res.status}`);
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    })
    .catch(err => { console.error('Failed to sync state to database:', err); setSyncStatus('error'); });
  }, [instances, archetypes, locations, zones, isDbLoaded]);

  // Router mimicking layer: Extracts specific URL query contexts to determine view execution
  useEffect(() => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean); // e.g. ['plant', 'qr-001', 'water']
    
    if (parts.length > 0) {
      const [type, id, action] = parts;
      if (type === 'plant') {
        setActiveQr(id);
        setInitialAction(action || null);
        setCurrentView('detail');
      } else if (type === 'location') {
        setActiveLoc(id);
        setInitialAction(action || null);
        setCurrentView('locationDetail');
      } else if (type === 'zone') {
        setActiveZone(decodeURIComponent(id));
        setInitialAction(action || null);
        setCurrentView('zoneDetail');
      }
    }
  }, []);

  const handleBatchWater = useCallback((locationId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { ...inst, lastWatered: now } : inst
    ));
  }, []);

  const handleBatchFeed = useCallback((locationId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { ...inst, lastFed: now } : inst
    ));
  }, []);

  const handleBatchWaterZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => zoneLocIds.includes(inst.locationId) ? { ...inst, lastWatered: now } : inst));
  }, [locations]);

  const handleBatchFeedZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => zoneLocIds.includes(inst.locationId) ? { ...inst, lastFed: now } : inst));
  }, [locations]);

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

  const handleRegister = (qrId: string, identifier: string, isNew: boolean, locationIdentifier: string, isNewLocation: boolean = false, zoneIdentifier: string = '', isNewZone: boolean = false, imageUrl: string = '') => {
    let targetArchetypeId = identifier;

    if (isNew) {
      // Check if it already exists by name just in case they typed an exact match
      const existing = archetypes.find(a => a.commonName.toLowerCase() === identifier.toLowerCase());
      if (existing) {
        targetArchetypeId = existing.id;
      } else {
        targetArchetypeId = identifier.toLowerCase().replace(/\s+/g, '-');
        const newArchetype: PlantArchetype = {
          id: targetArchetypeId,
          commonName: identifier,
          scientificName: 'Unknown',
          category: 'Uncategorized',
          sunRequirement: 'Full Sun',
          waterIntervalDays: 4,
          feedingIntervalDays: 14,
          whatToFeed: 'Balanced fertilizer',
          pruningTips: 'Trim baseline leaves to improve airflow.',
          flavorProfile: 'Unknown',
          companionPlants: [],
          combativePlants: [],
          growthHabit: 'Unknown',
          daysToHarvest: 0,
          imageUrl: imageUrl || '',
          whenToPlant: 'Unknown',
          whenToHarvest: 'Unknown',
          usesForLargeHarvests: 'Unknown',
          hardinessZones: [],
          hardinessNote: '',
          plantingInstructions: 'Unknown',
          growthRequirements: 'Unknown'
        };
        setArchetypes(prev => [...prev, newArchetype]);
      }
    }

    let finalZoneId = zoneIdentifier;
    if (isNewZone) {
      finalZoneId = `zn-${Date.now()}`;
      setZones(prev => [...prev, { id: finalZoneId, name: zoneIdentifier }]);
    }

    let finalLocationId = locationIdentifier;
    if (isNewLocation) {
      finalLocationId = `loc-${Date.now()}`;
      setLocations(prev => [...prev, { id: finalLocationId, name: locationIdentifier, zoneId: finalZoneId }]);
    }

    const newInstance: PlantInstance = {
      qrId,
      archetypeId: targetArchetypeId,
      locationId: finalLocationId,
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

  const handleUpdateArchetype = (id: string, updates: Partial<PlantArchetype>) => {
    setArchetypes(prev => prev.map(arch => arch.id === id ? { ...arch, ...updates } : arch));
  };

  const handleDeleteArchetype = (id: string) => {
    setArchetypes(prev => prev.filter(arch => arch.id !== id));
  };

  const handleAddArchetype = (newArchetype: PlantArchetype) => {
    setArchetypes(prev => [...prev, newArchetype]);
  };

  const handleAddZone = (name: string) => {
    const newId = `zn-${Date.now()}`;
    setZones(prev => [...prev, { id: newId, name }]);
  };

  const handleUpdateZone = (id: string, updates: Partial<Zone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const handleDeleteZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  };

  const handleAddLocation = (name: string, zoneId: string) => {
    const newId = `loc-${Date.now()}`;
    setLocations(prev => [...prev, { id: newId, name, zoneId }]);
  };

  const handleUpdateLocation = (id: string, updates: Partial<Location>) => {
    setLocations(prev => prev.map(loc => loc.id === id ? { ...loc, ...updates } : loc));
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id));
  };

  const handleNavigate = (qrId: string) => {
    setActiveQr(qrId);
    setInitialAction(null);
    setCurrentView('detail');
    window.history.pushState({}, '', `/plant/${qrId}`);
  };

  const handleNavigateLocation = (locId: string) => {
    setActiveLoc(locId);
    setInitialAction(null);
    setCurrentView('locationDetail');
    window.history.pushState({}, '', `/location/${locId}`);
  };

  const handleNavigateZone = (zoneId: string) => {
    setActiveZone(zoneId);
    setInitialAction(null);
    setCurrentView('zoneDetail');
    window.history.pushState({}, '', `/zone/${zoneId}`);
  };

  const handleGoHome = () => {
    setCurrentView('dashboard');
    setActiveQr(null);
    setActiveLoc(null);
    setActiveZone(null);
    setInitialAction(null);
    window.history.pushState({}, '', `/`);
  };

  const handleMenuNavigate = (route: MenuRoute) => {
    setIsMenuOpen(false);
    if (route === 'dashboard') {
      handleGoHome();
    } else {
      setCurrentView(route);
    }
  };

  const handleScanResult = (qrString: string) => {
    try {
      // By providing the current origin as the base, it seamlessly supports both relative paths and absolute URLs!
      const url = new URL(qrString, window.location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      const [type, id, action] = parts;
      
      if (type === 'plant' && id) {
        setActiveQr(id);
        setInitialAction(action || null);
        setCurrentView('detail');
        window.history.pushState({}, '', url.pathname);
        return;
      } else if (type === 'location' && id) {
        setActiveLoc(id);
        setInitialAction(action || null);
        setCurrentView('locationDetail');
        window.history.pushState({}, '', url.pathname);
        return;
      } else if (type === 'zone' && id) {
        setActiveZone(decodeURIComponent(id));
        setInitialAction(action || null);
        setCurrentView('zoneDetail');
        window.history.pushState({}, '', url.pathname);
        return;
      }
    } catch (e) {
      // Fallback below
    }
    
    // Fallback: Check if the scanned string matches a Location ID first, else assume it's a Plant Instance QR
    if (locations.some(l => l.id === qrString)) {
      handleNavigateLocation(qrString);
    } else {
      handleNavigate(qrString);
    }
  };

  const renderView = () => {
    if (!isDbLoaded) {
      return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-emerald-800 font-medium">Syncing with Greenhouse...</div>;
    }

    if (currentView === 'detail' && activeQr) {
      const instance = instances.find(i => i.qrId === activeQr);
      const archetype = instance ? archetypes.find(a => a.id === instance.archetypeId) : undefined;
      const location = instance ? locations.find(l => l.id === instance.locationId) : undefined;
      const zone = location ? zones.find(z => z.id === location.zoneId) : undefined;

      return (
        <PlantDetail qrId={activeQr} initialAction={initialAction} instance={instance} archetype={archetype} archetypes={archetypes} location={location} locations={locations} zone={zone} zones={zones} onWater={handleWater} onFeed={handleFeed} onRegister={handleRegister} onUpdate={handleUpdateInstance} onDelete={handleDeleteInstance} onGoHome={handleGoHome} onClearAction={handleClearAction} onNavigateLocation={handleNavigateLocation} onNavigateZone={handleNavigateZone} />
      );
    }

    if (currentView === 'locationDetail' && activeLoc) {
      const location = locations.find(l => l.id === activeLoc);
      const zone = location ? zones.find(z => z.id === location.zoneId) : undefined;
      const locationInstances = instances.filter(i => i.locationId === activeLoc);
      
      return (
        <LocationDetail locationId={activeLoc} initialAction={initialAction} location={location} zone={zone} instances={locationInstances} archetypes={archetypes} onBatchWater={handleBatchWater} onBatchFeed={handleBatchFeed} onNavigate={handleNavigate} onNavigateZone={handleNavigateZone} onGoHome={handleGoHome} onClearAction={handleClearAction} />
      );
    }

    if (currentView === 'zoneDetail' && activeZone) {
      const zone = zones.find(z => z.id === activeZone);
      const zoneLocations = locations.filter(l => l.zoneId === activeZone);
      const zoneLocIds = zoneLocations.map(l => l.id);
      const zoneInstances = instances.filter(i => zoneLocIds.includes(i.locationId));
      
      return (
        <ZoneDetail zone={zone} initialAction={initialAction} locations={zoneLocations} instances={zoneInstances} archetypes={archetypes} onBatchWaterZone={handleBatchWaterZone} onBatchFeedZone={handleBatchFeedZone} onNavigate={handleNavigate} onGoHome={handleGoHome} onClearAction={handleClearAction} />
      );
    }

    if (currentView === 'scanner') {
      return <Scanner onScan={handleScanResult} onClose={handleGoHome} />
    }

    if (['settings', 'zones', 'locations', 'inventory'].includes(currentView)) {
      return <LocationManager mode={currentView as any} archetypes={archetypes} locations={locations} zones={zones} instances={instances} theme={theme} onThemeChange={setTheme} onAddZone={handleAddZone} onUpdateZone={handleUpdateZone} onDeleteZone={handleDeleteZone} onAdd={handleAddLocation} onUpdate={handleUpdateLocation} onDelete={handleDeleteLocation} onManageArchetypes={() => setCurrentView('archetypes')} onGoHome={handleGoHome} onNavigateLocation={handleNavigateLocation} onNavigateZone={handleNavigateZone} onNavigate={handleNavigate} onRegister={handleRegister} />;
    }

    if (currentView === 'archetypes') {
      return <ArchetypeManager archetypes={archetypes} instances={instances} onAdd={handleAddArchetype} onUpdate={handleUpdateArchetype} onDelete={handleDeleteArchetype} onGoBack={handleGoHome} />;
    }

    return <Dashboard instances={instances} archetypes={archetypes} locations={locations} zones={zones} onBatchWater={handleBatchWater} onNavigate={handleNavigate} onOpenScanner={() => setCurrentView('scanner')} onOpenMenu={() => setIsMenuOpen(true)} />;
  };

  return (
    <>
      {syncStatus === 'syncing' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold z-50 animate-pulse shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div> Syncing to server...
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold z-50 shadow-lg">
          ⚠️ Sync Failed! Check connection.
        </div>
      )}
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={handleMenuNavigate} 
      />
      {renderView()}
    </>
  );
};

export default App;