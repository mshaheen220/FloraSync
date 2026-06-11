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
}

export interface Location {
  id: string;
  name: string;
  zoneId: string;
  isPinned?: boolean;
  pinnedActions?: Record<string, string[]>;
}

export interface Zone {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  evaporationModifier?: number;
  isCovered?: boolean;
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