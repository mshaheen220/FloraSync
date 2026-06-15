---
id: "dev-widget-weather"
title: "Weather Insights"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "weather", "internet", "external", "official"]
---

# Developer Guide: Weather Insights (Addon)

**File Path:** `addons/widget-weather/WeatherWidget.tsx`, `addons/widget-weather/weather-utils.ts`, `addons/widget-weather/manifest.json`

## Overview

Unlike the other dashboard widgets, the **Weather Insights** widget is distributed as an official **Addon** (`widget-weather`) rather than core application code. The primary reason for this architectural decision is **network isolation**. 

FloraSync is designed to be a fully local, offline-first application that respects user privacy and doesn't require an external internet connection. Because this widget relies on external APIs (`api.tomorrow.io` and `api.bigdatacloud.net`) to function, it is packaged as an opt-in addon. This allows developers and administrators who wish to keep their ecosystems strictly confined to a local network (e.g., in a secure greenhouse or an air-gapped server) to simply bypass installing this addon, keeping the core system purely offline.

## The "Local" Options

Even with the addon installed, the code provides robust local fallbacks and options:

1. **Offline Graceful Degradation:** The component utilizes `navigator.onLine` to check for client-side connectivity before attempting API calls. If the client is completely local/offline, the widget gracefully falls back to an error state (`You are currently offline. Live weather data is unavailable.`) rather than throwing unhandled fetch errors or breaking the dashboard loop.
2. **Caching & Rate Limits:** Tomorrow.io has strict rate limits. To respect these, the widget automatically implements a 15-minute `localStorage` cache for weather data, drastically reducing API calls while navigating the dashboard.

## Addon Architecture

### `manifest.json` Configuration
The manifest declares this as a dashboard widget and explicitly notes the internet requirement:

```json
{
  "id": "widget-weather",
  "name": "Weather Widget",
  "entryPoints": ["dashboard"],
  "requiresInternet": true,
  "settingsSchema": [
    { "key": "latitude", "type": "number" },
    { "key": "longitude", "type": "number" }
  ]
}
```

The `settingsSchema` allows the administrator to configure their exact latitude and longitude via the FloraSync settings UI. This configuration is passed down as the `settings` prop to the `WeatherWidget` component.

**API Key:** The addon also requires a Tomorrow.io API key, securely provided via Vite's environment variables (`VITE_TOMORROW_IO_API_KEY`).

### Data Fetching & Reverse Geocoding
When mounted, the React component executes two primary network requests:
1. **BigDataCloud Reverse Geocoding:** Translates the provided latitude/longitude into a human-readable city name (`locationName`) to display in the header (e.g., "Pittsburgh Weather" instead of "Local Weather").
2. **Tomorrow.io Fetch:** Requests environmental and atmospheric data points such as `uvIndex`, `cloudCover`, `humidity`, and `windSpeed` alongside standard weather metrics via their `/v4/weather/forecast` endpoint.

### Interpretation Engine & Configuration (`weather-utils.ts`)
Raw weather data is mostly useless without context. The widget relies on a dedicated `weather-utils.ts` file containing configuration-driven rules (`INTERP_RULES` and `OUTLOOK_RULES`). This abstracts the heavy logic out of the UI.

The `evaluateMetric()` helper function matches incoming raw numbers against these arrays to determine the immediate impact and actionable advice:
* **UV Index:** `>= 8` is flagged as "Extreme" (Critical), recommending temporary shade for plants.
* **Cloud Cover:** `>= 80%` is flagged as "Overcast", warning that soil will dry slower.

These evaluations style the individual stat cards (assigning colors like `text-red-500` or `text-emerald-500`), inject impact-driven descriptions into the modals, and feed the global Summary Engine.

### Summary Engine (`getGardenSummary`)
The `getGardenSummary()` function aggregates the interpreted states, assigns them a severity level (`0 = Info`, `1 = Warning`, `2 = Critical`), and sorts them. It returns a concatenated paragraph of the top 3 most critical alerts. This logic powers the main "Garden Outlook" card on the front face of the widget.

## Common Customizations

The widget is designed to be highly configurable. Here is how and where to update its core behaviors:

### 1. Adjusting API Polling Frequency (Cache Limit)
To prevent hitting Tomorrow.io's strict rate limits, the widget caches data in `localStorage`. By default, this is set to 15 minutes. 
To change how often the widget silently polls for new data in the background, open `addons/widget-weather/WeatherWidget.tsx` and modify the `CACHE_MINUTES` constant inside the `fetchWeather` effect:
```typescript
const CACHE_MINUTES = 15; // Change this to 30 or 60 to save API calls
```

### 2. Modifying Interpretation Rules
If you want to change what triggers a "Strong Wind" alert, or add a brand new category (like "Gale Force"), open `addons/widget-weather/weather-utils.ts` and locate the `INTERP_RULES` dictionary.

These arrays are evaluated from top to bottom using the `evaluateMetric` helper. The first rule whose `check` function returns `true` is applied. To add a new threshold, simply insert an object into the array before the catch-all (`() => true`) rule:
```typescript
wind: [
  // New rule added at the top for highest severity priority
  { check: v => v > 25, t: 'Gale Force', c: 'text-purple-500', desc: 'Move all potted plants indoors immediately.' },
  { check: v => v > 15, t: 'Strong', c: 'text-red-500', desc: '...' },
  { check: v => v > 8, t: 'Breezy', c: 'text-amber-400', desc: '...' },
  { check: () => true, t: 'Calm', c: 'text-emerald-500', desc: '...' } // Catch-all
]
```

### 3. Tweaking the Garden Outlook
The overall "Garden Outlook" logic lives in the `OUTLOOK_RULES` array inside `weather-utils.ts`. It works the same way as the metric interpretations (top-to-bottom priority). 

If you want to add a new state, like an alert for heavy incoming snow, you can insert a new rule object. You can use standard strings or pass a function to dynamically build the description or icon based on the current `OutlookConditions`:
```typescript
{ 
  check: c => c.futurePrecip > 1.0, 
  v: 'Flash Flood Risk', 
  t: 'Critical', 
  c: 'text-red-500', 
  i: 'alert-triangle', 
  desc: c => `Extreme rain incoming (${c.futurePrecip.toFixed(1)} inches). Check drainage.` 
}
```
*(Note: If your new rule relies on a new boolean or calculation, you must also update the `OutlookConditions` type in `weather-utils.ts` and the `evaluateOutlook` call block inside `WeatherWidget.tsx`).*
