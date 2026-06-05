import { useState, FC } from 'react';
import { Card, Button } from '../../../styles/StyledElements';

interface DataImportProps {
  token?: string | null;
  showToast: (msg: string) => void;
}

export const DataImport: FC<DataImportProps> = ({ token, showToast }) => {
  const [importJson, setImportJson] = useState('');
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [importType, setImportType] = useState<'archetypes' | 'zones' | 'locations'>('archetypes');

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const getExampleSchema = () => {
    let example = {};
    if (importType === 'archetypes') {
      example = [{
        "id": "hylotelephium-telephioides-cuttings",
        "commonName": "Allegheny Stonecrop (Cuttings)",
        "scientificName": "Hylotelephium telephioides",
        "category": "Foliage Accent",
        "lifecycle": "Perennial",
        "sunRequirement": "Full Sun to Partial Shade",
        "waterIntervalDays": 10,
        "feedingIntervalDays": 60,
        "whatToFeed": "Rarely requires fertilizer...",
        "pruningTips": "Not applicable to fresh cuttings...",
        "flavorProfile": "Not edible.",
        "companionPlants": ["Coneflowers", "Tall Bearded Iris"],
        "combativePlants": ["None reported"],
        "growthHabit": "Sprawling Mounded (once established)",
        "daysToHarvest": 60,
        "imageUrl": "/images/foliage/Allegheny Stonecrop Cuttings.jpg",
        "whenToPlant": "Zone 6/7: Direct plant unrooted cuttings outdoors...",
        "whenToHarvest": "Not applicable...",
        "usesForLargeHarvests": "Excellent structural groundcover...",
        "hardinessZones": [4, 9],
        "hardinessNote": "Hardy perennial.",
        "plantingInstructions": "To plant unrooted cuttings...",
        "growthRequirements": "Requires completely average, lean, gritty, loose loam..."
      }];
    } else if (importType === 'zones') {
      example = [{
        "id": "zn-custom",
        "name": "Custom Zone",
        "evaporationModifier": 1.2
      }];
    } else if (importType === 'locations') {
      example = [{
        "id": "loc-custom",
        "name": "Custom Location",
        "zoneId": "zn-167..."
      }];
    }
    return JSON.stringify(example, null, 2);
  };

  const handleImportJson = async () => {
    try {
      const dataToImport = JSON.parse(importJson);
      if (!Array.isArray(dataToImport)) {
        showToast('❌ Invalid JSON. Must be an array of objects.');
        return;
      }
      
      const res = await fetch(`${apiBase}/api/import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: importType, data: dataToImport })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`✅ Import successful! Refreshing...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(`❌ Import failed: ${result.error || 'Check data format.'}`);
      }
    } catch (e) { showToast('❌ Invalid JSON format.'); }
  };

  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Import Type</label>
          <button onClick={() => setShowImportHelp(!showImportHelp)} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            ❓ <span className="underline decoration-dotted underline-offset-2">Schema Help</span>
          </button>
        </div>
        <select value={importType} onChange={e => setImportType(e.target.value as any)} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
          <option value="archetypes">Plant Dictionary (Archetypes)</option>
          <option value="zones">Zones</option>
          <option value="locations">Locations</option>
        </select>

        {showImportHelp && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs animate-in fade-in duration-300">
            <p className="text-slate-500 dark:text-slate-400 mb-2">Paste a valid JSON array. The <code className="text-xs">id</code> must be unique. Example for <strong className="text-slate-700 dark:text-slate-200">{importType}</strong>:</p>
            <pre className="bg-slate-200 dark:bg-slate-900 p-2 rounded text-slate-600 dark:text-slate-300 overflow-x-auto text-[10px]">
              <code>{getExampleSchema()}</code>
            </pre>
          </div>
        )}

        <textarea 
          value={importJson} 
          onChange={e => setImportJson(e.target.value)} 
          className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm font-mono" 
          rows={8} 
          placeholder={`Paste JSON array for ${importType} here...`} 
        />
        
        <Button 
          onClick={handleImportJson} 
          disabled={!importJson.trim()}
          className="flex justify-center items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Import Data
        </Button>
      </div>
    </Card>
  );
};
