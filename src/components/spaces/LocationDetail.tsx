import { useEffect, useState, FC } from 'react';
import { Container, Title, Card, Button, Toast, Subtitle, Input } from '../../styles/StyledElements';
import { PlantInstanceCard } from '../inventory/PlantInstanceCard';
import { PageHeader } from '../common/PageHeader';
import { LocationJournal } from './LocationJournal';
import { hasPermission } from '../../utils/permissions';
import { ActionControlStrip } from '../common/ActionControlStrip';
import { useGarden } from '../../contexts/GardenContext';
import { Icon } from '../common/Icon';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface LocationDetailProps {
  locationId: string;
  initialAction: string | null;
  onNavigate: (qrId: string) => void;
  onNavigateZone: (zoneName: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
}

export const LocationDetail: FC<LocationDetailProps> = ({ 
  locationId, initialAction, onNavigate, onNavigateZone, onGoBack, onOpenMenu, onClearAction
}) => {
  const { locations, zones, instances, archetypes, gardenJournal, onRegisterLocation, onUpdateLocation, onBatchWaterLocation, onBatchFeedLocation, currentUser } = useGarden();
  const location = locations.find(l => l.id === locationId);
  const zone = location ? zones.find(z => z.id === location.zoneId) : undefined;
  const locationInstances = instances.filter(i => i.locationId === locationId);

  const [toastMessage, setToastMessage] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocZone, setNewLocZone] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // "Zero-Click" Action Handling for entire locations
  useEffect(() => {
    if (location && initialAction === 'water') {
      onBatchWaterLocation(locationId);
      showToast('💦 All plants watered successfully!');
      window.history.replaceState({ internal: true }, '', `/location/${locationId}`);
      onClearAction();
    } else if (location && initialAction === 'feed') {
      onBatchFeedLocation(locationId);
      showToast('🪴 All plants fed successfully!');
      window.history.replaceState({ internal: true }, '', `/location/${locationId}`);
      onClearAction();
    }
  }, [location, initialAction, locationId, onBatchWaterLocation, onBatchFeedLocation, onClearAction]);

  const currentUserId = currentUser?.id || '';
  const userPins = (location?.pinnedActions && !Array.isArray(location.pinnedActions)) ? (location.pinnedActions[currentUserId] || []) : [];

  const handlePinToggle = (action: string) => {
    if (!location) return;
    const newPins = userPins.includes(action) ? userPins.filter(a => a !== action) : [...userPins, action];
    const existingPins = (location.pinnedActions && !Array.isArray(location.pinnedActions)) ? location.pinnedActions : {};
    onUpdateLocation(location.id, { pinnedActions: { ...existingPins, [currentUserId]: newPins } });
  };

  if (!location) {
    if (!hasPermission(currentUser, 'perform_actions')) {
      return (
        <Container className="flex flex-col justify-center animate-in fade-in duration-500">
          <Card className="text-center py-10 shadow-lg border-primary-500">
            <div className="mb-4 flex justify-center text-primary-500 dark:text-primary-400">
              <Icon name="map-pin" size={48} />
            </div>
            <Title>Unassigned Tag</Title>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-2">
              Tag <strong className="text-primary-700 dark:text-primary-400 font-semibold">{locationId}</strong> is unassigned. Viewers do not have permission to register new locations.
            </p>
          </Card>
        </Container>
      );
    }
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg border-primary-500">
          <div className="mb-4 flex justify-center text-primary-500 dark:text-primary-400">
            <Icon name="map-pin" size={48} />
          </div>
          <Title>New Location Tag</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-2">
            Tag <strong className="text-primary-700 dark:text-primary-400 font-semibold">{locationId}</strong> is unassigned.
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
              <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={newLocZone} onChange={e => setNewLocZone(e.target.value)} required>
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

  const totalJournalCount = (location?.journal?.length || 0) + (zone?.journal?.length || 0) + (gardenJournal?.length || 0);

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader 
        title={location.name}
        subtitle={
          <span 
            className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 underline decoration-dotted underline-offset-2"
            onClick={() => zone && onNavigateZone(zone.id)}
          >
            {zone?.name}
          </span>
        }
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
      />

      <Card className="flex flex-col items-center pb-8 mb-6 relative overflow-hidden !px-0 !pt-0">
        {location.imageUrl ? (
          <img src={location.imageUrl} alt={location.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-48 object-cover mb-6 bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 mb-6"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{locationInstances.length} active plant{locationInstances.length !== 1 ? 's' : ''} in this location.</p>
          {currentUser?.workspaceRole !== 'viewer' && (
            <div className="w-full flex gap-3 px-2 mb-6">
              <Button onClick={() => { onBatchWaterLocation(locationId); showToast('💦 All plants watered!'); }} className="flex items-center justify-center gap-2"><Icon name="water" size={18} /> Water All</Button>
              <Button $variant="secondary" onClick={() => { onBatchFeedLocation(locationId); showToast('🪴 All plants fed!'); }} className="flex items-center justify-center gap-2"><Icon name="feed" size={18} /> Feed All</Button>
            </div>
          )}
          
          <ActionControlStrip 
            userPins={userPins}
            onPinToggle={handlePinToggle}
            targetId={locationId}
            targetType="location"
            targetTitle={location.name}
            targetSubtitle={zone?.name || ''}
            showToast={showToast}
          />
        </div>
      </Card>

      <Subtitle>Plants in {location.name}</Subtitle>
      <div className="space-y-3">
        {locationInstances.length === 0 ? (
           <p className="text-sm text-slate-500 italic mt-4">No plants currently assigned to this location.</p>
        ) : (
          locationInstances.map(item => {
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

      <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-6 mb-4">
        <button onClick={() => toggleSection('journal')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
          <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Location Journal <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({totalJournalCount})</span>
          </Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('journal') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSections.includes('journal') && (
          <LocationJournal 
            location={location} 
            onUpdate={(updates) => onUpdateLocation(location.id, updates)} 
            showToast={showToast} 
            currentUser={currentUser}
          />
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};