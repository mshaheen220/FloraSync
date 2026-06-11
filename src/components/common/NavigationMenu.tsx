import { FC, useState } from 'react';
import { User } from '../../App';
import { hasPermission } from '../../utils/permissions';
import { Icon } from './Icon';

export type MenuRoute = 'dashboard' | 'settings' | 'appearance' | 'archetypes' | 'zones' | 'locations' | 'inventory' | 'help' | 'print' | 'journal';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: MenuRoute) => void;
  currentUser?: User | null;
}

export const NavigationMenu: FC<NavigationMenuProps> = ({ isOpen, onClose, onNavigate, currentUser }) => {
  const [isGardenExpanded, setIsGardenExpanded] = useState(true);
  const isAdminOrOwner = hasPermission(currentUser, 'view_print_queue');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="w-4/5 max-w-sm bg-surface-50 dark:bg-surface-900 h-full shadow-2xl relative flex flex-col animate-in slide-in-from-left duration-300 border-r border-surface-200 dark:border-surface-800">
        <div className="p-4 pt-6 border-b border-surface-200 dark:border-surface-800 flex justify-between items-center bg-surface-50 dark:bg-surface-900">
          <div className="flex items-center gap-3">
            <img src="/images/icons/florasync-logo-512.png" alt="FloraSync Logo" className="w-7 h-7" />
            <span className="text-lg font-bold text-primary-900 dark:text-primary-400 tracking-tight">FloraSync</span>
          </div>
          <button onClick={onClose} className="text-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
            <span className="text-xl"><Icon name="dashboard" size={20} /></span> Dashboard
          </button>
          <button 
            onClick={() => setIsGardenExpanded(!isGardenExpanded)}
            className={`flex items-center justify-between w-full p-3 rounded-xl text-left font-semibold text-sm transition-colors active:scale-95 ${isGardenExpanded ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400' : 'text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl"><Icon name="rose" size={20} /></span> The Garden
            </div>
            <span className={`text-slate-400 text-xs transition-transform duration-200 ${isGardenExpanded ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {isGardenExpanded && (
            <div className="flex flex-col gap-1 pl-2 ml-6 mt-1 mb-1 border-l-2 border-surface-200 dark:border-surface-800 animate-in slide-in-from-top-2 fade-in duration-200">
              <button onClick={() => onNavigate('inventory')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
                <span className="text-lg"><Icon name="shelving-unit" size={18} /></span> Inventory Manager
              </button>
              <button onClick={() => onNavigate('zones')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
                <span className="text-lg"><Icon name="land-plot" size={18} /></span> Zone Manager
              </button>
              <button onClick={() => onNavigate('locations')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
                <span className="text-lg"><Icon name="map-pin" size={18} /></span> Location Manager
              </button>
              <button onClick={() => onNavigate('journal')} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
                <span className="text-lg"><Icon name="pencil" size={18} /></span> Master Journal
              </button>
            </div>
          )}
          <button onClick={() => onNavigate('archetypes')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
            <span className="text-xl"><Icon name="book-open-text" size={20} /></span> Plant Dictionary
          </button>

          {isAdminOrOwner && (
            <button onClick={() => onNavigate('print')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
              <span className="text-xl"><Icon name="print" size={20} /></span> Print Center
            </button>
          )}
          <div className="mt-2 mb-1 px-3 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            System
          </div>
          <button onClick={() => onNavigate('appearance')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
            <span className="text-xl"><Icon name="palette" size={20} /></span> Appearance
          </button>
          <button onClick={() => onNavigate('settings')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
            <span className="text-xl"><Icon name="settings" size={20} /></span> General Settings
          </button>
          <button onClick={() => onNavigate('help')} className="flex items-center gap-3 w-full p-3 rounded-xl text-left font-semibold text-sm text-slate-700 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-surface-800 transition-colors active:scale-95">
            <span className="text-xl"><Icon name="help-circle" size={20} /></span> Help & FAQs
          </button>
        </div>
      </div>
    </div>
  );
};