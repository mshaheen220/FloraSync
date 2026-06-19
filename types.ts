export interface User {
  id: string;
  username: string;
  role?: string;
  name: string;
  imageUrl?: string;
  accesses?: { id: string, name: string, role: string }[];
  workspaceRole?: string;
  theme?: string;
  colorTheme?: string;
  iconTheme?: string;
  installedAddons?: string[];
  activeAddons?: string[];
  addonSettings?: Record<string, any>;
  activeAddonManifests?: AddonManifest[];
}

export interface AddonAction {
  id: string;
  label: string;
  entryPoint: string;
}

export interface AddonSettingField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  options?: string[]; // Used if type is 'select'
  defaultValue: any;
}

export interface JournalActivityType {
  value: string;
  label: string;
  badgeLabel: string;
  isRoutine?: boolean;
  isHidden?: boolean;
  iconUrl?: string;
}

export interface AddonManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  status?: 'draft' | 'published' | 'deprecated';
  entryPoints?: string[];
  requiresInternet?: boolean;
  installScript?: string;
  uninstallScript?: string;
  executeScript?: string;
  settingsSchema?: AddonSettingField[];
  actions?: AddonAction[];
  journalActivityTypes?: JournalActivityType[];
}

export interface GardenProfile {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface Workspace {
  id: string;
  name: string;
  imageUrl?: string;
  role: string;
}

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
  preferredNutrientProfile?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS';
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
  targetId?: string;
  targetType?: 'plant' | 'location' | 'zone' | 'garden';
  durationMinutes?: number;
  feedType?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS' | 'GENERAL_FEED';
  feedAmount?: 'Light' | 'Normal' | 'Heavy';
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
  pinnedActions?: Record<string, string[]>;
  rainDeficit?: {
    timestamp: string;
    deficitMs: number;
  };
  harvests?: Harvest[];
}

export interface Harvest {
  id: string; // Unique ID for the harvest event
  date: string; // ISO string
  yieldAmount: number;
  yieldUnit: string; // e.g., 'grams', 'ounces', 'items'
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  notes?: string;
}

export interface Location {
  id: string;
  name: string;
  zoneId: string;
  isPinned?: boolean;
  journal?: JournalEntry[];
  imageUrl?: string;
  pinnedActions?: Record<string, string[]>;
  activeNutrientProfile?: 'LOW_FEED' | 'VEG_GROW' | 'BLOOM_BOOST' | 'ACID_LOVERS';
  feedingModifier?: number;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  evaporationModifier?: number;
  isCovered?: boolean;
  journal?: JournalEntry[];
  isPinned?: boolean;
  pinnedActions?: Record<string, string[]>;
}

export interface PrintQueueItem {
  id: string;
  targetId: string;
  type: 'plant' | 'location' | 'zone';
  action: 'none' | 'water' | 'feed';
  title: string;
  subtitle: string;
}