import { useState, useEffect, FC } from 'react';
import { Card, Button, Input, Subtitle } from '../../../styles/StyledElements';

interface PrintCenterProps {
  token?: string | null;
  showToast: (msg: string) => void;
}

export const PrintCenter: FC<PrintCenterProps> = ({ token, showToast }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<{name: string, time: number}[]>([]);
  const [printMode, setPrintMode] = useState<'db' | 'blank'>('db');
  const [blankCategory, setBlankCategory] = useState<'plant' | 'location' | 'zone'>('plant');
  const [blankPrefix, setBlankPrefix] = useState('qr');
  const [blankStartId, setBlankStartId] = useState('001');

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  useEffect(() => {
    if (token) {
      fetch(`${apiBase}/api/prints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.files) {
            setGeneratedFiles(data.files);
          }
        })
        .catch(err => console.error('Failed to load prints:', err));
    }
  }, [apiBase, token]);

  const handleGenerateQRs = async () => {
    setIsGenerating(true);
    setGeneratedFiles([]);
    try {
      const res = await fetch(`${apiBase}/api/generate-qrs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mode: printMode,
          category: blankCategory,
          prefix: blankPrefix,
          startId: blankStartId
        })
      });
      const data = await res.json();
      if (data.success) {
        fetch(`${apiBase}/api/prints`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
          if (d.files) setGeneratedFiles(d.files);
        });
        showToast('🖨️ QR Sheets generated successfully!');
      } else {
        const errorLines = data.error?.split('\n').filter((l: string) => l.trim() !== '') || [];
        const shortError = errorLines.length > 0 ? errorLines[errorLines.length - 1] : 'Error generating QRs';
        showToast(`❌ ${shortError}`);
      }
    } catch (e) {
      showToast('❌ Failed to connect to server.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePrint = async (filename: string) => {
    if (!window.confirm('Delete this print sheet?')) return;
    try {
      const res = await fetch(`${apiBase}/api/prints/${filename}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('🗑️ Print sheet deleted');
        setGeneratedFiles(prev => prev.filter(f => f.name !== filename));
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      showToast('❌ Failed to connect to server.');
    }
  };

  const formatPrintName = (filename: string) => {
    let name = filename.replace('.png', '');
    const blankMatch = name.match(/^(plant|location|zone)_(.*?)_sheet_start_(\d+)_sheet_(\d+)$/);
    if (blankMatch) {
      const category = blankMatch[1].charAt(0).toUpperCase() + blankMatch[1].slice(1) + 's';
      const prefix = blankMatch[2].charAt(0).toUpperCase() + blankMatch[2].slice(1);
      const startId = blankMatch[3];
      const sheetNum = blankMatch[4];
      return `Blank ${category} ${prefix}-${startId}${sheetNum !== '1' ? ` (Sheet ${sheetNum})` : ''}`;
    }
    return name
      .replace('db_export_plants', 'Plant Inventory')
      .replace('db_export_locations', 'Locations')
      .replace('db_export_zones', 'Zones')
      .replace('db_export_spaces', 'Spaces (Zones & Locations)')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(' Sheet 1', '');
  };

  const handleDownload = async (filename: string) => {
    try {
      const res = await fetch(`${apiBase}/api/prints/${filename}?token=${token}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      
      // Try native share sheet first (perfect for iOS PWAs)
      if (navigator.share) {
        try {
          const file = new File([blob], filename, { type: blob.type || 'image/png' });
          await navigator.share({
            files: [file],
            title: formatPrintName(filename)
          });
          return;
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return; // User cancelled
          console.warn('Share API failed, falling back to standard download:', shareError);
        }
      }
      
      // Standard browser download fallback
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (e) {
      console.error(e);
      showToast('❌ Failed to download file.');
    }
  };

  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button onClick={() => setPrintMode('db')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${printMode === 'db' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            Database Export
          </button>
          <button onClick={() => setPrintMode('blank')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${printMode === 'blank' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            Blank Tags
          </button>
        </div>
        
        {printMode === 'db' ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Generate printable sheets for every active Plant, Location, and Zone currently in your system. Output files will be saved to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">src/data/code-prints/[garden-id]/</code> on the server.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select value={blankCategory} onChange={e => setBlankCategory(e.target.value as any)} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
                <option value="plant">Plants</option>
                <option value="location">Locations</option>
                <option value="zone">Zones</option>
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Prefix</label>
                <Input value={blankPrefix} onChange={e => setBlankPrefix(e.target.value)} className="!mb-0 py-2" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Start ID</label>
                <Input value={blankStartId} onChange={e => setBlankStartId(e.target.value)} className="!mb-0 py-2" />
              </div>
            </div>
          </div>
        )}
        
        <Button onClick={handleGenerateQRs} disabled={isGenerating} className="mt-2 flex justify-center items-center gap-2">
          {isGenerating ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...</>
          ) : (
            '🖨️ Generate Sheets'
          )}
        </Button>

        {generatedFiles.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Subtitle className="!text-sm mb-2">Ready to Print</Subtitle>
            <div className="flex flex-col gap-2">
              {generatedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
                  <div className="flex flex-col truncate mr-4">
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                      {formatPrintName(file.name)}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mt-0.5">
                      {new Date(file.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload(file.name)} className="text-xl text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform p-1">
                      ⬇️
                    </button>
                    <button onClick={() => handleDeletePrint(file.name)} className="text-xl text-red-400 hover:text-red-600 hover:scale-110 transition-transform p-1">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
