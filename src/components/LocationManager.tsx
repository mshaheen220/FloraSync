import { useState, FC, FormEvent, useMemo, ChangeEvent } from 'react';
import { Location, Zone, PlantInstance, PlantArchetype } from '../../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle, StatusBadge, ProgressBarContainer, ProgressBarFill } from '../styles/StyledElements';
import { Theme } from '../App';

interface LocationManagerProps {
  mode: 'settings' | 'zones' | 'locations' | 'inventory';
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  instances: PlantInstance[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onAddZone: (name: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
  onAdd: (name: string, zoneId: string) => void;
  onUpdate: (id: string, updates: Partial<Location>) => void;
  onDelete: (id: string) => void;
  onManageArchetypes: () => void;
  onGoHome: () => void;
  onNavigateLocation: (id: string) => void;
  onNavigateZone: (id: string) => void;
  onNavigate: (qrId: string) => void;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
}

export const LocationManager: FC<LocationManagerProps> = ({ mode, archetypes, locations, zones, instances, theme, onThemeChange, onAddZone, onUpdateZone, onDeleteZone, onAdd, onUpdate, onDelete, onManageArchetypes, onGoHome, onNavigateLocation, onNavigateZone, onNavigate, onRegister }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneData, setEditZoneData] = useState<Partial<Zone>>({});
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [selectedMode, setSelectedMode] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customZoneName, setCustomZoneName] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [customImage, setCustomImage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddZone = (e: FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    onAddZone(newZoneName);
    setNewZoneName('');
    showToast('📍 Zone added successfully!');
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedZoneId) return;
    onAdd(newName, selectedZoneId);
    setNewName('');
    showToast('📍 Location added successfully!');
  };

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

  const handleImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterSubmit = (e: FormEvent) => {
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
    } else if (!selectedLocation) return;

    const generatedQrId = `qr-${Date.now()}`;
    onRegister(generatedQrId, finalPlantId, finalIsNewPlant, finalLocationId, finalIsNewLocation, finalZoneId, finalIsNewZone, customImage);
    showToast('🌱 Plant added successfully!');
    setIsAddingPlant(false);
    setSelectedMode(''); setCustomName(''); setSelectedZone(''); setSelectedLocation(''); setCustomZoneName(''); setCustomLocationName(''); setCustomImage('');
  };

  const inventoryList = useMemo(() => {
    const today = new Date().getTime();
    return instances.map(instance => {
      const archetype = archetypes.find(a => a.id === instance.archetypeId);
      const location = locations.find(l => l.id === instance.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastWateredTime = new Date(instance.lastWatered).getTime();
      const intervalMs = (archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000;
      const timeElapsed = today - lastWateredTime;
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      
      return {
        ...instance,
        archetype,
        location,
        zone,
        isOverdue: ratio <= 0,
        ratio
      };
    }).sort((a, b) => (a.archetype?.commonName || '').localeCompare(b.archetype?.commonName || ''));
  }, [instances, archetypes, locations, zones]);

  const isSubmitDisabled = 
    !selectedMode || 
    (selectedMode === 'other' && !customName.trim()) || 
    !selectedZone || 
    (selectedZone === 'other' && (!customLocationName.trim() || !customZoneName.trim())) || 
    (selectedZone !== 'other' && (!selectedLocation || (selectedLocation === 'other' && !customLocationName.trim())));

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center gap-3 pt-6">
        <button onClick={onGoHome} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
          &larr;
        </button>
        <Title className="!mb-0">
          {mode === 'settings' && 'General Settings'}
          {mode === 'zones' && 'Zone Manager'}
          {mode === 'locations' && 'Location Manager'}
          {mode === 'inventory' && 'Inventory Manager'}
        </Title>
      </header>

      {mode === 'settings' && (
        <>
          <Subtitle>Appearance</Subtitle>
          <Card className="flex gap-2 !p-2 mb-8">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => onThemeChange(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${
                  theme === t 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                {t}
              </button>
            ))}
          </Card>
        </>
      )}

      {mode === 'zones' && (
        <>
          <Subtitle>Manage Zones</Subtitle>
          <Card>
            <form onSubmit={handleAddZone} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">New Macro Zone</label>
                <Input placeholder="Zone Name (e.g. Greenhouse)" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} className="!mb-0 py-2.5" />
              </div>
              <Button type="submit" className="mt-2">Add Zone</Button>
            </form>
          </Card>
    
          <Subtitle>Existing Zones</Subtitle>
          <div className="space-y-3 mb-8">
            {zones.map(zone => {
              const locationsInZone = locations.filter(l => l.zoneId === zone.id).length;
              const isEditing = editingZoneId === zone.id;
    
              if (isEditing) {
                return (
                  <Card key={zone.id} className="border-emerald-500 dark:border-emerald-500 shadow-md !p-4">
                    <form onSubmit={(e) => { e.preventDefault(); onUpdateZone(zone.id, editZoneData); setEditingZoneId(null); showToast('📍 Zone updated!'); }} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Zone Name</label>
                        <Input value={editZoneData.name || ''} onChange={e => setEditZoneData({...editZoneData, name: e.target.value})} className="!mb-0 py-2.5" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                        <Input value={editZoneData.description || ''} onChange={e => setEditZoneData({...editZoneData, description: e.target.value})} className="!mb-0 py-2.5" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                        <Input value={editZoneData.imageUrl || ''} onChange={e => setEditZoneData({...editZoneData, imageUrl: e.target.value})} className="!mb-0 py-2.5" placeholder="/images/zones/greenhouse.jpg" />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button type="button" variant="secondary" onClick={() => setEditingZoneId(null)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                      </div>
                    </form>
                  </Card>
                );
              }
    
              return (
                <Card key={zone.id} className="!p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{zone.name}</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{zone.id}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{locationsInZone} sub-locations</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => onNavigateZone(zone.id)}
                        className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90"
                        title="View Zone"
                      >
                        👁️
                      </button>
                      <button onClick={() => { setEditingZoneId(zone.id); setEditZoneData(zone); }} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90">✏️</button>
                      <button 
                        onClick={() => { if (locationsInZone === 0 && window.confirm('Delete this zone?')) { onDeleteZone(zone.id); showToast('🗑️ Zone removed'); } }}
                        disabled={locationsInZone > 0}
                        className={`p-2 rounded-lg transition-colors ${locationsInZone > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {mode === 'locations' && (
        <>
          <Subtitle>Manage Locations</Subtitle>
          <Card>
            <form onSubmit={handleAdd} className="flex flex-col gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Zone</label>
                <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)} required>
                  <option value="" disabled>Select a zone...</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Specific Name (e.g. Shelf B)</label>
                <Input placeholder="Location Name" value={newName} onChange={e => setNewName(e.target.value)} className="!mb-0 py-2.5" />
              </div>
              <Button type="submit" className="mt-2">Add Location</Button>
            </form>
          </Card>
    
          <Subtitle>Existing Locations</Subtitle>
          <div className="space-y-3">
            {locations.map(loc => {
              const plantsInZone = instances.filter(i => i.locationId === loc.id).length;
              const zone = zones.find(z => z.id === loc.zoneId);
              const isEditing = editingId === loc.id;
    
              if (isEditing) {
                return (
                  <Card key={loc.id} className="border-emerald-500 dark:border-emerald-500 shadow-md !p-4">
                    <form onSubmit={(e) => { e.preventDefault(); onUpdate(loc.id, editData); setEditingId(null); showToast('📍 Location updated!'); }} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Zone</label>
                        <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={editData.zoneId || ''} onChange={e => setEditData({...editData, zoneId: e.target.value})} required>
                          <option value="" disabled>Select a zone...</option>
                          {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Specific Name (e.g. Shelf B)</label>
                        <Input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="!mb-0 py-2.5" required />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                      </div>
                    </form>
                  </Card>
                );
              }
    
              return (
                <Card key={loc.id} className="!p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{loc.name}</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{loc.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-0.5">{zone?.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">{plantsInZone} active plant{plantsInZone !== 1 && 's'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => onNavigateLocation(loc.id)}
                        className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90"
                        title="View Location"
                      >
                        👁️
                      </button>
                      <button 
                        onClick={() => { setEditingId(loc.id); setEditData(loc); }}
                        className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => {
                          if (plantsInZone === 0 && window.confirm('Delete this location?')) {
                            onDelete(loc.id);
                            showToast('🗑️ Location removed');
                          }
                        }}
                        disabled={plantsInZone > 0}
                        className={`p-2 rounded-lg transition-colors ${plantsInZone > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {mode === 'inventory' && (
        <>
          <Subtitle>Your Plants</Subtitle>
          {!isAddingPlant ? (
            <Button onClick={() => setIsAddingPlant(true)} className="mb-6">+ Add New Plant</Button>
          ) : (
            <Card className="mb-6 shadow-md border-emerald-500 dark:border-emerald-500">
              <Subtitle className="!mt-0 mb-4">Add New Plant</Subtitle>
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
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
                        <Input placeholder="Zone (e.g. Garden)" value={customZoneName} onChange={(e) => setCustomZoneName(e.target.value)} className="!mb-0" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input placeholder="Name (e.g. Bed 1)" value={customLocationName} onChange={(e) => setCustomLocationName(e.target.value)} className="!mb-0" />
                    </div>
                  </div>
                )}
                {selectedMode === 'other' && (
                  <>
                    <Input placeholder="e.g., Heirloom Tomato" value={customName} onChange={(e) => setCustomName(e.target.value)} className="!mb-0 mt-1" autoFocus />
                    <div className="mt-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plant Photo (Optional)</label>
                      <div className="flex items-center gap-3">
                        {customImage && (
                          <img src={customImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        )}
                        <label className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-all cursor-pointer border border-transparent dark:border-emerald-800">
                          📸 {customImage ? 'Retake Photo' : 'Take Photo'}
                          <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="secondary" onClick={() => setIsAddingPlant(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitDisabled}>Add Plant</Button>
                </div>
              </form>
            </Card>
          )}
          <div className="space-y-3">
            {inventoryList.length === 0 ? (
              <Card className="text-center py-12 shadow-sm border-dashed border-2 border-emerald-200 dark:border-emerald-800">
                <div className="text-4xl mb-4">🌱</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">You have no active plants in your inventory. Scan a new tag to get started!</p>
              </Card>
            ) : (
              inventoryList.map(item => (
                <Card key={item.qrId} onClick={() => onNavigate(item.qrId)} className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">{item.archetype?.commonName}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide font-semibold">{item.zone?.name} • {item.location?.name}</p>
                    </div>
                    <StatusBadge status={item.isOverdue ? 'overdue' : 'hydrated'}>
                      {item.isOverdue ? 'Overdue' : 'Hydrated'}
                    </StatusBadge>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      <span>Hydration Level</span>
                      <span className={item.ratio <= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{Math.round(item.ratio * 100)}%</span>
                    </div>
                    <ProgressBarContainer>
                      <ProgressBarFill ratio={item.ratio} />
                    </ProgressBarContainer>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};