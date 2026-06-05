import { FC } from 'react';
import { PlantInstance, PlantArchetype } from '../../types';
import { Card, StatusBadge, ProgressBarContainer, ProgressBarFill } from '../styles/StyledElements';

interface PlantInstanceCardProps {
  instance: PlantInstance;
  archetype?: PlantArchetype;
  locationName?: string;
  zoneName?: string;
  zoneModifier?: number;
  onClick: () => void;
}

export const PlantInstanceCard: FC<PlantInstanceCardProps> = ({ instance, archetype, locationName, zoneName, zoneModifier = 1.0, onClick }) => {
  const sunReq = archetype?.sunRequirement?.toLowerCase() || '';
  const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);
  
  const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
  const timeElapsed = new Date().getTime() - new Date(instance.lastWatered).getTime();
  const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
  const isOverdue = !instance.untracked && ratio <= 0;

  return (
    <Card onClick={onClick} className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 !p-4 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{archetype?.commonName || 'Unknown Plant'}</h3>
          {(zoneName || locationName) && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide font-semibold">{[zoneName, locationName].filter(Boolean).join(' • ')}</p>
          )}
        </div>
      <StatusBadge $status={instance.untracked ? 'unmonitored' : (isOverdue ? 'overdue' : 'hydrated')}>
          {instance.untracked ? 'Unmonitored' : (isOverdue ? 'Overdue' : 'Hydrated')}
        </StatusBadge>
      </div>
      {!instance.untracked ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Hydration Level</span>
            <span className={isOverdue ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{Math.round(ratio * 100)}%</span>
          </div>
        <ProgressBarContainer>
          <ProgressBarFill $ratio={ratio} />
        </ProgressBarContainer>
        </div>
      ) : (
        <div className="mt-4 opacity-50">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Hydration Level</span>
            <span>Rain-fed</span>
          </div>
          <ProgressBarContainer>
            <div className="h-full w-full bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          </ProgressBarContainer>
        </div>
      )}
    </Card>
  );
};