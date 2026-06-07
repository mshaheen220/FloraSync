import { useEffect, useState, useMemo, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone, PrintQueueItem } from '../../../types';
import { Container, Title, Card, Button, Toast, Subtitle, Input } from '../../styles/StyledElements';
import { PlantInstanceCard } from '../inventory/PlantInstanceCard';
import { PageHeader } from '../common/PageHeader';
import { User } from '../../App';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface ZoneDetailProps {
  zoneId: string;
  zone?: Zone;
  initialAction: string | null;
  locations: Location[];
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  onRegisterZone: (id: string, name: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onBatchWaterZone: (zoneId: string) => void;
  onBatchFeedZone: (zoneId: string) => void;
  onNavigate: (qrId: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
  onQueuePrint?: (targetId: string, type: 'plant' | 'location' | 'zone', title: string, subtitle: string, action?: 'none' | 'water' | 'feed') => void;
  currentUser?: User;
  printQueue?: PrintQueueItem[];
}

export const ZoneDetail: FC<ZoneDetailProps> = ({ 
  zoneId, zone, initialAction, locations, instances, archetypes, onRegisterZone, onUpdateZone, onBatchWaterZone, onBatchFeedZone, onNavigate, onGoBack, onOpenMenu, onClearAction, onQueuePrint, currentUser, printQueue
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<string[]>([]);
  const [newZoneName, setNewZoneName] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggleLocation = (locName: string) => {
    setExpandedLocations(prev => 
      prev.includes(locName)
        ? prev.filter(l => l !== locName)
        : [...prev, locName]
    );
  };

  const groupedInstances = useMemo(() => {
    const groups = instances.reduce((acc, inst) => {
      const loc = locations.find(l => l.id === inst.locationId);
      const locName = loc ? loc.name : 'Unassigned Location';
      if (!acc[locName]) acc[locName] = [];
      acc[locName].push(inst);
      return acc;
    }, {} as Record<string, PlantInstance[]>);

    const sortedLocations = Object.keys(groups).sort();
    sortedLocations.forEach(loc => {
      groups[loc].sort((a, b) => {
        const archA = archetypes.find(ar => ar.id === a.archetypeId);
        const archB = archetypes.find(ar => ar.id === b.archetypeId);
        return (archA?.commonName || '').localeCompare(archB?.commonName || '');
      });
    });

    return { groups, sortedLocations };
  }, [instances, locations, archetypes]);

  // "Zero-Click" Action Handling for entire zones
  useEffect(() => {
    if (zone && locations.length > 0 && initialAction === 'water') {
      onBatchWaterZone(zone.id);
      showToast('💦 Entire zone watered successfully!');
      window.history.replaceState({ internal: true }, '', `/zone/${zone.id}`);
      onClearAction();
    } else if (zone && locations.length > 0 && initialAction === 'feed') {
      onBatchFeedZone(zone.id);
      showToast('🪴 Entire zone fed successfully!');
      window.history.replaceState({ internal: true }, '', `/zone/${zone.id}`);
      onClearAction();
    }
  }, [locations.length, initialAction, zone, onBatchWaterZone, onBatchFeedZone, onClearAction]);

  const currentUserId = currentUser?.id || '';
  const userPins = (zone?.pinnedActions && !Array.isArray(zone.pinnedActions)) 
    ? (zone.pinnedActions[currentUserId] || []) 
    : (zone?.isPinned ? ['water'] : []);

  const handlePinToggle = (action: string) => {
    if (!zone) return;
    const newPins = userPins.includes(action) ? userPins.filter(a => a !== action) : [...userPins, action];
    const existingPins = (zone.pinnedActions && !Array.isArray(zone.pinnedActions)) ? zone.pinnedActions : {};
    onUpdateZone(zone.id, { pinnedActions: { ...existingPins, [currentUserId]: newPins }, isPinned: false });
  };

  if (!zone) {
    if (currentUser?.workspaceRole === 'viewer') {
      return (
        <Container className="flex flex-col justify-center animate-in fade-in duration-500">
          <Card className="text-center py-10 shadow-lg border-emerald-500">
            <div className="text-5xl mb-4">🌍</div>
            <Title>Unassigned Tag</Title>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-2">
              Tag <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{zoneId}</strong> is unassigned. Viewers do not have permission to register new zones.
            </p>
          </Card>
        </Container>
      );
    }
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg border-emerald-500">
          <div className="text-5xl mb-4">🌍</div>
          <Title>New Zone Tag</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-2">
            Tag <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{zoneId}</strong> is unassigned.
            What is the name of this macro zone?
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!newZoneName) return;
            onRegisterZone(zoneId, newZoneName);
            showToast('🌍 Zone registered!');
          }} className="flex flex-col gap-3 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Zone Name</label>
              <Input placeholder="e.g. Greenhouse" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} className="!mb-0 py-2.5" required />
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
        title={zone.name} 
        subtitle="Macro Zone" 
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
      />

      <Card className="flex flex-col items-center pb-8 mb-6 relative overflow-hidden !px-0 !pt-0">
        {zone.imageUrl ? (
          <img src={zone.imageUrl} alt={zone.name} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-48 object-cover mb-6 bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mb-6"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          {zone.description && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 italic text-center leading-relaxed">"{zone.description}"</p>
          )}
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{instances.length} active plant{instances.length !== 1 ? 's' : ''} across {locations.length} locations.</p>
          {currentUser?.workspaceRole !== 'viewer' && (
            <div className="w-full flex flex-col gap-3 px-2">
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => { onBatchWaterZone(zone.id); showToast('💦 Entire zone watered!'); }}>💦 Water Zone</Button>
                <Button className="flex-1" $variant="secondary" onClick={() => { onBatchFeedZone(zone.id); showToast('🪴 Entire zone fed!'); }}>🪴 Feed Zone</Button>
              </div>
            </div>
          )}

          {(currentUser?.workspaceRole !== 'viewer' || currentUser?.role === 'god-admin') && (
            <div className="w-full flex flex-col gap-2 mt-6 px-1">
              {currentUser?.workspaceRole !== 'viewer' && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">📌 Pin to Dash</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => handlePinToggle('water')} className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${userPins.includes('water') ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>💦 Water</button>
                    <button onClick={() => handlePinToggle('feed')} className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${userPins.includes('feed') ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>🪴 Feed</button>
                    <button onClick={() => handlePinToggle('navigate')} className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${userPins.includes('navigate') ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>👁️ Nav</button>
                  </div>
                </div>
              )}
              
              {(currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner') && onQueuePrint && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">🖨️ Print Queue</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => { const q = printQueue?.some(q => q.targetId === zone.id && q.action === 'none'); onQueuePrint(zone.id, 'zone', zone.name, 'Macro Area', 'none'); showToast(q ? '❌ Removed Info Tag from Queue' : '🛒 Added Info Tag to Queue'); }} className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${printQueue?.some(q => q.targetId === zone.id && q.action === 'none') ? 'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800'}`}>ℹ️ Info</button>
                    <button onClick={() => { const q = printQueue?.some(q => q.targetId === zone.id && q.action === 'water'); onQueuePrint(zone.id, 'zone', `Water ${zone.name}`, 'Macro Area', 'water'); showToast(q ? '❌ Removed Water Tag from Queue' : '🛒 Added Water Tag to Queue'); }} className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${printQueue?.some(q => q.targetId === zone.id && q.action === 'water') ? 'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800'}`}>💦 Water</button>
                    <button onClick={() => { const q = printQueue?.some(q => q.targetId === zone.id && q.action === 'feed'); onQueuePrint(zone.id, 'zone', `Feed ${zone.name}`, 'Macro Area', 'feed'); showToast(q ? '❌ Removed Feed Tag from Queue' : '🛒 Added Feed Tag to Queue'); }} className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${printQueue?.some(q => q.targetId === zone.id && q.action === 'feed') ? 'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800'}`}>🪴 Feed</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Subtitle className="!mb-0">Plants in {zone.name}</Subtitle>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">(grouped by Location)</p>
      <div className="space-y-4">
        {instances.length === 0 ? (
           <p className="text-sm text-slate-500 italic mt-4">No plants currently assigned to this zone.</p>
        ) : (
          groupedInstances.sortedLocations.map(locName => (
            <div key={locName} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
              <button 
                onClick={() => toggleLocation(locName)}
                className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
              >
                <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {locName} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedInstances.groups[locName].length})</span>
                </Subtitle>
                <span className={`text-slate-400 transition-transform duration-200 ${expandedLocations.includes(locName) ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {expandedLocations.includes(locName) && (
                <div className="space-y-3 mb-4">
                  {groupedInstances.groups[locName].map(item => {
                    const archetype = archetypes.find(a => a.id === item.archetypeId);
                    return (
                      <PlantInstanceCard 
                        key={item.qrId}
                        instance={item}
                        archetype={archetype}
                        locationName={locName}
                        zoneModifier={zone?.evaporationModifier}
                        onClick={() => onNavigate(item.qrId)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};