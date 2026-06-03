import { FC, useState, FormEvent, ChangeEvent } from 'react';
import { PlantInstance, JournalEntry } from '../../types';
import { Card, Button, Input, Subtitle } from '../styles/StyledElements';

interface PlantJournalProps {
  instance: PlantInstance;
  onUpdate: (updates: Partial<PlantInstance>) => void;
  showToast: (msg: string) => void;
}

export const PlantJournal: FC<PlantJournalProps> = ({ instance, onUpdate, showToast }) => {
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalForm, setJournalForm] = useState<Partial<JournalEntry>>({});

  const handleJournalImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setJournalForm({...journalForm, imageUrl: reader.result as string});
      reader.readAsDataURL(file);
    }
  };

  const handleSaveJournal = (e: FormEvent) => {
    e.preventDefault();
    
    const currentJournal = instance.journal || [];
    const timestamp = journalForm.timestamp ? new Date(journalForm.timestamp).toISOString() : new Date().toISOString();
    let updatedJournal;

    if (editingJournalId) {
      updatedJournal = currentJournal.map(entry => 
        entry.id === editingJournalId ? { ...entry, ...journalForm, timestamp } as JournalEntry : entry
      );
    } else {
      const newEntry: JournalEntry = {
        id: `j-${Date.now()}`,
        timestamp,
        title: journalForm.title || '',
        note: journalForm.note || '',
        imageUrl: journalForm.imageUrl || '',
        height: journalForm.height || '',
        fullness: journalForm.fullness || '',
        colorAppearance: journalForm.colorAppearance || '',
        healthIssues: journalForm.healthIssues || '',
        growthStage: journalForm.growthStage || '',
        activityType: journalForm.activityType || 'Observation',
        harvestAmount: journalForm.harvestAmount || ''
      };
      updatedJournal = [newEntry, ...currentJournal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    onUpdate({ journal: updatedJournal });
    setEditingJournalId(null);
    setIsAddingJournal(false);
    setJournalForm({});
    showToast(editingJournalId ? '📓 Journal updated!' : '📓 Journal entry added!');
  };

  const handleDeleteJournal = (id: string) => {
    if (!window.confirm('Delete this journal entry?')) return;
    const currentJournal = instance.journal || [];
    onUpdate({ journal: currentJournal.filter(j => j.id !== id) });
    showToast('🗑️ Entry removed');
  };

  const handleSetThumbnail = (imageUrl: string) => {
    onUpdate({ imageUrl });
    showToast('🖼️ Cover photo updated!');
  };

  // Ensure at least one piece of actual content is provided before allowing a save
  const isSubmitDisabled = !(
    (journalForm.title && journalForm.title.trim() !== '') ||
    (journalForm.note && journalForm.note.trim() !== '') ||
    (journalForm.imageUrl && journalForm.imageUrl !== '') ||
    (journalForm.height && journalForm.height.trim() !== '') ||
    (journalForm.fullness && journalForm.fullness.trim() !== '') ||
    (journalForm.colorAppearance && journalForm.colorAppearance.trim() !== '') ||
    (journalForm.healthIssues && journalForm.healthIssues.trim() !== '') ||
    (journalForm.growthStage && journalForm.growthStage.trim() !== '') ||
    (journalForm.harvestAmount && journalForm.harvestAmount.trim() !== '') ||
    (journalForm.activityType && journalForm.activityType !== 'Observation')
  );

  return (
    <div className="mt-2">
      {!isAddingJournal && !editingJournalId ? (
        <Button onClick={() => { setIsAddingJournal(true); setJournalForm({ timestamp: new Date().toISOString().slice(0, 16) }); }} className="mb-6">+ Add Journal Entry</Button>
      ) : (
        <Card className="mb-6 border-emerald-500 shadow-md">
          <Subtitle className="!mt-0 mb-4">{editingJournalId ? 'Edit Entry' : 'New Journal Entry'}</Subtitle>
          <form onSubmit={handleSaveJournal} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date & Time</label>
              <Input type="datetime-local" value={journalForm.timestamp || ''} onChange={e => setJournalForm({...journalForm, timestamp: e.target.value})} className="!mb-0" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Title (Optional)</label>
              <Input placeholder="e.g. First flowers!" value={journalForm.title || ''} onChange={e => setJournalForm({...journalForm, title: e.target.value})} className="!mb-0" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Activity Type</label>
                <select value={journalForm.activityType || 'Observation'} onChange={e => setJournalForm({...journalForm, activityType: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
                  <option value="Observation">👁️ Observation</option>
                  <option value="Harvest">🧺 Harvest</option>
                  <option value="Pruning">✂️ Pruning</option>
                  <option value="Treatment">🧪 Treatment (Pest/Disease)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Stage</label>
                <select value={journalForm.growthStage || ''} onChange={e => setJournalForm({...journalForm, growthStage: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
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

            {journalForm.activityType === 'Harvest' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Harvest Amount</label>
                <Input placeholder="e.g. 3 tomatoes, or 12 oz" value={journalForm.harvestAmount || ''} onChange={e => setJournalForm({...journalForm, harvestAmount: e.target.value})} className="!mb-0" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Height (in)</label>
                <Input type="number" step="0.1" min="0" placeholder="e.g. 12.5" value={journalForm.height || ''} onChange={e => setJournalForm({...journalForm, height: e.target.value})} className="!mb-0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fullness</label>
                <select value={journalForm.fullness || ''} onChange={e => setJournalForm({...journalForm, fullness: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
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
                <select value={journalForm.healthIssues || ''} onChange={e => setJournalForm({...journalForm, healthIssues: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
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
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Note (Optional)</label>
              <textarea value={journalForm.note || ''} onChange={e => setJournalForm({...journalForm, note: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} placeholder="Observations, measurements, thoughts..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Photo (Optional)</label>
              <div className="flex items-center gap-3">
                {journalForm.imageUrl && (
                  <img src={journalForm.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                )}
                <label className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 transition-all cursor-pointer border border-transparent dark:border-emerald-800">
                  📸 {journalForm.imageUrl ? 'Change Photo' : 'Add Photo'}
                  <input type="file" accept="image/*" onChange={handleJournalImageCapture} className="hidden" />
                </label>
                {journalForm.imageUrl && (
                  <button type="button" onClick={() => setJournalForm({...journalForm, imageUrl: ''})} className="text-red-500 text-sm font-semibold">Remove</button>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="secondary" onClick={() => { setIsAddingJournal(false); setEditingJournalId(null); setJournalForm({}); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitDisabled}>Save Entry</Button>
            </div>
          </form>
        </Card>
      )}

      {instance.journal && instance.journal.length > 0 ? (
        <div className="relative border-l-2 border-emerald-200 dark:border-emerald-800 ml-4 pl-6 space-y-6 mb-8 mt-2">
          {instance.journal.map(entry => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 ring-4 ring-slate-50 dark:ring-slate-900"></div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {new Date(entry.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingJournalId(entry.id); setJournalForm({ ...entry, timestamp: new Date(entry.timestamp).toISOString().slice(0, 16) }); setIsAddingJournal(false); }} className="text-slate-400 hover:text-emerald-600 active:scale-90 transition-transform">✏️</button>
                  <button onClick={() => handleDeleteJournal(entry.id)} className="text-slate-400 hover:text-red-600 active:scale-90 transition-transform">🗑️</button>
                </div>
              </div>
              {entry.title && <h4 className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">{entry.title}</h4>}
              
              {(entry.activityType && entry.activityType !== 'Observation' || entry.harvestAmount || entry.height || entry.fullness || entry.colorAppearance || entry.healthIssues || entry.growthStage) && (
                <div className="flex flex-wrap gap-2 mb-3 mt-1">
                  {entry.activityType && entry.activityType !== 'Observation' && (
                    <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 font-bold">
                      {entry.activityType === 'Harvest' ? '🧺 Harvest' : entry.activityType === 'Pruning' ? '✂️ Pruning' : '🧪 Treatment'}
                    </span>
                  )}
                  {entry.harvestAmount && <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800 font-bold">⚖️ {entry.harvestAmount}</span>}
                  {entry.height && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">📏 {entry.height}"</span>}
                  {entry.growthStage && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">🌱 {entry.growthStage}</span>}
                  {entry.fullness && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">🌿 {entry.fullness}</span>}
                  {entry.colorAppearance && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">🎨 {entry.colorAppearance}</span>}
                  {entry.healthIssues && entry.healthIssues !== 'None' && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2 py-1 rounded-md border border-red-200 dark:border-red-800">⚠️ {entry.healthIssues}</span>}
                  {entry.healthIssues === 'None' && <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">✨ Healthy</span>}
                </div>
              )}

              {entry.note && <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{entry.note}</p>}
              {entry.imageUrl && (
                <div className="mt-2">
                  <img src={entry.imageUrl} alt={entry.title || 'Journal photo'} className="w-full max-h-64 object-cover rounded-xl border border-slate-200 dark:border-slate-700 mb-2" />
                  <button onClick={() => handleSetThumbnail(entry.imageUrl!)} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    {instance.imageUrl === entry.imageUrl ? '★ Current Cover Photo' : 'Set as Cover Photo'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic mt-2 mb-8">No journal entries yet.</p>
      )}
    </div>
  );
};