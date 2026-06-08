import { FC } from 'react';
import { Subtitle, Card } from '../../../styles/StyledElements';
import { PlantInstanceCard } from '../../inventory/PlantInstanceCard';
import { Icon } from '../../common/Icon';

interface NeedsWateringProps {
  overduePlants: any[];
  onNavigate: (qrId: string) => void;
}

export const NeedsWatering: FC<NeedsWateringProps> = ({ overduePlants, onNavigate }) => {
  return (
    <section>
      <Subtitle className="flex items-center gap-2"><Icon name="water" size={20} className="text-blue-500 dark:text-blue-400" /> Needs Watering</Subtitle>
      {overduePlants.length === 0 ? (
        <Card className="text-center py-10">
          <div className="flex justify-center mb-3 text-slate-300 dark:text-slate-600"><Icon name="sparkles" size={40} /></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">All plants are perfectly hydrated!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {overduePlants.map(item => (
            <PlantInstanceCard 
              key={item.qrId} 
              instance={item} 
              archetype={item.archetype} 
              locationName={item.location?.name} 
              zoneName={item.zone?.name} 
              zoneModifier={item.zone?.evaporationModifier}
              compact
              onClick={() => onNavigate(item.qrId)} 
            />
          ))}
        </div>
      )}
    </section>
  );
};