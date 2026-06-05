import { useState, FC, FormEvent, useMemo } from 'react';
import { Location, Zone, PlantInstance } from '../../../types';
import { Container, Card, Button, Input, Toast, Subtitle } from '../../styles/StyledElements';
import { LocationCard } from './LocationCard';
import { PageHeader } from '../common/PageHeader';

interface LocationManagerProps {
  gardenName: string;
  locations: Location[];
  zones: Zone[];
  instances: PlantInstance[];
  onAdd: (name: string, zoneId: string) => void;
  onUpdate: (id: string, updates: Partial<Location>) => void;
  onDelete: (id: string) => void;
  onOpenMenu: () => void;
  onNavigateLocation: (id: string) => void;
  onOpenWorkspaceMenu?: () => void;
}

export const LocationManager: FC<LocationManagerProps> = ({ gardenName, locations, zones, instances, onAdd, onUpdate, onDelete, onOpenMenu, onNavigateLocation, onOpenWorkspaceMenu }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [expandedLocationZones, setExpandedLocationZones] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedZoneId) return;
    onAdd(newName, selectedZoneId);
    setNewName('');
    showToast('📍 Location added successfully!');
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

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title="Location Manager" supertitle={gardenName} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

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

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};
