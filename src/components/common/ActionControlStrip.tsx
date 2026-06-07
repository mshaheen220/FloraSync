import { FC } from 'react';
import { User } from '../../App';
import { PrintQueueItem } from '../../../types';

interface ActionControlStripProps {
  currentUser?: User;
  userPins: string[];
  onPinToggle?: (action: string) => void;
  onQueuePrint?: (targetId: string, type: 'plant' | 'location' | 'zone', title: string, subtitle: string, action?: 'none' | 'water' | 'feed') => void;
  printQueue?: PrintQueueItem[];
  targetId: string;
  targetType: 'plant' | 'location' | 'zone';
  targetTitle: string;
  targetSubtitle: string;
  showToast: (msg: string) => void;
}

export const ActionControlStrip: FC<ActionControlStripProps> = ({
  currentUser,
  userPins,
  onPinToggle,
  onQueuePrint,
  printQueue,
  targetId,
  targetType,
  targetTitle,
  targetSubtitle,
  showToast
}) => {
  if (currentUser?.workspaceRole === 'viewer' && currentUser?.role !== 'god-admin') {
    return null;
  }

  const isOwnerOrAdmin = currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner';

  const handleQueueAction = (action: 'none' | 'water' | 'feed') => {
    if (!onQueuePrint) return;
    const isQueued = printQueue?.some(q => q.targetId === targetId && q.action === action);
    
    let title = targetTitle;
    if (action === 'water') title = `Water ${targetTitle}`;
    if (action === 'feed') title = `Feed ${targetTitle}`;
    
    onQueuePrint(targetId, targetType, title, targetSubtitle, action);
    
    const actionName = action === 'none' ? 'Info Tag' : action === 'water' ? 'Water Tag' : 'Feed Tag';
    showToast(isQueued ? `❌ Removed ${actionName} from Queue` : `🛒 Added ${actionName} to Queue`);
  };

  const isQueued = (action: 'none' | 'water' | 'feed') => {
    return !!printQueue?.some(q => q.targetId === targetId && q.action === action);
  };

  const getPinClass = (action: string) => {
    return `px-2 py-1 rounded text-xs font-semibold transition-colors border ${userPins.includes(action) ? 'bg-amber-100 border-amber-200 text-amber-800 dark:bg-amber-900/50 dark:border-amber-800 dark:text-amber-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`;
  };

  const getPrintClass = (action: 'none' | 'water' | 'feed') => {
    return `px-2 py-1 rounded text-xs font-semibold transition-colors border ${isQueued(action) ? 'bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800'}`;
  };

  return (
    <div className="w-full flex flex-col gap-2 mt-6 px-1">
      {currentUser?.workspaceRole !== 'viewer' && onPinToggle && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-start gap-1.5 ml-1 mr-2">
            <span className="text-[10px] leading-tight mt-[1px]">📌</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">Pin to Dash</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => onPinToggle('water')} className={getPinClass('water')}>💦 Water</button>
            <button onClick={() => onPinToggle('feed')} className={getPinClass('feed')}>🪴 Feed</button>
            <button onClick={() => onPinToggle('navigate')} className={getPinClass('navigate')}>👁️ Nav</button>
          </div>
        </div>
      )}
      
      {isOwnerOrAdmin && onQueuePrint && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
          <div className="flex items-start gap-1.5 ml-1 mr-2">
            <span className="text-[10px] leading-tight mt-[1px]">🖨️</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">Print Queue</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => handleQueueAction('none')} className={getPrintClass('none')}>ℹ️ Info</button>
            <button onClick={() => handleQueueAction('water')} className={getPrintClass('water')}>💦 Water</button>
            <button onClick={() => handleQueueAction('feed')} className={getPrintClass('feed')}>🪴 Feed</button>
          </div>
        </div>
      )}
    </div>
  );
};