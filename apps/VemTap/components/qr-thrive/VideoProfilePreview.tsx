import React from 'react';
import { Play } from 'lucide-react';

interface VideoProfilePreviewProps {
  companyName?: string;
  title?: string;
  description?: string;
  footerText?: string;
  videoUrl?: string;
  themeColor?: string;
  textColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  onPlay: () => void;
}

const VideoProfilePreview: React.FC<VideoProfilePreviewProps> = ({ 
  companyName = "Vemtap",
  title = "Digital Engagement Solutions",
  description = "We help businesses bring customers back. Instantly collect data with a simple tap and engage them automatically.",
  footerText = "From the preparation to the plate, learn to cook my favourite recipes",
  videoUrl,
  themeColor = "#5c7cfa",
  textColor = "#ffffff",
  buttonColor = "transparent",
  buttonTextColor = "#ffffff",
  onPlay
}) => {
  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden" style={{ backgroundColor: themeColor }}>
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Header Info */}
        <div className="px-6 pt-12 pb-6 text-center" style={{ color: textColor }}>
          <p className="text-[11px] opacity-90 font-medium mb-1 tracking-wider">{companyName}</p>
          <h1 className="text-2xl font-bold mb-3">{title}</h1>
          <p className="text-[12px] opacity-80 leading-snug max-w-[280px] mx-auto mb-6">{description}</p>
          
          <button 
            className="w-full py-4 rounded-xl font-semibold text-md border border-white/40 transition-colors"
            style={{ backgroundColor: buttonColor, color: buttonTextColor }}
          >
            View more
          </button>
        </div>

        {/* Video Card */}
        <div className="bg-white rounded-t-[32px] p-5 shadow-xl flex flex-col items-center min-h-[400px]">
          <div className="w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden mb-6 flex items-center justify-center relative cursor-pointer" onClick={onPlay}>
            {videoUrl ? (
               <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop" alt="Video Thumbnail" className="w-full h-full object-cover" />
            ) : (
               <div className="text-sm text-gray-400">No Video</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
               <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-black ml-1" fill="currentColor" />
               </div>
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed text-center px-2">
            {footerText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoProfilePreview;
