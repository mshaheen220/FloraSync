import { FC } from 'react';
import { PlantArchetype } from '../../../types';
import { Card } from '../../styles/StyledElements';
import { Icon } from '../common/Icon';

interface ArchetypeCardProps {
  arch: PlantArchetype;
  inUseCount: number;
  onNavigate: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}

export const ArchetypeCard: FC<ArchetypeCardProps> = ({
  arch,
  inUseCount,
  onNavigate,
  onDelete,
  canEdit
}) => {
  return (
    <Card className="!p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{arch.commonName}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{arch.id}</p>
          <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1"><Icon name="water" size={14} /> {arch.waterIntervalDays}d</span>
            <span className="flex items-center gap-1"><Icon name="feed" size={14} /> {arch.feedingIntervalDays}d</span>
            <span className="flex items-center gap-1"><Icon name="sun" size={14} /> {arch.sunRequirement}</span>
          </div>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-2">{inUseCount} planted</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onNavigate} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 active:scale-90" title="View Details"><Icon name="view" size={18} /></button>
          {canEdit && (
            <button onClick={onDelete} className={`p-2 rounded-lg transition-colors ${inUseCount > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-30' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}><Icon name="delete" size={18} /></button>
          )}
        </div>
      </div>
    </Card>
  );
};