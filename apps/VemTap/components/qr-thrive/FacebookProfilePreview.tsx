import React from 'react';
import { Share2 } from 'lucide-react';

interface FacebookProfilePreviewProps {
  name?: string;
  bio?: string;
  logo?: string;
  banner?: string;
}

const FacebookProfilePreview: React.FC<FacebookProfilePreviewProps> = ({ 
  name = "Vemtap", 
  bio = "We help businesses bring customers back. Instantly collect data with a simple tap and engage them automatically.",
  logo = "",
  banner = ""
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-white font-sans overflow-hidden">
      {/* Banner / Cover */}
      <div className="h-40 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 relative">
        {banner && <img src={banner} className="w-full h-full object-cover" alt="Banner" />}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/40">
           <Share2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 relative">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full border-4 border-white bg-blue-600 -mt-14 flex items-center justify-center shadow-lg overflow-hidden">
           {logo ? (
              <img src={logo} className="w-full h-full object-cover" alt="Logo" />
           ) : (
             <svg viewBox="0 0 24 24" fill="white" className="w-16 h-16">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
             </svg>
           )}
        </div>

        {/* Info */}
        <div className="mt-4">
           <h1 className="text-2xl font-bold text-gray-900 mb-4">{name}</h1>
           <p className="text-sm text-gray-600 leading-relaxed mb-8">
              {bio}
           </p>
           
           <button className="w-full py-3 bg-[#0866FF] text-white rounded-lg font-semibold text-sm hover:bg-[#0756e0] transition-colors">
             Go to our Facebook page
           </button>
        </div>
      </div>
    </div>
  );
};

export default FacebookProfilePreview;
