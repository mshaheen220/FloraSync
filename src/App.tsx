import { useState, useEffect, useCallback, FC, useRef, useMemo } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone, PrintQueueItem, User, GardenProfile, Workspace } from '../types';
import { GardenContext } from './contexts/GardenContext';
import { AppRouter } from './AppRouter';

export type Theme = 'light' | 'dark' | 'system';

export type { User, GardenProfile, Workspace };

export const App: FC = () => {
  const [instances, setInstances] = useState<PlantInstance[]>([]);
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [initialLoadSuccess, setInitialLoadSuccess] = useState<boolean | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('florasync_theme') as Theme) || 'system');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('florasync_token'));
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('florasync_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [gardenProfile, setGardenProfile] = useState<GardenProfile | null>(null);

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

  useEffect(() => {
    if (!currentUser || !token) {
      // On logout, reset all data to prevent flicker of old data on next login
      setInstances([]);
      setArchetypes([]);
      setLocations([]);
      setZones([]);
      setIsDbLoaded(false);
      setGardenProfile(null);
      setInitialLoadSuccess(null);
      setSyncStatus('synced');
      setWorkspaces([]);
      return;
    }

    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    })
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
        
        if (data.user) {
          setCurrentUser(prev => {
            if (!prev || JSON.stringify(prev) !== JSON.stringify(data.user)) {
              localStorage.setItem('florasync_user', JSON.stringify(data.user));
              return data.user;
            }
            return prev;
          });
        }

        setGardenProfile(data.garden || null);
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
        setPrintQueue(data.printQueue || []);
        
        setIsDbLoaded(true);
        setInitialLoadSuccess(true);
        setSyncStatus('synced');

        // Fetch accessible workspaces for the switcher
        fetch(`${apiBase}/api/workspaces`, { headers: { 'Authorization': `Bearer ${token}` } })
          .then(res => res.json())
          .then(wData => {
            if (wData.success) setWorkspaces(wData.workspaces);
          }).catch(err => console.error('Failed to load workspaces:', err));
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
  }, [currentUser, token]);

  useEffect(() => {
    // Only sync back to the server if the initial data load was successful and authenticated.
    if (!isDbLoaded || !currentUser || !token || !initialLoadSuccess) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return; // Skip automatic sync right after initial load
    }

    setSyncStatus('syncing');

    // Debounce the network request by 1.5 seconds to prevent spamming the server
    const syncTimeout = setTimeout(() => {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

      fetch(`${apiBase}/api/state`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ instances, archetypes, locations, zones, printQueue })
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
    }, 1500);

    return () => clearTimeout(syncTimeout);
  }, [instances, archetypes, locations, zones, printQueue, isDbLoaded, currentUser, token, initialLoadSuccess]);

  const handleSwitchGarden = (gardenId: string) => {
    if (!token) return;
    setIsDbLoaded(false); // Triggers the loading screen transition
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state?gardenId=${gardenId}`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        skipNextSync.current = true;
        if (data.user) setCurrentUser(prev => prev ? { ...prev, workspaceRole: data.user.workspaceRole } : data.user);
        setGardenProfile(data.garden || null);
        setInstances(data.instances || []);
        setArchetypes(data.archetypes || []);
        setZones(data.zones || []);
        setLocations(data.locations || []);
        setPrintQueue(data.printQueue || []);
        setIsDbLoaded(true);
        setSyncStatus('synced');
      })
      .catch(err => {
        console.error('Failed to switch garden', err);
        setIsDbLoaded(true);
        setSyncStatus('error');
      });
  };

  const handleLogin = async (username: string, password: string): Promise<void> => {
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    const res = await fetch(`${apiBase}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setToken(data.token);
    const userObj = { ...data.user, name: data.user.name || data.user.username, imageUrl: data.user.imageUrl || '' };
    setCurrentUser(userObj);
    localStorage.setItem('florasync_token', data.token);
    localStorage.setItem('florasync_user', JSON.stringify(userObj));
    
    // Using a simpler approach than navigateTo('/')
    window.history.pushState({ internal: true }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    localStorage.setItem('florasync_user', JSON.stringify(updatedUser));

    if (token) {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
      fetch(`${apiBase}/api/users/${updatedUser.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: updatedUser.name, imageUrl: updatedUser.imageUrl })
      }).catch(err => console.error('Failed to sync profile update:', err));
    }
  };

  const handleUpdateGarden = (name: string, imageUrl: string) => {
    if (!gardenProfile) return;
    const updated = { ...gardenProfile, name, imageUrl };
    setGardenProfile(updated);
    if (token) {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
      fetch(`${apiBase}/api/garden/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, imageUrl })
      }).catch(err => console.error('Failed to sync garden profile update:', err));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('florasync_token');
    localStorage.removeItem('florasync_user');
    window.history.pushState({ internal: true }, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleQueuePrint = useCallback((targetId: string, type: 'plant' | 'location' | 'zone', title: string, subtitle: string, action: 'none' | 'water' | 'feed' = 'none') => {
    setPrintQueue(prev => {
      const existing = prev.find(q => q.targetId === targetId && q.action === action);
      if (existing) {
        return prev.filter(q => q.id !== existing.id);
      }
      return [...prev, {
        id: `pq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        targetId,
        type,
        action,
        title,
        subtitle
      }];
    });
  }, []);

  const handleBatchWater = useCallback((locationId: string) => {
    const now = new Date().toISOString();
    const loc = locations.find(l => l.id === locationId);
    const batchScope = loc ? `the ${loc.name} location` : undefined;
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { 
        ...inst, 
        lastWatered: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Watered',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || '',
          batchScope
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [locations, currentUser]);

  const handleBatchFeed = useCallback((locationId: string) => {
    const now = new Date().toISOString();
    const loc = locations.find(l => l.id === locationId);
    const batchScope = loc ? `the ${loc.name} location` : undefined;
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId ? { 
        ...inst, 
        lastFed: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Fed',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || '',
          batchScope
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [locations, currentUser]);

  const handleBatchWaterZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zone = zones.find(z => z.id === zoneId);
    const batchScope = zone ? `the ${zone.name} zone` : undefined;
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => zoneLocIds.includes(inst.locationId) ? { 
      ...inst, 
      lastWatered: now,
      journal: [{
        id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'Watered',
        authorName: currentUser?.name || '',
        authorImageUrl: currentUser?.imageUrl || '',
        batchScope
      } as any, ...(inst.journal || [])]
    } : inst));
  }, [locations, zones, currentUser]);

  const handleBatchFeedZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zone = zones.find(z => z.id === zoneId);
    const batchScope = zone ? `the ${zone.name} zone` : undefined;
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => zoneLocIds.includes(inst.locationId) ? { 
      ...inst, 
      lastFed: now,
      journal: [{
        id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        activityType: 'Fed',
        authorName: currentUser?.name || '',
        authorImageUrl: currentUser?.imageUrl || '',
        batchScope
      } as any, ...(inst.journal || [])]
    } : inst));
  }, [locations, zones, currentUser]);

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
        authorImageUrl: currentUser?.imageUrl || '',
        batchScope: 'the entire garden'
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
        authorImageUrl: currentUser?.imageUrl || '',
        batchScope: 'the entire garden'
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
    // handleDeleteInstance is called within detail view usually. We can dispatch a popstate.
    window.history.back();
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

  const gardenContextValue = useMemo(() => ({
    instances, archetypes, locations, zones, printQueue, setPrintQueue, currentUser, gardenProfile,
    onWater: handleWater,
    onFeed: handleFeed,
    onRegister: handleRegister,
    onUpdateInstance: handleUpdateInstance,
    onDeleteInstance: handleDeleteInstance,
    onQueuePrint: handleQueuePrint,
    onBatchWaterLocation: handleBatchWater,
    onBatchFeedLocation: handleBatchFeed,
    onBatchWaterZone: handleBatchWaterZone,
    onBatchFeedZone: handleBatchFeedZone,
    onBatchWaterAll: handleBatchWaterAll,
    onBatchFeedAll: handleBatchFeedAll,
    onRegisterLocation: handleRegisterLocation,
    onAddLocation: handleAddLocation,
    onUpdateLocation: handleUpdateLocation,
    onDeleteLocation: handleDeleteLocation,
    onRegisterZone: handleRegisterZone,
    onAddZone: handleAddZone,
    onUpdateZone: handleUpdateZone,
    onDeleteZone: handleDeleteZone,
    onAddArchetype: handleAddArchetype,
    onUpdateArchetype: handleUpdateArchetype,
    onDeleteArchetype: handleDeleteArchetype
  }), [
    instances, archetypes, locations, zones, printQueue, currentUser, gardenProfile,
    handleWater, handleFeed, handleRegister, handleQueuePrint, handleBatchWater,
    handleBatchFeed, handleBatchWaterZone, handleBatchFeedZone, handleBatchWaterAll, handleBatchFeedAll
  ]);

  return (
    <GardenContext.Provider value={gardenContextValue}>
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
      
      <AppRouter 
        currentUser={currentUser}
        token={token}
        isDbLoaded={isDbLoaded}
        initialLoadSuccess={initialLoadSuccess}
        workspaces={workspaces}
        gardenProfile={gardenProfile}
        theme={theme}
        setTheme={setTheme}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSwitchGarden={handleSwitchGarden}
        onUpdateUser={handleUpdateUser}
        onUpdateGarden={handleUpdateGarden}
      />
    </GardenContext.Provider>
  );
};

export default App;
