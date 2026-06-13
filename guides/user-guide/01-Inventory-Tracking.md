---
id: "view-inventory"
title: "Inventory & Plant Tracking"
category: "Views"
tags: ["inventory", "tracking", "plants", "hydration", "search", "milestones"]
---

# Inventory & Plant Tracking

The Inventory Manager (`InventoryManager.tsx` & `PlantDetail.tsx`) is the heart of your active garden tracking, displaying all living plants currently deployed in your physical spaces.

* **Smart Grouping & Search:** By default, plants are grouped by their Archetype Category, but can be dynamically re-grouped by Macro Zone or Specific Location. A live search bar auto-expands relevant groups to quickly locate specific plants.
* **Dynamic Hydration Math:** Each plant calculates a real-time hydration ratio. It takes the archetype's base watering interval, modifies it by the plant's sun requirement (e.g., "Full Sun" dries out 20% faster, "Shade" dries out 20% slower), and finally applies the parent Zone's custom evaporation modifier.
* **Plant Detail Profiles:** Tapping a plant card or scanning its QR code opens a comprehensive profile that aggregates:
  * **Vitality Status:** Visual badges indicating if a plant is optimally hydrated, overdue for care, or marked as "Unmonitored / Rain-Fed" (which gracefully excludes established shrubs or trees from your daily watering queues).
  * **Milestone Tracking:** Automatically estimates upcoming bloom or harvest dates based on the planting date. For perennials and biennials, it smartly rolls the anniversary forward each year!
  * **Cultivation Inheritance:** Intelligently displays care basics, traits, and lifecycle instructions inherited directly from the global Plant Dictionary.
  * **Quick Actions & Plugins:** One-tap buttons for logging water/feed events, alongside dynamically injected action buttons provided by any installed Addon Plugins.
  * **Trickle-Down Journal:** A consolidated history feed showing specific plant observations seamlessly merged with inherited macro-events (like Zone watering or whole-garden rain).