"use client";

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const previewFormats = [
  { id: 'table-stand', dimensions: { width: 5, height: 7 } },
  { id: 'table_tent', dimensions: { width: 5, height: 7 } },
  { id: 'poster', dimensions: { width: 18, height: 24 } },
  { id: 'poster_a4', dimensions: { width: 21, height: 29.7 } },
  { id: 'poster_a5', dimensions: { width: 14.8, height: 21 } },
  { id: 'flyer', dimensions: { width: 8.5, height: 11 } },
  { id: 'window-sticker', dimensions: { width: 4, height: 4 } },
  { id: 'banner', dimensions: { width: 2.5, height: 6 } },
  { id: 'social-media', dimensions: { width: 1080, height: 1080 } },
  { id: 'social_media', dimensions: { width: 1080, height: 1080 } },
];

interface MarketingAssetRendererProps {
  elements: any[];
  backgroundColor: string;
  uploadedDesign?: string | null;
  activeQrUrl: string;
  previewBusinessLogo?: string;
  selectedQrId?: string | null;
  format: string | null;
  customWidth?: string;
  customHeight?: string;
  customUnit?: string;
  width?: number;
  isMockup?: boolean;
}

export const MarketingAssetRenderer = ({
  elements,
  backgroundColor,
  uploadedDesign = null,
  activeQrUrl,
  previewBusinessLogo = "",
  selectedQrId = null,
  format,
  customWidth,
  customHeight,
  customUnit = 'in',
  width,
  isMockup = false,
}: MarketingAssetRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width || 280);

  useEffect(() => {
    if (width) {
      setContainerWidth(width);
      return;
    }
    if (typeof window === 'undefined' || !containerRef.current) return;
    
    // Set initial width
    setContainerWidth(containerRef.current.getBoundingClientRect().width || 280);

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width]);

  // Find aspect ratio
  let ratio = 9/16;
  if (format === 'window-sticker' && customWidth && customHeight) {
    ratio = Number(customWidth) / Number(customHeight);
  } else {
    const matched = previewFormats.find(f => f.id === format);
    if (matched?.dimensions) {
      ratio = matched.dimensions.width / matched.dimensions.height;
    }
  }

  const height = containerWidth / ratio;
  
  // Calculate relative scaling factors
  const rawScale = containerWidth / 280;
  // Boost scaling for small previews unless it's a real-world mockup display
  const scale = isMockup ? rawScale : (rawScale < 0.65 ? rawScale * 1.25 : rawScale);

  const isAiDesignMode = !!uploadedDesign;
  const elementsToRender = elements.filter(el => !isAiDesignMode || el.type === 'qr');

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${isMockup ? '' : 'rounded-lg'}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: `${height}px`,
        backgroundColor: uploadedDesign ? 'transparent' : backgroundColor,
        position: 'relative',
      }}
    >
      {uploadedDesign && (
        <img 
          src={uploadedDesign} 
          alt="Custom Design Background" 
          className="w-full h-full object-cover absolute inset-0 z-0 pointer-events-none select-none" 
        />
      )}

      <div className="relative w-full h-full z-10">
        {elementsToRender.map((el) => {
          if (el.type === 'text') {
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: el.width ? `${el.width}%` : '80%',
                  color: el.color || '#0F172A',
                  fontSize: `${(el.fontSize || 14) * scale}px`,
                  fontWeight: el.fontWeight || 'normal',
                  textAlign: (el.alignment || 'center') as any,
                  zIndex: 10,
                  lineHeight: 1.2,
                }}
              >
                <div style={{ padding: `0 ${8 * scale}px` }}>
                  <h3 className="drop-shadow-sm tracking-tight leading-tight w-full">
                    {el.text}
                  </h3>
                </div>
              </div>
            );
          }

          if (el.type === 'qr') {
            const qrSize = (el.size || 120) * scale;
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  backgroundColor: '#FFFFFF',
                  padding: `${8 * scale}px`,
                  borderRadius: `${14 * scale}px`,
                  boxShadow: `0 ${10 * scale}px ${25 * scale}px rgba(0, 0, 0, 0.15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                }}
              >
                <QRCodeSVG
                  value={activeQrUrl}
                  size={qrSize}
                  level="H"
                  includeMargin={false}
                  imageSettings={!selectedQrId && previewBusinessLogo ? {
                    src: previewBusinessLogo,
                    height: qrSize * 0.22,
                    width: qrSize * 0.22,
                    excavate: true,
                    crossOrigin: 'anonymous',
                  } : undefined}
                />
              </div>
            );
          }

          if (el.type === 'logo') {
            return (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.width || 30}%`,
                  height: `${el.height || 8}%`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 30,
                }}
              >
                {previewBusinessLogo ? (
                  <img
                    src={previewBusinessLogo}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : null}
              </div>
            );
          }

          return null;
        })}
      </div>

      {isMockup && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10 mix-blend-overlay z-20" />
      )}
    </div>
  );
};

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
  const backgroundColor = customConfig.backgroundColor || '#FFFFFF';
  const dimensions = customConfig.dimensions || { width: 5, height: 7, unit: 'in' };
  const uploadedDesign = customConfig.uploadedDesign || null;
  
  return (
    <div className={className} style={{ width: '100%' }}>
      <MarketingAssetRenderer
        elements={elements}
        backgroundColor={backgroundColor}
        uploadedDesign={uploadedDesign}
        activeQrUrl={asset.qrCodeContent || ''}
        previewBusinessLogo={businessLogo || ''}
        selectedQrId={null}
        format={asset.type}
        customWidth={dimensions.width?.toString()}
        customHeight={dimensions.height?.toString()}
        customUnit={dimensions.unit}
        isMockup={scale < 0.5}
      />
    </div>
  );
};
