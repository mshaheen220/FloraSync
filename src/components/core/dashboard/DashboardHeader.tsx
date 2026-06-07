import { FC, useState } from 'react';
import { Title, MenuButton } from '../../../styles/StyledElements';
import { GardenProfile } from '../../../App';

interface DashboardHeaderProps {
  gardenProfile?: GardenProfile | null;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ gardenProfile, onOpenMenu, onOpenWorkspaceMenu }) => {
  const [isGardenImageExpanded, setIsGardenImageExpanded] = useState(false);

  return (
    <>
      <header className="mb-6 pt-6 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {gardenProfile?.imageUrl ? (
              <img 
                src={gardenProfile.imageUrl} 
                alt="Garden Logo" 
                className="w-8 h-8 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                onClick={() => setIsGardenImageExpanded(true)}
              />
            ) : (
              <img src="/images/icons/florasync-logo-512.png" alt="FloraSync Logo" className="w-8 h-8" />
            )}
            <button 
              onClick={onOpenWorkspaceMenu}
              disabled={!onOpenWorkspaceMenu}
              className={`flex items-center gap-1 text-left ${onOpenWorkspaceMenu ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : 'cursor-default'}`}
            >
              <Title className="!mb-0">{gardenProfile?.name || 'FloraSync'}</Title>
              {onOpenWorkspaceMenu && <span className="text-emerald-700 dark:text-emerald-400 text-lg -mt-1 ml-1">▼</span>}
            </button>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Your garden at a glance.</p>
        </div>
        <MenuButton onClick={onOpenMenu}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </MenuButton>
      </header>

      {isGardenImageExpanded && gardenProfile?.imageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setIsGardenImageExpanded(false)}
        >
          <div className="relative flex flex-col items-end max-w-full max-h-full">
            <button 
              className="text-white text-3xl font-bold p-2 mb-2 active:scale-90 transition-transform hover:text-slate-300"
              onClick={() => setIsGardenImageExpanded(false)}
            >
              ✕
            </button>
            <img 
              src={gardenProfile.imageUrl} 
              alt="Garden Logo Enlarged" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </>
  );
};