import { useState, FC, FormEvent } from 'react';
import { Zone, Location } from '../../../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle, MenuButton } from '../../styles/StyledElements';
import { ZoneCard } from './ZoneCard';

interface ZoneManagerProps {
  zones: Zone[];
  locations: Location[];
  onAddZone: (name: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
  onNavigateZone: (id: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
}

export const ZoneManager: FC<ZoneManagerProps> = ({ 
  zones, locations, onAddZone, onUpdateZone, onDeleteZone, onNavigateZone, onGoBack, onOpenMenu 
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
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

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
          </button>
          <Title className="!mb-0">Zone Manager</Title>
        </div>
        <MenuButton onClick={onOpenMenu}>
          ☰
        </MenuButton>
      </header>

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
              key={zone.id} zone={zone} locationsInZone={locationsInZone} isEditing={isEditing}
              editZoneData={editZoneData} setEditZoneData={setEditZoneData}
              onEditStart={() => { setEditingZoneId(zone.id); setEditZoneData(zone); }} onEditCancel={() => setEditingZoneId(null)}
              onSave={(e) => { e.preventDefault(); onUpdateZone(zone.id, editZoneData); setEditingZoneId(null); showToast('📍 Zone updated!'); }}
              onDelete={() => { if (locationsInZone === 0 && window.confirm('Delete this zone?')) { onDeleteZone(zone.id); showToast('🗑️ Zone removed'); } }}
              onNavigateZone={() => onNavigateZone(zone.id)}
            />
          );
        })}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};