import { createContext, useContext } from 'react';
import { PlantInstance, PlantArchetype, Location, Zone, PrintQueueItem, User, GardenProfile, JournalEntry } from '../../types';

export interface GardenContextType {
  // State Data
  instances: PlantInstance[];
  archetypes: PlantArchetype[];
  locations: Location[];
  zones: Zone[];
  printQueue: PrintQueueItem[];
  setPrintQueue: React.Dispatch<React.SetStateAction<PrintQueueItem[]>>;
  gardenJournal: JournalEntry[];
  setGardenJournal: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  currentUser?: User | null;
  gardenProfile?: GardenProfile | null;
  
  // Instance Actions
  onWater: (qrId: string) => void;
  onFeed: (qrId: string) => void;
  onRegister: (qrId: string, identifier: string, isNew: boolean, locationId: string, isNewLocation?: boolean, zoneId?: string, isNewZone?: boolean, imageUrl?: string) => void;
  onUpdateInstance: (qrId: string, updates: Partial<PlantInstance>) => void;
  onDeleteInstance: (qrId: string) => void;
  
  // Batch Actions
  onBatchWaterLocation: (locationId: string) => void;
  onBatchFeedLocation: (locationId: string) => void;
  onBatchWaterZone: (zoneId: string) => void;
  onBatchFeedZone: (zoneId: string) => void;
  onBatchWaterAll: () => void;
  onBatchFeedAll: () => void;
  onLogRain?: () => Promise<number | void>;

  // Environment Actions
  onRegisterLocation: (id: string, name: string, zoneId: string) => void;
  onAddLocation: (name: string, zoneId: string) => void;
  onUpdateLocation: (id: string, updates: Partial<Location>) => void;
  onDeleteLocation: (id: string) => void;
  onRegisterZone: (id: string, name: string) => void;
  onAddZone: (name: string, isCovered?: boolean, description?: string, evaporationModifier?: number) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onDeleteZone: (id: string) => void;
  onAddArchetype: (newArchetype: PlantArchetype) => void;
  onUpdateArchetype: (id: string, updates: Partial<PlantArchetype>) => void;
  onDeleteArchetype: (id: string) => void;

  // Print Queue Actions
  onQueuePrint: (targetId: string, type: 'plant' | 'location' | 'zone', title: string, subtitle: string, action?: 'none' | 'water' | 'feed') => void;
}

export const GardenContext = createContext<GardenContextType | null>(null);

export const useGarden = () => {
  const context = useContext(GardenContext);
  if (!context) {
    throw new Error('useGarden must be used within a GardenProvider');
  }
  return context;
};