import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype } from '../../../../types';
import { Subtitle, Card } from '../../../styles/StyledElements';

interface NurseryProps {
  activeInstances: PlantInstance[];
  archetypes: PlantArchetype[];
  onNavigate: (qrId: string) => void;
}

export const Nursery: FC<NurseryProps> = ({ activeInstances, archetypes, onNavigate }) => {
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

  if (nurseryPlants.length === 0) return null;

  return (
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
  );
};