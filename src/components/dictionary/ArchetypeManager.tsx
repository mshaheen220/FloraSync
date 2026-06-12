import { useState, useMemo, useEffect, FC } from 'react';
import { PlantArchetype } from '../../../types';
import { Container, Input, Toast, Subtitle, Button } from '../../styles/StyledElements';
import { ArchetypeCard } from './ArchetypeCard';
import { PageHeader } from '../common/PageHeader';
import { useGarden } from '../../contexts/GardenContext';
import { hasPermission } from '../../utils/permissions';

interface ArchetypeManagerProps {
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  onNavigateArchetype: (id: string) => void;
}

export const ArchetypeManager: FC<ArchetypeManagerProps> = ({ onOpenMenu, onOpenWorkspaceMenu, onNavigateArchetype }) => {
  const { gardenProfile, currentUser, archetypes, instances, onDeleteArchetype } = useGarden();
  const [toastMessage, setToastMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader title="Plant Dictionary" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
        Manage the baseline care requirements for your garden. Changes here will apply to all tracked plants of this type.
      </p>

      {hasPermission(currentUser, 'manage_dictionary') && (
        <Button onClick={() => onNavigateArchetype('new')} className="mb-6">+ Add New Plant</Button>
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
                <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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

                    return (
                      <ArchetypeCard
                        canEdit={hasPermission(currentUser, 'manage_dictionary')}
                        key={arch.id}
                        arch={arch}
                        inUseCount={inUseCount}
                        onNavigate={() => onNavigateArchetype(arch.id)}
                        onDelete={() => { 
                          if (inUseCount > 0) {
                            showToast(`⚠️ Cannot delete this plant because ${inUseCount} instances are still growing!`);
                          } else if (window.confirm('Delete this plant archetype?')) { 
                            onDeleteArchetype(arch.id); 
                            showToast('🗑️ Archetype removed'); 
                          } 
                        }}
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