---
id: "dev-settings-appearance"
title: "Appearance & Theming"
category: "Developer Guide"
tags: ["appearance", "theme", "dark mode", "colors", "icons", "tailwind", "css variables"]
---

# Appearance & Theming (Developer Guide)

FloraSync employs a robust, profile-scoped appearance system that allows independent personalization of display modes (light/dark), color palettes, and icon styles without affecting other users in the workspace.

## Database & Data Model

Appearance settings are attached directly to the user profile, not the garden.

* **Database Table:** `users`
* **Columns:** 
  * `theme TEXT` (Stores `'light'`, `'dark'`, or `'system'`)
  * `color_theme TEXT` (Stores the ID of the color palette, e.g., `'default'`, `'ocean'`)
  * `icon_theme TEXT` (Stores the ID of the icon set, e.g., `'default'`, `'elegant'`)

Updates are handled via `PUT /api/user/profile` in `server/routes/users.js`. The SQL query utilizes the `COALESCE` function to allow partial updates of theme properties without accidentally wiping out other user fields (like their `name`).

## Display Mode (Light / Dark)

Display modes are primarily managed by `src/hooks/useTheme.ts` and leverage TailwindCSS's `darkMode: 'class'` configuration.

1. **State Initialization:** The hook retrieves the `florasync_theme` from `localStorage`, defaulting to `'system'`.
2. **DOM Manipulation:** 
   * If `'dark'`, it adds the `.dark` class to `document.documentElement`.
   * If `'system'`, it dynamically checks `window.matchMedia('(prefers-color-scheme: dark)')` to apply or remove the `.dark` class.
3. **Event Listeners:** When in `'system'` mode, an event listener is attached to `matchMedia` to automatically toggle the `.dark` class if the OS-level theme changes.

## Color Themes & Extensibility

FloraSync avoids hardcoding static color hex codes in Tailwind classes. Instead, it uses dynamic CSS variables that map to an overarching palette structure (`primary`, `surface`, `slate`, etc.).

1. **Tailwind Configuration:** In `tailwind.config.js`, colors map to RGB variables using the `<alpha-value>` syntax:
   `500: 'rgb(var(--color-primary-500) / <alpha-value>)'`
2. **CSS Variable Ingestion:** The `src/styles/themes/` directory contains CSS files (e.g., `default.css`, `ocean.css`) that define the exact raw RGB values on the `:root` pseudo-class. 
3. **Applying Themes:** `useTheme.ts` syncs the active `colorTheme` to the `data-theme` attribute on `document.documentElement` to allow cascading style shifts.
4. **Theme Manager & Plugins (`themeManager.ts`):** 
   The application uses a singleton `ThemeManager` to register both core themes and plugin-supplied themes. When a plugin theme is activated, the manager dynamically injects a `<link rel="stylesheet">` tag into the document `<head>` to load the plugin's custom CSS variable overrides.

## Icon Themes

Icon theming is handled as a prop (`iconTheme`) propagated through the component tree (e.g., `AppearanceManager.tsx`). Components dynamically select their image sources or SVG render paths depending on the active user preference (`'default'`, `'elegant'`, `'minimalist'`, `'boho-nature'`, `'science'`, `'emoji'`).

**Creating New Icon Sets:**
It is extremely easy to introduce a new icon set to the platform. A developer or plugin creator simply maps their custom assets—whether those are image URLs, SVG components, or raw text characters/emojis—to the core icon definitions used throughout the app. Furthermore, the system includes a built-in fallback mechanism; if a specific icon definition is missing from the custom map, it automatically falls back to the default standard icon. This ensures that incomplete icon sets never break the user interface.