import { FC, FormEvent } from 'react';
import { PlantArchetype } from '../../types';
import { Card, Button, Input } from '../styles/StyledElements';

interface ArchetypeCardProps {
  arch: PlantArchetype;
  inUseCount: number;
  isEditing: boolean;
  isViewing: boolean;
  editData: Partial<PlantArchetype>;
  setEditData: (data: Partial<PlantArchetype>) => void;
  onViewToggle: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (e: FormEvent) => void;
  onDelete: () => void;
}

export const ArchetypeCard: FC<ArchetypeCardProps> = ({
  arch,
  inUseCount,
  isEditing,
  isViewing,
  editData,
  setEditData,
  onViewToggle,
  onEditStart,
  onEditCancel,
  onSave,
  onDelete
}) => {
  if (isEditing) {
    return (
      <Card className="border-emerald-500 dark:border-emerald-500 shadow-md">
        <form onSubmit={onSave} className="flex flex-col gap-3">
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
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">How to Plant</label>
            <textarea value={editData.plantingInstructions || ''} onChange={e => setEditData({...editData, plantingInstructions: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={2} placeholder="e.g. Sow 1/4 inch deep, mulch heavily..." />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Requirements</label>
            <textarea value={editData.growthRequirements || ''} onChange={e => setEditData({...editData, growthRequirements: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={2} placeholder="e.g. Climbs aggressively, requires a sturdy trellis..." />
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
            <textarea value={editData.pruningTips || ''} onChange={e => setEditData({...editData, pruningTips: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
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
            <Button type="button" variant="secondary" onClick={onEditCancel}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="!p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{arch.commonName}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{arch.id}</p>
          <div className="flex gap-3 text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5">
            <span>💧 {arch.waterIntervalDays}d</span>
            <span>🪴 {arch.feedingIntervalDays}d</span>
            <span>☀️ {arch.sunRequirement}</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">{inUseCount} planted</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onViewToggle} className={`p-2 rounded-lg transition-colors active:scale-90 ${isViewing ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400'}`} title="View Details">👁️</button>
          <button onClick={onEditStart} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90">✏️</button>
          <button onClick={onDelete} disabled={inUseCount > 0} className={`p-2 rounded-lg transition-colors ${inUseCount > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>🗑️</button>
        </div>
      </div>
      {isViewing && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-sm space-y-3">
          {arch.imageUrl && (
            <img src={arch.imageUrl} alt={arch.commonName} className="w-full h-32 object-cover rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800" />
          )}
          {arch.scientificName && arch.scientificName !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Scientific Name</strong> <span className="italic block text-slate-700 dark:text-slate-300">{arch.scientificName}</span></div>}
          {(arch.category || arch.growthHabit) && (
            <div className="grid grid-cols-2 gap-2">
              {arch.category && arch.category !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Category</strong> <span className="block text-slate-700 dark:text-slate-300">{arch.category}</span></div>}
              {arch.growthHabit && arch.growthHabit !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Growth Habit</strong> <span className="block text-slate-700 dark:text-slate-300">{arch.growthHabit}</span></div>}
            </div>
          )}
          {arch.plantingInstructions && arch.plantingInstructions !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">How to Plant</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.plantingInstructions}</span></div>}
          {arch.growthRequirements && arch.growthRequirements !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Growth Requirements</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.growthRequirements}</span></div>}
          {arch.whatToFeed && arch.whatToFeed !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">What to Feed</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.whatToFeed}</span></div>}
          {arch.pruningTips && arch.pruningTips !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Pruning Tips</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.pruningTips}</span></div>}
          {arch.usesForLargeHarvests && arch.usesForLargeHarvests !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Harvest Uses</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.usesForLargeHarvests}</span></div>}
          {arch.flavorProfile && arch.flavorProfile !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Flavor Profile</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.flavorProfile}</span></div>}
        </div>
      )}
    </Card>
  );
};