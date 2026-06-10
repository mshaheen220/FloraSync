import { FC } from 'react';
import { Location, Zone } from '../../../../types';
import { Subtitle, Button } from '../../../styles/StyledElements';
import { User } from '../../../App';
import { Icon } from '../../common/Icon';

interface UrgentLocationCareProps {
  overdueLocations: Location[];
  zones: Zone[];
  currentUser: User;
  onBatchWater: (locationId: string) => void;
}

export const UrgentLocationCare: FC<UrgentLocationCareProps> = ({ overdueLocations, zones, currentUser, onBatchWater }) => {
  if (overdueLocations.length === 0 || currentUser?.workspaceRole === 'viewer') return null;

  return (
    <section className="mb-8 animate-in fade-in duration-500 delay-300">
      <Subtitle>Urgent Location Care</Subtitle>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {overdueLocations.map(loc => {
          const zone = zones.find(z => z.id === loc.zoneId);
          return (
            <Button key={loc.id} $variant="batch" onClick={() => onBatchWater(loc.id)} className="whitespace-nowrap flex-shrink-0 w-auto px-5 flex items-center gap-2">
              <Icon name="water" size={16} /> Water all on {zone ? `${zone.name} • ` : ''}{loc.name}
            </Button>
          );
        })}
      </div>
    </section>
  );
};