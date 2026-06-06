import { useState, useEffect, useCallback, FC, useRef } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../types';
import { Dashboard } from './components/core/Dashboard';
import { PlantDetail } from './components/inventory/PlantDetail';
import { Scanner } from './components/common/Scanner';
import { LocationManager } from './components/spaces/LocationManager';
import { ArchetypeManager } from './components/dictionary/ArchetypeManager';
import { ZoneManager } from './components/spaces/ZoneManager';
import { SettingsManager } from './components/core/SettingsManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { LocationDetail } from './components/spaces/LocationDetail';
import { ZoneDetail } from './components/spaces/ZoneDetail';
import { NavigationMenu, MenuRoute } from './components/common/NavigationMenu';
import { LoginScreen } from './components/core/LoginScreen';
import { HelpCenter } from './components/core/HelpCenter';
import { PrintCenter } from './components/core/settings/PrintCenter';
import { FAB } from './styles/StyledElements';

export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  username: string;
  role?: string;
  name: string;
  imageUrl?: string;
  accesses?: { id: string, name: string, role: string }[];
  workspaceRole?: string;
}

export interface GardenProfile {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  imageUrl?: string;
  role: string;
}

export const App: FC = () => {
  const [instances, setInstances] = useState<PlantInstance[]>([]);
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
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

  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'scanner' | 'locations' | 'archetypes' | 'locationDetail' | 'zoneDetail' | 'settings' | 'zones' | 'inventory' | 'help' | 'print'>('dashboard');
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [activeLoc, setActiveLoc] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
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
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

    fetch(`${apiBase}/api/state`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
  }, [instances, archetypes, locations, zones, isDbLoaded, currentUser, token, initialLoadSuccess]);

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
    } else if (['settings', 'zones', 'locations', 'inventory', 'archetypes', 'scanner', 'help', 'print'].includes(type)) {
      setCurrentView(type as any);
      setActiveQr(null);
      setActiveLoc(null);
      setActiveZone(null);
      setInitialAction(null);
    } else {
      setCurrentView('dashboard');
    }
  }, []);

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
        setIsDbLoaded(true);
        setSyncStatus('synced');
      })
      .catch(err => {
        console.error('Failed to switch garden', err);
        setIsDbLoaded(true);
        setSyncStatus('error');
      });
  };

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
    navigateTo('/');
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
    navigateTo('/');
  };

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

  const handleOpenWorkspaceMenu = workspaces.length > 1 ? () => setIsWorkspaceMenuOpen(true) : undefined;

  const renderView = () => {
    if (!currentUser || !token) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    if (!isDbLoaded) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-emerald-800 dark:text-emerald-400 font-medium">
          <img src='./images/icons/loader.apng.png' alt="FloraSync Loading Spinner" className="w-16 h-16 mb-4" />
          Syncing with Greenhouse...
        </div>
      );
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
        <LocationDetail locationId={activeLoc} initialAction={initialAction} location={location} zone={zone} zones={zones} instances={locationInstances} archetypes={archetypes} onRegisterLocation={handleRegisterLocation} onBatchWater={handleBatchWater} onBatchFeed={handleBatchFeed} onNavigate={handleNavigate} onNavigateZone={handleNavigateZone} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} currentUser={currentUser || undefined} />
      );
    }

    if (currentView === 'zoneDetail' && activeZone) {
      const zone = zones.find(z => z.id === activeZone);
      const zoneLocations = locations.filter(l => l.zoneId === activeZone);
      const zoneLocIds = zoneLocations.map(l => l.id);
      const zoneInstances = instances.filter(i => zoneLocIds.includes(i.locationId));
      
      return (
        <ZoneDetail zoneId={activeZone} zone={zone} initialAction={initialAction} locations={zoneLocations} instances={zoneInstances} archetypes={archetypes} onRegisterZone={handleRegisterZone} onUpdateZone={handleUpdateZone} onBatchWaterZone={handleBatchWaterZone} onBatchFeedZone={handleBatchFeedZone} onNavigate={handleNavigate} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} currentUser={currentUser || undefined} />
      );
    }

    if (currentView === 'scanner') {
      return <Scanner onScan={handleScanResult} onClose={handleGoBack} />
    }

    if (currentView === 'zones') {
      return <ZoneManager gardenName={gardenProfile?.name || 'FloraSync'} currentUser={currentUser} zones={zones} locations={locations} onAddZone={handleAddZone} onUpdateZone={handleUpdateZone} onDeleteZone={handleDeleteZone} onNavigateZone={handleNavigateZone} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'inventory') {
      return <InventoryManager gardenName={gardenProfile?.name || 'FloraSync'} currentUser={currentUser} instances={instances} archetypes={archetypes} locations={locations} zones={zones} onRegister={handleRegister} onNavigate={handleNavigate} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'settings') {
      return <SettingsManager theme={theme} onThemeChange={setTheme} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} currentUser={currentUser || undefined} onUpdateUser={handleUpdateUser} gardenProfile={gardenProfile} onUpdateGarden={handleUpdateGarden} onLogout={handleLogout} token={token} />;
    }

    if (currentView === 'locations') {
      return <LocationManager gardenName={gardenProfile?.name || 'FloraSync'} currentUser={currentUser} locations={locations} zones={zones} instances={instances} onAdd={handleAddLocation} onUpdate={handleUpdateLocation} onDelete={handleDeleteLocation} onOpenMenu={() => setIsMenuOpen(true)} onNavigateLocation={handleNavigateLocation} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'archetypes') {
      return <ArchetypeManager gardenName={gardenProfile?.name || 'FloraSync'} currentUser={currentUser} archetypes={archetypes} instances={instances} onAdd={handleAddArchetype} onUpdate={handleUpdateArchetype} onDelete={handleDeleteArchetype} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'help') {
      return <HelpCenter gardenProfile={gardenProfile} currentUser={currentUser} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'print') {
      const isAdminOrOwner = currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner';
      if (isAdminOrOwner) {
        return <PrintCenter gardenProfile={gardenProfile} instances={instances} archetypes={archetypes} locations={locations} zones={zones} token={token} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
      }
    }

    return (
      <Dashboard 
        gardenProfile={gardenProfile}
        currentUser={currentUser}
        instances={instances} 
        archetypes={archetypes} 
        locations={locations} 
        zones={zones} 
        onBatchWater={handleBatchWater} 
        onBatchWaterAll={handleBatchWaterAll}
        onBatchFeedAll={handleBatchFeedAll}
        onBatchWaterZone={handleBatchWaterZone}
        onNavigate={handleNavigate} 
        onOpenMenu={() => setIsMenuOpen(true)} 
        onNavigateInventory={() => navigateTo('/inventory')} 
        onNavigateZone={handleNavigateZone} 
        onNavigateLocation={handleNavigateLocation}
        onOpenWorkspaceMenu={handleOpenWorkspaceMenu}
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
        currentUser={currentUser}
      />
      {isWorkspaceMenuOpen && workspaces && workspaces.length > 1 && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsWorkspaceMenuOpen(false)}
        >
          <div 
            className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Switch Garden</h3>
              <button 
                onClick={() => setIsWorkspaceMenuOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold leading-none p-2 -mr-2"
              >✕</button>
            </div>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {workspaces.map(ws => (
                <button 
                  key={ws.id}
                  onClick={() => { setIsWorkspaceMenuOpen(false); if (ws.id !== gardenProfile?.id) handleSwitchGarden(ws.id); }}
                  className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] border-2 ${ws.id === gardenProfile?.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800'}`}
                >
                  {ws.imageUrl ? (<img src={ws.imageUrl} alt={ws.name} className="w-12 h-12 rounded-xl object-cover" />) : (<div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-xl">🏡</div>)}
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mb-0.5">{ws.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ws.role}</div>
                  </div>
                  {ws.id === gardenProfile?.id && <span className="text-emerald-500 text-xl font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {renderView()}
      {currentUser && token && isDbLoaded && initialLoadSuccess === true && currentView !== 'scanner' && (
        <FAB onClick={() => navigateTo('/scanner')}>
          📷
        </FAB>
      )}
    </>
  );
};

export default App;
