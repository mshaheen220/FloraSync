import { IconName } from '../components/common/Icon';

export const FEED_PROFILE_LABELS: Record<string, string> = {
  'GENERAL_FEED': 'General Feed',
  'BLOOM_BOOST': 'Heavy Feeders',
  'VEG_GROW': 'Leafy & Lush',
  'LOW_FEED': 'Mediterranean & Lean',
  'ACID_LOVERS': 'Acid Lovers'
};

export const ACTIVITY_ICONS: Record<string, IconName> = {
  'Harvest': 'apple',
  'Pruning': 'edit',
  'Watered': 'water',
  'Fed': 'feed',
  'Treatment': 'alert-circle',
  'Weather': 'cloud-sun',
  'Heavy Rain': 'cloud-rain',
  'Pest Sighting': 'bug',
  'Maintenance': 'settings',
  'Planning': 'lightbulb',
  'Alert': 'alert-circle'
};

export const FEED_AMOUNTS = ['Light', 'Normal', 'Heavy'] as const;

export const PLANT_GROWTH_STAGES = [
  'Seedling', 'Vegetative', 'Budding', 'Blooming', 
  'Fruiting', 'Ripening', 'Ready for Harvest', 'Harvested'
] as const;

export const PLANT_FULLNESS_OPTIONS = [
  'Sparse', 'Average', 'Lush', 'Overgrown'
] as const;

export const PLANT_HEALTH_ISSUES = [
  'None', 'Wilting', 'Insect Damage', 'Animal Bites', 
  'Fungus / Disease', 'Sunburn', 'Nutrient Deficiency'
] as const;

export const FUN_FACT_ICONS = [
  { value: 'bug', label: 'Bugs' },
  { value: 'skull', label: 'Dangerous' },
  { value: 'wine', label: 'Drink' },
  { value: 'soup', label: 'Food' },
  { value: 'lightbulb', label: 'Fun Fact' },
  { value: 'alert-circle', label: 'Important' },
  { value: 'smile', label: 'Joke' },
  { value: 'heart', label: 'Love This' },
  { value: 'coins', label: 'Money' },
  { value: 'cat', label: 'Pets' },
  { value: 'dna', label: 'Science' },
  { value: 'help-circle', label: 'Weird Fact / Unknown' },
] as const;