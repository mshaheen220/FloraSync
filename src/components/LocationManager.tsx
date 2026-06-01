import { useState, FC, FormEvent } from 'react';
import { Location, PlantInstance } from '../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle } from '../styles/StyledElements';
import { Theme } from '../App';

interface LocationManagerProps {
  locations: Location[];
  instances: PlantInstance[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onAdd: (name: string, zone: string) => void;
  onDelete: (id: string) => void;
  onGoHome: () => void;
}

export const LocationManager: FC<LocationManagerProps> = ({ locations, instances, theme, onThemeChange, onAdd, onDelete, onGoHome }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [newZone, setNewZone] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newZone.trim()) return;
    onAdd(newName, newZone);
    setNewName('');
    setNewZone('');
    showToast('📍 Location added successfully!');
  };

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center gap-3 pt-6">
        <button onClick={onGoHome} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
          &larr;
        </button>
        <Title className="!mb-0">Settings</Title>
      </header>

      <Subtitle>Appearance</Subtitle>
      <Card className="flex gap-2 !p-2 mb-8">
        {(['light', 'dark', 'system'] as const).map(t => (
          <button
            key={t}
            onClick={() => onThemeChange(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${
              theme === t 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            {t}
          </button>
        ))}
      </Card>

      <Card>
        <Subtitle className="!mt-0">Add New Location</Subtitle>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 mt-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Zone (e.g. Greenhouse)</label>
            <Input placeholder="Zone Name" value={newZone} onChange={e => setNewZone(e.target.value)} className="!mb-0 py-2.5" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Specific Name (e.g. Shelf B)</label>
            <Input placeholder="Location Name" value={newName} onChange={e => setNewName(e.target.value)} className="!mb-0 py-2.5" />
          </div>
          <Button type="submit" className="mt-2">Add Location</Button>
        </form>
      </Card>

      <Subtitle>Existing Locations</Subtitle>
      <div className="space-y-3">
        {locations.map(loc => {
          const plantsInZone = instances.filter(i => i.locationId === loc.id).length;
          return (
            <Card key={loc.id} className="!p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{loc.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-0.5">{loc.zone}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-2">{plantsInZone} active plant{plantsInZone !== 1 && 's'}</p>
                </div>
                <button 
                  onClick={() => {
                    if (plantsInZone === 0 && window.confirm('Delete this location?')) {
                      onDelete(loc.id);
                      showToast('🗑️ Location removed');
                    }
                  }}
                  disabled={plantsInZone > 0}
                  className={`p-2 rounded-lg transition-colors ${plantsInZone > 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                >
                  🗑️
                </button>
              </div>
            </Card>
          );
        })}
      </div>
      <Toast visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};