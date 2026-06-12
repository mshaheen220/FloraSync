import React, { useState, useMemo, useEffect, FC } from 'react';
import { PlantArchetype, FunFact } from '../../../types';
import { Container, Input, Toast, Button, Card, Subtitle } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { useGarden } from '../../contexts/GardenContext';
import { hasPermission } from '../../utils/permissions';
import { Icon, IconName } from '../common/Icon';
import { ImageUploadInput } from '../common/ImageUploadInput';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

const isValidData = (val: string | number | null | undefined | any[]): boolean => {
  if (val === null || val === undefined || val === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  if (typeof val === 'string' && ['unknown', 'uncategorized', 'n/a'].includes(val.toLowerCase().trim())) return false;
  if (typeof val === 'number' && val === 0) return false;
  return true;
};

const getSunIcon = (requirement?: string): IconName => {
  if (!requirement) return 'sun';
  const req = requirement.toLowerCase();
  if (req.includes('part') || req.includes('partial')) return 'cloud-sun';
  if (req.includes('shade') && !req.includes('sun')) return 'cloud';
  return 'sun';
};

const getWaterIcon = (days?: number): IconName => {
  if (!days) return 'water';
  if (days <= 3) return 'cloud-rain'; // Frequent
  if (days <= 7) return 'water'; // Moderate
  return 'droplet'; // Infrequent
};

const getFeedIcon = (days?: number): IconName => {
  if (!days) return 'feed';
  if (days <= 14) return 'utensils'; // Frequent
  if (days <= 30) return 'feed'; // Moderate
  return 'hourglass'; // Infrequent
};

const FACT_ICONS = [
  { value: 'bug', label: 'Bugs' },
  { value: 'skull', label: 'Dangerous' },
  { value: 'wine', label: 'Drink' },
  { value: 'soup', label: 'Food' },
  { value: 'lightbulb', label: 'Fun Fact' },
  { value: 'alert-circle', label: 'Important' },
  { value: 'smile', label: 'Joke' },
  { value: 'heart', label: 'Love This' },
  { value: 'coins', label: 'Money' },
  { value: 'cat', label: 'Pets' },
  { value: 'dna', label: 'Science' },
  { value: 'help-circle', label: 'Weird Fact / Unknown' },
];

interface ArchetypeDetailProps {
  archetypeId: string;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const ArchetypeDetail: FC<ArchetypeDetailProps> = ({ archetypeId, onGoBack, onOpenMenu, onOpenWorkspaceMenu }) => {
  const { currentUser, archetypes, onAddArchetype, onUpdateArchetype } = useGarden();
  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(archetypeId === 'new');
  
  const archetype = useMemo(() => archetypes.find(a => a.id === archetypeId), [archetypes, archetypeId]);
  
  const [formData, setFormData] = useState<Partial<PlantArchetype>>({});
  const [editingFactIndex, setEditingFactIndex] = useState<number | null>(null);
  const [expandedEditSections, setExpandedEditSections] = useState<string[]>(['basic']);
  const [expandedViewSections, setExpandedViewSections] = useState<string[]>(['cultivation', 'traits', 'lifecycle', 'funFacts']);

  const milestoneVerbFuture = useMemo(() => {
    const cat = (isEditing ? formData.category : archetype?.category)?.toLowerCase() || '';
    if (cat.includes('flower')) return 'Bloom';
    if (cat.includes('foliage') || cat.includes('succulent') || cat.includes('houseplant')) return 'Maturity';
    return 'Harvest';
  }, [isEditing, formData.category, archetype?.category]);

  useEffect(() => {
    if (archetypeId === 'new') {
      setIsEditing(true);
      setFormData({
        waterIntervalDays: 4,
        feedingIntervalDays: 14,
        sunRequirement: 'Full Sun',
        lifecycle: 'Unknown',
        funFacts: []
      });
    } else if (archetype) {
      setIsEditing(false);
      setFormData(archetype);
    }
  }, [archetypeId, archetype]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (archetypeId === 'new') {
      if (!formData.commonName?.trim()) {
        showToast('⚠️ Common Name is required!');
        return;
      }
  
      const newId = formData.commonName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (archetypes.some(a => a.id === newId)) {
        showToast('⚠️ A plant with this name already exists!');
        return;
      }
  
      const newArchetype: PlantArchetype = {
        id: newId,
        commonName: formData.commonName.trim(),
        scientificName: formData.scientificName || 'Unknown',
        category: formData.category || 'Uncategorized',
        sunRequirement: formData.sunRequirement || 'Full Sun',
        waterIntervalDays: formData.waterIntervalDays || 4,
        feedingIntervalDays: formData.feedingIntervalDays || 14,
        whatToFeed: formData.whatToFeed || 'Unknown',
        pruningTips: formData.pruningTips || 'Unknown',
        flavorProfile: formData.flavorProfile || 'Unknown',
        companionPlants: formData.companionPlants || [],
        combativePlants: formData.combativePlants || [],
        growthHabit: formData.growthHabit || 'Unknown',
        daysToHarvest: formData.daysToHarvest || 0,
        imageUrl: formData.imageUrl || '',
        whenToPlant: formData.whenToPlant || 'Unknown',
        whenToHarvest: formData.whenToHarvest || 'Unknown',
        usesForLargeHarvests: formData.usesForLargeHarvests || 'Unknown',
        hardinessZones: formData.hardinessZones || [],
        hardinessNote: formData.hardinessNote || '',
        plantingInstructions: formData.plantingInstructions || 'Unknown',
        growthRequirements: formData.growthRequirements || 'Unknown',
        lifecycle: formData.lifecycle || 'Unknown',
        funFacts: formData.funFacts || [],
        ...formData
      };
  
      onAddArchetype(newArchetype);
      showToast('✅ New plant added successfully!');
      onGoBack();
    } else {
      onUpdateArchetype(archetypeId, formData);
      setIsEditing(false);
      showToast('📖 Plant reference updated!');
    }
  };

  const canEdit = hasPermission(currentUser, 'manage_dictionary');

  if (!canEdit && archetypeId === 'new') {
    return <Container><p>You do not have permission to add new plants.</p></Container>;
  }

  if (!archetype && archetypeId !== 'new') {
    return <Container><p>Plant not found.</p></Container>;
  }

  const sectionClass = "bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-all";

  const toggleEditSection = (section: string) => {
    setExpandedEditSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const toggleViewSection = (section: string) => {
    setExpandedViewSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const renderSectionHeader = (id: string, icon: IconName, title: string) => {
    const isExpanded = expandedEditSections.includes(id);
    return (
      <button 
        type="button" 
        onClick={() => toggleEditSection(id)} 
        className={`w-full flex items-center justify-between text-left group outline-none ${isExpanded ? 'border-b border-slate-200 dark:border-slate-700 pb-4' : ''}`}
      >
        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
          <Icon name={icon} size={18} /> {title}
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>
    );
  };

  const renderEditForm = () => (
    <Card className="border-primary-500 dark:border-primary-500 shadow-md !p-5">
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Basic Info Section */}
        <div className={sectionClass}>
          {renderSectionHeader('basic', 'leaf', 'Basic Information')}
          {expandedEditSections.includes('basic') && (
            <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Common Name</label>
                <Input value={formData.commonName || ''} onChange={e => setFormData({...formData, commonName: e.target.value})} className="!mb-0 py-2 text-base font-bold" required />
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Scientific Name</label>
                  <Input value={formData.scientificName || ''} onChange={e => setFormData({...formData, scientificName: e.target.value})} className="!mb-0 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <Input value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="!mb-0 py-2 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plant Photo (Optional)</label>
                <div className="flex items-center gap-3">
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Preview" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                  )}
                <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-all cursor-pointer shadow-sm">
                  <Icon name="camera" size={18} /> {formData.imageUrl ? 'Change Photo' : 'Upload Photo'}
                    <ImageUploadInput onUpload={(base64) => setFormData({...formData, imageUrl: base64})} />
                  </label>
                  {formData.imageUrl && (
                    <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="text-red-500 hover:text-red-600 text-sm font-bold transition-colors">Remove</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Care & Environment Section */}
        <div className={sectionClass}>
          {renderSectionHeader('care', 'sun', 'Care & Environment')}
          {expandedEditSections.includes('care') && (
            <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Water (Days)</label>
                <Input type="number" min="1" value={formData.waterIntervalDays || ''} onChange={e => setFormData({...formData, waterIntervalDays: Number(e.target.value)})} className="!mb-0 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Feed (Days)</label>
                <Input type="number" min="1" value={formData.feedingIntervalDays || ''} onChange={e => setFormData({...formData, feedingIntervalDays: Number(e.target.value)})} className="!mb-0 py-2 text-sm" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sunlight</label>
                <Input value={formData.sunRequirement || ''} onChange={e => setFormData({...formData, sunRequirement: e.target.value})} className="!mb-0 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lifecycle</label>
                <select value={formData.lifecycle || ''} onChange={e => setFormData({...formData, lifecycle: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 h-[42px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" required>
                  <option value="Annual">Annual</option>
                  <option value="Biennial">Biennial</option>
                  <option value="Perennial">Perennial</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hardiness Zones</label>
                <Input value={formData.hardinessZones?.join(', ') || ''} onChange={e => setFormData({...formData, hardinessZones: e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))})} className="!mb-0 py-2 text-sm" placeholder="e.g. 10, 11" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hardiness Note</label>
                <textarea value={formData.hardinessNote || ''} onChange={e => setFormData({...formData, hardinessNote: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={2} placeholder="e.g. Tolerates moderate winter frosts well into December." />
              </div>
            </div>
          )}
        </div>

        {/* Planting & Harvest Section */}
        <div className={sectionClass}>
          {renderSectionHeader('planting', 'sprout', `Planting & ${milestoneVerbFuture}`)}
          {expandedEditSections.includes('planting') && (
            <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in duration-200">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">How to Plant</label>
                <textarea value={formData.plantingInstructions || ''} onChange={e => setFormData({...formData, plantingInstructions: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={4} placeholder="e.g. Sow 1/4 inch deep, mulch heavily..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">When to Plant</label>
                <Input value={formData.whenToPlant || ''} onChange={e => setFormData({...formData, whenToPlant: e.target.value})} className="!mb-0 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">When to {milestoneVerbFuture}</label>
                <Input value={formData.whenToHarvest || ''} onChange={e => setFormData({...formData, whenToHarvest: e.target.value})} className="!mb-0 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Days to {milestoneVerbFuture}</label>
                <Input type="number" min="0" value={formData.daysToHarvest || ''} onChange={e => setFormData({...formData, daysToHarvest: Number(e.target.value)})} className="!mb-0 py-2 text-sm" required />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Habit</label>
                <Input value={formData.growthHabit || ''} onChange={e => setFormData({...formData, growthHabit: e.target.value})} className="!mb-0 py-2 text-sm" required />
              </div>
            </div>
          )}
        </div>

        {/* Detailed Care & Traits */}
        <div className={sectionClass}>
          {renderSectionHeader('details', 'info', 'Detailed Care & Traits')}
          {expandedEditSections.includes('details') && (
            <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Requirements</label>
                <textarea value={formData.growthRequirements || ''} onChange={e => setFormData({...formData, growthRequirements: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={4} placeholder="e.g. Climbs aggressively, requires a sturdy trellis..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">What to Feed</label>
                <textarea value={formData.whatToFeed || ''} onChange={e => setFormData({...formData, whatToFeed: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pruning Tips</label>
                <textarea value={formData.pruningTips || ''} onChange={e => setFormData({...formData, pruningTips: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
              </div>
            </div>
          )}
        </div>

        {/* Yield & Pairings */}
        <div className={sectionClass}>
          {renderSectionHeader('yield', 'apple', 'Yield & Pairings')}
          {expandedEditSections.includes('yield') && (
            <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Flavor Profile</label>
                <Input value={formData.flavorProfile || ''} onChange={e => setFormData({...formData, flavorProfile: e.target.value})} className="!mb-0 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Abundant Yield Uses</label>
                <textarea value={formData.usesForLargeHarvests || ''} onChange={e => setFormData({...formData, usesForLargeHarvests: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
              </div>
              <div className="flex flex-col gap-4 mt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Companions</label>
                  <Input value={formData.companionPlants?.join(', ') || ''} onChange={e => setFormData({...formData, companionPlants: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})} className="!mb-0 py-2 text-sm" placeholder="Comma separated" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Combative</label>
                  <Input value={formData.combativePlants?.join(', ') || ''} onChange={e => setFormData({...formData, combativePlants: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})} className="!mb-0 py-2 text-sm" placeholder="Comma separated" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fun Facts */}
        <div className={sectionClass}>
          {renderSectionHeader('funFacts', 'lightbulb', 'Fun Facts')}
          {expandedEditSections.includes('funFacts') && (
            <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-200">
              {formData.funFacts?.map((rawFact, idx) => {
                const fact = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
                const handleFactChange = (field: keyof FunFact, value: string) => {
                  const newFacts = [...(formData.funFacts || [])];
                  const currentFact = typeof newFacts[idx] === 'string' ? { fact: newFacts[idx] as string } : newFacts[idx];
                  newFacts[idx] = { ...currentFact, [field]: value };
                  setFormData({ ...formData, funFacts: newFacts });
                };
                
                if (editingFactIndex === idx) {
                  return (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editing Fact #{idx + 1}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Input placeholder="Title (Optional, e.g. 'Historical Use')" value={fact.title || ''} onChange={e => handleFactChange('title', e.target.value)} className="!mb-0 py-2 text-sm w-full" />
                        <select 
                          value={fact.icon || ''} 
                          onChange={e => handleFactChange('icon', e.target.value)}
                          className="border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm w-full py-2.5"
                        >
                          <option value="lightbulb">Default Icon</option>
                          {FACT_ICONS.map(icon => (
                            <option key={icon.value} value={icon.value}>{icon.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea placeholder="Fact / Trivia" value={fact.fact || ''} onChange={e => handleFactChange('fact', e.target.value)} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} required />
                      <Input placeholder="Attributed To (Optional)" value={fact.attributedTo || ''} onChange={e => handleFactChange('attributedTo', e.target.value)} className="!mb-0 py-2 text-sm" />
                      <div className="flex items-center gap-3">
                        {fact.imageUrl && (
                          <img src={fact.imageUrl} alt="Preview" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                        )}
                      <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-all cursor-pointer shadow-sm">
                        <Icon name="camera" size={16} /> {fact.imageUrl ? 'Change Photo' : 'Upload Photo'}
                            <ImageUploadInput onUpload={(base64) => handleFactChange('imageUrl', base64)} />
                        </label>
                        {fact.imageUrl && (
                          <button type="button" onClick={() => handleFactChange('imageUrl', '')} className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors">Remove</button>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 mt-1">
                        <button type="button" onClick={() => {
                          const newFacts = [...(formData.funFacts || [])];
                          newFacts.splice(idx, 1);
                          setFormData({...formData, funFacts: newFacts});
                          setEditingFactIndex(null);
                        }} className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors">Delete</button>
                        <button type="button" onClick={() => setEditingFactIndex(null)} className="bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold">Done</button>
                      </div>
                    </div>
                  );
                }

                const factIcon = fact.icon || 'lightbulb';
                const factTitle = fact.title || "Did You Know?";
                const factMessage = fact.attributedTo ? `"${fact.fact}" — ${fact.attributedTo}` : fact.fact;

                return (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {fact.imageUrl ? (
                        <img src={fact.imageUrl} alt="Fact" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-slate-200 dark:bg-slate-800" />
                      ) : (
                        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg shadow-sm border border-primary-100 dark:border-primary-800/50">
                          <Icon name={factIcon as IconName} size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-0.5 truncate">{factTitle}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">{factMessage || 'Empty fact'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                  <button type="button" onClick={() => setEditingFactIndex(idx)} title="Edit Fact" className="p-1.5 rounded-lg transition-colors text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 active:scale-90"><Icon name="edit" size={18} /></button>
                      <button type="button" onClick={() => {
                        const newFacts = [...(formData.funFacts || [])];
                        newFacts.splice(idx, 1);
                        setFormData({...formData, funFacts: newFacts});
                  }} title="Delete Fact" className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 active:scale-90"><Icon name="delete" size={18} /></button>
                    </div>
                  </div>
                );
              })}
              <Button type="button" $variant="secondary" onClick={() => {
                const currentFacts = formData.funFacts || [];
                setFormData({...formData, funFacts: [...currentFacts, { fact: '', icon: 'lightbulb' }]});
                setEditingFactIndex(currentFacts.length);
              }} className="w-full">
                + Add Fun Fact
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <Button type="button" $variant="secondary" onClick={archetypeId === 'new' ? onGoBack : () => setIsEditing(false)} className="flex-1 py-3 text-sm">Cancel</Button>
          <Button type="submit" className="flex-1 py-3 text-sm">{archetypeId === 'new' ? 'Add Plant' : 'Save Changes'}</Button>
        </div>
      </form>
    </Card>
  );

  const renderViewMode = () => {
    const hasCultivationData = archetype && (
      isValidData(archetype.sunRequirement) || 
      isValidData(archetype.waterIntervalDays) || 
      isValidData(archetype.feedingIntervalDays) || 
      isValidData(archetype.pruningTips) ||
      isValidData(archetype.whatToFeed)
    );

    const hasTraitsData = archetype && (
      isValidData(archetype.scientificName) ||
      isValidData(archetype.category) ||
      isValidData(archetype.growthHabit) ||
      isValidData(archetype.lifecycle) ||
      isValidData(archetype.hardinessZones) ||
      isValidData(archetype.hardinessNote) ||
      isValidData(archetype.flavorProfile) ||
      isValidData(archetype.companionPlants) ||
      isValidData(archetype.combativePlants) ||
      isValidData(archetype.growthRequirements)
    );

    const hasLifecycleData = archetype && (
      isValidData(archetype.whenToPlant) ||
      isValidData(archetype.whenToHarvest) ||
      isValidData(archetype.daysToHarvest) ||
      isValidData(archetype.plantingInstructions) ||
      isValidData(archetype.usesForLargeHarvests)
    );

    const hasFunFacts = archetype && archetype.funFacts && archetype.funFacts.length > 0;

    return (
      <div className="space-y-4 pb-8">
        <Card className="flex flex-col items-center pb-6 relative overflow-hidden !px-0 !pt-0">
          {archetype?.imageUrl ? (
            <img src={archetype.imageUrl} alt={archetype?.commonName} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-56 object-cover mb-4 bg-slate-100 dark:bg-slate-800" />
          ) : (
            <div className="w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 mb-6"></div>
          )}
          <div className="px-5 w-full flex flex-col items-center">
            <div className="flex gap-4 text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 bg-surface-50 dark:bg-surface-800/50 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm flex-wrap justify-center">
              {isValidData(archetype?.waterIntervalDays) && <span className="flex items-center gap-1.5"><Icon name={getWaterIcon(archetype?.waterIntervalDays)} size={16} className="text-blue-500 dark:text-blue-400" /> {archetype?.waterIntervalDays}d</span>}
              {isValidData(archetype?.feedingIntervalDays) && <span className="flex items-center gap-1.5"><Icon name={getFeedIcon(archetype?.feedingIntervalDays)} size={16} className="text-amber-500 dark:text-amber-400" /> {archetype?.feedingIntervalDays}d</span>}
              {isValidData(archetype?.sunRequirement) && <span className="flex items-center gap-1.5"><Icon name={getSunIcon(archetype?.sunRequirement)} size={16} className="text-amber-400 dark:text-amber-300" /> {archetype?.sunRequirement}</span>}
            </div>
          </div>
        </Card>

        {hasCultivationData && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleViewSection('cultivation')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Cultivation Basics</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('cultivation') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('cultivation') && (
              <Card>
                <ul className="space-y-5 text-sm">
                {isValidData(archetype?.sunRequirement) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 rounded-full w-10 h-10 flex-shrink-0 text-amber-600 dark:text-amber-400">
                      <Icon name={getSunIcon(archetype?.sunRequirement)} size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Sunlight</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.sunRequirement}</span>
                    </div>
                  </li>
                )}
                {isValidData(archetype?.waterIntervalDays) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-full w-10 h-10 flex-shrink-0 text-blue-600 dark:text-blue-400">
                      <Icon name={getWaterIcon(archetype?.waterIntervalDays)} size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Watering Interval</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">Every {archetype?.waterIntervalDays} days</span>
                    </div>
                  </li>
                )}
                {isValidData(archetype?.feedingIntervalDays) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 rounded-full w-10 h-10 flex-shrink-0 text-amber-600 dark:text-amber-400">
                      <Icon name={getFeedIcon(archetype?.feedingIntervalDays)} size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Feeding</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed block mb-1">Every {archetype?.feedingIntervalDays} days</span>
                      {isValidData(archetype?.whatToFeed) && <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed">{archetype?.whatToFeed}</span>}
                    </div>
                  </li>
                )}
                {isValidData(archetype?.pruningTips) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 rounded-full w-10 h-10 flex-shrink-0 text-primary-600 dark:text-primary-400">
                      <Icon name="edit" size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Pruning Care</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.pruningTips}</span>
                    </div>
                  </li>
                )}
                </ul>
              </Card>
            )}
          </div>
        )}

        {hasTraitsData && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleViewSection('traits')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Details & Traits</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('traits') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('traits') && (
              <Card>
                <div className="space-y-4 text-sm">
                {isValidData(archetype?.scientificName) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Scientific Name</strong>
                    <span className="text-slate-500 dark:text-slate-400 italic">{archetype?.scientificName}</span>
                  </div>
                )}
                {(isValidData(archetype?.category) || isValidData(archetype?.growthHabit) || isValidData(archetype?.lifecycle)) && (
                  <div className="grid grid-cols-2 gap-4">
                    {isValidData(archetype?.category) && (
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Category</strong>
                        <span className="text-slate-500 dark:text-slate-400">{archetype?.category}</span>
                      </div>
                    )}
                    {isValidData(archetype?.growthHabit) && (
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Growth Habit</strong>
                        <span className="text-slate-500 dark:text-slate-400">{archetype?.growthHabit}</span>
                      </div>
                    )}
                    {isValidData(archetype?.lifecycle) && (
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Lifecycle</strong>
                        <span className="text-slate-500 dark:text-slate-400">{archetype?.lifecycle}</span>
                      </div>
                    )}
                  </div>
                )}
                {isValidData(archetype?.growthRequirements) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Growth Requirements</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.growthRequirements}</span>
                  </div>
                )}
                {((archetype?.hardinessZones ?? []).length > 0 || isValidData(archetype?.hardinessNote)) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Hardiness Zones</strong>
                    {(archetype?.hardinessZones ?? []).length > 0 && (
                      <span className="text-slate-500 dark:text-slate-400 block">
                        {archetype?.hardinessZones?.join(', ')}
                      </span>
                    )}
                    {isValidData(archetype?.hardinessNote) && (
                      <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed mt-1">{archetype?.hardinessNote}</span>
                    )}
                  </div>
                )}
                {isValidData(archetype?.daysToHarvest) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Days to {milestoneVerbFuture}</strong>
                    <span className="text-slate-500 dark:text-slate-400">{archetype?.daysToHarvest} days</span>
                  </div>
                )}
                {isValidData(archetype?.flavorProfile) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Flavor Profile</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.flavorProfile}</span>
                  </div>
                )}
                {(archetype?.companionPlants ?? []).length > 0 && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Companion Plants</strong>
                    <span className="text-slate-500 dark:text-slate-400">{archetype?.companionPlants?.join(", ")}</span>
                  </div>
                )}
                {(archetype?.combativePlants ?? []).length > 0 && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Combative Plants</strong>
                    <span className="text-slate-500 dark:text-slate-400">{archetype?.combativePlants?.join(", ")}</span>
                  </div>
                )}
                </div>
              </Card>
            )}
          </div>
        )}

        {hasLifecycleData && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleViewSection('lifecycle')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Lifecycle & {milestoneVerbFuture}</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('lifecycle') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('lifecycle') && (
              <Card>
                <div className="space-y-4 text-sm">
                {isValidData(archetype?.whenToPlant) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to Plant</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToPlant}</span>
                  </div>
                )}
                {isValidData(archetype?.plantingInstructions) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">How to Plant</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.plantingInstructions}</span>
                  </div>
                )}
                {isValidData(archetype?.whenToHarvest) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to {milestoneVerbFuture}</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToHarvest}</span>
                  </div>
                )}
                {isValidData(archetype?.usesForLargeHarvests) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Abundant Yield Uses</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.usesForLargeHarvests}</span>
                  </div>
                )}
                </div>
              </Card>
            )}
          </div>
        )}

        {hasFunFacts && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 last:border-0">
            <button onClick={() => toggleViewSection('funFacts')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Fun Facts <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({archetype?.funFacts?.length || 0})</span>
              </Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('funFacts') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('funFacts') && (
              <div className="space-y-3">
                {archetype?.funFacts?.map((rawFact, idx) => {
                  const fact = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
                  const factIcon = fact.icon || 'lightbulb';
                  const factTitle = fact.title || "Did You Know?";
                  
                  return (
                    <Card key={idx} className="!p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {!fact.imageUrl && (
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg shadow-sm border border-primary-100 dark:border-primary-800/50 mt-0.5">
                            <Icon name={factIcon as IconName} size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-1">{factTitle}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">"{fact.fact}"</p>
                          {fact.attributedTo && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">— {fact.attributedTo}</p>
                          )}
                        </div>
                      </div>
                      {fact.imageUrl && (
                        <img src={fact.imageUrl} alt={factTitle} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full max-h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mt-1" />
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader 
        title={archetypeId === 'new' ? 'New Plant' : (isEditing ? `Editing ${archetype?.commonName}` : archetype?.commonName || 'Plant Details')}
        supertitle="Plant Dictionary"
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
        onOpenWorkspaceMenu={onOpenWorkspaceMenu}
        rightContent={canEdit && !isEditing ? (
          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-700 dark:hover:text-primary-400 active:scale-90 transition-all bg-transparent rounded-full shadow-sm">
            <Icon name="edit" size={20} />
          </button>
        ) : null}
      />
      {isEditing ? renderEditForm() : renderViewMode()}
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};