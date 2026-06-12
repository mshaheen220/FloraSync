import React, { FC } from 'react';
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

interface ActionCardProps {
  onClick: () => void;
  icon: IconName;
  colorClass: string;
  label: React.ReactNode;
}

const ActionCard: FC<ActionCardProps> = ({ onClick, icon, colorClass, label }) => (
  <Card onClick={onClick} className="flex-shrink-0 w-[72px] h-[72px] !p-1.5 !mb-0 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors active:scale-95 shadow-sm">
    <div className={`mb-0.5 ${colorClass}`}><Icon name={icon} size={22} /></div>
    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight overflow-hidden text-ellipsis w-full line-clamp-2 whitespace-pre-wrap">{label}</span>
  </Card>
);

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
        <ActionCard onClick={onBatchWaterAll} icon="water" colorClass="text-blue-500 dark:text-blue-400" label={<>Water<br/>All</>} />
        {onLogRain && (
          <ActionCard onClick={onLogRain} icon="cloud-rain" colorClass="text-blue-400 dark:text-blue-300" label={<>Log<br/>Rain</>} />
        )}
        <ActionCard onClick={onBatchFeedAll} icon="feed" colorClass="text-amber-500 dark:text-amber-400" label={<>Feed<br/>All</>} />
        {pinnedItems.map(item => (
          <ActionCard key={item.id} onClick={item.onClick} icon={item.icon} colorClass="text-primary-600 dark:text-primary-400" label={item.name} />
        ))}
      </div>
    </section>
  );
};