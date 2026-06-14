import { useMemo, FC, useState, useEffect, Suspense, useRef } from 'react';
import { Container, Card, Toast, Button } from '../../styles/StyledElements';
import { Icon } from '../common/Icon';
import { GardenPulse } from './dashboard/GardenPulse';
import { HealthWatchlist } from './dashboard/HealthWatchlist';
import { RandomSpotlight } from './dashboard/RandomSpotlight';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { QuickActions } from './dashboard/QuickActions';
import { GardenVitality } from './dashboard/GardenVitality';
import { ApproachingHarvest } from './dashboard/ApproachingHarvest';
import { Nursery } from './dashboard/Nursery';
import { UrgentLocationCare } from './dashboard/UrgentLocationCare';
import { NeedsWatering } from './dashboard/NeedsWatering';
import { HungryPlants } from './dashboard/HungryPlants';
import { useGarden } from '../../contexts/GardenContext';
import { User } from '../../../types';

const widgetModules = import.meta.glob('../../../addons/*/execute.js');

const DashboardAddonWidget: FC<{ manifest: any; currentUser: User }> = ({ manifest, currentUser }) => {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const loadWidget = async () => {
      const path = `../../../addons/${manifest.id}/execute.js`;
      if (widgetModules[path]) {
        try {
          const module = (await widgetModules[path]()) as any;
          if (isMounted && module.components?.dashboard) {
            setComponent(() => module.components.dashboard);
          }
        } catch (e) {
          console.error(`Failed to load widget for addon: ${manifest.id}`, e);
        }
      }
    };
    loadWidget();
    return () => { isMounted = false; };
  }, [manifest.id]);

  if (!Component) return <Card className="animate-pulse flex items-center justify-center p-6 text-sm font-bold text-slate-400">Loading Widget...</Card>;

  const defaultSettings = manifest.settingsSchema?.reduce((acc: any, field: any) => {
    acc[field.key] = field.defaultValue;
    return acc;
  }, {} as Record<string, any>) || {};

  const settings = { ...defaultSettings, ...(currentUser.addonSettings?.[manifest.id] || {}) };

  return (
    <div className="mb-4">
      <Suspense fallback={<Card className="animate-pulse flex items-center justify-center p-6 text-sm font-bold text-slate-400">Loading Widget...</Card>}>
        <Component settings={settings} />
      </Suspense>
    </div>
  );
};

interface DashboardProps {
  onNavigate: (qrId: string) => void;
  onOpenMenu: () => void;
  onNavigateInventory: () => void;
  onNavigateZone: (zoneId: string) => void;
  onNavigateLocation: (locId: string) => void;
  onOpenWorkspaceMenu?: () => void;
}

export const Dashboard: FC<DashboardProps> = ({ onNavigate, onOpenMenu, onNavigateInventory, onNavigateZone, onNavigateLocation, onOpenWorkspaceMenu }) => {
  const { gardenProfile, instances, archetypes, locations, zones, onBatchWaterLocation, onBatchWaterAll, onBatchFeedAll, onLogRain, onBatchWaterZone, onBatchFeedZone, onBatchFeedLocation, onWater, onFeed, currentUser } = useGarden();

  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter out any plants that have already completed their lifecycle
  const activeInstances = useMemo(() => instances.filter(i => !i.dateHarvested), [instances]);

  const trackedInstances = useMemo(() => activeInstances.filter(i => !i.untracked), [activeInstances]);

  // Persist dashboard layout preferences per user
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => {
    if (!currentUser?.id) return [];
    const saved = localStorage.getItem(`florasync_hidden_widgets_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  const [isRainModalOpen, setIsRainModalOpen] = useState(false);
  const [rainType, setRainType] = useState('Heavy Rain');
  const [rainDurationHours, setRainDurationHours] = useState('');
  const [rainDurationMinutes, setRainDurationMinutes] = useState('');

  const handleConfirmRain = async () => {
    setIsRainModalOpen(false);
    showToast('🌧️ Logging natural rain...');
    if (onLogRain) {
      let durationStr = '';
      const h = parseInt(rainDurationHours) || 0;
      const m = parseInt(rainDurationMinutes) || 0;
      const totalMinutes = (h * 60) + m;
      
      if (h > 0 && m > 0) {
        durationStr = `${h} hr${h !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}`;
      } else if (h > 0) {
        durationStr = `${h} hr${h !== 1 ? 's' : ''}`;
      } else if (m > 0) {
        durationStr = `${m} min${m !== 1 ? 's' : ''}`;
      }

      // @ts-ignore - Safely pass the new arguments to the context hook
      const count = await onLogRain(rainType, durationStr, totalMinutes);
      if (count !== undefined && count > 0) {
        showToast(`🌧️ Logged natural rain for ${count} outdoor plants!`);
      } else if (count === 0) {
        showToast(`🌧️ No outdoor tracked plants were found, or all your plants are in covered zones!`);
      }
    }
    setRainDurationHours('');
    setRainDurationMinutes('');
    setRainType('Heavy Rain');
  };

  useEffect(() => {
    if (currentUser?.id) {
      const saved = localStorage.getItem(`florasync_hidden_widgets_${currentUser.id}`);
      if (saved) setHiddenWidgets(JSON.parse(saved));
    }
  }, [currentUser?.id]);

  const toggleWidget = (id: string) => {
    const updated = hiddenWidgets.includes(id) 
      ? hiddenWidgets.filter(w => w !== id) 
      : [...hiddenWidgets, id];
    setHiddenWidgets(updated);
    if (currentUser?.id) {
      localStorage.setItem(`florasync_hidden_widgets_${currentUser.id}`, JSON.stringify(updated));
    }
  };

  const defaultWidgets = useMemo(() => {
    const addons = (currentUser?.activeAddonManifests || [])
      .filter(m => m.entryPoints?.includes('dashboard'))
      .map(m => ({ id: `addon_${m.id}`, label: m.name }));
      
    return [
      ...addons,
      { id: 'spotlight', label: 'Random Spotlight' },
      { id: 'harvest', label: 'Approaching Harvest' },
      { id: 'nursery', label: 'The Nursery' },
      { id: 'health', label: 'Health Watchlist' },
      { id: 'urgent', label: 'Urgent Location Care' },
      { id: 'water', label: 'Needs Watering' },
      { id: 'feed', label: 'Hungry Plants' },
      { id: 'pulse', label: 'Garden Pulse' }
    ];
  }, [currentUser?.activeAddonManifests]);

  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    if (!currentUser?.id) return [];
    const saved = localStorage.getItem(`florasync_widget_order_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    setWidgetOrder(prevOrder => {
      const currentIds = defaultWidgets.map(w => w.id);
      let newOrder = [...prevOrder];
      currentIds.forEach(id => {
        if (!newOrder.includes(id)) newOrder.push(id);
      });
      newOrder = newOrder.filter(id => currentIds.includes(id));
      if (JSON.stringify(newOrder) !== JSON.stringify(prevOrder)) {
        if (currentUser?.id) localStorage.setItem(`florasync_widget_order_${currentUser.id}`, JSON.stringify(newOrder));
        return newOrder;
      }
      return prevOrder;
    });
  }, [defaultWidgets, currentUser?.id]);

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;
    const draggedIndex = widgetOrder.indexOf(draggedId);
    const targetIndex = widgetOrder.indexOf(id);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...widgetOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);
      setWidgetOrder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    if (currentUser?.id) localStorage.setItem(`florasync_widget_order_${currentUser.id}`, JSON.stringify(widgetOrder));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...widgetOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setWidgetOrder(newOrder);
    if (currentUser?.id) localStorage.setItem(`florasync_widget_order_${currentUser.id}`, JSON.stringify(newOrder));
  };

  // Attention Queue sorting engine logic calculating actual time distance against care intervals
  const attentionQueue = useMemo(() => {
    const today = new Date().getTime();
    return trackedInstances.map(instance => {
      const archetype = archetypes.find(a => a.id === instance.archetypeId);
      const location = locations.find(l => l.id === instance.locationId);
      const zone = zones.find(z => z.id === location?.zoneId);
      const lastWateredTime = new Date(instance.lastWatered).getTime();
      
      const zoneModifier = zone?.evaporationModifier || 1.0;
      const sunReq = archetype?.sunRequirement?.toLowerCase() || '';
      const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);
      
      const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
      const timeElapsed = today - lastWateredTime;
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      
      return {
        ...instance,
        archetype,
        location,
        zone,
        isOverdue: ratio <= 0,
        ratio
      };
    }).sort((a, b) => a.ratio - b.ratio);
  }, [trackedInstances, archetypes, locations, zones]);

  const overdueLocations = useMemo(() => {
    const locIds = new Set(attentionQueue.filter(item => item.isOverdue).map(item => item.locationId));
    return locations.filter(l => locIds.has(l.id));
  }, [attentionQueue, locations]);

  const overduePlants = useMemo(() => attentionQueue.filter(p => p.isOverdue), [attentionQueue]);

  const averageHydration = useMemo(() => {
    if (attentionQueue.length === 0) return 100;
    const total = attentionQueue.reduce((acc, curr) => acc + curr.ratio, 0);
    return Math.round((total / attentionQueue.length) * 100);
  }, [attentionQueue]);

  const averageNutrition = useMemo(() => {
    if (trackedInstances.length === 0) return 100;
    const today = new Date().getTime();
    const total = trackedInstances.reduce((acc, inst) => {
      const archetype = archetypes.find(a => a.id === inst.archetypeId);
      const intervalMs = (archetype?.feedingIntervalDays || 14) * 24 * 60 * 60 * 1000;
      const timeElapsed = today - new Date(inst.lastFed).getTime();
      const ratio = Math.max(0, 1 - (timeElapsed / intervalMs));
      return acc + ratio;
    }, 0);
    return Math.round((total / trackedInstances.length) * 100);
  }, [trackedInstances, archetypes]);

  const mostPopulatedZone = useMemo(() => {
    if (activeInstances.length === 0 || zones.length === 0) return { name: 'None', id: null };
    const zoneCounts = activeInstances.reduce((acc, inst) => {
      const loc = locations.find(l => l.id === inst.locationId);
      if (loc?.zoneId) {
        acc[loc.zoneId] = (acc[loc.zoneId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    let maxZoneId = '';
    let maxCount = -1;
    for (const [zId, count] of Object.entries(zoneCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxZoneId = zId;
      }
    }
    const zone = zones.find(z => z.id === maxZoneId);
    return zone ? { name: zone.name, id: zone.id } : { name: 'None', id: null };
  }, [activeInstances, locations, zones]);

  return (
    <Container>
      <DashboardHeader 
        gardenProfile={gardenProfile} 
        onOpenMenu={onOpenMenu} 
        onOpenWorkspaceMenu={onOpenWorkspaceMenu} 
      />

      <QuickActions 
        zones={zones} 
        locations={locations}
        instances={instances}
        archetypes={archetypes}
        currentUser={currentUser!} 
        onBatchWaterAll={onBatchWaterAll} 
        onBatchFeedAll={onBatchFeedAll} 
        onLogRain={onLogRain ? () => setIsRainModalOpen(true) : undefined}
        onBatchWaterZone={onBatchWaterZone} 
        onBatchFeedZone={onBatchFeedZone}
        onBatchWaterLocation={onBatchWaterLocation} 
        onBatchFeedLocation={onBatchFeedLocation}
        onWater={onWater}
        onFeed={onFeed}
        onNavigateZone={onNavigateZone}
        onNavigateLocation={onNavigateLocation}
        onNavigate={onNavigate}
      />

      <GardenVitality 
        averageHydration={averageHydration} 
        averageNutrition={averageNutrition} 
        trackedCount={trackedInstances.length} 
        activeCount={activeInstances.length} 
        mostPopulatedZone={mostPopulatedZone} 
        onNavigateInventory={onNavigateInventory} 
        onNavigateZone={onNavigateZone} 
        showTopZone={false}
      />

      {widgetOrder.map(id => {
        if (hiddenWidgets.includes(id)) return null;

        if (id.startsWith('addon_')) {
          const manifestId = id.replace('addon_', '');
          const manifest = currentUser?.activeAddonManifests?.find(m => m.id === manifestId);
          if (!manifest) return null;
          return <DashboardAddonWidget key={id} manifest={manifest} currentUser={currentUser!} />;
        }

        switch (id) {
          case 'spotlight': return <RandomSpotlight key={id} activeInstances={activeInstances} archetypes={archetypes} onNavigate={onNavigate} />;
          case 'harvest': return <ApproachingHarvest key={id} activeInstances={activeInstances} archetypes={archetypes} onNavigate={onNavigate} />;
          case 'nursery': return <Nursery key={id} activeInstances={activeInstances} archetypes={archetypes} onNavigate={onNavigate} />;
          case 'health': return <HealthWatchlist key={id} instances={instances} archetypes={archetypes} locations={locations} zones={zones} onNavigate={onNavigate} />;
          case 'urgent': return <UrgentLocationCare key={id} overdueLocations={overdueLocations} zones={zones} currentUser={currentUser!} onBatchWater={onBatchWaterLocation} />;
          case 'water': return <NeedsWatering key={id} overduePlants={overduePlants} onNavigate={onNavigate} />;
          case 'feed': return <HungryPlants key={id} trackedInstances={trackedInstances} archetypes={archetypes} locations={locations} zones={zones} onNavigate={onNavigate} />;
          case 'pulse': return <GardenPulse key={id} instances={instances} archetypes={archetypes} locations={locations} zones={zones} onNavigate={onNavigate} onNavigateZone={onNavigateZone} onNavigateLocation={onNavigateLocation} />;
          default: return null;
        }
      })}

      {/* Customization Panel */}
      <div className="mt-8 mb-4 border-t border-surface-200 dark:border-surface-800 pt-4">
        <button 
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-wider py-2"
        >
          <Icon name="settings" size={14} /> 
          {isCustomizing ? 'Done Customizing' : 'Customize Dashboard'}
        </button>
        
        {isCustomizing && (
          <Card className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3">Visible Sections</h3>
            <div className="flex flex-col gap-2">
              {widgetOrder.map((id, index) => {
                const widget = defaultWidgets.find(w => w.id === id);
                if (!widget) return null;
                return (
                  <div 
                    key={id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, id)}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${draggedId === id ? 'opacity-50 border-primary-500 border-dashed bg-primary-50/50 dark:bg-primary-900/10' : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50'} transition-all`}
                  >
                    <div className="cursor-grab active:cursor-grabbing text-slate-400 touch-none flex items-center justify-center p-1 -ml-1">
                      <Icon name="grip-vertical" size={18} />
                    </div>
                    <label className="flex flex-1 items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!hiddenWidgets.includes(id)} 
                        onChange={() => toggleWidget(id)}
                        className="accent-emerald-600 w-5 h-5 cursor-pointer rounded"
                      />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{widget.label}</span>
                    </label>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-primary-500 disabled:opacity-20 disabled:hover:text-slate-400 p-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-surface-200 dark:border-surface-700 transition-colors">
                        <Icon name="chevron-up" size={14} />
                      </button>
                      <button onClick={() => handleMove(index, 'down')} disabled={index === widgetOrder.length - 1} className="text-slate-400 hover:text-primary-500 disabled:opacity-20 disabled:hover:text-slate-400 p-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-surface-200 dark:border-surface-700 transition-colors">
                        <Icon name="chevron-down" size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {isRainModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setIsRainModalOpen(false)}
        >
          <div 
            className="bg-surface-50 dark:bg-surface-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-surface-200 dark:border-surface-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-blue-500 dark:text-blue-400">
              <Icon name="cloud-rain" size={28} />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Log Rain</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rain Type</label>
              <select 
                value={rainType} 
                onChange={e => setRainType(e.target.value)} 
                className="w-full border-2 border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-surface-50 dark:bg-surface-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm font-medium"
              >
                <option value="Light Sprinkle">Light Sprinkle</option>
                <option value="Steady Rain">Steady Rain</option>
                <option value="Heavy Rain">Heavy Rain / Downpour</option>
                <option value="Thunderstorm">Thunderstorm</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration (Optional)</label>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface-50 dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl px-3 focus-within:border-primary-500 transition-all">
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0" 
                    value={rainDurationHours} 
                    onChange={e => setRainDurationHours(e.target.value)} 
                    className="w-full bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-100 py-3 text-center"
                  />
                  <span className="text-sm font-bold text-slate-400">hrs</span>
                </div>
                <div className="flex-1 flex items-center gap-2 bg-surface-50 dark:bg-surface-800 border-2 border-surface-200 dark:border-surface-700 rounded-xl px-3 focus-within:border-primary-500 transition-all">
                  <input 
                    type="number" 
                    min="0"
                    max="59"
                    placeholder="0" 
                    value={rainDurationMinutes} 
                    onChange={e => setRainDurationMinutes(e.target.value)} 
                    className="w-full bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-100 py-3 text-center"
                  />
                  <span className="text-sm font-bold text-slate-400">mins</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setIsRainModalOpen(false)} $variant="secondary" className="flex-1 !bg-surface-200 dark:!bg-surface-800 !text-slate-700 dark:!text-slate-300">Cancel</Button>
              <Button onClick={handleConfirmRain} className="flex-1 flex items-center justify-center gap-2">
                <Icon name="check" size={18} /> Log It
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};