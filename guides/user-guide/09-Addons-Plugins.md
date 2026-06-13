---
id: "settings-addons-plugins"
title: "Addon / Plugin System"
category: "Settings"
tags: ["addons", "plugins", "manifest", "extensions", "customization"]
---

# Addon / Plugin System

FloraSync features a robust, secure plugin architecture (`AddonManager.tsx` & `server/routes/addons.js`) allowing developers to seamlessly extend the app's functionality with custom code, external API integrations, and new UI elements.

* **Plugin Capabilities:** Plugins can inject custom Action Buttons directly into plant profiles, append new Activity Types to the Master Journal, provide custom settings forms, and execute custom backend JavaScript.
* **Role-Based Permissions:**
  * **System Admin ("God-Admin"):** Has exclusive rights to upload new `.zip` plugin packages and permanently delete or uninstall them from the server disk.
  * **Workspace Owners:** Can activate or deactivate installed plugins for their specific garden, and configure the plugin's custom settings.
  * **Helpers & Viewers:** Can view which plugins are active on the server but cannot modify their states.
* **Package Structure:** A plugin is distributed as a `.zip` file. The backend intelligently handles the extraction, but it strictly requires a `manifest.json` file.
  * **Manifest Requirements:** Must include `id`, `name`, `version`, and an `uninstallScript` (to safely clean up the database if the plugin is ever removed).
  * **Optional Hooks:** Can include an `installScript` (runs immediately upon upload), an `executeScript` (handles backend API calls triggered by custom UI buttons), and a `settingsSchema` (which automatically generates a clean settings form in the UI).
* **Installation & Activation Lifecycle:**
  1. **Upload:** A God-Admin uploads the `.zip`. The system validates the manifest, extracts the files to `src/data/plugins/`, and runs the `installScript` to prepare any required database tables.
  2. **Activate:** An Owner clicks "Activate", making the plugin's UI hooks (like journal types or buttons) visible across their workspace.
  3. **Configure:** Owners can open the dynamically generated settings modal to configure API keys, coordinates, or preferences defined by the plugin's schema.
  4. **Execute:** Users interact with the plugin in the UI, which routes secure requests to the backend `execute.js` script.