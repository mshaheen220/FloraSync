import { useState, useEffect, useCallback, FC, useRef } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../types';
import { Dashboard } from './components/Dashboard';
import { PlantDetail } from './components/PlantDetail';
import { Scanner } from './components/Scanner';
import { LocationManager } from './components/LocationManager';
import { ArchetypeManager } from './components/ArchetypeManager';
import { LocationDetail } from './components/LocationDetail';
import { ZoneDetail } from './components/ZoneDetail';
import { NavigationMenu, MenuRoute } from './components/NavigationMenu';
import { LoginScreen } from './components/LoginScreen';

export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  imageUrl?: string;
}

export const App: FC = () => {
  const [instances, setInstances] = useState<PlantInstance[]>([]);
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [initialLoadSuccess, setInitialLoadSuccess] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('florasync_theme') as Theme) || 'system');
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('florasync_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'scanner' | 'locations' | 'archetypes' | 'locationDetail' | 'zoneDetail' | 'settings' | 'zones' | 'inventory'>('dashboard');
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [activeLoc, setActiveLoc] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  const skipNextSync = useRef(false);

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

  // Instantly scroll to the top of the window whenever the view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    if (!currentUser) {
      // On logout, reset all data to prevent flicker of old data on next login
      setInstances([]);
      setArchetypes([]);
      setLocations([]);
      setZones([]);
      setIsDbLoaded(false);
      setInitialLoadSuccess(null);
      setSyncStatus('synced');
      return;
    }

    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state`, { cache: 'no-store' })
      .then(async res => {
        console.log(`[Frontend] Fetch /api/state response: HTTP ${res.status} ${res.statusText}`);
        if (!res.ok) {
          const errBody = await res.text().catch(() => 'no body');
          console.error(`[Frontend] Error body from server:`, errBody);
          throw new Error(`Server responded with HTTP ${res.status}: ${errBody}`);
        }
        const text = await res.text();
        if (!text) return {};
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Invalid JSON from server:', text);
          throw new Error('Invalid JSON payload');
        }
      })
      .then(data => {
        skipNextSync.current = true;
        
        setInstances(data.instances || []);
        setArchetypes(data.archetypes || []);
        
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
        setInitialLoadSuccess(true);
        setSyncStatus('synced');
      })
      .catch(err => {
        console.error('[Frontend] Database connection failed completely. Trace:', err);
        if (err instanceof TypeError) {
          console.error('[Frontend] Note: A TypeError usually means the server is entirely unreachable, or the Vite proxy is failing to forward the request to port 3001.');
        }
        setIsDbLoaded(true);
        setInitialLoadSuccess(false);
        setSyncStatus('error');
      });
  }, [currentUser]);

  useEffect(() => {
    // Only sync back to the server if the initial data load was successful.
    if (!isDbLoaded || !currentUser || !initialLoadSuccess) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return; // Skip automatic sync right after initial load
    }

    setSyncStatus('syncing');
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state`, {
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
  }, [instances, archetypes, locations, zones, isDbLoaded, currentUser, initialLoadSuccess]);

  const syncRoute = useCallback(() => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      setCurrentView('dashboard');
      setActiveQr(null);
      setActiveLoc(null);
      setActiveZone(null);
      setInitialAction(null);
      return;
    }

    const [type, id, action] = parts;
    
    if (type === 'plant' && id) {
      setActiveQr(id);
      setInitialAction(action || null);
      setCurrentView('detail');
    } else if (type === 'location' && id) {
      setActiveLoc(id);
      setInitialAction(action || null);
      setCurrentView('locationDetail');
    } else if (type === 'zone' && id) {
      setActiveZone(decodeURIComponent(id));
      setInitialAction(action || null);
      setCurrentView('zoneDetail');
    } else if (['settings', 'zones', 'locations', 'inventory', 'archetypes', 'scanner'].includes(type)) {
      setCurrentView(type as any);
      setActiveQr(null);
      setActiveLoc(null);
      setActiveZone(null);
      setInitialAction(null);
    } else {
      setCurrentView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (!window.history.state?.internal) {
      window.history.replaceState({ internal: true }, '', window.location.pathname);
    }
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [syncRoute]);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({ internal: true }, '', path);
    syncRoute();
  }, [syncRoute]);

  const handleGoBack = useCallback(() => {
    if (window.history.state?.internal) {
      window.history.back();
    } else {
      navigateTo('/');
    }
  }, [navigateTo]);

  const handleLogin = (name: string) => {
    const userId = name.toLowerCase().replace(/\s+/g, '-');
    const savedUsers = JSON.parse(localStorage.getItem('florasync_users') || '{}');
    const user = savedUsers[userId] || { id: userId, name, imageUrl: '' };
    setCurrentUser(user);
    localStorage.setItem('florasync_user', JSON.stringify(user));
    savedUsers[userId] = user;
    localStorage.setItem('florasync_users', JSON.stringify(savedUsers));
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('florasync_user', JSON.stringify(updatedUser));
    const savedUsers = JSON.parse(localStorage.getItem('florasync_users') || '{}');
    savedUsers[updatedUser.id] = updatedUser;
    localStorage.setItem('florasync_users', JSON.stringify(savedUsers));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('florasync_user');
  };

  const handleBatchWater = useCallback((locationId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { 
        ...inst, 
        lastWatered: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Watered',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [currentUser]);

  const handleBatchFeed = useCallback((locationId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { 
        ...inst, 
        lastFed: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Fed',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [currentUser]);

  const handleBatchWaterZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => zoneLocIds.includes(inst.locationId) ? { 
      ...inst, 
      lastWatered: now,
      journal: [{
        id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'Watered',
        authorName: currentUser?.name || '',
        authorImageUrl: currentUser?.imageUrl || ''
      } as any, ...(inst.journal || [])]
    } : inst));
  }, [locations, currentUser]);

  const handleBatchFeedZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => zoneLocIds.includes(inst.locationId) ? { 
      ...inst, 
      lastFed: now,
      journal: [{
        id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'Fed',
        authorName: currentUser?.name || '',
        authorImageUrl: currentUser?.imageUrl || ''
      } as any, ...(inst.journal || [])]
    } : inst));
  }, [locations, currentUser]);

  const handleBatchWaterAll = useCallback(() => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => ({ 
      ...inst, 
      lastWatered: now,
      journal: [{
        id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'Watered',
        authorName: currentUser?.name || '',
        authorImageUrl: currentUser?.imageUrl || ''
      } as any, ...(inst.journal || [])]
    })));
  }, [currentUser]);

  const handleBatchFeedAll = useCallback(() => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => ({ 
      ...inst, 
      lastFed: now,
      journal: [{
        id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'Fed',
        authorName: currentUser?.name || '',
        authorImageUrl: currentUser?.imageUrl || ''
      } as any, ...(inst.journal || [])]
    })));
  }, [currentUser]);

  const handleWater = useCallback((qrId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.qrId === qrId ? { 
        ...inst, 
        lastWatered: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Watered',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [currentUser]);

  const handleFeed = useCallback((qrId: string) => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.qrId === qrId ? { 
        ...inst, 
        lastFed: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Fed',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [currentUser]);

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
          growthRequirements: 'Unknown',
          lifecycle: 'Unknown'
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
    handleGoBack();
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

  const handleRegisterLocation = (id: string, name: string, zoneId: string) => {
    setLocations(prev => [...prev, { id, name, zoneId }]);
  };

  const handleRegisterZone = (id: string, name: string) => {
    setZones(prev => [...prev, { id, name }]);
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

  const handleNavigate = (qrId: string) => navigateTo(`/plant/${qrId}`);
  const handleNavigateLocation = (locId: string) => navigateTo(`/location/${locId}`);
  const handleNavigateZone = (zoneId: string) => navigateTo(`/zone/${zoneId}`);

  const handleMenuNavigate = (route: MenuRoute) => {
    setIsMenuOpen(false);
    if (route === 'dashboard') {
      navigateTo('/');
    } else {
      navigateTo(`/${route}`);
    }
  };

  const handleScanResult = (qrString: string) => {
    try {
      // By providing the current origin as the base, it seamlessly supports both relative paths and absolute URLs!
      const url = new URL(qrString, window.location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      const [type, id] = parts;
      
      if (['plant', 'location', 'zone'].includes(type) && id) {
        navigateTo(url.pathname);
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
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    if (!isDbLoaded) {
      return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-emerald-800 dark:text-emerald-400 font-medium">Syncing with Greenhouse...</div>;
    }

    if (initialLoadSuccess === false) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Connection Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm leading-relaxed">
            Could not securely connect to the FloraSync database. Your garden data is safe on the server, but cannot be loaded right now.
          </p>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold active:scale-95 transition-all shadow-md">
              Retry Connection
            </button>
            <button onClick={handleLogout} className="bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 px-6 py-2 rounded-xl font-bold active:scale-95 transition-all">
              Log Out
            </button>
          </div>
        </div>
      );
    }

    if (currentView === 'detail' && activeQr) {
      const instance = instances.find(i => i.qrId === activeQr);
      const archetype = instance ? archetypes.find(a => a.id === instance.archetypeId) : undefined;
      const location = instance ? locations.find(l => l.id === instance.locationId) : undefined;
      const zone = location ? zones.find(z => z.id === location.zoneId) : undefined;

      return (
        <PlantDetail qrId={activeQr} initialAction={initialAction} instance={instance} archetype={archetype} archetypes={archetypes} location={location} locations={locations} zone={zone} zones={zones} onWater={handleWater} onFeed={handleFeed} onRegister={handleRegister} onUpdate={handleUpdateInstance} onDelete={handleDeleteInstance} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} onNavigateLocation={handleNavigateLocation} onNavigateZone={handleNavigateZone} currentUser={currentUser || undefined} />
      );
    }

    if (currentView === 'locationDetail' && activeLoc) {
      const location = locations.find(l => l.id === activeLoc);
      const zone = location ? zones.find(z => z.id === location.zoneId) : undefined;
      const locationInstances = instances.filter(i => i.locationId === activeLoc);
      
      return (
        <LocationDetail locationId={activeLoc} initialAction={initialAction} location={location} zone={zone} zones={zones} instances={locationInstances} archetypes={archetypes} onRegisterLocation={handleRegisterLocation} onBatchWater={handleBatchWater} onBatchFeed={handleBatchFeed} onNavigate={handleNavigate} onNavigateZone={handleNavigateZone} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} />
      );
    }

    if (currentView === 'zoneDetail' && activeZone) {
      const zone = zones.find(z => z.id === activeZone);
      const zoneLocations = locations.filter(l => l.zoneId === activeZone);
      const zoneLocIds = zoneLocations.map(l => l.id);
      const zoneInstances = instances.filter(i => zoneLocIds.includes(i.locationId));
      
      return (
        <ZoneDetail zoneId={activeZone} zone={zone} initialAction={initialAction} locations={zoneLocations} instances={zoneInstances} archetypes={archetypes} onRegisterZone={handleRegisterZone} onBatchWaterZone={handleBatchWaterZone} onBatchFeedZone={handleBatchFeedZone} onNavigate={handleNavigate} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} />
      );
    }

    if (currentView === 'scanner') {
      return <Scanner onScan={handleScanResult} onClose={handleGoBack} />
    }

    if (['settings', 'zones', 'locations', 'inventory'].includes(currentView)) {
      return <LocationManager mode={currentView as any} archetypes={archetypes} locations={locations} zones={zones} instances={instances} theme={theme} onThemeChange={setTheme} onAddZone={handleAddZone} onUpdateZone={handleUpdateZone} onDeleteZone={handleDeleteZone} onAdd={handleAddLocation} onUpdate={handleUpdateLocation} onDelete={handleDeleteLocation} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onNavigateLocation={handleNavigateLocation} onNavigateZone={handleNavigateZone} onNavigate={handleNavigate} onRegister={handleRegister} currentUser={currentUser || undefined} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
    }

    if (currentView === 'archetypes') {
      return <ArchetypeManager archetypes={archetypes} instances={instances} onAdd={handleAddArchetype} onUpdate={handleUpdateArchetype} onDelete={handleDeleteArchetype} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} />;
    }

    return (
      <Dashboard 
        instances={instances} 
        archetypes={archetypes} 
        locations={locations} 
        zones={zones} 
        onBatchWater={handleBatchWater} 
        onBatchWaterAll={handleBatchWaterAll}
        onBatchFeedAll={handleBatchFeedAll}
        onBatchWaterZone={handleBatchWaterZone}
        onNavigate={handleNavigate} 
        onOpenScanner={() => navigateTo('/scanner')} 
        onOpenMenu={() => setIsMenuOpen(true)} 
        onNavigateInventory={() => navigateTo('/inventory')} 
        onNavigateZone={handleNavigateZone} 
      />
    );
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