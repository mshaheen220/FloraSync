import { FC, useState } from 'react';
import { FunFact } from '../../../types';
import { Input, Button } from '../../styles/StyledElements';
import { Icon, IconName } from '../common/Icon';
import { ImageUploadInput } from '../common/ImageUploadInput';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

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

interface FunFactManagerProps {
  facts: FunFact[];
  onChange: (facts: FunFact[]) => void;
}

export const FunFactManager: FC<FunFactManagerProps> = ({ facts, onChange }) => {
  const [editingFactIndex, setEditingFactIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-4 mt-4 animate-in fade-in duration-200">
      {facts.map((rawFact, idx) => {
        const fact = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
        
        const handleFactChange = (field: keyof FunFact, value: string) => {
          const newFacts = [...facts];
          const currentFact = typeof newFacts[idx] === 'string' ? { fact: newFacts[idx] as string } : newFacts[idx];
          newFacts[idx] = { ...currentFact, [field]: value };
          onChange(newFacts);
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
                  const newFacts = [...facts];
                  newFacts.splice(idx, 1);
                  onChange(newFacts);
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
                const newFacts = [...facts];
                newFacts.splice(idx, 1);
                onChange(newFacts);
          }} title="Delete Fact" className="p-1.5 rounded-lg transition-colors text-red-400 hover:text-red-600 active:scale-90"><Icon name="delete" size={18} /></button>
            </div>
          </div>
        );
      })}
      <Button type="button" $variant="secondary" onClick={() => {
        const currentFacts = facts || [];
        onChange([...currentFacts, { fact: '', icon: 'lightbulb' }]);
        setEditingFactIndex(currentFacts.length);
      }} className="w-full">
        + Add Fun Fact
      </Button>
    </div>
  );
};