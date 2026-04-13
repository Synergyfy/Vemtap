import React from 'react';
import { Eye } from 'lucide-react';

interface PDFProfilePreviewProps {
  companyName?: string;
  title?: string;
  description?: string;
  previewImage?: string;
  onView: () => void;
  themeColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

const PDFProfilePreview: React.FC<PDFProfilePreviewProps> = ({ 
  companyName = "Vemtap",
  title = "Digital Engagement Solutions",
  description = "We help businesses bring customers back. Instantly collect data with a simple tap and engage them automatically.",
  previewImage,
  onView,
  themeColor = "#5c7cfa",
  textColor = "#ffffff",
  buttonColor = "#74b816",
  buttonTextColor = "#ffffff"
}) => {
  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: themeColor }}>
      {/* Hide scrollbar but keep scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Header Info - Compacted */}
        <div className="px-6 pt-10 pb-6 text-center" style={{ color: textColor }}>
          <p className="text-[11px] opacity-90 font-medium mb-1 tracking-wider uppercase">{companyName}</p>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-[12px] opacity-80 leading-snug max-w-[260px] mx-auto">{description}</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-t-[32px] p-5 shadow-xl flex flex-col items-center">
          <div className="w-full aspect-[4/3] bg-orange-50 rounded-2xl overflow-hidden border border-orange-100 mb-6 flex items-center justify-center">
            {previewImage ? (
               <img src={previewImage} alt="PDF Preview" className="w-full h-full object-cover" />
            ) : (
               <div className="text-sm text-gray-400">PDF Preview</div>
            )}
          </div>

          <button 
            onClick={onView}
            className="w-full py-4 rounded-xl font-semibold text-md flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            <Eye className="w-5 h-5" />
            View PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFProfilePreview;
