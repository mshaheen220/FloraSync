import React, { useState, useMemo, useEffect, FC } from 'react';
import { PlantArchetype, PlantInstance } from '../../../types';
import { Container, Input, Toast, Subtitle, Button } from '../../styles/StyledElements';
import { ArchetypeCard } from './ArchetypeCard';
import { PageHeader } from '../common/PageHeader';
import { User } from '../../App';

interface ArchetypeManagerProps {
  gardenName: string;
  archetypes: PlantArchetype[];
  instances: PlantInstance[];
  onAdd: (archetype: PlantArchetype) => void;
  onUpdate: (id: string, updates: Partial<PlantArchetype>) => void;
  onDelete: (id: string) => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  currentUser: User;
}

export const ArchetypeManager: FC<ArchetypeManagerProps> = ({ gardenName, currentUser, archetypes, instances, onAdd, onUpdate, onDelete, onOpenMenu, onOpenWorkspaceMenu }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PlantArchetype>>({});
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newData, setNewData] = useState<Partial<PlantArchetype>>({
    waterIntervalDays: 4,
    feedingIntervalDays: 14,
    sunRequirement: 'Full Sun',
    lifecycle: 'Unknown',
    funFacts: []
  });

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

  // Auto-expand categories when actively searching
  useEffect(() => {
    if (searchTerm.trim()) {
      setExpandedCategories(groupedData.sortedCategories);
    } else {
      setExpandedCategories([]);
    }
  }, [searchTerm, groupedData.sortedCategories]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    onUpdate(id, editData);
    setEditingId(null);
    showToast('📖 Plant reference updated!');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.commonName?.trim()) {
      showToast('⚠️ Common Name is required!');
      return;
    }

    const newId = newData.commonName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (archetypes.some(a => a.id === newId)) {
      showToast('⚠️ A plant with this name already exists!');
      return;
    }

    const newArchetype: PlantArchetype = {
      id: newId,
      commonName: newData.commonName.trim(),
      scientificName: newData.scientificName || 'Unknown',
      category: newData.category || 'Uncategorized',
      sunRequirement: newData.sunRequirement || 'Full Sun',
      waterIntervalDays: newData.waterIntervalDays || 4,
      feedingIntervalDays: newData.feedingIntervalDays || 14,
      whatToFeed: newData.whatToFeed || 'Unknown',
      pruningTips: newData.pruningTips || 'Unknown',
      flavorProfile: newData.flavorProfile || 'Unknown',
      companionPlants: newData.companionPlants || [],
      combativePlants: newData.combativePlants || [],
      growthHabit: newData.growthHabit || 'Unknown',
      daysToHarvest: newData.daysToHarvest || 0,
      imageUrl: newData.imageUrl || '',
      whenToPlant: newData.whenToPlant || 'Unknown',
      whenToHarvest: newData.whenToHarvest || 'Unknown',
      usesForLargeHarvests: newData.usesForLargeHarvests || 'Unknown',
      hardinessZones: newData.hardinessZones || [],
      hardinessNote: newData.hardinessNote || '',
      plantingInstructions: newData.plantingInstructions || 'Unknown',
      growthRequirements: newData.growthRequirements || 'Unknown',
      lifecycle: newData.lifecycle || 'Unknown',
      funFacts: newData.funFacts || [],
      ...newData
    };

    onAdd(newArchetype);
    setIsAdding(false);
    setNewData({ waterIntervalDays: 4, feedingIntervalDays: 14, sunRequirement: 'Full Sun', lifecycle: 'Unknown', funFacts: [] });
    showToast('✅ New plant added successfully!');
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader title="Plant Dictionary" supertitle={gardenName} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
        Manage the baseline care requirements for your garden. Changes here will apply to all tracked plants of this type.
      </p>

      {!isAdding && (currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner') && (
        <Button onClick={() => setIsAdding(true)} className="mb-6">+ Add New Plant</Button>
      )}
      {isAdding && (currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner') && (
        <div className="mb-8">
          <Subtitle>Add New Plant</Subtitle>
          <ArchetypeCard
            arch={{} as PlantArchetype}
            inUseCount={0}
            isEditing={true}
            isViewing={false}
            editData={newData}
            setEditData={setNewData}
            onViewToggle={() => {}}
            onEditStart={() => {}}
            onEditCancel={() => setIsAdding(false)}
            onSave={handleAddSubmit}
            onDelete={() => {}}
          />
        </div>
      )}

      <Input 
        placeholder="🔍 Search plants or categories..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />

      <div className="space-y-4">
        {groupedData.sortedCategories.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No plants found.</p>
        ) : (
          groupedData.sortedCategories.map(category => (
            <div key={category} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
              <button 
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
              >
                <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {category} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedData.groups[category].length})</span>
                </Subtitle>
                <span className={`text-slate-400 transition-transform duration-200 ${expandedCategories.includes(category) ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {expandedCategories.includes(category) && (
                <div className="space-y-4 mb-4">
                  {groupedData.groups[category].map(arch => {
                    const inUseCount = instances.filter(i => i.archetypeId === arch.id).length;
                    const isEditing = editingId === arch.id;
                    const isViewing = viewingId === arch.id;

                    return (
                      <ArchetypeCard
                        canEdit={currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner'}
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
              )}
            </div>
          ))
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};