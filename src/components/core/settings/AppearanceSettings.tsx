import { FC } from 'react';
import { Card } from '../../../styles/StyledElements';
import { Theme } from '../../../App';

interface AppearanceSettingsProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const AppearanceSettings: FC<AppearanceSettingsProps> = ({ theme, onThemeChange }) => {
  return (
    <Card className="flex gap-2 !p-2 mb-4">
      {(['light', 'dark', 'system'] as const).map(t => (
        <button
          key={t}
          onClick={() => onThemeChange(t)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-colors ${
            theme === t 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' 
              : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
          }`}
        >
          {t}
        </button>
      ))}
    </Card>
  );
};