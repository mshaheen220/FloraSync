---
id: "feature-attention-queues"
title: "How Attention Queues Work"
category: "Features"
tags: ["queues", "watering", "feeding", "math", "evaporation", "modifiers"]
---

# ⏱️ Smart Math: How Attention Queues Work

FloraSync doesn't just show you a static list of your plants—it actively calculates which ones need your help *right now* and surfaces them into the **Needs Watering** and **Hungry Plants** queues on your Dashboard.

Here is exactly how the system figures out when a plant is thirsty or hungry:

## 1. The Baseline Rules (Archetypes)
When you add a plant to your garden, FloraSync looks at its master definition in the **Plant Dictionary**. For example, a Sweet Basil plant might have a `Water Interval` of 3 days and a `Feeding Interval` of 14 days.

## 2. The Location Modifier
The physical environment matters! If you place that Basil in a Zone called "Greenhouse", FloraSync checks if that Zone has an **Evaporation Modifier**. 
*   If the Greenhouse has a modifier of `0.8x`, the app knows that plants in there dry out 20% *slower* than normal. 
*   It multiplies the base 3-day water interval by 0.8, effectively giving you extra time before the plant begs for water.
*   *Conversely, a "Hot Patio" zone might have a `1.2x` modifier, meaning plants dry out 20% faster!*

## 3. The Countdown
When you tap a "Water Me" QR code or use a Quick Action on the Dashboard, FloraSync logs the exact timestamp. It then continuously calculates the elapsed time against the modified interval limit.

Once the calculated hydration level hits **0%**, the plant drops directly into your **Needs Watering** queue. Feeding works exactly the same way!