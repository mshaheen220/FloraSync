---
id: "dev-widget-weather"
title: "Weather & Soil Insights"
category: "Developer Guide"
parent: "dev-view-dashboard"
tags: ["dashboard", "widget", "weather", "internet", "external", "official"]
---

# Developer Guide: Weather & Soil Insights (Addon)

**File Path:** `addons/widget-weather/WeatherWidget.tsx`, `addons/widget-weather/manifest.json`

## Overview

Unlike the other dashboard widgets, the **Weather & Soil Insights** widget is distributed as an official **Addon** (`widget-weather`) rather than core application code. The primary reason for this architectural decision is **network isolation**. 

FloraSync is designed to be a fully local, offline-first application that respects user privacy and doesn't require an external internet connection. Because this widget relies on external APIs (`api.open-meteo.com` and `api.bigdatacloud.net`) to function, it is packaged as an opt-in addon. This allows developers and administrators who wish to keep their ecosystems strictly confined to a local network (e.g., in a secure greenhouse or an air-gapped server) to simply bypass installing this addon, keeping the core system purely offline.

## The "Local" Options

Even with the addon installed, the code provides robust local fallbacks and options:

1. **Offline Graceful Degradation:** The component utilizes `navigator.onLine` to check for client-side connectivity before attempting API calls. If the client is completely local/offline, the widget gracefully falls back to an error state (`You are currently offline. Live weather data is unavailable.`) rather than throwing unhandled fetch errors or breaking the dashboard loop.
2. **Self-Hosted API Replacement:** Open-Meteo is an open-source weather API. Developers who want hyper-local weather data but maintain a strict local-network policy can self-host an Open-Meteo instance on their local server. You can modify the code by replacing the `https://api.open-meteo.com/v1/forecast...` endpoint in `WeatherWidget.tsx` with your local IP address.

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

### Data Fetching & Reverse Geocoding
When mounted, the React component executes two primary network requests:
1. **BigDataCloud Reverse Geocoding:** Translates the provided latitude/longitude into a human-readable city name (`locationName`) to display in the header (e.g., "Pittsburgh Weather" instead of "Local Weather").
2. **Open-Meteo Fetch:** Requests highly specific agricultural data points such as `soil_temperature_6cm`, `soil_moisture_3_to_9cm`, `et0_fao_evapotranspiration` (water loss), and `shortwave_radiation` alongside standard weather metrics.

### Interpretation Engine (`getInterpretations`)
Raw weather data is mostly useless without context. The `getInterpretations()` function acts as the core logic engine of the widget. It evaluates the raw numbers against gardening thresholds to determine impact:
* **Moisture:** `< 20%` is flagged as "Very Dry" (Critical).
* **Soil Temp:** `< 50°F` is flagged as "Cold", warning that seed germination will struggle.
* **Evapotranspiration:** `> 0.2` triggers a "High Loss" warning, indicating fast water loss from soil and leaves.

These interpretations style the individual stat cards (assigning colors like `text-red-500` or `text-emerald-500`) and feed the Summary Engine.

### Summary Engine (`getGardenSummary`)
The `getGardenSummary()` function aggregates the interpreted states, assigns them a severity level (`0 = Info`, `1 = Warning`, `2 = Critical`), and sorts them. It returns a concatenated paragraph of the top 3 most critical alerts. This logic powers the main "Garden Outlook" card on the front face of the widget.

## Expanding & Modifying Details

When a user taps the widget, it expands to show a grid of `StatItem` components. Tapping a specific stat opens a detailed modal. 

The data for these modals (the definition of the metric and the specific status description) is passed into the `onClick` handler of each `StatItem` directly within the JSX. To add a new metric, you must:
1. Append it to the Open-Meteo fetch URL query string.
2. Add it to the `WeatherData` interface.
3. Define its interpretation logic in `getInterpretations()`.
4. Render a new `StatItem` component with the corresponding definitions.
