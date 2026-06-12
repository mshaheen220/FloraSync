import { useState, useMemo, useEffect, FC } from 'react';
import { PlantArchetype } from '../../../types';
import { Container, Toast, Card, Subtitle } from '../../styles/StyledElements';
import { PageHeader } from '../common/PageHeader';
import { useGarden } from '../../contexts/GardenContext';
import { hasPermission } from '../../utils/permissions';
import { Icon, IconName } from '../common/Icon';
import { ArchetypeForm } from './ArchetypeForm';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

const isValidData = (val: string | number | null | undefined | any[]): boolean => {
  if (val === null || val === undefined || val === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  if (typeof val === 'string' && ['unknown', 'uncategorized', 'n/a'].includes(val.toLowerCase().trim())) return false;
  if (typeof val === 'number' && val === 0) return false;
  return true;
};

const getSunIcon = (requirement?: string): IconName => {
  if (!requirement) return 'sun';
  const req = requirement.toLowerCase();
  if (req.includes('part') || req.includes('partial')) return 'cloud-sun';
  if (req.includes('shade') && !req.includes('sun')) return 'cloud';
  return 'sun';
};

const getWaterIcon = (days?: number): IconName => {
  if (!days) return 'water';
  if (days <= 3) return 'cloud-rain'; // Frequent
  if (days <= 7) return 'water'; // Moderate
  return 'droplet'; // Infrequent
};

const getFeedIcon = (days?: number): IconName => {
  if (!days) return 'feed';
  if (days <= 14) return 'utensils'; // Frequent
  if (days <= 30) return 'feed'; // Moderate
  return 'hourglass'; // Infrequent
};

interface ArchetypeDetailProps {
  archetypeId: string;
  onGoBack: () => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const ArchetypeDetail: FC<ArchetypeDetailProps> = ({ archetypeId, onGoBack, onOpenMenu, onOpenWorkspaceMenu }) => {
  const { currentUser, archetypes, onAddArchetype, onUpdateArchetype } = useGarden();
  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(archetypeId === 'new');
  
  const archetype = useMemo(() => archetypes.find(a => a.id === archetypeId), [archetypes, archetypeId]);
  
  const [initialFormData, setInitialFormData] = useState<Partial<PlantArchetype>>({});
  const [expandedViewSections, setExpandedViewSections] = useState<string[]>(['cultivation']);

  const milestoneVerbFuture = useMemo(() => {
    const cat = archetype?.category?.toLowerCase() || '';
    if (cat.includes('flower')) return 'Bloom';
    if (cat.includes('foliage') || cat.includes('succulent') || cat.includes('houseplant')) return 'Maturity';
    return 'Harvest';
  }, [archetype?.category]);

  useEffect(() => {
    if (archetypeId === 'new') {
      setIsEditing(true);
      setInitialFormData({
        waterIntervalDays: 4,
        feedingIntervalDays: 14,
        sunRequirement: 'Full Sun',
        lifecycle: 'Unknown',
        funFacts: []
      });
    } else if (archetype) {
      setIsEditing(false);
      setInitialFormData(archetype);
    }
  }, [archetypeId, archetype]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = (data: Partial<PlantArchetype>) => {
    if (archetypeId === 'new') {
      if (!data.commonName?.trim()) {
        showToast('⚠️ Common Name is required!');
        return;
      }
  
      const newId = data.commonName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (archetypes.some(a => a.id === newId)) {
        showToast('⚠️ A plant with this name already exists!');
        return;
      }
  
      const newArchetype: PlantArchetype = {
        id: newId,
        commonName: data.commonName.trim(),
        scientificName: data.scientificName || 'Unknown',
        category: data.category || 'Uncategorized',
        sunRequirement: data.sunRequirement || 'Full Sun',
        waterIntervalDays: data.waterIntervalDays || 4,
        feedingIntervalDays: data.feedingIntervalDays || 14,
        whatToFeed: data.whatToFeed || 'Unknown',
        pruningTips: data.pruningTips || 'Unknown',
        flavorProfile: data.flavorProfile || 'Unknown',
        companionPlants: data.companionPlants || [],
        combativePlants: data.combativePlants || [],
        growthHabit: data.growthHabit || 'Unknown',
        daysToHarvest: data.daysToHarvest || 0,
        imageUrl: data.imageUrl || '',
        whenToPlant: data.whenToPlant || 'Unknown',
        whenToHarvest: data.whenToHarvest || 'Unknown',
        usesForLargeHarvests: data.usesForLargeHarvests || 'Unknown',
        hardinessZones: data.hardinessZones || [],
        hardinessNote: data.hardinessNote || '',
        plantingInstructions: data.plantingInstructions || 'Unknown',
        growthRequirements: data.growthRequirements || 'Unknown',
        lifecycle: data.lifecycle || 'Unknown',
        funFacts: data.funFacts || [],
        ...data
      };
  
      onAddArchetype(newArchetype);
      showToast('✅ New plant added successfully!');
      onGoBack();
    } else {
      onUpdateArchetype(archetypeId, data);
      setIsEditing(false);
      showToast('📖 Plant reference updated!');
    }
  };

  const canEdit = hasPermission(currentUser, 'manage_dictionary');

  if (!canEdit && archetypeId === 'new') {
    return <Container><p>You do not have permission to add new plants.</p></Container>;
  }

  if (!archetype && archetypeId !== 'new') {
    return <Container><p>Plant not found.</p></Container>;
  }

  const toggleViewSection = (section: string) => {
    setExpandedViewSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const renderViewMode = () => {
    const hasCultivationData = archetype && (
      isValidData(archetype.sunRequirement) || 
      isValidData(archetype.waterIntervalDays) || 
      isValidData(archetype.feedingIntervalDays) || 
      isValidData(archetype.pruningTips) ||
      isValidData(archetype.whatToFeed)
    );

    const hasTraitsData = archetype && (
      isValidData(archetype.scientificName) ||
      isValidData(archetype.category) ||
      isValidData(archetype.growthHabit) ||
      isValidData(archetype.lifecycle) ||
      isValidData(archetype.hardinessZones) ||
      isValidData(archetype.hardinessNote) ||
      isValidData(archetype.flavorProfile) ||
      isValidData(archetype.companionPlants) ||
      isValidData(archetype.combativePlants) ||
      isValidData(archetype.growthRequirements)
    );

    const hasLifecycleData = archetype && (
      isValidData(archetype.whenToPlant) ||
      isValidData(archetype.whenToHarvest) ||
      isValidData(archetype.daysToHarvest) ||
      isValidData(archetype.plantingInstructions) ||
      isValidData(archetype.usesForLargeHarvests)
    );

    const hasFunFacts = archetype && archetype.funFacts && archetype.funFacts.length > 0;

    return (
      <div className="space-y-4 pb-8">
        <Card className="flex flex-col items-center pb-6 relative overflow-hidden !px-0 !pt-0">
          {archetype?.imageUrl ? (
            <img src={archetype.imageUrl} alt={archetype?.commonName} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full h-56 object-cover mb-4 bg-slate-100 dark:bg-slate-800" />
          ) : (
            <div className="w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 mb-6"></div>
          )}
          <div className="px-5 w-full flex flex-col items-center">
            <div className="flex gap-4 text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 bg-surface-50 dark:bg-surface-800/50 px-4 py-2 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm flex-wrap justify-center">
              {isValidData(archetype?.waterIntervalDays) && <span className="flex items-center gap-1.5"><Icon name={getWaterIcon(archetype?.waterIntervalDays)} size={16} className="text-blue-500 dark:text-blue-400" /> {archetype?.waterIntervalDays}d</span>}
              {isValidData(archetype?.feedingIntervalDays) && <span className="flex items-center gap-1.5"><Icon name={getFeedIcon(archetype?.feedingIntervalDays)} size={16} className="text-amber-500 dark:text-amber-400" /> {archetype?.feedingIntervalDays}d</span>}
              {isValidData(archetype?.sunRequirement) && <span className="flex items-center gap-1.5"><Icon name={getSunIcon(archetype?.sunRequirement)} size={16} className="text-amber-400 dark:text-amber-300" /> {archetype?.sunRequirement}</span>}
            </div>
          </div>
        </Card>

        {hasCultivationData && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleViewSection('cultivation')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Cultivation Basics</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('cultivation') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('cultivation') && (
              <Card>
                <ul className="space-y-5 text-sm">
                {isValidData(archetype?.sunRequirement) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 rounded-full w-10 h-10 flex-shrink-0 text-amber-600 dark:text-amber-400">
                      <Icon name={getSunIcon(archetype?.sunRequirement)} size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Sunlight</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.sunRequirement}</span>
                    </div>
                  </li>
                )}
                {isValidData(archetype?.waterIntervalDays) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 rounded-full w-10 h-10 flex-shrink-0 text-blue-600 dark:text-blue-400">
                      <Icon name={getWaterIcon(archetype?.waterIntervalDays)} size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Watering Interval</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">Every {archetype?.waterIntervalDays} days</span>
                    </div>
                  </li>
                )}
                {isValidData(archetype?.feedingIntervalDays) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 rounded-full w-10 h-10 flex-shrink-0 text-amber-600 dark:text-amber-400">
                      <Icon name={getFeedIcon(archetype?.feedingIntervalDays)} size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Feeding</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed block mb-1">Every {archetype?.feedingIntervalDays} days</span>
                      {isValidData(archetype?.whatToFeed) && <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed">{archetype?.whatToFeed}</span>}
                    </div>
                  </li>
                )}
                {isValidData(archetype?.pruningTips) && (
                  <li className="flex gap-4 items-start">
                    <span className="flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 rounded-full w-10 h-10 flex-shrink-0 text-primary-600 dark:text-primary-400">
                      <Icon name="edit" size={20} />
                    </span>
                    <div className="pt-1">
                      <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Pruning Care</strong>
                      <span className="text-slate-500 dark:text-slate-400 leading-relaxed">{archetype?.pruningTips}</span>
                    </div>
                  </li>
                )}
                </ul>
              </Card>
            )}
          </div>
        )}

        {hasTraitsData && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleViewSection('traits')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Details & Traits</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('traits') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('traits') && (
              <Card>
                <div className="space-y-4 text-sm">
                {isValidData(archetype?.scientificName) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Scientific Name</strong>
                    <span className="text-slate-500 dark:text-slate-400 italic">{archetype?.scientificName}</span>
                  </div>
                )}
                {(isValidData(archetype?.category) || isValidData(archetype?.growthHabit) || isValidData(archetype?.lifecycle)) && (
                  <div className="grid grid-cols-2 gap-4">
                    {isValidData(archetype?.category) && (
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Category</strong>
                        <span className="text-slate-500 dark:text-slate-400">{archetype?.category}</span>
                      </div>
                    )}
                    {isValidData(archetype?.growthHabit) && (
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Growth Habit</strong>
                        <span className="text-slate-500 dark:text-slate-400">{archetype?.growthHabit}</span>
                      </div>
                    )}
                    {isValidData(archetype?.lifecycle) && (
                      <div>
                        <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Lifecycle</strong>
                        <span className="text-slate-500 dark:text-slate-400">{archetype?.lifecycle}</span>
                      </div>
                    )}
                  </div>
                )}
                {isValidData(archetype?.growthRequirements) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Growth Requirements</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.growthRequirements}</span>
                  </div>
                )}
                {((archetype?.hardinessZones ?? []).length > 0 || isValidData(archetype?.hardinessNote)) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Hardiness Zones</strong>
                    {(archetype?.hardinessZones ?? []).length > 0 && (
                      <span className="text-slate-500 dark:text-slate-400 block">
                        {archetype?.hardinessZones?.join(', ')}
                      </span>
                    )}
                    {isValidData(archetype?.hardinessNote) && (
                      <span className="text-slate-500 dark:text-slate-400 text-xs italic block leading-relaxed mt-1">{archetype?.hardinessNote}</span>
                    )}
                  </div>
                )}
                {isValidData(archetype?.daysToHarvest) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Days to {milestoneVerbFuture}</strong>
                    <span className="text-slate-500 dark:text-slate-400">{archetype?.daysToHarvest} days</span>
                  </div>
                )}
                {isValidData(archetype?.flavorProfile) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Flavor Profile</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.flavorProfile}</span>
                  </div>
                )}
                {(archetype?.companionPlants ?? []).length > 0 && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Companion Plants</strong>
                    <span className="text-slate-500 dark:text-slate-400">{archetype?.companionPlants?.join(", ")}</span>
                  </div>
                )}
                {(archetype?.combativePlants ?? []).length > 0 && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Combative Plants</strong>
                    <span className="text-slate-500 dark:text-slate-400">{archetype?.combativePlants?.join(", ")}</span>
                  </div>
                )}
                </div>
              </Card>
            )}
          </div>
        )}

        {hasLifecycleData && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">
            <button onClick={() => toggleViewSection('lifecycle')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Lifecycle & {milestoneVerbFuture}</Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('lifecycle') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('lifecycle') && (
              <Card>
                <div className="space-y-4 text-sm">
                {isValidData(archetype?.whenToPlant) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to Plant</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToPlant}</span>
                  </div>
                )}
                {isValidData(archetype?.plantingInstructions) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">How to Plant</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.plantingInstructions}</span>
                  </div>
                )}
                {isValidData(archetype?.whenToHarvest) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">When to {milestoneVerbFuture}</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.whenToHarvest}</span>
                  </div>
                )}
                {isValidData(archetype?.usesForLargeHarvests) && (
                  <div>
                    <strong className="block text-slate-800 dark:text-slate-100 font-semibold mb-0.5">Abundant Yield Uses</strong>
                    <span className="text-slate-500 dark:text-slate-400 leading-relaxed block">{archetype?.usesForLargeHarvests}</span>
                  </div>
                )}
                </div>
              </Card>
            )}
          </div>
        )}

        {hasFunFacts && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 last:border-0">
            <button onClick={() => toggleViewSection('funFacts')} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
              <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                Fun Facts <span className="text-sm text-slate-400 dark:text-slate-500 ml-2 font-normal">({archetype?.funFacts?.length || 0})</span>
              </Subtitle>
              <span className={`text-slate-400 transition-transform duration-200 ${expandedViewSections.includes('funFacts') ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expandedViewSections.includes('funFacts') && (
              <div className="space-y-3">
                {archetype?.funFacts?.map((rawFact, idx) => {
                  const fact = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
                  const factIcon = fact.icon || 'lightbulb';
                  const factTitle = fact.title || "Did You Know?";
                  
                  return (
                    <Card key={idx} className="!p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        {!fact.imageUrl && (
                          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg shadow-sm border border-primary-100 dark:border-primary-800/50 mt-0.5">
                            <Icon name={factIcon as IconName} size={20} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight mb-1">{factTitle}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">"{fact.fact}"</p>
                          {fact.attributedTo && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-semibold">— {fact.attributedTo}</p>
                          )}
                        </div>
                      </div>
                      {fact.imageUrl && (
                        <img src={fact.imageUrl} alt={factTitle} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-full max-h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mt-1" />
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Container className="animate-in slide-in-from-right-4 duration-300">
      <PageHeader 
        title={archetypeId === 'new' ? 'New Plant' : (isEditing ? `Editing ${archetype?.commonName}` : archetype?.commonName || 'Plant Details')}
        supertitle="Plant Dictionary"
        onGoBack={onGoBack} 
        onOpenMenu={onOpenMenu} 
        onOpenWorkspaceMenu={onOpenWorkspaceMenu}
        rightContent={canEdit && !isEditing ? (
          <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-700 dark:hover:text-primary-400 active:scale-90 transition-all bg-transparent rounded-full">
            <Icon name="edit" size={20} />
          </button>
        ) : null}
      />
      {isEditing ? (
        <ArchetypeForm 
          initialData={initialFormData}
          isNew={archetypeId === 'new'}
          onSave={handleSave}
          onCancel={archetypeId === 'new' ? onGoBack : () => setIsEditing(false)}
        />
      ) : renderViewMode()}
      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};