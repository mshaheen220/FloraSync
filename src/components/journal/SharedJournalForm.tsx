import { FC, useState, FormEvent, useMemo, useEffect } from 'react';
import { JournalEntry, User, JournalActivityType } from '../../../types';
import { Card, Button, Input, Subtitle } from '../../styles/StyledElements';
import { Icon } from '../common/Icon';
import { ImageUploadInput } from '../common/ImageUploadInput';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

const getLocalDatetimeString = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

interface SharedJournalFormProps {
  initialData?: Partial<JournalEntry>;
  onSave: (entry: Partial<JournalEntry>) => void;
  onCancel: () => void;
  targetType: 'plant' | 'location' | 'zone' | 'garden';
  currentUser?: User | null;
}

export const SharedJournalForm: FC<SharedJournalFormProps> = ({ initialData, onSave, onCancel, targetType, currentUser }) => {
  const [journalForm, setJournalForm] = useState<Partial<JournalEntry>>(
    initialData?.timestamp ? initialData : { ...initialData, timestamp: getLocalDatetimeString() }
  );

  useEffect(() => {
    setJournalForm(initialData?.timestamp ? initialData : { ...initialData, timestamp: getLocalDatetimeString() });
  }, [initialData]);

  const allActivityTypes = useMemo(() => {
    let baseTypes: JournalActivityType[] = [];
    
    if (targetType === 'plant') {
      baseTypes = [
        { value: 'Observation', label: '👁️ Observation', badgeLabel: '👁️ Observation' },
        { value: 'Harvest', label: '🧺 Harvest', badgeLabel: '🧺 Harvest' },
        { value: 'Pruning', label: '✂️ Pruning', badgeLabel: '✂️ Pruning' },
        { value: 'Treatment', label: '🧪 Treatment (Pest/Disease)', badgeLabel: '🧪 Treatment' },
        { value: 'Watered', label: '💦 Watered', badgeLabel: '💦 Watered', isRoutine: true },
        { value: 'Fed', label: '🪴 Fed', badgeLabel: '🪴 Fed', isRoutine: true }
      ];
    } else {
      const defaultNoteType = targetType === 'garden' ? 'Garden Note' : targetType === 'zone' ? 'Zone Note' : 'Location Note';
      baseTypes = [
        { value: defaultNoteType, label: 'Note', badgeLabel: 'Note', iconUrl: 'pencil' },
        { value: 'Weather', label: 'Weather', badgeLabel: 'Weather', iconUrl: 'cloud-sun' },
        { value: 'Heavy Rain', label: 'Rain', badgeLabel: 'Heavy Rain', iconUrl: 'cloud-rain' },
        { value: 'Pest Sighting', label: 'Pests', badgeLabel: 'Pest Sighting', iconUrl: 'bug' },
        { value: 'Maintenance', label: 'Upkeep', badgeLabel: 'Maintenance', iconUrl: 'settings' },
        { value: 'Harvest', label: 'Harvest', badgeLabel: 'Harvest', iconUrl: 'apple' },
        { value: 'Planning', label: 'Plan', badgeLabel: 'Planning', iconUrl: 'lightbulb' },
        { value: 'Alert', label: 'Alert', badgeLabel: 'Alert', iconUrl: 'alert-circle' },
      ];
    }

    const addonTypes = currentUser?.activeAddonManifests?.flatMap(m => m.journalActivityTypes || []) || [];
    const typeMap = new Map(baseTypes.map(t => [t.value, t]));
    addonTypes.forEach(t => {
      typeMap.set(t.value, { ...typeMap.get(t.value), ...t });
    });
    return Array.from(typeMap.values());
  }, [currentUser?.activeAddonManifests, targetType]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(journalForm);
  };

  const defaultNoteType = targetType === 'garden' ? 'Garden Note' : targetType === 'zone' ? 'Zone Note' : targetType === 'location' ? 'Location Note' : 'Observation';
  const currentActivity = journalForm.activityType || defaultNoteType;

  const isSubmitDisabled = !(
    (journalForm.title && journalForm.title.trim() !== '') ||
    (journalForm.note && journalForm.note.trim() !== '') ||
    (journalForm.imageUrl && journalForm.imageUrl !== '') ||
    (targetType === 'plant' && (
      (journalForm.height && journalForm.height.trim() !== '') ||
      (journalForm.fullness && journalForm.fullness.trim() !== '') ||
      (journalForm.colorAppearance && journalForm.colorAppearance.trim() !== '') ||
      (journalForm.healthIssues && journalForm.healthIssues.trim() !== '') ||
      (journalForm.growthStage && journalForm.growthStage.trim() !== '') ||
      (journalForm.harvestAmount && journalForm.harvestAmount.trim() !== '')
    )) ||
    (targetType === 'plant' && journalForm.activityType && journalForm.activityType !== 'Observation')
  );

  return (
    <Card className="mb-6 border-primary-500 shadow-md animate-in slide-in-from-top-2 fade-in duration-200">
      <Subtitle className="!mt-0 mb-4">{initialData?.id ? 'Edit Entry' : 'New Entry'}</Subtitle>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date & Time</label>
          <Input type="datetime-local" value={journalForm.timestamp || ''} onChange={e => setJournalForm({...journalForm, timestamp: e.target.value})} className="!mb-0" required />
        </div>

        {targetType === 'plant' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Activity Type</label>
              <select value={currentActivity} onChange={e => setJournalForm({...journalForm, activityType: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
                {allActivityTypes.filter(t => !t.isHidden || t.value === currentActivity).map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Stage</label>
              <select value={journalForm.growthStage || ''} onChange={e => setJournalForm({...journalForm, growthStage: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
                <option value="">-- Select --</option>
                <option value="Seedling">Seedling</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Budding">Budding</option>
                <option value="Blooming">Blooming</option>
                <option value="Fruiting">Fruiting</option>
                <option value="Ripening">Ripening</option>
                <option value="Ready for Harvest">Ready for Harvest</option>
                <option value="Harvested">Harvested</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Note Type</label>
            <div className="grid grid-cols-4 gap-2">
              {allActivityTypes.map(type => {
                const isSelected = currentActivity === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setJournalForm({ ...journalForm, activityType: type.value })}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border ${isSelected ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/50 dark:border-primary-700 dark:text-primary-400 shadow-sm' : 'bg-surface-50 border-surface-200 text-slate-500 hover:bg-surface-100 dark:bg-surface-800/50 dark:border-surface-700 dark:text-slate-400 dark:hover:bg-surface-800'} transition-all`}
                  >
                    {type.iconUrl && <Icon name={type.iconUrl as any} size={18} />}
                    <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentActivity === 'Harvest' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Harvest Amount</label>
            <Input placeholder="e.g. 3 tomatoes, or 12 oz" value={journalForm.harvestAmount || ''} onChange={e => setJournalForm({...journalForm, harvestAmount: e.target.value})} className="!mb-0" />
          </div>
        )}

        {targetType === 'plant' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Height (in)</label>
                <Input type="number" step="0.1" min="0" placeholder="e.g. 12.5" value={journalForm.height || ''} onChange={e => setJournalForm({...journalForm, height: e.target.value})} className="!mb-0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fullness</label>
                <select value={journalForm.fullness || ''} onChange={e => setJournalForm({...journalForm, fullness: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
                  <option value="">-- Select --</option>
                  <option value="Sparse">Sparse</option>
                  <option value="Average">Average</option>
                  <option value="Lush">Lush</option>
                  <option value="Overgrown">Overgrown</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Health / Issues</label>
                <select value={journalForm.healthIssues || ''} onChange={e => setJournalForm({...journalForm, healthIssues: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
                  <option value="">-- Select --</option>
                  <option value="None">Healthy (None)</option>
                  <option value="Wilting">Wilting</option>
                  <option value="Insect Damage">Insect Damage</option>
                  <option value="Animal Bites">Animal Bites</option>
                  <option value="Fungus / Disease">Fungus / Disease</option>
                  <option value="Sunburn">Sunburn</option>
                  <option value="Nutrient Deficiency">Nutrient Deficiency</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Color / Look</label>
                <Input placeholder="e.g. Vibrant Green" value={journalForm.colorAppearance || ''} onChange={e => setJournalForm({...journalForm, colorAppearance: e.target.value})} className="!mb-0" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Title (Optional)</label>
          <Input placeholder="e.g. Added new grow lights" value={journalForm.title || ''} onChange={e => setJournalForm({...journalForm, title: e.target.value})} className="!mb-0" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Note {targetType === 'plant' ? '(Optional)' : '/ Description'}</label>
          <textarea value={journalForm.note || ''} onChange={e => setJournalForm({...journalForm, note: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={targetType === 'plant' ? 3 : 4} placeholder="Observations, measurements, thoughts..." />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Photo (Optional)</label>
          <div className="flex items-center gap-3">
            {journalForm.imageUrl && (
            <img src={journalForm.imageUrl} alt="Preview" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
            )}
            <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 transition-all cursor-pointer border border-transparent dark:border-primary-800">
              <Icon name="camera" size={18} /> {journalForm.imageUrl ? 'Change Photo' : 'Add Photo'}
              <ImageUploadInput onUpload={(base64) => setJournalForm({...journalForm, imageUrl: base64})} />
            </label>
            {journalForm.imageUrl && (
              <button type="button" onClick={() => setJournalForm({...journalForm, imageUrl: ''})} className="text-red-500 text-sm font-semibold px-2">Remove</button>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button type="button" $variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitDisabled}>Save Entry</Button>
        </div>
      </form>
    </Card>
  );
};