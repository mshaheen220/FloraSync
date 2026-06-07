import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype } from '../../../../types';
import { Subtitle, Card } from '../../../styles/StyledElements';

interface ApproachingHarvestProps {
  activeInstances: PlantInstance[];
  archetypes: PlantArchetype[];
  onNavigate: (qrId: string) => void;
}

export const ApproachingHarvest: FC<ApproachingHarvestProps> = ({ activeInstances, archetypes, onNavigate }) => {
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

  if (approachingHarvest.length === 0) return null;

  return (
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
  );
};