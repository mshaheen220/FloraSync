import { useMemo, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../types';
import { Container } from '../../styles/StyledElements';
import { GardenProfile, User } from '../../App';
import { GardenPulse } from './dashboard/GardenPulse';
import { HealthWatchlist } from './dashboard/HealthWatchlist';
import { RandomSpotlight } from './dashboard/RandomSpotlight';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { QuickActions } from './dashboard/QuickActions';
import { GardenVitality } from './dashboard/GardenVitality';
import { ApproachingHarvest } from './dashboard/ApproachingHarvest';
import { Nursery } from './dashboard/Nursery';
import { UrgentLocationCare } from './dashboard/UrgentLocationCare';
import { NeedsWatering } from './dashboard/NeedsWatering';
import { HungryPlants } from './dashboard/HungryPlants';

interface DashboardProps {
  gardenProfile?: GardenProfile | null;
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  onBatchWater: (locationId: string) => void;
  onBatchWaterAll: () => void;
  onBatchFeedAll: () => void;
  onBatchWaterZone: (zoneId: string) => void;
  onBatchFeedZone?: (zoneId: string) => void;
  onBatchWaterLocation?: (locId: string) => void;
  onBatchFeedLocation?: (locId: string) => void;
  onWater?: (qrId: string) => void;
  onFeed?: (qrId: string) => void;
  onNavigate: (qrId: string) => void;
  onOpenMenu: () => void;
  onNavigateInventory: () => void;
  onNavigateZone: (zoneId: string) => void;
  onNavigateLocation: (locId: string) => void;
  onOpenWorkspaceMenu?: () => void;
  currentUser: User;
}

export const Dashboard: FC<DashboardProps> = ({ gardenProfile, instances, archetypes, locations, zones, onBatchWater, onBatchWaterAll, onBatchFeedAll, onBatchWaterZone, onBatchFeedZone, onBatchWaterLocation, onBatchFeedLocation, onWater, onFeed, onNavigate, onOpenMenu, onNavigateInventory, onNavigateZone, onNavigateLocation, onOpenWorkspaceMenu, currentUser }) => {

  // Filter out any plants that have already completed their lifecycle
  const activeInstances = useMemo(() => instances.filter(i => !i.dateHarvested), [instances]);

  const trackedInstances = useMemo(() => activeInstances.filter(i => !i.untracked), [activeInstances]);

  // Attention Queue sorting engine logic calculating actual time distance against care intervals
  const attentionQueue = useMemo(() => {
    const today = new Date().getTime();
    return trackedInstances.map(instance => {
      const archetype = archetypes.find(a => a.id === instance.archetypeId);
      const location = locations.find(l => l.id === instance.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastWateredTime = new Date(instance.lastWatered).getTime();
      
      const zoneModifier = zone?.evaporationModifier || 1.0;
      const sunReq = archetype?.sunRequirement?.toLowerCase() || '';
      const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);
      
      const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
      const timeElapsed = today - lastWateredTime;
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      
      return {
        ...instance,
        archetype,
        location,
        zone,
        isOverdue: ratio <= 0,
        ratio
      };
    }).sort((a, b) => a.ratio - b.ratio);
  }, [trackedInstances, archetypes, locations, zones]);

  const overdueLocations = useMemo(() => {
    const locIds = new Set(attentionQueue.filter(item => item.isOverdue).map(item => item.locationId));
    return locations.filter(l => locIds.has(l.id));
  }, [attentionQueue, locations]);

  const overduePlants = useMemo(() => attentionQueue.filter(p => p.isOverdue), [attentionQueue]);

  const averageHydration = useMemo(() => {
    if (attentionQueue.length === 0) return 100;
    const total = attentionQueue.reduce((acc, curr) => acc + curr.ratio, 0);
    return Math.round((total / attentionQueue.length) * 100);
  }, [attentionQueue]);

  const averageNutrition = useMemo(() => {
    if (trackedInstances.length === 0) return 100;
    const today = new Date().getTime();
    const total = trackedInstances.reduce((acc, inst) => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const intervalMs = (archetype?.feedingIntervalDays || 14) * 24 * 60 * 60 * 1000;
      const timeElapsed = today - new Date(inst.lastFed).getTime();
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      return acc + ratio;
    }, 0);
    return Math.round((total / trackedInstances.length) * 100);
  }, [trackedInstances, archetypes]);

  const mostPopulatedZone = useMemo(() => {
    if (activeInstances.length === 0 || zones.length === 0) return { name: 'None', id: null };
    const zoneCounts = activeInstances.reduce((acc, inst) => {
      const loc = locations.find(l => l.id === inst.locationId);
      if (loc?.zoneId) {
        acc[loc.zoneId] = (acc[loc.zoneId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    let maxZoneId = '';
    let maxCount = -1;
    for (const [zId, count] of Object.entries(zoneCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxZoneId = zId;
      }
    }
    const zone = zones.find(z => z.id === maxZoneId);
    return zone ? { name: zone.name, id: zone.id } : { name: 'None', id: null };
  }, [activeInstances, locations, zones]);

  return (
    <Container>
      <DashboardHeader 
        gardenProfile={gardenProfile} 
        onOpenMenu={onOpenMenu} 
        onOpenWorkspaceMenu={onOpenWorkspaceMenu} 
      />

      <QuickActions 
        zones={zones} 
        locations={locations}
        instances={instances}
        archetypes={archetypes}
        currentUser={currentUser} 
        onBatchWaterAll={onBatchWaterAll} 
        onBatchFeedAll={onBatchFeedAll} 
        onBatchWaterZone={onBatchWaterZone} 
        onBatchFeedZone={onBatchFeedZone}
        onBatchWaterLocation={onBatchWaterLocation || onBatchWater} 
        onBatchFeedLocation={onBatchFeedLocation}
        onWater={onWater}
        onFeed={onFeed}
        onNavigateZone={onNavigateZone}
        onNavigateLocation={onNavigateLocation}
        onNavigate={onNavigate}
      />

      <GardenVitality 
        averageHydration={averageHydration} 
        averageNutrition={averageNutrition} 
        trackedCount={trackedInstances.length} 
        activeCount={activeInstances.length} 
        mostPopulatedZone={mostPopulatedZone} 
        onNavigateInventory={onNavigateInventory} 
        onNavigateZone={onNavigateZone} 
      />

      <RandomSpotlight activeInstances={activeInstances} archetypes={archetypes} onNavigate={onNavigate} />

      <ApproachingHarvest 
        activeInstances={activeInstances} 
        archetypes={archetypes} 
        onNavigate={onNavigate} 
      />

      <Nursery 
        activeInstances={activeInstances} 
        archetypes={archetypes} 
        onNavigate={onNavigate} 
      />

      <HealthWatchlist instances={instances} archetypes={archetypes} locations={locations} zones={zones} onNavigate={onNavigate} />

      <UrgentLocationCare 
        overdueLocations={overdueLocations} 
        zones={zones} 
        currentUser={currentUser} 
        onBatchWater={onBatchWater} 
      />

      <NeedsWatering 
        overduePlants={overduePlants} 
        onNavigate={onNavigate} 
      />

      <HungryPlants 
        trackedInstances={trackedInstances} 
        archetypes={archetypes} 
        locations={locations} 
        zones={zones} 
        onNavigate={onNavigate} 
      />

      <GardenPulse instances={instances} archetypes={archetypes} locations={locations} zones={zones} onNavigate={onNavigate} onNavigateZone={onNavigateZone} onNavigateLocation={onNavigateLocation} />
    </Container>
  );
};