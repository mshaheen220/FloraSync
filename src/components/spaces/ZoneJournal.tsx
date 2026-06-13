import { FC, useState, useMemo } from 'react';
import { Zone, JournalEntry, User } from '../../../types';
import { Button } from '../../styles/StyledElements';
import { SharedJournalForm } from '../journal/SharedJournalForm';
import { SharedJournalFeed } from '../journal/SharedJournalFeed';
import { useGarden } from '../../contexts/GardenContext';

interface ZoneJournalProps {
  zone: Zone;
  onUpdate: (updates: Partial<Zone>) => void;
  showToast: (msg: string) => void;
  currentUser?: User | null;
}

export const ZoneJournal: FC<ZoneJournalProps> = ({ zone, onUpdate, showToast, currentUser }) => {
  const { gardenJournal } = useGarden();
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);

  const currentJournal: JournalEntry[] = zone.journal || [];

  const visibleJournal = useMemo(() => {
    const zoneEvents = [...currentJournal].map(e => ({ ...e, sourceType: 'zone', sourceName: 'This Zone' }));
    const globalEvents = (gardenJournal || []).map(e => ({ ...e, sourceType: 'garden', sourceName: 'Entire Garden' }));
    return [...zoneEvents, ...globalEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [currentJournal, gardenJournal]);

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
        id: `j-zone-${Date.now()}`,
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
          <Button onClick={() => setIsAddingJournal(true)} className="w-auto flex-shrink-0">+ Add Zone Note</Button>
        )}
      </div>

      {(isAddingJournal || editingJournal) && (
        <SharedJournalForm 
          initialData={editingJournal || undefined}
          onSave={handleSave}
          onCancel={() => { setIsAddingJournal(false); setEditingJournal(null); }}
          targetType="zone"
          currentUser={currentUser}
        />
      )}

      <SharedJournalFeed 
        entries={visibleJournal}
        onEdit={(entry) => setEditingJournal(entry)}
        onDelete={handleDelete}
        onSetThumbnail={handleSetThumbnail}
        currentImageUrl={zone.imageUrl}
        currentUser={currentUser}
        contextType="zone"
      />
    </div>
  );
};