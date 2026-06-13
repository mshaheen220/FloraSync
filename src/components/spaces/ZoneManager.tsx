import { useState, FC, FormEvent } from 'react';
import { Container, Card, Button, Input, Toast, Subtitle } from '../../styles/StyledElements';
import { ZoneCard } from './ZoneCard';
import { PageHeader } from '../common/PageHeader';
import { useGarden } from '../../contexts/GardenContext';
import { Zone } from '../../../types';

interface ZoneManagerProps {
  onNavigateZone: (id: string) => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const ZoneManager: FC<ZoneManagerProps> = ({ onNavigateZone, onOpenMenu, onOpenWorkspaceMenu }) => {
  const { gardenProfile, currentUser, zones, locations, onAddZone, onUpdateZone, onDeleteZone } = useGarden();
  const [toastMessage, setToastMessage] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [newZoneEvaporationModifier, setNewZoneEvaporationModifier] = useState(1.0);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneIsCovered, setNewZoneIsCovered] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneData, setEditZoneData] = useState<Partial<Zone>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddZone = (e: FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    onAddZone(newZoneName, newZoneIsCovered, newZoneDescription, newZoneEvaporationModifier);
    setNewZoneName('');
    setNewZoneIsCovered(false);
    setNewZoneDescription('');
    setNewZoneEvaporationModifier(1.0);
    setIsAddingZone(false);
    showToast('📍 Zone added successfully!');
  };

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title="Zone Manager" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <Subtitle>Manage Zones</Subtitle>
      {!isAddingZone && currentUser?.workspaceRole !== 'viewer' && (
        <Button onClick={() => setIsAddingZone(true)} className="mb-6">+ Add New Zone</Button>
      )}
      {isAddingZone && currentUser?.workspaceRole !== 'viewer' && (
       <Card className="mb-6 shadow-md border-primary-500 dark:border-primary-500">
        <Subtitle className="!mt-0 mb-4">Add New Zone</Subtitle>
        <form onSubmit={handleAddZone} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Zone Name</label>
            <Input placeholder="e.g. Greenhouse" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} className="!mb-0 py-2.5" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
            <Input placeholder="e.g. Backyard vegetable beds" value={newZoneDescription} onChange={e => setNewZoneDescription(e.target.value)} className="!mb-0 py-2.5" />
          </div>
          <div>
            <label className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Evaporation Modifier</span>
              <span className="text-primary-600 dark:text-primary-400">{newZoneEvaporationModifier}x</span>
            </label>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 pb-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <input 
                type="range" min="0.5" max="1.5" step="0.1" 
                value={newZoneEvaporationModifier} 
                onChange={e => setNewZoneEvaporationModifier(parseFloat(e.target.value))} 
                className="w-full accent-primary-600 dark:accent-primary-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                <span>Slower (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Faster (1.5x)</span>
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <input 
              type="checkbox" 
              checked={newZoneIsCovered} 
              onChange={e => setNewZoneIsCovered(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Covered Area (No Natural Rain)</span>
          </label>
          <div className="flex gap-2 mt-2">
            <Button type="button" $variant="secondary" onClick={() => setIsAddingZone(false)}>Cancel</Button>
            <Button type="submit">Add Zone</Button>
          </div>
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
              currentUserId={currentUser?.id || ''}
              key={zone.id} zone={zone} locationsInZone={locationsInZone} isEditing={isEditing}
              editZoneData={editZoneData} setEditZoneData={setEditZoneData}
              onEditStart={() => { setEditingZoneId(zone.id); setEditZoneData(zone); }} onEditCancel={() => setEditingZoneId(null)}
              onSave={(e) => { e.preventDefault(); onUpdateZone(zone.id, editZoneData); setEditingZoneId(null); showToast('📍 Zone updated!'); }}
              onDelete={() => { 
                if (locationsInZone > 0) {
                  showToast('⚠️ Cannot delete a Zone that still contains locations!');
                } else if (window.confirm('Delete this zone?')) { 
                  onDeleteZone(zone.id); 
                  showToast('🗑️ Zone removed'); 
                } 
              }}
              onNavigateZone={() => onNavigateZone(zone.id)}
            />
          );
        })}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};