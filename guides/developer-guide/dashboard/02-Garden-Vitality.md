---
id: "dev-widget-garden-vitality"
title: "Garden Vitality"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "vitality", "stats", "health"]
---

# Garden Vitality (Developer Guide)

The Garden Vitality widget (`src/components/core/dashboard/GardenVitality.tsx`) is a purely presentational (dumb) component. It does not calculate state directly; instead, it relies on the parent `Dashboard.tsx` engine to supply pre-calculated aggregated metrics.

## Props & Data Ingestion

The widget expects the following pre-computed props:

* **`averageHydration` & `averageNutrition`:** Numeric percentages.
* **`trackedCount` & `activeCount`:** Integers representing the current plant inventory footprint.
* **`mostPopulatedZone`:** An object containing the `id` and `name` of the densest zone.

## Presentation Logic

* **Warning Thresholds:** The component implements simple visual thresholds. If either `averageHydration` or `averageNutrition` falls to `<= 30`, the Tailwind text color classes automatically switch from the standard primary/blue to `text-amber-500` to indicate a warning state.
* **Navigation Shortcuts:** The widget binds `onClick` handlers to the statistic cards. 
  * Tapping the active plants card invokes `onNavigateInventory()`.
  * Tapping the Top Zone card invokes `onNavigateZone()` using the ID passed in the `mostPopulatedZone` prop.