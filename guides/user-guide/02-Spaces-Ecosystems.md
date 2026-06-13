---
id: "view-spaces-ecosystems"
title: "Spaces & Ecosystems"
category: "Views"
tags: ["zones", "locations", "ecosystems", "hierarchy", "spaces", "batch actions"]
---

# Spaces & Ecosystems (Zones & Locations)

FloraSync uses a strict relational hierarchy (Zone ➔ Location ➔ Plant) to keep your garden organized and to automate environmental care calculations.

* **Macro Zones:** Represent large physical areas like a "Greenhouse" or "Front Porch". (`ZoneManager.tsx`)
  * **Environmental Modifiers:** You can assign custom evaporation modifiers (e.g., 1.5x for a hot, windy patio, or 0.5x for a humid, shaded indoor greenhouse) which dynamically speed up or slow down the watering schedules for every plant inside it.
  * **Covered Areas:** Zones can be flagged as "Covered (No Natural Rain)" to signify areas excluded from natural weather events.
* **Micro Locations:** Specific shelves, beds, or rows within a Zone (e.g., "Top Shelf", "South Bed"). This allows you to pinpoint exactly where a specific pot lives. (`LocationManager.tsx`)
  * **Smart Grouping:** In the manager view, locations are automatically grouped and sorted by their parent Zone using collapsible accordions, ensuring organized navigation even in massive gardens.
  * **Location Profiles:** Tapping a location reveals a dedicated dashboard featuring a customizable cover photo, a live summary of all active plants assigned to that spot, and a localized Trickle-Down journal feed.
  * **Action Pinning:** Users can pin specific batch actions to the top of the location profile, giving them one-tap access to routine maintenance for that specific shelf or bed.
* **Zero-Click Batch Actions:** Scanning a Zone or Location QR code allows you to execute batch actions (like "Water All" or "Feed All") for dozens of plants instantly. Thanks to the Trickle-Down architecture, this writes a single clean journal entry to the parent space instead of spamming individual plant histories.
* **Just-In-Time Registration:** If you scan a brand new, unassigned QR code and choose to register it as a Location or Zone, the app provides a seamless onboarding form to name it and link it into your hierarchy on the spot.