import { useMemo, FC } from 'react';
import { PlantInstance, PlantArchetype, Location } from '../types';
import { Container, Title, Card, Subtitle, StatusBadge, ProgressBarContainer, ProgressBarFill, Button, FAB } from '../styles/StyledElements';

interface DashboardProps {
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  onBatchWater: (locationId: string) => void;
  onNavigate: (qrId: string) => void;
  onOpenScanner: () => void;
}

export const Dashboard: FC<DashboardProps> = ({ instances, archetypes, locations, onBatchWater, onNavigate, onOpenScanner }) => {
  
  // Attention Queue sorting engine logic calculating actual time distance against care intervals
  const attentionQueue = useMemo(() => {
    const today = new Date().getTime();
    return instances.map(instance => {
      const archetype = archetypes.find(a => a.id === instance.archetypeId);
      const location = locations.find(l => l.id === instance.locationId);
      const lastWateredTime = new Date(instance.lastWatered).getTime();
      const intervalMs = (archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000;
      const timeElapsed = today - lastWateredTime;
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      
      return {
        ...instance,
        archetype,
        location,
        isOverdue: ratio <= 0,
        ratio
      };
    }).sort((a, b) => a.ratio - b.ratio); // Flots the hungriest plants directly to the top
  }, [instances, archetypes, locations]);

  const overdueLocations = useMemo(() => {
    const locIds = new Set(attentionQueue.filter(item => item.isOverdue).map(item => item.locationId));
    return locations.filter(l => locIds.has(l.id));
  }, [attentionQueue, locations]);

  return (
    <Container>
      <header className="mb-6 pt-6">
        <Title>FloraSync 🌿</Title>
        <p className="text-slate-500 text-sm font-medium">Your garden at a glance.</p>
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
        <div className="space-y-3">
          {attentionQueue.map(item => (
            <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="cursor-pointer hover:border-emerald-300">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.archetype?.commonName}</h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wide font-semibold">{item.location?.zone} • {item.location?.name}</p>
                </div>
                <StatusBadge status={item.isOverdue ? 'overdue' : 'hydrated'}>
                  {item.isOverdue ? 'Overdue' : 'Hydrated'}
                </StatusBadge>
              </div>
              <div className="mt-5">
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                  <span>Hydration Level</span>
                  <span className={item.ratio <= 0 ? 'text-amber-600' : 'text-emerald-600'}>{Math.round(item.ratio * 100)}%</span>
                </div>
                <ProgressBarContainer>
                  <ProgressBarFill ratio={item.ratio} />
                </ProgressBarContainer>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <FAB onClick={onOpenScanner}>
        📷
      </FAB>
    </Container>
  );
};