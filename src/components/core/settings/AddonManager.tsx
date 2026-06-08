import { FC, useState, FormEvent, useRef } from 'react';
import { Card, Button, Input, Toast } from '../../../styles/StyledElements';
import { AddonManifest, GardenProfile } from '../../../../types';

// Local registry for the MVP. Later, this could be fetched from the server.
const AVAILABLE_ADDONS: AddonManifest[] = [
];

interface AddonManagerProps {
  gardenProfile: GardenProfile | null;
  token?: string | null;
}

export const AddonManager: FC<AddonManagerProps> = ({
  gardenProfile,
  token
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [settingsModalAddon, setSettingsModalAddon] = useState<AddonManifest | null>(null);
  const [settingsFormData, setSettingsFormData] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customAddons, setCustomAddons] = useState<AddonManifest[]>(() => {
    const saved = localStorage.getItem('florasync_custom_addons');
    return saved ? JSON.parse(saved) : [];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const installedAddons = gardenProfile?.installedAddons || [];
  const activeAddons = gardenProfile?.activeAddons || [];
  const addonSettings = gardenProfile?.addonSettings || {};

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
      if (gardenProfile) gardenProfile.installedAddons = data.installedAddons;
      showToast(`📦 Installed ${addon.name}`);
    } catch (err: any) {
      showToast(`⚠️ Error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleUninstall = async (addon: AddonManifest) => {
    if (!window.confirm(`Uninstall ${addon.name}? This will permanently remove its features and run cleanup scripts.`)) return;
    setLoadingId(addon.id);
    try {
      const data = await apiCall('uninstall', { manifest: addon });
      if (gardenProfile) {
        gardenProfile.installedAddons = data.installedAddons;
        gardenProfile.activeAddons = data.activeAddons;
      }
      showToast(`🗑️ Uninstalled ${addon.name}`);
    } catch (err: any) {
      showToast(`⚠️ Error: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleActive = async (addon: AddonManifest, makeActive: boolean) => {
    setLoadingId(addon.id);
    try {
      const endpoint = makeActive ? 'activate' : 'deactivate';
      const data = await apiCall(endpoint, { addonId: addon.id });
      if (gardenProfile) {
        gardenProfile.activeAddons = data.activeAddons;
        if (makeActive) {
          gardenProfile.activeAddonManifests = [...(gardenProfile.activeAddonManifests || []).filter(m => m.id !== addon.id), addon];
        } else {
          gardenProfile.activeAddonManifests = (gardenProfile.activeAddonManifests || []).filter(m => m.id !== addon.id);
        }
      }
      showToast(makeActive ? `🟢 Activated ${addon.name}` : `🔴 Deactivated ${addon.name}`);
    } catch (err: any) {
      showToast(`⚠️ Error: ${err.message}`);
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
      if (gardenProfile) gardenProfile.addonSettings = data.addonSettings;
      showToast('✅ Settings saved!');
      setSettingsModalAddon(null);
    } catch (err: any) {
      showToast(`⚠️ Error: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingId('upload');
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        const data = await apiCall('install', { zipData: base64Data });
        
        if (gardenProfile) gardenProfile.installedAddons = data.installedAddons;
        
        // Automatically register the newly uploaded manifest in the UI
        if (data.manifest) {
          const updated = [...customAddons.filter(a => a.id !== data.manifest.id), data.manifest];
          setCustomAddons(updated);
          localStorage.setItem('florasync_custom_addons', JSON.stringify(updated));
          
          // Automatically hot-swap the new manifest into the active state if it's currently running
          if (gardenProfile && gardenProfile.activeAddons?.includes(data.manifest.id)) {
            gardenProfile.activeAddonManifests = [...(gardenProfile.activeAddonManifests || []).filter(m => m.id !== data.manifest.id), data.manifest];
          }
        }
        
        showToast(`✅ Plugin package installed successfully!`);
      } catch (err: any) {
        showToast(`❌ Package Error: ${err.message}`);
      } finally {
        setLoadingId(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast('❌ Failed to read the ZIP file.');
      setLoadingId(null);
    };
    reader.readAsDataURL(file);
  };

  const removeCustomAddon = (id: string) => {
    const updated = customAddons.filter(a => a.id !== id);
    setCustomAddons(updated);
    localStorage.setItem('florasync_custom_addons', JSON.stringify(updated));
  };

  const ALL_ADDONS = [...AVAILABLE_ADDONS, ...customAddons];

  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Extend your garden with optional modules. Installing an add-on may unlock new UI features and data tracking.
          </p>
          <Button onClick={() => fileInputRef.current?.click()} disabled={loadingId === 'upload'} $variant="secondary" className="whitespace-nowrap text-xs py-1.5 px-3">
            {loadingId === 'upload' ? 'Validating...' : '📦 Upload Package (.zip)'}
          </Button>
          <input type="file" accept=".zip,application/zip" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        </div>

      <div className="space-y-4">
        {ALL_ADDONS.map(addon => {
          const isInstalled = installedAddons.includes(addon.id);
          const isActive = activeAddons.includes(addon.id);
          const isLoading = loadingId === addon.id;
          const isCustom = customAddons.some(c => c.id === addon.id);

          return (
            <Card key={addon.id} className={`flex flex-col gap-3 transition-colors ${isActive ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10' : ''} ${isCustom ? 'border-dashed' : ''}`}>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {addon.name}
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                    v{addon.version}
                  </span>
                  {isActive && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>}
                  {isCustom && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Custom Package</span>}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{addon.description}</p>
                {addon.author && <p className="text-[10px] text-slate-400 mt-1">By {addon.author}</p>}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-1">
                {!isInstalled ? (
                  <>
                    <Button onClick={() => handleInstall(addon)} disabled={isLoading} className="text-xs py-1.5 px-3">
                      {isLoading ? '...' : 'Install'}
                    </Button>
                    {isCustom && (
                      <button onClick={() => removeCustomAddon(addon.id)} disabled={isLoading} className="text-xs font-bold text-slate-400 hover:text-red-500 px-2 ml-auto">
                        Discard Package
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <Button 
                      $variant={isActive ? 'secondary' : 'primary'} 
                      onClick={() => handleToggleActive(addon, !isActive)} 
                      disabled={isLoading} 
                      className="text-xs py-1.5 px-3"
                    >
                      {isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    {isActive && addon.settingsSchema && (
                      <Button $variant="secondary" onClick={() => openSettings(addon)} className="text-xs py-1.5 px-3">
                        ⚙️ Settings
                      </Button>
                    )}
                    <button 
                      onClick={() => handleUninstall(addon)} 
                      disabled={isLoading}
                      className="text-xs font-bold text-red-400 hover:text-red-600 px-2 ml-auto"
                    >
                      Remove
                    </button>
                  </>
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