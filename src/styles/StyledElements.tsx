import styled from 'styled-components';

// Global Application Container using Tailwind for structure and earthy background
export const Container = styled.div.attrs({
  className: 'min-h-screen bg-surface-100 dark:bg-surface-900 text-slate-800 dark:text-slate-100 font-sans p-4 pb-20 max-w-md mx-auto relative overflow-hidden transition-colors duration-300',
})``;

export const Card = styled.div.attrs({
  className: 'bg-surface-50 dark:bg-surface-800 rounded-2xl shadow-sm border border-primary-100/50 dark:border-primary-900/30 p-5 mb-4 transition-all duration-300',
})``;

export const Title = styled.h1.attrs({
  className: 'text-2xl font-bold text-primary-900 dark:text-primary-400 mb-2 tracking-tight transition-colors',
})``;

export const Subtitle = styled.h2.attrs({
  className: 'text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 mt-2 transition-colors',
})``;

// Prop-driven structural styling
export const Button = styled.button.attrs<{ $variant?: 'primary' | 'secondary' | 'batch' }>(({ $variant }) => {
  let baseClasses = 'w-full flex justify-center items-center py-3.5 px-4 rounded-xl font-medium transition-colors shadow-sm active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ';
  if ($variant === 'secondary') {
    baseClasses += 'bg-primary-50 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50';
  } else if ($variant === 'batch') {
    baseClasses += 'bg-surface-800 dark:bg-surface-700 text-white hover:bg-surface-700 dark:hover:bg-surface-600 py-2 text-sm';
  } else {
    baseClasses += 'bg-primary-700 dark:bg-primary-600 text-white hover:bg-primary-800 dark:hover:bg-primary-700 shadow-primary-700/20 dark:shadow-primary-900/50 shadow-md';
  }
  return { className: baseClasses };
})<{ $variant?: 'primary' | 'secondary' | 'batch' }>``;

export const StatusBadge = styled.span.attrs<{ $status: 'hydrated' | 'overdue' | 'unmonitored' }>(({ $status }) => ({
  className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
    $status === 'hydrated'
      ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300'
      : $status === 'overdue'
        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 animate-pulse border border-amber-200 dark:border-amber-800'
        : 'bg-surface-100 dark:bg-surface-800 text-slate-600 dark:text-slate-400 border border-surface-200 dark:border-surface-700'
  }`,
}))<{ $status: 'hydrated' | 'overdue' | 'unmonitored' }>``;

export const ProgressBarContainer = styled.div.attrs({
  className: 'w-full bg-surface-100 dark:bg-surface-700 rounded-full h-2 mt-2 overflow-hidden',
})``;

export const ProgressBarFill = styled.div.attrs<{ $ratio: number }>(({ $ratio }) => ({
  className: `h-full rounded-full transition-all duration-700 ${$ratio <= 0 ? 'bg-amber-500 dark:bg-amber-400' : 'bg-primary-500 dark:bg-primary-400'}`,
  style: { width: `${Math.max(0, Math.min(100, $ratio * 100))}%` }
}))<{ $ratio: number }>``;

export const Input = styled.input.attrs({
  className: 'w-full max-w-full min-w-0 border-2 border-surface-200 dark:border-surface-700 rounded-xl px-4 h-[52px] mb-4 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-surface-50 dark:bg-surface-800 text-slate-800 dark:text-slate-100 shadow-sm transition-all accent-primary-600 dark:accent-primary-500',
})``;

export const Toast = styled.div.attrs<{ $visible: boolean }>(({ $visible }) => ({
  className: `fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 px-6 py-3.5 rounded-2xl shadow-xl transition-all duration-300 z-50 flex items-center gap-3 w-11/12 max-w-sm font-medium ${
    $visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
  }`,
}))<{ $visible: boolean }>``;

export const FAB = styled.button.attrs({
  className: 'fixed bottom-8 right-6 w-16 h-16 bg-primary-600 dark:bg-primary-500 text-white rounded-full shadow-lg shadow-primary-600/30 dark:shadow-primary-900/50 flex items-center justify-center text-3xl hover:bg-primary-700 dark:hover:bg-primary-600 active:scale-90 transition-all duration-200 z-40 border-4 border-surface-50 dark:border-surface-900',
})``;

export const MenuButton = styled.button.attrs({
  className: 'w-[42px] h-[42px] text-slate-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-400 active:scale-90 transition-all bg-surface-50 dark:bg-surface-800 rounded-xl shadow-sm border border-surface-100 dark:border-surface-700 flex items-center justify-center',
})``;
