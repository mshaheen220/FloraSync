import { useEffect, useState, FC, FormEvent } from 'react';
import { Container, Title, Card, Button, StatusBadge, Input, Toast, Subtitle, MenuButton } from '../../styles/StyledElements';
import { PlantRegistrationForm } from './PlantRegistrationForm';
import { PlantJournal } from './PlantJournal';
import { ActionControlStrip } from '../common/ActionControlStrip';
import { useGarden } from '../../contexts/GardenContext';
import { Icon, IconName } from '../common/Icon';
import { FeedActionModal } from '../common/FeedActionModal';
import { NutrientProfileInfoModal } from '../common/NutrientProfileInfoModal';
import { apiFetch } from '../../utils/api';
import { FEED_PROFILE_LABELS } from '../../utils/constants';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

const getLocalDatetimeString = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

interface PlantDetailProps {
  qrId: string;
  initialAction: string | null;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
  onNavigateLocation: (locId: string) => void;
  onNavigateZone: (zoneName: string) => void;
}

export const PlantDetail: FC<PlantDetailProps> = ({ 
  qrId, initialAction, onGoBack, onOpenMenu, onClearAction, onNavigateLocation, onNavigateZone
}) => {
  const { instances, archetypes, locations, zones, gardenJournal, onWater, onFeed, onRegister, onUpdateInstance, onDeleteInstance, currentUser } = useGarden();

  const instance = instances.find(i => i.qrId === qrId);
  const archetype = instance ? archetypes.find(a => a.id === instance.archetypeId) : undefined;
  const location = instance ? locations.find(l => l.id === instance.locationId) : undefined;
  const zone = location ? zones.find(z => z.id === location.zoneId) : undefined;

  // Dynamically determine the correct terminology based on the plant's category
  const milestoneVerbPast = (() => {
    const cat = archetype?.category?.toLowerCase() || '';
    if (cat.includes('flower')) return 'Bloomed';
    if (cat.includes('foliage') || cat.includes('succulent') || cat.includes('houseplant')) return 'Matured';
    return 'Harvested';
  })();

  const milestoneVerbFuture = (() => {
    const cat = archetype?.category?.toLowerCase() || '';
    if (cat.includes('flower')) return 'Bloom';
    if (cat.includes('foliage') || cat.includes('succulent') || cat.includes('houseplant')) return 'Maturity';
    return 'Harvest';
  })();

  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ locationId: '', lastWatered: '', lastFed: '', datePlanted: '', dateHarvested: '', untracked: false });

  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isFeedModalOpen, setIsFeedModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

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

  useEffect(() => {
    if (instance) {
      setEditData({
        locationId: instance.locationId,
        lastWatered: getLocalDatetimeString(instance.lastWatered),
        lastFed: getLocalDatetimeString(instance.lastFed),
        datePlanted: getLocalDatetimeString(instance.datePlanted),
        dateHarvested: getLocalDatetimeString(instance.dateHarvested),
        untracked: instance.untracked || false
      });
    }
  }, [instance]);

  // 1. "Zero-Click" Action Handling: Instantly process URL params mapping physical scanning context to actions.
  useEffect(() => {
    if (instance && initialAction === 'water') {
      onWater(qrId);
      showToast('💦 Plant watered successfully!');
      window.history.replaceState({ internal: true }, '', `/plant/${qrId}`);
      onClearAction();
    } else if (instance && initialAction === 'feed') {
      onFeed(qrId);
      showToast('🪴 Plant fed successfully!');
      window.history.replaceState({ internal: true }, '', `/plant/${qrId}`);
      onClearAction();
    }
  }, [instance, initialAction, qrId, onWater, onFeed, onClearAction]);

  const handleManualWater = () => {
    onWater(qrId);
    showToast('💦 Plant watered successfully!');
  };

  const currentUserId = currentUser?.id || '';
  const userPins = (instance?.pinnedActions && !Array.isArray(instance.pinnedActions)) ? (instance.pinnedActions[currentUserId] || []) : [];

  const handlePinToggle = (action: string) => {
    if (!instance) return;
    const newPins = userPins.includes(action) ? userPins.filter(a => a !== action) : [...userPins, action];
    const existingPins = (instance.pinnedActions && !Array.isArray(instance.pinnedActions)) ? instance.pinnedActions : {};
    onUpdateInstance(qrId, { pinnedActions: { ...existingPins, [currentUserId]: newPins } });
  };

  // Dynamic Plugin Execution
  const executePluginAction = async (manifestId: string, actionId: string) => {
    try {
      const res = await apiFetch('/api/addons/execute', {
        method: 'POST',
        body: JSON.stringify({ addonId: manifestId, actionId, contextData: { qrId: instance?.qrId } })
      });
      
      const data = await res.json();
      if (data.success && data.result?.clientAction?.type === 'UPDATE_INSTANCE') {
        // The backend plugin successfully modified the DB and told the UI how to update!
        onUpdateInstance(data.result.clientAction.qrId, data.result.clientAction.updates);
        showToast(data.result.message || '✅ Action completed!');
      } else if (!data.success) {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      showToast('❌ Failed to execute plugin action.');
    }
  };

  const handleRegistrationSubmit = (id: string, identifier: string, isNew: boolean, locId: string, isNewLoc?: boolean, zId?: string, isNewZ?: boolean, img?: string) => {
    onRegister(id, identifier, isNew, locId, isNewLoc, zId, isNewZ, img);
    showToast('🌱 Plant registered successfully!');
  };

  // 4. Dynamic Just-In-Time Registration Form (when QR isn't mapped in instances)
  if (!instance) {
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg">
          <div className="flex justify-center mb-4 text-primary-500 dark:text-primary-400">
            <Icon name="leaf" size={48} />
          </div>
          <Title>New Tag Detected</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed px-2">
            Tag <strong className="text-primary-700 dark:text-primary-400 font-semibold">{qrId}</strong> is unassigned. 
            What are we planting here?
          </p>
          <PlantRegistrationForm 
            prefilledQrId={qrId} 
            archetypes={archetypes} 
            locations={locations} 
            zones={zones} 
            onRegister={handleRegistrationSubmit} 
            onCancel={onGoBack} 
            submitLabel="Initialize Care Routine" 
          />
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            Not a plant? Register this tag as a <button onClick={() => onNavigateLocation(qrId)} className="text-primary-600 dark:text-primary-400 font-semibold underline decoration-dotted underline-offset-2">Location</button> or <button onClick={() => onNavigateZone(qrId)} className="text-primary-600 dark:text-primary-400 font-semibold underline decoration-dotted underline-offset-2">Zone</button>.
          </div>
        </Card>
        <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
      </Container>
    );
  }

  if (isEditing && instance) {
    const handleSave = (e: FormEvent) => {
      e.preventDefault();
      onUpdateInstance(qrId, {
        locationId: editData.locationId,
        lastWatered: new Date(editData.lastWatered).toISOString(),
        lastFed: new Date(editData.lastFed).toISOString(),
        datePlanted: editData.datePlanted ? new Date(editData.datePlanted).toISOString() : instance.datePlanted,
        dateHarvested: editData.dateHarvested ? new Date(editData.dateHarvested).toISOString() : undefined,
        untracked: editData.untracked
      });
      setIsEditing(false);
      showToast('✅ Plant updated!');
    };

    return (
      <Container className="animate-in fade-in duration-300">
        <header className="mb-6 flex items-center gap-3 pt-6">
          <button onClick={() => setIsEditing(false)} className="text-slate-400 dark:text-slate-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            <Icon name="back" size={24} />
          </button>
          <div>
            <Title className="!mb-0">Edit Plant</Title>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">{archetype?.commonName}</p>
          </div>
        </header>
        
        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <select 
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                value={editData.locationId}
                onChange={e => setEditData({...editData, locationId: e.target.value})}
              >
                {locations.map(loc => {
                  const locZone = zones.find(z => z.id === loc.zoneId);
                  return (
                    <option key={loc.id} value={loc.id}>{locZone?.name} • {loc.name}</option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Watered</label>
              <Input 
                type="datetime-local" 
                value={editData.lastWatered}
                onChange={e => setEditData({...editData, lastWatered: e.target.value})}
                className="!mb-0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Fed</label>
              <Input 
                type="datetime-local" 
                value={editData.lastFed}
                onChange={e => setEditData({...editData, lastFed: e.target.value})}
                className="!mb-0"
              />
            </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Planted</label>
            <Input 
              type="datetime-local" 
              value={editData.datePlanted}
              onChange={e => setEditData({...editData, datePlanted: e.target.value})}
              className="!mb-0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date {milestoneVerbPast}</label>
            <Input 
              type="datetime-local" 
              value={editData.dateHarvested || ''}
              onChange={e => setEditData({...editData, dateHarvested: e.target.value})}
              className="!mb-0"
            />
          </div>

          <div>
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors hover:border-primary-300 dark:hover:border-primary-700">
              <input 
                type="checkbox" 
                checked={editData.untracked} 
                onChange={e => setEditData({...editData, untracked: e.target.checked})} 
                className="w-5 h-5 mt-0.5 accent-primary-600 rounded cursor-pointer"
              />
              <div className="flex-1">
                <span className="block text-slate-800 dark:text-slate-100">Unmonitored / Rain-fed</span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">Exclude this plant from your dashboard watering and feeding queues.</span>
              </div>
            </label>
          </div>

            <div className="mt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>

        <Card className="border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 mt-8">
          <h3 className="text-red-800 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">Remove this plant from your garden tracking. This cannot be undone.</p>
          <Button 
            type="button" 
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this plant?')) {
                onDeleteInstance(qrId);
              }
            }} 
            className="!bg-red-100 dark:!bg-red-900/50 !text-red-700 dark:!text-red-300 border border-red-200 dark:border-red-800 hover:!bg-red-200 dark:hover:!bg-red-900 shadow-none"
          >
            Delete Plant
          </Button>
        </Card>
        <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
      </Container>
    );
  }

  const isOverdue = !instance.untracked && (() => {
    const today = new Date().getTime();
    const lastWateredTime = new Date(instance.lastWatered).getTime();
    
    const zoneModifier = zone?.evaporationModifier || 1.0;
    const sunReq = archetype?.sunRequirement?.toLowerCase() || '';
    const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);
    
    const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
    
    let effectiveDeficit = (today - lastWateredTime);
    if (instance.rainDeficit && instance.rainDeficit.timestamp === instance.lastWatered) {
      effectiveDeficit += instance.rainDeficit.deficitMs;
    }
    
    return effectiveDeficit > intervalMs;
  })();

  const isValidData = (val: string | number | null | undefined): boolean => {
    if (val === null || val === undefined || val === '') return false;
    if (typeof val === 'string' && ['unknown', 'uncategorized', 'n/a'].includes(val.toLowerCase().trim())) return false;
    if (typeof val === 'number' && val === 0) return false;
    return true;
  };

  const hasCultivationData = archetype && (
    isValidData(archetype.sunRequirement) || 
    isValidData(archetype.waterIntervalDays) || 
    isValidData(archetype.feedingIntervalDays) || 
    isValidData(archetype.pruningTips) ||
    isValidData(archetype.preferredNutrientProfile)
  );

  const hasTraitsData = archetype && (
    isValidData(archetype.scientificName) ||
    isValidData(archetype.category) ||
    isValidData(archetype.growthHabit) ||
    isValidData(archetype.lifecycle) ||
    (archetype.hardinessZones && archetype.hardinessZones.length > 0) ||
    isValidData(archetype.hardinessNote) ||
    isValidData(archetype.daysToHarvest) ||
    isValidData(archetype.growthRequirements) ||
    isValidData(archetype.flavorProfile) ||
    (archetype.companionPlants && archetype.companionPlants.length > 0) ||
    (archetype.combativePlants && archetype.combativePlants.length > 0)
  );

  const hasLifecycleData = archetype && (
    isValidData(archetype.whenToPlant) ||
    isValidData(archetype.whenToHarvest) ||
    isValidData(archetype.plantingInstructions) ||
    isValidData(archetype.usesForLargeHarvests)
  );

  const getSunIcon = (requirement?: string): IconName => {
    if (!requirement) return 'sun';
    const req = requirement.toLowerCase();
    if (req.includes('part') || req.includes('partial')) return 'cloud-sun';
    if (req.includes('shade') && !req.includes('sun')) return 'cloud';
    return 'sun';
  };

  const getWaterIcon = (days?: number): IconName => {
    if (!days) return 'water';
    if (days <= 3) return 'cloud-rain'; // Frequent
    if (days <= 7) return 'water'; // Moderate
    return 'droplet'; // Infrequent
  };

  const getFeedIcon = (days?: number): IconName => {
    if (!days) return 'feed';
    if (days <= 14) return 'utensils'; // Frequent
    if (days <= 30) return 'feed'; // Moderate
    return 'hourglass'; // Infrequent
  };

  const now = new Date().getTime();
  const currentYear = new Date().getFullYear();

  let expectedHarvestDate = (instance && archetype?.daysToHarvest)
    ? new Date(new Date(instance.datePlanted).getTime() + (archetype.daysToHarvest * 86400000))
    : null;

  const isPerennialOrBiennial = archetype?.lifecycle?.toLowerCase().includes('perennial') || archetype?.lifecycle?.toLowerCase().includes('biennial');

  if (isPerennialOrBiennial && expectedHarvestDate) {
    // If the original historical date has passed, roll it forward to this year's anniversary
    if (now > expectedHarvestDate.getTime()) {
      expectedHarvestDate.setFullYear(currentYear);
      // If we are already past this year's expected date (giving a 4-week grace period for the season), roll to next year
      if (now > expectedHarvestDate.getTime() + (28 * 86400000)) {
        expectedHarvestDate.setFullYear(currentYear + 1);
      }
    }
  }

  const isPastExpectedDate = expectedHarvestDate ? now >= expectedHarvestDate.getTime() : false;
  const isLongPastExpectedDate = !isPerennialOrBiennial && expectedHarvestDate ? (now - expectedHarvestDate.getTime()) > (182 * 86400000) : false; 

  // If a perennial was harvested/bloomed in a previous year, ignore it so we can anticipate this year's bloom
  const isPastYearHarvest = instance?.dateHarvested && isPerennialOrBiennial
    ? new Date(instance.dateHarvested).getFullYear() < currentYear
    : false;

  const totalJournalCount = (instance?.journal?.length || 0) + (location?.journal?.length || 0) + (zone?.journal?.length || 0) + (gardenJournal?.length || 0);

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <header className="mb-6 flex items-start justify-between pt-6">
        <div className="flex items-start gap-3">
          <button onClick={onGoBack} className="text-slate-400 dark:text-slate-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            <Icon name="back" size={24} />
          </button>
          <div className="pt-1">
            <Title className="!mb-0">{archetype?.commonName}</Title>
            {location ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">
                <span onClick={() => zone && onNavigateZone(zone.id)} className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 underline decoration-dotted underline-offset-2">{zone?.name}</span> 
                {' • '}
                <span onClick={() => onNavigateLocation(location.id)} className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 underline decoration-dotted underline-offset-2">{location.name}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">Unknown Location</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-700 dark:hover:text-primary-400 active:scale-90 transition-all bg-transparent rounded-full shadow-sm">
            <Icon name="edit" size={20} />
          </button>
          <MenuButton onClick={onOpenMenu}>
            <Icon name="menu" size={24} />
          </MenuButton>
        </div>
      </header>

      <Card className="flex flex-col items-center pb-10 mb-6 relative overflow-hidden !px-0 !pt-0">
        {instance.imageUrl || archetype?.imageUrl ? (
          <img src={instance.imageUrl || archetype?.imageUrl} alt={archetype?.commonName} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-56 object-cover mb-6 bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 mb-8"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          <StatusBadge $status={instance.untracked ? 'unmonitored' : (isOverdue ? 'overdue' : 'hydrated')} className="mb-3 shadow-sm">
            {instance.untracked ? 'Unmonitored / Rain-Fed' : (isOverdue ? 'Watering Overdue' : 'Optimal Hydration')}
          </StatusBadge>
          {archetype?.preferredNutrientProfile && (
            <div className="flex justify-center mb-5 mt-1">
               <button onClick={() => setIsInfoOpen(true)} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
                 <Icon name="feed" size={14} />
                 {FEED_PROFILE_LABELS[archetype.preferredNutrientProfile] || archetype.preferredNutrientProfile}
                 <Icon name="help-circle" size={14} className="opacity-70 ml-0.5" />
               </button>
            </div>
          )}
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center space-y-1">
          <p>Planted: {new Date(instance.datePlanted).toLocaleDateString()}</p>
          {instance.dateHarvested && !isPastYearHarvest ? (
            <p className="text-amber-600 dark:text-amber-400 font-semibold">{milestoneVerbPast}: {new Date(instance.dateHarvested).toLocaleDateString()}</p>
          ) : expectedHarvestDate && !isLongPastExpectedDate ? (
            <p className={`${isPastExpectedDate ? 'text-slate-600 dark:text-slate-400' : 'text-primary-600 dark:text-primary-400'} font-semibold`}>
              Est. {milestoneVerbFuture}: {expectedHarvestDate.toLocaleDateString()}
            </p>
          ) : null}
            <p>Last watered: {new Date(instance.lastWatered).toLocaleDateString()}</p>
            <p>Last fed: {new Date(instance.lastFed).toLocaleDateString()}</p>
          </div>
          
          <div className="w-full flex gap-3 px-2">
            <Button onClick={handleManualWater} className="flex items-center justify-center gap-2"><Icon name="water" size={18} /> Water</Button>
            <Button $variant="secondary" onClick={() => setIsFeedModalOpen(true)} className="flex items-center justify-center gap-2"><Icon name="feed" size={18} /> Feed</Button>
            
            {/* Dynamic Data-Driven Plugin Buttons */}
            {currentUser?.activeAddonManifests?.map(manifest => 
              manifest.actions?.filter(a => a.entryPoint === 'plant_detail_action').map(action => (
                <Button key={`${manifest.id}-${action.id}`} $variant="secondary" onClick={() => executePluginAction(manifest.id, action.id)} className="!bg-purple-50 dark:!bg-purple-900/30 !text-purple-700 dark:!text-purple-400 !border-purple-200 dark:!border-purple-800 whitespace-nowrap">
                  {action.label}
                </Button>
              ))
            )}
          </div>

                  <ActionControlStrip 
          userPins={userPins}
          onPinToggle={handlePinToggle}
          targetId={qrId}
          targetType="plant"
          targetTitle={archetype?.commonName || 'Plant'}
          targetSubtitle={archetype?.scientificName || ''}
          showToast={showToast}
        />
        </div>
      </Card>

      {hasCultivationData && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
          <button onClick={() => toggleSection('cultivation')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
            <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Cultivation Basics</Subtitle>
            <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('cultivation') ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expandedSections.includes('cultivation') && (
            <Card>
              <ul className="space-y-5 text-sm">
              {isValidData(archetype?.sunRequirement) && (
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 rounded-full w-10 h-10 flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <Icon name={getSunIcon(archetype?.sunRequirement)} size={20} />
                  </span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Sunlight</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.sunRequirement}</span>
                  </div>
                </li>
              )}
              {isValidData(archetype?.waterIntervalDays) && (
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-full w-10 h-10 flex-shrink-0 text-blue-600 dark:text-blue-400">
                    <Icon name={getWaterIcon(archetype?.waterIntervalDays)} size={20} />
                  </span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Watering Interval</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">Every {archetype?.waterIntervalDays} days</span>
                  </div>
                </li>
              )}
              {isValidData(archetype?.feedingIntervalDays) && (
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 rounded-full w-10 h-10 flex-shrink-0 text-amber-600 dark:text-amber-400">
                    <Icon name={getFeedIcon(archetype?.feedingIntervalDays)} size={20} />
                  </span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Feeding</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block mb-1">Every {archetype?.feedingIntervalDays} days</span>
                    {archetype?.preferredNutrientProfile && (
                      <div className="flex items-center gap-1 mb-1 mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed">
                        <span>Profile: {FEED_PROFILE_LABELS[archetype.preferredNutrientProfile] || archetype.preferredNutrientProfile}</span>
                        <button onClick={() => setIsInfoOpen(true)} className="text-primary-500 hover:text-primary-600 transition-colors p-1 rounded-full active:bg-primary-50 dark:active:bg-primary-900/30"><Icon name="help-circle" size={14} /></button>
                      </div>
                    )}
                    {isValidData(archetype?.whatToFeed) && <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed">{archetype?.whatToFeed}</span>}
                  </div>
                </li>
              )}
              {isValidData(archetype?.pruningTips) && (
                <li className="flex gap-4 items-start">
                  <span className="flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 rounded-full w-10 h-10 flex-shrink-0 text-primary-600 dark:text-primary-400">
                    <Icon name="edit" size={20} />
                  </span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Pruning Care</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.pruningTips}</span>
                  </div>
                </li>
              )}
              </ul>
            </Card>
          )}
        </div>
      )}

      {hasTraitsData && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
          <button onClick={() => toggleSection('traits')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
            <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Details & Traits</Subtitle>
            <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('traits') ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expandedSections.includes('traits') && (
            <Card>
              <div className="space-y-4 text-sm">
              {isValidData(archetype?.scientificName) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Scientific Name</strong>
                  <span className="text-slate-500 dark:text-slate-400 italic">{archetype?.scientificName}</span>
                </div>
              )}
              {(isValidData(archetype?.category) || isValidData(archetype?.growthHabit) || isValidData(archetype?.lifecycle)) && (
                <div className="grid grid-cols-2 gap-4">
                  {isValidData(archetype?.category) && (
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Category</strong>
                      <span className="text-slate-500 dark:text-slate-400">{archetype?.category}</span>
                    </div>
                  )}
                  {isValidData(archetype?.growthHabit) && (
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Growth Habit</strong>
                      <span className="text-slate-500 dark:text-slate-400">{archetype?.growthHabit}</span>
                    </div>
                  )}
                  {isValidData(archetype?.lifecycle) && (
                    <div>
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Lifecycle</strong>
                      <span className="text-slate-500 dark:text-slate-400">{archetype?.lifecycle}</span>
                    </div>
                  )}
                </div>
              )}
              {isValidData(archetype?.growthRequirements) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Growth Requirements</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.growthRequirements}</span>
                </div>
              )}
              {((archetype?.hardinessZones ?? []).length > 0 || isValidData(archetype?.hardinessNote)) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Hardiness Zones</strong>
                  {(archetype?.hardinessZones ?? []).length > 0 && (
                    <span className="text-slate-500 dark:text-slate-400 block">
                      {archetype?.hardinessZones?.join(', ')}
                    </span>
                  )}
                  {isValidData(archetype?.hardinessNote) && (
                    <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed mt-1">{archetype?.hardinessNote}</span>
                  )}
                </div>
              )}
              {isValidData(archetype?.daysToHarvest) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Days to {milestoneVerbFuture}</strong>
                  <span className="text-slate-500 dark:text-slate-400">{archetype?.daysToHarvest} days</span>
                </div>
              )}
              {isValidData(archetype?.flavorProfile) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Flavor Profile</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.flavorProfile}</span>
                </div>
              )}
              {(archetype?.companionPlants ?? []).length > 0 && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Companion Plants</strong>
                  <span className="text-slate-500 dark:text-slate-400">{archetype?.companionPlants?.join(", ")}</span>
                </div>
              )}
              {(archetype?.combativePlants ?? []).length > 0 && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Combative Plants</strong>
                  <span className="text-slate-500 dark:text-slate-400">{archetype?.combativePlants?.join(", ")}</span>
                </div>
              )}
              </div>
            </Card>
          )}
        </div>
      )}

      {hasLifecycleData && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
          <button onClick={() => toggleSection('lifecycle')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
            <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Lifecycle & {milestoneVerbFuture}</Subtitle>
            <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('lifecycle') ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expandedSections.includes('lifecycle') && (
            <Card>
              <div className="space-y-4 text-sm">
              {isValidData(archetype?.whenToPlant) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to Plant</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToPlant}</span>
                </div>
              )}
              {isValidData(archetype?.plantingInstructions) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">How to Plant</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.plantingInstructions}</span>
                </div>
              )}
              {isValidData(archetype?.whenToHarvest) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to {milestoneVerbFuture}</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToHarvest}</span>
                </div>
              )}
              {isValidData(archetype?.usesForLargeHarvests) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Abundant Yield Uses</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.usesForLargeHarvests}</span>
                </div>
              )}
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 last:border-0">
        <button onClick={() => toggleSection('journal')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
          <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            Plant Journal <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({totalJournalCount})</span>
          </Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('journal') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSections.includes('journal') && (
          <PlantJournal 
            instance={instance} 
            onUpdate={(updates) => onUpdateInstance(qrId, updates)} 
            showToast={showToast} 
            currentUser={currentUser}
          />
        )}
      </div>

      <FeedActionModal 
        isOpen={isFeedModalOpen} 
        defaultProfile={archetype?.preferredNutrientProfile || 'GENERAL_FEED'}
        onClose={() => setIsFeedModalOpen(false)} 
        onConfirm={(feedType, feedAmount) => { 
          onFeed(instance.qrId, feedType, feedAmount); 
          setIsFeedModalOpen(false); 
          showToast(`🪴 Plant fed with ${FEED_PROFILE_LABELS[feedType] || feedType}!`); 
        }} 
      />
      <NutrientProfileInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        currentProfile={archetype?.preferredNutrientProfile}
      />
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};