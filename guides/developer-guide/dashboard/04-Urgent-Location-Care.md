---
id: "dev-widget-urgent-location"
title: "Urgent Location Care"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "urgent", "location", "care", "batch"]
---

# Urgent Location Care (Developer Guide)

The Urgent Location Care widget (`src/components/core/dashboard/UrgentLocationCare.tsx`) is designed to streamline bulk watering workflows. Instead of presenting a long list of individual plants, it surfaces the physical locations that contain one or more overdue plants.

## Props & Data Ingestion

The component expects the following pre-calculated data from the parent `Dashboard.tsx`:

* **`overdueLocations`:** An array of `Location` objects. The parent determines this by filtering the main Attention Queue for any items where `isOverdue` is true, and extracting unique `locationId`s.
* **`zones`:** The global array of `Zone` objects, used to format the display name (e.g., "Greenhouse • Shelf A").
* **`currentUser`:** Used for authorization.
* **`onBatchWater`:** A handler function passed from the `useGarden` context.

## Presentation & Authorization Logic

* **Visibility Checks:** The widget returns `null` (completely hiding itself) under two conditions:
  1. The `overdueLocations` array is empty.
  2. The `currentUser.workspaceRole` is `'viewer'` (enforcing that Viewers cannot perform batch actions).
* **Batch Execution:** It renders a horizontal, scrollable list of `Button` elements using the `$variant="batch"` style. Clicking a button triggers the `onBatchWater(locationId)` callback, which instantly resets the hydration timers for all plants mapped to that location.