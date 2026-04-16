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
    const qr = new QRCodeStyling({
      width: width,
      height: height,
      data: data || 'https://qr-thrive.com',
      image: logo,
      dotsOptions: {
        type: design.dots.type as any,
        color: design.dots.color,
        gradient: design.dots.gradient ? {
          type: design.dots.gradient.type as any,
          rotation: design.dots.gradient.rotation,
          colorStops: design.dots.gradient.colorStops,
        } : undefined,
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
        gradient: design.background.gradient ? {
          type: design.background.gradient.type as any,
          rotation: design.background.gradient.rotation,
          colorStops: design.background.gradient.colorStops,
        } : undefined,
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: design.imageOptions?.margin || 10,
        imageSize: design.imageOptions?.imageSize || 0.4,
      },
      qrOptions: {
        typeNumber: (design.qrOptions?.typeNumber || 0) as any,
        mode: (design.qrOptions?.mode || 'Byte') as any,
        errorCorrectionLevel: (design.qrOptions?.errorCorrectionLevel || 'M') as any,
      },
    });
    
    setQrCode(qr);
    
    if (ref.current) {
      ref.current.innerHTML = '';
      qr.append(ref.current);
    }

    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (qrCode) {
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
      });
    }
  }, [data, design, logo, qrCode]);

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
          <div className="flex flex-col items-center bg-white border-8 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl" style={{ borderColor: fColor }}>
            <div className="px-6 py-4 w-full text-center flex items-center justify-center" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-extrabold tracking-widest uppercase text-sm leading-none">{fText}</span>
            </div>
            <div className="p-6 bg-white w-full flex items-center justify-center">
              {children}
            </div>
          </div>
        );
      case 'bubble':
        return (
          <div className="flex flex-col items-center transition-all duration-300 drop-shadow-xl mt-4">
            <div className="px-8 py-4 rounded-[2rem] rounded-br-none shadow-lg relative flex items-center justify-center z-20" style={{ backgroundColor: fColor, color: tColor }}>
               <span className="font-black tracking-[0.2em] uppercase text-sm leading-none">{fText}</span>
               <div className="absolute -bottom-3 right-0 w-8 h-8 z-10" style={{ backgroundColor: fColor, clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />
            </div>
            <div className="p-6 bg-white rounded-[2rem] border-8 mt-2 shadow-xl z-10 flex items-center justify-center" style={{ borderColor: fColor }}>
              {children}
            </div>
          </div>
        );
      case 'rounded-thick':
        return (
          <div className="bg-white p-8 rounded-[3rem] border-[12px] flex flex-col items-center gap-6 transition-all duration-300 drop-shadow-xl" style={{ borderColor: fColor }}>
            <div className="flex items-center justify-center w-full">
              {children}
            </div>
            <div className="px-8 py-3 rounded-full shadow-inner flex items-center justify-center min-w-[140px]" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-bold tracking-[0.15em] uppercase text-xs whitespace-nowrap">{fText}</span>
            </div>
          </div>
        );
      case 'bracket':
        return (
          <div className="relative p-8 pb-10 pt-10 rounded-[32px] transition-all duration-300 drop-shadow-xl bg-white" style={{ borderLeft: `12px solid ${fColor}`, borderRight: `12px solid ${fColor}` }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-md z-10 whitespace-nowrap" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-black tracking-[0.2em] uppercase text-xs leading-none">{fText}</span>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-md z-10 whitespace-nowrap" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-black tracking-[0.2em] uppercase text-xs leading-none">{fText}</span>
            </div>
            <div className="bg-white p-2 rounded-2xl flex items-center justify-center h-full">
               {children}
            </div>
          </div>
        );
      case 'shadow':
        return (
          <div className="relative p-6 pt-5 pb-8 bg-white border-[4px] transition-all duration-300 overflow-visible mt-2" style={{ borderColor: fColor, boxShadow: `16px 16px 0 0 ${fColor}` }}>
             <div className="bg-white flex items-center justify-center w-full">
               {children}
             </div>
             <div className="absolute -bottom-6 -right-6 px-6 py-3 shadow-xl z-20 flex items-center justify-center" style={{ backgroundColor: fColor, color: tColor }}>
               <span className="font-black tracking-widest uppercase text-sm leading-none">{fText}</span>
             </div>
          </div>
        );
      case 'ribbon':
        return (
          <div className="relative p-8 pb-6 bg-white border-[6px] rounded-2xl mt-12 transition-all duration-300 drop-shadow-2xl" style={{ borderColor: fColor }}>
             <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-10 py-3 z-20 shadow-lg" style={{ backgroundColor: fColor, color: tColor }}>
               <span className="font-black tracking-[0.25em] uppercase text-xs leading-none whitespace-nowrap">{fText}</span>
               <div className="absolute top-full left-0 w-4 h-4" style={{ backgroundColor: fColor, clipPath: 'polygon(0 0, 100% 0, 100% 100%)', filter: 'brightness(0.6)' }} />
               <div className="absolute top-full right-0 w-4 h-4" style={{ backgroundColor: fColor, clipPath: 'polygon(0 0, 100% 0, 0 100%)', filter: 'brightness(0.6)' }} />
             </div>
             <div className="flex items-center justify-center w-full mt-2">
               {children}
             </div>
          </div>
        );
      case 'tag':
        return (
          <div className="flex flex-col items-center transition-all duration-300 drop-shadow-xl mt-4">
             <div className="w-24 h-10 rounded-t-2xl flex items-center justify-center relative z-10 -mb-1 shadow-inner" style={{ backgroundColor: fColor }}>
                <div className="w-4 h-4 bg-white rounded-full shadow-inner border-2 border-slate-200" />
             </div>
             <div className="p-8 pb-6 rounded-[2.5rem] rounded-t-none border-[12px] flex flex-col items-center justify-center" style={{ borderColor: fColor, backgroundColor: '#fff' }}>
               <div className="bg-white p-2 flex items-center justify-center w-full">
                 {children}
               </div>
               <div className="mt-5 text-center flex items-center justify-center w-full px-2">
                  <span className="font-black tracking-[0.25em] uppercase text-sm whitespace-nowrap" style={{ color: fColor }}>{fText}</span>
               </div>
             </div>
          </div>
        );
      case 'circular':
        return (
          <div className="p-10 rounded-full border-[16px] relative flex flex-col items-center justify-center aspect-square transition-all duration-300 drop-shadow-2xl" style={{ borderColor: fColor, backgroundColor: '#fff' }}>
            <div className="bg-white rounded-3xl overflow-hidden flex items-center justify-center w-full h-full p-2">
              {children}
            </div>
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full whitespace-nowrap shadow-xl z-20" style={{ backgroundColor: fColor, color: tColor }}>
              <span className="font-black tracking-[0.25em] uppercase text-xs leading-none">{fText}</span>
            </div>
          </div>
        );
      case 'minimal':
        return (
          <div className="p-6 flex flex-col items-center gap-6 bg-slate-50/80 rounded-[3rem] border border-slate-200 transition-all duration-300 shadow-inner">
            <div className="tracking-[0.4em] font-medium uppercase text-xs whitespace-nowrap opacity-80" style={{ color: fColor }}>{fText}</div>
            <div className="p-4 bg-white shadow-lg rounded-3xl flex items-center justify-center">
               <div className="rounded-2xl overflow-hidden p-1">
                 {children}
               </div>
            </div>
          </div>
        );
      case 'phone':
      default:
        return (
          <div className="p-6 pt-10 bg-white border-[12px] rounded-[3rem] flex flex-col items-center relative transition-all duration-300 drop-shadow-2xl" style={{ borderColor: fColor }}>
            <div className="w-20 h-2 bg-slate-200 rounded-full mb-6 absolute top-4 left-1/2 -translate-x-1/2 shadow-inner" />
            <div className="mt-2 bg-white flex items-center justify-center w-full p-1 border border-slate-50 rounded-2xl">
               {children}
            </div>
            <div className="mt-6 px-6 py-3 rounded-full w-full mx-4 text-center shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
               <span className="font-black tracking-[0.2em] uppercase text-xs truncate block text-slate-700">{fText}</span>
            </div>
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