import { FC, useMemo, useState, useEffect, useRef } from 'react';
import { User, GardenProfile, Workspace } from '../types';
import { GardenContext } from './contexts/GardenContext';
import { AppRouter } from './AppRouter';

import { useTheme, Theme, ColorTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useGardenState } from './hooks/useGardenState';
import { useGardenSync } from './hooks/useGardenSync';

export type { Theme, User, GardenProfile, Workspace };

export const App: FC = () => {
  const { theme, setTheme, colorTheme, setColorTheme } = useTheme();
  
  const auth = useAuth();
  
  const gardenState = useGardenState(auth.currentUser);
  
  const sync = useGardenSync(
    auth.token,
    auth.currentUser,
    auth.setCurrentUser,
    gardenState.instances, gardenState.setInstances,
    gardenState.archetypes, gardenState.setArchetypes,
    gardenState.locations, gardenState.setLocations,
    gardenState.zones, gardenState.setZones,
    gardenState.printQueue, gardenState.setPrintQueue,
    gardenState.gardenJournal, gardenState.setGardenJournal
  );

  // Track the active icon theme and persist it between sessions
  const [iconTheme, setIconTheme] = useState<'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji'>(() => {
    return (localStorage.getItem('florasync_icon_theme') as 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji') || 'default';
  });

  // Track the ID of the currently synced user to prevent aggressive mid-session overwrites
  const syncedUserId = useRef<string | null>(null);

  // Sync themes from the user profile exactly ONCE per session, after the fresh state is fully loaded
  useEffect(() => {
    if (auth.currentUser && sync.isDbLoaded) {
      if (syncedUserId.current !== auth.currentUser.id) {
        const user = auth.currentUser as any;
        
        const targetTheme = user.theme || 'system';
        const targetColorTheme = user.colorTheme || 'default';
        const targetIconTheme = user.iconTheme || 'default';

        setTheme(targetTheme);
        setColorTheme(targetColorTheme);
        setIconTheme(targetIconTheme);
        localStorage.setItem('florasync_icon_theme', targetIconTheme);
        
        syncedUserId.current = auth.currentUser.id;
      }
    } else if (!auth.currentUser) {
      // Reset to defaults on logout so settings don't bleed over to the next user
      if (syncedUserId.current !== null) {
        setTheme('system');
        setColorTheme('default');
        setIconTheme('default');
        localStorage.setItem('florasync_icon_theme', 'default');
        syncedUserId.current = null;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.currentUser, sync.isDbLoaded]);

  // Directly sync themes to the backend to bypass any strict-typing strippers in useAuth
  const syncThemeToBackend = (updates: any) => {
    if (!auth.currentUser || !auth.token) return;
    
    auth.setCurrentUser(prev => prev ? { ...prev, ...updates } : prev);
    
    const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
    
    fetch(`${apiBase}/api/users/${auth.currentUser.id}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
      body: JSON.stringify(updates)
    }).catch(err => console.error('Failed to sync theme to server:', err));
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    if (auth.currentUser && (auth.currentUser as any).theme !== newTheme) {
      syncThemeToBackend({ theme: newTheme });
    }
  };

  const handleColorThemeChange = (newTheme: ColorTheme) => {
    setColorTheme(newTheme);
    if (auth.currentUser && (auth.currentUser as any).colorTheme !== newTheme) {
      syncThemeToBackend({ colorTheme: newTheme });
    }
  };

  const handleIconThemeChange = (newTheme: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji') => {
    setIconTheme(newTheme);
    localStorage.setItem('florasync_icon_theme', newTheme);
    if (auth.currentUser && (auth.currentUser as any).iconTheme !== newTheme) {
      syncThemeToBackend({ iconTheme: newTheme });
    }
  };

  const handleLogRain = async () => {
    if (!auth.token) return 0;
    try {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';
      
      const res = await fetch(`${apiBase}/api/gardens/action/rain`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Instantly update the local React state so the UI reflects the rain!
        gardenState.setInstances(data.instances);
        gardenState.setGardenJournal(data.journal);
        return data.wateredCount;
      }
    } catch (err) {
      console.error('Error logging rain:', err);
    }
    return 0;
  };

  const gardenContextValue = useMemo(() => ({
    instances: gardenState.instances,
    archetypes: gardenState.archetypes,
    locations: gardenState.locations,
    zones: gardenState.zones,
    printQueue: gardenState.printQueue,
    setPrintQueue: gardenState.setPrintQueue,
    gardenJournal: gardenState.gardenJournal,
    setGardenJournal: gardenState.setGardenJournal,
    currentUser: auth.currentUser,
    gardenProfile: sync.gardenProfile,
    
    onWater: gardenState.handleWater,
    onFeed: gardenState.handleFeed,
    onRegister: gardenState.handleRegister,
    onUpdateInstance: gardenState.handleUpdateInstance,
    onDeleteInstance: gardenState.handleDeleteInstance,
    onQueuePrint: gardenState.handleQueuePrint,
    
    onBatchWaterLocation: gardenState.handleBatchWater,
    onBatchFeedLocation: gardenState.handleBatchFeed,
    onBatchWaterZone: gardenState.handleBatchWaterZone,
    onBatchFeedZone: gardenState.handleBatchFeedZone,
    onBatchWaterAll: gardenState.handleBatchWaterAll,
    onBatchFeedAll: gardenState.handleBatchFeedAll,
    onLogRain: handleLogRain,
    
    onRegisterLocation: gardenState.handleRegisterLocation,
    onAddLocation: gardenState.handleAddLocation,
    onUpdateLocation: gardenState.handleUpdateLocation,
    onDeleteLocation: gardenState.handleDeleteLocation,
    
    onRegisterZone: gardenState.handleRegisterZone,
    onAddZone: gardenState.handleAddZone,
    onUpdateZone: gardenState.handleUpdateZone,
    onDeleteZone: gardenState.handleDeleteZone,
    
    onAddArchetype: gardenState.handleAddArchetype,
    onUpdateArchetype: gardenState.handleUpdateArchetype,
    onDeleteArchetype: gardenState.handleDeleteArchetype
  }), [gardenState, auth.currentUser, sync.gardenProfile]);

  return (
    <GardenContext.Provider value={gardenContextValue}>
      {sync.syncStatus === 'syncing' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold z-50 animate-pulse shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div> Syncing to server...
        </div>
      )}
      {sync.syncStatus === 'error' && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold z-50 shadow-lg">
          ⚠️ Sync Failed! Check connection.
        </div>
      )}
      
      <AppRouter 
        currentUser={auth.currentUser}
        token={auth.token}
        isDbLoaded={sync.isDbLoaded}
        initialLoadSuccess={sync.initialLoadSuccess}
        workspaces={sync.workspaces}
        gardenProfile={sync.gardenProfile}
        theme={theme}
        colorTheme={colorTheme}
        setTheme={handleThemeChange}
        setColorTheme={handleColorThemeChange}
        onLogin={auth.handleLogin}
        onLogout={auth.handleLogout}
        onSwitchGarden={sync.handleSwitchGarden}
        onUpdateUser={auth.handleUpdateUser}
        onUpdateGarden={sync.handleUpdateGarden}
        iconTheme={iconTheme}
        onIconThemeChange={handleIconThemeChange}
      />
    </GardenContext.Provider>
  );
};

export default App;
