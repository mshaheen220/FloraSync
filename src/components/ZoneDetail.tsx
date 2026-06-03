import { useEffect, useState, useMemo, FC } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Button, Toast, Subtitle, MenuButton } from '../styles/StyledElements';
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
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
}

export const ZoneDetail: FC<ZoneDetailProps> = ({ 
  zone, initialAction, locations, instances, archetypes, onBatchWaterZone, onBatchFeedZone, onNavigate, onGoBack, onOpenMenu, onClearAction 
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<string[]>([]);

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
        <Button variant="secondary" onClick={onGoBack} className="mt-2">Go Back</Button>
      </Container>
    );
  }

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <header className="mb-6 flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
          </button>
          <div>
            <Title className="!mb-0">{zone.name}</Title>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">Macro Zone</p>
          </div>
        </div>
        <MenuButton onClick={onOpenMenu}>
          ☰
        </MenuButton>
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