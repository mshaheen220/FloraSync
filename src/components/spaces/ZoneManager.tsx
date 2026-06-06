import { useState, FC, FormEvent } from 'react';
import { Zone, Location } from '../../../types';
import { Container, Card, Button, Input, Toast, Subtitle } from '../../styles/StyledElements';
import { ZoneCard } from './ZoneCard';
import { PageHeader } from '../common/PageHeader';
import { User } from '../../App';

interface ZoneManagerProps {
  gardenName: string;
  zones: Zone[];
  locations: Location[];
  onAddZone: (name: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
  onNavigateZone: (id: string) => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  currentUser: User;
}

export const ZoneManager: FC<ZoneManagerProps> = ({ 
  gardenName, currentUser, zones, locations, onAddZone, onUpdateZone, onDeleteZone, onNavigateZone, onOpenMenu, onOpenWorkspaceMenu 
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
      <PageHeader title="Zone Manager" supertitle={gardenName} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <Subtitle>Manage Zones</Subtitle>
      {currentUser?.workspaceRole !== 'viewer' && (
       <Card>
        <form onSubmit={handleAddZone} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">New Macro Zone</label>
            <Input placeholder="Zone Name (e.g. Greenhouse)" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} className="!mb-0 py-2.5" />
          </div>
          <Button type="submit" className="mt-2">Add Zone</Button>
        </form>
      </Card>
      )}

      <Subtitle>Existing Zones</Subtitle>
      <div className="space-y-3 mb-8">
        {zones.map(zone => {
          const locationsInZone = locations.filter(l => l.zoneId === zone.id).length;
          const isEditing = editingZoneId === zone.id;
          return (
            <ZoneCard
              canEdit={currentUser?.workspaceRole !== 'viewer'}
              key={zone.id} zone={zone} locationsInZone={locationsInZone} isEditing={isEditing}
              editZoneData={editZoneData} setEditZoneData={setEditZoneData}
              onEditStart={() => { setEditingZoneId(zone.id); setEditZoneData(zone); }} onEditCancel={() => setEditingZoneId(null)}
              onSave={(e) => { e.preventDefault(); onUpdateZone(zone.id, editZoneData); setEditingZoneId(null); showToast('📍 Zone updated!'); }}
              onDelete={() => { if (locationsInZone === 0 && window.confirm('Delete this zone?')) { onDeleteZone(zone.id); showToast('🗑️ Zone removed'); } }}
              onNavigateZone={() => onNavigateZone(zone.id)}
              onTogglePin={() => onUpdateZone(zone.id, { isPinned: !zone.isPinned })}
            />
          );
        })}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};