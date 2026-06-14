import { FC, useState, useMemo, useEffect } from 'react';
import { JournalEntry } from '../../../types';
import { Container, Button, Input, Toast } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { Icon } from '../common/Icon';
import { useGarden } from '../../contexts/GardenContext';
import { SharedJournalForm } from '../journal/SharedJournalForm';
import { SharedJournalFeed } from '../journal/SharedJournalFeed';

interface GlobalJournalProps {
  onGoBack: () => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  onNavigatePlant: (qrId: string) => void;
}

interface ExtendedJournalEntry extends JournalEntry {
  sourceName: string;
  sourceType: 'garden' | 'plant' | 'zone' | 'location';
  sourceId: string;
  zoneId?: string;
  locationId?: string;
  category?: string;
  isSynthetic?: boolean;
}

export const GlobalJournal: FC<GlobalJournalProps> = ({ onGoBack, onOpenMenu, onOpenWorkspaceMenu, onNavigatePlant }) => {
  const { gardenProfile, currentUser, instances, archetypes, locations, zones, gardenJournal, setGardenJournal } = useGarden();

  const [toastMessage, setToastMessage] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'garden' | 'plant'>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [filterPerson, setFilterPerson] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRoutineCare, setShowRoutineCare] = useState(false);
  
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingJournal, setEditingJournal] = useState<ExtendedJournalEntry | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const routineTypes = useMemo(() => {
    const baseRoutine = ['Watered', 'Fed'];
    const addonRoutine = currentUser?.activeAddonManifests?.flatMap(m => m.journalActivityTypes || [])?.filter(t => t.isRoutine).map(t => t.value) || [];
    return [...baseRoutine, ...addonRoutine];
  }, [currentUser?.activeAddonManifests]);

  // Core Aggregation Engine - Base filters (everything except activity)
  const baseFilteredEntries = useMemo(() => {
    const gardenArr: ExtendedJournalEntry[] = (gardenJournal || []).map(e => {
      const isRainEvent = ['Light Sprinkle', 'Steady Rain', 'Heavy Rain', 'Thunderstorm'].includes(e.activityType || '');
      const isMacroEvent = e.targetType === 'garden' || isRainEvent || (e.activityType && routineTypes.includes(e.activityType));
      return { 
        ...e, 
        batchScope: e.batchScope || (isMacroEvent ? 'Entire Garden' : undefined),
        sourceName: e.batchScope ? e.batchScope : (isMacroEvent ? 'Entire Garden' : 'Garden Note'), 
        sourceType: 'garden',
        sourceId: 'garden' 
      };
    });

    const plantArr: ExtendedJournalEntry[] = [];

    instances.forEach(inst => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const location = locations.find(l => l.id === inst.locationId);
      
      (inst.journal || []).forEach(e => {
        // Skip inherited batch events so they don't spam the master journal (the parent event is already shown)
        if (e.batchScope) return;
        
        plantArr.push({
          ...e,
          sourceName: archetype?.commonName || 'Unknown Plant',
          sourceType: 'plant',
          sourceId: inst.qrId,
          zoneId: location?.zoneId,
          locationId: inst.locationId,
          category: archetype?.category || 'Uncategorized'
        });
      });
    });

    const zoneArr: ExtendedJournalEntry[] = [];
    zones.forEach(zone => {
      const jEntries = (zone as any).journal || [];
      jEntries.forEach((e: JournalEntry) => {
        zoneArr.push({
          ...e,
          sourceName: zone.name,
          sourceType: 'zone',
          sourceId: zone.id,
          zoneId: zone.id,
          category: 'Macro Zone'
        });
      });
    });

    const locArr: ExtendedJournalEntry[] = [];
    locations.forEach(loc => {
      const jEntries = (loc as any).journal || [];
      const locZone = zones.find(z => z.id === loc.zoneId);
      jEntries.forEach((e: JournalEntry) => {
        locArr.push({
          ...e,
          sourceName: loc.name,
          sourceType: 'location',
          sourceId: loc.id,
          zoneId: locZone?.id,
          locationId: loc.id,
          category: 'Location'
        });
      });
    });

    let filtered = [...gardenArr, ...plantArr, ...zoneArr, ...locArr].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filterType === 'garden') filtered = filtered.filter(e => e.sourceType === 'garden' || e.sourceType === 'zone' || e.sourceType === 'location');
    if (filterType === 'plant') filtered = filtered.filter(e => e.sourceType === 'plant');
    
    if (filterType !== 'garden') {
      if (filterZone !== 'all') {
        filtered = filtered.filter(e => e.sourceType === 'plant' && e.zoneId === filterZone);
      }
      if (filterLocation !== 'all') {
        filtered = filtered.filter(e => e.sourceType === 'plant' && e.locationId === filterLocation);
      }
      if (filterCategory !== 'all') {
        filtered = filtered.filter(e => e.sourceType === 'plant' && e.category === filterCategory);
      }
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        (e.title && e.title.toLowerCase().includes(term)) ||
        (e.note && e.note.toLowerCase().includes(term)) ||
        (e.sourceName && e.sourceName.toLowerCase().includes(term))
      );
    }

    if (!showRoutineCare) {
      filtered = filtered.filter(e => !routineTypes.includes(e.activityType || ''));
    }
    return filtered;
  }, [gardenJournal, instances, archetypes, locations, filterType, filterZone, filterLocation, filterCategory, searchTerm, showRoutineCare, routineTypes]);

  const uniqueActivities = useMemo(() => {
    return Array.from(new Set(baseFilteredEntries.map(e => e.activityType).filter(Boolean))).sort();
  }, [baseFilteredEntries]);

  const uniqueAuthors = useMemo(() => {
    return Array.from(new Set(baseFilteredEntries.map(e => e.authorName).filter(Boolean))).sort();
  }, [baseFilteredEntries]);

  useEffect(() => {
    if (filterActivity !== 'all' && !uniqueActivities.includes(filterActivity)) {
      setFilterActivity('all');
    }
  }, [uniqueActivities, filterActivity]);

  useEffect(() => {
    if (filterPerson !== 'all' && !uniqueAuthors.includes(filterPerson)) {
      setFilterPerson('all');
    }
  }, [uniqueAuthors, filterPerson]);

  const allEntries = useMemo(() => {
    let filtered = baseFilteredEntries;
    if (filterActivity !== 'all') filtered = filtered.filter(e => e.activityType === filterActivity);
    if (filterPerson !== 'all') filtered = filtered.filter(e => e.authorName === filterPerson);
    return filtered;
  }, [baseFilteredEntries, filterActivity, filterPerson]);

  const handleSave = (entryData: Partial<JournalEntry>) => {
    const timestamp = entryData.timestamp ? new Date(entryData.timestamp).toISOString() : new Date().toISOString();
    
    const cleanedData = { ...entryData };
    delete (cleanedData as any).sourceType;
    delete (cleanedData as any).sourceName;
    delete (cleanedData as any).sourceId;
    delete (cleanedData as any).zoneId;
    delete (cleanedData as any).locationId;
    delete (cleanedData as any).category;
    delete (cleanedData as any).isSynthetic;

    if (editingJournal) {
      setGardenJournal(prev => prev.map(entry => 
        entry.id === editingJournal.id ? { ...entry, ...cleanedData, timestamp } as JournalEntry : entry
      ));
      showToast('📓 Garden note updated!');
    } else {
      const newEntry = {
        ...cleanedData,
        id: `j-gdn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        authorName: currentUser?.name || ''
      } as JournalEntry;
      
      setGardenJournal(prev => [newEntry, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      showToast('📓 Garden note added!');
    }
    
    setEditingJournal(null);
    setIsAddingEntry(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this garden note?')) return;
    setGardenJournal(prev => prev.filter(j => j.id !== id));
    showToast('🗑️ Note removed');
  };

  const hasActiveFilters = filterType !== 'all' || filterActivity !== 'all' || filterZone !== 'all' || filterLocation !== 'all' || filterCategory !== 'all' || filterPerson !== 'all';

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader 
        title="Master Journal" 
        supertitle={gardenProfile?.name || 'FloraSync'} 
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
        onOpenWorkspaceMenu={onOpenWorkspaceMenu} 
      />

      {!isAddingEntry && !editingJournal && (
        <Button onClick={() => setIsAddingEntry(true)} className="w-full mb-6 flex justify-center items-center gap-2">
          <Icon name="pencil" size={18} /> Add Garden Note
        </Button>
      )}

      {(isAddingEntry || editingJournal) && (
        <SharedJournalForm 
          initialData={editingJournal || undefined}
          onSave={handleSave}
          onCancel={() => { setIsAddingEntry(false); setEditingJournal(null); }}
          targetType="garden"
          currentUser={currentUser}
        />
      )}


    <div className="mb-4">
      <Input 
        placeholder="🔍 Search notes, plants, or keywords..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
        className="!mb-0" 
      />
    </div>

      <div className="border-b border-surface-200 dark:border-surface-700 pb-2 mb-6">
        <div className="flex items-center justify-between py-2">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="flex items-center gap-2 text-left group active:scale-[0.98] transition-transform"
          >
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2">
              Advanced Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
            </span>
            <span className={`text-slate-400 transition-transform duration-200 text-xs ${showFilters ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {hasActiveFilters && (
            <button 
              onClick={() => { setFilterType('all'); setFilterZone('all'); setFilterLocation('all'); setFilterCategory('all'); setFilterActivity('all'); setFilterPerson('all'); }}
              className="text-xs font-semibold text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 transition-colors active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Filter Tabs */}
            <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl mb-4 shadow-inner">
              <button onClick={() => setFilterType('all')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                All Activity
              </button>
              <button onClick={() => setFilterType('plant')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filterType === 'plant' ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                Plants
              </button>
              <button onClick={() => setFilterType('garden')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filterType === 'garden' ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                Spaces & Garden
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              <select 
                value={filterActivity} 
                onChange={(e) => setFilterActivity(e.target.value)} 
                className="flex-1 min-w-[100px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 text-slate-700 dark:text-slate-200 shadow-sm"
              >
                <option value="all">All Activities</option>
                {uniqueActivities.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
              </select>

              {(filterType === 'all' || filterType === 'plant') && (
                <>
                  <select 
                    value={filterZone} 
                    onChange={(e) => { setFilterZone(e.target.value); setFilterLocation('all'); }} 
                    className="flex-1 min-w-[100px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    <option value="all">All Zones</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>

                  <select 
                    value={filterLocation} 
                    onChange={(e) => setFilterLocation(e.target.value)} 
                    disabled={filterZone === 'all'}
                    className="flex-1 min-w-[100px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 text-slate-700 dark:text-slate-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">{filterZone === 'all' ? 'Select Zone First' : 'All Locations'}</option>
                    {filterZone !== 'all' && locations.filter(l => l.zoneId === filterZone).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>

                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)} 
                    className="flex-1 min-w-[100px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    <option value="all">All Plant Types</option>
                    {Array.from(new Set(archetypes.map(a => a.category).filter(Boolean))).sort().map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                  </select>

                  <select 
                    value={filterPerson} 
                    onChange={(e) => setFilterPerson(e.target.value)} 
                    className="flex-1 min-w-[100px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg px-2 py-2 text-xs font-semibold focus:outline-none focus:border-primary-500 text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    <option value="all">All People</option>
                    {uniqueAuthors.map(author => <option key={author} value={author}>{author}</option>)}
                  </select>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end items-center mb-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer bg-surface-50 dark:bg-surface-800/50 py-1.5 px-3 rounded-lg border border-surface-200 dark:border-surface-700 whitespace-nowrap">
          <input type="checkbox" checked={showRoutineCare} onChange={e => setShowRoutineCare(e.target.checked)} className="accent-primary-600 w-3.5 h-3.5 rounded" />
          Show Routine Care
        </label>
      </div>

      <SharedJournalFeed 
        entries={allEntries}
        onEdit={(entry) => { setEditingJournal(entry as ExtendedJournalEntry); setIsAddingEntry(false); window.scrollTo(0,0); }}
        onDelete={handleDelete}
        onNavigatePlant={onNavigatePlant}
        currentUser={currentUser}
        contextType="global"
      />

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};
