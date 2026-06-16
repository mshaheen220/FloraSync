---
id: "dev-feature-plant-dictionary"
title: "Global Plant Dictionary"
category: "Developer Guide"
tags: ["dictionary", "archetypes", "database", "data model", "authorization", "sqlite"]
---

# Global Plant Dictionary (Developer Guide)

The Plant Dictionary is a centralized reference of "Plant Archetypes" that serve as blueprints for physical plant instances. It is shared **globally across all workspaces and gardens** in the FloraSync ecosystem. 

## Data Architecture & Storage

Instead of duplicating plant traits across every instance, FloraSync uses an archetype pattern. The entire dictionary is stored as a serialized JSON blob in a single SQLite table.

* **Database Table:** `shared_dictionary`
* **Schema:** `id INTEGER PRIMARY KEY, archetypes TEXT`
* **Initialization:** A single row with `id = 1` is created during database migration, initialized with an empty JSON array `[]` if no data exists.

## Data Model (`PlantArchetype`)

The `PlantArchetype` TypeScript interface (found in `src/types.ts`) defines the schema for these blueprints. Key properties include:

* **Identity:** `id`, `commonName`, `scientificName`, `category`
* **Care Requirements:** `sunRequirement`, `waterIntervalDays`, `feedingIntervalDays`, `whatToFeed`
* **Characteristics:** `growthHabit`, `daysToHarvest`, `flavorProfile`, `preferredNutrientProfile`
* **Ecosystem Data:** Arrays of `companionPlants` and `combativePlants`
* **Rich Content:** `imageUrl`, `funFacts` (Array of `FunFact` objects)

## API & Synchronization

The dictionary data is delivered alongside the initial workspace state to minimize subsequent API requests.

* **Fetch (`GET /api/state`):** The server retrieves the `archetypes` from `shared_dictionary` and parses them into a JSON array, attaching it to the global state payload.
* **Update (`POST /api/state`):** When the dictionary is modified, the complete array of archetypes is sent back. The server stringifies the array and updates the `shared_dictionary` row.

## Authorization & Roles

To maintain data integrity of the global dictionary, strict access controls are implemented.

* **Server-Side Enforcement (`server/routes/gardens.js`):** 
  When processing `POST /api/state`, the server verifies the user's role. Only a system administrator (`req.user.role === 'god-admin'`) or a workspace owner (`effectiveRole === 'owner'`) is permitted to update the `archetypes` payload. Other roles silently ignore archetype updates to prevent unauthorized modifications.
* **Client-Side Enforcement:**
  UI elements for editing or adding archetypes are conditionally rendered using `hasPermission(currentUser, 'manage_dictionary')`.

## Data Integrity & Safety

FloraSync prevents orphaned plant instances by ensuring archetypes cannot be deleted if they are in use.

* **Deletion Prevention (`ArchetypeManager.tsx`):** Before an archetype can be deleted, the client counts how many `PlantInstance` objects reference its `id` (`archetypeId`). If `inUseCount > 0`, a warning is shown, and the deletion is blocked.

## Fun Facts Manager

The `FunFactManager` component manages the `funFacts` array nested within a `PlantArchetype`. 
Each `FunFact` contains:
* `fact` (the text content)
* Optional metadata: `title`, `attributedTo`, `imageUrl`, and `icon` (useful for categorizing the type of fact, e.g., "science", "dangerous").
This nested array structure allows seamless updates when the parent archetype is saved via `POST /api/state`.