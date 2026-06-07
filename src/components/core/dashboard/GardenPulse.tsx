import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../../types';
import { Card, Subtitle } from '../../../styles/StyledElements';

interface GardenPulseProps {
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
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

export const GardenPulse: FC<GardenPulseProps> = ({ instances, archetypes, locations, zones, onNavigate, onNavigateZone, onNavigateLocation }) => {
  const recentActivity = useMemo(() => {
    const groups: Record<string, any[]> = {};

    instances.forEach(inst => {
      if (!inst.journal) return;
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      inst.journal.forEach(entry => {
        const key = `${entry.timestamp}_${entry.activityType}_${entry.authorName}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push({
          ...entry,
          qrId: inst.qrId,
          plantName: arch?.commonName || 'Unknown Plant',
          locationId: inst.locationId
        });
      });
    });
    
    const displayItems = Object.values(groups).map(group => {
      const first = group[0];
      if (group.length === 1) {
        return { ...first, isBatch: false, onClick: () => onNavigate(first.qrId) };
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
  }, [instances, archetypes, locations, zones, onNavigate, onNavigateZone, onNavigateLocation]);

  if (recentActivity.length === 0) return null;

  return (
    <section className="mb-8 animate-in fade-in duration-500 delay-[500ms]">
      <Subtitle>📖 Garden Pulse</Subtitle>
      <Card className="!p-0 overflow-hidden">
        {recentActivity.map((entry, idx) => {
          const isWater = entry.activityType === 'Watered';
          const isFeed = entry.activityType === 'Fed';
          const isHarvest = entry.activityType === 'Harvest' || entry.harvestAmount;
          const isHealth = !!entry.healthIssues;
          
          const actionVerb = isWater ? 'watered' : isFeed ? 'fed' : isHarvest ? `harvested ${entry.harvestAmount ? `(${entry.harvestAmount}) ` : ''}from` : isHealth ? 'flagged a health issue on' : 'logged an entry for';
          const icon = isWater ? '💦' : isFeed ? '🍽️' : isHarvest ? '🍅' : isHealth ? '🚨' : '📝';

          const itemClasses = `flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${entry.onClick ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer active:scale-[0.98]' : ''}`;

          return (
            <div key={entry.id || idx} onClick={entry.onClick} className={itemClasses}>
              <div className="text-2xl mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-tight">
                  <strong className="font-bold">{entry.authorName || 'Someone'}</strong> {actionVerb} {entry.isBatch ? (
                    <strong className="font-bold text-emerald-700 dark:text-emerald-400">{entry.batchScope}</strong>
                  ) : (
                    <span>the <strong className="font-bold text-emerald-700 dark:text-emerald-400">{entry.plantName}</strong></span>
                  )}
                </p>
                {(entry.note || entry.healthIssues) && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                    "{entry.healthIssues ? `Issue: ${entry.healthIssues}` : entry.note}"
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