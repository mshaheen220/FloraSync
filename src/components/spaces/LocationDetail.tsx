import { useEffect, useState, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../../types';
import { Container, Title, Card, Button, Toast, Subtitle, Input } from '../../styles/StyledElements';
import { PlantInstanceCard } from '../inventory/PlantInstanceCard';
import { PageHeader } from '../common/PageHeader';
import { User } from '../../App';

interface LocationDetailProps {
  locationId: string;
  initialAction: string | null;
  location?: Location;
  zone?: Zone;
  zones: Zone[];
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  onRegisterLocation: (id: string, name: string, zoneId: string) => void;
  onUpdateLocation?: (id: string, updates: Partial<Location>) => void;
  onBatchWater: (locationId: string) => void;
  onBatchFeed: (locationId: string) => void;
  onNavigate: (qrId: string) => void;
  onNavigateZone: (zoneName: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
  currentUser?: User;
}

export const LocationDetail: FC<LocationDetailProps> = ({ 
  locationId, initialAction, location, zone, zones, instances, archetypes, onRegisterLocation, onUpdateLocation, onBatchWater, onBatchFeed, onNavigate, onNavigateZone, onGoBack, onOpenMenu, onClearAction, currentUser 
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocZone, setNewLocZone] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // "Zero-Click" Action Handling for entire locations
  useEffect(() => {
    if (location && initialAction === 'water') {
      onBatchWater(locationId);
      showToast('💦 All plants watered successfully!');
      window.history.replaceState({ internal: true }, '', `/location/${locationId}`);
      onClearAction();
    } else if (location && initialAction === 'feed') {
      onBatchFeed(locationId);
      showToast('🪴 All plants fed successfully!');
      window.history.replaceState({ internal: true }, '', `/location/${locationId}`);
      onClearAction();
    }
  }, [location, initialAction, locationId, onBatchWater, onBatchFeed, onClearAction]);

  const currentUserId = currentUser?.id || '';
  const userPins = (location?.pinnedActions && !Array.isArray(location.pinnedActions)) ? (location.pinnedActions[currentUserId] || []) : [];

  const handlePinToggle = (action: string) => {
    if (!location || !onUpdateLocation) return;
    const newPins = userPins.includes(action) ? userPins.filter(a => a !== action) : [...userPins, action];
    const existingPins = (location.pinnedActions && !Array.isArray(location.pinnedActions)) ? location.pinnedActions : {};
    onUpdateLocation(location.id, { pinnedActions: { ...existingPins, [currentUserId]: newPins } });
  };

  if (!location) {
    if (currentUser?.workspaceRole === 'viewer') {
      return (
        <Container className="flex flex-col justify-center animate-in fade-in duration-500">
          <Card className="text-center py-10 shadow-lg border-emerald-500">
            <div className="text-5xl mb-4">📍</div>
            <Title>Unassigned Tag</Title>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-2">
              Tag <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{locationId}</strong> is unassigned. Viewers do not have permission to register new locations.
            </p>
          </Card>
        </Container>
      );
    }
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg border-emerald-500">
          <div className="text-5xl mb-4">📍</div>
          <Title>New Location Tag</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-2">
            Tag <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{locationId}</strong> is unassigned.
            Where is this located?
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!newLocName || !newLocZone) return;
            onRegisterLocation(locationId, newLocName, newLocZone);
            showToast('📍 Location registered!');
          }} className="flex flex-col gap-3 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Zone</label>
              <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={newLocZone} onChange={e => setNewLocZone(e.target.value)} required>
                <option value="" disabled>Select a zone...</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Location Name</label>
              <Input placeholder="e.g. Top Shelf" value={newLocName} onChange={e => setNewLocName(e.target.value)} className="!mb-0 py-2.5" required />
            </div>
            <div className="flex gap-2 mt-4">
            <Button type="button" $variant="secondary" onClick={onGoBack}>Cancel</Button>
              <Button type="submit">Register</Button>
            </div>
          </form>
        </Card>
        <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
      </Container>
    );
  }

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader 
        title={location.name}
        subtitle={
          <span 
            className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted underline-offset-2"
            onClick={() => zone && onNavigateZone(zone.id)}
          >
            {zone?.name}
          </span>
        }
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
      />

      <Card className="flex flex-col items-center py-6 mb-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{instances.length} active plant{instances.length !== 1 ? 's' : ''} in this location.</p>
        {currentUser?.workspaceRole !== 'viewer' && (
          <div className="w-full flex gap-3 px-2">
            <Button onClick={() => { onBatchWater(locationId); showToast('💦 All plants watered!'); }}>💦 Water All</Button>
            <Button $variant="secondary" onClick={() => { onBatchFeed(locationId); showToast('🪴 All plants fed!'); }}>🪴 Feed All</Button>
          </div>
        )}
        
        {currentUser?.workspaceRole !== 'viewer' && onUpdateLocation && (
          <div className="w-full flex flex-col gap-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 px-2">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">📌 Pin to Dashboard</p>
            <div className="flex gap-2">
              <Button 
                $variant="secondary" 
                className={`flex-1 !py-2 !text-xs transition-colors ${userPins.includes('water') ? '!bg-amber-100 !text-amber-800 !border-amber-200 dark:!bg-amber-900/30 dark:!text-amber-400 dark:!border-amber-800' : ''}`}
                onClick={() => handlePinToggle('water')}
              >💦 Water</Button>
              <Button 
                $variant="secondary" 
                className={`flex-1 !py-2 !text-xs transition-colors ${userPins.includes('feed') ? '!bg-amber-100 !text-amber-800 !border-amber-200 dark:!bg-amber-900/30 dark:!text-amber-400 dark:!border-amber-800' : ''}`}
                onClick={() => handlePinToggle('feed')}
              >🪴 Feed</Button>
              <Button 
                $variant="secondary" 
                className={`flex-1 !py-2 !text-xs transition-colors ${userPins.includes('navigate') ? '!bg-amber-100 !text-amber-800 !border-amber-200 dark:!bg-amber-900/30 dark:!text-amber-400 dark:!border-amber-800' : ''}`}
                onClick={() => handlePinToggle('navigate')}
              >👁️ Navigate</Button>
            </div>
          </div>
        )}
      </Card>

      <Subtitle>Plants in {location.name}</Subtitle>
      <div className="space-y-3">
        {instances.length === 0 ? (
           <p className="text-sm text-slate-500 italic mt-4">No plants currently assigned to this location.</p>
        ) : (
          instances.map(item => {
            const archetype = archetypes.find(a => a.id === item.archetypeId);

            return (
              <PlantInstanceCard 
                key={item.qrId}
                instance={item}
                archetype={archetype}
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