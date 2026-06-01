import { useState, FC, FormEvent } from 'react';
import { Location, Zone, PlantInstance } from '../../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle } from '../styles/StyledElements';
import { Theme } from '../App';

interface LocationManagerProps {
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
}

export const LocationManager: FC<LocationManagerProps> = ({ locations, zones, instances, theme, onThemeChange, onAddZone, onUpdateZone, onDeleteZone, onAdd, onUpdate, onDelete, onManageArchetypes, onGoHome, onNavigateLocation }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneData, setEditZoneData] = useState<Partial<Zone>>({});

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

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center gap-3 pt-6">
        <button onClick={onGoHome} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
          &larr;
        </button>
        <Title className="!mb-0">Settings</Title>
      </header>

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

      <Subtitle>Database</Subtitle>
      <Card>
        <Button variant="secondary" onClick={onManageArchetypes}>📖 Manage Plant Dictionary</Button>
      </Card>

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
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};