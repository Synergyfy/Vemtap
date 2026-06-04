"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface MarketingAssetPreviewProps {
  asset: any;
  scale?: number;
  className?: string;
  showDetails?: boolean;
  businessLogo?: string;
}

export const MarketingAssetPreview = ({ 
  asset, 
  scale = 1, 
  className = "", 
  showDetails = false,
  businessLogo
}: MarketingAssetPreviewProps) => {
  if (!asset) return null;

  const customConfig = asset.customConfig || {};
  const elements = customConfig.elements || [];
  const backgroundColor = customConfig.backgroundColor || '#0F172A';
  const dimensions = customConfig.dimensions || { width: 5, height: 7, unit: 'in' };
  
  // Calculate aspect ratio
  const aspectRatio = `${dimensions.width}/${dimensions.height}`;

  // If scale is small (like in a grid), we need to make sure text and QR remain legible
  // by using a non-linear scaling factor for readability
  const adjustScale = (originalScale: number) => {
    if (scale >= 0.8) return originalScale * scale;
    // For smaller scales, we boost the size of elements to maintain legibility
    return originalScale * (scale * 1.5);
  };

  return (
    <div 
      className={`relative overflow-hidden shadow-sm transition-all flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor,
        aspectRatio,
        width: '100%',
      }}
    >
      {/* Background Image / Texture if applicable */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop")' }}
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

      {/* Content Canvas */}
      <div className="relative w-full h-full flex items-center justify-center z-[2]">
        {elements.length > 0 ? (
          elements.map((el: any) => {
            if (el.type === 'text') {
              return (
                <div 
                  key={el.id} 
                  style={{ 
                    position: 'absolute', 
                    left: `${el.x}%`, 
                    top: `${el.y}%`, 
                    width: `${el.width || 90}%`,
                    fontSize: `${adjustScale(el.fontSize)}px`, 
                    color: el.color || '#FFFFFF', 
                    fontWeight: el.fontWeight || '900', 
                    textAlign: 'center',
                    transform: 'translateX(-50%)',
                  }}
                  className="leading-tight tracking-tight drop-shadow-lg"
                >
                  {el.text}
                </div>
              );
            }
            if (el.type === 'qr' || el.type === 'qr_code') {
              const qrSize = adjustScale(el.size || 80);
              return (
                <div 
                  key={el.id} 
                  style={{ 
                    position: 'absolute', 
                    left: `${el.x}%`, 
                    top: `${el.y}%`, 
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  }}
                  className={`${scale < 0.5 ? 'p-1 rounded-lg' : 'p-2 rounded-xl'} bg-white shadow-2xl flex items-center justify-center`}
                >
                  <QRCodeSVG 
                    value={asset.qrCodeContent || 'https://vemtap.com'} 
                    size={qrSize} 
                    fgColor={asset.qrCodeConfig?.color || '#000000'} 
                    bgColor={asset.qrCodeConfig?.backgroundColor || '#FFFFFF'}
                    level="H"
                    includeMargin={false}
                    imageSettings={businessLogo ? {
                      src: businessLogo,
                      height: qrSize * 0.25,
                      width: qrSize * 0.25,
                      excavate: true,
                    } : undefined}
                  />
                </div>
              );
            }
            return null;
          })
        ) : (
          <div className="bg-white p-3 rounded-2xl shadow-2xl">
            <QRCodeSVG 
              value={asset.qrCodeContent} 
              size={110 * scale} 
              fgColor={asset.qrCodeConfig?.color || '#000000'} 
              bgColor={asset.qrCodeConfig?.backgroundColor || '#FFFFFF'} 
            />
          </div>
        )}
      </div>

      {/* Format Badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/20 backdrop-blur text-[8px] font-extrabold text-white rounded-md uppercase tracking-wider z-[5]">
        {asset.type.replace('_', ' ')}
      </span>
    </div>
  );
};
