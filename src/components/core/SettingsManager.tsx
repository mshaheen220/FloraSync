import { useState, FC } from 'react';
import { Container, Toast, Subtitle } from '../../styles/StyledElements';
import { User, GardenProfile } from '../../App';
import { DataImport } from '../core/settings/DataImport';
import { GardenProfileSettings } from '../core/settings/GardenProfileSettings';
import { AccountSettings } from '../core/settings/AccountSettings';
import { UserAdministration } from '../core/settings/UserAdministration';
import { PageHeader } from '../common/PageHeader';
import { hasPermission } from '../../utils/permissions';
import { AddonManager } from './settings/AddonManager';

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
  onOpenMenu, onOpenWorkspaceMenu, currentUser, onUpdateUser, gardenProfile, onUpdateGarden, onLogout, token 
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

      {hasPermission(currentUser, 'manage_inventory') && (
        <SettingsSection title="Data Import" isExpanded={expandedSettings.includes('import')} onToggle={() => toggleSetting('import')}>
          <DataImport token={token} showToast={showToast} />
        </SettingsSection>
      )}

      <SettingsSection title="Add-ons & Plugins" isExpanded={expandedSettings.includes('addons')} onToggle={() => toggleSetting('addons')}>
        <AddonManager 
          currentUser={currentUser || null} 
          token={token}
        />
      </SettingsSection>

      <Toast $visible={!!toastMessage}>{toastMessage}</Toast>
    </Container>
  );
};