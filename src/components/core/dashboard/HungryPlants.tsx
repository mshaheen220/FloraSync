import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../../types';
import { Subtitle, Card, StatusBadge } from '../../../styles/StyledElements';
import { Icon } from '../../common/Icon';
import { FEED_PROFILE_LABELS } from '../../../utils/constants';

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
      
      const feedingModifier = location?.feedingModifier || 1.0;
      const intervalMs = (archetype?.feedingIntervalDays || 14) * 24 * 60 * 60 * 1000 * feedingModifier;
      
      const feedEntries = inst.journal?.filter(e => e.activityType === 'Fed').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];
      const lastFeedEntry = feedEntries[0];
      
      let fullnessStart = 1.0;
      if (lastFeedEntry) {
        if (lastFeedEntry.feedAmount === 'Light') fullnessStart = 0.5;
        if (lastFeedEntry.feedAmount === 'Heavy') fullnessStart = 1.2;
      }

      if (lastFeedEntry && archetype?.preferredNutrientProfile && lastFeedEntry.feedType && lastFeedEntry.feedType !== archetype.preferredNutrientProfile && lastFeedEntry.feedType !== 'GENERAL_FEED') {
        fullnessStart *= 0.4;
      }
      
      const ratio = Math.max(0, fullnessStart - ((today - lastFedTime) / intervalMs));
      const isSuboptimalLocation = archetype?.preferredNutrientProfile && location?.activeNutrientProfile && archetype.preferredNutrientProfile !== location.activeNutrientProfile;
      
      return { ...inst, archetype, location, zone, isOverdue: ratio <= 0, isSuboptimalLocation };
    }).filter(p => p.isOverdue && !p.untracked);
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
            {item.isSuboptimalLocation && (() => {
              const targetLoc = locations.find(l => l.activeNutrientProfile === item.archetype?.preferredNutrientProfile);
              const profileName = FEED_PROFILE_LABELS[item.archetype?.preferredNutrientProfile as string] || item.archetype?.preferredNutrientProfile;
              return (
                <div className="mb-2 p-1.5 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800/50">
                  <p className="text-[9px] text-red-700 dark:text-red-400 font-bold leading-tight flex items-center gap-1">
                    <Icon name="alert" size={10} /> Suboptimal Location
                  </p>
                  <p className="text-[9px] text-red-600 dark:text-red-500 leading-tight mt-0.5">
                    {targetLoc ? `Move to '${targetLoc.name}' for better ${profileName} feeding.` : `Requires a ${profileName} feeding zone.`}
                  </p>
                </div>
              );
            })()}
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="inline-flex w-fit items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  <Icon name="feed" size={10} />
                  {FEED_PROFILE_LABELS[item.archetype?.preferredNutrientProfile as string] || item.archetype?.preferredNutrientProfile}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic line-clamp-2 leading-tight">{item.archetype?.whatToFeed || 'Balanced fertilizer'}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};