import { useEffect, useState, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Button, Toast, Subtitle } from '../styles/StyledElements';
import { PlantInstanceCard } from './PlantInstanceCard';

interface ZoneDetailProps {
  zone?: Zone;
  initialAction: string | null;
  locations: Location[];
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  onBatchWaterZone: (zoneId: string) => void;
  onBatchFeedZone: (zoneId: string) => void;
  onNavigate: (qrId: string) => void;
  onGoHome: () => void;
  onClearAction: () => void;
}

export const ZoneDetail: FC<ZoneDetailProps> = ({ 
  zone, initialAction, locations, instances, archetypes, onBatchWaterZone, onBatchFeedZone, onNavigate, onGoHome, onClearAction 
}) => {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // "Zero-Click" Action Handling for entire zones
  useEffect(() => {
    if (zone && locations.length > 0 && initialAction === 'water') {
      onBatchWaterZone(zone.id);
      showToast('💦 Entire zone watered successfully!');
      window.history.replaceState({}, '', `/zone/${zone.id}`);
      onClearAction();
    } else if (zone && locations.length > 0 && initialAction === 'feed') {
      onBatchFeedZone(zone.id);
      showToast('🪴 Entire zone fed successfully!');
      window.history.replaceState({}, '', `/zone/${zone.id}`);
      onClearAction();
    }
  }, [locations.length, initialAction, zone, onBatchWaterZone, onBatchFeedZone, onClearAction]);

  if (!zone) {
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg">
          <div className="text-5xl mb-4">🤷</div>
          <Title>Unknown Zone</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-2">
            Zone does not exist in your database.
          </p>
        </Card>
        <Button variant="secondary" onClick={onGoHome} className="mt-2">Go Back</Button>
      </Container>
    );
  }

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <header className="mb-6 flex items-center gap-3 pt-6">
        <button onClick={onGoHome} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
          &larr;
        </button>
        <div>
          <Title className="!mb-0">{zone.name}</Title>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">Macro Zone</p>
        </div>
      </header>

      <Card className="flex flex-col items-center pb-8 mb-6 relative overflow-hidden !px-0 !pt-0">
        {zone.imageUrl ? (
          <img src={zone.imageUrl} alt={zone.name} className="w-full h-48 object-cover mb-6 bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mb-6"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          {zone.description && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 italic text-center leading-relaxed">"{zone.description}"</p>
          )}
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{instances.length} active plant{instances.length !== 1 ? 's' : ''} across {locations.length} locations.</p>
          <div className="w-full flex gap-3 px-2">
            <Button onClick={() => { onBatchWaterZone(zone.id); showToast('💦 Entire zone watered!'); }}>💦 Water Zone</Button>
            <Button variant="secondary" onClick={() => { onBatchFeedZone(zone.id); showToast('🪴 Entire zone fed!'); }}>🪴 Feed Zone</Button>
          </div>
        </div>
      </Card>

      <Subtitle>Plants in {zone.name}</Subtitle>
      <div className="space-y-3">
        {instances.length === 0 ? (
           <p className="text-sm text-slate-500 italic mt-4">No plants currently assigned to this zone.</p>
        ) : (
          instances.map(item => {
            const archetype = archetypes.find(a => a.id === item.archetypeId);
            const itemLocation = locations.find(l => l.id === item.locationId);

            return (
              <PlantInstanceCard 
                key={item.qrId}
                instance={item}
                archetype={archetype}
                locationName={itemLocation?.name}
                zoneModifier={zone?.evaporationModifier}
                onClick={() => onNavigate(item.qrId)}
              />
            );
          })
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};