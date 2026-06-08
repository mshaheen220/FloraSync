import { FC } from 'react';
import { Icon } from './Icon';

interface FloatingScannerButtonProps {
  onClick: () => void;
}

export const FloatingScannerButton: FC<FloatingScannerButtonProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="fixed bottom-6 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all z-40 flex items-center justify-center"
    >
      <Icon name="camera" size={24} />
    </button>
  );
};