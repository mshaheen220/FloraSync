import { FC } from 'react';
import { Card } from '../../../styles/StyledElements';
import { Theme } from '../../../App';
import { ColorTheme } from '../../../hooks/useTheme';

interface AppearanceSettingsProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  colorTheme?: ColorTheme;
  onColorThemeChange?: (theme: ColorTheme) => void;
}

export const AppearanceSettings: FC<AppearanceSettingsProps> = ({ theme, onThemeChange, colorTheme, onColorThemeChange }) => {
  const colorThemes: { value: ColorTheme; label: string; color: string }[] = [
    { value: 'emerald', label: 'Emerald', color: '#679c48' },
    { value: 'ocean', label: 'Ocean', color: '#3b82f6' },
    { value: 'sunset', label: 'Sunset', color: '#f97316' },
    { value: 'amethyst', label: 'Amethyst', color: '#d946ef' },
    { value: 'science' as ColorTheme, label: 'Science', color: '#2d5a27' },
  ];

  return (
    <>
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Display Mode</label>
        <Card className="flex gap-2 !p-2">
          {(['light', 'dark', 'system'] as const).map(t => (
            <button
              key={t}
              onClick={() => onThemeChange(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${
                theme === t 
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300' 
                  : 'bg-transparent text-slate-500 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-surface-800/50'
              }`}
            >
              {t}
            </button>
          ))}
        </Card>
      </div>

      {onColorThemeChange && (
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Color Theme</label>
          <div className="grid grid-cols-2 gap-2">
            {colorThemes.map(ct => (
              <button
                key={ct.value}
                onClick={() => onColorThemeChange(ct.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  colorTheme === ct.value 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-transparent'
                }`}
              >
                <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: ct.color }} />
                <span className={`text-sm font-bold capitalize ${colorTheme === ct.value ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {ct.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};