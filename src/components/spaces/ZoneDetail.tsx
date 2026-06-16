import { useEffect, useState, useMemo, FC } from 'react';
import { Container, Title, Card, Button, Toast, Subtitle, Input } from '../../styles/StyledElements';
import { PlantInstanceCard } from '../inventory/PlantInstanceCard';
import { PageHeader } from '../common/PageHeader';
import { ZoneJournal } from './ZoneJournal';
import { ActionControlStrip } from '../common/ActionControlStrip';
import { useGarden } from '../../contexts/GardenContext';
import { hasPermission } from '../../utils/permissions';
import { Icon } from '../common/Icon';
import { FeedActionModal } from '../common/FeedActionModal';
import { FEED_PROFILE_LABELS } from '../../utils/constants';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface ZoneDetailProps {
  zoneId: string;
  initialAction: string | null;
  onNavigate: (qrId: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
}

export const ZoneDetail: FC<ZoneDetailProps> = ({ 
  zoneId, initialAction, onNavigate, onGoBack, onOpenMenu, onClearAction
}) => {
  const { zones, locations, instances, archetypes, gardenJournal, onRegisterZone, onUpdateZone, onBatchWaterZone, onBatchFeedZone, currentUser } = useGarden();
  const zone = zones.find(z => z.id === zoneId);
  const zoneLocations = locations.filter(l => l.zoneId === zoneId);
  const zoneLocIds = zoneLocations.map(l => l.id);
  const zoneInstances = instances.filter(i => zoneLocIds.includes(i.locationId));

  const [toastMessage, setToastMessage] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const groupedInstances = useMemo(() => {
    const groups = zoneInstances.reduce((acc, inst) => {
      const loc = locations.find(l => l.id === inst.locationId);
      const locName = loc ? loc.name : 'Unassigned Location';
      if (!acc[locName]) acc[locName] = [];
      acc[locName].push(inst);
      return acc;
    }, {} as Record<string, typeof zoneInstances>);

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

  // Calculate the most prominent nutrient profile based on all plants and locations in this zone
  const recommendedProfile = useMemo(() => {
    const counts: Record<string, number> = {};
    let best: any = 'GENERAL_FEED';
    let max = 0;
    zoneInstances.forEach(inst => {
      if (inst.untracked) return;
      const loc = locations.find(l => l.id === inst.locationId);
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      const p = loc?.activeNutrientProfile || arch?.preferredNutrientProfile || 'GENERAL_FEED';
      counts[p] = (counts[p] || 0) + 1;
      if (counts[p] > max) { max = counts[p]; best = p; }
    });
    return best;
  }, [zoneInstances, archetypes, locations]);

  // "Zero-Click" Action Handling for entire zones
  useEffect(() => {
    if (zone && zoneLocations.length > 0 && initialAction === 'water') {
      onBatchWaterZone(zone.id);
      showToast('💦 Entire zone watered successfully!');
      window.history.replaceState({ internal: true }, '', `/zone/${zone.id}`);
      onClearAction();
    } else if (zone && zoneLocations.length > 0 && initialAction === 'feed') {
      onBatchFeedZone(zone.id, recommendedProfile);
      showToast('🪴 Entire zone fed successfully!');
      window.history.replaceState({ internal: true }, '', `/zone/${zone.id}`);
      onClearAction();
    }
  }, [zoneLocations.length, initialAction, zone, recommendedProfile, onBatchWaterZone, onBatchFeedZone, onClearAction]);

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
    if (!hasPermission(currentUser, 'perform_actions')) {
      return (
        <Container className="flex flex-col justify-center animate-in fade-in duration-500">
          <Card className="text-center py-10 shadow-lg border-primary-500">
            <div className="mb-4 flex justify-center text-primary-500 dark:text-primary-400">
              <Icon name="globe" size={48} />
            </div>
            <Title>Unassigned Tag</Title>
            <p className="text-slate-500 dark:text-slate-400 text-sm px-2">
              Tag <strong className="text-primary-700 dark:text-primary-400 font-semibold">{zoneId}</strong> is unassigned. Viewers do not have permission to register new zones.
            </p>
          </Card>
        </Container>
      );
    }
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg border-primary-500">
          <div className="mb-4 flex justify-center text-primary-500 dark:text-primary-400">
            <Icon name="globe" size={48} />
          </div>
          <Title>New Zone Tag</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 px-2">
            Tag <strong className="text-primary-700 dark:text-primary-400 font-semibold">{zoneId}</strong> is unassigned.
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

  const totalJournalCount = (zone.journal?.length || 0) + (gardenJournal?.length || 0);

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
          <div className="w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 mb-6"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          {zone.description && (
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 italic text-center leading-relaxed">"{zone.description}"</p>
          )}
          <div className="flex flex-col items-center gap-1 mb-6">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{zoneInstances.length} active plant{zoneInstances.length !== 1 ? 's' : ''} across {zoneLocations.length} locations.</p>
            {zone.isCovered && <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1"><Icon name="umbrella" size={12} /> Covered Area</span>}
          </div>
          {currentUser?.workspaceRole !== 'viewer' && (
            <div className="w-full flex flex-col gap-3 px-2">
              <div className="flex gap-3">
                <Button className="flex-1 flex items-center justify-center gap-2" onClick={() => { onBatchWaterZone(zone.id); showToast('💦 Entire zone watered!'); }}><Icon name="water" size={18} /> Water Zone</Button>
                <Button className="flex-1 flex items-center justify-center gap-2" $variant="secondary" onClick={() => setIsFeedModalOpen(true)}><Icon name="feed" size={18} /> Feed Zone</Button>
              </div>
            </div>
          )}

          <ActionControlStrip 
            userPins={userPins}
            onPinToggle={handlePinToggle}
            targetId={zone.id}
            targetType="zone"
            targetTitle={zone.name}
            targetSubtitle="Macro Area"
            showToast={showToast}
          />
        </div>
      </Card>

      <Subtitle className="!mb-0">Plants in {zone.name}</Subtitle>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">(grouped by Location)</p>
      <div className="space-y-4">
        {zoneInstances.length === 0 ? (
           <p className="text-sm text-slate-500 italic mt-4">No plants currently assigned to this zone.</p>
        ) : (
          groupedInstances.sortedLocations.map(locName => (
            <div key={locName} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
              <button 
                onClick={() => toggleLocation(locName)}
                className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
              >
                <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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

      <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-6 mb-4">
        <button onClick={() => toggleSection('journal')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
          <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Zone Journal <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({totalJournalCount})</span>
          </Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('journal') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSections.includes('journal') && (
          <ZoneJournal 
            zone={zone} 
            onUpdate={(updates) => onUpdateZone(zone.id, updates)} 
            showToast={showToast} 
            currentUser={currentUser}
          />
        )}
      </div>
      <FeedActionModal 
        isOpen={isFeedModalOpen} 
        defaultProfile={recommendedProfile}
        showRecommendationHint={true}
        onClose={() => setIsFeedModalOpen(false)} 
        onConfirm={(feedType, feedAmount) => { 
          onBatchFeedZone(zone.id, feedType, feedAmount); 
          setIsFeedModalOpen(false); 
          showToast(`🪴 Entire zone fed with ${FEED_PROFILE_LABELS[feedType] || feedType}!`); 
        }} 
      />
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};