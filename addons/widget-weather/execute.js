import WeatherWidget from './WeatherWidget.tsx';

// The main application will dynamically import this file and look for this export.
// The key 'dashboard' matches the entryPoint in manifest.json.
export const components = {
  dashboard: WeatherWidget,
};