---
id: "dev-widget-care-queues"
title: "Needs Watering & Hungry Plants"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "water", "feed", "hungry", "thirsty", "fertilizer"]
---

# Needs Watering & Hungry Plants (Developer Guide)

The "Needs Watering" and "Hungry Plants" queues represent the core daily action items on the Dashboard. Though they appear similar to the user, they handle data fetching and empty states differently.

## Needs Watering (`NeedsWatering.tsx`)

* **Data Source:** This widget is purely presentational. It receives an `overduePlants` array directly from the parent `Dashboard.tsx`, which relies on the complex Attention Queue engine (accounting for zone modifiers and sun requirements) to determine if a plant is overdue for water.
* **Empty State:** If the `overduePlants` array is empty, the widget renders a celebratory empty state card ("All plants are perfectly hydrated!").
* **Rendering:** It iterates over the array and renders the generic `PlantInstanceCard` component using the `compact` flag for a denser layout.

## Hungry Plants (`HungryPlants.tsx`)

* **Data Source:** Unlike the watering widget, this component receives the raw `trackedInstances` array and performs its own urgency calculation internally via a `useMemo` hook.
* **Urgency Logic:** It calculates a `ratio` by comparing the time elapsed since `lastFed` against the plant archetype's `feedingIntervalDays` modified by the location's `feedingModifier`. The starting fullness is determined by the `feedAmount` ('Light'=0.5, 'Normal'=1.0, 'Heavy'=1.2), and then steeply penalized (multiplied by 0.4) if the most recent feeding log used a `feedType` that contradicts the archetype's preferred diet.
* **Location Auditor:** The engine checks for conflicts between the `archetype.preferredNutrientProfile` and `location.activeNutrientProfile`. If both are defined and they conflict, an `isSuboptimalLocation` flag triggers a bright red warning badge in the UI, dynamically suggesting a target location that matches the plant's profile.
* **Empty State:** If the `hungryPlants` array is empty, the component returns `null`, completely hiding the widget from the Dashboard rather than showing an empty state card.
* **Rendering:** It uses a custom card layout specifically designed to surface the `whatToFeed` property from the `PlantArchetype` (or defaults to "Balanced fertilizer"), ensuring the user knows exactly what nutrients to provide without navigating to the plant's detail view.