---
id: "dev-widget-garden-pulse"
title: "Garden Pulse"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "pulse", "social", "activity", "recent", "log"]
---

# Garden Pulse (Developer Guide)

The Garden Pulse widget (`src/components/core/dashboard/GardenPulse.tsx`) functions as an activity feed, aggregating the most recent journal entries from across the entire workspace into a unified timeline.

## Data Ingestion & State Logic

The component receives the global `instances`, `archetypes`, `locations`, `zones`, and the `gardenJournal` arrays. It computes the `recentActivity` array using a complex `useMemo` hook designed to identify and group related actions across all ecosystem levels.

### 1. Flattening the Journal
First, the engine maps over every plant `instance`, `location`, `zone`, and the global `gardenJournal` in the workspace. It extracts their nested journals and flattens them, decorating each entry with contextual data (e.g., `qrId`, `sourceType`, `batchScope`) so the entry maintains a reference to its hierarchical origin.

### 2. Smart Batching (Grouping)
To prevent the timeline from being flooded by a single bulk action (like "Water All"), the engine implements a grouping heuristic. 
It uses "fuzzy" minute-based matching to securely catch events that happen within backend processing loops:
`const timeKey = Math.floor(new Date(entry.timestamp).getTime() / 60000);`

It creates a unique dictionary key for every entry prioritizing the backend's defined scope:
`` macro_${timeKey}_${entry.activityType}_${entry.batchScope} ``

If multiple journal entries (whether native macro-events or trickle-down plant events) share the same minute window, activity type, and scope, they are perfectly grouped together into a single unified event.

### 3. Scope Resolution
After grouping, the engine maps the groups into final `displayItems`:
* **Native/Trickle-Down Macro Entries:** If the backend explicitly defined a `batchScope`, the engine respects it out of the box and renders it as a unified batch event.
* **Single Entries:** If a group only has 1 item and no `batchScope`, it is rendered as an individual action (e.g., "Michael watered the Sweet Basil") with an `onClick` routing directly to that specific plant.
* **Legacy Heuristic (Rapid Taps):** If the user rapidly tapped several individual plants without triggering a native macro event, the engine analyzes the collective `locationId` values of the group to retroactively determine the semantic scope:
  * **Global:** If the group length equals the total number of instances, the scope is `"the entire garden"`.
  * **Zone Level:** If the instances span multiple locations but share a single `zoneId`, the scope becomes `"the [Zone Name] zone"`, and the `onClick` handler routes to that Zone's profile.
  * **Location Level:** If all instances share a single `locationId`, the scope becomes `"the [Location Name] location"`, and the `onClick` handler routes to that Location's profile.

### 4. Sorting and Truncation
The final array of display items is sorted by `timestamp` descending. To conserve vertical space on the dashboard, the widget truncates the array to only display the top 5 most recent events globally using `.slice(0, 5)`.