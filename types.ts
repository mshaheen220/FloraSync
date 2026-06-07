export interface FunFact {
  title?: string;
  fact: string;
  attributedTo?: string;
  imageUrl?: string;
  icon?: string;
}

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
  funFacts?: FunFact[];
}

export interface JournalEntry {
  id: string;
  timestamp: string; // ISO String
  title?: string;
  note?: string;
  imageUrl?: string;
  height?: string;
  fullness?: string;
  colorAppearance?: string;
  healthIssues?: string;
  growthStage?: string;
  activityType?: string;
  harvestAmount?: string;
  authorName?: string;
  authorImageUrl?: string;
  batchScope?: string;
}

export interface PlantInstance {
  qrId: string;
  archetypeId: string;
  locationId: string;
  datePlanted: string;
  dateHarvested?: string;
  lastWatered: string; // ISO String
  lastFed: string;     // ISO String
  untracked?: boolean; // Exclude from care queues (e.g. established shrubs)
  imageUrl?: string;   // Instance-specific custom thumbnail
  journal?: JournalEntry[];
  pinnedActions?: string[];
}

export interface Location {
  id: string;
  name: string;
  zoneId: string;
  isPinned?: boolean;
  pinnedActions?: string[];
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  evaporationModifier?: number;
  isPinned?: boolean;
  pinnedActions?: string[];
}