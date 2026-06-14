---
id: "feature-attention-queues"
title: "Smart Math: Care Queues"
category: "Features"
tags: ["queues", "watering", "feeding", "math", "evaporation", "modifiers", "sun exposure"]
---

# ⏱️ Smart Math: How Care Queues Work

FloraSync doesn't just show you a static list of your plants—it actively calculates which ones need your help *right now* and magically surfaces them into the **Needs Watering** and **Hungry Plants** to-do lists on your Dashboard.

Here is exactly how the system figures out when a plant is thirsty or hungry:

### 1. The Baseline Rules (Archetypes)
When you add a plant to your garden, FloraSync looks at its master blueprint in the **Plant Dictionary**. For example, a Sweet Basil plant might have a base `Water Interval` of 3 days and a `Feeding Interval` of 14 days.

### 2. Sun Exposure
Not all plants get the same amount of light! FloraSync automatically adjusts that baseline depending on where the specific plant sits. A plant placed in "Full Sun" will dry out 20% faster, while one placed in "Full Shade" dries out 20% slower.

### 3. The Microclimate (Zone Modifiers)
The physical environment matters just as much. If you place that Basil in a Zone called "Indoor Greenhouse", FloraSync checks if that Zone has a custom **Evaporation Modifier**. 
*   If your humid Greenhouse has a modifier of `0.5x`, the app knows that plants in there dry out half as fast, giving you extra time before the plant begs for water. 
*   *Conversely, a "Hot Patio" zone might have a `1.5x` modifier, meaning plants out there dry out 50% faster!*

### 4. The Countdown Timer
When you water or feed a plant (like scanning its QR code or tapping the quick action button), FloraSync logs the exact timestamp. It then continuously runs a hidden countdown timer using all of that smart math.

Once the calculated hydration or nutrition level hits **0%**, the plant drops directly into your **Needs Watering** or **Hungry** queue. No guesswork required!