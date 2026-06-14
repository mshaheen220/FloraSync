---
id: "dev-settings-garden-profile"
title: "Architecture: Garden Profile Settings"
category: "Developer Guide"
parent: "dev-settings-administration"
tags: ["settings", "profile", "workspace", "components"]
---

# Garden Profile Settings (Developer Architecture)

This document details the architecture and implementation of the **Garden Profile** section within the Settings module. The Garden Profile manages the metadata for the currently active workspace, specifically the garden's name and its cover photo.

## 1. Data Model

The core data structure for the Garden Profile is defined in `types.ts`. It's a lightweight representation of a workspace's visual identity:

```typescript
export interface GardenProfile {
  id: string;
  name: string;
  imageUrl?: string;
}
```

This data is globally accessible across the application via `GardenContext` (where it is typically available as `gardenProfile`), allowing headers, workspace switchers, and settings menus to reflect the current workspace's identity dynamically.

## 2. Component Architecture

The settings UI for the Garden Profile is modularized. It follows a presentation-and-container pattern:

### `GardenProfileSettings.tsx` (Presentation)
This is a stateless, pure presentation component located in `src/components/core/settings/GardenProfileSettings.tsx`. 
- **Props**: It receives the `gardenProfile` object and an `onUpdateGarden(name, imageUrl)` callback handler.
- **Image Handling**: It uses the shared `<ImageUploadInput>` component (configured with `type="garden"` and `maxWidth={400}`). If no `imageUrl` is present on the profile, it gracefully falls back to a standardized SVG icon placeholder. If an image load error occurs, it also drops back to the placeholder.
- **Name Handling**: It uses a standard `<Input>` element to capture and update the workspace name.

```typescript
interface GardenProfileSettingsProps {
  gardenProfile: GardenProfile;
  onUpdateGarden: (name: string, imageUrl: string) => void;
}
```

### `SettingsManager.tsx` (Container)
The `SettingsManager` acts as the orchestrator for all settings categories. 
- It conditionally renders the `GardenProfileSettings` component only if `gardenProfile` and `onUpdateGarden` are successfully passed down, guaranteeing that the user is currently authenticated and situated within an active workspace context.
- It leverages a reusable `<SettingsSection>` wrapper to handle the accordion-style expand/collapse behavior.

## 3. Permissions & Context

As per the product specifications, only **Garden Owners** and **Admins** have the required permissions to modify the Garden Profile. While the `GardenProfileSettings.tsx` component is unconcerned with permissions (purely presentational), the top-level application logic fetching and providing `onUpdateGarden` manages these restrictions. If a user does not possess the correct workspace role, the profile settings are either disabled or rendered in read-only mode to prevent unauthorized metadata changes.

## 4. Updates and State Hydration

When `onUpdateGarden` is triggered from the `GardenProfileSettings` component, the payload (either a new base64 image string from the file reader or an updated name string) is sent upstream. The top-level state provider makes the API call to update the workspace record in the database. Upon a successful response, the local React state (via `GardenContext`) is patched. This instantly updates the `PageHeader`, Dashboard greeting, and `WorkspaceSwitcher` components without requiring a full application refresh.