---
id: "settings-administration"
title: "Settings & Administration"
category: "Settings"
tags: ["settings", "admin", "profile", "users", "import", "sandbox", "optimization"]
---

# Settings & Administration

The General Settings screen (`SettingsManager.tsx`) serves as the control center for your account and garden workspace. It dynamically renders sections based on your role and permissions:

* **Garden Profile:** Update the workspace name and cover photo for the active garden.
* **Account Info:** Manage your personal details, email, and active session.
* **User Administration:** Authorized admins can manage system users, assign workspace roles (e.g., viewer, admin), and control access permissions.
* **Data Import & Optimization:** Access powerful tools to manage your database payload and bulk-import new dictionary archetypes.
  * **Plant Package Import:** FloraSync supports uploading a `.zip` package containing a JSON array of plant archetypes alongside their local image files. The system automatically reads the JSON, matches the `imageUrl` paths to the files inside the zip, converts them into compressed data, and safely merges them into your global dictionary.
    * **Zip File Structure Example:**
      ```text
      /new-plants.json
      /images/vegetables/spaghetti-squash.jpg
      ```
    * **JSON Payload Example (`new-plants.json`):**
      ```json
      [
        {
          "id": "spaghetti-squash",
          "commonName": "Spaghetti Squash",
          "category": "Vegetable",
          "lifecycle": "Annual",
          "sunRequirement": "Full Sun",
          "waterIntervalDays": 3,
          "imageUrl": "images/vegetables/spaghetti-squash.jpg"
        }
      ]
      ```
  * **Database Optimization:** A one-click utility that safely scans your entire database (plants, journals, locations, and zones) and permanently compresses any oversized photos, drastically speeding up your local network syncs.
* **Sandbox Management:** A special, restricted tool for "God-Admins" to instantly wipe and restore the Demo Garden to its initial seed state.