import React from 'react';
import { Globe } from 'lucide-react';

interface WebsiteProfilePreviewProps {
  url?: string;
  themeColor?: string;
  title?: string;
  description?: string;
}

const WebsiteProfilePreview: React.FC<WebsiteProfilePreviewProps> = ({ 
  url = "https://example.com",
  themeColor = "#00C9E0"
}) => {
  // Ensure the URL is displayed nicely
  const displayUrl = url.startsWith('http') ? url : `https://${url}`;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: themeColor }}>
      {/* Browser Header / Search Bar */}
      <div className="pt-2 pb-6 px-5 flex flex-col items-center gap-4">
        <div className="w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-full py-2.5 px-4 flex items-center gap-3 shadow-lg">
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-white" />
          </div>

          <span className="text-sm font-bold text-white truncate drop-shadow-sm">
            {displayUrl}
          </span>
        </div>
      </div>

      {/* Main Content Area (Mimicking a Website Page) */}
      <div className="flex-1 bg-white mx-4 mt-2 rounded-t-[32px] p-6 shadow-2xl relative">
        {/* Skeleton UI Components */}
        <div className="space-y-6">
          {/* Main Hero Image Placeholder */}
          <div className="w-full aspect-[4/3] bg-gray-100 rounded-[24px] animate-pulse" />
          
          {/* Text Content Placeholders */}
          <div className="space-y-3">
            <div className="h-4 w-2/3 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded-full animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-50 rounded-[20px] animate-pulse" />
            <div className="h-24 bg-gray-50 rounded-[20px] animate-pulse" />
          </div>

          <div className="space-y-3">
             <div className="h-3 w-1/2 bg-gray-50 rounded-full animate-pulse" />
             <div className="h-3 w-full bg-gray-50 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Home Indicator / Page Footer Decoration indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-100 rounded-full opacity-50" />
      </div>
    </div>
  );
};

export default WebsiteProfilePreview;
