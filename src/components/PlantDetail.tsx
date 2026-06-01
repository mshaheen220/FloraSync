import { useEffect, useState, useMemo, FC, FormEvent, ChangeEvent } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone } from '../../types';
import { Container, Title, Card, Button, StatusBadge, Input, Toast, Subtitle } from '../styles/StyledElements';

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
  onGoHome: () => void;
  onClearAction: () => void;
  onNavigateLocation: (locId: string) => void;
  onNavigateZone: (zoneName: string) => void;
}

export const PlantDetail: FC<PlantDetailProps> = ({ 
  qrId, initialAction, instance, archetype, archetypes, location, locations, zone, zones, onWater, onFeed, onRegister, onUpdate, onDelete, onGoHome, onClearAction, onNavigateLocation, onNavigateZone
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [customZoneName, setCustomZoneName] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ locationId: '', lastWatered: '', lastFed: '' });

  const groupedArchetypes = useMemo(() => {
    const groups = archetypes.reduce((acc, curr) => {
      const category = curr.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(curr);
      return acc;
    }, {} as Record<string, PlantArchetype[]>);

    const sortedCategories = Object.keys(groups).sort();
    sortedCategories.forEach(cat => {
      groups[cat].sort((a, b) => a.commonName.localeCompare(b.commonName));
    });

    return { groups, sortedCategories };
  }, [archetypes]);

  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => a.name.localeCompare(b.name));
  }, [zones]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    if (instance) {
      setEditData({
        locationId: instance.locationId,
        // Converts ISO string to the "YYYY-MM-DDTHH:mm" format required by native datetime-local inputs
        lastWatered: new Date(instance.lastWatered).toISOString().slice(0, 16),
        lastFed: new Date(instance.lastFed).toISOString().slice(0, 16)
      });
    }
  }, [instance]);

  // 1. "Zero-Click" Action Handling: Instantly process URL params mapping physical scanning context to actions.
  useEffect(() => {
    if (instance && initialAction === 'water') {
      onWater(qrId);
      showToast('💦 Plant watered successfully!');
      window.history.replaceState({}, '', `/plant/${qrId}`); // Cleans the URL state post-action
      onClearAction();
    } else if (instance && initialAction === 'feed') {
      onFeed(qrId);
      showToast('🪴 Plant fed successfully!');
      window.history.replaceState({}, '', `/plant/${qrId}`); // Cleans the URL state post-action
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

  const handleImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();

    let finalPlantId = selectedMode;
    let finalIsNewPlant = false;
    if (selectedMode === 'other') {
      if (!customName.trim()) return;
      finalPlantId = customName;
      finalIsNewPlant = true;
    } else if (!selectedMode) return;

    let finalLocationId = selectedLocation;
    let finalIsNewLocation = false;
    let finalZoneId = selectedZone;
    let finalIsNewZone = false;

    if (selectedZone === 'other') {
      if (!customZoneName.trim() || !customLocationName.trim()) return;
      finalLocationId = customLocationName;
      finalIsNewLocation = true;
      finalZoneId = customZoneName;
      finalIsNewZone = true;
    } else if (selectedLocation === 'other') {
      if (!customLocationName.trim()) return;
      finalLocationId = customLocationName;
      finalIsNewLocation = true;
    } else if (!selectedLocation) {
      return;
    }

    onRegister(qrId, finalPlantId, finalIsNewPlant, finalLocationId, finalIsNewLocation, finalZoneId, finalIsNewZone, customImage);
    showToast('🌱 Plant registered successfully!');
  };

  // 4. Dynamic Just-In-Time Registration Form (when QR isn't mapped in instances)
  if (!instance) {
    const isSubmitDisabled = 
      !selectedMode || 
      (selectedMode === 'other' && !customName.trim()) || 
      !selectedZone || 
      (selectedZone === 'other' && (!customLocationName.trim() || !customZoneName.trim())) || 
      (selectedZone !== 'other' && (!selectedLocation || (selectedLocation === 'other' && !customLocationName.trim())));

    return (
      <Container className="flex flex-col justify-center animate-in fade-in duration-500">
        <Card className="text-center py-10 shadow-lg">
          <div className="text-5xl mb-4">🪴</div>
          <Title>New Tag Detected</Title>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed px-2">
            Tag <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{qrId}</strong> is unassigned. 
            What are we planting here?
          </p>
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <select 
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all"
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
            >
              <option value="" disabled>Select a plant type...</option>
              {groupedArchetypes.sortedCategories.map(category => (
                <optgroup key={category} label={category}>
                  {groupedArchetypes.groups[category].map(a => (
                    <option key={a.id} value={a.id}>{a.commonName}</option>
                  ))}
                </optgroup>
              ))}
              <option value="other">+ Other (Add new...)</option>
            </select>
            <select 
              className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all"
              value={selectedZone}
              onChange={e => { setSelectedZone(e.target.value); setSelectedLocation(''); }}
            >
              <option value="" disabled>Select a zone...</option>
              {sortedZones.map(z => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
              <option value="other">+ Other (Add new zone...)</option>
            </select>
            {selectedZone && selectedZone !== 'other' && (
              <select 
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all"
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
              >
                <option value="" disabled>Select a location...</option>
                {locations.filter(l => l.zoneId === selectedZone).map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
                <option value="other">+ Other (Add new location...)</option>
              </select>
            )}
            {(selectedZone === 'other' || selectedLocation === 'other') && (
              <div className="flex gap-3 mt-1">
                {selectedZone === 'other' && (
                  <div className="flex-1">
                    <Input 
                      placeholder="Zone (e.g. Garden)" 
                      value={customZoneName}
                      onChange={(e) => setCustomZoneName(e.target.value)}
                      className="!mb-0"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <Input 
                    placeholder="Name (e.g. Bed 1)" 
                    value={customLocationName}
                    onChange={(e) => setCustomLocationName(e.target.value)}
                    className="!mb-0"
                  />
                </div>
              </div>
            )}
            {selectedMode === 'other' && (
              <>
                <Input 
                  placeholder="e.g., Heirloom Tomato" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="!mb-0 mt-1"
                  autoFocus
                />
                <div className="mt-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Plant Photo (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {customImage && (
                      <img src={customImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                    )}
                    <label className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-all cursor-pointer border border-transparent dark:border-emerald-800">
                      📸 {customImage ? 'Retake Photo' : 'Take Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageCapture}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
            <Button type="submit" className="mt-2" disabled={isSubmitDisabled}>Initialize Care Routine</Button>
          </form>
        </Card>
        <Button variant="secondary" onClick={onGoHome} className="mt-2">Cancel Setup</Button>
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
        lastFed: new Date(editData.lastFed).toISOString()
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
          <Title className="!mb-0">Edit Plant</Title>
        </header>
        
        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
              <select 
                className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
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

  const isOverdue = (() => {
    const today = new Date().getTime();
    const lastWateredTime = new Date(instance.lastWatered).getTime();
    const intervalMs = (archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000;
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
      <header className="mb-6 flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onGoHome} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
          </button>
          <div>
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
        <button onClick={() => setIsEditing(true)} className="text-xl p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 active:scale-90 transition-all bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
          ✏️
        </button>
      </header>

      <Card className="flex flex-col items-center pb-10 mb-6 relative overflow-hidden !px-0 !pt-0">
        {archetype?.imageUrl ? (
          <img src={archetype.imageUrl} alt={archetype.commonName} className="w-full h-56 object-cover mb-6 bg-slate-100 dark:bg-slate-800" />
        ) : (
          <div className="w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 mb-8"></div>
        )}
        <div className="px-5 w-full flex flex-col items-center">
          <StatusBadge status={isOverdue ? 'overdue' : 'hydrated'} className="mb-5 shadow-sm">
            {isOverdue ? 'Watering Overdue' : 'Optimal Hydration'}
          </StatusBadge>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 text-center space-y-1">
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
        <>
          <Subtitle>Cultivation Basics</Subtitle>
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
        </>
      )}

      {hasTraitsData && (
        <>
          <Subtitle>Details & Traits</Subtitle>
          <Card>
            <div className="space-y-4 text-sm">
              {isValidData(archetype?.scientificName) && (
                <div>
                  <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Scientific Name</strong>
                  <span className="text-slate-500 dark:text-slate-400 italic">{archetype?.scientificName}</span>
                </div>
              )}
              {(isValidData(archetype?.category) || isValidData(archetype?.growthHabit)) && (
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
        </>
      )}

      {hasLifecycleData && (
        <>
          <Subtitle>Lifecycle & Harvest</Subtitle>
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
        </>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};