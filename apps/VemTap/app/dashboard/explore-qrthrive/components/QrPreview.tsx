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
        typeNumber: design.qrOptions?.typeNumber || 0,
        mode: design.qrOptions?.mode || 'Byte',
        errorCorrectionLevel: design.qrOptions?.errorCorrectionLevel || 'M',
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

  return (
    <div className="relative group">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-blue-100/50 border border-slate-100 aspect-square flex items-center justify-center overflow-hidden">
        <div ref={ref} className="qr-container" />
        
        {frame.type !== 'none' && frame.text && (
          <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
            <div 
              className="px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg"
              style={{ backgroundColor: frame.color || '#000', color: frame.textColor || '#fff' }}
            >
              {frame.text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrPreview;