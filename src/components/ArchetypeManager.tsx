import { useState, useMemo, FC, FormEvent } from 'react';
import { PlantArchetype, PlantInstance } from '../../types';
import { Container, Title, Input, Toast, Subtitle } from '../styles/StyledElements';
import { ArchetypeCard } from './ArchetypeCard';

interface ArchetypeManagerProps {
  archetypes: PlantArchetype[];
  instances: PlantInstance[];
  onUpdate: (id: string, updates: Partial<PlantArchetype>) => void;
  onDelete: (id: string) => void;
  onGoBack: () => void;
}

export const ArchetypeManager: FC<ArchetypeManagerProps> = ({ archetypes, instances, onUpdate, onDelete, onGoBack }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlantArchetype>>({});

  const groupedData = useMemo(() => {
    const filtered = archetypes.filter(a => 
      a.commonName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const groups = filtered.reduce((acc, curr) => {
      const category = curr.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(curr);
      return acc;
    }, {} as Record<string, PlantArchetype[]>);

    const sortedCategories = Object.keys(groups).sort();
    sortedCategories.forEach(cat => {
      groups[cat].sort((a, b) => a.commonName.localeCompare(b.commonName));
    });

    return { groups, sortedCategories };
  }, [archetypes, searchTerm]);

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

      <Input 
        placeholder="🔍 Search plants or categories..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />

      <div className="space-y-8">
        {groupedData.sortedCategories.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No plants found.</p>
        ) : (
          groupedData.sortedCategories.map(category => (
            <div key={category}>
              <Subtitle>{category} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedData.groups[category].length})</span></Subtitle>
              <div className="space-y-4">
                {groupedData.groups[category].map(arch => {
                  const inUseCount = instances.filter(i => i.archetypeId === arch.id).length;
                            const isEditing = editingId === arch.id;
                  const isViewing = viewingId === arch.id;

                  return (
                    <ArchetypeCard
                      key={arch.id}
                      arch={arch}
                      inUseCount={inUseCount}
                      isEditing={isEditing}
                      isViewing={isViewing}
                      editData={editData}
                      setEditData={setEditData}
                      onViewToggle={() => { setViewingId(isViewing ? null : arch.id); setEditingId(null); }}
                      onEditStart={() => { setEditingId(arch.id); setEditData(arch); setViewingId(null); }}
                      onEditCancel={() => setEditingId(null)}
                      onSave={(e) => handleSave(e, arch.id)}
                      onDelete={() => { if (inUseCount === 0 && window.confirm('Delete this plant archetype?')) { onDelete(arch.id); showToast('🗑️ Archetype removed'); } }}
                    />
                  );

        })}
              </div>
            </div>
          ))
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};