import { useState, useMemo, useEffect, FC } from 'react';
import { Container, Card, Button, Input, Toast, Subtitle } from '../../styles/StyledElements';
import { PlantInstanceCard } from './PlantInstanceCard';
import { PlantRegistrationForm } from './PlantRegistrationForm';
import { PageHeader } from '../common/PageHeader';
import { useGarden } from '../../contexts/GardenContext';
import { Icon } from '../common/Icon';

interface InventoryManagerProps {
  onNavigate: (qrId: string) => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const InventoryManager: FC<InventoryManagerProps> = ({ onNavigate, onOpenMenu, onOpenWorkspaceMenu }) => {
  const { gardenProfile, currentUser, instances, archetypes, locations, zones, onRegister } = useGarden();
  const [toastMessage, setToastMessage] = useState('');
  const [isAddingPlant, setIsAddingPlant] = useState(false);
  const [expandedInventoryCategories, setExpandedInventoryCategories] = useState<string[]>([]);
  const [inventoryGroupBy, setInventoryGroupBy] = useState<'category' | 'zone' | 'location'>('category');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggleInventoryCategory = (category: string) => {
    setExpandedInventoryCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

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
      <PageHeader title="Inventory Manager" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      <Subtitle>Your Plants</Subtitle>
      {!isAddingPlant && currentUser?.workspaceRole !== 'viewer' && (
        <Button onClick={() => setIsAddingPlant(true)} className="mb-6">+ Add New Plant</Button>
      )}
      {isAddingPlant && currentUser?.workspaceRole !== 'viewer' && (
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
        <Input placeholder="🔍 Search your plants..." value={inventorySearchTerm} onChange={(e) => setInventorySearchTerm(e.target.value)} />
      )}

      {groupedInventory.totalCount > 0 && (
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group By</span>
          <select 
            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all text-slate-700 dark:text-slate-200 shadow-sm"
            value={inventoryGroupBy}
            onChange={e => { setInventoryGroupBy(e.target.value as any); setExpandedInventoryCategories([]); }}
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
            <div className="mb-4 flex justify-center text-emerald-500 dark:text-emerald-400">
              <Icon name="sprout" size={48} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{inventorySearchTerm.trim() ? "No plants match your search." : "You have no active plants in your inventory. Scan a new tag to get started!"}</p>
          </Card>
        ) : (
          groupedInventory.sortedCategories.map(category => (
            <div key={category} className="border-b border-slate-200 dark:border-slate-800 pb-2 last:border-0">
              <button onClick={() => toggleInventoryCategory(category)} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
                <Subtitle className="!m-0 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{category} <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({groupedInventory.groups[category].length})</span></Subtitle>
                <span className={`text-slate-400 transition-transform duration-200 ${expandedInventoryCategories.includes(category) ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {expandedInventoryCategories.includes(category) && (
                <div className="space-y-3 mb-4">{groupedInventory.groups[category].map(item => <PlantInstanceCard key={item.qrId} instance={item} archetype={item.archetype} locationName={item.location?.name} zoneName={item.zone?.name} zoneModifier={item.zone?.evaporationModifier} onClick={() => onNavigate(item.qrId)} />)}</div>
              )}
            </div>
          ))
        )}
      </div>
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};