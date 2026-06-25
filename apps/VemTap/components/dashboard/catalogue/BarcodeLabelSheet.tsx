'use client';

import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface LabelProduct {
  name: string;
  price: number;
  barcode: string;
}

interface BarcodeLabelSheetProps {
  products: LabelProduct[];
}

export default function BarcodeLabelSheet({ products }: BarcodeLabelSheetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const canvases = containerRef.current.querySelectorAll<HTMLCanvasElement>('[data-barcode]');
    canvases.forEach((canvas) => {
      const value = canvas.dataset.barcode;
      if (value) {
        try {
          JsBarcode(canvas, value, {
            format: 'CODE128',
            width: 1.5,
            height: 30,
            displayValue: true,
            fontSize: 10,
            margin: 2,
            background: '#ffffff',
          });
        } catch {}
      }
    });
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div className="print-only p-6" ref={containerRef}>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .label-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .label-card {
            border: 1px dashed #ccc;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8px 4px;
            min-height: 80px;
          }
        }
        @media screen {
          .label-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .label-card {
            border: 1px dashed #e5e7eb;
            border-radius: 12px;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 12px 8px;
            min-height: 100px;
          }
        }
        .label-card canvas { max-width: 100%; max-height: 50px; }
      `}</style>
      <div className="label-grid">
        {products.map((product, idx) => (
          <div key={`${product.barcode}-${idx}`} className="label-card">
            <canvas data-barcode={product.barcode} />
            <p className="text-[9px] font-bold text-gray-800 text-center leading-tight mt-1 line-clamp-1">{product.name}</p>
            <p className="text-[8px] font-bold text-gray-500">₦{product.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
