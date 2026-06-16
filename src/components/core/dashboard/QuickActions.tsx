import React, { FC, useState } from 'react';
import { Subtitle, Card } from '../../../styles/StyledElements';
import { Zone, Location, PlantInstance, PlantArchetype } from '../../../../types';
import { User } from '../../../App';
import { hasPermission } from '../../../utils/permissions';
import { Icon, IconName } from '../../common/Icon';
import { FeedActionModal } from '../../common/FeedActionModal';

interface QuickActionsProps {
  zones: Zone[];
  locations: Location[];
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  currentUser: User;
  onBatchWaterAll: () => void;
  onBatchFeedAll: (feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => void;
  onLogRain?: () => void;
  onBatchWaterZone: (zoneId: string) => void;
  onBatchFeedZone?: (zoneId: string, feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => void;
  onBatchWaterLocation?: (locId: string) => void;
  onBatchFeedLocation?: (locId: string, feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => void;
  onWater?: (qrId: string) => void;
  onFeed?: (qrId: string, feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED', feedAmount?: 'Light' | 'Normal' | 'Heavy') => void;
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
  
  const [feedModal, setFeedModal] = useState<{
    isOpen: boolean;
    type: 'all' | 'zone' | 'location' | 'plant';
    id?: string;
    defaultProfile?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED';
    showRecommendationHint?: boolean;
  }>({ isOpen: false, type: 'all' });

  // Utility to determine the dominant feed profile dynamically based on an arbitrary subset of plants
  const getRecommendedProfile = (targetInstances: PlantInstance[]) => {
    const counts: Record<string, number> = {};
    let best: any = 'GENERAL_FEED';
    let max = 0;
    targetInstances.forEach(inst => {
      if (inst.untracked) return;
      const loc = locations.find(l => l.id === inst.locationId);
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      const p = loc?.activeNutrientProfile || arch?.preferredNutrientProfile || 'GENERAL_FEED';
      counts[p] = (counts[p] || 0) + 1;
      if (counts[p] > max) { max = counts[p]; best = p; }
    });
    return best;
  };

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
        pinnedItems.push({ 
          id: `z-f-${zone.id}`, 
          name: `Feed\n${zone.name}`, 
          icon: 'feed', 
          onClick: () => setFeedModal({ 
            isOpen: true, 
            type: 'zone', 
            id: zone.id, 
            defaultProfile: getRecommendedProfile(instances.filter(i => locations.find(l => l.id === i.locationId)?.zoneId === zone.id)),
            showRecommendationHint: true 
          }) 
        });
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
        pinnedItems.push({ 
          id: `l-f-${loc.id}`, 
          name: `Feed\n${loc.name}`, 
          icon: 'feed', 
          onClick: () => setFeedModal({ 
            isOpen: true, 
            type: 'location', 
            id: loc.id, 
            defaultProfile: loc.activeNutrientProfile || getRecommendedProfile(instances.filter(i => i.locationId === loc.id)),
            showRecommendationHint: true 
          }) 
        });
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
          pinnedItems.push({ id: `p-f-${inst.qrId}`, name: `Feed\n${name}`, icon: 'feed', onClick: () => setFeedModal({ isOpen: true, type: 'plant', id: inst.qrId, defaultProfile: arch?.preferredNutrientProfile || 'GENERAL_FEED' }) });
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
        <ActionCard 
          onClick={() => setFeedModal({ isOpen: true, type: 'all', defaultProfile: getRecommendedProfile(instances), showRecommendationHint: true })} 
          icon="feed" 
          colorClass="text-amber-500 dark:text-amber-400" 
          label={<>Feed<br/>All</>} 
        />
        {pinnedItems.map(item => (
          <ActionCard key={item.id} onClick={item.onClick} icon={item.icon} colorClass="text-primary-600 dark:text-primary-400" label={item.name} />
        ))}
      </div>
      
      <FeedActionModal 
        isOpen={feedModal.isOpen}
        defaultProfile={feedModal.defaultProfile}
        showRecommendationHint={feedModal.showRecommendationHint}
        onClose={() => setFeedModal({ ...feedModal, isOpen: false })}
        onConfirm={(feedType, feedAmount) => {
          if (feedModal.type === 'all') onBatchFeedAll(feedType, feedAmount);
          else if (feedModal.type === 'zone' && feedModal.id && onBatchFeedZone) onBatchFeedZone(feedModal.id, feedType, feedAmount);
          else if (feedModal.type === 'location' && feedModal.id && onBatchFeedLocation) onBatchFeedLocation(feedModal.id, feedType, feedAmount);
          else if (feedModal.type === 'plant' && feedModal.id && onFeed) onFeed(feedModal.id, feedType, feedAmount);
          setFeedModal({ ...feedModal, isOpen: false });
        }}
      />
    </section>
  );
};