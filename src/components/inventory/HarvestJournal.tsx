import { FC } from 'react';
import { Harvest } from '../../../types';
import { Card } from '../../styles/StyledElements';
import { Icon, IconName } from '../common/Icon';

interface HarvestJournalProps {
  harvests: Harvest[];
}

const getQualityIcon = (quality: Harvest['quality']): IconName => {
  switch (quality) {
    case 'Excellent': return 'award';
    case 'Good': return 'thumbs-up';
    case 'Fair': return 'meh';
    case 'Poor': return 'thumbs-down';
    default: return 'harvest';
  }
};

export const HarvestJournal: FC<HarvestJournalProps> = ({ harvests }) => {
  if (!harvests || harvests.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No harvests have been recorded for this plant yet.</p>
      </Card>
    );
  }

  const sortedHarvests = [...harvests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <ul className="space-y-4">
        {sortedHarvests.map(h => (
          <li key={h.id} className="flex gap-4 items-start text-sm border-b border-slate-100 dark:border-slate-800 last:border-0 pb-3 last:pb-0">
            <span className="flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 rounded-full w-8 h-8 flex-shrink-0 text-primary-600 dark:text-primary-400 mt-0.5"><Icon name={getQualityIcon(h.quality)} size={16} /></span>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{new Date(h.date).toLocaleDateString()} - {h.yieldAmount} {h.yieldUnit} ({h.quality})</p>
              {h.notes && <p className="text-slate-600 dark:text-slate-400 italic mt-1">{h.notes}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};