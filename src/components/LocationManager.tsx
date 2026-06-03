import { useState, useEffect, FC, FormEvent, useMemo } from 'react';
import { Location, Zone, PlantInstance, PlantArchetype } from '../../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle, MenuButton } from '../styles/StyledElements';
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
  onGoBack: () => void;
  onOpenMenu: () => void;
  onNavigateLocation: (id: string) => void;
  onNavigateZone: (id: string) => void;
  onNavigate: (qrId: string) => void;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
}

export const LocationManager: FC<LocationManagerProps> = ({ mode, archetypes, locations, zones, instances, theme, onThemeChange, onAddZone, onUpdateZone, onDeleteZone, onAdd, onUpdate, onDelete, onGoBack, onOpenMenu, onNavigateLocation, onNavigateZone, onNavigate, onRegister }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneData, setEditZoneData] = useState<Partial<Zone>>({});
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [expandedInventoryCategories, setExpandedInventoryCategories] = useState<string[]>([]);
  const [inventoryGroupBy, setInventoryGroupBy] = useState<'category' | 'zone' | 'location'>('category');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [expandedLocationZones, setExpandedLocationZones] = useState<string[]>([]);

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

  const toggleInventoryCategory = (category: string) => {
    setExpandedInventoryCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleLocationZone = (zoneName: string) => {
    setExpandedLocationZones(prev => 
      prev.includes(zoneName)
        ? prev.filter(z => z !== zoneName)
        : [...prev, zoneName]
    );
  };

  const groupedLocations = useMemo(() => {
    const groups = locations.reduce((acc, loc) => {
      const zone = zones.find(z => z.id === loc.zoneId);
      const zoneName = zone ? zone.name : 'Unassigned Zone';
      if (!acc[zoneName]) acc[zoneName] = [];
      acc[zoneName].push(loc);
      return acc;
    }, {} as Record<string, Location[]>);

    const sortedZones = Object.keys(groups).sort();
    sortedZones.forEach(z => {
      groups[z].sort((a, b) => a.name.localeCompare(b.name));
    });

    return { groups, sortedZones };
  }, [locations, zones]);

  const groupedInventory = useMemo(() => {
    const today = new Date().getTime();
    let enrichedInstances = instances.map(instance => {
      const archetype = archetypes.find(a => a.id === instance.archetypeId);
      const location = locations.find(l => l.id === instance.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastWateredTime = new Date(instance.lastWatered).getTime();
      
      const zoneModifier = zone?.evaporationModifier || 1.0;
      const sunReq = archetype?.sunRequirement?.toLowerCase() || '';
      const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);
      
      const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
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
    });

    if (inventorySearchTerm.trim()) {
      const lowerTerm = inventorySearchTerm.toLowerCase();
      enrichedInstances = enrichedInstances.filter(item => 
        item.archetype?.commonName.toLowerCase().includes(lowerTerm)
      );
    }

    const groups = enrichedInstances.reduce((acc, curr) => {
      let groupKey = 'Uncategorized';
      if (inventoryGroupBy === 'category') {
        groupKey = curr.archetype?.category || 'Uncategorized';
      } else if (inventoryGroupBy === 'zone') {
        groupKey = curr.zone?.name || 'Unassigned Zone';
      } else if (inventoryGroupBy === 'location') {
        groupKey = curr.location?.name 
          ? `${curr.zone?.name || 'Unassigned Zone'} • ${curr.location.name}` 
          : 'Unassigned Location';
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(curr);
      return acc;
    }, {} as Record<string, typeof enrichedInstances>);

    const sortedCategories = Object.keys(groups).sort();
    sortedCategories.forEach(cat => {
      groups[cat].sort((a, b) => (a.archetype?.commonName || '').localeCompare(b.archetype?.commonName || ''));
    });

    return { groups, sortedCategories, totalCount: enrichedInstances.length };
  }, [instances, archetypes, locations, zones, inventoryGroupBy, inventorySearchTerm]);

  // Auto-expand categories when actively searching
  useEffect(() => {
    if (inventorySearchTerm.trim()) {
      setExpandedInventoryCategories(groupedInventory.sortedCategories);
    } else {
      setExpandedInventoryCategories([]);
    }
  }, [inventorySearchTerm, groupedInventory.sortedCategories]);

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
          </button>
          <Title className="!mb-0">
            {mode === 'settings' && 'General Settings'}
            {mode === 'zones' && 'Zone Manager'}
            {mode === 'locations' && 'Location Manager'}
            {mode === 'inventory' && 'Inventory Manager'}
          </Title>
        </div>
        <MenuButton onClick={onOpenMenu}>
          ☰
        </MenuButton>
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
    
          <Subtitle className="!mb-0">Existing Locations</Subtitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">(grouped by Zone)</p>
          <div className="space-y-4">
            {groupedLocations.sortedZones.length === 0 ? (
              <p className="text-sm text-slate-500 italic mt-4">No locations currently assigned.</p>
            ) : (
              groupedLocations.sortedZones.map(zoneName => (
                <div key={zoneName} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
                  <button 
                    onClick={() => toggleLocationZone(zoneName)}
                    className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
                  >
                    <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {zoneName} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedLocations.groups[zoneName].length})</span>
                    </Subtitle>
                    <span className={`text-slate-400 transition-transform duration-200 ${expandedLocationZones.includes(zoneName) ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedLocationZones.includes(zoneName) && (
                    <div className="space-y-3 mb-4">
                      {groupedLocations.groups[zoneName].map(loc => {
                        const plantsInLocation = instances.filter(i => i.locationId === loc.id).length;
                        const isEditing = editingId === loc.id;
              
                        return (
                          <LocationCard
                            key={loc.id}
                            location={loc}
                            zoneName={zoneName}
                            zones={zones}
                            plantsInLocation={plantsInLocation}
                            isEditing={isEditing}
                            editData={editData}
                            setEditData={setEditData}
                            onEditStart={() => { setEditingId(loc.id); setEditData(loc); }}
                            onEditCancel={() => setEditingId(null)}
                            onSave={(e) => { e.preventDefault(); onUpdate(loc.id, editData); setEditingId(null); showToast('📍 Location updated!'); }}
                            onDelete={() => { if (plantsInLocation === 0 && window.confirm('Delete this location?')) { onDelete(loc.id); showToast('🗑️ Location removed'); } }}
                            onNavigateLocation={() => onNavigateLocation(loc.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
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

          {instances.length > 0 && (
            <Input 
              placeholder="🔍 Search your plants..." 
              value={inventorySearchTerm} 
              onChange={(e) => setInventorySearchTerm(e.target.value)} 
            />
          )}

          {groupedInventory.totalCount > 0 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group By</span>
              <select 
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
                value={inventoryGroupBy}
                onChange={e => {
                  setInventoryGroupBy(e.target.value as any);
                  setExpandedInventoryCategories([]); // Auto-collapse everything when switching views
                }}
              >
                <option value="category">Plant Category</option>
                <option value="zone">Macro Zone</option>
                <option value="location">Specific Location</option>
              </select>
            </div>
          )}
          <div className="space-y-4">
            {groupedInventory.totalCount === 0 ? (
              <Card className="text-center py-12 shadow-sm border-dashed border-2 border-emerald-200 dark:border-emerald-800">
                <div className="text-4xl mb-4">🌱</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {inventorySearchTerm.trim() 
                    ? "No plants match your search." 
                    : "You have no active plants in your inventory. Scan a new tag to get started!"}
                </p>
              </Card>
            ) : (
              groupedInventory.sortedCategories.map(category => (
                <div key={category} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
                  <button 
                    onClick={() => toggleInventoryCategory(category)}
                    className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
                  >
                    <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {category} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedInventory.groups[category].length})</span>
                    </Subtitle>
                    <span className={`text-slate-400 transition-transform duration-200 ${expandedInventoryCategories.includes(category) ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedInventoryCategories.includes(category) && (
                    <div className="space-y-3 mb-4">
                      {groupedInventory.groups[category].map(item => (
                        <PlantInstanceCard 
                          key={item.qrId}
                          instance={item}
                          archetype={item.archetype}
                          locationName={item.location?.name}
                          zoneName={item.zone?.name}
                          zoneModifier={item.zone?.evaporationModifier}
                          onClick={() => onNavigate(item.qrId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};