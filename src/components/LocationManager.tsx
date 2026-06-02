import { useState, FC, FormEvent, useMemo } from 'react';
import { Location, Zone, PlantInstance, PlantArchetype } from '../../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle } from '../styles/StyledElements';
import { Theme } from '../App';
import { PlantInstanceCard } from './PlantInstanceCard';
import { ZoneCard } from './ZoneCard';
import { LocationCard } from './LocationCard';
import { PlantRegistrationForm } from './PlantRegistrationForm';

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
    
              return (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  locationsInZone={locationsInZone}
                  isEditing={isEditing}
                  editZoneData={editZoneData}
                  setEditZoneData={setEditZoneData}
                  onEditStart={() => { setEditingZoneId(zone.id); setEditZoneData(zone); }}
                  onEditCancel={() => setEditingZoneId(null)}
                  onSave={(e) => { e.preventDefault(); onUpdateZone(zone.id, editZoneData); setEditingZoneId(null); showToast('📍 Zone updated!'); }}
                  onDelete={() => { if (locationsInZone === 0 && window.confirm('Delete this zone?')) { onDeleteZone(zone.id); showToast('🗑️ Zone removed'); } }}
                  onNavigateZone={() => onNavigateZone(zone.id)}
                />
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
    
              return (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  zoneName={zone?.name}
                  zones={zones}
                  plantsInLocation={plantsInZone}
                  isEditing={isEditing}
                  editData={editData}
                  setEditData={setEditData}
                  onEditStart={() => { setEditingId(loc.id); setEditData(loc); }}
                  onEditCancel={() => setEditingId(null)}
                  onSave={(e) => { e.preventDefault(); onUpdate(loc.id, editData); setEditingId(null); showToast('📍 Location updated!'); }}
                  onDelete={() => { if (plantsInZone === 0 && window.confirm('Delete this location?')) { onDelete(loc.id); showToast('🗑️ Location removed'); } }}
                  onNavigateLocation={() => onNavigateLocation(loc.id)}
                />
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
              <PlantRegistrationForm 
                archetypes={archetypes} 
                locations={locations} 
                zones={zones} 
                onRegister={(qrId, identifier, isNew, locationId, isNewLocation, zoneId, isNewZone, imageUrl) => {
                  onRegister(qrId, identifier, isNew, locationId, isNewLocation, zoneId, isNewZone, imageUrl);
                  showToast('🌱 Plant added successfully!');
                  setIsAddingPlant(false);
                }} 
                onCancel={() => setIsAddingPlant(false)} 
                submitLabel="Add Plant" 
              />
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
                <PlantInstanceCard 
                  key={item.qrId}
                  instance={item}
                  archetype={item.archetype}
                  locationName={item.location?.name}
                  zoneName={item.zone?.name}
                  onClick={() => onNavigate(item.qrId)}
                />
              ))
            )}
          </div>
        </>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};