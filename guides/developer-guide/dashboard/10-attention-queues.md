---
id: "dev-feature-attention-queues"
title: "Smart Math: Care Queues"
category: "Developer Guide"
tags: ["queues", "watering", "feeding", "math", "evaporation", "modifiers", "sun exposure"]
---

# Smart Math: Care Queues (Developer Guide)

FloraSync employs an intelligent algorithm to calculate the urgency of care tasks (watering and feeding). This logic is centralized in the overarching `Dashboard.tsx` component to power the Attention Queue and is also utilized internally by widgets like `HungryPlants.tsx`.

## The `attentionQueue` Calculation Engine

The primary engine maps over all `trackedInstances` (plants that have not been harvested and are not flagged as `untracked`). For each plant, it computes a normalized `ratio` indicating its hydration status.

### 1. Base Intervals
The algorithm first retrieves the baseline `waterIntervalDays` (and similarly, `feedingIntervalDays`) from the plant's associated `PlantArchetype` blueprint.

### 2. Environmental Modifiers
The base interval is then dynamically adjusted based on the plant's physical location and its inherent traits:
* **Zone Modifier (`zone.evaporationModifier`):** If the plant resides in a location assigned to a Zone, the base interval is divided by the zone's `evaporationModifier` (e.g., a modifier of `1.5` in a hot zone will decrease the interval, meaning it dries out faster). Defaults to `1.0`.
* **Sun Modifier:** The engine evaluates the archetype's `sunRequirement` string:
  * `"full sun"` assigns a modifier of `1.2` (dries faster).
  * `"shade"` assigns a modifier of `0.8` (dries slower).
  * Defaults to `1.0`.

The final target interval in milliseconds is calculated as:
`intervalMs = (baseDays * 24 * 60 * 60 * 1000) / (zoneModifier * sunModifier)`

### 3. Ratio Computation
The engine determines the time elapsed since the plant's `lastWatered` timestamp.

If the plant was recently watered by a *partial* rain event (e.g., a 15-minute sprinkle), the engine checks for the presence of a `rainDeficit` object. If `rainDeficit.timestamp` matches `lastWatered`, the `deficitMs` is added to the total elapsed time. This allows the plant to retain its true `lastWatered` display date in the UI while mathematically simulating that it was not fully hydrated.

It computes the `ratio` using:
`ratio = Math.max(0, 1 - (effectiveDeficit / intervalMs))`

* A ratio of `1.0` indicates maximum hydration/nutrition (just serviced).
* As time passes, the ratio approaches `0`.
* A ratio of `<= 0` flags the plant as `isOverdue: true`.

### 4. Queue Sorting
The entire `attentionQueue` array is sorted by this `ratio` in ascending order. This guarantees that plants with the lowest ratio (most critical need) bubble to the top of the queue arrays passed to the various Dashboard widgets.

### 5. Feeding Math & Nutrient Deficits
The "Hungry Plants" calculations operate similarly but include Location-level `feedingModifier`s and a specific "Nutrient Deficit" penalty.
* **Target Interval:** `intervalMs = (archetype.feedingIntervalDays * 24 * 60 * 60 * 1000) * location.feedingModifier`
* **Amount Modifier:** The engine sets the baseline `fullnessStart` to `1.0` (Normal), `0.5` (Light), or `1.2` (Heavy) based on the `feedAmount` of the most recent `Fed` journal entry.
* **Deficit Checking:** The engine then checks the `feedType` parameter of that same entry.
* **The Penalty:** If the `feedType` does NOT match the archetype's `preferredNutrientProfile` (and is NOT `GENERAL_FEED`), it applies a 60% deficit penalty, multiplying the `fullnessStart` by `0.4`. 
* **The Result:** The formula `ratio = Math.max(0, fullnessStart - (timeElapsed / intervalMs))` means a penalized plant will reach `0` (overdue) 60% faster than normal, accelerating its return to the queue to correct the diet.