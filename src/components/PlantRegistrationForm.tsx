import { useState, useMemo, FC, FormEvent, ChangeEvent } from 'react';
import { PlantArchetype, Location, Zone } from '../../types';
import { Button, Input } from '../styles/StyledElements';

interface PlantRegistrationFormProps {
  prefilledQrId?: string;
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  submitLabel: string;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
  onCancel: () => void;
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

  const handleImageCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
      <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedMode(''); }}>
        <option value="" disabled>Select a category...</option>
        {groupedArchetypes.sortedCategories.map(category => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      {selectedCategory && (
        <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedMode} onChange={e => setSelectedMode(e.target.value)}>
          <option value="" disabled>Select a plant...</option>
          {groupedArchetypes.groups[selectedCategory].map(a => <option key={a.id} value={a.id}>{a.commonName}</option>)}
          <option value="other">+ Other (Add new...)</option>
        </select>
      )}
      <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setSelectedLocation(''); }}>
        <option value="" disabled>Select a zone...</option>
        {sortedZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
        <option value="other">+ Other (Add new zone...)</option>
      </select>
      {selectedZone && selectedZone !== 'other' && (
        <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
          <option value="" disabled>Select a location...</option>
          {locations.filter(l => l.zoneId === selectedZone).map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          <option value="other">+ Other (Add new location...)</option>
        </select>
      )}
      {(selectedZone === 'other' || selectedLocation === 'other') && (
        <div className="flex gap-3 mt-1">
          {selectedZone === 'other' && <div className="flex-1"><Input placeholder="Zone (e.g. Garden)" value={customZoneName} onChange={(e) => setCustomZoneName(e.target.value)} className="!mb-0" /></div>}
          <div className="flex-1"><Input placeholder="Name (e.g. Bed 1)" value={customLocationName} onChange={(e) => setCustomLocationName(e.target.value)} className="!mb-0" /></div>
        </div>
      )}
      {selectedMode === 'other' && (
        <>
          <Input placeholder="e.g., Heirloom Tomato" value={customName} onChange={(e) => setCustomName(e.target.value)} className="!mb-0 mt-1" autoFocus />
          <div className="mt-1">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Plant Photo (Optional)</label>
            <div className="flex items-center gap-3">
              {customImage && <img src={customImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />}
              <label className="py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-all cursor-pointer border border-transparent dark:border-emerald-800">
                📸 {customImage ? 'Retake Photo' : 'Take Photo'}
                <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} className="hidden" />
              </label>
            </div>
          </div>
        </>
      )}
      <div className="flex gap-2 mt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
};