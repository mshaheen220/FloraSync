import { useState, useCallback } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone, PrintQueueItem, User, JournalEntry } from '../../types';

export function useGardenState(currentUser: User | null) {
  const [instances, setInstances] = useState<PlantInstance[]>([]);
  const [archetypes, setArchetypes] = useState<PlantArchetype[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [printQueue, setPrintQueue] = useState<PrintQueueItem[]>([]);
  const [gardenJournal, setGardenJournal] = useState<JournalEntry[]>([]);

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
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId && !inst.untracked ? { ...inst, lastWatered: now } : inst
    ));
    setLocations(prev => prev.map(loc => 
      loc.id === locationId ? {
        ...loc,
        journal: [{
          id: `j-loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Watered',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as JournalEntry, ...(loc.journal || [])]
      } : loc
    ));
  }, [currentUser]);

  const handleBatchFeed = useCallback((locationId: string, feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.locationId === locationId && !inst.untracked ? { ...inst, lastFed: now } : inst
    ));
    setLocations(prev => prev.map(loc => 
      loc.id === locationId ? {
        ...loc,
        journal: [{
          id: `j-loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Fed',
          feedType,
          feedAmount,
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as JournalEntry, ...(loc.journal || [])]
      } : loc
    ));
  }, [currentUser]);

  const handleBatchWaterZone = useCallback((zoneId: string) => {
    const now = new Date().toISOString();
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => 
      zoneLocIds.includes(inst.locationId) && !inst.untracked ? { ...inst, lastWatered: now } : inst
    ));
    setZones(prev => prev.map(z => 
      z.id === zoneId ? {
        ...z,
        journal: [{
          id: `j-zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Watered',
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as JournalEntry, ...(z.journal || [])]
      } : z
    ));
  }, [locations, currentUser]);

  const handleBatchFeedZone = useCallback((zoneId: string, feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => {
    const now = new Date().toISOString();
    const zoneLocIds = locations.filter(l => l.zoneId === zoneId).map(l => l.id);
    setInstances(prev => prev.map(inst => 
      zoneLocIds.includes(inst.locationId) && !inst.untracked ? { ...inst, lastFed: now } : inst
    ));
    setZones(prev => prev.map(z => 
      z.id === zoneId ? {
        ...z,
        journal: [{
          id: `j-zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Fed',
          feedType,
          feedAmount,
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as JournalEntry, ...(z.journal || [])]
      } : z
    ));
  }, [locations, currentUser]);

  const handleBatchWaterAll = useCallback(() => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => !inst.untracked ? { ...inst, lastWatered: now } : inst));
    setGardenJournal(prev => [{
      id: `j-gdn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      activityType: 'Watered',
      authorName: currentUser?.name || '',
      authorImageUrl: currentUser?.imageUrl || ''
    } as JournalEntry, ...prev]);
  }, [currentUser]);

  const handleBatchFeedAll = useCallback((feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => !inst.untracked ? { ...inst, lastFed: now } : inst));
    setGardenJournal(prev => [{
      id: `j-gdn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      activityType: 'Fed',
      feedType,
      feedAmount,
      authorName: currentUser?.name || '',
      authorImageUrl: currentUser?.imageUrl || ''
    } as JournalEntry, ...prev]);
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

  const handleFeed = useCallback((qrId: string, feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => {
    const now = new Date().toISOString();
    setInstances(prev => prev.map(inst => 
      inst.qrId === qrId ? { 
        ...inst, 
        lastFed: now,
        journal: [{
          id: `j-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: now,
          activityType: 'Fed',
          feedType,
          feedAmount,
          authorName: currentUser?.name || '',
          authorImageUrl: currentUser?.imageUrl || ''
        } as any, ...(inst.journal || [])]
      } : inst
    ));
  }, [currentUser]);

  const handleRegister = (qrId: string, identifier: string, isNew: boolean, locationIdentifier: string, isNewLocation: boolean = false, zoneIdentifier: string = '', isNewZone: boolean = false, imageUrl: string = '') => {
    let targetArchetypeId = identifier;

    if (isNew) {
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
          lifecycle: 'Unknown',
          preferredNutrientProfile: 'LOW_FEED'
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

  const handleAddZone = (name: string, isCovered?: boolean, description?: string, evaporationModifier?: number) => {
    const newId = `zn-${Date.now()}`;
    setZones(prev => [...prev, { id: newId, name, isCovered, description, evaporationModifier }]);
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

  return {
    instances, setInstances,
    archetypes, setArchetypes,
    locations, setLocations,
    zones, setZones,
    printQueue, setPrintQueue,
    gardenJournal, setGardenJournal,
    
    handleQueuePrint,
    handleBatchWater,
    handleBatchFeed,
    handleBatchWaterZone,
    handleBatchFeedZone,
    handleBatchWaterAll,
    handleBatchFeedAll,
    handleWater,
    handleFeed,
    handleRegister,
    handleUpdateInstance,
    handleDeleteInstance,
    handleUpdateArchetype,
    handleDeleteArchetype,
    handleAddArchetype,
    handleRegisterLocation,
    handleRegisterZone,
    handleAddZone,
    handleUpdateZone,
    handleDeleteZone,
    handleAddLocation,
    handleUpdateLocation,
    handleDeleteLocation
  };
}
