---
id: "dev-settings-administration"
title: "Settings & Administration"
category: "Settings"
tags: ["settings", "admin", "profile", "users", "import", "sandbox", "optimization", "dev"]
---

# Settings & Administration (Developer Guide)

The **Settings & Administration** module serves as the control center for both the user's personal account and the garden workspace. The primary entry point is `SettingsManager.tsx`, which dynamically renders setting sections based on the authenticated user's role and permissions.

## Architecture

The main Settings view is an accordion-style interface where each section is a separate, focused React component:

*   **`SettingsManager.tsx`:** The orchestrator component. It determines which settings sections to render by checking user permissions (e.g., using the `hasPermission` utility).
*   **`SettingsSection` Component:** A lightweight wrapper used within `SettingsManager` to provide the consistent expandable accordion UI for each category.

## Dynamic Rendering & Permissions

FloraSync ensures that users only see configuration options they are authorized to interact with. This is achieved through conditional rendering based on the `currentUser` object and `permissions.ts` utility:

```tsx
// Example of conditional rendering based on permissions
{hasPermission(currentUser, 'manage_system_users') && (
  <SettingsSection title="User Administration" ...>
    <UserAdministration ... />
  </SettingsSection>
)}
```

## Settings Sub-Modules

The settings are broken down into the following functional areas, each managed by its dedicated component:

*   **[Garden Profile](./settings/01-garden-profile.md) (`GardenProfileSettings.tsx`):** Manages workspace metadata like the garden name and cover image. Available to workspace owners.
*   **[Account Info](./settings/02-account-info.md) (`AccountSettings.tsx`):** Handles personal user data, password changes, and active session management. Available to all users.
*   **[User Administration](./settings/03-user-admin.md) (`UserAdministration.tsx`):** Provides UI for inviting users, managing roles, and revoking access. Restricted to users with `manage_system_users` permissions.
*   **[Data Import & Optimization](./settings/07-bulk-import.md) (`DataImport.tsx`):** Features tools for bulk-importing JSON datasets (e.g., packages of plants) and triggering database-wide image compression ([Database Optimization](./settings/04-database-optimization.md)). Restricted to users with `manage_dictionary` permissions.
*   **[Sandbox Management](./settings/05-sandbox-management.md) (`SettingsManager.tsx`):** A specialized reset button that triggers a backend routine to wipe and restore the demo garden. Exclusively available to the `god-admin`.
*   **[Add-ons & Plugins](../09-Addons-Plugins.md) (`AddonManager.tsx`):** The interface for uploading, activating, and configuring dynamically loaded plugins.

*(See the individual widget developer guides for detailed technical breakdowns of each section.)*
