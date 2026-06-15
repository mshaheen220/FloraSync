import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../../types';
import { Card, Subtitle } from '../../../styles/StyledElements';
import { Icon, IconName } from '../../common/Icon';

interface GardenPulseProps {
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  gardenJournal?: any[];
  onNavigate: (qrId: string) => void;
  onNavigateZone: (zoneId: string) => void;
  onNavigateLocation: (locId: string) => void;
}

const timeAgo = (dateStr: string) => {
  const ms = new Date().getTime() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return `Yesterday`;
  return `${days}d ago`;
};

export const GardenPulse: FC<GardenPulseProps> = ({ instances, archetypes, locations, zones, gardenJournal = [], onNavigate, onNavigateZone, onNavigateLocation }) => {
  const recentActivity = useMemo(() => {
    const groups: Record<string, any[]> = {};

    instances.forEach(inst => {
      if (!inst.journal) return;
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      inst.journal.forEach(entry => {
        // Group events that occur within the same minute to securely catch backend loop executions
        const timeKey = Math.floor(new Date(entry.timestamp).getTime() / 60000);
        const key = entry.batchScope 
          ? `macro_${timeKey}_${entry.activityType}_${entry.batchScope}` 
          : `${timeKey}_${entry.activityType}_${entry.authorName}`;
          
        if (!groups[key]) groups[key] = [];
        groups[key].push({
          ...entry,
          qrId: inst.qrId,
          plantName: arch?.commonName || 'Unknown Plant',
          locationId: inst.locationId,
          sourceType: 'plant'
        });
      });
    });
    
    locations.forEach(loc => {
      const jEntries = (loc as any).journal || [];
      jEntries.forEach((entry: any) => {
        const timeKey = Math.floor(new Date(entry.timestamp).getTime() / 60000);
        const scope = entry.batchScope || `the ${loc.name} location`;
        const key = `macro_${timeKey}_${entry.activityType}_${scope}`;
        groups[key] = [{
          ...entry,
          isBatch: true,
          batchScope: scope,
          onClick: () => onNavigateLocation(loc.id),
          sourceType: 'location'
        }];
      });
    });

    zones.forEach(zone => {
      const jEntries = (zone as any).journal || [];
      jEntries.forEach((entry: any) => {
        const timeKey = Math.floor(new Date(entry.timestamp).getTime() / 60000);
        const scope = entry.batchScope || `the ${zone.name} zone`;
        const key = `macro_${timeKey}_${entry.activityType}_${scope}`;
        groups[key] = [{
          ...entry,
          isBatch: true,
          batchScope: scope,
          onClick: () => onNavigateZone(zone.id),
          sourceType: 'zone'
        }];
      });
    });

    gardenJournal.forEach(entry => {
      const timeKey = Math.floor(new Date(entry.timestamp).getTime() / 60000);
      const scope = entry.batchScope || 'the entire garden';
      const key = `macro_${timeKey}_${entry.activityType}_${scope}`;
      groups[key] = [{
        ...entry,
        isBatch: true,
        batchScope: scope,
        sourceType: 'garden'
      }];
    });

    const displayItems = Object.values(groups).map(group => {
      const first = group[0];
      
      if (first.sourceType !== 'plant') {
        return first;
      }

      if (group.length === 1 && !first.batchScope) {
        return { ...first, isBatch: false, onClick: () => onNavigate(first.qrId) };
      }
      
      // If the backend has already declared this a trickle-down macro event, respect it!
      if (first.batchScope) {
        return { ...first, isBatch: true, batchScope: first.batchScope };
      }

      const locIds = new Set(group.map(g => g.locationId));
      const plantLocs = locations.filter(l => locIds.has(l.id));
      const zoneIds = new Set(plantLocs.map(l => l.zoneId));

      let batchScope = `${group.length} plants`;
      let onClick: (() => void) | undefined = undefined;

      if (group.length === instances.length && instances.length > 1) {
        batchScope = "the entire garden";
      } else if (zoneIds.size === 1 && locIds.size > 1) {
        const zone = zones.find(z => z.id === Array.from(zoneIds)[0]);
        if (zone) {
          batchScope = `the ${zone.name} zone`;
          onClick = () => onNavigateZone(zone.id);
        }
      } else if (locIds.size === 1) {
        const loc = locations.find(l => l.id === Array.from(locIds)[0]);
        if (loc) {
          batchScope = `the ${loc.name} location`;
          onClick = () => onNavigateLocation(loc.id);
        }
      }

      return { ...first, isBatch: true, batchScope, onClick };
    });

    return displayItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5); // Take the top 5 most recent actions globally
  }, [instances, archetypes, locations, zones, gardenJournal, onNavigate, onNavigateZone, onNavigateLocation]);

  if (recentActivity.length === 0) return null;

  return (
    <section className="mb-8 animate-in fade-in duration-500 delay-[500ms]">
      <Subtitle className="flex items-center gap-2"><Icon name="book-open-text" size={20} className="text-primary-500 dark:text-primary-400" /> Garden Pulse</Subtitle>
      <Card className="!p-0 overflow-hidden">
        {recentActivity.map((entry, idx) => {
          const isWater = entry.activityType === 'Watered';
          const isFeed = entry.activityType === 'Fed';
          const isHarvest = entry.activityType === 'Harvest' || entry.harvestAmount;
          const isHealth = !!entry.healthIssues && entry.healthIssues !== 'None';
          
          const actionVerb = isWater ? 'watered' : isFeed ? 'fed' : isHarvest ? `harvested ${entry.harvestAmount ? `(${entry.harvestAmount}) ` : ''}from` : isHealth ? 'flagged a health issue on' : 'logged an entry for';
          const iconName: IconName = isWater ? 'water' : isFeed ? 'feed' : isHarvest ? 'apple' : isHealth ? 'alert' : 'pencil';

          const itemClasses = `flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${entry.onClick ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer active:scale-[0.98]' : ''}`;

          return (
            <div key={entry.id || idx} onClick={entry.onClick} className={itemClasses}>
              <div className="mt-1 text-slate-400 dark:text-slate-500"><Icon name={iconName} size={20} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-tight">
                  <strong className="font-bold">{entry.authorName || 'Someone'}</strong> {actionVerb} {entry.isBatch ? (
                    <strong className="font-bold text-primary-700 dark:text-primary-400">{entry.batchScope}</strong>
                  ) : (
                    <span>the <strong className="font-bold text-primary-700 dark:text-primary-400">{entry.plantName}</strong></span>
                  )}
                </p>
                {(entry.note || isHealth) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                    "{isHealth ? `Issue: ${entry.healthIssues}` : entry.note}"
                  </p>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap pt-0.5">{timeAgo(entry.timestamp)}</span>
            </div>
          );
        })}
      </Card>
    </section>
  );
};