---
id: "dev-settings-account-info"
title: "Architecture: Account Info Settings"
category: "Developer Guide"
parent: "dev-settings-administration"
tags: ["settings", "account", "user", "authentication", "components"]
---

# Account Info Settings (Developer Architecture)

This document details the architecture and implementation of the **Account Info** section within the Settings module. This section is responsible for managing the authenticated user's personal profile, permissions visibility, security (password management), and session state.

## 1. Data Model

The core data structure for the current user is defined by the `User` interface in `types.ts`. The `AccountSettings` component specifically focuses on a subset of these fields:

```typescript
export interface User {
  id: string;
  username: string;     // The core login identifier (read-only in UI)
  name: string;         // The display name
  imageUrl?: string;    // Base64 encoded avatar image or remote URL
  role?: string;        // System-wide role (e.g., 'god-admin')
  workspaceRole?: string; // Role within the current active workspace
  // ... other fields (themes, addons) managed elsewhere
}
```

## 2. Component Architecture

The settings UI for the user account is centralized in a presentation-and-logic hybrid component.

### `AccountSettings.tsx`
Located in `src/components/core/settings/AccountSettings.tsx`, this component handles both the display of user data and the localized state for the password change workflow.

- **Props**:
  - `currentUser` (`User`): The active user object.
  - `onUpdateUser`: Callback to patch user profile data (name, avatar).
  - `onLogout`: Callback to trigger the session termination.
  - `showToast`: Callback to display localized feedback to the user.

- **Profile and Avatar Handling**:
  - The component displays the user's avatar. If `imageUrl` is absent, it generates a fallback avatar using the first letter of the user's `name` rendered inside a colored circle. If the image fails to load, it falls back to a default SVG.
  - Updating the avatar leverages the generic `<ImageUploadInput>` component (converting the file to base64) which immediately fires the `onUpdateUser({ imageUrl: base64 })` payload.
  - The `name` (Display Name) is editable via a standard text input, emitting changes via `onUpdateUser`.
  - The `username` (Login identifier) is strictly rendered as a disabled `<Input>` to emphasize that it is immutable.

- **Permissions Display**:
  - The component provides a read-only visual read-out of the user's current authorization contexts:
    - **System Role**: Derived from `currentUser.role` (e.g., indicating if they are a 'God-Admin').
    - **Workspace Role**: Derived from `currentUser.workspaceRole` (e.g., 'owner', 'admin', 'viewer' for the currently active garden context).

- **Password Management Workflow**:
  - Password updates are managed with internal component state (`showPasswordForm`, `currentPassword`, `changeNewPassword`, `confirmPassword`, `isUpdatingPassword`).
  - Instead of passing password changes upstream to a context provider, the component makes a direct `apiFetch` call to `PUT /api/users/${currentUser.id}/password`.
  - The request payload requires both the `currentPassword` (for security verification) and the `newPassword`. The component performs client-side validation to ensure `changeNewPassword` and `confirmPassword` match before firing the request.
  - Success or failure dictates the `showToast` feedback message and resets the internal form state.

- **Session Management**:
  - A prominent "Log Out" button triggers the `onLogout` prop, delegating the cleanup of the authentication token and state reset to the higher-order authentication provider.

## 3. Context & Access Control

Unlike the *Garden Profile* settings which check for workspace permissions, the **Account Info** section is globally accessible to *any* authenticated user. Every user has the right to modify their display name, avatar, password, and terminate their session, irrespective of their role in the current active workspace. The `SettingsManager.tsx` container conditionally renders this block strictly based on the presence of a valid `currentUser` object.