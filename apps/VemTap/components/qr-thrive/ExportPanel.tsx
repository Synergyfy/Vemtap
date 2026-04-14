import React from 'react';
import { Download, FileImage, FileType } from 'lucide-react';
import { useQRCode } from '../hooks/useQRCode';
import type { QRConfiguration } from '../types/qr';

interface ExportPanelProps {
  config: QRConfiguration;
  hasUser: boolean;
  isValid?: boolean;
  onAuthRequired: () => void;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ExportPanel: React.FC<ExportPanelProps> = ({ config, hasUser, isValid = true, onAuthRequired }) => {
  const { download } = useQRCode(config);

  const handleDownload = (type: 'png' | 'svg' | 'jpeg') => {
    if (!hasUser) {
      onAuthRequired();
    } else {
      download(type);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <button
        onClick={() => isValid && handleDownload('svg')}
        disabled={!isValid}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-8 py-5 text-white rounded-[24px] font-bold text-lg transition-all shadow-2xl active:scale-95 group",
          isValid 
            ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
            : "bg-gray-300 cursor-not-allowed shadow-none"
        )}
      >
        <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
        Download Vector (SVG)
      </button>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => isValid && handleDownload('png')}
          disabled={!isValid}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest",
            isValid 
              ? "text-gray-700 hover:shadow-xl hover:border-blue-100" 
              : "text-gray-300 cursor-not-allowed opacity-50"
          )}
        >
          <FileImage className="w-4 h-4 text-blue-600" />
          PNG Image
        </button>
        <button
          onClick={() => isValid && handleDownload('jpeg')}
          disabled={!isValid}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-2xl font-bold transition-all shadow-sm active:scale-95 text-xs uppercase tracking-widest",
            isValid 
              ? "text-gray-700 hover:shadow-xl hover:border-blue-100" 
              : "text-gray-300 cursor-not-allowed opacity-50"
          )}
        >
          <FileType className="w-4 h-4 text-blue-600" />
          JPEG Format
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
