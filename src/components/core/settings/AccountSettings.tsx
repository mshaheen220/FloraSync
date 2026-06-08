import { useState, FC, FormEvent } from 'react';
import { Card, Button, Input } from '../../../styles/StyledElements';
import { User } from '../../../App';
import { Icon } from '../../common/Icon';

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='100%25' height='100%25' fill='%2310b981' fill-opacity='0.2'/%3E%3Ctext x='50%25' y='50%25' font-size='100' text-anchor='middle' dominant-baseline='middle'%3E🌿%3C/text%3E%3C/svg%3E";

interface AccountSettingsProps {
  currentUser: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
  token?: string | null;
  showToast: (msg: string) => void;
}

export const AccountSettings: FC<AccountSettingsProps> = ({ currentUser, onUpdateUser, onLogout, token, showToast }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (changeNewPassword !== confirmPassword) {
      showToast('❌ New passwords do not match!');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await fetch(`${apiBase}/api/users/${currentUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword: changeNewPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Password changed successfully!');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setChangeNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      showToast('❌ Failed to change password.');
    }
    setIsUpdatingPassword(false);
  };

  return (
    <Card className="mb-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          {currentUser.imageUrl ? (
            <img src={currentUser.imageUrl} alt="Profile" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl font-bold text-emerald-700 dark:text-emerald-400 border-2 border-emerald-500">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 bg-emerald-500 text-white rounded-full p-1.5 cursor-pointer hover:bg-emerald-600 transition-colors shadow-md text-xs leading-none flex items-center justify-center">
            <Icon name="camera" size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => onUpdateUser({ imageUrl: reader.result as string });
                reader.readAsDataURL(file);
              }
            }} />
          </label>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Display Name</label>
          <Input value={currentUser.name} onChange={e => onUpdateUser({ name: e.target.value })} className="!mb-0" />
        </div>
      </div>
      
      {!showPasswordForm ? (
        <Button $variant="secondary" type="button" onClick={() => setShowPasswordForm(true)} className="w-full mb-3 text-sm">
          Change Password
        </Button>
      ) : (
        <form onSubmit={handleChangePassword} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
            <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="!mb-0 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">New Password</label>
            <Input type="password" value={changeNewPassword} onChange={e => setChangeNewPassword(e.target.value)} className="!mb-0 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="!mb-0 py-2 text-sm" required />
          </div>
          <div className="flex gap-2 mt-1">
            <Button type="button" $variant="secondary" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
            <Button type="submit" disabled={isUpdatingPassword}>{isUpdatingPassword ? 'Saving...' : 'Save Password'}</Button>
          </div>
        </form>
      )}

      <Button $variant="secondary" onClick={onLogout} className="w-full !text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-900/50 hover:!bg-red-50 dark:hover:!bg-red-900/20">
        Log Out
      </Button>
    </Card>
  );
};
