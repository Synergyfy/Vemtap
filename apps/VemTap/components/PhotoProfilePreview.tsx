import React, { useState } from 'react';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoProfilePreviewProps {
  companyName?: string;
  galleryTitle?: string;
  description?: string;
  buttonText?: string;
  images?: { url: string; caption?: string }[];
  themeColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
}

const PhotoProfilePreview: React.FC<PhotoProfilePreviewProps> = ({ 
  companyName = "Vemtap",
  galleryTitle = "Travel Photography",
  description = "Discover the world through my lens. Every stop is a new adventure!",
  buttonText = "View More",
  images = [],
  themeColor = "#5c7cfa",
  textColor = "#ffffff",
  buttonColor = "transparent",
  buttonTextColor = "#ffffff"
}) => {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewingIndex !== null && viewingIndex < images.length - 1) setViewingIndex(viewingIndex + 1);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewingIndex !== null && viewingIndex > 0) setViewingIndex(viewingIndex - 1);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden relative" style={{ backgroundColor: themeColor }}>
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Header Info */}
        <div className="px-6 pt-12 pb-6 text-center" style={{ color: textColor }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{companyName}</p>
          <h1 className="text-2xl font-bold mb-3">{galleryTitle}</h1>
          <p className="text-[12px] opacity-80 leading-snug max-w-[280px] mx-auto mb-6">{description}</p>

          <button 
            className="px-12 py-3 rounded-lg font-semibold text-md border-2 border-white transition-colors"
            style={{ backgroundColor: buttonColor, color: buttonTextColor, borderColor: buttonTextColor }}
          >
            {buttonText}
          </button>
        </div>

        {/* Gallery Card */}
        <div className="bg-white rounded-t-[40px] p-5 shadow-xl min-h-[400px]">
          <div className="flex flex-col gap-4">
              {images.length > 0 ? (
                images.map((img, i) => (
                  <div key={i} className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setViewingIndex(i)}>
                    <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-gray-400 text-sm">
                   <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   No images yet
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Full screen preview IN container */}
      {viewingIndex !== null && (
        <div className="absolute inset-0 bg-black z-[50] flex items-center justify-center" onClick={() => setViewingIndex(null)}>
           <button className="absolute top-4 right-4 text-white z-10"><X className="w-8 h-8" /></button>

           {viewingIndex > 0 && (
             <button className="absolute left-4 text-white bg-white/20 p-2 rounded-full" onClick={prevImage}><ChevronLeft className="w-8 h-8" /></button>
           )}

           <img src={images[viewingIndex].url} alt="Full view" className="max-w-full max-h-full object-contain" />

           {viewingIndex < images.length - 1 && (
             <button className="absolute right-4 text-white bg-white/20 p-2 rounded-full" onClick={nextImage}><ChevronRight className="w-8 h-8" /></button>
           )}
        </div>
      )}
    </div>
  );
};

export default PhotoProfilePreview;
