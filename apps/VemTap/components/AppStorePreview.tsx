import React from 'react';
import { ShoppingBag, ChevronRight, Star, Download, ShieldCheck } from 'lucide-react';

interface AppStorePreviewProps {
  title?: string;
  description?: string;
  icon?: string;
  iosUrl?: string;
  androidUrl?: string;
  themeColor?: string;
}

const AppStorePreview: React.FC<AppStorePreviewProps> = ({
  title = "Download our Official App",
  description = "Get the best experience by downloading our app. Available now on all major platforms.",
  icon,
  iosUrl = "#",
  androidUrl = "#",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  themeColor: _themeColor = "#3b82f6"
}) => {
  return (
    <div className="w-full h-full flex flex-col font-sans bg-slate-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide py-8 px-6 flex flex-col items-center space-y-8">
        
        {/* App Icon Mockup */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 rounded-[32px] blur-2xl opacity-10 animate-pulse" />
          <div className="w-24 h-24 bg-white rounded-[28px] shadow-xl flex items-center justify-center p-3 border border-white relative">
             {icon ? (
               <img src={icon} alt="App Icon" className="w-full h-full object-cover rounded-[20px]" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[20px] flex items-center justify-center text-white">
                  <ShoppingBag size={32} />
               </div>
             )}
             <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                <ShieldCheck size={16} />
             </div>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center space-y-3">
           <div className="flex items-center justify-center gap-1 text-amber-500">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
              <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">4.9 Rating</span>
           </div>
           <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
             {title}
           </h1>
           <p className="text-[11px] font-medium text-gray-500 max-w-[220px] mx-auto leading-relaxed px-2">
             {description}
           </p>
        </div>

        {/* Store Badges */}
        <div className="w-full space-y-3">
           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] text-center mb-1">Select your platform</p>
           
           <a 
             href={iosUrl} 
             target="_blank" 
             rel="noopener noreferrer"
             className="w-full h-16 bg-black text-white rounded-2xl flex items-center px-5 gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg group"
           >
              <div className="w-8 h-8 flex items-center justify-center">
                 <svg viewBox="0 0 384 512" className="w-6 h-6 fill-current">
                   <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-53.8-24.3-89.8-24.3C60.2 136.8 0 193.1 0 289c0 55.4 17.5 125.1 43.1 161.4 16.3 22.8 45.4 52.1 76.5 52.1 27.6 0 42-21 76.2-21 34.2 0 45.4 21 76.5 21 33.1 0 62.4-33.1 76.8-52.1 19.3-26 27.5-51 28.1-52.8-1.1-.3-65.7-25.1-66.5-107.9zM265.9 83c31.2-37.5 24.3-84.6 24.3-84.6-43.2 0-87.3 32.4-87.3 32.4 0 0-4.6 51.6 31.8 84.6 5.8 4.7 12 9.4 18.5 9.4 4.5 0 8.8-1.4 12.7-4.1z" />
                 </svg>
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-semibold uppercase opacity-60 leading-none mb-1">Download on the</p>
                 <p className="text-lg font-bold tracking-tight leading-none">App Store</p>
              </div>
              <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
           </a>

           <a 
             href={androidUrl} 
             target="_blank" 
             rel="noopener noreferrer"
             className="w-full h-16 bg-white border border-slate-200 text-gray-900 rounded-2xl flex items-center px-5 gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-sm group"
           >
              <div className="w-8 h-8 flex items-center justify-center">
                 <svg viewBox="0 0 512 512" className="w-6 h-6">
                   <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-10.3 18-28.5-1.2-40.8zM325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z" fill="#00e5ff"/>
                   <path d="M325.3 234.3L104.6 13c-7.4 4.1-13.4 10.3-17.6 17.6l238.3 203.7z" fill="#00a0ff"/>
                   <path d="M47 512c4.2-2.2 8.3-5.2 11.9-8.8l238.1-238.2-31.7-31.7L47 512z" fill="#00c853"/>
                   <path d="M265.3 256L47 476.7c-4.2-2.2-8.3-5.2-11.9-8.8V35.3c0-7.4 2.8-14.1 7.3-19.3L265.3 256z" fill="#ff3d00"/>
                 </svg>
              </div>
              <div className="flex-1">
                 <p className="text-[9px] font-semibold uppercase opacity-60 leading-none mb-1">Get it on</p>
                 <p className="text-lg font-bold tracking-tight leading-none">Google Play</p>
              </div>
              <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
           </a>
        </div>

        {/* Stats */}
        <div className="flex gap-6 pt-2">
           <div className="text-center">
              <p className="text-lg font-bold text-gray-900 leading-none mb-1">10M+</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Installs</p>
           </div>
           <div className="w-px h-8 bg-slate-200" />
           <div className="text-center">
              <p className="text-lg font-bold text-gray-900 leading-none mb-1">4.9</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
           </div>
           <div className="w-px h-8 bg-slate-200" />
           <div className="text-center">
              <p className="text-lg font-bold text-gray-900 leading-none mb-1">22MB</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Size</p>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-5 px-6 bg-white border-t border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Download className="text-blue-600" size={14} />
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Secured Access</span>
         </div>
         <div className="flex -space-x-1.5">
            {[1,2,3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border border-white bg-slate-100 overflow-hidden shadow-sm">
                 <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" className="w-full h-full object-cover" />
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default AppStorePreview;
