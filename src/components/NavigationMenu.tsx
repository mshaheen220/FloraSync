import { FC } from 'react';

export type MenuRoute = 'dashboard' | 'settings' | 'archetypes' | 'zones' | 'locations' | 'inventory';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: MenuRoute) => void;
}

export const NavigationMenu: FC<NavigationMenuProps> = ({ isOpen, onClose, onNavigate }) => {
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
            <span className="text-2xl">🌿</span> Dashboard
          </button>
          <button onClick={() => onNavigate('archetypes')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">📖</span> Plant Dictionary
          </button>
          <button onClick={() => onNavigate('zones')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">🌍</span> Zone Manager
          </button>
          <button onClick={() => onNavigate('locations')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">📍</span> Location Manager
          </button>
          <button onClick={() => onNavigate('inventory')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">📦</span> Inventory Manager
          </button>
          <button onClick={() => onNavigate('settings')} className="flex items-center gap-4 w-full p-4 rounded-xl text-left font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors active:scale-95">
            <span className="text-2xl">⚙️</span> General Settings
          </button>
        </div>
      </div>
    </div>
  );
};