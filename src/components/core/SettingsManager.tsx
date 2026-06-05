import { useState, useEffect, FC, FormEvent } from 'react';
import { Container, Title, Card, Button, Input, Toast, Subtitle, MenuButton } from '../../styles/StyledElements';
import { Theme, User, GardenProfile } from '../../App';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface SettingsManagerProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  currentUser?: User;
  onUpdateUser?: (updates: Partial<User>) => void;
  gardenProfile?: GardenProfile | null;
  onUpdateGarden?: (name: string, imageUrl: string) => void;
  onLogout?: () => void;
  token?: string | null;
}

export const SettingsManager: FC<SettingsManagerProps> = ({ 
  theme, onThemeChange, onGoBack, onOpenMenu, currentUser, onUpdateUser, gardenProfile, onUpdateGarden, onLogout, token 
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<{name: string, time: number}[]>([]);
  const [printMode, setPrintMode] = useState<'db' | 'blank'>('db');
  const [blankCategory, setBlankCategory] = useState<'plant' | 'location' | 'zone'>('plant');
  const [blankPrefix, setBlankPrefix] = useState('qr');
  const [blankStartId, setBlankStartId] = useState('001');
  const [importJson, setImportJson] = useState('');
  const [showImportHelp, setShowImportHelp] = useState(false);
  const [importType, setImportType] = useState<'archetypes' | 'zones' | 'locations'>('archetypes');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [gardensList, setGardensList] = useState<{id: string, name: string}[]>([]);
  const [selectedGardenId, setSelectedGardenId] = useState('');
  const [expandedSettings, setExpandedSettings] = useState<string[]>(['garden', 'account']);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const toggleSetting = (section: string) => {
    setExpandedSettings(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

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

  useEffect(() => {
    if (currentUser?.role === 'god-admin' && token) {
      fetch(`${apiBase}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) setUsersList(data.users);
        })
        .catch(err => console.error('Failed to load users:', err));
        
      fetch(`${apiBase}/api/gardens`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gardens) setGardensList(data.gardens);
        })
        .catch(err => console.error('Failed to load gardens:', err));
    }
  }, [currentUser, apiBase, token]);

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

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setIsCreatingUser(true);
    try {
      const res = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, name: newFullName, gardenId: selectedGardenId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ User ${data.user.username} created successfully!`);
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        setSelectedGardenId('');
        setUsersList(prev => [...prev, data.user]);
        if (data.newGarden) {
          setGardensList(prev => [...prev, data.newGarden]);
        }
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to create user.'); }
    setIsCreatingUser(false);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${username}' and all their garden data?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ User ${username} deleted.`);
        setUsersList(prev => prev.filter(u => u.id !== userId));
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to delete user.'); }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const newPass = window.prompt(`Enter new password for ${username}:`);
    if (!newPass) return;
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: newPass })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Password updated for ${username}.`);
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to update user.'); }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (changeNewPassword !== confirmPassword) {
      showToast('❌ New passwords do not match!');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${apiBase}/api/users/${currentUser?.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword: changeNewPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Password changed successfully!');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setChangeNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      showToast('❌ Failed to change password.');
    }
    setIsUpdatingPassword(false);
  };

  const handleRenameGarden = async (gardenId: string, currentName: string) => {
    const newName = window.prompt(`Rename garden '${currentName}':`, currentName);
    if (!newName || newName === currentName) return;
    try {
      const res = await fetch(`${apiBase}/api/gardens/${gardenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Garden renamed to ${newName}`);
        setGardensList(prev => prev.map(g => g.id === gardenId ? { ...g, name: newName } : g));
        setUsersList(prev => prev.map(u => (u as any).gardenName === currentName ? { ...u, gardenName: newName } as User : u));
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to rename garden.'); }
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
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(' Sheet 1', '');
  };

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
          </button>
          <Title className="!mb-0">General Settings</Title>
        </div>
        <MenuButton onClick={onOpenMenu}>
          ☰
        </MenuButton>
      </header>

      {gardenProfile && onUpdateGarden && (
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
          <button onClick={() => toggleSetting('garden')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
            <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Garden Profile</Subtitle>
            <span className={`text-slate-400 transition-transform duration-200 ${expandedSettings.includes('garden') ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {expandedSettings.includes('garden') && (
            <Card className="mb-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="relative">
                  {gardenProfile.imageUrl ? (
                      <img src={gardenProfile.imageUrl} alt="Garden" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl font-bold text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500">
                      🏡
                    </div>
                  )}
                  <label className="absolute bottom-[-8px] right-[-8px] bg-emerald-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-emerald-600 transition-colors shadow-md text-xs leading-none">
                    📷
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => onUpdateGarden(gardenProfile.name || 'My Garden', reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Garden Name</label>
                  <Input value={gardenProfile.name || ''} onChange={e => onUpdateGarden(e.target.value, gardenProfile.imageUrl || '')} className="!mb-0" />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {currentUser && onUpdateUser && onLogout && (
        <>
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleSetting('account')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Account Info</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedSettings.includes('account') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedSettings.includes('account') && (
              <Card className="mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {currentUser.imageUrl ? (
                        <img src={currentUser.imageUrl} alt="Profile" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl font-bold text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-emerald-600 transition-colors shadow-md text-xs leading-none">
                      📷
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => onUpdateUser({ imageUrl: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
                    <Input value={currentUser.name} onChange={e => onUpdateUser({ name: e.target.value })} className="!mb-0" />
                  </div>
                </div>
                
                {!showPasswordForm ? (
                  <Button $variant="secondary" type="button" onClick={() => setShowPasswordForm(true)} className="w-full mb-3 text-sm">
                    Change Password
                  </Button>
                ) : (
                  <form onSubmit={handleChangePassword} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                      <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="!mb-0 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                      <Input type="password" value={changeNewPassword} onChange={e => setChangeNewPassword(e.target.value)} className="!mb-0 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                      <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="!mb-0 py-2 text-sm" required />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button type="button" $variant="secondary" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                      <Button type="submit" disabled={isUpdatingPassword}>{isUpdatingPassword ? 'Saving...' : 'Save Password'}</Button>
                    </div>
                  </form>
                )}

                <Button $variant="secondary" onClick={onLogout} className="w-full !text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-900/50 hover:!bg-red-50 dark:hover:!bg-red-900/20">
                  Log Out
                </Button>
              </Card>
            )}
          </div>

          {currentUser.role === 'god-admin' && (
            <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
              <button onClick={() => toggleSetting('users')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
                <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">User Administration</Subtitle>
                <span className={`text-slate-400 transition-transform duration-200 ${expandedSettings.includes('users') ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {expandedSettings.includes('users') && (
                <Card className="mb-4 border-emerald-500 dark:border-emerald-500">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Provision new garden accounts for your friends. They will have their own private gardens but share your global Plant Dictionary.</p>
                <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username</label>
                      <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="!mb-0 py-2" required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
                      <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="!mb-0 py-2" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name (Optional)</label>
                    <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} className="!mb-0 py-2" placeholder="e.g. Alice Gardener" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Garden</label>
                    <select value={selectedGardenId} onChange={e => setSelectedGardenId(e.target.value)} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm mb-1">
                      <option value="">🌱 Create New Private Garden</option>
                      {gardensList.map(g => (
                        <option key={g.id} value={g.id}>🤝 Share: {g.name}</option>
                      ))}
                    </select>
                  </div>
                  <Button type="submit" disabled={isCreatingUser} className="mt-1">
                    {isCreatingUser ? 'Creating...' : '+ Create Account'}
                  </Button>
                </form>
                
                {usersList.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800/50">
                    <Subtitle className="!text-sm mb-3">Existing Accounts</Subtitle>
                    <div className="flex flex-col gap-2">
                      {usersList.map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{u.name || u.username}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{u.role === 'god-admin' ? 'Admin' : 'Member'} • 🏡 {(u as any).gardenName}</span>
                          </div>
                          {u.id !== currentUser.id ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleResetPassword(u.id, u.username)} className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-semibold transition-colors active:scale-95">Reset Pass</button>
                              <button onClick={() => handleDeleteUser(u.id, u.username)} className="text-xs bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-1 rounded font-semibold transition-colors active:scale-95">Delete</button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2">You</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {gardensList.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800/50">
                    <Subtitle className="!text-sm mb-3">Active Gardens</Subtitle>
                    <div className="flex flex-col gap-2">
                      {gardensList.map(g => (
                        <div key={g.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">🏡 {g.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleRenameGarden(g.id, g.name)} className="text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded font-semibold transition-colors active:scale-95">Rename</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
              )}
            </div>
          )}
        </>
      )}

      <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
        <button onClick={() => toggleSetting('appearance')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
          <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Appearance</Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSettings.includes('appearance') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSettings.includes('appearance') && (
          <Card className="flex gap-2 !p-2 mb-4">
            {(['light', 'dark', 'system'] as const).map(t => (
              <button
                key={t}
                onClick={() => onThemeChange(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${
                  theme === t 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                {t}
              </button>
            ))}
          </Card>
        )}
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
        <button onClick={() => toggleSetting('print')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
          <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Print Center</Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSettings.includes('print') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSettings.includes('print') && (
          <Card className="mb-4">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setPrintMode('db')} 
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${printMode === 'db' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                >
                  Database Export
                </button>
                <button 
                  onClick={() => setPrintMode('blank')} 
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${printMode === 'blank' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                >
                  Blank Tags
                </button>
              </div>
              
              {printMode === 'db' ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generate printable sheets for every active Plant, Location, and Zone currently in your system. Output files will be saved to <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">src/data/code-prints/</code> on the server.
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
                      <div 
                        key={i} 
                        className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
                      >
                        <div className="flex flex-col truncate mr-4">
                          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 truncate">
                            {formatPrintName(file.name)}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mt-0.5">
                            {new Date(file.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a 
                        href={`${apiBase}/api/prints/${file.name}?token=${token}`} 
                            download 
                            target="_blank"
                            rel="noreferrer"
                            className="text-xl text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform p-1"
                          >
                            ⬇️
                          </a>
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
        )}
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 last:border-0">
        <button onClick={() => toggleSetting('import')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
          <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Data Import</Subtitle>
          <span className={`text-slate-400 transition-transform duration-200 ${expandedSettings.includes('import') ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {expandedSettings.includes('import') && (
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
        )}
      </div>

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};