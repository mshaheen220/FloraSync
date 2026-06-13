---
id: "feature-plant-dictionary"
title: "Global Plant Dictionary"
category: "Features"
tags: ["dictionary", "archetypes", "database", "care", "fun facts", "global"]
---

# Global Plant Dictionary

A centralized database of "Plant Archetypes" (species or varieties) that is **global across all workspaces and gardens**. Instead of entering data for every single tomato plant, you define the "Heirloom Tomato" archetype once, and your individual physical plants inherit these rules.

## Administration & Maintenance
Because the dictionary acts as the global source of truth, only Garden Owners and Admins have permission to add or update archetypes. They can manually create entries via the UI or use bulk import tools (see Settings) to quickly populate the database.

## Archetype Details
To provide the best guidance for physical plants, a new archetype entry gathers extensive cultivation data, including:
* **Basic Info:** Common Name, Scientific Name, Category, Lifecycle, Growth Habit.
* **Care Routines:** Sun Requirements, Watering Intervals, Feeding Intervals, What to Feed, Pruning Tips, Growth Requirements.
* **Harvest & Yield:** Days to Harvest, Flavor Profile, Uses for Large Harvests.
* **Planting & Environment:** When to Plant, When to Harvest, Planting Instructions, Hardiness Zones, Hardiness Notes.
* **Ecosystem:** Companion Plants, Combative Plants.
* **Extras:** Fun Facts and Image Thumbnails.

## Organization & Safety
The dictionary features a dynamic search and categorization engine. As you type in the search bar, the UI automatically groups and expands relevant plant categories. To prevent data corruption and orphaned records, FloraSync includes a strict relational safety lock: an Archetype cannot be deleted if there are any living `PlantInstance`s currently using it in your garden.

## Archetype Detail View (`ArchetypeDetail.tsx`)
The detail screen operates in two distinct modes based on user permissions and context:
* **View Mode:** Presents a highly visual, read-only summary of the archetype. Information is intelligently grouped into collapsible accordion sections (Cultivation Basics, Details & Traits, Lifecycle & Harvest, and Fun Facts). The UI uses smart validation to dynamically hide any empty fields or arrays, ensuring a clean interface without blank gaps. Helpful visual cues, like dynamic icons that change based on sun, water, and feeding requirements, provide at-a-glance care summaries.
* **Edit/New Mode:** Authorized Admins can toggle into edit mode (handled via the `ArchetypeForm`) to update the archetype's comprehensive data points. When creating a new archetype, the system automatically generates a unique identifier from the common name and prevents duplicate entries.

## Rich Media & Trivia (`FunFactManager.tsx`)
To make the dictionary engaging and educational, the system includes a dedicated inline manager for creating rich "Fun Facts" or trivia about a plant. During archetype editing, this manager allows admins to:
* Add multiple trivia items, seamlessly converting legacy string-only facts into rich objects behind the scenes.
* Expand specific facts inline to edit them without leaving the context of the main form.
* Assign specific context icons from a predefined list (e.g., "Bugs", "Food", "Dangerous", "Science") to visually categorize the trivia.
* Upload custom thumbnail images that override the default icons.
* Add custom titles and source attributions to specific facts.
* View a real-time layout preview of how the fact will look to end-users on the detail screen.