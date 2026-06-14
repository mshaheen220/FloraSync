---
id: "dev-login"
title: "Architecture: Access, Login & Themes"
category: "Developer Guide"
tags: ["login", "authentication", "roles", "jwt", "themes"]
---

# Access & Login (Developer Architecture)

This document outlines the authentication, role management, and initial application state (including theming) during the FloraSync login process.

## 1. Authentication Flow & JWT

FloraSync uses JSON Web Tokens (JWT) for secure, stateless authentication between the React frontend and the Express backend.

1.  **Login Submission:** The `LoginScreen` component (`src/components/core/LoginScreen.tsx`) sends the `username` and `password` to the `/api/auth/login` endpoint.
2.  **Verification:** The server (`server/routes/auth.js`) looks up the user by `username` (converted to lowercase) and verifies the password hash using `bcrypt`.
3.  **Token Generation:** If successful, the server signs a JWT containing the user's `id`, `username`, and system `role`.
4.  **Client Storage:** The frontend stores this token (typically in `localStorage`) and attaches it as a Bearer token in the `Authorization` header for all subsequent API requests.
5.  **Middleware:** The `server/middleware.js` intercepts protected routes, verifies the JWT, and attaches the decoded payload to the `req.user` object for downstream use.

## 2. Role-Based Access Control (RBAC)

FloraSync employs a two-tiered role system: System Roles and Workspace Roles.

### System Roles
Stored directly on the `users` table.
*   **`god-admin`:** The ultimate superuser. Bypasses workspace checks and has full access to the User Administration settings (creating users, forcing password resets).
*   **`demo`:** A restricted system role used for public sandboxes. Usually prevents changing passwords or destructive system-wide actions.
*   **User (Default):** Standard users.

### Workspace (Garden) Roles
Stored in the `garden_members` junction table, linking a `user_id` to a `garden_id`.
*   **`owner`:** Full control over the specific garden. Can manage other members' access to that garden, edit the dictionary, and generate QR codes.
*   **`admin` / `helper`:** (Often treated similarly in the UI) Can log events and edit instances, but cannot perform destructive actions like deleting plants or managing users.
*   **`viewer`:** Strictly read-only access to the garden's inventory and journals.

The backend routes (e.g., `server/routes/gardens.js`) constantly verify the `effectiveRole` by checking the junction table against the `req.user.id`.

## 3. The Initial State: Theming

Because user preferences (like Light/Dark mode, specific color palettes, and icon styles) are stored in the database and tied to their account (`theme`, `color_theme`, `icon_theme`), the application does not know these preferences *before* the user logs in.

**Implementation detail:**
The `LoginScreen` is intentionally rendered before the database is fetched and before the `currentUser` context is fully populated. Therefore, **the login screen always utilizes the application's global default colors and CSS styles.** It will respect the OS-level dark mode preference (via media queries like `prefers-color-scheme: dark` in standard Tailwind/CSS), but it will not reflect a user's custom green/purple preference until authentication succeeds and the user's profile is loaded.