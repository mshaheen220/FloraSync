export interface PlantArchetype {
  id: string;
  commonName: string;
  scientificName: string;
  category: string;
  sunRequirement: string;
  waterIntervalDays: number;
  feedingIntervalDays: number;
  whatToFeed: string;
  pruningTips: string;
  flavorProfile: string;
  companionPlants: string[];
  combativePlants: string[];
  growthHabit: string;
  daysToHarvest: number;
  imageUrl?: string;
}

export interface PlantInstance {
  qrId: string;
  archetypeId: string;
  locationId: string;
  datePlanted: string;
  lastWatered: string; // ISO String
  lastFed: string;     // ISO String
}

export interface Location {
  id: string;
  name: string;
  zone: string;
}