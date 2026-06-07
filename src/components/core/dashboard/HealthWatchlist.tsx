import { FC, useMemo } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../../types';
import { Card, Subtitle } from '../../../styles/StyledElements';

interface HealthWatchlistProps {
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  onNavigate: (qrId: string) => void;
}

export const HealthWatchlist: FC<HealthWatchlistProps> = ({ instances, archetypes, locations, zones, onNavigate }) => {
  const sickPlants = useMemo(() => {
    const issues: any[] = [];
    const activeInstances = instances.filter(i => !i.dateHarvested && !i.untracked);
    
    activeInstances.forEach(inst => {
      if (!inst.journal || inst.journal.length === 0) return;
      
      // Sort to get the most recent entry
      const sortedJournal = [...inst.journal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const latestEntry = sortedJournal[0];
      
      // If the most recent entry has health issues and isn't explicitly marked as resolved
      if (latestEntry.healthIssues && latestEntry.healthIssues.toLowerCase() !== 'none' && latestEntry.healthIssues.toLowerCase() !== 'resolved' && latestEntry.healthIssues.toLowerCase() !== 'healthy') {
        const arch = archetypes.find(a => a.id === inst.archetypeId);
        const loc = locations.find(l => l.id === inst.locationId);
        const zone = zones.find(z => z.id === loc?.zoneId);
        
        issues.push({
          ...inst,
          archetype: arch,
          location: loc,
          zone: zone,
          issue: latestEntry.healthIssues,
          daysAgo: Math.max(0, Math.floor((new Date().getTime() - new Date(latestEntry.timestamp).getTime()) / (1000 * 60 * 60 * 24)))
        });
      }
    });
    
    // Show the oldest standing issues first
    return issues.sort((a, b) => b.daysAgo - a.daysAgo);
  }, [instances, archetypes, locations, zones]);

  if (sickPlants.length === 0) return null;

  return (
    <section className="mb-8 animate-in fade-in duration-500 delay-[175ms]">
      <Subtitle>🚨 Health Watchlist</Subtitle>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {sickPlants.map((item, idx) => (
          <Card key={item.qrId || idx} onClick={() => onNavigate(item.qrId)} className="whitespace-nowrap flex-shrink-0 w-56 !p-3.5 cursor-pointer hover:border-red-300 dark:hover:border-red-700 !border-red-200 dark:!border-red-900/50 !bg-red-50/30 dark:!bg-red-900/10">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.archetype?.commonName}</h3>
              <span className="text-[10px] text-red-500 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                {item.daysAgo === 0 ? 'Today' : `${item.daysAgo}d ago`}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold truncate mb-1">{item.zone?.name || 'Unzoned'} • {item.location?.name || 'Unassigned'}</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 italic font-medium whitespace-normal line-clamp-2">{item.issue}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};