import React from 'react';
import { useQRCode } from '../hooks/useQRCode';
import type { QRConfiguration } from '../types/qr';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QRCodePreviewProps {
  config: QRConfiguration;
  isValid?: boolean;
}

const QRCodePreview: React.FC<QRCodePreviewProps> = ({ config, isValid = true }) => {
  const { ref } = useQRCode(config);

  const getFrameStyles = (): React.CSSProperties => {
    if (config.frame.type === 'none') return {};

    const base: React.CSSProperties = {
      padding: '2%',
      backgroundColor: config.design.background.color,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      width: '100%',
      maxWidth: 'min(95vw, 440px)',
    };

    switch (config.frame.type) {
      case 'simple':
        return { ...base, border: `6px solid ${config.frame.color}`, borderRadius: '24px' };
      case 'bubble':
        return { ...base, border: `16px solid ${config.frame.color}`, borderRadius: '60px' };
      case 'rounded-thick':
        return { ...base, border: `24px solid ${config.frame.color}`, borderRadius: '40px' };
      case 'shadow':
        return { 
          ...base, 
          border: `1px solid ${config.frame.color}22`, 
          borderRadius: '32px',
          boxShadow: `0 30px 60px -12px ${config.frame.color}55`
        };
      case 'bracket':
        return { 
          ...base, 
          padding: '30px', 
          border: `3px solid ${config.frame.color}`, 
          borderRadius: '8px',
          backgroundColor: 'transparent'
        };
      case 'ribbon':
        return { 
          ...base, 
          border: `10px solid ${config.frame.color}`, 
          borderRadius: '16px', 
          paddingBottom: '0',
          overflow: 'hidden'
        };
      case 'text-below':
        return { ...base, padding: '16px', border: 'none' };
      case 'phone':
        return { 
          ...base, 
          border: `12px solid ${config.frame.color}`, 
          borderRadius: '48px',
          padding: '40px 20px 20px 20px',
          boxShadow: `0 0 0 4px ${config.frame.color}33`,
          backgroundColor: '#ffffff'
        };
      case 'circular':
        return { 
          ...base, 
          borderRadius: '50%', 
          padding: '15%',
          border: `2px solid ${config.frame.color}22`
        };
      case 'tag':
        return { 
          ...base, 
          border: `2px solid ${config.frame.color}`, 
          borderRadius: '24px', 
          borderTopWidth: '32px',
          backgroundColor: '#ffffff'
        };
      case 'minimal':
        return { 
          ...base, 
          borderTop: `8px solid ${config.frame.color}`, 
          padding: '20px 10px',
          backgroundColor: '#ffffff'
        };
      default:
        return { ...base, border: `16px solid ${config.frame.color}`, borderRadius: '28px' };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 bg-white rounded-[40px] sm:rounded-[50px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-50 transition-all w-full max-w-full overflow-hidden relative">
      <div className={cn(
        "w-full flex flex-col items-center justify-center transition-all duration-500",
        !isValid && "opacity-20 grayscale scale-95 pointer-events-none"
      )}>
        <div style={getFrameStyles()} className="w-full flex items-center justify-center">
          {/* Added a centering container with a bit of padding to avoid any clipping */}
          <div className="relative group w-full flex items-center justify-center p-2">
              <div
                ref={ref}
                className="qr-container rounded-xl shadow-inner shadow-black/5"
                style={{
                  width: '100%',
                  maxWidth: `${config.width}px`,
                  aspectRatio: '1/1',
                  backgroundColor: config.design.background.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible' // Changed from hidden to avoid clipping the actual pattern
                }}
              >
                 {/* Actual QR injected here */}
              </div>
          </div>
          
          {config.frame.type !== 'none' && config.frame.text && (
            <div
              className="animate-in slide-in-from-bottom-2 duration-700 w-full"
              style={{
                color: config.frame.textColor || '#ffffff',
                backgroundColor: config.frame.color || '#2563eb',
                padding: config.frame.type === 'ribbon' ? '16px 32px' : '10px 20px',
                borderRadius: config.frame.type === 'ribbon' ? '0' : '999px',
                fontWeight: '700',
                fontSize: '14px',
                textAlign: 'center',
                width: config.frame.type === 'ribbon' ? '100.5%' : 'auto',
                minWidth: config.frame.type === 'ribbon' ? '101%' : 'min(100%, 140px)',
                marginTop: config.frame.type === 'ribbon' ? '12px' : '8px',
                marginBottom: config.frame.type === 'ribbon' ? '0' : '12px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: config.frame.type === 'ribbon' ? 'none' : '0 10px 20px rgba(37,99,235,0.1)'
              }}
            >
              {config.frame.text}
            </div>
          )}
        </div>
      </div>

      {!isValid && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
           <div className="bg-amber-100 text-amber-700 px-6 py-4 rounded-3xl border-2 border-amber-200 shadow-xl shadow-amber-900/10 flex flex-col items-center gap-3">
              <span className="text-sm font-black uppercase tracking-widest">Incomplete Data</span>
              <p className="text-[11px] font-bold leading-relaxed max-w-[180px]">Please enter valid content in Step 1 to generate your QR Code</p>
           </div>
        </div>
      )}

      {isValid && config.isDynamic && (
        <a 
          href={`/s/${config.shortId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-2"
        >
          Check Live Dynamic Page
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </a>
      )}

      <div className="mt-8 sm:mt-12 text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] flex items-center gap-3">
        <span className={cn(
          "w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm",
          isValid ? "bg-blue-600 animate-pulse" : "bg-gray-200"
        )} />
        {isValid ? "High Fidelity Preview" : "Waiting for content..."}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .qr-container canvas {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 0 auto;
        }
        .qr-container svg {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 0 auto;
        }
      `}} />
    </div>
  );
};

export default QRCodePreview;
