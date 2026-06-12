import { FC, useState, FormEvent, useMemo, useEffect } from 'react';
import { JournalEntry } from '../../../types';
import { Container, Card, Button, Input, Subtitle, Toast } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { Icon } from '../common/Icon';
import { useGarden } from '../../contexts/GardenContext';
import { ImageUploadInput } from '../common/ImageUploadInput';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

const getLocalDatetimeString = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

interface GlobalJournalProps {
  onGoBack: () => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  onNavigatePlant: (qrId: string) => void;
}

interface ExtendedJournalEntry extends JournalEntry {
  sourceName: string;
  sourceType: 'garden' | 'plant';
  sourceId: string;
  zoneId?: string;
  locationId?: string;
  category?: string;
}

export const GlobalJournal: FC<GlobalJournalProps> = ({ onGoBack, onOpenMenu, onOpenWorkspaceMenu, onNavigatePlant }) => {
  const { gardenProfile, currentUser, instances, archetypes, locations, zones, gardenJournal, setGardenJournal } = useGarden();

  const [toastMessage, setToastMessage] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'garden' | 'plant'>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [showRoutineCare, setShowRoutineCare] = useState(false);
  
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [journalForm, setJournalForm] = useState<Partial<JournalEntry>>({});
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

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
    const gardenArr: ExtendedJournalEntry[] = (gardenJournal || []).map(e => ({ 
      ...e, 
      sourceName: 'Garden Note', 
      sourceType: 'garden' as 'garden' | 'plant',
      sourceId: 'garden' 
    }));

    const plantArr: ExtendedJournalEntry[] = instances.flatMap(inst => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const location = locations.find(l => l.id === inst.locationId);
      return (inst.journal || []).map(e => ({
        ...e,
        sourceName: archetype?.commonName || 'Unknown Plant',
        sourceType: 'plant',
        sourceId: inst.qrId,
        zoneId: location?.zoneId,
        locationId: inst.locationId,
        category: archetype?.category || 'Uncategorized'
      }));
    });

    let filtered = [...gardenArr, ...plantArr].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filterType === 'garden') filtered = filtered.filter(e => e.sourceType === 'garden');
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

  useEffect(() => {
    if (filterActivity !== 'all' && !uniqueActivities.includes(filterActivity)) {
      setFilterActivity('all');
    }
  }, [uniqueActivities, filterActivity]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayLimit(12);
  }, [filterType, filterZone, filterLocation, filterCategory, filterActivity, searchTerm, showRoutineCare]);

  const allEntries = useMemo(() => {
    if (filterActivity === 'all') return baseFilteredEntries;
    return baseFilteredEntries.filter(e => e.activityType === filterActivity);
  }, [baseFilteredEntries, filterActivity]);

  const handleSaveGardenEntry = (e: FormEvent) => {
    e.preventDefault();
    
    const timestamp = journalForm.timestamp ? new Date(journalForm.timestamp).toISOString() : new Date().toISOString();

    if (editingJournalId) {
      setGardenJournal(prev => prev.map(entry => 
        entry.id === editingJournalId ? { ...entry, ...journalForm, timestamp } as JournalEntry : entry
      ));
      showToast('📓 Garden note updated!');
    } else {
      const newEntry = {
        id: `j-gdn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        title: journalForm.title || '',
        note: journalForm.note || '',
        imageUrl: journalForm.imageUrl || '',
        activityType: journalForm.activityType || 'Garden Note',
        authorName: currentUser?.name || ''
      } as JournalEntry;
      
      setGardenJournal(prev => [newEntry, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      showToast('📓 Garden note added!');
    }
    
    setEditingJournalId(null);
    setIsAddingEntry(false);
    setJournalForm({});
  };

  const handleDeleteGardenEntry = (id: string) => {
    if (!window.confirm('Delete this garden note?')) return;
    setGardenJournal(prev => prev.filter(j => j.id !== id));
    showToast('🗑️ Note removed');
  };

  const isSubmitDisabled = !(
    (journalForm.title && journalForm.title.trim() !== '') ||
    (journalForm.note && journalForm.note.trim() !== '') ||
    (journalForm.imageUrl && journalForm.imageUrl !== '')
  );

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader 
        title="Master Journal" 
        supertitle={gardenProfile?.name || 'FloraSync'} 
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
        onOpenWorkspaceMenu={onOpenWorkspaceMenu} 
      />

      <div className="flex justify-end items-center mb-2">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer bg-surface-50 dark:bg-surface-800/50 py-1.5 px-3 rounded-lg border border-surface-200 dark:border-surface-700 whitespace-nowrap">
          <input type="checkbox" checked={showRoutineCare} onChange={e => setShowRoutineCare(e.target.checked)} className="accent-primary-600 w-3.5 h-3.5 rounded" />
          Show Routine Care
        </label>
      </div>

    <div className="mb-4">
      <Input 
        placeholder="🔍 Search notes, plants, or keywords..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
        className="!mb-0" 
      />
    </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-xl mb-4 shadow-inner">
        <button onClick={() => setFilterType('all')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          All Activity
        </button>
        <button onClick={() => setFilterType('plant')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filterType === 'plant' ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Plants
        </button>
        <button onClick={() => setFilterType('garden')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${filterType === 'garden' ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Garden Notes
        </button>
      </div>

    <div className="flex flex-wrap gap-2 mb-6">
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
        </>
      )}
    </div>

      {!isAddingEntry && !editingJournalId && (
        <Button onClick={() => { setIsAddingEntry(true); setJournalForm({ timestamp: getLocalDatetimeString() }); }} className="w-full mb-6 flex justify-center items-center gap-2">
          <Icon name="pencil" size={18} /> Add Garden Note
        </Button>
      )}

      {(isAddingEntry || editingJournalId) && (
        <Card className="mb-8 border-primary-500 shadow-md animate-in slide-in-from-top-2 fade-in duration-200">
          <Subtitle className="!mt-0 mb-4">{editingJournalId ? 'Edit Garden Note' : 'New Garden Note'}</Subtitle>
          <form onSubmit={handleSaveGardenEntry} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date & Time</label>
              <Input type="datetime-local" value={journalForm.timestamp || ''} onChange={e => setJournalForm({...journalForm, timestamp: e.target.value})} className="!mb-0" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Note Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'Garden Note', label: 'Note', icon: 'pencil' },
                  { value: 'Weather', label: 'Weather', icon: 'cloud-sun' },
                  { value: 'Heavy Rain', label: 'Rain', icon: 'cloud-rain' },
                  { value: 'Pest Sighting', label: 'Pests', icon: 'bug' },
                  { value: 'Maintenance', label: 'Upkeep', icon: 'settings' },
                  { value: 'Harvest', label: 'Harvest', icon: 'apple' },
                  { value: 'Planning', label: 'Plan', icon: 'lightbulb' },
                  { value: 'Alert', label: 'Alert', icon: 'alert-circle' },
                ].map(type => {
                  const isSelected = journalForm.activityType === type.value || (!journalForm.activityType && type.value === 'Garden Note');
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setJournalForm({ ...journalForm, activityType: type.value })}
                      className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border ${isSelected ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/50 dark:border-primary-700 dark:text-primary-400 shadow-sm' : 'bg-surface-50 border-surface-200 text-slate-500 hover:bg-surface-100 dark:bg-surface-800/50 dark:border-surface-700 dark:text-slate-400 dark:hover:bg-surface-800'} transition-all`}
                    >
                      <Icon name={type.icon as any} size={18} />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Title (Optional)</label>
              <Input placeholder="e.g. Built a new trellis" value={journalForm.title || ''} onChange={e => setJournalForm({...journalForm, title: e.target.value})} className="!mb-0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Note / Description</label>
              <textarea value={journalForm.note || ''} onChange={e => setJournalForm({...journalForm, note: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={4} placeholder="Observations, weather events, infrastructure changes..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Photo (Optional)</label>
              <div className="flex items-center gap-3">
                {journalForm.imageUrl && (
                  <img src={journalForm.imageUrl} alt="Preview" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                )}
                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 transition-all cursor-pointer border border-transparent dark:border-primary-800">
                  <Icon name="camera" size={18} /> {journalForm.imageUrl ? 'Change Photo' : 'Add Photo'}
                  <ImageUploadInput onUpload={(base64) => setJournalForm({...journalForm, imageUrl: base64})} />
                </label>
                {journalForm.imageUrl && (
                  <button type="button" onClick={() => setJournalForm({...journalForm, imageUrl: ''})} className="text-red-500 text-sm font-semibold px-2">Remove</button>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="button" $variant="secondary" onClick={() => { setIsAddingEntry(false); setEditingJournalId(null); setJournalForm({}); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitDisabled}>Save Note</Button>
            </div>
          </form>
        </Card>
      )}

      {allEntries.length > 0 ? (
        <div className="relative border-l-2 border-primary-200 dark:border-primary-800 ml-4 pl-6 space-y-8 pb-10">
          {allEntries.slice(0, displayLimit).map((entry) => {
            const isGardenNote = entry.sourceType === 'garden';
            
            return (
              <div key={`${entry.sourceType}-${entry.id}`} className="relative">
                <div className={`absolute -left-[31px] rounded-full w-4 h-4 ring-4 ring-slate-50 dark:ring-slate-900 ${isGardenNote ? 'bg-indigo-500' : 'bg-primary-500'}`}></div>
                
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider block mb-1">
                      {new Date(entry.timestamp).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span 
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${isGardenNote ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors'}`}
                      onClick={() => !isGardenNote && entry.sourceId && onNavigatePlant(entry.sourceId)}
                    >
                      <Icon name={isGardenNote ? "land-plot" : "leaf"} size={10} />
                      {entry.sourceName}
                    </span>
                  </div>
                  
                  {/* Only allow editing/deleting of Garden-level notes from the master view. Plant notes must be edited from the plant detail view to prevent context confusion. */}
                  {isGardenNote ? (
                    <div className="flex gap-2 bg-surface-50 dark:bg-surface-800 p-1 rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm">
                      <button onClick={() => { setEditingJournalId(entry.id); setJournalForm({ ...entry, timestamp: getLocalDatetimeString(entry.timestamp) }); setIsAddingEntry(false); window.scrollTo(0,0); }} className="text-slate-400 hover:text-primary-600 p-1 active:scale-90 transition-transform"><Icon name="edit" size={14} /></button>
                      <button onClick={() => handleDeleteGardenEntry(entry.id)} className="text-slate-400 hover:text-red-600 p-1 active:scale-90 transition-transform"><Icon name="delete" size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => entry.sourceId && onNavigatePlant(entry.sourceId)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-lg">
                      View Plant <Icon name="view" size={12} />
                    </button>
                  )}
                </div>

                <Card className="!p-4 shadow-sm border-surface-200 dark:border-surface-700">
                  {entry.title && <h4 className="text-slate-800 dark:text-slate-100 font-bold text-base mb-2">{entry.title}</h4>}
                  
                  {((entry.activityType && entry.activityType !== 'Observation' && entry.activityType !== 'Garden Note') || entry.harvestAmount || entry.height || entry.fullness || entry.colorAppearance || entry.healthIssues || entry.growthStage || entry.batchScope) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {entry.activityType && entry.activityType !== 'Observation' && entry.activityType !== 'Garden Note' && (
                      <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 text-xs px-2 py-1 rounded-md border border-primary-200 dark:border-primary-800 font-bold inline-flex items-center gap-1.5">
                        {entry.activityType === 'Harvest' ? <><Icon name="apple" size={14} /> Harvest</> : 
                         entry.activityType === 'Pruning' ? <><Icon name="edit" size={14} /> Pruning</> : 
                         entry.activityType === 'Watered' ? <><Icon name="water" size={14} /> Watered</> :
                         entry.activityType === 'Fed' ? <><Icon name="feed" size={14} /> Fed</> :
                         entry.activityType === 'Treatment' ? <><Icon name="alert-circle" size={14} /> Treatment</> : 
                         entry.activityType === 'Weather' ? <><Icon name="cloud-sun" size={14} /> Weather</> : 
                         entry.activityType === 'Heavy Rain' ? <><Icon name="cloud-rain" size={14} /> Heavy Rain</> : 
                         entry.activityType === 'Pest Sighting' ? <><Icon name="bug" size={14} /> Pest Sighting</> : 
                         entry.activityType === 'Maintenance' ? <><Icon name="settings" size={14} /> Maintenance</> : 
                         entry.activityType === 'Planning' ? <><Icon name="lightbulb" size={14} /> Planning</> : 
                         entry.activityType === 'Alert' ? <><Icon name="alert-circle" size={14} /> Alert</> : entry.activityType}
                        </span>
                      )}
                      {entry.harvestAmount && <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800 font-bold inline-flex items-center gap-1.5"><Icon name="scale" size={12} /> {entry.harvestAmount}</span>}
                      {entry.height && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"><Icon name="ruler" size={12} /> {entry.height}"</span>}
                      {entry.growthStage && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"><Icon name="sprout" size={12} /> {entry.growthStage}</span>}
                      {entry.fullness && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"><Icon name="leaf" size={12} /> {entry.fullness}</span>}
                      {entry.colorAppearance && <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5"><Icon name="palette" size={12} /> {entry.colorAppearance}</span>}
                      {entry.healthIssues && entry.healthIssues !== 'None' && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] px-2 py-1 rounded-md border border-red-200 dark:border-red-800 inline-flex items-center gap-1.5"><Icon name="alert" size={12} /> {entry.healthIssues}</span>}
                      {entry.healthIssues === 'None' && <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] px-2 py-1 rounded-md border border-primary-200 dark:border-primary-800 inline-flex items-center gap-1.5"><Icon name="sparkles" size={12} /> Healthy</span>}
                      {entry.batchScope && <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 font-semibold inline-flex items-center gap-1.5"><Icon name="map-pin" size={12} /> via {entry.batchScope}</span>}
                    </div>
                  )}

                  {entry.note && <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">{entry.note}</p>}
                  
                  {entry.imageUrl && (
                    <img 
                      src={entry.imageUrl} 
                      alt={entry.title || 'Journal photo'} 
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} 
                      className="w-full max-h-64 object-cover rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={() => setExpandedImageUrl(entry.imageUrl!)}
                    />
                  )}

                  {entry.authorName && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {entry.authorName === currentUser?.name && currentUser?.imageUrl ? (
                        <img src={currentUser.imageUrl} alt={entry.authorName} className="w-4 h-4 rounded-full object-cover" />
                      ) : entry.authorImageUrl ? (
                        <img src={entry.authorImageUrl} alt={entry.authorName} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-400">
                          {entry.authorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">Logged by {entry.authorName}</span>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}

        {allEntries.length > displayLimit && (
          <div className="flex justify-center mt-8 mb-4 pt-4">
            <Button $variant="secondary" onClick={() => setDisplayLimit(p => p + 50)} className="w-full sm:w-auto shadow-sm">
              Load Older Entries
            </Button>
          </div>
        )}
        </div>
      ) : (
        <Card className="text-center p-8 bg-surface-50 dark:bg-surface-800/50 shadow-none border border-surface-200 dark:border-surface-700">
          <p className="text-sm text-slate-500 font-semibold mb-2">No journal history yet.</p>
          <p className="text-xs text-slate-400">Add a macro-level Garden Note above, or log care on individual plants to build your timeline.</p>
        </Card>
      )}

      {expandedImageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setExpandedImageUrl(null)}
        >
          <div className="relative flex flex-col items-end max-w-full max-h-full">
            <button 
              className="text-white text-3xl font-bold p-2 mb-2 active:scale-90 transition-transform hover:text-slate-300"
              onClick={() => setExpandedImageUrl(null)}
            >
              ✕
            </button>
            <img 
              src={expandedImageUrl} 
              alt="Enlarged journal photo" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};
