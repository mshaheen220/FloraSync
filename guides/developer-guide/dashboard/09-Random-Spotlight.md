---
id: "dev-widget-random-spotlight"
title: "Random Spotlight & Fun Facts"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "spotlight", "trivia", "fun facts", "tips"]
---

# Random Spotlight & Fun Facts (Developer Guide)

The Random Spotlight widget (`src/components/core/dashboard/RandomSpotlight.tsx`) is one of the most advanced components on the Dashboard. It acts as an intelligent content generation engine, synthesizing educational tips, context-aware reminders, and user-defined trivia into a rotating daily insight.

## The Randomization Seed

Because React functional components re-render frequently, using `Math.random()` directly inside the render cycle would cause the spotlight to flicker and change constantly.
Instead, the component initializes a fixed `randomSeed` state:
```javascript
const [randomSeed, setRandomSeed] = useState(() => ({
  plantIndex: Math.floor(Math.random() * 1000000),
  promptIndex: Math.floor(Math.random() * 1000000),
  factIndex: Math.floor(Math.random() * 1000000)
}));
```
When the user taps the Shuffle button, these integers are incremented by prime jumps to traverse the available arrays semi-randomly without predictable looping.

## Two-Tiered Selection Engine

The `spotlight` object is generated inside a complex `useMemo` hook that utilizes a two-tier selection process.

### Tier 1: The Global Fun Fact Override (25% Chance)
To ensure that custom trivia added to the Plant Dictionary is surfaced frequently, the engine first gathers *all* `funFacts` defined in the archetypes of the currently growing plants.
* It uses the `randomSeed.promptIndex % 100` to roll a simulated 100-sided die.
* If the result is `< 25` (and there are facts available), it intercepts the normal generation logic and immediately returns a randomly selected Fun Fact.

### Tier 2: The Local Plant Insight (75% Chance)
If the global override misses (or if no fun facts exist in the garden), the engine selects a specific plant from the inventory and generates an insight dynamically based on its Archetype data.

1. **Target Selection:** It selects a single `archetypeId` from the pool of active, tracked plants using `randomSeed.plantIndex`.
2. **Dynamic Weighting:** It builds an array of valid `options` for that specific plant. The engine analyzes the archetype's fields (e.g., `pruningTips`, `flavorProfile`, `companionPlants`) and conditionally pushes specialized messages into the array.
3. **Probability Multipliers:** Boring or generic traits (like `sunRequirement`) are pushed to the array once (1x weight). Highly engaging or actionable traits are pushed multiple times to increase their probability of being selected:
   * **2x Weight:** Culinary uses for edible plants.
   * **3x Weight:** Specific modifiers (e.g., if a plant is explicitly tagged as "spicy" or "sweet").
   * **3x Weight (Local Facts):** The plant's specific fun facts are injected here to ensure they still have a high chance of appearing even if the Tier 1 global override missed.
4. **Final Selection:** It uses `randomSeed.promptIndex` to deterministically select the final insight from the heavily weighted `options` array.

## Rich Data Injection

The selected insight is passed to the UI, which dynamically maps the `Icon` name and the fallback `imageUrl` depending on whether the source was a structural tip or a customized `FunFact`.