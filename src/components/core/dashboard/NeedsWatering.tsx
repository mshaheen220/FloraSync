import { FC } from 'react';
import { Subtitle, Card } from '../../../styles/StyledElements';
import { PlantInstanceCard } from '../../inventory/PlantInstanceCard';

interface NeedsWateringProps {
  overduePlants: any[];
  onNavigate: (qrId: string) => void;
}

export const NeedsWatering: FC<NeedsWateringProps> = ({ overduePlants, onNavigate }) => {
  return (
    <section>
      <Subtitle>💦 Needs Watering</Subtitle>
      {overduePlants.length === 0 ? (
        <Card className="text-center py-10">
          <div className="text-4xl mb-3">✨</div>
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