import { useMemo, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Subtitle, StatusBadge, ProgressBarContainer, ProgressBarFill, Button, FAB } from '../styles/StyledElements';

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
              <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{item.archetype?.commonName}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide font-semibold">{item.zone?.name} • {item.location?.name}</p>
                  </div>
                  <StatusBadge status={item.isOverdue ? 'overdue' : 'hydrated'}>
                    {item.isOverdue ? 'Overdue' : 'Hydrated'}
                  </StatusBadge>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Hydration Level</span>
                    <span className={item.ratio <= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{Math.round(item.ratio * 100)}%</span>
                  </div>
                  <ProgressBarContainer>
                    <ProgressBarFill ratio={item.ratio} />
                  </ProgressBarContainer>
                </div>
              </Card>
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