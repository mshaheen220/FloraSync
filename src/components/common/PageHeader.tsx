import { FC, ReactNode } from 'react';
import { Title, MenuButton } from '../../styles/StyledElements';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  supertitle?: ReactNode;
  onGoBack?: () => void;
  onOpenMenu: () => void;
  onOpenWorkspaceMenu?: () => void;
  rightContent?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, supertitle, onGoBack, onOpenMenu, onOpenWorkspaceMenu, rightContent }) => (
  <header className="mb-6 flex items-start justify-between pt-6">
    <div className="flex items-start gap-3">
      {onGoBack && (
        <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800 leading-none">
          &larr;
        </button>
      )}
      <div className={onGoBack ? "pt-1" : ""}>
        {supertitle && (
          <button 
            onClick={onOpenWorkspaceMenu}
            disabled={!onOpenWorkspaceMenu}
            className={`text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-1 ${onOpenWorkspaceMenu ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : 'cursor-default text-left'}`}
          >
            {supertitle} {onOpenWorkspaceMenu && <span className="-mt-0.5">▼</span>}
          </button>
        )}
        <Title className="!mb-0">{title}</Title>
        {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-2 pt-0.5">
      {rightContent}
      <MenuButton onClick={onOpenMenu} className={!onGoBack && supertitle ? "mt-1" : ""}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </MenuButton>
    </div>
  </header>
);