---
id: "widget-attention-queue"
title: "Attention Queue Logic"
category: "Dashboard Widgets"
parent: "view-dashboard"
tags: ["dashboard", "widget", "attention queue", "hydration", "overdue", "intervals"]
---

# Attention Queue Logic

FloraSync doesn't just show you a static list of plants. It calculates a real-time hydration and nutrition ratio for every plant by comparing its last care timestamp against its specific archetype intervals (intelligently modified by Zone evaporation rates and Sun Exposure). Plants whose ratios hit 0% (overdue) are automatically floated to the top of your queues.