import React, { useState, useMemo, FC } from 'react';
import { PlantArchetype } from '../../../types';
import { Input, Button, Card } from '../../styles/StyledElements';
import { Icon, IconName } from '../common/Icon';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { FunFactManager } from './FunFactManager';
import { NutrientProfileInfoModal } from '../common/NutrientProfileInfoModal';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface ArchetypeFormProps {
  initialData: Partial<PlantArchetype>;
  isNew: boolean;
  onSave: (data: Partial<PlantArchetype>) => void;
  onCancel: () => void;
}

export const ArchetypeForm: FC<ArchetypeFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState(initialData);
  const [expandedEditSections, setExpandedEditSections] = useState<string[]>(['basic']);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const milestoneVerbFuture = useMemo(() => {
    const cat = formData.category?.toLowerCase() || '';
    if (cat.includes('flower')) return 'Bloom';
    if (cat.includes('foliage') || cat.includes('succulent') || cat.includes('houseplant')) return 'Maturity';
    return 'Harvest';
  }, [formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

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
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preferred Nutrient Profile</label>
                <button type="button" onClick={() => setIsInfoModalOpen(true)} className="text-primary-500 hover:text-primary-600 transition-colors">
                  <Icon name="help-circle" size={16} />
                </button>
              </div>
              <select value={formData.preferredNutrientProfile || 'LOW_FEED'} onChange={e => setFormData({...formData, preferredNutrientProfile: e.target.value as any})} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 h-[42px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm" required>
                <option value="BLOOM_BOOST">Heavy Feeders (Fruit & Yield)</option>
                <option value="VEG_GROW">Leafy & Lush (High Nitrogen Greens)</option>
                <option value="LOW_FEED">Mediterranean & Lean (Low-to-No Feed)</option>
                <option value="ACID_LOVERS">Acid Lovers (Low-pH Specialty)</option>
              </select>
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
            <FunFactManager 
              facts={formData.funFacts || []} 
              onChange={(newFacts) => setFormData({ ...formData, funFacts: newFacts })} 
            />
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <Button type="button" $variant="secondary" onClick={onCancel} className="flex-1 py-3 text-sm">Cancel</Button>
          <Button type="submit" className="flex-1 py-3 text-sm">{initialData.id ? 'Save Changes' : 'Add Plant'}</Button>
        </div>
      </form>
      <NutrientProfileInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
        currentProfile={formData.preferredNutrientProfile}
      />
    </Card>
  );
};