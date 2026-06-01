import { PlantArchetype, PlantInstance, Location } from './types';

export const mockArchetypes: PlantArchetype[] = [
  {
    id: 'sweet-basil',
    commonName: 'Sweet Basil',
    sunRequirement: 'Full Sun',
    waterIntervalDays: 2,
    feedingIntervalDays: 14,
    pruningTips: 'Pinch off top leaves to encourage bushiness.',
  },
  {
    id: 'cherry-tomato',
    commonName: 'Cherry Tomato',
    sunRequirement: 'Full Sun',
    waterIntervalDays: 3,
    feedingIntervalDays: 7,
    pruningTips: 'Remove suckers from the leaf axils.',
  },
  {
    id: 'monstera',
    commonName: 'Monstera Deliciosa',
    sunRequirement: 'Bright Indirect',
    waterIntervalDays: 7,
    feedingIntervalDays: 30,
    pruningTips: 'Prune dead or yellowing leaves at the base.',
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