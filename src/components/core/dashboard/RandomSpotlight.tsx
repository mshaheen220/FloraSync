import { useMemo, useState, useEffect, FC } from 'react';
import { PlantInstance, PlantArchetype, FunFact } from '../../../../types';
import { Card, Subtitle } from '../../../styles/StyledElements';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface RandomSpotlightProps {
  activeInstances: PlantInstance[];
  archetypes: PlantArchetype[];
  onNavigate: (qrId: string) => void;
}

export const RandomSpotlight: FC<RandomSpotlightProps> = ({ activeInstances, archetypes, onNavigate }) => {
  const [randomSeed, setRandomSeed] = useState(() => ({
    plantIndex: Math.floor(Math.random() * 1000000),
    promptIndex: Math.floor(Math.random() * 1000000),
    factIndex: Math.floor(Math.random() * 1000000)
  }));

  const handleShuffle = () => {
    setRandomSeed(prev => ({
      // Using larger jumps ensures we bounce around arrays randomly instead of creating predictable sequential loops
      plantIndex: prev.plantIndex + Math.floor(Math.random() * 17) + 1,
      promptIndex: prev.promptIndex + Math.floor(Math.random() * 19) + 1,
      factIndex: prev.factIndex + Math.floor(Math.random() * 23) + 1
    }));
  };

  const spotlight = useMemo(() => {
    if (activeInstances.length === 0) return null;
    
    // Group by archetype so mass-planted crops (like 20 carrots) don't hog the spotlight
    const uniqueArchetypeIds = Array.from(new Set(activeInstances.map(i => i.archetypeId)));
    
    // First, gather all fun facts from across the ENTIRE garden
    const allFunFacts: { instance: PlantInstance, archetype: PlantArchetype, title: string, message: string, imageUrl?: string, icon?: string }[] = [];
    
    uniqueArchetypeIds.forEach(archId => {
      const archetype = archetypes.find(a => a.id === archId);
      if (archetype?.funFacts && archetype.funFacts.length > 0) {
        const instance = activeInstances.find(i => i.archetypeId === archId)!;
        archetype.funFacts.forEach(rawFact => {
          const factObj = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
          if (factObj.fact && factObj.fact.trim() !== '') {
            const factMessage = factObj.attributedTo ? `"${factObj.fact}" — ${factObj.attributedTo}` : factObj.fact;
            const factIcon = factObj.icon || '💡';
            const factTitle = factObj.title || "Did You Know?";
            allFunFacts.push({ instance, archetype, title: factTitle, message: factMessage, imageUrl: factObj.imageUrl, icon: factIcon });
          }
        });
      }
    });

    // 25% chance to force a global Fun Fact if any exist. 
    // This ensures facts show up frequently without allowing the few plants that have them to completely monopolize the dashboard!
    const isGlobalFact = (randomSeed.promptIndex % 100) < 25;

    if (allFunFacts.length > 0 && isGlobalFact) {
      return allFunFacts[randomSeed.factIndex % allFunFacts.length];
    }

    // For standard generated tips, prefer plants that are actively monitored
    const trackedInstances = activeInstances.filter(i => !i.untracked);
    const localPool = trackedInstances.length > 0 ? trackedInstances : activeInstances;
    const localArchetypeIds = Array.from(new Set(localPool.map(i => i.archetypeId)));

    const selectedArchId = localArchetypeIds[randomSeed.plantIndex % localArchetypeIds.length];
    
    const instance = localPool.find(i => i.archetypeId === selectedArchId)!;
    const archetype = archetypes.find(a => a.id === selectedArchId);

    if (!archetype) return null;

    // Dynamically build a list of all valid spotlights for this specific plant
    const options: { title: string; message: string; imageUrl?: string, icon?: string }[] = [];
    
    const isEdible = !/(not edible|inedible|toxic|poisonous|do not eat|unpalatable)/i.test(archetype.flavorProfile || '');
    const isCulinaryCategory = /(vegetable|fruit|herb|edible)/i.test(archetype.category || '');

    // 1. The default check-in is always available
    options.push({
      title: "Plant Check-in",
      message: `How is the ${archetype.commonName} doing? Take a moment to inspect its leaves for pests or signs of stress.`
    });

    if (archetype.usesForLargeHarvests && archetype.usesForLargeHarvests !== 'Unknown') {
      const opt = (isEdible && isCulinaryCategory)
        ? { title: "Culinary Inspiration", message: `When's the last time you tried ${archetype.commonName} in your dinner dish? ${archetype.usesForLargeHarvests}` }
        : { title: "Harvest & Uses", message: `Wondering what to do with your ${archetype.commonName}? ${archetype.usesForLargeHarvests}` };
      options.push(opt, opt); // Double weight
    }

    if (archetype.pruningTips && archetype.pruningTips !== 'Unknown') {
      options.push({ title: "Pruning Reminder", message: `Don't forget to prune your ${archetype.commonName}! ${archetype.pruningTips}` });
    }

    if (isEdible && archetype.flavorProfile && archetype.flavorProfile !== 'Unknown') {
      const opt = { title: "Flavor Profile", message: `Craving something ${archetype.flavorProfile.toLowerCase()}? Check on your ${archetype.commonName}!` };
      options.push(opt, opt); // Double weight
    }

    if (archetype.companionPlants && archetype.companionPlants.length > 0) {
      options.push({ title: "Garden Friends", message: `Did you know ${archetype.commonName} thrives when planted near ${archetype.companionPlants.join(', ')}?` });
    }

    if (archetype.combativePlants && archetype.combativePlants.length > 0) {
      options.push({ title: "Planting Warning", message: `Keep an eye on the neighborhood! ${archetype.commonName} doesn't like growing near ${archetype.combativePlants.join(', ')}.` });
    }

    // Generic, structural traits get standard 1x weight so they don't overpower the fun ones
    if (archetype.sunRequirement && archetype.sunRequirement !== 'Unknown') {
      options.push({ title: "Sunlight Check", message: `Is your ${archetype.commonName} getting the right amount of light? It prefers ${archetype.sunRequirement.toLowerCase()}.` });
    }
    if (archetype.scientificName && archetype.scientificName !== 'Unknown') {
      options.push({ title: "Botanical Trivia", message: `Impress your friends! The scientific name for ${archetype.commonName} is ${archetype.scientificName}.` });
    }
    if (archetype.lifecycle && archetype.lifecycle !== 'Unknown') {
      options.push({ title: "Lifecycle Planning", message: `Since ${archetype.commonName} is a ${archetype.lifecycle.toLowerCase()} plant, keep that in mind when planning your beds for next season.` });
    }

    // Super specific modifier traits get 3x weight!
    if (isEdible && archetype.flavorProfile && /(spicy|hot|heat|peppery|pungent)/i.test(archetype.flavorProfile)) {
      const opt = { title: "Bringing the Heat 🌶️", message: `Ready for a kick? Your ${archetype.commonName} is known for its spicy profile: ${archetype.flavorProfile}` };
      options.push(opt, opt, opt);
    }
    if (isEdible && archetype.flavorProfile && /(sweet|sugary|fruit|juicy)/i.test(archetype.flavorProfile)) {
      const opt = { title: "Sweet Treat 🍓", message: `Craving something sweet? Keep an eye on your ${archetype.commonName}—it's known for its sweet profile: ${archetype.flavorProfile}` };
      options.push(opt, opt, opt);
    }
    
    // If the 50% global fact missed, still add the specific plant's facts into the local pool!
    if (archetype.funFacts && archetype.funFacts.length > 0) {
      const rawFact: string | FunFact = archetype.funFacts[randomSeed.factIndex % archetype.funFacts.length];
      const factObj = typeof rawFact === 'string' ? { fact: rawFact } : rawFact;
      if (factObj.fact && factObj.fact.trim() !== '') {
        const factMessage = factObj.attributedTo ? `"${factObj.fact}" — ${factObj.attributedTo}` : factObj.fact;
        const factIcon = factObj.icon || '💡';
        const factTitle = factObj.title || "Did You Know?";
        for (let i = 0; i < 3; i++) {
          options.push({ title: factTitle, message: factMessage, imageUrl: factObj.imageUrl, icon: factIcon });
        }
      }
    }

    // Select a deterministic random option based on the plant's available data pool
    const selectedOption = options[randomSeed.promptIndex % options.length];

    return { instance, archetype, title: selectedOption.title, message: selectedOption.message, imageUrl: selectedOption.imageUrl, icon: selectedOption.icon };
  }, [activeInstances, archetypes, randomSeed]);

  if (!spotlight) return null;

  useEffect(() => {
    if (spotlight) {
      console.log(`[Spotlight Refresh] Plant: ${spotlight.archetype.commonName} | Prompt Type: ${spotlight.title}`);
    }
  }, [spotlight]);

  return (
    <section className="mb-8 animate-in fade-in duration-500 delay-[125ms]">
      <div className="flex justify-between items-end mb-2">
        <Subtitle className="!mb-0">{spotlight.icon || '🌟'} {spotlight.title}</Subtitle>
        <button 
          onClick={handleShuffle}
          className="text-lg opacity-40 hover:opacity-100 transition-opacity pb-1 active:scale-90"
          title="Shuffle Spotlight"
        >
          🔀
        </button>
      </div>
      <Card onClick={() => onNavigate(spotlight.instance.qrId)} className="cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 flex items-center gap-4 !p-4">
        {spotlight.imageUrl || spotlight.instance.imageUrl || spotlight.archetype.imageUrl ? (
          <img src={spotlight.imageUrl || spotlight.instance.imageUrl || spotlight.archetype.imageUrl} alt={spotlight.archetype.commonName} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-20 h-20 rounded-xl object-cover border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800 flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-3xl flex-shrink-0">🌿</div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight mb-1 truncate">{spotlight.archetype.commonName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic line-clamp-3">{spotlight.message}</p>
        </div>
      </Card>
    </section>
  );
};