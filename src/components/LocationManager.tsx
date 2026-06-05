import { useState, useEffect, FC, FormEvent, useMemo } from 'react';
import { Location, Zone, PlantInstance, PlantArchetype } from '../../types';
import { Container, Title, Card, Button, Input, Toast, Subtitle, MenuButton } from '../styles/StyledElements';
import { Theme, User } from '../App';
import { PlantInstanceCard } from './PlantInstanceCard';
import { ZoneCard } from './ZoneCard';
import { LocationCard } from './LocationCard';
import { PlantRegistrationForm } from './PlantRegistrationForm';

interface LocationManagerProps {
  mode: 'settings' | 'zones' | 'locations' | 'inventory';
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  instances: PlantInstance[];
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onAddZone: (name: string) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
  onAdd: (name: string, zoneId: string) => void;
  onUpdate: (id: string, updates: Partial<Location>) => void;
  onDelete: (id: string) => void;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onNavigateLocation: (id: string) => void;
  onNavigateZone: (id: string) => void;
  onNavigate: (qrId: string) => void;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
  currentUser?: User;
  onUpdateUser?: (updates: Partial<User>) => void;
  onLogout?: () => void;
  token?: string | null;
}

export const LocationManager: FC<LocationManagerProps> = ({ mode, archetypes, locations, zones, instances, theme, onThemeChange, onAddZone, onUpdateZone, onDeleteZone, onAdd, onUpdate, onDelete, onGoBack, onOpenMenu, onNavigateLocation, onNavigateZone, onNavigate, onRegister, currentUser, onUpdateUser, onLogout, token }) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newName, setNewName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneData, setEditZoneData] = useState<Partial<Zone>>({});
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [expandedInventoryCategories, setExpandedInventoryCategories] = useState<string[]>([]);
  const [inventoryGroupBy, setInventoryGroupBy] = useState<'category' | 'zone' | 'location'>('category');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [expandedLocationZones, setExpandedLocationZones] = useState<string[]>([]);
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
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  // Fetch existing print files when the settings view loads
  useEffect(() => {
    if (mode === 'settings' && token) {
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
  }, [mode, apiBase, token]);

  // Fetch users list for admin
  useEffect(() => {
    if (mode === 'settings' && currentUser?.role === 'god-admin' && token) {
      fetch(`${apiBase}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) setUsersList(data.users);
        })
        .catch(err => console.error('Failed to load users:', err));
        
      // Also fetch available gardens for the assignment dropdown
      fetch(`${apiBase}/api/gardens`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gardens) setGardensList(data.gardens);
        })
        .catch(err => console.error('Failed to load gardens:', err));
    }
  }, [mode, currentUser, apiBase, token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddZone = (e: FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    onAddZone(newZoneName);
    setNewZoneName('');
    showToast('📍 Zone added successfully!');
  };

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
        // Refresh the list to get all files sorted properly
        fetch(`${apiBase}/api/prints`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(d => {
          if (d.files) setGeneratedFiles(d.files);
        });
        showToast('🖨️ QR Sheets generated successfully!');
      } else {
        // Python tracebacks or Node exec errors usually have the actual reason on the last line
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
        "whatToFeed": "Rarely requires fertilizer; a light dusting of bone meal or low-nitrogen organic compost scratched into the surface layers in early spring.",
        "pruningTips": "Not applicable to fresh cuttings. Established plants benefit from being cut back by half in late spring (Chelsea Chop) to encourage branching and prevent them from splitting open.",
        "flavorProfile": "Not edible. Grown strictly as an ornamental or structural foliage accent plant.",
        "companionPlants": ["Coneflowers", "Tall Bearded Iris", "Ornamental Grasses", "Blue Chalksticks"],
        "combativePlants": ["None reported"],
        "growthHabit": "Sprawling Mounded (once established)",
        "daysToHarvest": 60,
        "imageUrl": "/images/foliage/Allegheny Stonecrop Cuttings.jpg",
        "whenToPlant": "Zone 6/7: Direct plant unrooted cuttings outdoors from late spring (May) through early autumn (September), ideally when nights are above 50°F.",
        "whenToHarvest": "Not applicable; admired for its continuous distinctive texture and summer-to-autumn display of pink or white flower clusters.",
        "usesForLargeHarvests": "Excellent structural groundcover, rock garden filler, or low-maintenance border edging.",
        "hardinessZones": [4, 9],
        "hardinessNote": "Hardy perennial. Cuttings form a resilient, drought-resistant stonecrop plant over their first season.",
        "plantingInstructions": "To plant unrooted cuttings: 1. Let the fresh cuts callous for a couple of days in a cool, dry, shaded spot. 2. Plant directly into the ground, burying 1-2 inches of the stem and leaves in a well-loosened patch of soil. 3. Backfill firmly and water once lightly to settle.",
        "growthRequirements": "Requires completely average, lean, gritty, loose loam with top-tier internal drainage and a pH range of 6.0 to 7.0. Roots must dry out thoroughly; avoid overwatering or pooling water. Thrives in highly bright sun."
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

  const formatPrintName = (filename: string) => {
    let name = filename.replace('.png', '');

    // Handle blank tags (e.g., plant_plnt_sheet_start_063_sheet_1)
    const blankMatch = name.match(/^(plant|location|zone)_(.*?)_sheet_start_(\d+)_sheet_(\d+)$/);
    if (blankMatch) {
      const category = blankMatch[1].charAt(0).toUpperCase() + blankMatch[1].slice(1) + 's';
      const prefix = blankMatch[2].charAt(0).toUpperCase() + blankMatch[2].slice(1);
      const startId = blankMatch[3];
      const sheetNum = blankMatch[4];
      
      return `Blank ${category} ${prefix}-${startId}${sheetNum !== '1' ? ` (Sheet ${sheetNum})` : ''}`;
    }

    // Handle database exports
    return name
      .replace('db_export_plants', 'Plant Inventory')
      .replace('db_export_locations', 'Locations')
      .replace('db_export_zones', 'Zones')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(' Sheet 1', ''); // Hide "Sheet 1" to keep it clean, but keep "Sheet 2", etc.
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedZoneId) return;
    onAdd(newName, selectedZoneId);
    setNewName('');
    showToast('📍 Location added successfully!');
  };

  const toggleInventoryCategory = (category: string) => {
    setExpandedInventoryCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleLocationZone = (zoneName: string) => {
    setExpandedLocationZones(prev => 
      prev.includes(zoneName)
        ? prev.filter(z => z !== zoneName)
        : [...prev, zoneName]
    );
  };

  const groupedLocations = useMemo(() => {
    const groups = locations.reduce((acc, loc) => {
      const zone = zones.find(z => z.id === loc.zoneId);
      const zoneName = zone ? zone.name : 'Unassigned Zone';
      if (!acc[zoneName]) acc[zoneName] = [];
      acc[zoneName].push(loc);
      return acc;
    }, {} as Record<string, Location[]>);

    const sortedZones = Object.keys(groups).sort();
    sortedZones.forEach(z => {
      groups[z].sort((a, b) => a.name.localeCompare(b.name));
    });

    return { groups, sortedZones };
  }, [locations, zones]);

  const groupedInventory = useMemo(() => {
    const today = new Date().getTime();
    let enrichedInstances = instances.map(instance => {
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
    });

    if (inventorySearchTerm.trim()) {
      const lowerTerm = inventorySearchTerm.toLowerCase();
      enrichedInstances = enrichedInstances.filter(item => 
        item.archetype?.commonName.toLowerCase().includes(lowerTerm)
      );
    }

    const groups = enrichedInstances.reduce((acc, curr) => {
      let groupKey = 'Uncategorized';
      if (inventoryGroupBy === 'category') {
        groupKey = curr.archetype?.category || 'Uncategorized';
      } else if (inventoryGroupBy === 'zone') {
        groupKey = curr.zone?.name || 'Unassigned Zone';
      } else if (inventoryGroupBy === 'location') {
        groupKey = curr.location?.name 
          ? `${curr.zone?.name || 'Unassigned Zone'} • ${curr.location.name}` 
          : 'Unassigned Location';
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(curr);
      return acc;
    }, {} as Record<string, typeof enrichedInstances>);

    const sortedCategories = Object.keys(groups).sort();
    sortedCategories.forEach(cat => {
      groups[cat].sort((a, b) => (a.archetype?.commonName || '').localeCompare(b.archetype?.commonName || ''));
    });

    return { groups, sortedCategories, totalCount: enrichedInstances.length };
  }, [instances, archetypes, locations, zones, inventoryGroupBy, inventorySearchTerm]);

  // Auto-expand categories when actively searching
  useEffect(() => {
    if (inventorySearchTerm.trim()) {
      setExpandedInventoryCategories(groupedInventory.sortedCategories);
    } else {
      setExpandedInventoryCategories([]);
    }
  }, [inventorySearchTerm, groupedInventory.sortedCategories]);

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <header className="mb-6 flex items-center justify-between pt-6">
        <div className="flex items-center gap-3">
          <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
            &larr;
          </button>
          <Title className="!mb-0">
            {mode === 'settings' && 'General Settings'}
            {mode === 'zones' && 'Zone Manager'}
            {mode === 'locations' && 'Location Manager'}
            {mode === 'inventory' && 'Inventory Manager'}
          </Title>
        </div>
        <MenuButton onClick={onOpenMenu}>
          ☰
        </MenuButton>
      </header>

      {mode === 'settings' && (
        <>
          {currentUser && onUpdateUser && onLogout && (
            <>
              <Subtitle>Account Info</Subtitle>
              <Card className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    {currentUser.imageUrl ? (
                      <img src={currentUser.imageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500" />
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

              {currentUser.role === 'god-admin' && (
                <>
                  <Subtitle>User Administration</Subtitle>
                  <Card className="mb-8 border-emerald-500 dark:border-emerald-500">
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
                  </Card>
                </>
              )}
            </>
          )}

          <Subtitle>Appearance</Subtitle>
          <Card className="flex gap-2 !p-2 mb-8">
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

      <Subtitle>Print Center</Subtitle>
      <Card className="mb-8">
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

      <Subtitle>Data Import</Subtitle>
      <Card className="mb-8">
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
        </>
      )}

      {mode === 'zones' && (
        <>
          <Subtitle>Manage Zones</Subtitle>
          <Card>
            <form onSubmit={handleAddZone} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">New Macro Zone</label>
                <Input placeholder="Zone Name (e.g. Greenhouse)" value={newZoneName} onChange={e => setNewZoneName(e.target.value)} className="!mb-0 py-2.5" />
              </div>
              <Button type="submit" className="mt-2">Add Zone</Button>
            </form>
          </Card>
    
          <Subtitle>Existing Zones</Subtitle>
          <div className="space-y-3 mb-8">
            {zones.map(zone => {
              const locationsInZone = locations.filter(l => l.zoneId === zone.id).length;
              const isEditing = editingZoneId === zone.id;
    
              return (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  locationsInZone={locationsInZone}
                  isEditing={isEditing}
                  editZoneData={editZoneData}
                  setEditZoneData={setEditZoneData}
                  onEditStart={() => { setEditingZoneId(zone.id); setEditZoneData(zone); }}
                  onEditCancel={() => setEditingZoneId(null)}
                  onSave={(e) => { e.preventDefault(); onUpdateZone(zone.id, editZoneData); setEditingZoneId(null); showToast('📍 Zone updated!'); }}
                  onDelete={() => { if (locationsInZone === 0 && window.confirm('Delete this zone?')) { onDeleteZone(zone.id); showToast('🗑️ Zone removed'); } }}
                  onNavigateZone={() => onNavigateZone(zone.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {mode === 'locations' && (
        <>
          <Subtitle>Manage Locations</Subtitle>
          <Card>
            <form onSubmit={handleAdd} className="flex flex-col gap-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Zone</label>
                <select className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all" value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)} required>
                  <option value="" disabled>Select a zone...</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Specific Name (e.g. Shelf B)</label>
                <Input placeholder="Location Name" value={newName} onChange={e => setNewName(e.target.value)} className="!mb-0 py-2.5" />
              </div>
              <Button type="submit" className="mt-2">Add Location</Button>
            </form>
          </Card>
    
          <Subtitle className="!mb-0">Existing Locations</Subtitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">(grouped by Zone)</p>
          <div className="space-y-4">
            {groupedLocations.sortedZones.length === 0 ? (
              <p className="text-sm text-slate-500 italic mt-4">No locations currently assigned.</p>
            ) : (
              groupedLocations.sortedZones.map(zoneName => (
                <div key={zoneName} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
                  <button 
                    onClick={() => toggleLocationZone(zoneName)}
                    className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
                  >
                    <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {zoneName} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedLocations.groups[zoneName].length})</span>
                    </Subtitle>
                    <span className={`text-slate-400 transition-transform duration-200 ${expandedLocationZones.includes(zoneName) ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedLocationZones.includes(zoneName) && (
                    <div className="space-y-3 mb-4">
                      {groupedLocations.groups[zoneName].map(loc => {
                        const plantsInLocation = instances.filter(i => i.locationId === loc.id).length;
                        const isEditing = editingId === loc.id;
              
                        return (
                          <LocationCard
                            key={loc.id}
                            location={loc}
                            zoneName={zoneName}
                            zones={zones}
                            plantsInLocation={plantsInLocation}
                            isEditing={isEditing}
                            editData={editData}
                            setEditData={setEditData}
                            onEditStart={() => { setEditingId(loc.id); setEditData(loc); }}
                            onEditCancel={() => setEditingId(null)}
                            onSave={(e) => { e.preventDefault(); onUpdate(loc.id, editData); setEditingId(null); showToast('📍 Location updated!'); }}
                            onDelete={() => { if (plantsInLocation === 0 && window.confirm('Delete this location?')) { onDelete(loc.id); showToast('🗑️ Location removed'); } }}
                            onNavigateLocation={() => onNavigateLocation(loc.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {mode === 'inventory' && (
        <>
          <Subtitle>Your Plants</Subtitle>
          {!isAddingPlant ? (
            <Button onClick={() => setIsAddingPlant(true)} className="mb-6">+ Add New Plant</Button>
          ) : (
            <Card className="mb-6 shadow-md border-emerald-500 dark:border-emerald-500">
              <Subtitle className="!mt-0 mb-4">Add New Plant</Subtitle>
              <PlantRegistrationForm 
                archetypes={archetypes} 
                locations={locations} 
                zones={zones} 
                onRegister={(qrId, identifier, isNew, locationId, isNewLocation, zoneId, isNewZone, imageUrl) => {
                  onRegister(qrId, identifier, isNew, locationId, isNewLocation, zoneId, isNewZone, imageUrl);
                  showToast('🌱 Plant added successfully!');
                  setIsAddingPlant(false);
                }} 
                onCancel={() => setIsAddingPlant(false)} 
                submitLabel="Add Plant" 
              />
            </Card>
          )}

          {instances.length > 0 && (
            <Input 
              placeholder="🔍 Search your plants..." 
              value={inventorySearchTerm} 
              onChange={(e) => setInventorySearchTerm(e.target.value)} 
            />
          )}

          {groupedInventory.totalCount > 0 && (
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group By</span>
              <select 
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
                value={inventoryGroupBy}
                onChange={e => {
                  setInventoryGroupBy(e.target.value as any);
                  setExpandedInventoryCategories([]); // Auto-collapse everything when switching views
                }}
              >
                <option value="category">Plant Category</option>
                <option value="zone">Macro Zone</option>
                <option value="location">Specific Location</option>
              </select>
            </div>
          )}
          <div className="space-y-4">
            {groupedInventory.totalCount === 0 ? (
              <Card className="text-center py-12 shadow-sm border-dashed border-2 border-emerald-200 dark:border-emerald-800">
                <div className="text-4xl mb-4">🌱</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {inventorySearchTerm.trim() 
                    ? "No plants match your search." 
                    : "You have no active plants in your inventory. Scan a new tag to get started!"}
                </p>
              </Card>
            ) : (
              groupedInventory.sortedCategories.map(category => (
                <div key={category} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
                  <button 
                    onClick={() => toggleInventoryCategory(category)}
                    className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform"
                  >
                    <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {category} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedInventory.groups[category].length})</span>
                    </Subtitle>
                    <span className={`text-slate-400 transition-transform duration-200 ${expandedInventoryCategories.includes(category) ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedInventoryCategories.includes(category) && (
                    <div className="space-y-3 mb-4">
                      {groupedInventory.groups[category].map(item => (
                        <PlantInstanceCard 
                          key={item.qrId}
                          instance={item}
                          archetype={item.archetype}
                          locationName={item.location?.name}
                          zoneName={item.zone?.name}
                          zoneModifier={item.zone?.evaporationModifier}
                          onClick={() => onNavigate(item.qrId)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};