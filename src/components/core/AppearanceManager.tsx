import { useState, FC } from 'react';
import { Container, Card, Button, Toast, Subtitle } from '../../styles/StyledElements';
import { Theme, ColorTheme } from '../../hooks/useTheme';
import { PageHeader } from '../common/PageHeader';
import { Icon } from '../common/Icon';
import { CORE_THEMES, themeManager } from '../../utils/themeManager';

interface AppearanceManagerProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  colorTheme: ColorTheme;
  onColorThemeChange: (theme: ColorTheme) => void;
  iconTheme?: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji';
  onIconThemeChange?: (theme: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji') => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const AppearanceManager: FC<AppearanceManagerProps> = ({
  theme,
  onThemeChange,
  colorTheme,
  onColorThemeChange,
  iconTheme,
  onIconThemeChange,
  onOpenMenu,
  onOpenWorkspaceMenu,
}) => {
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleColorThemeChange = (newTheme: ColorTheme) => {
    onColorThemeChange(newTheme);
    showToast(`Theme changed to ${CORE_THEMES[newTheme]?.name || newTheme}`);
  };

  const availableThemes = themeManager.getAllThemes();

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader
        title="Appearance Settings"
        supertitle="Customize your experience"
        onOpenMenu={onOpenMenu}
        onOpenWorkspaceMenu={onOpenWorkspaceMenu}
      />

      {/* Display Mode Section */}
      <div className="mb-6">
        <Subtitle className="mb-3">Display Mode</Subtitle>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Choose how FloraSync appears on your device
        </p>
        <Card className="flex gap-2 !p-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                onThemeChange(t);
                showToast(`Display mode set to ${t}`);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all flex items-center justify-center gap-2 ${
                theme === t
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 shadow-md'
                  : 'bg-transparent text-slate-500 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-surface-800/50'
              }`}
            >
              {t === 'light' && <Icon name="sun" size={18} />}
              {t === 'dark' && <Icon name="moon" size={18} />}
              {t === 'system' && <Icon name="settings" size={18} />}
              <span>{t}</span>
            </button>
          ))}
        </Card>
      </div>

      {/* Color Themes Section */}
      <div className="mb-6">
        <Subtitle className="mb-3">Color Themes</Subtitle>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Pick your favorite color palette. New themes can be added via plugins.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableThemes.map((themeMetadata) => (
            <button
              key={themeMetadata.id}
              onClick={() => handleColorThemeChange(themeMetadata.id as ColorTheme)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                colorTheme === themeMetadata.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                  : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-surface-50 dark:bg-surface-900/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-6 h-6 rounded-full shadow-sm border-2 border-white dark:border-surface-800"
                  style={{ backgroundColor: themeMetadata.primaryColor }}
                />
                <div className="flex-1">
                  <div className={`font-bold text-sm ${colorTheme === themeMetadata.id ? 'text-primary-700 dark:text-primary-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {themeMetadata.name}
                  </div>
                  {themeMetadata.source === 'plugin' && (
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Plugin
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{themeMetadata.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Icon Style Section */}
      {onIconThemeChange && (
        <div className="mb-6">
          <Subtitle className="mb-3">Icon Style</Subtitle>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Choose how action icons appear throughout the app
          </p>
          <select
            value={iconTheme || 'default'}
            onChange={(e) => {
              onIconThemeChange(e.target.value as 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji');
              showToast('Icon style updated');
            }}
            className="w-full border-2 border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-surface-50 dark:bg-surface-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm font-medium"
          >
            <option value="default">Standard (Bold & Direct)</option>
            <option value="elegant">Elegant (Thin & Refined)</option>
            <option value="minimalist">Minimalist (Clean & Simple)</option>
            <option value="boho-nature">Boho Nature (Hand-drawn)</option>
            <option value="science">Science (Analytical)</option>
            <option value="emoji">Emoji (Native OS)</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Change the style of the water, feed, edit, and view icons across the entire app.
          </p>

          {/* Icon Preview Grid */}
          <div className="grid grid-cols-5 gap-y-5 gap-x-2 mt-4 bg-surface-50 dark:bg-surface-900/50 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="flex flex-col items-center gap-1.5 text-blue-500">
              <Icon name="water" size={24} />
              <span className="text-[9px] uppercase font-bold text-slate-400">Water</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-amber-500">
              <Icon name="feed" size={24} />
              <span className="text-[9px] uppercase font-bold text-slate-400">Feed</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-primary-600">
              <Icon name="edit" size={24} />
              <span className="text-[9px] uppercase font-bold text-slate-400">Edit</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-red-500">
              <Icon name="delete" size={24} />
              <span className="text-[9px] uppercase font-bold text-slate-400">Delete</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-indigo-500">
              <Icon name="map-pin" size={24} />
              <span className="text-[9px] uppercase font-bold text-slate-400">Map</span>
            </div>
          </div>
        </div>
      )}

      {/* Theme Info */}
      <Card className="border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 !p-3 mb-6">
        <p className="text-xs text-primary-700 dark:text-primary-400">
          💡 <strong>Tip:</strong> Your appearance preferences are saved locally. Themes can be extended or customized through plugins in the future.
        </p>
      </Card>

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};
