---
id: "dev-view-dashboard"
title: "The Command Center (Dashboard)"
category: "Developer Guide"
tags: ["dashboard", "architecture", "attention queue", "widgets", "addons"]
---

# The Command Center (Dashboard) - Developer Guide

The Dashboard (`src/components/core/Dashboard.tsx`) acts as the primary data aggregation layer for the FloraSync application. Instead of being a single monolithic view, it is a modular, widget-based engine that sorts and prioritizes actionable data.

## Architecture & Widget Iteration

The Dashboard does not hardcode its layout. It relies on two state arrays persisted to the user's `localStorage` (keyed by `currentUser.id` to support shared devices/multi-tenant scenarios):

* **`widgetOrder`:** An array of string IDs defining the sequential render order.
* **`hiddenWidgets`:** An array of string IDs determining which widgets to bypass during rendering.

During rendering, the component maps over `widgetOrder`. For each ID, if it isn't in `hiddenWidgets`, the engine mounts the corresponding specialized widget component (e.g., `NeedsWatering`, `Nursery`).

## Data Aggregation

The Dashboard fetches the raw global state (`instances`, `archetypes`, `locations`, `zones`) via the `useGarden()` hook context. Before passing data down to the individual widgets, the parent component performs critical filtering to reduce overhead:

* **`activeInstances`:** Filters out any plants that have already been harvested (`!i.dateHarvested`), ensuring historical plants don't clutter the active queues.
* **`trackedInstances`:** Further filters `activeInstances` to exclude established plants flagged as `untracked` (e.g., mature shrubs that no longer require algorithmic care schedules).

## The "Attention Queue" Engine

The core intelligence of the Dashboard is the Attention Queue calculation. This engine cross-references multiple data models to dynamically calculate urgency. 

For each `trackedInstance`, it calculates a `ratio`:
1. **Base Interval:** Pulls the `waterIntervalDays` from the plant's Archetype.
2. **Modifiers:** Adjusts the interval based on the physical environment:
   * **Zone Modifier:** Multiplies the interval by the `zone.evaporationModifier`.
   * **Sun Modifier:** Checks the archetype's `sunRequirement` (e.g., "full sun" increases water needs, "shade" decreases them).
3. **Ratio Calculation:** Calculates the time elapsed since `lastWatered`. The `ratio` is `1 - (timeElapsed / intervalMs)`. 
   * A `ratio` of `1.0` means just watered. 
   * A `ratio` of `<= 0` means the plant is overdue.
4. **Sorting:** The entire queue is sorted by this ratio in ascending order, pushing the most critical plants to index `0`.

## Addon Widget Injection

The Dashboard supports dynamic injection of widgets supplied by external plugins. 
It uses Vite's `import.meta.glob` to resolve execute scripts across all installed addons.

If the engine encounters a widget ID prefixed with `addon_`, it mounts the `DashboardAddonWidget` wrapper. This wrapper utilizes React's `Suspense` and dynamic `import()` to asynchronously fetch and render the plugin's exported `components.dashboard` property, safely handling load failures without crashing the core UI.