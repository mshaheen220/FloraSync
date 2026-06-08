import { useState, FC, useRef } from 'react';
import { Card, Button } from '../../../styles/StyledElements';
import JSZip from 'jszip';
import { Icon } from '../../common/Icon';

interface DataImportProps {
  token?: string | null;
  showToast: (msg: string) => void;
}

export const DataImport: FC<DataImportProps> = ({ token, showToast }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const zip = await JSZip.loadAsync(file);
      
      // Locate the core JSON file inside the ZIP
      const jsonFile = Object.values(zip.files).find(f => !f.dir && f.name.endsWith('.json'));
      if (!jsonFile) {
        showToast('❌ No .json file found in the package.');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const jsonText = await jsonFile.async('text');
      const data = JSON.parse(jsonText);

      if (!Array.isArray(data)) {
        showToast('❌ The .json file must contain an array of plants.');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Search for matching image files and convert them into Base64 Data URIs
      for (const item of data) {
        if (item.imageUrl && typeof item.imageUrl === 'string') {
          const targetPath = item.imageUrl.startsWith('/') ? item.imageUrl.substring(1) : item.imageUrl;
          const imgFile = Object.values(zip.files).find(f => !f.dir && f.name.endsWith(targetPath));
          
          if (imgFile) {
            const base64Data = await imgFile.async('base64');
            const extension = targetPath.split('.').pop()?.toLowerCase();
            const mimeType = extension === 'png' ? 'image/png' : 
                             extension === 'webp' ? 'image/webp' : 
                             'image/jpeg';
            item.imageUrl = `data:${mimeType};base64,${base64Data}`;
          }
        }
      }

      // Fire the processed payload to your existing API route
      const res = await fetch(`${apiBase}/api/import`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'archetypes', data })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`✅ Package imported successfully! Refreshing...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(`❌ Import failed: ${result.error || 'Check data format.'}`);
      }
    } catch (err) { 
      console.error(err);
      showToast('❌ Failed to process the package file.'); 
    }
    
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plant Package Import</label>
          <button onClick={() => setShowImportHelp(!showImportHelp)} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Icon name="help-circle" size={16} /> <span className="underline decoration-dotted underline-offset-2">Package Format</span>
          </button>
        </div>

        {showImportHelp && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs animate-in fade-in duration-300">
            <p className="text-slate-500 dark:text-slate-400 mb-2">Upload a <strong>.zip</strong> package containing your plants. The images will automatically be matched and imported.</p>
            <pre className="bg-slate-200 dark:bg-slate-900 p-2 rounded text-slate-600 dark:text-slate-300 overflow-x-auto text-[10px] leading-relaxed">
              /any-name.json{'\n'}
              /images/flowers/rose.jpg{'\n'}
              /images/foliage/fern.png
            </pre>
          </div>
        )}

        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50">
          <div className="mb-3 text-emerald-500 dark:text-emerald-400">
            <Icon name="package" size={48} />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Select a Plant Package</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Upload a .zip file containing your .json file and images.</p>
          
          <input 
            type="file" 
            accept=".zip,application/zip" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="flex justify-center items-center gap-2"
          >
            {isImporting ? 'Processing Package...' : 'Browse for .zip'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
