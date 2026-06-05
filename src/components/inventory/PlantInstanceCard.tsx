import { FC } from 'react';
import { PlantInstance, PlantArchetype } from '../../../types';
import { Card, StatusBadge, ProgressBarContainer, ProgressBarFill } from '../../styles/StyledElements';

interface PlantInstanceCardProps {
  instance: PlantInstance;
  archetype?: PlantArchetype;
  locationName?: string;
  zoneName?: string;
  zoneModifier?: number;
  onClick: () => void;
  compact?: boolean;
}

export const PlantInstanceCard: FC<PlantInstanceCardProps> = ({ instance, archetype, locationName, zoneName, zoneModifier = 1.0, onClick, compact }) => {
  const sunReq = archetype?.sunRequirement?.toLowerCase() || '';
  const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);
  
  const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
  const timeElapsed = new Date().getTime() - new Date(instance.lastWatered).getTime();
  const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
  const isOverdue = !instance.untracked && ratio <= 0;

  return (
    <Card onClick={onClick} className={`cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors ${compact ? '!p-3 flex flex-col h-full' : '!p-4'}`}>
      <div className={`flex ${compact ? 'flex-col gap-2' : 'justify-between items-start'} mb-2`}>
        <div>
          <h3 className={`font-bold text-slate-800 dark:text-slate-100 leading-tight ${compact ? 'text-base line-clamp-1' : 'text-lg'}`}>{archetype?.commonName || 'Unknown Plant'}</h3>
          {(zoneName || locationName) && (
            <p className={`text-slate-400 dark:text-slate-500 uppercase tracking-wide font-semibold ${compact ? 'text-[10px] mt-0.5 line-clamp-1' : 'text-xs mt-1'}`}>{[zoneName, locationName].filter(Boolean).join(' • ')}</p>
          )}
        </div>
      <StatusBadge $status={instance.untracked ? 'unmonitored' : (isOverdue ? 'overdue' : 'hydrated')} className={compact ? '!text-[9px] !px-2 !py-0.5 self-start' : ''}>
          {instance.untracked ? 'Unmonitored' : (isOverdue ? 'Overdue' : 'Hydrated')}
        </StatusBadge>
      </div>
      {!instance.untracked ? (
        <div className={compact ? 'mt-auto pt-2' : 'mt-4'}>
          <div className={`flex justify-between font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span>Hydration Level</span>
            <span className={isOverdue ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{Math.round(ratio * 100)}%</span>
          </div>
        <ProgressBarContainer className={compact ? '!h-1.5' : ''}>
          <ProgressBarFill $ratio={ratio} />
        </ProgressBarContainer>
        </div>
      ) : (
        <div className={`opacity-50 ${compact ? 'mt-auto pt-2' : 'mt-4'}`}>
          <div className={`flex justify-between font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span>Hydration Level</span>
            <span>Rain-fed</span>
          </div>
          <ProgressBarContainer className={compact ? '!h-1.5' : ''}>
            <div className="h-full w-full bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          </ProgressBarContainer>
        </div>
      )}
    </Card>
  );
};