import { useState, FC } from 'react';
import { Container, Toast, Subtitle, Button } from '../../styles/StyledElements';
import { User, GardenProfile } from '../../App';
import { DataImport } from '../core/settings/DataImport';
import { GardenProfileSettings } from '../core/settings/GardenProfileSettings';
import { AccountSettings } from '../core/settings/AccountSettings';
import { UserAdministration } from '../core/settings/UserAdministration';
import { PageHeader } from '../common/PageHeader';
import { hasPermission } from '../../utils/permissions';
import { AddonManager } from './settings/AddonManager';
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

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const handleResetDemo = async () => {
    if (!window.confirm('WARNING: This will completely wipe and reset the Demo Garden to its initial seed state. Continue?')) return;
    
    try {
      const res = await fetch(`${apiBase}/api/system/reset-demo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Sandbox successfully reset!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      showToast('❌ Failed to reset demo garden.');
    }
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

          {currentUser.role === 'god-admin' && (
            <SettingsSection title="Sandbox Management" isExpanded={expandedSettings.includes('sandbox')} onToggle={() => toggleSetting('sandbox')}>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Instantly wipe the Demo Garden and restore it from the <code>demo-seed.json</code> template. This will also ensure the demo user account exists and has the correct permissions.
                </p>
                <Button onClick={handleResetDemo} className="flex justify-center items-center gap-2 !bg-red-50 dark:!bg-red-900/30 !text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-800 hover:!bg-red-100 dark:hover:!bg-red-900/50 shadow-none">
                  <Icon name="refresh-cw" size={18} /> Reset Demo Garden
                </Button>
              </div>
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