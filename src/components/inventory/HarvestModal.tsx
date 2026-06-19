import { FC, useState } from 'react';
import { Button, Input } from '../../styles/StyledElements';
import { Harvest } from '../../../types';

interface HarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (harvest: Harvest) => void;
}

export const HarvestModal: FC<HarvestModalProps> = ({ isOpen, onClose, onSave }) => {
  const [yieldAmount, setYieldAmount] = useState('');
  const [yieldUnit, setYieldUnit] = useState('grams');
  const [quality, setQuality] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

  if (!isOpen) return null;

  const handleSave = () => {
    const newHarvest: Harvest = {
      id: `hvt-${Date.now()}`,
      date: new Date(date).toISOString(),
      yieldAmount: parseFloat(yieldAmount) || 0,
      yieldUnit,
      quality,
      notes,
    };
    onSave(newHarvest);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md m-4">
        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Record Harvest</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Yield</label>
            <Input 
              type="number"
              value={yieldAmount}
              onChange={e => setYieldAmount(e.target.value)}
              placeholder="e.g., 150"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
            <Input 
              type="text"
              value={yieldUnit}
              onChange={e => setYieldUnit(e.target.value)}
              placeholder="e.g., grams, items"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Quality</label>
          <select 
            value={quality}
            onChange={e => setQuality(e.target.value as any)}
            className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 h-[52px] focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option>Excellent</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
          <Input 
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g., Harvested the top-most buds."
            className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 h-24"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button $variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Harvest</Button>
        </div>
      </div>
    </div>
  );
};
