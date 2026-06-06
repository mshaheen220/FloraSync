import { FC, useState } from 'react';
import { User } from '../../App';

export type MenuRoute = 'dashboard' | 'settings' | 'archetypes' | 'zones' | 'locations' | 'inventory' | 'help' | 'print';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: MenuRoute) => void;
  currentUser?: User | null;
}

export const NavigationMenu: FC<NavigationMenuProps> = ({ isOpen, onClose, onNavigate, currentUser }) => {
  const [isGardenExpanded, setIsGardenExpanded] = useState(false);
  const isAdminOrOwner = currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="w-4/5 max-w-sm bg-slate-50 dark:bg-slate-900 h-full shadow-2xl relative flex flex-col animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-slate-800">
        <div className="p-6 pt-10 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <img src="/images/icons/florasync-logo-512.png" alt="FloraSync Logo" className="w-8 h-8" />
            <span className="text-xl font-bold text-emerald-900 dark:text-emerald-400 tracking-tight">FloraSync</span>
          </div>
          <button onClick={onClose} className="text-2xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 mt-2">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl"><img src="/images/icons/dashboard.png" alt="Dashboard" className="w-5 h-5 mb-1  object-contain" /></span> Dashboard
          </button>
          <button 
            onClick={() => setIsGardenExpanded(!isGardenExpanded)}
            className={`flex items-center justify-between w-full p-4 rounded-xl text-left font-semibold transition-colors active:scale-95 ${isGardenExpanded ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">🪴</span> The Garden
            </div>
            <span className={`text-slate-400 text-xs transition-transform duration-200 ${isGardenExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isGardenExpanded && (
            <div className="flex flex-col gap-1 pl-2 ml-7 mt-1 mb-2 border-l-2 border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 fade-in duration-200">
              <button onClick={() => onNavigate('inventory')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
                <span className="text-xl">📦</span> Inventory Manager
              </button>
              <button onClick={() => onNavigate('zones')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
                <span className="text-xl"><img src="/images/icons/qr/zone.png" alt="Zone" className="w-5 h-5 mb-1  object-contain" /></span> Zone Manager
              </button>
              <button onClick={() => onNavigate('locations')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
                <span className="text-xl"><img src="/images/icons/qr/location.png" alt="Location" className="w-5 h-5 mb-1 object-contain" /></span> Location Manager
              </button>
            </div>
          )}
          <button onClick={() => onNavigate('archetypes')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">📖</span> Plant Dictionary
          </button>

          {isAdminOrOwner && (
            <button onClick={() => onNavigate('print')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
              <span className="text-2xl">🖨️</span> Print Center
            </button>
          )}
          <div className="mt-4 mb-1 px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            System
          </div>
          <button onClick={() => onNavigate('settings')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">⚙️</span> General Settings
          </button>
          <button onClick={() => onNavigate('help')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">❓</span> Help & FAQs
          </button>
        </div>
      </div>
    </div>
  );
};