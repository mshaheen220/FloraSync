---
id: "widget-approaching-harvest"
title: "Widget: Approaching Harvest"
category: "Dashboard Widgets"
parent: "view-dashboard"
tags: ["harvest", "dashboard", "ripe", "picking", "countdown"]
---

# 🍎 Widget: Approaching Harvest

The **Approaching Harvest** widget is a smart, horizontal carousel designed to ensure your hard work never goes to waste. It remains completely hidden to save space, magically appearing *only* when you have crops nearing maturity.

## How the Math Works
FloraSync calculates exactly when a plant should be ripe by taking its specific `Date Planted` and adding the `Days to Harvest` defined in its master Dictionary entry.

*   **The 14-Day Warning:** Once a plant gets within exactly 14 days (two weeks) of its target harvest date, it pops into this carousel with a blue countdown.
*   **Ready to Pick:** Once the date hits zero, the text turns orange and says **"Ready to pick!"**.
*   **The Grace Period:** The plant will remain stuck in this carousel for an additional 14 days *after* its harvest date to heavily remind you to go pick it before it rots!

Tap any card in the carousel to jump to the plant's detail view, where you can log the physical weight/quantity of your harvest into its journal!