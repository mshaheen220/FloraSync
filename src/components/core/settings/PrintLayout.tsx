import { FC, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';

export interface PrintItem {
  id: string;
  type: 'plant' | 'location' | 'zone';
  action?: 'water' | 'feed';
  title: string;
  subtitle: string;
}

interface PrintLayoutProps {
  items: PrintItem[];
  template: 'stake-10x6' | 'square-1in' | 'label-6x3';
  onClose: () => void;
}

// Helper to generate a clean white background icon for the center of the QR code
const getIconSvg = (emoji: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="4" width="92" height="92" rx="24" fill="white" stroke="black" stroke-width="8"/><text x="50" y="54" dominant-baseline="central" text-anchor="middle" font-size="56" font-family="system-ui, sans-serif" fill="black" stroke="black" stroke-width="3">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const ICONS: Record<string, string> = {
  plant: '/images/icons/qr/plant.png',
  location: '/images/icons/qr/location.png',
  zone: '/images/icons/qr/zone.png',
  water: getIconSvg('💧'),
  feed: getIconSvg('🍽️')
};

const TYPE_COLORS = {
  plant: '#15803d',
  location: '#cc0000',
  zone: '#1d4ed8'
};

export const PrintLayout: FC<PrintLayoutProps> = ({ items, template, onClose }) => {
  
  // Inject a global print stylesheet when this component mounts to hide the main app body
  // and strip away the browser's default printing margins!
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page { margin: 0.25in; size: letter; }
        html, body { width: 8.5in !important; margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #root { display: none !important; }
        #print-portal { position: static !important; width: 8.5in !important; overflow: visible !important; height: auto !important; display: block !important; }
        .print-item { page-break-inside: avoid !important; break-inside: avoid !important; -webkit-column-break-inside: avoid !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return createPortal(
    <div id="print-portal" className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto">
      
      {/* Non-printing Control Header */}
      <div className="print:hidden sticky top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-xl z-50">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg">Print Preview ({items.length} items)</h2>
          <span className="text-xs text-slate-400">Set your printer margins to "None" or "Minimum" for best results.</span>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold transition-colors">
            ❌
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-bold transition-colors shadow-lg">
            🖨️
          </button>
        </div>
      </div>

      {/* The Printable Canvas */}
      <div className="p-8 print:p-0">
        {items.map((item, index) => {
          const url = item.action ? `/${item.type}/${item.id}/${item.action}` : `/${item.type}/${item.id}`;
          const iconSrc = item.action ? ICONS[item.action] : ICONS[item.type];
          
          if (template === 'stake-10x6') {
            return (
              <div key={index} className="print-item" style={{ width: '10cm', height: '6cm', boxSizing: 'border-box', border: '1px dashed #ccc', padding: '0.25cm', display: 'inline-flex', verticalAlign: 'top', alignItems: 'center', pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#fff' }}>
                <div style={{ width: '5.5cm', height: '5.5cm', flexShrink: 0, padding: '0.25cm', boxSizing: 'border-box' }}>
                  <QRCodeSVG 
                    value={url} size={128} style={{ width: '100%', height: '100%' }} level="H"
                    imageSettings={{ src: iconSrc, height: 28, width: 28, excavate: true }}
                  />
                </div>
                <div style={{ flex: 1, paddingLeft: '0.4cm', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: item.title ? 'center' : 'flex-end', alignSelf: 'stretch' }}>
                  {item.title ? (
                    <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 4px 0', lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </h1>
                  ) : null}
                  {item.subtitle ? (
                    <h2 style={{ fontSize: '10pt', color: '#555', margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.subtitle}
                    </h2>
                  ) : null}
                  {(item.title || item.action) ? (
                    <span style={{ fontSize: '8pt', color: TYPE_COLORS[item.type], marginTop: item.title ? '8px' : '0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                      {item.action ? `${item.action} ${item.type}` : item.type}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          }

          if (template === 'label-6x3') {
            return (
              <div key={index} className="print-item" style={{ width: '6cm', height: '3cm', boxSizing: 'border-box', border: '1px dashed #ccc', padding: '0.15cm', display: 'inline-flex', verticalAlign: 'top', alignItems: 'center', pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#fff' }}>
                <div style={{ width: '2.5cm', height: '2.5cm', flexShrink: 0, padding: '0.15cm', boxSizing: 'border-box' }}>
                  <QRCodeSVG 
                    value={url} size={128} style={{ width: '100%', height: '100%' }} level="H"
                    imageSettings={{ src: iconSrc, height: 24, width: 24, excavate: true }}
                  />
                </div>
                <div style={{ flex: 1, paddingLeft: '0.2cm', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: item.title ? 'center' : 'flex-end', alignSelf: 'stretch' }}>
                  {item.title ? (
                    <h1 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 2px 0', lineHeight: 1.1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.title}
                    </h1>
                  ) : null}
                  {item.subtitle ? (
                    <h2 style={{ fontSize: '7pt', color: '#555', margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.subtitle}
                    </h2>
                  ) : null}
                  {(item.title || item.action) ? (
                    <span style={{ fontSize: '5pt', color: TYPE_COLORS[item.type], marginTop: item.title ? '4px' : '0', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                      {item.action ? `${item.action} ${item.type}` : item.type}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          }
          
          if (template === 'square-1in') {
            return (
              <div key={index} className="print-item" style={{ width: '1in', height: '1in', boxSizing: 'border-box', border: '1px dashed #ccc', padding: '0.05in', display: 'inline-flex', verticalAlign: 'top', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pageBreakInside: 'avoid', breakInside: 'avoid', backgroundColor: '#fff' }}>
                <QRCodeSVG 
                  value={url} size={128} style={{ width: '0.7in', height: '0.7in' }} level="H"
                  imageSettings={{ src: iconSrc, height: 28, width: 28, excavate: true }}
                />
                <span style={{ fontSize: '5pt', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', fontWeight: 'bold' }}>
                  {item.title}
                </span>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  , document.body);
};