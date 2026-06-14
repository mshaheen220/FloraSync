---
id: "dev-settings-addons-plugins"
title: "Addon / Plugin System"
category: "Developer Guide"
tags: ["addons", "plugins", "manifest", "extensions", "customization", "api"]
---

# Addon / Plugin System (Developer Guide)

FloraSync's plugin system allows developers to safely extend the core functionality of the application without directly modifying the source code. Plugins can inject frontend components, add new backend routes via execute scripts, and hook into lifecycle events.

## Data Model & Storage

Addons are installed globally on the server but activated and configured on a per-user/workspace basis.

* **Database Table:** `users`
* **Columns:**
  * `installed_addons TEXT DEFAULT '[]'` (JSON array of plugin IDs uploaded to the server)
  * `active_addons TEXT DEFAULT '[]'` (JSON array of plugin IDs the user has enabled)
  * `addon_settings TEXT DEFAULT '{}'` (JSON object storing configuration values, keyed by plugin ID)
* **File Storage:** Uploaded plugin ZIP files are extracted to `src/data/plugins/<plugin-id>/`. Built-in plugins reside in `addons/<plugin-id>/`.

## The `manifest.json`

Every plugin must include a `manifest.json` at its root. This defines the plugin's metadata, dependencies, and entry points.

```json
{
  "id": "widget-weather",
  "name": "Weather Widget",
  "version": "1.6.2",
  "uninstallScript": "setup.js",
  "installScript": "setup.js",
  "executeScript": "execute.js",
  "entryPoints": ["dashboard"],
  "settingsSchema": [
    {
      "key": "latitude",
      "label": "Latitude",
      "type": "number",
      "defaultValue": 40.689156
    }
  ]
}
```

* **Required Fields:** The server enforces that `id`, `name`, `version`, and `uninstallScript` are present during installation.
* **`settingsSchema`:** Defines the configuration UI presented to Garden Owners upon activation. Values saved here are passed to the frontend components as a `settings` prop.

## Lifecycle Hooks (Backend)

Plugins can hook into the installation and uninstallation processes to manipulate the SQLite database (e.g., adding custom journal activity types).

* **Installation:** When a ZIP is uploaded or a built-in plugin is registered via `POST /api/addons/install`, the server dynamically imports the `installScript` and calls its `install(db, gardenId)` function.
* **Uninstallation:** When a plugin is deleted via `POST /api/addons/uninstall`, the server dynamically imports the `uninstallScript` and calls its `uninstall(db, gardenId)` function before destroying the plugin directory.

## Backend Execution (`executeScript`)

If a plugin needs to perform backend logic (e.g., handling a custom action or interfacing safely with the SQLite `db`), it defines an `executeScript` (e.g., `execute.js`).

When the frontend issues a request to `POST /api/addons/execute` with the `addonId` and an `actionId`, the backend dynamically imports the specified script and invokes its exported `execute` function:

```javascript
// Example execute.js
export const execute = async (db, gardenId, actionId, contextData, user) => {
  if (actionId === 'fetch-data') {
    // perform safe DB queries or external API calls
    return { success: true, data: "..." };
  }
};
```

## Security & Authorization

Access controls for plugins are strictly enforced at the API route level (`server/routes/addons.js`).

* **Installation / Uninstallation:** Inherently restricted (typically requires System Admin privileges).
* **Activation / Configuration (`POST /api/addons/settings`):** The server checks `effectiveRole`. Only users with the `owner` role for the active garden (or `god-admin`) can activate plugins or modify their settings schema values.
* **Usage:** `viewer` and `helper` roles receive the `activeAddonManifests` via the global `GET /api/state` endpoint, allowing the UI to render the plugins, but they are blocked from altering settings.
