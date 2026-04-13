import React from 'react';
import { Bell, MoreHorizontal, Grid3X3, PlaySquare, Contact } from 'lucide-react';

interface InstagramProfilePreviewProps {
  username: string;
}

const InstagramProfilePreview: React.FC<InstagramProfilePreviewProps> = ({ username }) => {
  const displayUsername = username || 'Vemtapng';
  return (
    <div className="w-full h-full flex flex-col bg-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-bold text-lg">{displayUsername}</span>
        <div className="flex gap-4">
          <Bell className="w-6 h-6" />
          <MoreHorizontal className="w-6 h-6" />
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-6 mb-4">
          <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
              <img src="/vemtap.png" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-1 justify-between text-center gap-1">
            {['1,234', '567', '890'].map((val, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="font-bold text-sm">{val}</div>
                <div className="text-[10px] text-gray-600">{['Posts', 'Followers', 'Following'][i]}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="font-bold text-sm mb-1">{displayUsername}</div>
        <p className="text-sm text-gray-600 mb-2">We help businesses bring customers back. Instantly collect data with a simple tap and engage them automatically.</p>
        
        <div className="flex gap-2 mb-4">
          <button className="flex-1 bg-gray-100 py-1.5 rounded-lg text-sm font-semibold">Follow</button>
          <button className="flex-1 bg-gray-100 py-1.5 rounded-lg text-sm font-semibold">Message</button>
          <button className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold">+</button>
        </div>
      </div>

      {/* Highlights */}
      <div className="flex gap-4 px-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full border border-gray-200 bg-gray-100" />
            <span className="text-[10px]">Story {i}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-100">
        <div className="flex-1 flex justify-center py-3 border-t border-black"><Grid3X3 className="w-6 h-6" /></div>
        <div className="flex-1 flex justify-center py-3 text-gray-400"><PlaySquare className="w-6 h-6" /></div>
        <div className="flex-1 flex justify-center py-3 text-gray-400"><Contact className="w-6 h-6" /></div>
      </div>
      
      {/* Grid Placeholder */}
      <div className="grid grid-cols-3 gap-0.5">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100" />
        ))}
      </div>
    </div>
  );
};

export default InstagramProfilePreview;
