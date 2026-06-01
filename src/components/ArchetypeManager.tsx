import { useState, FC, FormEvent } from 'react';
import { PlantArchetype, PlantInstance } from '../../types';
import { Container, Title, Card, Button, Input, Toast } from '../styles/StyledElements';

interface ArchetypeManagerProps {
  archetypes: PlantArchetype[];
  instances: PlantInstance[];
  onUpdate: (id: string, updates: Partial<PlantArchetype>) => void;
  onDelete: (id: string) => void;
  onGoBack: () => void;
}

export const ArchetypeManager: FC<ArchetypeManagerProps> = ({ archetypes, instances, onUpdate, onDelete, onGoBack }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlantArchetype>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = (e: FormEvent, id: string) => {
    e.preventDefault();
    onUpdate(id, editData);
    setEditingId(null);
    showToast('📖 Plant reference updated!');
  };

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <header className="mb-6 flex items-center gap-3 pt-6">
        <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
          &larr;
        </button>
        <Title className="!mb-0">Plant Dictionary</Title>
      </header>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
        Manage the baseline care requirements for your garden. Changes here will apply to all tracked plants of this type.
      </p>

      <div className="space-y-4">
        {archetypes.map(arch => {
          const inUseCount = instances.filter(i => i.archetypeId === arch.id).length;
          const isEditing = editingId === arch.id;

          if (isEditing) {
            return (
              <Card key={arch.id} className="border-emerald-500 dark:border-emerald-500 shadow-md">
                <form onSubmit={(e) => handleSave(e, arch.id)} className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Common Name</label>
                    <Input value={editData.commonName || ''} onChange={e => setEditData({...editData, commonName: e.target.value})} className="!mb-0 py-2" required />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Scientific Name</label>
                      <Input value={editData.scientificName || ''} onChange={e => setEditData({...editData, scientificName: e.target.value})} className="!mb-0 py-2" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                      <Input value={editData.category || ''} onChange={e => setEditData({...editData, category: e.target.value})} className="!mb-0 py-2" required />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Water (Days)</label>
                      <Input type="number" min="1" value={editData.waterIntervalDays || ''} onChange={e => setEditData({...editData, waterIntervalDays: Number(e.target.value)})} className="!mb-0 py-2" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Feed (Days)</label>
                      <Input type="number" min="1" value={editData.feedingIntervalDays || ''} onChange={e => setEditData({...editData, feedingIntervalDays: Number(e.target.value)})} className="!mb-0 py-2" required />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sunlight</label>
                      <Input value={editData.sunRequirement || ''} onChange={e => setEditData({...editData, sunRequirement: e.target.value})} className="!mb-0 py-2" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Harvest (Days)</label>
                      <Input type="number" min="0" value={editData.daysToHarvest || ''} onChange={e => setEditData({...editData, daysToHarvest: Number(e.target.value)})} className="!mb-0 py-2" required />
                    </div>
                  </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Habit</label>
                    <Input value={editData.growthHabit || ''} onChange={e => setEditData({...editData, growthHabit: e.target.value})} className="!mb-0 py-2" required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hardiness Zones (Numbers)</label>
                    <Input value={editData.hardinessZones?.join(', ') || ''} onChange={e => setEditData({...editData, hardinessZones: e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))})} className="!mb-0 py-2" placeholder="e.g. 10, 11" />
                  </div>
                  </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hardiness Note</label>
                  <Input value={editData.hardinessNote || ''} onChange={e => setEditData({...editData, hardinessNote: e.target.value})} className="!mb-0 py-2" placeholder="e.g. Grow as annual in Zone 6/7" />
                </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">When to Plant</label>
                      <Input value={editData.whenToPlant || ''} onChange={e => setEditData({...editData, whenToPlant: e.target.value})} className="!mb-0 py-2" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">When to Harvest</label>
                      <Input value={editData.whenToHarvest || ''} onChange={e => setEditData({...editData, whenToHarvest: e.target.value})} className="!mb-0 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Large Harvest Uses</label>
                    <textarea value={editData.usesForLargeHarvests || ''} onChange={e => setEditData({...editData, usesForLargeHarvests: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">What to Feed</label>
                    <textarea value={editData.whatToFeed || ''} onChange={e => setEditData({...editData, whatToFeed: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Image URL / Path</label>
                    <Input value={editData.imageUrl || ''} onChange={e => setEditData({...editData, imageUrl: e.target.value})} className="!mb-0 py-2" placeholder="/images/vegetables/plant.jpg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pruning Tips</label>
                    <textarea 
                      value={editData.pruningTips || ''} 
                      onChange={e => setEditData({...editData, pruningTips: e.target.value})} 
                      className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Flavor Profile</label>
                    <Input value={editData.flavorProfile || ''} onChange={e => setEditData({...editData, flavorProfile: e.target.value})} className="!mb-0 py-2" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Companions (Comma separated)</label>
                    <Input value={editData.companionPlants?.join(', ') || ''} onChange={e => setEditData({...editData, companionPlants: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})} className="!mb-0 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Combative (Comma separated)</label>
                    <Input value={editData.combativePlants?.join(', ') || ''} onChange={e => setEditData({...editData, combativePlants: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})} className="!mb-0 py-2" />
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
            <Card key={arch.id} className="!p-4 relative">
              <button onClick={() => { setEditingId(arch.id); setEditData(arch); }} className="absolute top-4 right-4 text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90 transition-transform">
                ✏️
              </button>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 pr-8">{arch.commonName}</h3>
              <div className="flex gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
                <span>💧 {arch.waterIntervalDays}d</span>
                <span>🪴 {arch.feedingIntervalDays}d</span>
                <span>☀️ {arch.sunRequirement}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-1">
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{inUseCount} planted</span>
                <button 
                  onClick={() => { if (inUseCount === 0 && window.confirm('Delete this plant archetype?')) { onDelete(arch.id); showToast('🗑️ Archetype removed'); } }}
                  disabled={inUseCount > 0}
                  className={`text-sm font-medium ${inUseCount > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                >
                  Delete
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};