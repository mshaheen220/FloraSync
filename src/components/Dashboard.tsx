import { useMemo, useState, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Subtitle, Button, FAB, StatusBadge } from '../styles/StyledElements';
import { PlantInstanceCard } from './PlantInstanceCard';

interface DashboardProps {
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  onBatchWater: (locationId: string) => void;
  onNavigate: (qrId: string) => void;
  onOpenScanner: () => void;
  onOpenMenu: () => void;
}

export const Dashboard: FC<DashboardProps> = ({ instances, archetypes, locations, zones, onBatchWater, onNavigate, onOpenScanner, onOpenMenu }) => {
  
  // Lock in a random selection for the duration of this view so it doesn't flicker on state updates
  const [randomSeed] = useState(() => ({
    index: Math.floor(Math.random() * 1000000),
    prompt: Math.floor(Math.random() * 4)
  }));

  // Filter out any plants that have already completed their lifecycle
  const activeInstances = useMemo(() => instances.filter(i => !i.dateHarvested), [instances]);

  // Attention Queue sorting engine logic calculating actual time distance against care intervals
  const attentionQueue = useMemo(() => {
    const today = new Date().getTime();
    return activeInstances.map(instance => {
      const archetype = archetypes.find(a => a.id === instance.archetypeId);
      const location = locations.find(l => l.id === instance.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastWateredTime = new Date(instance.lastWatered).getTime();
      const intervalMs = (archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000;
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
  }, [activeInstances, archetypes, locations, zones]);

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
    if (activeInstances.length === 0) return 100;
    const today = new Date().getTime();
    const total = activeInstances.reduce((acc, inst) => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const intervalMs = (archetype?.feedingIntervalDays || 14) * 24 * 60 * 60 * 1000;
      const timeElapsed = today - new Date(inst.lastFed).getTime();
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      return acc + ratio;
    }, 0);
    return Math.round((total / activeInstances.length) * 100);
  }, [activeInstances, archetypes]);

  const mostPopulatedZone = useMemo(() => {
    if (activeInstances.length === 0 || zones.length === 0) return 'None';
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
    return zone ? zone.name : 'None';
  }, [activeInstances, locations, zones]);

  const dailySpotlight = useMemo(() => {
    if (activeInstances.length === 0) return null;
    const index = randomSeed.index % activeInstances.length;
    const instance = activeInstances[index];
    const archetype = archetypes.find(a => a.id === instance.archetypeId);

    if (!archetype) return null;

    const promptType = randomSeed.prompt;
    let message = `How is the ${archetype.commonName} doing? Take a moment to inspect its leaves for pests or signs of stress.`;
    let title = "Plant Check-in";

    if (promptType === 0 && archetype.usesForLargeHarvests && archetype.usesForLargeHarvests !== 'Unknown') {
      title = "Culinary Inspiration";
      message = `When's the last time you tried ${archetype.commonName} in your dinner dish? ${archetype.usesForLargeHarvests}`;
    } else if (promptType === 1 && archetype.pruningTips && archetype.pruningTips !== 'Unknown') {
      title = "Pruning Reminder";
      message = `Don't forget to prune your ${archetype.commonName}! ${archetype.pruningTips}`;
    } else if (promptType === 2 && archetype.flavorProfile && archetype.flavorProfile !== 'Unknown') {
      title = "Flavor Profile";
      message = `Craving something ${archetype.flavorProfile.toLowerCase()}? Check on your ${archetype.commonName}!`;
    }

    return { instance, archetype, title, message };
  }, [activeInstances, archetypes, randomSeed]);

  const approachingHarvest = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayMs = todayDate.getTime();

    const radar: any[] = [];
    activeInstances.forEach(inst => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const daysToHarvest = archetype?.daysToHarvest || 0;
      if (daysToHarvest === 0 || !inst.datePlanted) return;

      const plantDateObj = new Date(inst.datePlanted);
      plantDateObj.setHours(0, 0, 0, 0);
      const plantDateMs = plantDateObj.getTime();
      
      const harvestDateMs = plantDateMs + (daysToHarvest * 24 * 60 * 60 * 1000);
      const daysUntil = Math.round((harvestDateMs - todayMs) / (1000 * 60 * 60 * 24));

      // Show anything nearing harvest (within 14 days) or slightly past due (up to -14 days)
      if (daysUntil <= 14 && daysUntil >= -14) {
        radar.push({ ...inst, archetype, daysUntil });
      }
    });
    return radar.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [activeInstances, archetypes]);

  const nurseryPlants = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayMs = todayDate.getTime();

    const nursery: any[] = [];
    activeInstances.forEach(inst => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      if (!inst.datePlanted) return;

      const plantDateObj = new Date(inst.datePlanted);
      plantDateObj.setHours(0, 0, 0, 0);
      const plantDateMs = plantDateObj.getTime();
      
      const daysSince = Math.round((todayMs - plantDateMs) / (1000 * 60 * 60 * 24));

      // Only highlight seedlings and fresh transplants planted in the last 14 days
      if (daysSince <= 14 && daysSince >= 0) {
        nursery.push({ ...inst, archetype, daysSince });
      }
    });
    return nursery.sort((a, b) => a.daysSince - b.daysSince); // Youngest first
  }, [activeInstances, archetypes]);

  const hungryPlants = useMemo(() => {
    const today = new Date().getTime();
    return activeInstances.map(inst => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const location = locations.find(l => l.id === inst.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastFedTime = new Date(inst.lastFed).getTime();
      const intervalMs = (archetype?.feedingIntervalDays || 14) * 24 * 60 * 60 * 1000;
      const ratio = Math.max(0, 1 - ((today - lastFedTime) / intervalMs));
      return { ...inst, archetype, location, zone, isOverdue: ratio <= 0 };
    }).filter(p => p.isOverdue);
  }, [activeInstances, archetypes, locations, zones]);

  return (
    <Container>
      <header className="mb-6 pt-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/images/icons/florasync-logo-512.png" alt="FloraSync Logo" className="w-8 h-8" />
            <Title className="!mb-0">FloraSync</Title>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Your garden at a glance.</p>
        </div>
        <button onClick={onOpenMenu} className="text-xl p-2 px-3 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-90 transition-all bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
          ☰
        </button>
      </header>

      <section className="mb-8 animate-in fade-in duration-500 delay-100">
        <Subtitle>Garden Vitality</Subtitle>
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-3 !mb-0 flex items-center justify-between text-center">
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl mb-1">💧</span>
              <span className={`text-xl font-black ${averageHydration <= 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{averageHydration}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Water</span>
            </div>
            <div className="w-px h-12 bg-slate-200 dark:bg-slate-700/50"></div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-2xl mb-1">🍽️</span>
              <span className={`text-xl font-black ${averageNutrition <= 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{averageNutrition}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Feed</span>
            </div>
          </Card>
          <Card className="!p-4 !mb-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🌱</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeInstances.length}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Plants</span>
          </Card>
          <Card className="!p-4 !mb-0 col-span-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🌍</span>
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Top Zone</span>
                <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">{mostPopulatedZone}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {dailySpotlight && (
        <section className="mb-8 animate-in fade-in duration-500 delay-[125ms]">
          <Subtitle>🌟 {dailySpotlight.title}</Subtitle>
          <Card onClick={() => onNavigate(dailySpotlight.instance.qrId)} className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 flex items-center gap-4 !p-4">
            {dailySpotlight.archetype.imageUrl ? (
              <img src={dailySpotlight.archetype.imageUrl} alt={dailySpotlight.archetype.commonName} className="w-20 h-20 rounded-xl object-cover border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800 flex-shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl flex-shrink-0">🌿</div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-1 truncate">{dailySpotlight.archetype.commonName}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-3">"{dailySpotlight.message}"</p>
            </div>
          </Card>
        </section>
      )}

      {approachingHarvest.length > 0 && (
        <section className="mb-8 animate-in fade-in duration-500 delay-150">
          <Subtitle>🍅 Approaching Harvest</Subtitle>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {approachingHarvest.map(item => (
              <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="whitespace-nowrap flex-shrink-0 w-44 !p-3.5 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.archetype?.commonName}</h3>
                <p className={`text-xs font-semibold mt-1 ${item.daysUntil <= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {item.daysUntil <= 0 ? 'Ready to pick!' : `${item.daysUntil} days left`}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {nurseryPlants.length > 0 && (
        <section className="mb-8 animate-in fade-in duration-500 delay-200">
          <Subtitle>🌱 The Nursery</Subtitle>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {nurseryPlants.map(item => (
              <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="whitespace-nowrap flex-shrink-0 w-44 !p-3.5 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.archetype?.commonName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Planted {item.daysSince === 0 ? 'today' : `${item.daysSince} days ago`}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {overdueLocations.length > 0 && (
        <section className="mb-8 animate-in fade-in duration-500 delay-300">
          <Subtitle>Quick Actions</Subtitle>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {overdueLocations.map(loc => (
              <Button key={loc.id} variant="batch" onClick={() => onBatchWater(loc.id)} className="whitespace-nowrap flex-shrink-0 w-auto px-5">
                💦 Water all on {loc.name}
              </Button>
            ))}
          </div>
        </section>
      )}

      <section>
        <Subtitle>💦 Needs Watering</Subtitle>
        {overduePlants.length === 0 ? (
          <Card className="text-center py-10">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">All plants are perfectly hydrated!</p>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {overduePlants.map(item => (
              <PlantInstanceCard 
                key={item.qrId} 
                instance={item} 
                archetype={item.archetype} 
                locationName={item.location?.name} 
                zoneName={item.zone?.name} 
                onClick={() => onNavigate(item.qrId)} 
              />
            ))}
          </div>
        )}
      </section>

      {hungryPlants.length > 0 && (
        <section className="animate-in fade-in duration-500 delay-[400ms]">
          <Subtitle>🍽️ Hungry Plants</Subtitle>
          <div className="space-y-3">
            {hungryPlants.map(item => (
              <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 !border-amber-200 dark:!border-amber-900/50 !bg-amber-50/30 dark:!bg-amber-900/10">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{item.archetype?.commonName}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide font-semibold">{item.zone?.name} • {item.location?.name}</p>
                  </div>
                  <StatusBadge status="overdue">Needs Feed</StatusBadge>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-3 italic">Feed: {item.archetype?.whatToFeed || 'Balanced fertilizer'}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <FAB onClick={onOpenScanner}>
        📷
      </FAB>
    </Container>
  );
};