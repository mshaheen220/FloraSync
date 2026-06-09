import { useState, FC } from 'react';
import { Container, Toast, Subtitle } from '../../styles/StyledElements';
import { Theme, User, GardenProfile } from '../../App';
import { ColorTheme } from '../../hooks/useTheme';
import { DataImport } from '../core/settings/DataImport';
import { AppearanceSettings } from '../core/settings/AppearanceSettings';
import { GardenProfileSettings } from '../core/settings/GardenProfileSettings';
import { AccountSettings } from '../core/settings/AccountSettings';
import { UserAdministration } from '../core/settings/UserAdministration';
import { PageHeader } from '../common/PageHeader';
import { hasPermission } from '../../utils/permissions';
import { Icon } from '../common/Icon';

const SettingsSection: FC<{ title: string; isExpanded: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, isExpanded, onToggle, children }) => (
  <div className="border-b border-surface-200 dark:border-surface-800 pb-2 mb-4 last:border-0">
    <button onClick={onToggle} className="w-full flex items-center justify-between text-left group py-2 mb-2 active:scale-[0.98] transition-transform">
      <Subtitle className="!m-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{title}</Subtitle>
      <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
    </button>
    {isExpanded && children}
  </div>
);

interface SettingsManagerProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  colorTheme?: ColorTheme;
  onColorThemeChange?: (theme: ColorTheme) => void;
  iconTheme?: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science';
  onIconThemeChange?: (theme: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science') => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  currentUser?: User;
  onUpdateUser?: (updates: Partial<User>) => void;
  gardenProfile?: GardenProfile | null;
  onUpdateGarden?: (name: string, imageUrl: string) => void;
  onLogout?: () => void;
  token?: string | null;
}

export const SettingsManager: FC<SettingsManagerProps> = ({ 
  theme, onThemeChange, colorTheme, onColorThemeChange, iconTheme, onIconThemeChange, onOpenMenu, onOpenWorkspaceMenu, currentUser, onUpdateUser, gardenProfile, onUpdateGarden, onLogout, token 
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [expandedSettings, setExpandedSettings] = useState<string[]>([]);

  const toggleSetting = (section: string) => {
    setExpandedSettings(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <Container className="animate-in slide-in-from-bottom-4 duration-300">
      <PageHeader title="General Settings" supertitle={gardenProfile?.name || 'FloraSync'} onOpenMenu={onOpenMenu} onOpenWorkspaceMenu={onOpenWorkspaceMenu} />

      {gardenProfile && onUpdateGarden && (
        <SettingsSection title="Garden Profile" isExpanded={expandedSettings.includes('garden')} onToggle={() => toggleSetting('garden')}>
          <GardenProfileSettings gardenProfile={gardenProfile} onUpdateGarden={onUpdateGarden} />
        </SettingsSection>
      )}

      {currentUser && onUpdateUser && onLogout && (
        <>
          <SettingsSection title="Account Info" isExpanded={expandedSettings.includes('account')} onToggle={() => toggleSetting('account')}>
            <AccountSettings currentUser={currentUser} onUpdateUser={onUpdateUser} onLogout={onLogout} token={token} showToast={showToast} />
          </SettingsSection>

          {hasPermission(currentUser, 'manage_system_users') && (
            <SettingsSection title="User Administration" isExpanded={expandedSettings.includes('users')} onToggle={() => toggleSetting('users')}>
              <UserAdministration currentUser={currentUser} token={token} showToast={showToast} />
            </SettingsSection>
          )}
        </>
      )}

      <SettingsSection title="Appearance" isExpanded={expandedSettings.includes('appearance')} onToggle={() => toggleSetting('appearance')}>
        <AppearanceSettings theme={theme} onThemeChange={onThemeChange} colorTheme={colorTheme} onColorThemeChange={onColorThemeChange} />
        
        {onIconThemeChange && (
          <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Icon Style</label>
            <select 
              value={iconTheme || 'default'} 
              onChange={e => onIconThemeChange(e.target.value as 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science')}
              className="w-full border-2 border-surface-200 dark:border-surface-700 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 bg-surface-50 dark:bg-surface-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm"
            >
              <option value="default">Standard (Bold & Direct)</option>
              <option value="elegant">Elegant (Thin & Refined)</option>
              <option value="minimalist">Minimalist (Clean & Simple)</option>
              <option value="boho-nature">Boho Nature (Hand-drawn)</option>
              <option value="science">Science (Analytical)</option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Change the style of the water, feed, edit, and view icons across the entire app.</p>
            
            <div className="grid grid-cols-4 gap-y-5 gap-x-2 mt-4 bg-surface-50 dark:bg-surface-900/50 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
              <div className="flex flex-col items-center gap-1.5 text-blue-500"><Icon name="water" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Water</span></div>
              <div className="flex flex-col items-center gap-1.5 text-amber-500"><Icon name="feed" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Feed</span></div>
              <div className="flex flex-col items-center gap-1.5 text-primary-500"><Icon name="edit" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Edit</span></div>
              <div className="flex flex-col items-center gap-1.5 text-red-500"><Icon name="delete" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Delete</span></div>
              <div className="flex flex-col items-center gap-1.5 text-indigo-500"><Icon name="map-pin" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Map</span></div>
              <div className="flex flex-col items-center gap-1.5 text-primary-600"><Icon name="sprout" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Plant</span></div>
              <div className="flex flex-col items-center gap-1.5 text-amber-600"><Icon name="apple" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Yield</span></div>
              <div className="flex flex-col items-center gap-1.5 text-purple-500"><Icon name="book-open-text" size={24} /><span className="text-[9px] uppercase font-bold text-slate-400">Log</span></div>
            </div>
          </div>
        )}
      </SettingsSection>

      {hasPermission(currentUser, 'manage_inventory') && (
        <SettingsSection title="Data Import" isExpanded={expandedSettings.includes('import')} onToggle={() => toggleSetting('import')}>
          <DataImport token={token} showToast={showToast} />
        </SettingsSection>
      )}

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};