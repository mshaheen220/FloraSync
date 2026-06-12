import { FC, useState, FormEvent, useRef, ReactNode } from 'react';
import { Card, Button, Input, Toast } from '../../../styles/StyledElements';
import { AddonManifest, User } from '../../../../types';
import { Icon } from '../../common/Icon';
import JSZip from 'jszip';

// Local registry for the MVP. Later, this could be fetched from the server.
const AVAILABLE_ADDONS: AddonManifest[] = [
  {
    id: "widget-weather",
    name: "Weather Widget",
    version: "1.5.0",
    description: "Provides hyper-local, garden-specific weather insights, alerts, and soil metrics using data from Open-Meteo.",
    author: "Michael Shaheen",
    entryPoints: ["dashboard"],
    requiresInternet: true,
    executeScript: "execute.js",
    settingsSchema: [
      { key: "latitude", label: "Latitude", type: "number", defaultValue: 40.689156 },
      { key: "longitude", label: "Longitude", type: "number", defaultValue: -80.041077 }
    ]
  }
];

interface AddonManagerProps {
  currentUser: User | null;
  token?: string | null;
}

export const AddonManager: FC<AddonManagerProps> = ({
  currentUser,
  token
}) => {
  const [toastMessage, setToastMessage] = useState<ReactNode>('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [settingsModalAddon, setSettingsModalAddon] = useState<AddonManifest | null>(null);
  const [settingsFormData, setSettingsFormData] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customAddons, setCustomAddons] = useState<AddonManifest[]>(() => {
    const saved = localStorage.getItem('florasync_custom_addons');
    return saved ? JSON.parse(saved) : [];
  });

  const showToast = (msg: ReactNode) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const installedAddons = currentUser?.installedAddons || [];
  const activeAddons = currentUser?.activeAddons || [];
  const addonSettings = currentUser?.addonSettings || {};

  const isSystemAdmin = currentUser?.role === 'god-admin';
  const isOwner = currentUser?.workspaceRole === 'owner';
  const canManageAddons = isSystemAdmin || isOwner;

  const apiCall = async (endpoint: string, payload: any) => {
    const res = await fetch(`${apiBase}/api/addons/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  };

  const handleInstall = async (addon: AddonManifest) => {
    setLoadingId(addon.id);
    try {
      const data = await apiCall('install', { manifest: addon });
      if (currentUser) currentUser.installedAddons = data.installedAddons;
      showToast(<span className="flex items-center gap-2"><Icon name="package" size={16} /> Installed {addon.name}</span>);
    } catch (err: any) {
      showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Error: {err.message}</span>);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUninstall = async (addon: AddonManifest) => {
    if (!window.confirm(`Uninstall ${addon.name}? This will permanently remove its features and run cleanup scripts.`)) return;
    setLoadingId(addon.id);
    try {
      const data = await apiCall('uninstall', { manifest: addon });
      if (currentUser) {
        currentUser.installedAddons = data.installedAddons;
        currentUser.activeAddons = data.activeAddons;
      }
      showToast(<span className="flex items-center gap-2"><Icon name="delete" size={16} /> Uninstalled {addon.name}</span>);
    } catch (err: any) {
      showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Error: {err.message}</span>);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleActive = async (addon: AddonManifest, makeActive: boolean) => {
    setLoadingId(addon.id);
    try {
      const endpoint = makeActive ? 'activate' : 'deactivate';
      const data = await apiCall(endpoint, { addonId: addon.id });
      if (currentUser) {
        currentUser.activeAddons = data.activeAddons;
        if (makeActive) {
          currentUser.activeAddonManifests = [...(currentUser.activeAddonManifests || []).filter(m => m.id !== addon.id), addon];
        } else {
          currentUser.activeAddonManifests = (currentUser.activeAddonManifests || []).filter(m => m.id !== addon.id);
        }
      }
      showToast(<span className="flex items-center gap-2"><Icon name={makeActive ? "check" : "x"} size={16} /> {makeActive ? 'Activated' : 'Deactivated'} {addon.name}</span>);
    } catch (err: any) {
      showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Error: {err.message}</span>);
    } finally {
      setLoadingId(null);
    }
  };

  const openSettings = (addon: AddonManifest) => {
    const existingConfig = addonSettings[addon.id] || {};
    const defaults: Record<string, any> = {};
    addon.settingsSchema?.forEach(f => defaults[f.key] = existingConfig[f.key] ?? f.defaultValue);
    setSettingsFormData(defaults);
    setSettingsModalAddon(addon);
  };

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settingsModalAddon) return;
    
    try {
      const data = await apiCall('settings', { addonId: settingsModalAddon.id, settings: settingsFormData });
      if (currentUser) currentUser.addonSettings = data.addonSettings;
      showToast(<span className="flex items-center gap-2"><Icon name="check" size={16} /> Settings saved!</span>);
      setSettingsModalAddon(null);
    } catch (err: any) {
      showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Error: {err.message}</span>);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingId('upload');

    // Pre-validate the ZIP to ensure it doesn't overwrite an official system package
    try {
      const zip = await JSZip.loadAsync(file);
      const manifestFile = Object.values(zip.files).find(f => !f.dir && f.name.endsWith('manifest.json') && !f.name.includes('__MACOSX'));
      if (manifestFile) {
        const manifestText = await manifestFile.async('text');
        const manifest = JSON.parse(manifestText);
        if (AVAILABLE_ADDONS.some(a => a.id === manifest.id)) {
          showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Cannot replace official system packages.</span>);
          setLoadingId(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }
    } catch (err) {
      console.warn("Could not pre-validate zip", err);
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const data = await apiCall('install', { zipData: base64Data });
        
        if (currentUser) currentUser.installedAddons = data.installedAddons;
        
        // Automatically register the newly uploaded manifest in the UI
        if (data.manifest) {
          const updated = [...customAddons.filter(a => a.id !== data.manifest.id), data.manifest];
          setCustomAddons(updated);
          localStorage.setItem('florasync_custom_addons', JSON.stringify(updated));
          
          // Safety feature: If they upload an update to an already active plugin, 
          // explicitly deactivate it so the user must deliberately approve and activate the new code.
          if (currentUser && currentUser.activeAddons?.includes(data.manifest.id)) {
            try {
              const deactData = await apiCall('deactivate', { addonId: data.manifest.id });
              currentUser.activeAddons = deactData.activeAddons;
              currentUser.activeAddonManifests = (currentUser.activeAddonManifests || []).filter(m => m.id !== data.manifest.id);
            } catch (e) {
              console.error('Failed to deactivate updated plugin', e);
            }
          }
        }
        
        showToast(<span className="flex items-center gap-2"><Icon name="check" size={16} /> Plugin package installed. Ready to activate!</span>);
      } catch (err: any) {
        showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Package Error: {err.message}</span>);
      } finally {
        setLoadingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast(<span className="flex items-center gap-2"><Icon name="alert-circle" size={16} /> Failed to read the ZIP file.</span>);
      setLoadingId(null);
    };
    reader.readAsDataURL(file);
  };

  const removeCustomAddon = (id: string) => {
    const updated = customAddons.filter(a => a.id !== id);
    setCustomAddons(updated);
    localStorage.setItem('florasync_custom_addons', JSON.stringify(updated));
  };

  // Deduplicate addons by ID. 
  // Official addons come second, ensuring they can never be replaced by custom uploads in the UI.
  const ALL_ADDONS = Object.values(
    [...customAddons, ...AVAILABLE_ADDONS].reduce((acc, addon) => {
      acc[addon.id] = addon;
      return acc;
    }, {} as Record<string, AddonManifest>)
  );

  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Extend your garden with optional modules. Installing an add-on may unlock new UI features and data tracking.
          </p>
        {isSystemAdmin && (
          <>
            <Button onClick={() => fileInputRef.current?.click()} disabled={loadingId === 'upload'} $variant="secondary" className="whitespace-nowrap text-xs py-1.5 px-3 flex items-center gap-2">
              {loadingId === 'upload' ? 'Validating...' : <><Icon name="package" size={14} /> Upload Package (.zip)</>}
            </Button>
            <input type="file" accept=".zip,application/zip" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          </>
        )}
        </div>

      <div className="space-y-4">
        {ALL_ADDONS.filter(addon => isSystemAdmin || installedAddons.includes(addon.id)).map(addon => {
          const isInstalled = installedAddons.includes(addon.id);
          const isActive = activeAddons.includes(addon.id);
          const isLoading = loadingId === addon.id;
          const isCustom = customAddons.some(c => c.id === addon.id);

          return (
            <Card key={addon.id} className={`flex flex-col gap-3 transition-colors shadow-none border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-900/40 ${isCustom ? 'border-dashed' : ''}`}>
              <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-2">
                  {addon.name}
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono shrink-0 whitespace-nowrap">
                    v{addon.version}
                  </span>
              {isActive && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 whitespace-nowrap flex items-center gap-1"><Icon name="power" size={12} /> Active</span>}
              {addon.requiresInternet && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 whitespace-nowrap flex items-center gap-1" title="This plugin makes requests to external servers">
                  <Icon name="globe" size={12} /> External Network
                </span>
              )}
                  {isCustom ? (
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <Icon name="package" size={12} /> Custom
                    </span>
                  ) : (
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <Icon name="shield" size={12} /> Official
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{addon.description}</p>
                {addon.author && <p className="text-[10px] text-slate-400 mt-1">By {addon.author}</p>}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {!isInstalled ? (
                  isSystemAdmin && (
                    <Button onClick={() => handleInstall(addon)} disabled={isLoading} className="!text-[10px] !py-1 !px-2 !h-auto !min-h-0 w-max">
                      {isLoading ? '...' : 'Install'}
                    </Button>
                  )
                ) : canManageAddons ? (
                  <div className="flex gap-2">
                      <Button 
                        $variant={isActive ? 'secondary' : 'primary'} 
                        onClick={() => handleToggleActive(addon, !isActive)} 
                        disabled={isLoading}
                        className="!text-[10px] !py-1 !px-2 !h-auto !min-h-0 w-max"
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      {isActive && addon.settingsSchema && (
                        <Button $variant="secondary" onClick={() => openSettings(addon)} className="!text-[10px] !py-1 !px-2 !h-auto !min-h-0 w-max flex items-center gap-1">
                          <Icon name="settings" size={12} /> Settings
                        </Button>
                      )}
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 italic flex items-center gap-1">
                    <Icon name="lock" size={10} /> Owners & Admins only
                  </span>
                  )}
                </div>
                {!isInstalled ? (
                isCustom && isSystemAdmin && (
                    <button onClick={() => removeCustomAddon(addon.id)} disabled={isLoading} className="text-[10px] font-bold text-slate-400 hover:text-red-500">
                      Discard
                    </button>
                  )
                ) : (
                isSystemAdmin && (
                  <button 
                    onClick={() => handleUninstall(addon)} 
                    disabled={isLoading}
                    className="text-[10px] font-bold text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                )
                )}
              </div>
            </Card>
          );
        })}
      </div>
      </div>

      {settingsModalAddon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg mb-4">{settingsModalAddon.name} Settings</h3>
            <form onSubmit={saveSettings} className="flex flex-col gap-4">
              {settingsModalAddon.settingsSchema?.map(field => (
                <div key={field.key}>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200">
                      <input 
                        type="checkbox" 
                        checked={settingsFormData[field.key] || false} 
                        onChange={e => setSettingsFormData({...settingsFormData, [field.key]: e.target.checked})}
                        className="accent-emerald-600 w-4 h-4 cursor-pointer"
                      />
                      {field.label}
                    </label>
                  ) : field.type === 'select' ? (
                    <>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{field.label}</label>
                      <select 
                        value={settingsFormData[field.key]} 
                        onChange={e => setSettingsFormData({...settingsFormData, [field.key]: e.target.value})}
                        className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      >
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{field.label}</label>
                      <Input 
                        type={field.type === 'number' ? 'number' : 'text'} 
                        value={settingsFormData[field.key] || ''} 
                        onChange={e => setSettingsFormData({...settingsFormData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value})}
                        className="!mb-0 py-2 text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Button type="button" $variant="secondary" onClick={() => setSettingsModalAddon(null)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Card>
  );
};