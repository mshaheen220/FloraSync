import { FC } from 'react';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';
import { Container, Title } from '../styles/StyledElements';

interface ScannerProps {
  onScan: (qrString: string) => void;
  onClose: () => void;
}

export const Scanner: FC<ScannerProps> = ({ onScan, onClose }) => {
  return (
    <Container className="flex flex-col h-screen animate-in slide-in-from-bottom-4 duration-300 !p-0 bg-slate-900 !max-w-full">
      <header className="p-6 pt-8 flex items-center justify-between z-10 bg-slate-900 text-white shadow-md">
        <Title className="!text-white !mb-0">Scan Plant Tag</Title>
        <button onClick={onClose} className="text-slate-300 hover:text-white text-xl p-2 font-bold active:scale-90 transition-transform">✕</button>
      </header>
      
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <QrScanner
          onScan={(result) => {
            // The latest API returns an array of detected barcode objects
            if (Array.isArray(result) && result.length > 0) {
              onScan(result[0].rawValue);
            }
          }}
          onError={(error) => console.log(error)}
        />
        {/* Minimalist target guide overlay */}
        <div className="absolute inset-0 pointer-events-none border-[60px] border-black/60 flex items-center justify-center">
          <div className="w-full h-64 border-2 border-emerald-500/50 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"></div>
        </div>
      </div>

      <div className="p-8 bg-slate-900 pb-16">
        <p className="text-slate-400 text-center text-sm font-medium leading-relaxed">
          Align the QR code within the frame to instantly log care or register a new plant.
        </p>
      </div>
    </Container>
  );
};