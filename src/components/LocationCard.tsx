import { FC, FormEvent } from 'react';
import { Location, Zone } from '../../types';
import { Card, Button, Input } from '../styles/StyledElements';

interface LocationCardProps {
  location: Location;
  zoneName?: string;
  zones: Zone[];
  plantsInLocation: number;
  isEditing: boolean;
  editData: Partial<Location>;
  setEditData: (data: Partial<Location>) => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (e: FormEvent) => void;
  onDelete: () => void;
  onNavigateLocation: () => void;
}

export const LocationCard: FC<LocationCardProps> = ({ location, zoneName, zones, plantsInLocation, isEditing, editData, setEditData, onEditStart, onEditCancel, onSave, onDelete, onNavigateLocation }) => {
  if (isEditing) {
    return (
      <Card className="border-emerald-500 dark:border-emerald-500 shadow-md !p-4">
        <form onSubmit={onSave} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Zone</label>
            <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={editData.zoneId || ''} onChange={e => setEditData({...editData, zoneId: e.target.value})} required>
              <option value="" disabled>Select a zone...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Specific Name (e.g. Shelf B)</label>
            <Input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="!mb-0 py-2.5" required />
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
          <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{location.name}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{location.id}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-0.5">{zoneName}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">{plantsInLocation} active plant{plantsInLocation !== 1 && 's'}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onNavigateLocation} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90" title="View Location">👁️</button>
          <button onClick={onEditStart} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90">✏️</button>
          <button onClick={onDelete} disabled={plantsInLocation > 0} className={`p-2 rounded-lg transition-colors ${plantsInLocation > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>🗑️</button>
        </div>
      </div>
    </Card>
  );
};