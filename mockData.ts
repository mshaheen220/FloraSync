import { PlantArchetype, PlantInstance, Location } from './types';

export const mockArchetypes: PlantArchetype[] = [
  {
    id: 'sweet-basil',
    commonName: 'Sweet Basil',
    scientificName: 'Ocimum basilicum',
    category: 'Herb',
    sunRequirement: 'Full Sun',
    waterIntervalDays: 2,
    feedingIntervalDays: 28,
    whatToFeed: 'Balanced organic liquid seaweed or fish emulsion high in nitrogen to encourage lush, continuous leaf production.',
    pruningTips: 'Pinch off the top central stem just above a leaf node once the plant reaches 6 inches tall to force it to branch out into a bush. Always pinch off emerging flower buds immediately, or the leaves will turn bitter.',
    flavorProfile: 'Warm, sweet, and aromatic with notes of pepper, anise, and cloves.',
    companionPlants: ['Tomatoes', 'Peppers', 'Oregano'],
    combativePlants: ['Rue', 'Sage'],
    growthHabit: 'Bush',
    daysToHarvest: 60,
    imageUrl: '/images/herbs/sweet-basil.jpg'
  },
  {
    id: 'cherry-tomato',
    commonName: 'Cherry Tomato',
    scientificName: 'Solanum lycopersicum',
    category: 'Vegetable',
    sunRequirement: 'Full Sun',
    waterIntervalDays: 3,
    feedingIntervalDays: 7,
    whatToFeed: 'High phosphorus and potassium tomato feed.',
    pruningTips: 'Remove suckers from the leaf axils.',
    flavorProfile: 'Sweet, bright, and slightly tart.',
    companionPlants: ['Basil', 'Marigold', 'Garlic'],
    combativePlants: ['Cabbage', 'Fennel'],
    growthHabit: 'Vine',
    daysToHarvest: 65,
    imageUrl: '/images/vegetables/cherry-tomato.jpg'
  },
  {
    id: 'monstera',
    commonName: 'Monstera Deliciosa',
    scientificName: 'Monstera deliciosa',
    category: 'Houseplant',
    sunRequirement: 'Bright Indirect',
    waterIntervalDays: 7,
    feedingIntervalDays: 30,
    whatToFeed: 'Liquid houseplant fertilizer diluted to half strength.',
    pruningTips: 'Prune dead or yellowing leaves at the base.',
    flavorProfile: 'N/A',
    companionPlants: ['Philodendron', 'Pothos'],
    combativePlants: [],
    growthHabit: 'Climbing',
    daysToHarvest: 0
  }
];

export const mockLocations: Location[] = [
  { id: 'greenhouse-shelf-a', name: 'Shelf A', zone: 'Greenhouse' },
  { id: 'raised-bed-1', name: 'Raised Bed 1', zone: 'Garden' },
];

// Dynamically generating ISO strings so the "Attention Queue" logic always functions nicely out of the box
const today = new Date();
const subtractDays = (days: number) => new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const mockInstances: PlantInstance[] = [
  { qrId: 'qr-001', archetypeId: 'sweet-basil', locationId: 'greenhouse-shelf-a', datePlanted: subtractDays(30), lastWatered: subtractDays(3), lastFed: subtractDays(10) },
  { qrId: 'qr-002', archetypeId: 'cherry-tomato', locationId: 'raised-bed-1', datePlanted: subtractDays(45), lastWatered: subtractDays(1), lastFed: subtractDays(8) },
  { qrId: 'qr-003', archetypeId: 'monstera', locationId: 'greenhouse-shelf-a', datePlanted: subtractDays(100), lastWatered: subtractDays(8), lastFed: subtractDays(20) },
  // Mocking an unregistered plant tag to trigger registration onboarding dynamically:
  // E.g. URL simulating "?qr=qr-045&action=water" will trigger onboarding form because 
  // it does not exist in this instances list yet!
];