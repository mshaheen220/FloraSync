import { FC, useMemo } from 'react';
import { User, GardenProfile, Workspace } from '../types';
import { GardenContext } from './contexts/GardenContext';
import { AppRouter } from './AppRouter';

import { useTheme, Theme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useGardenState } from './hooks/useGardenState';
import { useGardenSync } from './hooks/useGardenSync';

export type { Theme, User, GardenProfile, Workspace };

export const App: FC = () => {
  const { theme, setTheme } = useTheme();
  
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
    gardenState.printQueue, gardenState.setPrintQueue
  );

  const gardenContextValue = useMemo(() => ({
    instances: gardenState.instances,
    archetypes: gardenState.archetypes,
    locations: gardenState.locations,
    zones: gardenState.zones,
    printQueue: gardenState.printQueue,
    setPrintQueue: gardenState.setPrintQueue,
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
        setTheme={setTheme}
        onLogin={auth.handleLogin}
        onLogout={auth.handleLogout}
        onSwitchGarden={sync.handleSwitchGarden}
        onUpdateUser={auth.handleUpdateUser}
        onUpdateGarden={sync.handleUpdateGarden}
      />
    </GardenContext.Provider>
  );
};

export default App;
