import { FC, useState, useMemo } from 'react';
import { Location, JournalEntry, User } from '../../../types';
import { Button } from '../../styles/StyledElements';
import { SharedJournalForm } from '../journal/SharedJournalForm';
import { SharedJournalFeed } from '../journal/SharedJournalFeed';
import { useGarden } from '../../contexts/GardenContext';

interface LocationJournalProps {
  location: Location;
  onUpdate: (updates: Partial<Location>) => void;
  showToast: (msg: string) => void;
  currentUser?: User | null;
}

export const LocationJournal: FC<LocationJournalProps> = ({ location, onUpdate, showToast, currentUser }) => {
  const { gardenJournal, zones } = useGarden();
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);

  const currentJournal: JournalEntry[] = location.journal || [];
  const zone = useMemo(() => zones.find(z => z.id === location.zoneId), [zones, location.zoneId]);

  const visibleJournal = useMemo(() => {
    const locEvents = [...currentJournal].map(e => ({ ...e, sourceType: 'location', sourceName: 'This Location' }));
    const zoneEvents = (zone?.journal || []).map(e => ({ ...e, sourceType: 'zone', sourceName: zone?.name || 'Zone' }));
    const globalEvents = (gardenJournal || []).map(e => ({ ...e, sourceType: 'garden', sourceName: 'Entire Garden' }));
    return [...locEvents, ...zoneEvents, ...globalEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [currentJournal, zone, gardenJournal]);

  const handleSave = (entryData: Partial<JournalEntry>) => {
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
        id: `j-loc-${Date.now()}`,
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
          <Button onClick={() => setIsAddingJournal(true)} className="w-auto flex-shrink-0">+ Add Location Note</Button>
        )}
      </div>

      {(isAddingJournal || editingJournal) && (
        <SharedJournalForm 
          initialData={editingJournal || undefined}
          onSave={handleSave}
          onCancel={() => { setIsAddingJournal(false); setEditingJournal(null); }}
          targetType="location"
          currentUser={currentUser}
        />
      )}

      <SharedJournalFeed 
        entries={visibleJournal}
        onEdit={(entry) => setEditingJournal(entry)}
        onDelete={handleDelete}
        onSetThumbnail={handleSetThumbnail}
        currentImageUrl={location.imageUrl}
        currentUser={currentUser}
        contextType="location"
      />
    </div>
  );
};