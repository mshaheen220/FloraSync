---
id: "dev-widget-quick-actions"
title: "Quick Actions"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "quick actions", "batch actions", "water all", "rain"]
---

# Quick Actions (Developer Guide)

The Quick Actions widget (`src/components/core/dashboard/QuickActions.tsx`) serves as the primary gateway for users to execute bulk operations (batch actions) and rapidly navigate the application. 

## Authorization

The widget strictly enforces role-based access control upon render. It immediately checks `hasPermission(currentUser, 'perform_actions')`. If the user is a `viewer`, the component returns `null` and the widget is entirely hidden from the dashboard.

## Global Actions

By default, the widget mounts static shortcuts for global routines if their corresponding handler functions are passed as props from the parent context:
* **Water All** (`onBatchWaterAll`)
* **Log Rain** (`onLogRain` - only renders if the function is provided)
* **Feed All** (`onBatchFeedAll`)

## Dynamic Action Pinning

The core feature of Quick Actions is the dynamic aggregation of user-pinned shortcuts.

### Data Structure (`pinnedActions`)
Pins are inherently tied to the user, not just the garden, to ensure multi-tenant workspaces don't clutter each other's dashboards. 
In the `Zone`, `Location`, and `PlantInstance` models, pins are stored in a Record dictionary keyed by the user's ID:
`pinnedActions?: Record<string, string[]>;` (e.g., `{"user-123": ["water", "navigate"]}`)

### Rendering Logic
During rendering, the component iterates over the global `zones`, `locations`, and `instances` arrays. 
For every entity, it checks the `pinnedActions[currentUserId]` array. Based on the strings found in that array, it generates a generic `ActionCard`:

* **`'water'`:** Binds the appropriate batch water handler (e.g., `onBatchWaterZone(zone.id)`).
* **`'feed'`:** Binds the appropriate batch feed handler.
* **`'navigate'`:** Binds the respective navigation routing function to jump directly to the entity's profile.

These dynamically generated cards are then appended to the list of global actions.