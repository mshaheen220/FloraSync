import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../../types';
import { Subtitle, Card, StatusBadge } from '../../../styles/StyledElements';
import { Icon } from '../../common/Icon';

interface HungryPlantsProps {
  trackedInstances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  onNavigate: (qrId: string) => void;
}

export const HungryPlants: FC<HungryPlantsProps> = ({ trackedInstances, archetypes, locations, zones, onNavigate }) => {
  const hungryPlants = useMemo(() => {
    const today = new Date().getTime();
    return trackedInstances.map(inst => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const location = locations.find(l => l.id === inst.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastFedTime = new Date(inst.lastFed).getTime();
      const intervalMs = (archetype?.feedingIntervalDays || 14) * 24 * 60 * 60 * 1000;
      const ratio = Math.max(0, 1 - ((today - lastFedTime) / intervalMs));
      return { ...inst, archetype, location, zone, isOverdue: ratio <= 0 };
    }).filter(p => p.isOverdue);
  }, [trackedInstances, archetypes, locations, zones]);

  if (hungryPlants.length === 0) return null;

  return (
    <section className="animate-in fade-in duration-500 delay-[400ms]">
      <Subtitle className="flex items-center gap-2"><Icon name="utensils" size={20} className="text-amber-500 dark:text-amber-400" /> Hungry Plants</Subtitle>
      <div className="grid grid-cols-2 gap-3">
        {hungryPlants.map(item => (
          <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 !border-amber-200 dark:!border-amber-900/50 !bg-amber-50/30 dark:!bg-amber-900/10 !p-3 flex flex-col h-full">
            <div className="flex flex-col gap-2 mb-2">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight line-clamp-1">{item.archetype?.commonName}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wide font-semibold line-clamp-1">{item.zone?.name} • {item.location?.name}</p>
              </div>
              <StatusBadge $status="overdue" className="!text-[9px] !px-2 !py-0.5 self-start">Needs Feed</StatusBadge>
            </div>
            <div className="mt-auto pt-1">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium italic line-clamp-2">Feed: {item.archetype?.whatToFeed || 'Balanced fertilizer'}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};