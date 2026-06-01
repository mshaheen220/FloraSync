export interface PlantArchetype {
  id: string;
  commonName: string;
  sunRequirement: string;
  waterIntervalDays: number;
  feedingIntervalDays: number;
  pruningTips: string;
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