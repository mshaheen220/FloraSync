---
id: "feature-journal-system"
title: "Unified Trickle-Down Journal"
category: "Features"
tags: ["journal", "history", "timeline", "notes", "trickle-down", "observations"]
---

# Unified Trickle-Down Journal System

FloraSync features a powerful, context-aware journal engine (`SharedJournalFeed.tsx` & `SharedJournalForm.tsx`) that tracks care history and observations without duplicating data or bloating the database.

* **Omni-Level Logging:** You can attach rich notes, photos, and activities (like pruning, harvesting, or pest sightings) to any entity level: the Global Garden, a Macro Zone, a Micro Location, or a Specific Plant Instance.
* **The Trickle-Down Engine:** The journal operates on a seamless inheritance model. If you execute a macro event like "Water Greenhouse" or log "Heavy Rain" at the global level, the database creates *exactly one* journal entry at that parent level. When you view a specific plant inside that greenhouse, its personal timeline dynamically pulls in and displays that parent event as an "Inherited Event" without actually copying the data.
* **Context-Aware Feeds:** The UI intelligently adapts based on where you are viewing it. In the Global Master Journal, it aggregates every event across your entire garden into a single, filterable timeline. On a specific plant profile, it displays a focused timeline and restricts editing/deleting to local events, keeping macro-events safely locked to their parent source.
* **Routine Care Toggles:** Users can easily toggle "Show Routine Care" on or off in any feed to filter out the noise of daily watering and feeding, allowing them to focus purely on major milestones, observations, and photos.