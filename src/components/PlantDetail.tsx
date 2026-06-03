import { useEffect, useState, FC, FormEvent, ChangeEvent } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone, JournalEntry } from '../../types';
import { Container, Title, Card, Button, StatusBadge, Input, Toast, Subtitle } from '../styles/StyledElements';
import { PlantRegistrationForm } from './PlantRegistrationForm';

interface PlantDetailProps {
  qrId: string;
  initialAction: string | null;
  instance?: PlantInstance;
  archetype?: PlantArchetype;
  archetypes: PlantArchetype[];
  location?: Location;
  locations: Location[];
  zone?: Zone;
  zones: Zone[];
  onWater: (qrId: string) => void;
  onFeed: (qrId: string) => void;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
  onUpdate: (qrId: string, updates: Partial<PlantInstance>) => void;
  onDelete: (qrId: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onClearAction: () => void;
  onNavigateLocation: (locId: string) => void;
  onNavigateZone: (zoneName: string) => void;
}

export const PlantDetail: FC<PlantDetailProps> = ({ 
  qrId, initialAction, instance, archetype, archetypes, location, locations, zone, zones, onWater, onFeed, onRegister, onUpdate, onDelete, onGoBack, onOpenMenu, onClearAction, onNavigateLocation, onNavigateZone
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ locationId: '', lastWatered: '', lastFed: '', datePlanted: '', dateHarvested: '', untracked: false });

  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalForm, setJournalForm] = useState<Partial<JournalEntry>>({});
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

  useEffect(() => {
    if (instance) {
      setEditData({
        locationId: instance.locationId,
        // Converts ISO string to the "YYYY-MM-DDTHH:mm" format required by native datetime-local inputs
        lastWatered: new Date(instance.lastWatered).toISOString().slice(0, 16),
          lastFed: new Date(instance.lastFed).toISOString().slice(0, 16),
          datePlanted: instance.datePlanted ? new Date(instance.datePlanted).toISOString().slice(0, 16) : '',
        dateHarvested: instance.dateHarvested ? new Date(instance.dateHarvested).toISOString().slice(0, 16) : '',
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

  const handleManualFeed = () => {
    onFeed(qrId);
    showToast('🪴 Plant fed successfully!');
  };

  const handleRegistrationSubmit = (id: string, identifier: string, isNew: boolean, locId: string, isNewLoc?: boolean, zId?: string, isNewZ?: boolean, img?: string) => {
    onRegister(id, identifier, isNew, locId, isNewLoc, zId, isNewZ, img);
    showToast('🌱 Plant registered successfully!');
  };

  const handleJournalImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setJournalForm({...journalForm, imageUrl: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const handleSaveJournal = (e: FormEvent) => {
    e.preventDefault();
    if (!instance) return;
    
    const currentJournal = instance.journal || [];
    const timestamp = journalForm.timestamp ? new Date(journalForm.timestamp).toISOString() : new Date().toISOString();
    let updatedJournal;

    if (editingJournalId) {
      updatedJournal = currentJournal.map(entry => 
        entry.id === editingJournalId ? { ...entry, ...journalForm, timestamp } as JournalEntry : entry
      );
    } else {
      const newEntry: JournalEntry = {
        id: `j-${Date.now()}`,
        timestamp,
        title: journalForm.title || '',
        note: journalForm.note || '',
        imageUrl: journalForm.imageUrl || ''
      };
      updatedJournal = [newEntry, ...currentJournal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    onUpdate(qrId, { journal: updatedJournal });
    setEditingJournalId(null);
    setIsAddingJournal(false);
    setJournalForm({});
    showToast(editingJournalId ? '📓 Journal updated!' : '📓 Journal entry added!');
  };

  const handleDeleteJournal = (id: string) => {
    if (!instance || !window.confirm('Delete this journal entry?')) return;
    const currentJournal = instance.journal || [];
    onUpdate(qrId, { journal: currentJournal.filter(j => j.id !== id) });
    showToast('🗑️ Entry removed');
  };

  const handleSetThumbnail = (imageUrl: string) => {
    onUpdate(qrId, { imageUrl });
    showToast('🖼️ Cover photo updated!');
  };

  // 4. Dynamic Just-In-Time Registration Form (when QR isn't mapped in instances)
  if (!instance) {
    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg">
          <div className="text-5xl mb-4">🪴</div>
          <Title>New Tag Detected</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed px-2">
            Tag <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{qrId}</strong> is unassigned. 
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
        </Card>
        <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
      </Container>
    );
  }

  if (isEditing && instance) {
    const handleSave = (e: FormEvent) => {
      e.preventDefault();
      onUpdate(qrId, {
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
          <button onClick={() => setIsEditing(false)} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
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
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date Harvested</label>
            <Input 
              type="datetime-local" 
              value={editData.dateHarvested || ''}
              onChange={e => setEditData({...editData, dateHarvested: e.target.value})}
              className="!mb-0"
            />
          </div>

          <div>
            <label className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors hover:border-emerald-300 dark:hover:border-emerald-700">
              <input 
                type="checkbox" 
                checked={editData.untracked} 
                onChange={e => setEditData({...editData, untracked: e.target.checked})} 
                className="w-5 h-5 mt-0.5 accent-emerald-600 rounded cursor-pointer"
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
                onDelete(qrId);
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
    return (today - lastWateredTime) > intervalMs;
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
    isValidData(archetype.pruningTips)
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

  const getSunIcon = (requirement?: string) => {
    if (!requirement) return '☀️';
    const req = requirement.toLowerCase();
    if (req.includes('part') || req.includes('partial')) return '⛅';
    if (req.includes('shade') && !req.includes('sun')) return '☁️';
    return '☀️';
  };

  const getWaterIcon = (days?: number) => {
    if (!days) return '💧';
    if (days <= 3) return '🚿'; // Frequent
    if (days <= 7) return '💧'; // Moderate
    return '🌵'; // Infrequent
  };

  const getFeedIcon = (days?: number) => {
    if (!days) return '🪴';
    if (days <= 14) return '🍽️'; // Frequent
    if (days <= 30) return '🪴'; // Moderate
    return '⏳'; // Infrequent
  };

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <header className="mb-6 flex items-start justify-between pt-6">
        <div className="flex items-start gap-3">
          <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800 leading-none">
            &larr;
          </button>
          <div className="pt-1">
            <Title className="!mb-0">{archetype?.commonName}</Title>
            {location ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">
                <span onClick={() => zone && onNavigateZone(zone.id)} className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted underline-offset-2">{zone?.name}</span> 
                {' • '}
                <span onClick={() => onNavigateLocation(location.id)} className="cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted underline-offset-2">{location.name}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">Unknown Location</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <button onClick={() => setIsEditing(true)} className="text-xl p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-90 transition-all bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            ✏️
          </button>
          <button onClick={onOpenMenu} className="text-xl p-2 px-3 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-90 transition-all bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
            ☰
          </button>
        </div>
      </header>

      <Card className="flex flex-col items-center pb-10 mb-6 relative overflow-hidden !px-0 !pt-0">
        {instance.imageUrl || archetype?.imageUrl ? (
          <img src={instance.imageUrl || archetype?.imageUrl} alt={archetype?.commonName} className="w-full h-56 object-cover mb-6 bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mb-8"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          <StatusBadge status={instance.untracked ? 'unmonitored' : (isOverdue ? 'overdue' : 'hydrated')} className="mb-5 shadow-sm">
            {instance.untracked ? 'Unmonitored / Rain-Fed' : (isOverdue ? 'Watering Overdue' : 'Optimal Hydration')}
          </StatusBadge>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center space-y-1">
          <p>Planted: {new Date(instance.datePlanted).toLocaleDateString()}</p>
          {instance.dateHarvested && <p className="text-amber-600 dark:text-amber-400 font-semibold">Harvested: {new Date(instance.dateHarvested).toLocaleDateString()}</p>}
            <p>Last watered: {new Date(instance.lastWatered).toLocaleDateString()}</p>
            <p>Last fed: {new Date(instance.lastFed).toLocaleDateString()}</p>
          </div>
          
          <div className="w-full flex gap-3 px-2">
            <Button onClick={handleManualWater}>💦 Water</Button>
            <Button variant="secondary" onClick={handleManualFeed}>🪴 Feed</Button>
          </div>
        </div>
      </Card>

      {hasCultivationData && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
          <button onClick={() => toggleSection('cultivation')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
            <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Cultivation Basics</Subtitle>
            <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('cultivation') ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expandedSections.includes('cultivation') && (
            <Card>
              <ul className="space-y-5 text-sm">
              {isValidData(archetype?.sunRequirement) && (
                <li className="flex gap-4 items-start">
                  <span className="text-2xl bg-amber-50 dark:bg-amber-900/30 rounded-full p-2">{getSunIcon(archetype?.sunRequirement)}</span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Sunlight</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.sunRequirement}</span>
                  </div>
                </li>
              )}
              {isValidData(archetype?.waterIntervalDays) && (
                <li className="flex gap-4 items-start">
                  <span className="text-2xl bg-blue-50 dark:bg-blue-900/30 rounded-full p-2">{getWaterIcon(archetype?.waterIntervalDays)}</span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Watering Interval</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed">Every {archetype?.waterIntervalDays} days</span>
                  </div>
                </li>
              )}
              {isValidData(archetype?.feedingIntervalDays) && (
                <li className="flex gap-4 items-start">
                  <span className="text-2xl bg-amber-50 dark:bg-amber-900/30 rounded-full p-2">{getFeedIcon(archetype?.feedingIntervalDays)}</span>
                  <div className="pt-1">
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Feeding</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block mb-1">Every {archetype?.feedingIntervalDays} days</span>
                    {isValidData(archetype?.whatToFeed) && <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed">{archetype?.whatToFeed}</span>}
                  </div>
                </li>
              )}
              {isValidData(archetype?.pruningTips) && (
                <li className="flex gap-4 items-start">
                  <span className="text-2xl bg-emerald-50 dark:bg-emerald-900/30 rounded-full p-2">✂️</span>
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
            <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Details & Traits</Subtitle>
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
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Days to Harvest</strong>
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
            <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Lifecycle & Harvest</Subtitle>
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
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to Harvest</strong>
                  <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToHarvest}</span>
                </div>
              )}
              {isValidData(archetype?.usesForLargeHarvests) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Abundant Harvest Uses</strong>
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
          <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Plant Journal <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({instance.journal?.length || 0})</span>
          </Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSections.includes('journal') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSections.includes('journal') && (
          <div className="mt-2">
            {!isAddingJournal && !editingJournalId ? (
              <Button onClick={() => { setIsAddingJournal(true); setJournalForm({ timestamp: new Date().toISOString().slice(0, 16) }); }} className="mb-6">+ Add Journal Entry</Button>
            ) : (
              <Card className="mb-6 border-emerald-500 shadow-md">
                <Subtitle className="!mt-0 mb-4">{editingJournalId ? 'Edit Entry' : 'New Journal Entry'}</Subtitle>
                <form onSubmit={handleSaveJournal} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date & Time</label>
                    <Input type="datetime-local" value={journalForm.timestamp || ''} onChange={e => setJournalForm({...journalForm, timestamp: e.target.value})} className="!mb-0 py-2.5" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Title (Optional)</label>
                    <Input placeholder="e.g. First flowers!" value={journalForm.title || ''} onChange={e => setJournalForm({...journalForm, title: e.target.value})} className="!mb-0 py-2.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Note (Optional)</label>
                    <textarea value={journalForm.note || ''} onChange={e => setJournalForm({...journalForm, note: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} placeholder="Observations, measurements, thoughts..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Photo (Optional)</label>
                    <div className="flex items-center gap-3">
                      {journalForm.imageUrl && (
                        <img src={journalForm.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                      )}
                      <label className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition-all cursor-pointer border border-transparent dark:border-emerald-800">
                        📸 {journalForm.imageUrl ? 'Change Photo' : 'Take Photo'}
                        <input type="file" accept="image/*" capture="environment" onChange={handleJournalImageCapture} className="hidden" />
                      </label>
                      {journalForm.imageUrl && (
                        <button type="button" onClick={() => setJournalForm({...journalForm, imageUrl: ''})} className="text-red-500 text-sm font-semibold">Remove</button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setIsAddingJournal(false); setEditingJournalId(null); setJournalForm({}); }}>Cancel</Button>
                    <Button type="submit">Save Entry</Button>
                  </div>
                </form>
              </Card>
            )}

            {instance.journal && instance.journal.length > 0 ? (
              <div className="relative border-l-2 border-emerald-200 dark:border-emerald-800 ml-4 pl-6 space-y-6 mb-8 mt-2">
                {instance.journal.map(entry => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 ring-4 ring-slate-50 dark:ring-slate-900"></div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {new Date(entry.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingJournalId(entry.id); setJournalForm({ ...entry, timestamp: new Date(entry.timestamp).toISOString().slice(0, 16) }); setIsAddingJournal(false); }} className="text-slate-400 hover:text-emerald-600 active:scale-90 transition-transform">✏️</button>
                        <button onClick={() => handleDeleteJournal(entry.id)} className="text-slate-400 hover:text-red-600 active:scale-90 transition-transform">🗑️</button>
                      </div>
                    </div>
                    {entry.title && <h4 className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">{entry.title}</h4>}
                    {entry.note && <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{entry.note}</p>}
                    {entry.imageUrl && (
                      <div className="mt-2">
                        <img src={entry.imageUrl} alt={entry.title || 'Journal photo'} className="w-full max-h-64 object-cover rounded-xl border border-slate-200 dark:border-slate-700 mb-2" />
                        <button onClick={() => handleSetThumbnail(entry.imageUrl!)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                          {instance.imageUrl === entry.imageUrl ? '★ Current Cover Photo' : 'Set as Cover Photo'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic mt-2 mb-8">No journal entries yet.</p>
            )}
          </div>
        )}
      </div>

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};