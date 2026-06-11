import { FC } from 'react';
import { Subtitle, Card } from '../../../styles/StyledElements';
import { Zone, Location, PlantInstance, PlantArchetype } from '../../../../types';
import { User } from '../../../App';
import { hasPermission } from '../../../utils/permissions';
import { Icon, IconName } from '../../common/Icon';

interface QuickActionsProps {
  zones: Zone[];
  locations: Location[];
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  currentUser: User;
  onBatchWaterAll: () => void;
  onBatchFeedAll: () => void;
  onLogRain?: () => void;
  onBatchWaterZone: (zoneId: string) => void;
  onBatchFeedZone?: (zoneId: string) => void;
  onBatchWaterLocation?: (locId: string) => void;
  onBatchFeedLocation?: (locId: string) => void;
  onWater?: (qrId: string) => void;
  onFeed?: (qrId: string) => void;
  onNavigateZone: (zoneId: string) => void;
  onNavigateLocation: (locId: string) => void;
  onNavigate: (qrId: string) => void;
}

export const QuickActions: FC<QuickActionsProps> = ({ 
  zones, locations, instances, archetypes, currentUser, 
  onBatchWaterAll, onBatchFeedAll, onLogRain, onBatchWaterZone, onBatchFeedZone, 
  onBatchWaterLocation, onBatchFeedLocation, onWater, onFeed, 
  onNavigateZone, onNavigateLocation, onNavigate 
}) => {
  if (!hasPermission(currentUser, 'perform_actions')) return null;

  const pinnedItems: { id: string, name: string, icon: IconName, onClick: () => void }[] = [];
  const currentUserId = currentUser?.id || '';

  zones.forEach(zone => {
    const actions = (zone.pinnedActions && !Array.isArray(zone.pinnedActions)) 
      ? (zone.pinnedActions[currentUserId] || []) 
      : (zone.isPinned ? ['water'] : []);
    actions.forEach(action => {
      if (action === 'water') {
        pinnedItems.push({ id: `z-w-${zone.id}`, name: `Water\n${zone.name}`, icon: 'water', onClick: () => onBatchWaterZone(zone.id) });
      } else if (action === 'feed') {
        pinnedItems.push({ id: `z-f-${zone.id}`, name: `Feed\n${zone.name}`, icon: 'feed', onClick: () => onBatchFeedZone ? onBatchFeedZone(zone.id) : alert('Action not available') });
      } else if (action === 'navigate') {
        pinnedItems.push({ id: `z-n-${zone.id}`, name: zone.name, icon: 'globe', onClick: () => onNavigateZone(zone.id) });
      }
    });
  });

  locations.forEach(loc => {
    const actions = (loc.pinnedActions && !Array.isArray(loc.pinnedActions)) ? (loc.pinnedActions[currentUserId] || []) : [];
    actions.forEach(action => {
      if (action === 'water') {
        pinnedItems.push({ id: `l-w-${loc.id}`, name: `Water\n${loc.name}`, icon: 'water', onClick: () => onBatchWaterLocation ? onBatchWaterLocation(loc.id) : alert('Action not available') });
      } else if (action === 'feed') {
        pinnedItems.push({ id: `l-f-${loc.id}`, name: `Feed\n${loc.name}`, icon: 'feed', onClick: () => onBatchFeedLocation ? onBatchFeedLocation(loc.id) : alert('Action not available') });
      } else if (action === 'navigate') {
        pinnedItems.push({ id: `l-n-${loc.id}`, name: loc.name, icon: 'map-pin', onClick: () => onNavigateLocation(loc.id) });
      }
    });
  });

  instances.forEach(inst => {
    const actions = (inst.pinnedActions && !Array.isArray(inst.pinnedActions)) ? (inst.pinnedActions[currentUserId] || []) : [];
    if (actions.length > 0) {
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      const name = arch?.commonName || 'Plant';
      actions.forEach(action => {
        if (action === 'water') {
          pinnedItems.push({ id: `p-w-${inst.qrId}`, name: `Water\n${name}`, icon: 'water', onClick: () => onWater ? onWater(inst.qrId) : alert('Action not available') });
        } else if (action === 'feed') {
          pinnedItems.push({ id: `p-f-${inst.qrId}`, name: `Feed\n${name}`, icon: 'feed', onClick: () => onFeed ? onFeed(inst.qrId) : alert('Action not available') });
        } else if (action === 'navigate') {
          pinnedItems.push({ id: `p-n-${inst.qrId}`, name: name, icon: 'leaf', onClick: () => onNavigate(inst.qrId) });
        }
      });
    }
  });

  return (
    <section className="mb-8 animate-in fade-in duration-500">
      <Subtitle>Quick Actions</Subtitle>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <Card onClick={onBatchWaterAll} className="flex-shrink-0 w-24 !p-3 !mb-0 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors active:scale-95 shadow-sm">
          <div className="mb-1 text-blue-500 dark:text-blue-400"><Icon name="water" size={28} /></div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">Water<br/>All</span>
        </Card>
        {onLogRain && (
          <Card onClick={onLogRain} className="flex-shrink-0 w-24 !p-3 !mb-0 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors active:scale-95 shadow-sm">
            <div className="mb-1 text-blue-400 dark:text-blue-300"><Icon name="cloud-rain" size={28} /></div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">Log<br/>Rain</span>
          </Card>
        )}
        <Card onClick={onBatchFeedAll} className="flex-shrink-0 w-24 !p-3 !mb-0 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors active:scale-95 shadow-sm">
          <div className="mb-1 text-amber-500 dark:text-amber-400"><Icon name="feed" size={28} /></div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">Feed<br/>All</span>
        </Card>
        {pinnedItems.map(item => (
          <Card key={item.id} onClick={item.onClick} className="flex-shrink-0 w-24 !p-3 !mb-0 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors active:scale-95 shadow-sm">
            <div className="mb-1 text-primary-600 dark:text-primary-400"><Icon name={item.icon} size={28} /></div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight overflow-hidden text-ellipsis w-full line-clamp-3 whitespace-pre-wrap">{item.name}</span>
          </Card>
        ))}
      </div>
    </section>
  );
};