import { FC, FormEvent, useState } from 'react';
import { Location, Zone } from '../../../types';
import { Card, Button, Input } from '../../styles/StyledElements';
import { Icon } from '../common/Icon';
import { NutrientProfileInfoModal } from '../common/NutrientProfileInfoModal';
import { FEED_PROFILE_LABELS } from '../../utils/constants';

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
  canEdit?: boolean;
}

export const LocationCard: FC<LocationCardProps> = ({ location, zoneName, zones, plantsInLocation, isEditing, editData, setEditData, onEditStart, onEditCancel, onSave, onDelete, onNavigateLocation, canEdit }) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  if (isEditing) {
    return (
      <>
      <Card className="border-primary-500 dark:border-primary-500 shadow-md !p-4">
        <form onSubmit={onSave} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Zone</label>
            <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={editData.zoneId || ''} onChange={e => setEditData({...editData, zoneId: e.target.value})} required>
              <option value="" disabled>Select a zone...</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Specific Name (e.g. Shelf B)</label>
            <Input value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="!mb-0 py-2.5" required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nutrient Profile</label>
              <button type="button" onClick={() => setIsInfoOpen(true)} className="text-primary-500 hover:text-primary-600 transition-colors">
                <Icon name="help-circle" size={16} />
              </button>
            </div>
            <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={editData.activeNutrientProfile || ''} onChange={e => setEditData({...editData, activeNutrientProfile: e.target.value ? (e.target.value as any) : undefined})}>
              <option value="">No Override (Inherit/Default)</option>
              <option value="BLOOM_BOOST">Heavy Feeders (Fruit & Yield)</option>
              <option value="VEG_GROW">Leafy & Lush (High Nitrogen)</option>
              <option value="LOW_FEED">Mediterranean (Low-to-No Feed)</option>
              <option value="ACID_LOVERS">Acid Lovers (Low-pH Specialty)</option>
            </select>
          </div>
          <div>
            <label className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              <span>Feeding Modifier</span>
              <span className="text-amber-600 dark:text-amber-400">{editData.feedingModifier || 1.0}x</span>
            </label>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 pb-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <input type="range" min="0.5" max="3.0" step="0.1" value={editData.feedingModifier || 1.0} onChange={e => setEditData({...editData, feedingModifier: parseFloat(e.target.value)})} className="w-full accent-amber-600 dark:accent-amber-500" />
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                <span>Less (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>More (3.0x)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
          <Button type="button" $variant="secondary" onClick={onEditCancel}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Card>
      <NutrientProfileInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        currentProfile={editData.activeNutrientProfile}
      />
      </>
    );
  }

  return (
    <Card className="!p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{location.name}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{location.id}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-0.5">
            {zoneName}
            {location.activeNutrientProfile && (
              <span className="text-slate-500 dark:text-slate-400 normal-case ml-2">
                • {FEED_PROFILE_LABELS[location.activeNutrientProfile] || location.activeNutrientProfile}
                {location.feedingModifier && location.feedingModifier !== 1.0 ? ` (${location.feedingModifier}x)` : ''}
              </span>
            )}
          </p>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-2">{plantsInLocation} active plant{plantsInLocation !== 1 && 's'}</p>
        </div>
        <div className="flex gap-1">
      <button onClick={onNavigateLocation} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 active:scale-90" title="View Location"><Icon name="view" size={18} /></button>
          {canEdit && (
            <>
          <button onClick={onEditStart} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 active:scale-90"><Icon name="edit" size={18} /></button>
          <button onClick={onDelete} className={`p-2 rounded-lg transition-colors ${plantsInLocation > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-30' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}><Icon name="delete" size={18} /></button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};