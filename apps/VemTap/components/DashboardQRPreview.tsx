import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { QRConfiguration } from '../types/qr';

interface DashboardQRPreviewProps {
  config: QRConfiguration;
  shortUrl: string;
}

const DashboardQRPreview: React.FC<DashboardQRPreviewProps> = ({ config, shortUrl }) => {
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine the data to encode.
    // Dashboard should use the shortUrl for dynamic behavior.
    const qrData = shortUrl.startsWith('http') 
      ? shortUrl 
      : `${window.location.origin}${shortUrl}`;

    const options = {
      width: 150,
      height: 150,
      margin: 10,
      data: qrData,
      image: config.logo,
      dotsOptions: {
        type: config.design.dots.type,
        color: config.design.dots.color,
        gradient: config.design.dots.gradient,
      },
      backgroundOptions: {
        color: 'transparent',
      },
      cornersSquareOptions: {
        type: config.design.cornersSquare.type,
        color: config.design.cornersSquare.color,
        gradient: config.design.cornersSquare.gradient,
      },
      cornersDotOptions: {
        type: config.design.cornersDot.type,
        color: config.design.cornersDot.color,
        gradient: config.design.cornersDot.gradient,
      },
      imageOptions: config.design.imageOptions,
      qrOptions: config.design.qrOptions,
    };

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling(options);
      if (containerRef.current) {
        qrCodeRef.current.append(containerRef.current);
      }
    } else {
      qrCodeRef.current.update(options);
    }
  }, [config, shortUrl]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center dashboard-qr-preview">
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-qr-preview canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
          display: block;
        }
        .dashboard-qr-preview svg {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain;
          display: block;
        }
      `}} />
    </div>
  );
};

export default DashboardQRPreview;
