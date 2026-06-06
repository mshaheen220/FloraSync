import { FC } from 'react';
import { User } from '../../../App';

interface UserCardProps {
  user: User;
  currentUser: User;
  isManagingAccess: boolean;
  userAccessList: { gardenId: string, gardenName: string, role: string }[];
  gardensList: { id: string, name: string }[];
  grantGardenId: string;
  grantRole: string;
  onManageAccess: (userId: string) => void;
  onResetPassword: (userId: string, username: string) => void;
  onDeleteUser: (userId: string, username: string) => void;
  onRevokeAccess: (userId: string, gardenId: string) => void;
  onGrantAccess: (userId: string) => void;
  setGrantGardenId: (id: string) => void;
  setGrantRole: (role: string) => void;
}

export const UserCard: FC<UserCardProps> = ({
  user, currentUser, isManagingAccess, userAccessList, gardensList,
  grantGardenId, grantRole, onManageAccess, onResetPassword, onDeleteUser,
  onRevokeAccess, onGrantAccess, setGrantGardenId, setGrantRole
}) => {
  return (
    <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 block">{user.name || user.username}</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {user.role === 'god-admin' && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-200 dark:border-purple-800">Admin</span>}
            {user.accesses && user.accesses.length > 0 ? [...user.accesses].sort((a, b) => {
            const order: Record<string, number> = { admin: 1, owner: 2, helper: 3, viewer: 4 };
            return (order[a.role] || 5) - (order[b.role] || 5);
            }).map(acc => (
              <span key={acc.id} className="text-[10px] bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium border border-slate-200 dark:border-slate-600 flex items-center gap-1">
              {acc.role === 'admin' ? '🛡️' : acc.role === 'owner' ? '👑' : acc.role === 'helper' ? '🤝' : '👁️'} {acc.name}
              </span>
            )) : (
              <span className="text-[10px] text-slate-400 italic">No garden access</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user.id === currentUser.id && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 mr-1">You</span>
          )}
          <button type="button" onClick={() => onManageAccess(user.id)} title="Manage Access" className={`p-1.5 text-base rounded-lg transition-colors active:scale-90 ${isManagingAccess ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400'}`}>🛡️</button>
          {user.id !== currentUser.id && (
            <>
              <button type="button" onClick={() => onResetPassword(user.id, user.username)} title="Reset Password" className="p-1.5 text-base rounded-lg transition-colors text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 active:scale-90">🔑</button>
              <button type="button" onClick={() => onDeleteUser(user.id, user.username)} title="Delete User" className="p-1.5 text-base rounded-lg transition-colors text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-90">🗑️</button>
            </>
          )}
        </div>
      </div>
      
      {isManagingAccess && (
        <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-200">
          <div className="mb-3 space-y-2">
            {userAccessList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No garden access found.</p>
            ) : (
              [...userAccessList].sort((a, b) => {
                const order: Record<string, number> = { admin: 1, owner: 2, helper: 3, viewer: 4 };
                return (order[a.role] || 5) - (order[b.role] || 5);
              }).map(acc => (
                <div key={acc.gardenId} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{acc.gardenName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{acc.role}</span>
                  </div>
                  <button type="button" onClick={() => onRevokeAccess(user.id, acc.gardenId)} className="text-xs text-red-500 hover:text-red-700 p-1 font-semibold">Revoke</button>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <select value={grantGardenId} onChange={e => setGrantGardenId(e.target.value)} className="flex-1 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              <option value="" disabled>Select Garden</option>
              {gardensList.filter(g => !userAccessList.some(a => a.gardenId === g.id)).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <select value={grantRole} onChange={e => setGrantRole(e.target.value)} className="w-24 border-2 border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
              <option value="owner">Owner</option>
              <option value="helper">Helper</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="button" onClick={() => onGrantAccess(user.id)} disabled={!grantGardenId} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Add</button>
          </div>
        </div>
      )}
    </div>
  );
};