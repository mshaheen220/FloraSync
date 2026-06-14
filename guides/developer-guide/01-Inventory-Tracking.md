---
id: "dev-inventory"
title: "Architecture: Inventory & Plant Tracking"
category: "Developer Guide"
tags: ["inventory", "tracking", "plants", "hydration", "math", "journal"]
---

# Inventory Tracking (Developer Architecture)

This document details how FloraSync manages physical plant inventory. Rather than storing massive, duplicative documents for every seed planted, the system relies on a split data model, mathematical projection, and render-time log merging.

## 1. Data Model: Archetypes vs. Instances

To minimize database size and allow global updates, plant data is strictly divided into two entities:

*   **`PlantArchetype` (The Dictionary):** A static or user-defined template representing a species or variety (e.g., "Tomato (Roma)"). It holds baseline biological constants like `waterIntervalDays`, `sunRequirement`, and `daysToHarvest`.
*   **`PlantInstance` (The Inventory):** A lightweight object representing a single physical plant in the real world. It tracks *state* rather than biological rules.

```typescript
// types.ts (abbreviated)
export interface PlantInstance {
  qrId: string;           // The unique physical tag URL identifier
  archetypeId: string;    // Links to the biological rules
  locationId: string;     // Links to the physical world modifier
  datePlanted: string;
  lastWatered: string;
  lastFed: string;
  untracked?: boolean;    // "Unmonitored / Rain-Fed" flag
  journal?: JournalEntry[];
}
```

## 2. Dynamic Hydration Math

FloraSync does not store a boolean "isThirsty" flag in the database. Instead, hydration is a projected mathematical state calculated on the fly. 

When a component needs to know if a plant is overdue for watering, it calculates an interval using three factors:
1.  **Baseline:** The Archetype's `waterIntervalDays`.
2.  **Sun Modifier:** Derived from the Archetype's `sunRequirement` (e.g., "Full Sun" dries out 20% faster).
3.  **Zone Modifier:** Inherited from the Instance's parent `Zone` (`evaporationModifier`).

**Implementation detail (e.g., `src/components/inventory/PlantInstanceCard.tsx`):**
```typescript
const zoneModifier = zone?.evaporationModifier || 1.0;
const sunModifier = sunReq.includes('full sun') ? 1.2 : (sunReq.includes('shade') && !sunReq.includes('part') ? 0.8 : 1.0);

// The actual millisecond interval until the plant dries out:
const intervalMs = ((archetype?.waterIntervalDays || 1) * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier);
```

**The Attention Queues:**
Widgets like the "Needs Watering" dashboard queue compare `Date.now()` to the instance's `lastWatered + intervalMs`. Once `Date.now()` exceeds that threshold, the hydration ratio drops to 0%, and the plant is dynamically surfaced to the user.

## 3. The "Trickle-Down" Rendered Journal

A core philosophy of FloraSync is the elimination of data entry friction. If a user waters an entire "Greenhouse" (Zone), the system writes exactly **one** `JournalEntry` to `Zone.journal`. It does *not* write 50 identical entries to the individual `PlantInstance`s.

To make the UI feel cohesive, the `PlantJournal` component rebuilds the timeline at render time by combining arrays.

**Implementation detail (`src/components/inventory/PlantJournal.tsx`):**
When viewing a specific Plant Profile, the timeline concatenates:
1.  `instance.journal` (Notes written specifically on this plant)
2.  `location.journal` (Events applied to the shelf it sits on)
3.  `zone.journal` (Events applied to the room it sits in)
4.  `gardenJournal` (Global events, like "Feed All")

```typescript
// Conceptual merge logic inside PlantJournal
const mergedTimeline = [
  ...(instance.journal || []).map(e => ({ ...e, sourceType: 'plant' })),
  ...(location?.journal || []).map(e => ({ ...e, sourceType: 'location' })),
  ...(zone?.journal || []).map(e => ({ ...e, sourceType: 'zone' })),
  ...(gardenJournal || []).map(e => ({ ...e, sourceType: 'garden' }))
].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
```

This ensures maximum historical visibility for the user with minimal storage overhead.

## 4. Milestone Tracking & Lifecycle

Like hydration, milestones (like estimated harvest dates) are mathematically projected. If a plant has a `datePlanted` of May 1st, and its `archetypeId` specifies `daysToHarvest: 60`, the profile calculates and displays a target date of June 30th. If the plant is marked as perennial, the UI rolls the anniversary forward automatically.
