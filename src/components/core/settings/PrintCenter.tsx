import { useState, useEffect, FC } from 'react';
import { Card, Button, Input, Subtitle, Container, Toast } from '../../../styles/StyledElements';
import { PrintLayout, PrintItem } from './PrintLayout';
import { PageHeader } from '../../common/PageHeader';
import { useGarden } from '../../../contexts/GardenContext';

interface PrintCenterProps {
  token?: string | null;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const PrintCenter: FC<PrintCenterProps> = ({ token, onOpenMenu, onOpenWorkspaceMenu }) => {
  const { instances, archetypes, locations, zones, printQueue, setPrintQueue, gardenProfile } = useGarden();
  const [toastMessage, setToastMessage] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<{name: string, time: number}[]>([]);
  
  const [showPreview, setShowPreview] = useState(false);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);
  
  const [printMode, setPrintMode] = useState<'queue' | 'db' | 'blank'>('queue');
  const [template, setTemplate] = useState<'stake-10x6' | 'square-1in' | 'label-6x3'>('label-6x3');
  const [printActions, setPrintActions] = useState<string[]>(['none']);
  const [dbPrintCategories, setDbPrintCategories] = useState<string[]>(['plant', 'location', 'zone']);
  const [blankCategories, setBlankCategories] = useState<string[]>(['plant']);
  const [blankPrefix, setBlankPrefix] = useState(() => `${Math.random().toString(36).substring(2, 5).toUpperCase()}`);
  const [blankStartId, setBlankStartId] = useState(() => Math.floor(Math.random() * 1000).toString().padStart(3, '0'));
  const [smartFill, setSmartFill] = useState(false);

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

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

  const handleOpenPrintPreview = () => {
    const generatedItems: PrintItem[] = [];

    if (printMode === 'queue') {
      if (printQueue.length === 0) {
        showToast('❌ Print queue is empty.');
        return;
      }
      
      printQueue.forEach(item => {
        generatedItems.push({
          id: item.targetId,
          type: item.type,
          action: item.action !== 'none' ? item.action as any : undefined,
          title: item.title,
          subtitle: item.subtitle
        });
      });

      if (smartFill) {
        const sheetSize = template === 'label-6x3' ? 24 : template === 'stake-10x6' ? 10 : 48;
        const remainder = generatedItems.length % sheetSize;
        if (remainder > 0) {
          const blanksNeeded = sheetSize - remainder;
          const start = parseInt(blankStartId, 10) || 1;
          const padding = blankStartId.length || 3;
          for (let i = 0; i < blanksNeeded; i++) {
            const idNum = (start + i).toString().padStart(padding, '0');
            generatedItems.push({
              id: `${blankPrefix}-${idNum}`,
              type: 'plant',
              title: '',
              subtitle: ''
            });
          }
          setBlankStartId((start + blanksNeeded).toString().padStart(padding, '0'));
        }
      }
    } else if (printMode === 'db') {
      if (printActions.length === 0) {
      showToast('❌ Please select at least one action.');
      return;
    }
      printActions.forEach(action => {
        if (dbPrintCategories.includes('plant')) {
          instances.forEach(inst => {
            const arch = archetypes.find(a => a.id === inst.archetypeId);
            generatedItems.push({ 
              id: inst.qrId, 
              type: 'plant', 
              action: action !== 'none' ? action as any : undefined,
              title: action === 'water' ? `Water ${arch?.commonName || 'Plant'}` : action === 'feed' ? `Feed ${arch?.commonName || 'Plant'}` : (arch?.commonName || 'Unknown Plant'), 
              subtitle: arch?.scientificName || '' 
            });
          });
        }
        if (dbPrintCategories.includes('location')) {
          locations.forEach(loc => {
            const zone = zones.find(z => z.id === loc.zoneId);
            generatedItems.push({ 
              id: loc.id, 
              type: 'location', 
              action: action !== 'none' ? action as any : undefined,
              title: action === 'water' ? `Water ${loc.name}` : action === 'feed' ? `Feed ${loc.name}` : loc.name, 
              subtitle: zone?.name || '' 
            });
          });
        }
        if (dbPrintCategories.includes('zone')) {
          zones.forEach(zone => {
            generatedItems.push({ 
              id: zone.id, 
              type: 'zone', 
              action: action !== 'none' ? action as any : undefined,
              title: action === 'water' ? `Water ${zone.name}` : action === 'feed' ? `Feed ${zone.name}` : zone.name, 
              subtitle: 'Macro Area' 
            });
          });
        }
      });
    } else {
      if (printActions.length === 0) {
        showToast('❌ Please select at least one action.');
        return;
      }
      // Generate sequence of blank tags
      const start = parseInt(blankStartId, 10);
      const padding = blankStartId.length;
      let count = 0;
      // Default to 48 tags (typical sheet size)
      printActions.forEach(action => {
        blankCategories.forEach(category => {
          for (let i = 0; i < 48; i++) {
            const idNum = (start + count).toString().padStart(padding, '0');
            generatedItems.push({
              id: `${blankPrefix}-${idNum}`,
              type: category as any,
              action: action !== 'none' ? action as any : undefined,
              title: '',
              subtitle: ''
            });
            count++;
          }
        });
      });
    }

    if (generatedItems.length === 0) {
      showToast('❌ No items found to print.');
      return;
    }

    setPrintItems(generatedItems);
    setShowPreview(true);
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
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title="Print Center" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />
      <Card className="mb-4">
      {showPreview && (
        <PrintLayout items={printItems} template={template} onClose={() => setShowPreview(false)} />
      )}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button onClick={() => setPrintMode('queue')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${printMode === 'queue' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Queue ({printQueue.length})
          </button>
          <button onClick={() => setPrintMode('db')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${printMode === 'db' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Bulk from DB
          </button>
          <button onClick={() => setPrintMode('blank')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${printMode === 'blank' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            Blanks
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Label Layout</label>
            <select value={template} onChange={e => setTemplate(e.target.value as any)} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm">
              <option value="label-6x3">6cm x 3cm Small Labels</option>
              <option value="stake-10x6">10cm x 6cm Garden Stakes</option>
              <option value="square-1in">1-inch Square Labels</option>
            </select>
          </div>

          {printMode === 'queue' && (
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items to Print</label>
                {printQueue.length > 0 && (
                  <button onClick={() => setPrintQueue([])} className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    Clear Queue
                  </button>
                )}
              </div>
              
              {printQueue.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-2xl block mb-2">🛒</span>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your Print Queue is empty.</p>
                  <p className="text-xs text-slate-500 mt-1">Add specific tags to the queue directly from the Plant, Zone, and Location detail screens.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {printQueue.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.type === 'plant' ? '🌿' : item.type === 'location' ? '📍' : '🗺️'}</span>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.action !== 'none' ? `${item.action === 'water' ? '💧 Water' : '🍽️ Feed'} ` : ''}{item.title}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.type}</span>
                        </div>
                      </div>
                      <button onClick={() => setPrintQueue(prev => prev.filter(q => q.id !== item.id))} className="text-red-400 hover:text-red-600 p-2 leading-none font-bold text-lg rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 mt-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={smartFill} onChange={e => setSmartFill(e.target.checked)} className="mt-1 accent-emerald-600 w-4 h-4 cursor-pointer flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Smart Fill Sheet</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 leading-relaxed">Automatically generate sequential blank tags to fill the remaining empty spaces on the printer sheet so no paper goes to waste!</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {printMode !== 'queue' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tag Actions</label>
                <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={printActions.includes('none')} onChange={(e) => {
                  if (e.target.checked) setPrintActions(prev => [...prev, 'none']);
                  else setPrintActions(prev => prev.filter(a => a !== 'none'));
                }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                ℹ️ Standard Info
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={printActions.includes('water')} onChange={(e) => {
                  if (e.target.checked) setPrintActions(prev => [...prev, 'water']);
                  else setPrintActions(prev => prev.filter(a => a !== 'water'));
                }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                💧 Water
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input type="checkbox" checked={printActions.includes('feed')} onChange={(e) => {
                  if (e.target.checked) setPrintActions(prev => [...prev, 'feed']);
                  else setPrintActions(prev => prev.filter(a => a !== 'feed'));
                }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                🍽️ Feed
              </label>
                </div>
              </div>

              {printMode === 'db' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Categories to Print</label>
                  <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={dbPrintCategories.includes('plant')} onChange={(e) => {
                    if (e.target.checked) setDbPrintCategories(prev => [...prev, 'plant']);
                    else setDbPrintCategories(prev => prev.filter(c => c !== 'plant'));
                  }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                  <img src="/images/icons/qr/plant.png" alt="Plants" className="w-5 h-5 mb-1 object-contain" /> Plants
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={dbPrintCategories.includes('location')} onChange={(e) => {
                    if (e.target.checked) setDbPrintCategories(prev => [...prev, 'location']);
                    else setDbPrintCategories(prev => prev.filter(c => c !== 'location'));
                  }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                  <img src="/images/icons/qr/location.png" alt="Locations" className="w-5 h-5 mb-1 object-contain" /> Locations
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={dbPrintCategories.includes('zone')} onChange={(e) => {
                    if (e.target.checked) setDbPrintCategories(prev => [...prev, 'zone']);
                    else setDbPrintCategories(prev => prev.filter(c => c !== 'zone'));
                  }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                  <img src="/images/icons/qr/zone.png" alt="Zones" className="w-5 h-5 mb-1 object-contain" /> Zones
                </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Categories to Print</label>
                  <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={blankCategories.includes('plant')} onChange={(e) => {
                    if (e.target.checked) setBlankCategories(prev => [...prev, 'plant']);
                    else setBlankCategories(prev => prev.filter(c => c !== 'plant'));
                  }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                  <img src="/images/icons/qr/plant.png" alt="Plants" className="w-5 h-5 mb-1 object-contain" /> Plants
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={blankCategories.includes('location')} onChange={(e) => {
                    if (e.target.checked) setBlankCategories(prev => [...prev, 'location']);
                    else setBlankCategories(prev => prev.filter(c => c !== 'location'));
                  }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                  <img src="/images/icons/qr/location.png" alt="Locations" className="w-5 h-5 mb-1 object-contain" /> Locations
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={blankCategories.includes('zone')} onChange={(e) => {
                    if (e.target.checked) setBlankCategories(prev => [...prev, 'zone']);
                    else setBlankCategories(prev => prev.filter(c => c !== 'zone'));
                  }} className="accent-emerald-600 w-4 h-4 cursor-pointer" />
                  <img src="/images/icons/qr/zone.png" alt="Zones" className="w-5 h-5 mb-1 object-contain" /> Zones
                </label>
                  </div>
                </div>
              )}
            </>
          )}

          {(printMode === 'blank' || (printMode === 'queue' && smartFill)) && (
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
          )}
        </div>
        
        <Button onClick={handleOpenPrintPreview} className="mt-2 flex justify-center items-center gap-2">
          🖨️ Open Print Preview
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
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};
