import React from 'react';
import { Share2, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface SocialsProfilePreviewProps {
  name?: string;
  bio?: string;
  images?: string[];
  themeColor?: string;
  socials?: Record<string, string>;
}

const getSocialConfig = (platform: string) => {
    const configs: Record<string, { icon: React.FC<any>, color: string }> = {
        facebook: { icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, color: 'text-blue-600' },
        instagram: { icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>, color: 'text-pink-600' },
        tiktok: { icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96s3.35-1.92 5.27-1.74c1.1.07 2.13.44 3.06 1.06V.02z"/></svg>, color: 'text-black' },
        youtube: { icon: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, color: 'text-red-600' }
    };
    return configs[platform.toLowerCase()] || { icon: Share2, color: 'text-gray-500' };
};

const SocialsProfilePreview: React.FC<SocialsProfilePreviewProps> = ({ 
  name = "Sarah Ann Peters", 
  bio = "Hi! I'm Sarah Ann Peters. Welcome to my social media hub! The links below will connect you with my channels on every popular platform.",
  images = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
  ],
  themeColor = "#5c7cfa",
  socials = { facebook: "https://facebook.com", instagram: "https://instagram.com", tiktok: "https://tiktok.com", youtube: "https://youtube.com" }
}) => {
  return (
    <div className="w-full h-full flex flex-col font-sans" style={{ backgroundColor: themeColor }}>
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        
        {/* Carousel Area */}
        <div className="relative w-full h-[280px] flex items-center justify-center pt-8">
            <button className="absolute top-10 right-6 z-20 p-2 bg-white/20 rounded-full backdrop-blur-md border border-white/30">
               <Share2 className="w-5 h-5 text-white" />
            </button>
            <div id="carousel-container" className="w-full h-[280px] overflow-x-auto flex items-center px-4 snap-x snap-mandatory scrollbar-hide">
              {images.map((url, i) => (
                <div key={i} className="w-[240px] h-[280px] snap-center mx-2 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl shrink-0 bg-gray-50 flex items-center justify-center">
                    <img src={url} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          
          <button onClick={() => document.getElementById('carousel-container')?.scrollBy({ left: -256, behavior: 'smooth' })} className="absolute left-2 z-10 p-2 bg-white/80 rounded-full shadow-lg backdrop-blur-sm hover:bg-white transition-all"><ChevronLeft className="w-6 h-6 text-gray-800" /></button>
          <button onClick={() => document.getElementById('carousel-container')?.scrollBy({ left: 256, behavior: 'smooth' })} className="absolute right-2 z-10 p-2 bg-white/80 rounded-full shadow-lg backdrop-blur-sm hover:bg-white transition-all"><ChevronRight className="w-6 h-6 text-gray-800" /></button>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-t-[3rem] p-8 shadow-xl mx-0 mt-4 min-h-[300px]">
            <h1 className="text-2xl font-bold text-gray-900 mb-3 text-center">{name}</h1>
            <p className="text-[13px] text-gray-500 leading-relaxed text-center mb-8 px-4">
                {bio}
            </p>
            
            <div className="flex flex-col gap-4">
                <p className="text-xl font-medium text-gray-900 mb-2">Find me on</p>
                {Object.entries(socials).map(([platform, url]) => {
                    const config = getSocialConfig(platform);
                    return (
                        <a key={platform} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 border border-gray-100 rounded-3xl hover:bg-gray-50 transition-all">
                            <div className="p-3 bg-gray-50 rounded-2xl"><config.icon className={`w-6 h-6 ${config.color}`} /></div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 capitalize">{platform}</p>
                                <p className="text-[11px] text-gray-400 font-normal whitespace-nowrap">Social Account</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300" />
                        </a>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SocialsProfilePreview;
