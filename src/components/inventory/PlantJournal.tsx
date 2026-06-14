import { FC, useState, useMemo } from 'react';
import { PlantInstance, JournalEntry, User } from '../../../types';
import { Button } from '../../styles/StyledElements';
import { SharedJournalForm } from '../journal/SharedJournalForm';
import { SharedJournalFeed } from '../journal/SharedJournalFeed';
import { useGarden } from '../../contexts/GardenContext';

interface PlantJournalProps {
  instance: PlantInstance;
  onUpdate: (updates: Partial<PlantInstance>) => void;
  showToast: (msg: string) => void;
  currentUser?: User | null;
}

export const PlantJournal: FC<PlantJournalProps> = ({ instance, onUpdate, showToast, currentUser }) => {
  const { gardenJournal, locations, zones } = useGarden();
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [showRoutineCare, setShowRoutineCare] = useState(false);

  const routineTypes = ['Watered', 'Fed'];
  const addonRoutineTypes = currentUser?.activeAddonManifests?.flatMap(m => m.journalActivityTypes || [])?.filter(t => t.isRoutine).map(t => t.value) || [];
  const allRoutineTypes = [...routineTypes, ...addonRoutineTypes];

  const location = useMemo(() => locations.find(l => l.id === instance.locationId), [locations, instance.locationId]);
  const zone = useMemo(() => zones.find(z => z.id === location?.zoneId), [zones, location?.zoneId]);

  const allEvents = useMemo(() => {
    // Filter out legacy batchScope items from plant journals so they don't duplicate trickle-down parent events
    const plantEvents = (instance.journal || []).filter(e => !e.batchScope).map(e => ({ ...e, sourceType: 'plant', sourceName: 'This Plant' }));
    const locEvents = (location?.journal || []).map(e => ({ ...e, sourceType: 'location', sourceName: location?.name || 'Location' }));
    const zoneEvents = (zone?.journal || []).map(e => ({ ...e, sourceType: 'zone', sourceName: zone?.name || 'Zone' }));
    const globalEvents = (gardenJournal || []).map(e => ({ ...e, sourceType: 'garden', sourceName: 'Entire Garden' }));
    
    return [...plantEvents, ...locEvents, ...zoneEvents, ...globalEvents]
  }, [instance.journal, location, zone, gardenJournal]);

  const visibleJournal = useMemo(() => {
    return [...allEvents]
      .filter(entry => showRoutineCare ? true : !allRoutineTypes.includes(entry.activityType || ''))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allEvents, showRoutineCare, allRoutineTypes]);

  const hasRoutineEvents = useMemo(() => allEvents.some(j => allRoutineTypes.includes(j.activityType || '')), [allEvents, allRoutineTypes]);

  const handleSave = (entryData: Partial<JournalEntry>) => {
    const currentJournal = instance.journal || [];
    let updatedJournal;
    
    const cleanedData = { ...entryData };
    delete (cleanedData as any).sourceType;
    delete (cleanedData as any).sourceName;

    if (editingJournal) {
      updatedJournal = currentJournal.map(entry => 
        entry.id === editingJournal.id ? { ...entry, ...cleanedData } as JournalEntry : entry
      );
    } else {
      const newEntry = {
        ...cleanedData,
        id: `j-plant-${Date.now()}`,
        authorName: currentUser?.name || ''
      } as JournalEntry;
      updatedJournal = [newEntry, ...currentJournal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    
    onUpdate({ journal: updatedJournal });
    setEditingJournal(null);
    setIsAddingJournal(false);
    showToast(editingJournal ? '📓 Journal updated!' : '📓 Journal entry added!');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this journal entry?')) return;
    const currentJournal = instance.journal || [];
    onUpdate({ journal: currentJournal.filter(j => j.id !== id) });
    showToast('🗑️ Entry removed');
  };

  const handleSetThumbnail = (imageUrl: string) => {
    onUpdate({ imageUrl });
    showToast('🖼️ Cover photo updated!');
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        {!isAddingJournal && !editingJournal && (
          <Button onClick={() => setIsAddingJournal(true)} className="w-auto flex-shrink-0">+ Add Journal Entry</Button>
        )}
        
        {hasRoutineEvents && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer ml-auto bg-slate-50 dark:bg-slate-800/50 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
            <input type="checkbox" checked={showRoutineCare} onChange={e => setShowRoutineCare(e.target.checked)} className="accent-primary-600 w-3.5 h-3.5 rounded" />
            Show Routine Care
          </label>
        )}
      </div>

      {(isAddingJournal || editingJournal) && (
        <SharedJournalForm 
          initialData={editingJournal || undefined}
          onSave={handleSave}
          onCancel={() => { setIsAddingJournal(false); setEditingJournal(null); }}
          targetType="plant"
          currentUser={currentUser}
        />
      )}

      <SharedJournalFeed 
        entries={visibleJournal}
        onEdit={(entry) => setEditingJournal(entry)}
        onDelete={handleDelete}
        onSetThumbnail={handleSetThumbnail}
        currentImageUrl={instance.imageUrl}
        currentUser={currentUser}
        contextType="plant"
      />
    </div>
  );
};