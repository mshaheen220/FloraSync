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

The component receives the global `instances`, `archetypes`, `locations`, and `zones` arrays. It computes the `recentActivity` array using a complex `useMemo` hook designed to identify and group related actions.

### 1. Flattening the Journal
First, the engine maps over every plant `instance` in the workspace. It extracts the nested `journal` array and flattens it, decorating each entry with contextual data (e.g., `qrId`, `plantName`, `locationId`) so the entry maintains a reference to its source plant.

### 2. Smart Batching (Grouping)
To prevent the timeline from being flooded by a single bulk action (like "Water All"), the engine implements a grouping heuristic. 
It creates a unique dictionary key for every entry consisting of:
`${entry.timestamp}_${entry.activityType}_${entry.authorName}`

If multiple journal entries share the exact same timestamp, activity type, and author, they are grouped together.

### 3. Scope Resolution
After grouping, the engine maps the groups into final `displayItems`:
* **Single Entries:** If a group only has 1 item, it is rendered as an individual action (e.g., "Michael watered the Sweet Basil") with an `onClick` routing directly to that specific plant (`qrId`).
* **Batch Entries:** If a group has multiple items, the engine analyzes the collective `locationId` values to determine the semantic scope of the batch action:
  * **Global:** If the group length equals the total number of instances, the scope is `"the entire garden"`.
  * **Zone Level:** If the instances span multiple locations but share a single `zoneId`, the scope becomes `"the [Zone Name] zone"`, and the `onClick` handler routes to that Zone's profile.
  * **Location Level:** If all instances share a single `locationId`, the scope becomes `"the [Location Name] location"`, and the `onClick` handler routes to that Location's profile.

### 4. Sorting and Truncation
The final array of display items is sorted by `timestamp` descending. To conserve vertical space on the dashboard, the widget truncates the array to only display the top 5 most recent events globally using `.slice(0, 5)`.