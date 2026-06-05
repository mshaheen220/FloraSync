import { FC, ReactNode } from 'react';
import { Title, MenuButton } from '../../styles/StyledElements';

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onGoBack: () => void;
  onOpenMenu: () => void;
  rightContent?: ReactNode;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, onGoBack, onOpenMenu, rightContent }) => (
  <header className="mb-6 flex items-start justify-between pt-6">
    <div className="flex items-start gap-3">
      <button onClick={onGoBack} className="text-3xl text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800 leading-none">
        &larr;
      </button>
      <div className="pt-1">
        <Title className="!mb-0">{title}</Title>
        {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-1">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-2 pt-0.5">
      {rightContent}
      <MenuButton onClick={onOpenMenu}>
        ☰
      </MenuButton>
    </div>
  </header>
);