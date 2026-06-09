import { FC, FormEvent, ChangeEvent, useState } from 'react';
import { PlantArchetype, FunFact } from '../../../types';
import { Card, Button, Input } from '../../styles/StyledElements';
import { Icon, IconName } from '../common/Icon';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface ArchetypeCardProps {
  arch: PlantArchetype;
  inUseCount: number;
  isEditing: boolean;
  isViewing: boolean;
  editData: Partial<PlantArchetype>;
  setEditData: (data: Partial<PlantArchetype>) => void;
  onViewToggle: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: (e: FormEvent) => void;
  onDelete: () => void;
  canEdit?: boolean;
}

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

export const ArchetypeCard: FC<ArchetypeCardProps> = ({
  arch,
  inUseCount,
  isEditing,
  isViewing,
  editData,
  setEditData,
  onViewToggle,
  onEditStart,
  onEditCancel,
  onSave,
  onDelete,
  canEdit
}) => {
  const [editingFactIndex, setEditingFactIndex] = useState<number | null>(null);
  const [expandedEditSections, setExpandedEditSections] = useState<string[]>(['basic']);

  // Compresses massive phone photos down to a lightweight 800px JPEG to protect the database
  const compressAndSaveImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800; 
        let { width, height } = img;
        if (width > height && width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; } 
        else if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.8)); 
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSaveImage(file, (base64) => setEditData({...editData, imageUrl: base64}));
    }
  };

  if (isEditing) {
    const sectionClass = "bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-all";

    const toggleEditSection = (section: string) => {
      setExpandedEditSections(prev =>
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

    return (
      <Card className="border-primary-500 dark:border-primary-500 shadow-md !p-5">
        <form onSubmit={onSave} className="flex flex-col gap-6">
          
          {/* Basic Info Section */}
          <div className={sectionClass}>
            {renderSectionHeader('basic', 'leaf', 'Basic Information')}
            {expandedEditSections.includes('basic') && (
              <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Common Name</label>
                  <Input value={editData.commonName || ''} onChange={e => setEditData({...editData, commonName: e.target.value})} className="!mb-0 py-2 text-base font-bold" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Scientific Name</label>
                    <Input value={editData.scientificName || ''} onChange={e => setEditData({...editData, scientificName: e.target.value})} className="!mb-0 py-2 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <Input value={editData.category || ''} onChange={e => setEditData({...editData, category: e.target.value})} className="!mb-0 py-2 text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plant Photo (Optional)</label>
                  <div className="flex items-center gap-3">
                    {editData.imageUrl && (
                      <img src={editData.imageUrl} alt="Preview" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                    )}
                  <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-all cursor-pointer shadow-sm">
                    <Icon name="camera" size={18} /> {editData.imageUrl ? 'Change Photo' : 'Upload Photo'}
                      <input type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
                    </label>
                    {editData.imageUrl && (
                      <button type="button" onClick={() => setEditData({...editData, imageUrl: ''})} className="text-red-500 hover:text-red-600 text-sm font-bold transition-colors">Remove</button>
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
                  <Input type="number" min="1" value={editData.waterIntervalDays || ''} onChange={e => setEditData({...editData, waterIntervalDays: Number(e.target.value)})} className="!mb-0 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Feed (Days)</label>
                  <Input type="number" min="1" value={editData.feedingIntervalDays || ''} onChange={e => setEditData({...editData, feedingIntervalDays: Number(e.target.value)})} className="!mb-0 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sunlight</label>
                  <Input value={editData.sunRequirement || ''} onChange={e => setEditData({...editData, sunRequirement: e.target.value})} className="!mb-0 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lifecycle</label>
                  <select value={editData.lifecycle || ''} onChange={e => setEditData({...editData, lifecycle: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 h-[42px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" required>
                    <option value="Annual">Annual</option>
                    <option value="Biennial">Biennial</option>
                    <option value="Perennial">Perennial</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hardiness Zones</label>
                  <Input value={editData.hardinessZones?.join(', ') || ''} onChange={e => setEditData({...editData, hardinessZones: e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))})} className="!mb-0 py-2 text-sm" placeholder="e.g. 10, 11" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hardiness Note</label>
                  <Input value={editData.hardinessNote || ''} onChange={e => setEditData({...editData, hardinessNote: e.target.value})} className="!mb-0 py-2 text-sm" placeholder="e.g. Zone 6/7" />
                </div>
              </div>
            )}
          </div>

          {/* Planting & Harvest Section */}
          <div className={sectionClass}>
            {renderSectionHeader('planting', 'sprout', 'Planting & Harvest')}
            {expandedEditSections.includes('planting') && (
              <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in duration-200">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">How to Plant</label>
                  <textarea value={editData.plantingInstructions || ''} onChange={e => setEditData({...editData, plantingInstructions: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={4} placeholder="e.g. Sow 1/4 inch deep, mulch heavily..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">When to Plant</label>
                  <Input value={editData.whenToPlant || ''} onChange={e => setEditData({...editData, whenToPlant: e.target.value})} className="!mb-0 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">When to Harvest</label>
                  <Input value={editData.whenToHarvest || ''} onChange={e => setEditData({...editData, whenToHarvest: e.target.value})} className="!mb-0 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Days to Harvest</label>
                  <Input type="number" min="0" value={editData.daysToHarvest || ''} onChange={e => setEditData({...editData, daysToHarvest: Number(e.target.value)})} className="!mb-0 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Growth Habit</label>
                  <Input value={editData.growthHabit || ''} onChange={e => setEditData({...editData, growthHabit: e.target.value})} className="!mb-0 py-2 text-sm" required />
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
                  <textarea value={editData.growthRequirements || ''} onChange={e => setEditData({...editData, growthRequirements: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={4} placeholder="e.g. Climbs aggressively, requires a sturdy trellis..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">What to Feed</label>
                  <textarea value={editData.whatToFeed || ''} onChange={e => setEditData({...editData, whatToFeed: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Pruning Tips</label>
                  <textarea value={editData.pruningTips || ''} onChange={e => setEditData({...editData, pruningTips: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
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
                  <Input value={editData.flavorProfile || ''} onChange={e => setEditData({...editData, flavorProfile: e.target.value})} className="!mb-0 py-2 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Large Harvest Uses</label>
                  <textarea value={editData.usesForLargeHarvests || ''} onChange={e => setEditData({...editData, usesForLargeHarvests: e.target.value})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Companions</label>
                    <Input value={editData.companionPlants?.join(', ') || ''} onChange={e => setEditData({...editData, companionPlants: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})} className="!mb-0 py-2 text-sm" placeholder="Comma separated" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Combative</label>
                    <Input value={editData.combativePlants?.join(', ') || ''} onChange={e => setEditData({...editData, combativePlants: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)})} className="!mb-0 py-2 text-sm" placeholder="Comma separated" />
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
                {editData.funFacts?.map((rawFact, idx) => {
                  const fact = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
                  const handleFactChange = (field: keyof FunFact, value: string) => {
                    const newFacts = [...(editData.funFacts || [])];
                    const currentFact = typeof newFacts[idx] === 'string' ? { fact: newFacts[idx] as string } : newFacts[idx];
                    newFacts[idx] = { ...currentFact, [field]: value };
                    setEditData({ ...editData, funFacts: newFacts });
                  };
                  
                  if (editingFactIndex === idx) {
                    return (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 mb-3 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Editing Fact #{idx + 1}</span>
                        </div>
                        <div className="flex gap-3">
                          <Input placeholder="Title (Optional, e.g. 'Historical Use')" value={fact.title || ''} onChange={e => handleFactChange('title', e.target.value)} className="!mb-0 py-2 text-sm flex-1" />
                          <select 
                            value={fact.icon || ''} 
                            onChange={e => handleFactChange('icon', e.target.value)}
                            className="border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm"
                          >
                            <option value="lightbulb">Default</option>
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
                            <input type="file" accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressAndSaveImage(file, (base64) => handleFactChange('imageUrl', base64));
                              }
                            }} className="hidden" />
                          </label>
                          {fact.imageUrl && (
                            <button type="button" onClick={() => handleFactChange('imageUrl', '')} className="text-red-500 hover:text-red-600 text-xs font-bold transition-colors">Remove</button>
                          )}
                        </div>
                        <div className="flex justify-end gap-3 mt-1">
                          <button type="button" onClick={() => {
                            const newFacts = [...(editData.funFacts || [])];
                            newFacts.splice(idx, 1);
                            setEditData({...editData, funFacts: newFacts});
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
                          const newFacts = [...(editData.funFacts || [])];
                          newFacts.splice(idx, 1);
                          setEditData({...editData, funFacts: newFacts});
                    }} title="Delete Fact" className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 active:scale-90"><Icon name="delete" size={18} /></button>
                      </div>
                    </div>
                  );
                })}
                <Button type="button" $variant="secondary" onClick={() => {
                  const currentFacts = editData.funFacts || [];
                  setEditData({...editData, funFacts: [...currentFacts, { fact: '', icon: 'lightbulb' }]});
                  setEditingFactIndex(currentFacts.length);
                }} className="w-full">
                  + Add Fun Fact
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-4 pt-2">
            <Button type="button" $variant="secondary" onClick={onEditCancel} className="flex-1 py-3 text-sm">Cancel</Button>
            <Button type="submit" className="flex-1 py-3 text-sm">Save Changes</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="!p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{arch.commonName}</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 select-all">{arch.id}</p>
          <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">
            <span className="flex items-center gap-1"><Icon name="water" size={14} /> {arch.waterIntervalDays}d</span>
            <span className="flex items-center gap-1"><Icon name="feed" size={14} /> {arch.feedingIntervalDays}d</span>
            <span className="flex items-center gap-1"><Icon name="sun" size={14} /> {arch.sunRequirement}</span>
          </div>
          <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mt-2">{inUseCount} planted</p>
        </div>
        <div className="flex gap-1">
      <button onClick={onViewToggle} className={`p-2 rounded-lg transition-colors active:scale-90 ${isViewing ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400' : 'text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400'}`} title="View Details"><Icon name="view" size={18} /></button>
          {canEdit && (
            <>
          <button onClick={onEditStart} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 active:scale-90"><Icon name="edit" size={18} /></button>
          <button onClick={onDelete} className={`p-2 rounded-lg transition-colors ${inUseCount > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-30' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}><Icon name="delete" size={18} /></button>
            </>
          )}
        </div>
      </div>
      {isViewing && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-sm space-y-3">
          {arch.imageUrl && (
            <img src={arch.imageUrl} alt={arch.commonName} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-32 object-cover rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800" />
          )}
          {arch.scientificName && arch.scientificName !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Scientific Name</strong> <span className="italic block text-slate-700 dark:text-slate-300">{arch.scientificName}</span></div>}
          {(arch.category || arch.growthHabit || arch.lifecycle) && (
            <div className="grid grid-cols-2 gap-2">
              {arch.category && arch.category !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Category</strong> <span className="block text-slate-700 dark:text-slate-300">{arch.category}</span></div>}
              {arch.growthHabit && arch.growthHabit !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Growth Habit</strong> <span className="block text-slate-700 dark:text-slate-300">{arch.growthHabit}</span></div>}
              {arch.lifecycle && arch.lifecycle !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Lifecycle</strong> <span className="block text-slate-700 dark:text-slate-300">{arch.lifecycle}</span></div>}
            </div>
          )}
          {arch.plantingInstructions && arch.plantingInstructions !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">How to Plant</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.plantingInstructions}</span></div>}
          {arch.growthRequirements && arch.growthRequirements !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Growth Requirements</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.growthRequirements}</span></div>}
          {arch.whatToFeed && arch.whatToFeed !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">What to Feed</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.whatToFeed}</span></div>}
          {arch.pruningTips && arch.pruningTips !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Pruning Tips</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.pruningTips}</span></div>}
          {arch.usesForLargeHarvests && arch.usesForLargeHarvests !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Harvest Uses</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.usesForLargeHarvests}</span></div>}
          {arch.flavorProfile && arch.flavorProfile !== 'Unknown' && <div><strong className="block text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Flavor Profile</strong> <span className="block text-slate-700 dark:text-slate-300 leading-relaxed">{arch.flavorProfile}</span></div>}
        </div>
      )}
    </Card>
  );
};