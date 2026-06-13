import { useState, FC, useRef } from 'react';
import { Card, Button } from '../../../styles/StyledElements';
import JSZip from 'jszip';
import { Icon } from '../../common/Icon';
import { compressBase64Image } from '../../../utils/imageCompression';
import { apiFetch } from '../../../utils/api';

interface DataImportProps {
  showToast: (msg: string) => void;
}

export const DataImport: FC<DataImportProps> = ({ showToast }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await apiFetch('/api/import', {
        method: 'POST',
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

  const handleOptimizeImages = async () => {
    if (!window.confirm('This will safely scan your entire database and permanently compress any oversized photos to speed up syncing. Proceed?')) return;
    setIsImporting(true);
    try {
      const res = await apiFetch('/api/state');
      const data = await res.json();
      
      let compressedCount = 0;
      let savedBytes = 0;

      const processImage = async (imgStr?: string) => {
        // Only process if it's an image data URI and larger than ~75KB (approx 100,000 chars)
        if (!imgStr || !imgStr.startsWith('data:image') || imgStr.length < 100000) return imgStr;
        const before = imgStr.length;
        const afterStr = await compressBase64Image(imgStr, 800, 0.7);
        const after = afterStr.length;
        if (after < before) {
          compressedCount++;
          savedBytes += (before - after);
          return afterStr;
        }
        return imgStr;
      };

      if (data.instances) {
        for (const inst of data.instances) {
          inst.imageUrl = await processImage(inst.imageUrl);
          if (inst.journal) for (const j of inst.journal) {
            j.imageUrl = await processImage(j.imageUrl);
            j.authorImageUrl = await processImage(j.authorImageUrl);
          }
        }
      }
      if (data.archetypes) {
        for (const arch of data.archetypes) {
          arch.imageUrl = await processImage(arch.imageUrl);
          if (arch.funFacts) for (const f of arch.funFacts) f.imageUrl = await processImage(f.imageUrl);
        }
      }
      if (data.gardenJournal) {
        for (const j of data.gardenJournal) {
          j.imageUrl = await processImage(j.imageUrl);
          j.authorImageUrl = await processImage(j.authorImageUrl);
        }
      }
      if (data.zones) {
        for (const z of data.zones) z.imageUrl = await processImage(z.imageUrl);
      }
      if (data.locations) {
        for (const l of data.locations) l.imageUrl = await processImage(l.imageUrl);
      }

      if (compressedCount > 0) {
        await apiFetch('/api/state', { method: 'POST', body: JSON.stringify(data) });
        const mbSaved = (savedBytes * (3/4) / 1024 / 1024).toFixed(2); // Convert base64 string length back to actual file size bytes
        showToast(`✅ Compressed ${compressedCount} images! Saved ~${mbSaved} MB.`);
        setTimeout(() => window.location.reload(), 2500);
      } else {
        showToast('✅ All images in the database are already optimized!');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to optimize database.');
    }
    setIsImporting(false);
  };

  return (
    <>
      <Card className="mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plant Package Import</label>
          <button onClick={() => setShowImportHelp(!showImportHelp)} className="text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
            <Icon name="help-circle" size={16} /> <span className="underline decoration-dotted underline-offset-2">Package Format</span>
          </button>
        </div>

        {showImportHelp && (
          <div className="p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg text-xs animate-in fade-in duration-300">
            <p className="text-slate-500 dark:text-slate-400 mb-2">Upload a <strong>.zip</strong> package containing your plants. The images will automatically be matched and imported.</p>
            <pre className="bg-surface-200 dark:bg-surface-900 p-2 rounded text-slate-600 dark:text-slate-300 overflow-x-auto text-[10px] leading-relaxed">
              /any-name.json{'\n'}
              /images/flowers/rose.jpg{'\n'}
              /images/foliage/fern.png
            </pre>
          </div>
        )}

        <div className="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-50 dark:bg-surface-800/50">
          <div className="mb-3 text-primary-500 dark:text-primary-400">
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

      <Card className="mb-4 border-primary-200 dark:border-primary-800">
        <div className="flex flex-col gap-4">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Database Optimization</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed -mt-2">
            If your app is running slowly, you likely have large uncompressed photos saved in your history. This tool will scan your entire database and automatically shrink any oversized images.
          </p>
          <Button 
            onClick={handleOptimizeImages} 
            disabled={isImporting}
            $variant="secondary"
            className="flex justify-center items-center gap-2 !bg-primary-50 dark:!bg-primary-900/30 !text-primary-700 dark:!text-primary-400"
          >
            {isImporting ? 'Processing...' : <><Icon name="sparkles" size={18} /> Compress Existing Images</>}
          </Button>
        </div>
      </Card>
    </>
  );
};
