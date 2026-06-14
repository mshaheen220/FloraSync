---
id: "dev-widget-health-watchlist"
title: "Health Watchlist"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "health", "watchlist", "issues", "pests", "diseases"]
---

# Health Watchlist (Developer Guide)

The Health Watchlist widget (`src/components/core/dashboard/HealthWatchlist.tsx`) highlights active plants that have unresolved issues recorded in their journal.

## Data Ingestion & State Logic

The component receives the raw global `instances`, `archetypes`, `locations`, and `zones` as props. It computes the `sickPlants` array internally using a `useMemo` hook.

### 1. Pre-filtering
It begins by extracting `activeInstances` (excluding harvested and untracked plants).

### 2. Journal Scanning
For each active instance:
1. It verifies the instance has a `journal` array.
2. It sorts the array by `timestamp` descending to find the `latestEntry`.
3. It inspects the `healthIssues` string of this latest entry.

### 3. Resolution Logic
An issue is considered "unresolved" (and therefore appended to the watchlist) if the `healthIssues` string exists AND does NOT exactly match (case-insensitive) any of the following clearing keywords:
* `'none'`
* `'resolved'`
* `'healthy'`

Because the logic only evaluates the *most recent* journal entry, creating a new entry with a clearing keyword effectively overwrites the previous sick status.

### 4. Sorting & Display
The engine calculates `daysAgo` (the time elapsed since the sick journal entry was logged). The final array is sorted by `daysAgo` descending, ensuring the oldest (most ignored) issues appear first in the horizontal carousel. If the resulting array is empty, the component returns `null` to hide itself.