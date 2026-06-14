---
id: "dev-widget-approaching-harvest"
title: "Approaching Harvest"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "harvest", "countdown", "bloom", "milestones"]
---

# Approaching Harvest (Developer Guide)

The Approaching Harvest widget (`src/components/core/dashboard/ApproachingHarvest.tsx`) acts as an automated countdown timer for active plants, transitioning them onto the user's radar as they near maturity.

## Data Ingestion & State Logic

The component accepts `activeInstances` and `archetypes` as props. It computes the `approachingHarvest` array internally using a `useMemo` hook.

### 1. Calculation Base
For each active instance, it retrieves the `daysToHarvest` integer from the plant's associated Archetype. It skips the plant if `daysToHarvest` is `0` or if the instance lacks a `datePlanted`.

### 2. Timeline Math
The engine relies on Midnight-normalized timestamps to ensure daily accuracy regardless of the exact hour a plant was logged:
1. It normalizes `todayMs` to 00:00:00.
2. It normalizes the `plantDateMs` to 00:00:00.
3. It calculates `harvestDateMs` by adding `daysToHarvest` (converted to milliseconds) to `plantDateMs`.
4. It computes `daysUntil` by subtracting `todayMs` from `harvestDateMs` and dividing by milliseconds-in-a-day.

### 3. The Activation Window
The widget implements a specific time window for visibility. A plant is only pushed into the `approachingHarvest` array if `daysUntil` falls within the range of `<= 14` AND `>= -14`. 
* **`14 to 1`:** Upcoming warning phase.
* **`0`:** Target date reached.
* **`-1 to -14`:** The grace period (past due).
Any plant outside this 28-day window is excluded. 

The resulting array is sorted by `daysUntil` ascending (most urgent/past-due first). If the array is empty, the component returns `null` and remains hidden.