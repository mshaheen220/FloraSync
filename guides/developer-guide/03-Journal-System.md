---
id: "dev-journal"
title: "Architecture: Master Journal & Event Sourcing"
category: "Developer Guide"
tags: ["journal", "events", "timeline", "trickle-down", "images", "watchlists"]
---

# Journal System (Developer Architecture)

This document outlines the technical implementation of FloraSync's journal system, which functions as an event-sourcing ledger for the garden.

## 1. Data Model: `JournalEntry`

Every action, observation, or environmental change is recorded as a `JournalEntry`. Instead of unstructured text, these entries act as structured snapshots of state.

```typescript
// types.ts (abbreviated)
export interface JournalEntry {
  id: string;
  timestamp: string;       // ISO String
  title?: string;
  note?: string;
  imageUrl?: string;       // Base64 encoded, compressed image string
  
  // Structured Observations
  height?: string;
  fullness?: string;
  colorAppearance?: string;
  healthIssues?: string;   // 'None', 'Resolved', 'Healthy', or custom issue
  growthStage?: string;    // e.g., 'Seedling', 'Blooming'
  harvestAmount?: string;  // E.g., '12 oz'
  
  // System Metadata
  activityType?: string;   // 'Watered', 'Fed', or Addon-defined types
  authorName?: string;
}
```

## 2. Dynamic Feeds & Trickle-Down Inheritance

As covered in the Inventory Architecture, FloraSync avoids duplicating database records by using a "Trickle-Down" architecture. A `JournalEntry` is attached strictly to the entity it was performed on (Garden, Zone, Location, or Plant).

When rendering context-aware feeds (like `PlantJournal.tsx`), the application dynamically concatenates the parent entity arrays and maps a `sourceType` attribute to them:

```typescript
// src/components/inventory/PlantJournal.tsx
const allEvents = [
  ...(instance.journal || []).map(e => ({ ...e, sourceType: 'plant' })),
  ...(location?.journal || []).map(e => ({ ...e, sourceType: 'location' })),
  ...(zone?.journal || []).map(e => ({ ...e, sourceType: 'zone' })),
  ...(gardenJournal || []).map(e => ({ ...e, sourceType: 'garden' }))
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
```

**Permission Lock:** The UI strictly uses the `sourceType` to determine edit/delete permissions. Users cannot delete a "Watered the Greenhouse" (`sourceType: 'zone'`) event from an individual plant's profile.

## 3. Routine Care Filtering

To keep long-lived journals readable, users can toggle "Show Routine Care" to filter out high-frequency events.

**Implementation detail:**
The filtering engine maintains a list of `routineTypes` (hardcoded types like `Watered` and `Fed`, plus dynamically loaded types from Addon Manifests where `isRoutine: true`). If the toggle is off, any entry whose `activityType` matches a string in the `routineTypes` array is removed from the rendered feed.

## 4. Derived Dashboard States (Health Watchlist)

Widgets on the Dashboard don't rely on separate database tables; they calculate state derived directly from the most recent journal entries.

**Health Watchlist (`src/components/core/dashboard/HealthWatchlist.tsx`):**
To build the "Urgent Care / Health Watchlist," the system iterates through all active plant instances and reads their most recent `JournalEntry`. If the `healthIssues` property exists and does not equal `'None'`, `'Resolved'`, or `'Healthy'` (case-insensitive), the plant is automatically pushed onto the user's Watchlist queue.

## 5. Image Compression & Cover Photos

**Photo Uploads:** Because FloraSync operates primarily locally and offline-first without a cloud bucket, all images are heavily downscaled, compressed to JPEG or WebP via the browser's Canvas API (`src/utils/imageCompression.ts`), and stored as Base64 strings directly inside the SQLite database or JSON backups.

**Set as Cover Photo:** When a user clicks "Set as Cover Photo" on a journal entry, the `SharedJournalFeed` triggers an `onSetCoverPhoto` callback. This copies the Base64 string from `JournalEntry.imageUrl` and overwrites the target entity's `imageUrl` (e.g., `PlantInstance.imageUrl` or `Zone.imageUrl`), instantly updating the thumbnail shown across the rest of the application.
