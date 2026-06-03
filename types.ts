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
  whenToPlant: string;
  whenToHarvest: string;
  usesForLargeHarvests: string;
  hardinessZones: number[];
  hardinessNote: string;
  plantingInstructions: string;
  growthRequirements: string;
  lifecycle: string;
}

export interface JournalEntry {
  id: string;
  timestamp: string; // ISO String
  title?: string;
  note?: string;
  imageUrl?: string;
}

export interface PlantInstance {
  qrId: string;
  archetypeId: string;
  locationId: string;
  datePlanted: string;
  dateHarvested?: string;
  lastWatered: string; // ISO String
  lastFed: string;     // ISO String
  imageUrl?: string;   // Instance-specific custom thumbnail
  journal?: JournalEntry[];
}

export interface Location {
  id: string;
  name: string;
  zoneId: string;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}