import { useEffect, useState, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Button, StatusBadge, Toast, Subtitle, ProgressBarContainer, ProgressBarFill } from '../styles/StyledElements';

interface LocationDetailProps {
  locationId: string;
  initialAction: string | null;
  location?: Location;
  zone?: Zone;
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  onBatchWater: (locationId: string) => void;
  onBatchFeed: (locationId: string) => void;
  onNavigate: (qrId: string) => void;
  onNavigateZone: (zoneName: string) => void;
  onGoHome: () => void;
  onClearAction: () => void;
}

export const LocationDetail: FC<LocationDetailProps> = ({ 
  locationId, initialAction, location, zone, instances, archetypes, onBatchWater, onBatchFeed, onNavigate, onNavigateZone, onGoHome, onClearAction 
}) => {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // "Zero-Click" Action Handling for entire locations
  useEffect(() => {
    if (location && initialAction === 'water') {
      onBatchWater(locationId);
      showToast('💦 All plants watered successfully!');
      window.history.replaceState({}, '', `/location/${locationId}`);
      onClearAction();
    } else if (location && initialAction === 'feed') {
      onBatchFeed(locationId);
      showToast('🪴 All plants fed successfully!');
      window.history.replaceState({}, '', `/location/${locationId}`);
      onClearAction();
    }
  }, [location, initialAction, locationId, onBatchWater, onBatchFeed, onClearAction]);

  if (!location) {
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg">
          <div className="text-5xl mb-4">🤷</div>
          <Title>Unknown Location</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-2">
            Location <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{locationId}</strong> does not exist in your database.
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
          <Title className="!mb-0">{location.name}</Title>
          <p 
            className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted underline-offset-2"
            onClick={() => zone && onNavigateZone(zone.id)}
          >
            {zone?.name}
          </p>
        </div>
      </header>

      <Card className="flex flex-col items-center py-6 mb-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{instances.length} active plant{instances.length !== 1 ? 's' : ''} in this location.</p>
        <div className="w-full flex gap-3 px-2">
          <Button onClick={() => { onBatchWater(locationId); showToast('💦 All plants watered!'); }}>💦 Water All</Button>
          <Button variant="secondary" onClick={() => { onBatchFeed(locationId); showToast('🪴 All plants fed!'); }}>🪴 Feed All</Button>
        </div>
      </Card>

      <Subtitle>Plants in {location.name}</Subtitle>
      <div className="space-y-3">
        {instances.length === 0 ? (
           <p className="text-sm text-slate-500 italic mt-4">No plants currently assigned to this location.</p>
        ) : (
          instances.map(item => {
            const archetype = archetypes.find(a => a.id === item.archetypeId);
            const intervalMs = (archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000;
            const ratio = Math.max(0, 1 - ((new Date().getTime() - new Date(item.lastWatered).getTime()) / intervalMs));
            const isOverdue = ratio <= 0;

            return (
              <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 !p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{archetype?.commonName}</h3>
                  <StatusBadge status={isOverdue ? 'overdue' : 'hydrated'}>
                    {isOverdue ? 'Overdue' : 'Hydrated'}
                  </StatusBadge>
                </div>
                <ProgressBarContainer>
                  <ProgressBarFill ratio={ratio} />
                </ProgressBarContainer>
              </Card>
            );
          })
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};