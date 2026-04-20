'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { QrThriveDesign, QrThriveFrame } from '@/services/qr-thrive/types';

interface QrPreviewProps {
  data: string;
  design: QrThriveDesign;
  frame: QrThriveFrame;
  logo?: string;
  width?: number;
  height?: number;
}

export const QrPreview: React.FC<QrPreviewProps> = ({ 
  data, design, frame, logo, width = 400, height = 400 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!qrCode) {
      const qr = new QRCodeStyling({
        width: width,
        height: height,
        data: data || 'https://qr-thrive.com',
        image: logo,
        dotsOptions: {
          type: design.dots.type as any,
          color: design.dots.color,
        },
        cornersSquareOptions: {
          type: design.cornersSquare.type as any,
          color: design.cornersSquare.color,
        },
        cornersDotOptions: {
          type: design.cornersDot.type as any,
          color: design.cornersDot.color,
        },
        backgroundOptions: {
          color: design.background.color,
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: design.imageOptions?.margin || 10,
          imageSize: design.imageOptions?.imageSize || 0.4,
          hideBackgroundDots: design.imageOptions?.hideBackgroundDots ?? true,
        },
        qrOptions: {
          typeNumber: (design.qrOptions?.typeNumber || 0) as any,
          mode: (design.qrOptions?.mode || 'Byte') as any,
          errorCorrectionLevel: (design.qrOptions?.errorCorrectionLevel || 'M') as any,
        },
      });
      setQrCode(qr);
    }
  }, []);

  useEffect(() => {
    if (qrCode && ref.current) {
      ref.current.innerHTML = '';
      qrCode.append(ref.current);
      
      qrCode.update({
        data: data || 'https://qr-thrive.com',
        image: logo,
        dotsOptions: {
          type: design.dots.type as any,
          color: design.dots.color,
        },
        cornersSquareOptions: {
          type: design.cornersSquare.type as any,
          color: design.cornersSquare.color,
        },
        cornersDotOptions: {
          type: design.cornersDot.type as any,
          color: design.cornersDot.color,
        },
        backgroundOptions: {
          color: design.background.color,
        },
        imageOptions: {
          imageSize: design.imageOptions?.imageSize || 0.4,
          hideBackgroundDots: design.imageOptions?.hideBackgroundDots ?? true,
        }
      });
    }
  }, [qrCode, data, design, logo, frame.type]); // re-append if frame type changes to ensure ref is still valid

  const renderFrameWrapper = (children: React.ReactNode) => {
    if (frame.type === 'none') {
      return (
        <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-blue-100/50 border border-slate-100 aspect-square flex items-center justify-center overflow-hidden transition-all duration-300">
          {children}
        </div>
      );
    }
    
    const fColor = frame.color || '#000000';
    const tColor = frame.textColor || '#ffffff';
    const fText = frame.text || 'SCAN ME';

    switch (frame.type) {
      case 'simple':
        return (
          <div className="flex flex-col items-center bg-white border-[10px] rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-2xl" style={{ borderColor: fColor }}>
            <div className="px-8 py-5 w-full text-center flex items-center justify-center bg-gradient-to-r from-black/5 to-white/5" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-black tracking-[0.2em] uppercase text-xs leading-none">{fText}</span>
            </div>
            <div className="p-8 bg-white w-full flex items-center justify-center">
              {children}
            </div>
          </div>
        );
      case 'bubble':
        return (
          <div className="flex flex-col items-center transition-all duration-300 mt-6 scale-95">
            <div className="px-10 py-5 rounded-[2.5rem] rounded-br-none shadow-2xl relative flex items-center justify-center z-20 group" style={{ backgroundColor: fColor, color: tColor }}>
               <span className="font-black tracking-[0.3em] uppercase text-xs leading-none">{fText}</span>
               <div className="absolute -bottom-4 right-0 w-10 h-10 z-10" style={{ backgroundColor: fColor, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
            </div>
            <div className="p-8 bg-white rounded-[3rem] border-[12px] mt-3 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center" style={{ borderColor: fColor }}>
              {children}
            </div>
          </div>
        );
      case 'rounded-thick':
        return (
          <div className="bg-white p-10 rounded-[4rem] border-[14px] flex flex-col items-center gap-8 transition-all duration-300 shadow-2xl" style={{ borderColor: fColor }}>
            <div className="flex items-center justify-center w-full bg-white rounded-3xl p-2">
              {children}
            </div>
            <div className="px-10 py-4 rounded-full shadow-lg flex items-center justify-center min-w-[160px] transform hover:scale-105 transition-transform" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-black tracking-[0.2em] uppercase text-xs whitespace-nowrap">{fText}</span>
            </div>
          </div>
        );
      case 'shadow':
        return (
          <div className="relative p-8 pt-6 pb-10 bg-white border-[6px] transition-all duration-300 overflow-visible mt-2 shadow-xl" style={{ borderColor: fColor, boxShadow: `24px 24px 0 0 ${fColor}` }}>
             <div className="bg-white flex items-center justify-center w-full">
               {children}
             </div>
             <div className="absolute -bottom-8 -right-8 px-10 py-5 shadow-2xl z-20 flex items-center justify-center transform hover:-translate-x-1 hover:-translate-y-1 transition-transform" style={{ backgroundColor: fColor, color: tColor }}>
               <span className="font-black tracking-[0.3em] uppercase text-xs leading-none">{fText}</span>
             </div>
          </div>
        );
      case 'ribbon':
        return (
          <div className="relative p-10 pb-8 bg-white border-[8px] rounded-[2rem] mt-16 transition-all duration-300 shadow-2xl" style={{ borderColor: fColor }}>
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-14 py-5 z-20 shadow-2xl flex items-center justify-center" style={{ backgroundColor: fColor, color: tColor }}>
               <span className="font-black tracking-[0.4em] uppercase text-xs leading-none whitespace-nowrap">{fText}</span>
               <div className="absolute top-full left-0 w-6 h-6" style={{ backgroundColor: fColor, clipPath: 'polygon(0 0, 100% 0, 100% 100%)', filter: 'brightness(0.5)' }} />
               <div className="absolute top-full right-0 w-6 h-6" style={{ backgroundColor: fColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)', filter: 'brightness(0.5)' }} />
             </div>
             <div className="flex items-center justify-center w-full mt-4">
               {children}
             </div>
          </div>
        );
      case 'circular':
        return (
          <div className="p-4 rounded-full border-[16px] relative flex flex-col items-center justify-center aspect-square transition-all duration-300 shadow-2xl group overflow-visible" style={{ borderColor: fColor, backgroundColor: '#fff' }}>
            <div className="bg-white rounded-full flex items-center justify-center overflow-hidden w-full h-full p-12">
               <div className="scale-75 transform-gpu transition-transform duration-500 group-hover:scale-[0.8]">
                 {children}
               </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-10 py-4 rounded-full whitespace-nowrap shadow-2xl z-20 bg-white border-4 transform group-hover:scale-110 transition-transform" style={{ backgroundColor: fColor, color: tColor, borderColor: '#fff' }}>
              <span className="font-black tracking-[0.3em] uppercase text-xs leading-none">{fText}</span>
            </div>
          </div>
        );
      case 'minimal':
        return (
          <div className="p-8 flex flex-col items-center gap-8 bg-white rounded-[4rem] border border-slate-100 transition-all duration-500 shadow-[0_40px_100px_rgba(0,0,0,0.05)] hover:shadow-[0_50px_120px_rgba(0,0,0,0.08)]">
            <div className="tracking-[0.6em] font-black uppercase text-[10px] whitespace-nowrap opacity-40 ml-[0.6em]" style={{ color: fColor }}>{fText}</div>
            <div className="p-6 bg-slate-50/50 rounded-[3rem] flex items-center justify-center border border-slate-50">
               <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden p-6">
                 {children}
               </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-50 flex items-center justify-center overflow-hidden">
            {children}
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {renderFrameWrapper(
        <div ref={ref} className="qr-container [&>svg]:w-full [&>svg]:h-full object-contain" />
      )}
    </div>
  );
};

export default QrPreview;