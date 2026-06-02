import { useMemo, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Subtitle, Button, FAB } from '../styles/StyledElements';
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
  
  // Attention Queue sorting engine logic calculating actual time distance against care intervals
  const attentionQueue = useMemo(() => {
    const today = new Date().getTime();
    return instances.map(instance => {
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
  }, [instances, archetypes, locations, zones]);

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

  const mostPopulatedZone = useMemo(() => {
    if (instances.length === 0 || zones.length === 0) return 'None';
    const zoneCounts = instances.reduce((acc, inst) => {
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
  }, [instances, locations, zones]);

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
          <Card className="!p-4 !mb-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">💧</span>
            <span className={`text-2xl font-black ${averageHydration <= 30 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{averageHydration}%</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hydration</span>
          </Card>
          <Card className="!p-4 !mb-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-2">🌱</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{instances.length}</span>
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

      {overdueLocations.length > 0 && (
        <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
        <Subtitle>Needs Attention Today</Subtitle>
        {overduePlants.length === 0 ? (
          <Card className="text-center py-10">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">All plants are perfectly hydrated and fed!</p>
          </Card>
        ) : (
          <div className="space-y-3">
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

      <FAB onClick={onOpenScanner}>
        📷
      </FAB>
    </Container>
  );
};