import styled from 'styled-components';

// Global Application Container using Tailwind for structure and earthy background
export const Container = styled.div.attrs({
  className: 'min-h-screen bg-slate-50 text-slate-800 font-sans p-4 pb-20 max-w-md mx-auto relative overflow-hidden',
})``;

export const Card = styled.div.attrs({
  className: 'bg-white rounded-2xl shadow-sm border border-emerald-100/50 p-5 mb-4 transition-all',
})``;

export const Title = styled.h1.attrs({
  className: 'text-2xl font-bold text-emerald-900 mb-2 tracking-tight',
})``;

export const Subtitle = styled.h2.attrs({
  className: 'text-lg font-semibold text-slate-700 mb-3 mt-2',
})``;

// Prop-driven structural styling
export const Button = styled.button.attrs<{ variant?: 'primary' | 'secondary' | 'batch' }>(({ variant }) => {
  let baseClasses = 'w-full flex justify-center items-center py-3.5 px-4 rounded-xl font-medium transition-colors shadow-sm active:scale-95 duration-200 ';
  if (variant === 'secondary') {
    baseClasses += 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100';
  } else if (variant === 'batch') {
    baseClasses += 'bg-slate-800 text-white hover:bg-slate-700 py-2 text-sm';
  } else {
    baseClasses += 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-emerald-700/20 shadow-md';
  }
  return { className: baseClasses };
})<{ variant?: 'primary' | 'secondary' | 'batch' }>``;

export const StatusBadge = styled.span.attrs<{ status: 'hydrated' | 'overdue' }>(({ status }) => ({
  className: `inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
    status === 'hydrated'
      ? 'bg-emerald-100 text-emerald-800'
      : 'bg-amber-100 text-amber-900 animate-pulse border border-amber-200'
  }`,
}))<{ status: 'hydrated' | 'overdue' }>``;

export const ProgressBarContainer = styled.div.attrs({
  className: 'w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden',
})``;

export const ProgressBarFill = styled.div.attrs<{ ratio: number }>(({ ratio }) => ({
  className: `h-full rounded-full transition-all duration-700 ${ratio <= 0 ? 'bg-amber-500' : 'bg-emerald-500'}`,
  style: { width: `${Math.max(0, Math.min(100, ratio * 100))}%` }
}))<{ ratio: number }>``;

export const Input = styled.input.attrs({
  className: 'w-full border-2 border-slate-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white shadow-sm transition-all',
})``;

export const Toast = styled.div.attrs<{ visible: boolean }>(({ visible }) => ({
  className: `fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-xl transition-all duration-300 z-50 flex items-center gap-3 w-11/12 max-w-sm font-medium ${
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
  }`,
}))<{ visible: boolean }>``;

export const FAB = styled.button.attrs({
  className: 'fixed bottom-8 right-6 w-16 h-16 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center text-3xl hover:bg-emerald-700 active:scale-90 transition-all duration-200 z-40 border-4 border-white',
})``;