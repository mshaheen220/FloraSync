import { FC, FormEvent } from 'react';
import { Zone } from '../../types';
import { Card, Button, Input } from '../styles/StyledElements';

interface ZoneCardProps {
  zone: Zone;
  locationsInZone: number;
  isEditing: boolean;
  editZoneData: Partial<Zone>;
  setEditZoneData: (data: Partial<Zone>) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (e: FormEvent) => void;
  onDelete: () => void;
  onNavigateZone: () => void;
}

export const ZoneCard: FC<ZoneCardProps> = ({ zone, locationsInZone, isEditing, editZoneData, setEditZoneData, onEditStart, onEditCancel, onSave, onDelete, onNavigateZone }) => {
  if (isEditing) {
    return (
      <Card className="border-emerald-500 dark:border-emerald-500 shadow-md !p-4">
        <form onSubmit={onSave} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Zone Name</label>
            <Input value={editZoneData.name || ''} onChange={e => setEditZoneData({...editZoneData, name: e.target.value})} className="!mb-0 py-2.5" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
            <Input value={editZoneData.description || ''} onChange={e => setEditZoneData({...editZoneData, description: e.target.value})} className="!mb-0 py-2.5" />
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
          <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{zone.name}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{zone.id}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">{locationsInZone} sub-locations</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onNavigateZone} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90" title="View Zone">👁️</button>
          <button onClick={onEditStart} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90">✏️</button>
          <button onClick={onDelete} disabled={locationsInZone > 0} className={`p-2 rounded-lg transition-colors ${locationsInZone > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>🗑️</button>
        </div>
      </div>
    </Card>
  );
};