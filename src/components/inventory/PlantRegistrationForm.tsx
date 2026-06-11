import { useState, useMemo, FC, FormEvent } from 'react';
import { PlantArchetype, Location, Zone } from '../../../types';
import { Button, Input } from '../../styles/StyledElements';
import { Icon } from '../common/Icon';
import { ImageUploadInput } from '../common/ImageUploadInput';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface PlantRegistrationFormProps {
  prefilledQrId?: string;
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  submitLabel: string;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
  onCancel?: () => void;
}

export const PlantRegistrationForm: FC<PlantRegistrationFormProps> = ({ prefilledQrId, archetypes, locations, zones, submitLabel, onRegister, onCancel }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customZoneName, setCustomZoneName] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [customImage, setCustomImage] = useState('');

  const groupedArchetypes = useMemo(() => {
    const groups = archetypes.reduce((acc, curr) => {
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
  }, [archetypes]);

  const sortedZones = useMemo(() => {
    return [...zones].sort((a, b) => a.name.localeCompare(b.name));
  }, [zones]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    let finalPlantId = selectedMode;
    let finalIsNewPlant = false;
    if (selectedMode === 'other') {
      if (!customName.trim()) return;
      finalPlantId = customName;
      finalIsNewPlant = true;
    } else if (!selectedMode) return;

    let finalLocationId = selectedLocation;
    let finalIsNewLocation = false;
    let finalZoneId = selectedZone;
    let finalIsNewZone = false;

    if (selectedZone === 'other') {
      if (!customZoneName.trim() || !customLocationName.trim()) return;
      finalLocationId = customLocationName;
      finalIsNewLocation = true;
      finalZoneId = customZoneName;
      finalIsNewZone = true;
    } else if (selectedLocation === 'other') {
      if (!customLocationName.trim()) return;
      finalLocationId = customLocationName;
      finalIsNewLocation = true;
    } else if (!selectedLocation) return;

    const finalQrId = prefilledQrId || `qr-${Date.now()}`;
    onRegister(finalQrId, finalPlantId, finalIsNewPlant, finalLocationId, finalIsNewLocation, finalZoneId, finalIsNewZone, customImage);
  };

  const isSubmitDisabled = 
    !selectedCategory ||
    !selectedMode || 
    (selectedMode === 'other' && !customName.trim()) || 
    !selectedZone || 
    (selectedZone === 'other' && (!customLocationName.trim() || !customZoneName.trim())) || 
    (selectedZone !== 'other' && (!selectedLocation || (selectedLocation === 'other' && !customLocationName.trim())));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedMode(''); }}>
        <option value="" disabled>Select a category...</option>
        {groupedArchetypes.sortedCategories.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      {selectedCategory && (
        <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedMode} onChange={e => setSelectedMode(e.target.value)}>
          <option value="" disabled>Select a plant...</option>
          {groupedArchetypes.groups[selectedCategory].map(a => <option key={a.id} value={a.id}>{a.commonName}</option>)}
          <option value="other">+ Other (Add new...)</option>
        </select>
      )}
      <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setSelectedLocation(''); }}>
        <option value="" disabled>Select a zone...</option>
        {sortedZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        <option value="other">+ Other (Add new zone...)</option>
      </select>
      {selectedZone && selectedZone !== 'other' && (
        <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
          <option value="" disabled>Select a location...</option>
          {locations.filter(l => l.zoneId === selectedZone).map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          <option value="other">+ Other (Add new location...)</option>
        </select>
      )}
      {(selectedZone === 'other' || selectedLocation === 'other') && (
        <div className="flex gap-3 mt-1">
          {selectedZone === 'other' && <div className="flex-1"><Input placeholder="Zone (e.g. Garden)" value={customZoneName} onChange={(e) => setCustomZoneName(e.target.value)} className="!mb-0" /></div>}
          <div className="flex-1"><Input placeholder="Location (e.g. Bed 1)" value={customLocationName} onChange={(e) => setCustomLocationName(e.target.value)} className="!mb-0" /></div>
        </div>
      )}
      {selectedMode === 'other' && (
        <>
          <Input placeholder="e.g., Heirloom Tomato" value={customName} onChange={(e) => setCustomName(e.target.value)} className="!mb-0 mt-1" autoFocus />
          <div className="mt-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plant Photo (Optional)</label>
            <div className="flex items-center gap-3">
              {customImage && <img src={customImage} alt="Preview" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />}
              <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 transition-all cursor-pointer border border-transparent dark:border-primary-800">
                <Icon name="camera" size={18} /> {customImage ? 'Retake Photo' : 'Take Photo'}
                <ImageUploadInput onUpload={(base64) => setCustomImage(base64)} />
              </label>
            </div>
          </div>
        </>
      )}
      <div className="flex gap-2 mt-2">
        {onCancel && <Button type="button" $variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" disabled={isSubmitDisabled}>{submitLabel}</Button>
      </div>
    </form>
  );
};