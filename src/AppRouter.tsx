import { useState, useEffect, useCallback, FC } from 'react';
import { User, GardenProfile, Workspace } from '../types';
import { Dashboard } from './components/core/Dashboard';
import { PlantDetail } from './components/inventory/PlantDetail';
import { Scanner } from './components/common/Scanner';
import { LocationManager } from './components/spaces/LocationManager';
import { ArchetypeManager } from './components/dictionary/ArchetypeManager';
import { ArchetypeDetail } from './components/dictionary/ArchetypeDetail';
import { ZoneManager } from './components/spaces/ZoneManager';
import { SettingsManager } from './components/core/SettingsManager';
import { AppearanceManager } from './components/core/AppearanceManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { LocationDetail } from './components/spaces/LocationDetail';
import { ZoneDetail } from './components/spaces/ZoneDetail';
import { NavigationMenu, MenuRoute } from './components/common/NavigationMenu';
import { GlobalJournal } from './components/inventory/GlobalJournal';
import { LoginScreen } from './components/core/LoginScreen';
import { HelpCenter } from './components/core/HelpCenter';
import { PrintCenter } from './components/core/settings/PrintCenter';
import { useGarden } from './contexts/GardenContext';
import { Theme } from './App';
import { ColorTheme } from './hooks/useTheme';
import { FloatingScannerButton } from './components/common/FloatingScannerButton';
import { Icon, IconProvider, ELEGANT_THEME, MINIMALIST_THEME, BOHO_NATURE_THEME, SCIENCE_THEME, EMOJI_THEME } from './components/common/Icon';
// @ts-ignore
import packageJson from '../package.json';

export interface AppRouterProps {
  currentUser: User | null;
  token: string | null;
  isDbLoaded: boolean;
  initialLoadSuccess: boolean | null;
  workspaces: Workspace[];
  gardenProfile: GardenProfile | null;
  theme: Theme;
  colorTheme: ColorTheme;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onLogout: () => void;
  onSwitchGarden: (gardenId: string) => void;
  onUpdateUser: (updates: Partial<User>) => void;
  onUpdateGarden: (name: string, imageUrl: string) => void;
  iconTheme?: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji';
  onIconThemeChange?: (theme: 'default' | 'elegant' | 'minimalist' | 'boho-nature' | 'science' | 'emoji') => void;
}

export const AppRouter: FC<AppRouterProps> = ({
  currentUser,
  token,
  isDbLoaded,
  initialLoadSuccess,
  workspaces,
  gardenProfile,
  theme,
  setTheme,
  colorTheme,
  setColorTheme,
  onLogin,
  onLogout,
  onSwitchGarden,
  onUpdateUser,
  onUpdateGarden,
  iconTheme = 'default',
  onIconThemeChange
}) => {
  const { locations } = useGarden();

  const [currentView, setCurrentView] = useState<'dashboard' | 'detail' | 'scanner' | 'locations' | 'archetypes' | 'archetypeDetail' | 'locationDetail' | 'zoneDetail' | 'settings' | 'appearance' | 'zones' | 'inventory' | 'help' | 'print' | 'journal'>('dashboard');
  const [activeQr, setActiveQr] = useState<string | null>(null);
  const [activeLoc, setActiveLoc] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [activeArchetypeId, setActiveArchetypeId] = useState<string | null>(null);
  const [initialAction, setInitialAction] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  // Instantly scroll to the top of the window whenever the view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const syncRoute = useCallback(() => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      setCurrentView('dashboard');
      setActiveQr(null);
      setActiveLoc(null);
      setActiveZone(null);
      setActiveArchetypeId(null);
      setInitialAction(null);
      return;
    }

    const [type, id, action] = parts;
    
    if (type === 'plant' && id) {
      setActiveQr(id);
      setInitialAction(action || null);
      setCurrentView('detail');
    } else if (type === 'location' && id) {
      setActiveLoc(id);
      setInitialAction(action || null);
      setCurrentView('locationDetail');
    } else if (type === 'zone' && id) {
      setActiveZone(decodeURIComponent(id));
      setInitialAction(action || null);
      setCurrentView('zoneDetail');
    } else if (type === 'archetype' && id) {
      setActiveArchetypeId(id);
      setCurrentView('archetypeDetail');
    } else if (['settings', 'appearance', 'zones', 'locations', 'inventory', 'archetypes', 'scanner', 'help', 'print', 'journal'].includes(type)) {
      setCurrentView(type as any);
      setActiveQr(null);
      setActiveLoc(null);
      setActiveZone(null);
      setActiveArchetypeId(null);
      setInitialAction(null);
    } else {
      setCurrentView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (!window.history.state?.internal) {
      window.history.replaceState({ internal: true }, '', window.location.pathname);
    }
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [syncRoute]);

  const navigateTo = useCallback((path: string) => {
    window.history.pushState({ internal: true }, '', path);
    syncRoute();
  }, [syncRoute]);

  const handleGoBack = useCallback(() => {
    if (window.history.state?.internal) {
      window.history.back();
    } else {
      navigateTo('/');
    }
  }, [navigateTo]);

  const handleClearAction = useCallback(() => {
    setInitialAction(null);
  }, []);

  const handleNavigate = (qrId: string) => navigateTo(`/plant/${qrId}`);
  const handleNavigateLocation = (locId: string) => navigateTo(`/location/${locId}`);
  const handleNavigateZone = (zoneId: string) => navigateTo(`/zone/${zoneId}`);
  const handleNavigateArchetype = (archId: string) => navigateTo(`/archetype/${archId}`);

  const handleMenuNavigate = (route: MenuRoute) => {
    setIsMenuOpen(false);
    if (route === 'dashboard') {
      navigateTo('/');
    } else {
      navigateTo(`/${route}`);
    }
  };

  const handleScanResult = (qrString: string) => {
    try {
      const url = new URL(qrString, window.location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      const [type, id] = parts;
      
      if (['plant', 'location', 'zone'].includes(type) && id) {
        navigateTo(url.pathname);
        return;
      }
    } catch (e) {
      // Fallback below
    }
    
    if (locations.some(l => l.id === qrString)) {
      handleNavigateLocation(qrString);
    } else {
      handleNavigate(qrString);
    }
  };

  const handleOpenWorkspaceMenu = workspaces.length > 1 ? () => setIsWorkspaceMenuOpen(true) : undefined;

  const renderView = () => {
    if (!currentUser || !token) {
      return <LoginScreen onLogin={onLogin} />;
    }

    if (!isDbLoaded) {
      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col items-center justify-center text-primary-800 dark:text-primary-400 font-medium">
          <img src='/images/icons/loader.apng.png' alt="FloraSync Loading Spinner" className="w-16 h-16 mb-4" />
          Syncing with Greenhouse...
        </div>
      );
    }

    if (initialLoadSuccess === false) {
      return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          <div className="mb-4 text-amber-500">
            <Icon name="alert-circle" size={64} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Connection Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm leading-relaxed">
            Could not securely connect to the FloraSync database. Your garden data is safe on the server, but cannot be loaded right now.
          </p>
          <div className="flex gap-3">
            <button onClick={() => window.location.reload()} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-bold active:scale-95 transition-all shadow-md">
              Retry Connection
            </button>
            <button onClick={onLogout} className="bg-surface-200 hover:bg-surface-300 text-slate-700 dark:bg-surface-800 dark:hover:bg-surface-700 dark:text-slate-300 px-6 py-2 rounded-xl font-bold active:scale-95 transition-all">
              Log Out
            </button>
          </div>
        </div>
      );
    }

    if (currentView === 'detail' && activeQr) {
      return (
        <PlantDetail qrId={activeQr} initialAction={initialAction} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} onNavigateLocation={handleNavigateLocation} onNavigateZone={handleNavigateZone} />
      );
    }

    if (currentView === 'locationDetail' && activeLoc) {
      return (
        <LocationDetail locationId={activeLoc} initialAction={initialAction} onNavigate={handleNavigate} onNavigateZone={handleNavigateZone} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} />
      );
    }

    if (currentView === 'zoneDetail' && activeZone) {
      return (
        <ZoneDetail zoneId={activeZone} initialAction={initialAction} onNavigate={handleNavigate} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onClearAction={handleClearAction} />
      );
    }

    if (currentView === 'archetypeDetail' && activeArchetypeId) {
      return (
        <ArchetypeDetail archetypeId={activeArchetypeId} onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />
      );
    }

    if (currentView === 'scanner') {
      return <Scanner onScan={handleScanResult} onClose={handleGoBack} />
    }

    if (currentView === 'zones') {
      return <ZoneManager onNavigateZone={handleNavigateZone} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'inventory') {
      return <InventoryManager onNavigate={handleNavigate} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'settings') {
      return <SettingsManager onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} currentUser={currentUser || undefined} onUpdateUser={onUpdateUser} gardenProfile={gardenProfile} onUpdateGarden={onUpdateGarden} onLogout={onLogout} />;
    }

    if (currentView === 'appearance') {
      return <AppearanceManager theme={theme} onThemeChange={setTheme} colorTheme={colorTheme} onColorThemeChange={setColorTheme} iconTheme={iconTheme} onIconThemeChange={onIconThemeChange} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'locations') {
      return <LocationManager onOpenMenu={() => setIsMenuOpen(true)} onNavigateLocation={handleNavigateLocation} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'archetypes') {
      return <ArchetypeManager onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} onNavigateArchetype={handleNavigateArchetype} />;
    }

    if (currentView === 'help') {
      return <HelpCenter gardenProfile={gardenProfile} currentUser={currentUser} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
    }

    if (currentView === 'print') {
      const isAdminOrOwner = currentUser?.role === 'god-admin' || currentUser?.workspaceRole === 'owner';
      if (isAdminOrOwner) {
        return <PrintCenter token={token} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} />;
      }
    }

    if (currentView === 'journal') {
      return <GlobalJournal onGoBack={handleGoBack} onOpenMenu={() => setIsMenuOpen(true)} onOpenWorkspaceMenu={handleOpenWorkspaceMenu} onNavigatePlant={handleNavigate} />;
    }

    return (
      <Dashboard 
        onNavigate={handleNavigate} 
        onOpenMenu={() => setIsMenuOpen(true)} 
        onNavigateInventory={() => navigateTo('/inventory')} 
        onNavigateZone={handleNavigateZone} 
        onNavigateLocation={handleNavigateLocation}
        onOpenWorkspaceMenu={handleOpenWorkspaceMenu}
      />
    );
  };

  const activeThemeMap = iconTheme === 'elegant' ? ELEGANT_THEME : iconTheme === 'minimalist' ? MINIMALIST_THEME : iconTheme === 'boho-nature' ? BOHO_NATURE_THEME : iconTheme === 'science' ? SCIENCE_THEME : iconTheme === 'emoji' ? EMOJI_THEME : {};

  return (
    <IconProvider theme={activeThemeMap}>
      <NavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={handleMenuNavigate} 
        currentUser={currentUser}
      />
      {isWorkspaceMenuOpen && workspaces && workspaces.length > 1 && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-surface-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsWorkspaceMenuOpen(false)}
        >
          <div 
            className="w-full sm:max-w-md bg-surface-50 dark:bg-surface-900 rounded-t-3xl sm:rounded-3xl p-6 pb-12 sm:pb-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Switch Garden</h3>
              <button 
                onClick={() => setIsWorkspaceMenuOpen(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold leading-none p-2 -mr-2"
              >✕</button>
            </div>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {workspaces.map(ws => (
                <button 
                  key={ws.id}
                  onClick={() => { setIsWorkspaceMenuOpen(false); if (ws.id !== gardenProfile?.id) onSwitchGarden(ws.id); }}
                className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98] border-2 ${ws.id === gardenProfile?.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-100 dark:border-slate-800 bg-surface-50 dark:bg-surface-800 hover:border-primary-200 dark:hover:border-primary-800'}`}
                >
                  {ws.imageUrl ? (<img src={ws.imageUrl} alt={ws.name} className="w-12 h-12 rounded-xl object-cover" />) : (<div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xl"><Icon name="tree-palm" /></div>)}
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mb-0.5">{ws.name}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{ws.role}</div>
                  </div>
                  {ws.id === gardenProfile?.id && <span className="text-primary-500 text-xl font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {renderView()}
      {currentUser && token && isDbLoaded && initialLoadSuccess === true && currentView !== 'scanner' && (
        <FloatingScannerButton onClick={() => navigateTo('/scanner')} />
      )}
      {currentUser && token && currentView !== 'scanner' && (
        <footer className="w-full pb-8 pt-4 flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="sprout" size={12} /> FloraSync v{packageJson.version}
          </p>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1">
            Built by <a href="https://michaelshaheen.com" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-bold transition-colors">Michael Shaheen</a>
          </p>
        </footer>
      )}
    </IconProvider>
  );
};
