import { useState, useEffect, FC, FormEvent } from 'react';
import { Card, Button, Input, Subtitle } from '../../../styles/StyledElements';
import { User } from '../../../App';
import { UserCard } from './UserCard';
import { hasPermission } from '../../../utils/permissions';
import { Icon } from '../../common/Icon';

interface UserAdministrationProps {
  currentUser: User;
  token?: string | null;
  showToast: (msg: string) => void;
}

export const UserAdministration: FC<UserAdministrationProps> = ({ currentUser, token, showToast }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [gardensList, setGardensList] = useState<{id: string, name: string}[]>([]);
  const [selectedGardenId, setSelectedGardenId] = useState('');
  const [managingAccessUserId, setManagingAccessUserId] = useState<string | null>(null);
  const [userAccessList, setUserAccessList] = useState<{gardenId: string, gardenName: string, role: string}[]>([]);
  const [grantGardenId, setGrantGardenId] = useState('');
  const [grantRole, setGrantRole] = useState('helper');

  const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const apiBase = ['5173', '5174', '5175'].includes(window.location.port) ? `${window.location.protocol}//${host}:5050` : '';

  useEffect(() => {
    if (hasPermission(currentUser, 'manage_system_users') && token) {
      fetch(`${apiBase}/api/users`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.users) setUsersList(data.users);
        })
        .catch(err => console.error('Failed to load users:', err));
        
      fetch(`${apiBase}/api/gardens`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.gardens) setGardensList(data.gardens);
        })
        .catch(err => console.error('Failed to load gardens:', err));
    }
  }, [currentUser, apiBase, token]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setIsCreatingUser(true);
    try {
      const res = await fetch(`${apiBase}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, name: newFullName, gardenId: selectedGardenId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ User ${data.user.username} created successfully!`);
        setNewUsername('');
        setNewPassword('');
        setNewFullName('');
        setSelectedGardenId('');
        setUsersList(prev => [...prev, data.user]);
        if (data.newGarden) {
          setGardensList(prev => [...prev, data.newGarden]);
        }
        setIsAddingUser(false);
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to create user.'); }
    setIsCreatingUser(false);
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${username}' and all their garden data?`)) return;
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ User ${username} deleted.`);
        setUsersList(prev => prev.filter(u => u.id !== userId));
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to delete user.'); }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const newPass = window.prompt(`Enter new password for ${username}:`);
    if (!newPass) return;
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: newPass })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Password updated for ${username}.`);
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to update user.'); }
  };

  const handleManageAccess = async (userId: string) => {
    if (managingAccessUserId === userId) {
      setManagingAccessUserId(null);
      return;
    }
    setManagingAccessUserId(userId);
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}/gardens`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setUserAccessList(data.access);
      }
    } catch (e) {
      showToast('❌ Failed to load access list.');
    }
  };

  const handleGrantAccess = async (userId: string) => {
    if (!grantGardenId) return;
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}/gardens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ gardenId: grantGardenId, role: grantRole })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Access granted!');
        const garden = gardensList.find(g => g.id === grantGardenId);
        if (garden) {
          setUserAccessList(prev => [...prev.filter(a => a.gardenId !== grantGardenId), { gardenId: grantGardenId, gardenName: garden.name, role: grantRole }]);
          setUsersList(prev => prev.map(u => {
            if (u.id === userId) {
              const existingAccesses = u.accesses || [];
              return { ...u, accesses: [...existingAccesses.filter(a => a.id !== grantGardenId), { id: garden.id, name: garden.name, role: grantRole }] };
            }
            return u;
          }));
        }
        setGrantGardenId('');
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      showToast('❌ Failed to grant access.');
    }
  };

  const handleRevokeAccess = async (userId: string, gardenId: string) => {
    if (!window.confirm('Revoke this access?')) return;
    try {
      const res = await fetch(`${apiBase}/api/users/${userId}/gardens/${gardenId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('🗑️ Access revoked!');
        setUserAccessList(prev => prev.filter(a => a.gardenId !== gardenId));
        setUsersList(prev => prev.map(u => {
          if (u.id === userId) {
            return { ...u, accesses: (u.accesses || []).filter(a => a.id !== gardenId) };
          }
          return u;
        }));
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      showToast('❌ Failed to revoke access.');
    }
  };

  const handleRenameGarden = async (gardenId: string, currentName: string) => {
    const newName = window.prompt(`Rename garden '${currentName}':`, currentName);
    if (!newName || newName === currentName) return;
    try {
      const res = await fetch(`${apiBase}/api/gardens/${gardenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newName })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Garden renamed to ${newName}`);
        setGardensList(prev => prev.map(g => g.id === gardenId ? { ...g, name: newName } : g));
        setUsersList(prev => prev.map(u => {
          if (u.accesses) {
            return {
              ...u,
              accesses: u.accesses.map(a => a.id === gardenId ? { ...a, name: newName } : a)
            };
          }
          return u;
        }));
      } else {
        showToast(`❌ Error: ${data.error}`);
      }
    } catch (err) { showToast('❌ Failed to rename garden.'); }
  };

  return (
    <Card className="mb-4 border-emerald-500 dark:border-emerald-500">
      {!isAddingUser ? (
        <Button onClick={() => setIsAddingUser(true)} className="mb-2">+ Add New Account</Button>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
          <Subtitle className="!mt-0 mb-2 !text-sm">Provision New Account</Subtitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Provision new garden accounts for your friends. They will have their own private gardens but share your global Plant Dictionary.</p>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username</label>
                <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="!mb-0 py-2" required />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Password</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="!mb-0 py-2" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name (Optional)</label>
              <Input value={newFullName} onChange={e => setNewFullName(e.target.value)} className="!mb-0 py-2" placeholder="e.g. Alice Gardener" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Assign to Garden</label>
              <select value={selectedGardenId} onChange={e => setSelectedGardenId(e.target.value)} className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all text-sm mb-1">
                <option value="">🌱 Create New Private Garden</option>
                {gardensList.map(g => (
                  <option key={g.id} value={g.id}>🤝 Share: {g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-2">
              <Button type="button" $variant="secondary" onClick={() => setIsAddingUser(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreatingUser}>
                {isCreatingUser ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {usersList.length > 0 && (
        <div className={`${!isAddingUser ? 'mt-4' : 'mt-2'} pt-4 border-t border-emerald-200 dark:border-emerald-800/50`}>
          <Subtitle className="!text-sm mb-3">Existing Accounts</Subtitle>
          <div className="flex flex-col gap-2">
            {usersList.map(u => (
              <UserCard
                key={u.id}
                user={u}
                currentUser={currentUser}
                isManagingAccess={managingAccessUserId === u.id}
                userAccessList={userAccessList}
                gardensList={gardensList}
                grantGardenId={grantGardenId}
                grantRole={grantRole}
                onManageAccess={handleManageAccess}
                onResetPassword={handleResetPassword}
                onDeleteUser={handleDeleteUser}
                onRevokeAccess={handleRevokeAccess}
                onGrantAccess={handleGrantAccess}
                setGrantGardenId={setGrantGardenId}
                setGrantRole={setGrantRole}
              />
            ))}
          </div>
        </div>
      )}
      
      {gardensList.length > 0 && (
        <div className="mt-6 pt-4 border-t border-emerald-200 dark:border-emerald-800/50">
          <Subtitle className="!text-sm mb-3">Active Gardens</Subtitle>
          <div className="flex flex-col gap-2">
            {gardensList.map(g => (
              <div key={g.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block"><Icon name="tree-palm" size={14} className='float-left inline-block mr-1' /> {g.name}</span>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => handleRenameGarden(g.id, g.name)} title="Rename Garden" className="p-1.5 text-base rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90"><Icon name="pencil" size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};