---
id: "dev-widget-the-nursery"
title: "The Nursery"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "nursery", "seedlings", "transplants", "new"]
---

# The Nursery (Developer Guide)

The Nursery widget (`src/components/core/dashboard/Nursery.tsx`) is a specialized carousel designed to highlight newly planted instances (seedlings, fresh transplants, or recently cataloged acquisitions). 

## Data Ingestion & State Logic

The component receives `activeInstances` and `archetypes` as props. It filters and sorts this data internally using a `useMemo` hook to produce the `nurseryPlants` array.

### 1. Calculation Base
The engine relies on Midnight-normalized timestamps to ensure daily accuracy, regardless of the exact hour a plant was logged.
1. It normalizes the current date (`todayMs`) to 00:00:00.
2. It iterates through each `activeInstance`. If the instance lacks a `datePlanted`, it is immediately skipped.
3. It normalizes the `datePlanted` timestamp (`plantDateMs`) to 00:00:00.

### 2. The Incubation Window
It calculates `daysSince` by subtracting `plantDateMs` from `todayMs` and converting it to days.
The widget implements a strict 14-day incubation window. A plant is only appended to the `nursery` array if:
`daysSince <= 14 && daysSince >= 0`

* **Day 0:** Planted today.
* **Day 14:** The final day of Nursery visibility.
* **Day 15+:** The plant "graduates" and is ignored by the engine.

### 3. Rendering
The resulting array is sorted by `daysSince` ascending, ensuring the youngest plants (Day 0) appear first in the horizontal scroll view. If the `nurseryPlants` array is empty, the component returns `null` and remains hidden from the dashboard.