import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ColorTheme = 'default' | 'emerald' | 'ocean' | 'sunset' | 'boho-nature' | 'amethyst';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('florasync_theme') as Theme) || 'system');
  // Support legacy 'emerald' name, map to 'default'
  const storedColorTheme = localStorage.getItem('florasync_color_theme') as ColorTheme || 'default';
  const normalizedColorTheme = storedColorTheme === 'emerald' ? 'default' : storedColorTheme;
  const [colorTheme, setColorTheme] = useState<ColorTheme>(normalizedColorTheme);

  useEffect(() => {
    localStorage.setItem('florasync_theme', theme);
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('florasync_color_theme', colorTheme);
    document.documentElement.setAttribute('data-theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme, colorTheme, setColorTheme };
}
