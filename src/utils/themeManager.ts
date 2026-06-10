/**
 * Theme Manager
 * Handles discovery and management of CSS-based color themes
 * Supports both core themes and plugin-supplied themes
 */

export interface ThemeMetadata {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  source: 'core' | 'plugin';
  cssFile?: string;
}

// Core themes - map to CSS files in src/styles/themes/
export const CORE_THEMES: Record<string, ThemeMetadata> = {
  'default': {
    id: 'default',
    name: 'Default (Emerald)',
    description: 'Fresh green nature theme - the default FloraSync experience',
    primaryColor: '#679c48',
    source: 'core',
    cssFile: 'default.css',
  },
  'ocean': {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blue theme inspired by water and sky',
    primaryColor: '#3b82f6',
    source: 'core',
    cssFile: 'ocean.css',
  },
  'sunset': {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and amber theme for golden hour vibes',
    primaryColor: '#f97316',
    source: 'core',
    cssFile: 'sunset.css',
  },
  'boho-nature': {
    id: 'boho-nature',
    name: 'Boho Nature',
    description: 'Earthy, warm tones for a natural, bohemian aesthetic',
    primaryColor: '#a68563',
    source: 'core',
    cssFile: 'boho-nature.css',
  },
};

export class ThemeManager {
  private pluginThemes: Map<string, ThemeMetadata> = new Map();

  /**
   * Get all available themes (core + plugins)
   */
  getAllThemes(): ThemeMetadata[] {
    return [
      ...Object.values(CORE_THEMES),
      ...Array.from(this.pluginThemes.values()),
    ];
  }

  /**
   * Get a specific theme by ID
   */
  getTheme(themeId: string): ThemeMetadata | undefined {
    return CORE_THEMES[themeId] || this.pluginThemes.get(themeId);
  }

  /**
   * Register a plugin theme
   */
  registerPluginTheme(theme: ThemeMetadata): void {
    if (CORE_THEMES[theme.id]) {
      console.warn(`Theme ID "${theme.id}" conflicts with core theme, skipping plugin theme`);
      return;
    }
    this.pluginThemes.set(theme.id, theme);
  }

  /**
   * Remove a plugin theme
   */
  unregisterPluginTheme(themeId: string): boolean {
    return this.pluginThemes.delete(themeId);
  }

  /**
   * Apply theme by setting data-theme attribute and loading CSS if needed
   */
  applyTheme(themeId: string): boolean {
    const theme = this.getTheme(themeId);
    if (!theme) {
      console.error(`Theme "${themeId}" not found`);
      return false;
    }

    // For core themes, CSS is already imported in index.css
    // For plugin themes, load their CSS file
    if (theme.source === 'plugin' && theme.cssFile) {
      this.loadThemeCss(theme.cssFile);
    }

    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('florasync_color_theme', themeId);
    return true;
  }

  /**
   * Get currently active theme ID
   */
  getActiveTheme(): string {
    return document.documentElement.getAttribute('data-theme') || 'default';
  }

  /**
   * Dynamically load theme CSS (for plugins)
   */
  private loadThemeCss(cssFile: string): void {
    const linkId = `theme-${cssFile}`;
    let link = document.getElementById(linkId) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = cssFile;
      document.head.appendChild(link);
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
