import { FC, useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, Subtitle, Button } from '../../src/styles/StyledElements';
import { Icon } from '../../src/components/common/Icon';
import { FEED_PROFILE_LABELS } from '../../src/utils/constants';
import { useGarden } from '../../src/contexts/GardenContext';

interface GardenMakeupWidgetProps {
  settings?: any;
}

const getCategoryColor = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('veg')) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50';
  if (c.includes('herb')) return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800/50';
  if (c.includes('flower')) return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800/50';
  if (c.includes('fruit') || c.includes('berry')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50';
  if (c.includes('tree') || c.includes('shrub')) return 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/40 dark:text-stone-300 dark:border-stone-800/50';
  if (c.includes('foliage') || c.includes('houseplant')) return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800/50';
  return 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:border-primary-800/50';
};

const getCategoryBarColor = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes('veg')) return 'bg-emerald-400 dark:bg-emerald-500';
  if (c.includes('herb')) return 'bg-teal-400 dark:bg-teal-500';
  if (c.includes('flower')) return 'bg-rose-400 dark:bg-rose-500';
  if (c.includes('fruit') || c.includes('berry')) return 'bg-orange-400 dark:bg-orange-500';
  if (c.includes('tree') || c.includes('shrub')) return 'bg-stone-400 dark:bg-stone-500';
  if (c.includes('foliage') || c.includes('houseplant')) return 'bg-indigo-400 dark:bg-indigo-500';
  return 'bg-primary-400 dark:bg-primary-500';
};

const getFeedBadgeColor = (feed: string) => {
  if (feed === 'BLOOM_BOOST') return 'bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50';
  if (feed === 'VEG_GROW') return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50';
  if (feed === 'LOW_FEED') return 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50';
  if (feed === 'ACID_LOVERS') return 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50';
  return 'bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50';
};

const SHOPPING_GUIDE: Record<string, { buy: string, why: string, npk: string, tips: string }> = {
  'GENERAL_FEED': { 
    buy: 'Balanced Fertilizer', 
    why: 'A safe, all-purpose feed for general maintenance.',
    npk: 'Balanced N-P-K (e.g., 10-10-10, 5-5-5)',
    tips: 'Often labeled as "All-Purpose" or "Tomato & Vegetable". Good for steady, overall health.'
  },
  'VEG_GROW': { 
    buy: 'High-Nitrogen Liquid Feed', 
    why: 'Fuels rapid, lush leaf growth for greens and herbs.',
    npk: 'First number is highest (e.g., 24-8-16, 5-1-1)',
    tips: 'Look for Fish Emulsion, Blood Meal, or "Foliage" fertilizers. Apply during active vegetative growth.'
  },
  'BLOOM_BOOST': { 
    buy: 'High-Phosphorus Granular Feed', 
    why: 'Provides energy for heavy flower and fruit production.',
    npk: 'Middle number is highest (e.g., 15-30-15, 3-4-4)',
    tips: 'Commonly labeled as "Bloom Booster" or "Bone Meal". Start applying right as buds begin to form.'
  },
  'ACID_LOVERS': { 
    buy: 'Acidifying Fertilizer', 
    why: 'Lowers soil pH so these specific plants can absorb nutrients without iron deficiency.',
    npk: 'Variable, but must say "For Acid-Loving Plants"',
    tips: 'Look for foods targeting Azaleas, Camellias, or Blueberries. Often contains added iron or elemental sulfur to prevent yellowing leaves.'
  },
  'LOW_FEED': { 
    buy: 'Nothing! (Or half-strength Liquid Kelp)', 
    why: 'These herbs thrive in poor soil. Too much food dilutes their flavor and causes leggy growth.',
    npk: 'Very low or 0-0-1',
    tips: 'Only feed if the plant looks pale or stunted. A very light dose of compost tea or liquid kelp is plenty.'
  }
};

const PrintShoppingList: FC<{ stats: any, gardenName: string, onClose: () => void }> = ({ stats, gardenName, onClose }) => {
  useEffect(() => {
    // iOS Chrome/Safari Print Hack: Explicitly hide the root app DOM node while this 
    // full-screen print preview is open. This absolutely guarantees that mobile print 
    // engines cannot accidentally snapshot the background dashboard layout.
    const rootEl = document.getElementById('root');
    const originalDisplay = rootEl ? rootEl.style.display : '';
    if (rootEl) rootEl.style.display = 'none';

    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page { margin: 0.5in; }
        html, body { 
          width: 100% !important; 
          height: auto !important; 
          margin: 0 !important; 
          padding: 0 !important; 
          overflow: visible !important; 
          background-color: #ffffff !important; 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        body > *:not(#shopping-print-portal) { display: none !important; }
        
        /* Force the portal to start exactly at the top left of the page */
        #shopping-print-portal { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; height: auto !important; display: block !important; background-color: #ffffff !important; }
        .print-item { page-break-inside: avoid !important; break-inside: avoid !important; }
      }
    `;
    document.head.appendChild(style);

    const handleAfterPrint = () => {
      // This event fires after the system's print dialog is closed,
      // regardless of whether the user printed or cancelled.
      // We can now automatically close our print preview component.
      onClose();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => { 
      if (rootEl) rootEl.style.display = originalDisplay;
      document.head.removeChild(style); 
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  return createPortal(
    <div id="shopping-print-portal" className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto">
      <div className="print:hidden sticky top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-xl z-50">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg">Print Preview</h2>
          <span className="text-xs text-slate-400">8.5x11" Shopping List</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors">Cancel</button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold transition-colors shadow-lg flex items-center gap-2">
            <Icon name="print" size={18} /> Print
          </button>
        </div>
      </div>
      <div className="p-8 print:p-0 max-w-3xl mx-auto font-sans">
        <div className="border-b-2 border-emerald-600 pb-1 mb-2">
          <h1 className="text-2xl font-black text-slate-900 mb-0.5">{gardenName} Shopping List</h1>
          <p className="text-sm text-slate-600 font-medium">Generated by FloraSync</p>
        </div>
        
        <div className="space-y-2">
          {(() => {
            const specializedFeeds = stats.sortedFeeds.filter((f: any) => f[0] !== 'GENERAL_FEED');
            const generalFeed = stats.sortedFeeds.find((f: any) => f[0] === 'GENERAL_FEED') || ['GENERAL_FEED', { count: 0, examples: ['Any plant when you are unsure'] }];
            const feedsToPrint = [...specializedFeeds, generalFeed];
            
            return feedsToPrint.map(([feed, data]: any) => {
              const guide = SHOPPING_GUIDE[feed] || SHOPPING_GUIDE['GENERAL_FEED'];
              return (
                <div key={feed} className="print-item">
                  {feed === 'GENERAL_FEED' && specializedFeeds.length > 0 && (
                    <div className="flex items-center gap-4 my-1 opacity-60">
                      <div className="h-px bg-slate-400 flex-1"></div>
                      <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">OR</span>
                      <div className="h-px bg-slate-400 flex-1"></div>
                    </div>
                  )}
                  <div className={`border-2 rounded-xl p-3 ${feed === 'GENERAL_FEED' ? 'bg-surface-50 border-surface-300 border-dashed' : 'bg-white border-surface-200'}`}>
                    <div className="flex justify-between items-end border-b border-slate-100 pb-1 mb-1.5">
                    <h2 className="text-lg font-bold text-slate-800">
                      {FEED_PROFILE_LABELS[feed] || feed}
                    </h2>
                    <span className="text-sm text-slate-500 font-semibold">{data.count === 0 ? 'General Fallback' : `${data.count} Plant${data.count !== 1 ? 's' : ''}`}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-emerald-50 rounded-lg px-3 py-1.5 border border-emerald-100 flex items-center gap-2">
                      <h3 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider shrink-0">What to Buy:</h3>
                      <p className="text-sm font-bold text-emerald-900">{guide.buy}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0">Why do I need this?</h3>
                        <p className="text-xs text-slate-700 leading-snug">{guide.why}</p>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0">For which plants?</h3>
                        <p className="text-xs text-slate-700 italic leading-snug">
                          {data.examples.join(', ')}{data.count > data.examples.length ? ', etc.' : ''}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0">What to look for (N-P-K)</h3>
                        <p className="text-xs text-slate-700 leading-snug font-mono">{guide.npk}</p>
                      </div>
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0">Pro Tips</h3>
                        <p className="text-xs text-slate-700 leading-snug">{guide.tips}</p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const GardenMakeupWidget: FC<GardenMakeupWidgetProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailView, setDetailView] = useState<{ type: 'category' | 'feed', id: string } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const { instances, archetypes, locations, zones, gardenProfile } = useGarden();

  const stats = useMemo(() => {
    const categories: Record<string, number> = {};
    const feeds: Record<string, { count: number, examples: string[] }> = {};
    let total = 0;

    instances.forEach(inst => {
      if (inst.untracked || inst.dateHarvested) return; // Only count actively monitored, living plants
      
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      if (!arch) return;
      
      total++;
      
      const cat = arch.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;

      const feed = arch.preferredNutrientProfile || 'GENERAL_FEED';
      if (!feeds[feed]) feeds[feed] = { count: 0, examples: [] };
      feeds[feed].count++;
      if (feeds[feed].examples.length < 3 && !feeds[feed].examples.includes(arch.commonName)) {
        feeds[feed].examples.push(arch.commonName);
      }
    });

    // Sort by highest count
    const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const sortedFeeds = Object.entries(feeds).sort((a, b) => b[1].count - a[1].count);

    return { total, sortedCategories, sortedFeeds };
  }, [instances, archetypes]);

  const detailData = useMemo(() => {
    if (!detailView) return null;
    
    const matchingInstances = instances.filter(inst => {
      if (inst.untracked || inst.dateHarvested) return false;
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      if (!arch) return false;
      if (detailView.type === 'category') return (arch.category || 'Uncategorized') === detailView.id;
      if (detailView.type === 'feed') return (arch.preferredNutrientProfile || 'GENERAL_FEED') === detailView.id;
      return false;
    });

    const locCounts: Record<string, number> = {};
    const plantList = matchingInstances.map(inst => {
      const arch = archetypes.find(a => a.id === inst.archetypeId);
      const loc = locations.find(l => l.id === inst.locationId);
      const zone = zones.find(z => z.id === loc?.zoneId);
      const zoneName = zone?.name || 'Unknown Zone';
      const locName = loc?.name || 'Unknown Location';
      const locString = `${zoneName} • ${locName}`;
      locCounts[locString] = (locCounts[locString] || 0) + 1;
      return { id: inst.qrId, name: arch?.commonName || 'Unknown Plant', zoneName, locName };
    });

    plantList.sort((a, b) => a.name.localeCompare(b.name));
    const topLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    return {
      title: detailView.type === 'category' ? detailView.id : (FEED_PROFILE_LABELS[detailView.id] || detailView.id),
      plants: plantList,
      topLocation
    };
  }, [detailView, instances, archetypes, locations, zones]);

  if (stats.total === 0) return null;

  const topFeed = stats.sortedFeeds[0]?.[0] || 'GENERAL_FEED';

  return (
    <>
      <section className="animate-in fade-in duration-500 mb-8 delay-200">
        <Subtitle className="flex items-center gap-2">
          <Icon name="pie-chart" size={20} className="text-primary-500 dark:text-primary-400" /> 
          Garden Analytics
        </Subtitle>
        <Card 
          onClick={() => setIsModalOpen(true)} 
          className="cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 flex flex-col items-center justify-center p-5 text-center active:scale-[0.98] transition-all"
        >
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Inventory Breakdown</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
            {stats.sortedCategories.map(([cat, count]) => (
              <span key={cat} className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${getCategoryColor(cat)}`}>
                {cat} {Math.round((count / stats.total) * 100)}%
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            <Icon name="feed" size={12} className={topFeed === 'BLOOM_BOOST' ? 'text-amber-500' : topFeed === 'VEG_GROW' ? 'text-emerald-500' : topFeed === 'LOW_FEED' ? 'text-orange-400' : topFeed === 'ACID_LOVERS' ? 'text-purple-500' : 'text-blue-500'} /> Primary Feed: {FEED_PROFILE_LABELS[topFeed] || topFeed}
          </div>
          <p className="text-[10px] text-primary-600/60 dark:text-primary-400/60 uppercase tracking-widest font-bold mt-4 bg-primary-100/50 dark:bg-primary-900/30 px-3 py-1 rounded-full">Tap for Breakdown & Shopping List</p>
        </Card>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface-900 dark:bg-surface-900 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => { setIsModalOpen(false); setDetailView(null); }}>
          <Card className="w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 !p-0" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-surface-100 dark:border-surface-700 shrink-0 rounded-t-2xl">
              <Subtitle className="!m-0 flex items-center gap-2">
                <Icon name="pie-chart" size={20} className="text-primary-500" />
                {detailView ? 'Detailed Breakdown' : 'Inventory Makeup'}
              </Subtitle>
              <button type="button" onClick={() => { setIsModalOpen(false); setDetailView(null); }} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <Icon name="x" size={20} />
              </button>
            </div>
            
            {detailView && detailData ? (
              <div className="overflow-y-auto p-5 animate-in slide-in-from-right-4 duration-300">
                <button onClick={() => setDetailView(null)} className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline mb-4 -ml-1">
                  <Icon name="back" size={16} /> Back to Overview
                </button>
                
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{detailData.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 w-fit px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/50">
                    <Icon name="map-pin" size={12} className="text-primary-500" /> Mostly in: <strong className="text-slate-600 dark:text-slate-300">{detailData.topLocation}</strong>
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  {detailData.plants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-surface-50 dark:bg-surface-800/30">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{p.name}</span>
                      <div className="flex flex-col items-end flex-shrink-0 max-w-[130px] sm:max-w-[160px] text-[9px] uppercase tracking-wider">
                        <span className="text-slate-500 flex items-center gap-1 truncate w-full justify-end">
                          <Icon name="map-pin" size={10}/> 
                          <span className="truncate">{p.zoneName}</span>
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 truncate w-full text-right mt-0.5">{p.locName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto p-5 space-y-8 animate-in slide-in-from-left-4 duration-300">
              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Icon name="leaf" size={14}/> Top Categories</h4>
                <div className="space-y-3">
                  {stats.sortedCategories.map(([cat, count]) => (
                      <button 
                        key={cat} 
                        onClick={() => setDetailView({ type: 'category', id: cat })}
                        className="w-full flex items-center justify-between text-sm group p-1 -mx-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{cat}</span>
                        <div className="flex items-center gap-3 w-1/2 justify-end">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getCategoryBarColor(cat)}`} style={{ width: `${(count / stats.total) * 100}%` }}></div>
                        </div>
                        <span className="text-slate-500 font-bold w-6 text-right">{count}</span>
                          <Icon name="chevron-right" size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                      </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Icon name="shopping-bag" size={14}/> Nutrition & Shopping Guide
                </h4>
                <div className="space-y-4">
                  {(() => {
                    const specializedFeeds = stats.sortedFeeds.filter((f: any) => f[0] !== 'GENERAL_FEED');
                    const generalFeed = stats.sortedFeeds.find((f: any) => f[0] === 'GENERAL_FEED') || ['GENERAL_FEED', { count: 0, examples: ['Any plant when you are unsure'] }];
                    const feedsToDisplay = [...specializedFeeds, generalFeed];
                    
                    return feedsToDisplay.map(([feed, data]) => {
                      const guide = SHOPPING_GUIDE[feed] || SHOPPING_GUIDE['GENERAL_FEED'];
                      return (
                        <div key={feed}>
                          {feed === 'GENERAL_FEED' && specializedFeeds.length > 0 && (
                            <div className="flex items-center gap-3 my-4 opacity-50">
                              <div className="h-px bg-slate-400 flex-1"></div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">OR</span>
                              <div className="h-px bg-slate-400 flex-1"></div>
                            </div>
                          )}
                          <div className={`p-4 rounded-xl border ${feed === 'GENERAL_FEED' ? 'bg-surface-100 dark:bg-surface-800/70 border-surface-300 dark:border-surface-600 border-dashed' : 'bg-surface-50 dark:bg-surface-800/50 border-surface-200 dark:border-surface-700/50'} ${data.count === 0 ? 'opacity-80' : ''}`}>
                            <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                              <Icon name="feed" size={14} className={feed === 'BLOOM_BOOST' ? 'text-amber-500' : feed === 'VEG_GROW' ? 'text-emerald-500' : feed === 'LOW_FEED' ? 'text-orange-400' : feed === 'ACID_LOVERS' ? 'text-purple-500' : 'text-blue-500'} />
                              {FEED_PROFILE_LABELS[feed] || feed}
                            </span>
                            {data.count === 0 ? (
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                Fallback Option
                              </span>
                            ) : (
                              <button onClick={() => setDetailView({ type: 'feed', id: feed })} className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 flex items-center gap-1 transition-colors ${getFeedBadgeColor(feed)}`}>
                                {data.count} Plant{data.count !== 1 ? 's' : ''} <Icon name="chevron-right" size={10} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 italic">
                            e.g., {data.examples.join(', ')}{data.count > data.examples.length ? ', etc.' : ''}
                          </p>
                          <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-sm text-slate-800 dark:text-slate-100 font-semibold mb-1">🛒 Buy: {guide.buy}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2">{guide.why}</p>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                <strong className="text-slate-700 dark:text-slate-300">N-P-K Ratio:</strong> <span className="font-mono">{guide.npk}</span>
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                                <strong className="text-slate-700 dark:text-slate-300">Tips:</strong> {guide.tips}
                              </p>
                            </div>
                          </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
            )}

            <div className="p-4 flex gap-3 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 shrink-0 rounded-b-2xl">
              <Button onClick={() => setIsPrinting(true)} $variant="secondary" className="flex-1 py-3 flex items-center justify-center gap-2">
                <Icon name="print" size={18} /> Print List
              </Button>
              <Button onClick={() => { setIsModalOpen(false); setDetailView(null); }} className="flex-1 py-3">Close</Button>
            </div>
          </Card>
        </div>
      )}
      {isPrinting && (
        <PrintShoppingList 
          stats={stats} 
          gardenName={gardenProfile?.name || 'My Garden'} 
          onClose={() => setIsPrinting(false)} 
        />
      )}
    </>
  );
};