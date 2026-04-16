import React from 'react';
import { Phone, Video, MoreVertical, Smile, Paperclip, Camera, Mic, Check } from 'lucide-react';

interface WhatsAppChatPreviewProps {
  number: string;
  message: string;
}

const WhatsAppChatPreview: React.FC<WhatsAppChatPreviewProps> = ({ number, message }) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#e5ddd5] relative font-sans">
      {/* Header */}
      <div className="bg-[#075e54] text-white p-2.5 flex items-center justify-between shadow-md z-10 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100">
            <img src="/vemtap.png" alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[120px]">{number || 'Contact'}</span>
            <span className="text-[10px] opacity-80">online</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Video className="w-5 h-5" />
          <Phone className="w-5 h-5" />
          <MoreVertical className="w-5 h-5" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-hidden relative">
        {/* Chat Background Pattern Placeholder */}
        <div className="absolute inset-0 opacity-[0.06]" 
             style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
        
        {message && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#dcf8c6] px-3 py-2 rounded-lg shadow-sm text-sm relative max-w-[80%] min-w-[60px]">
              {message}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500">12:30</span>
                <Check className="w-3 h-3 text-[#34b7f1] fill-current" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="bg-[#f0f0f0] p-2 flex items-center gap-2">
        <Smile className="w-6 h-6 text-gray-500" />
        <div className="flex-1 bg-white rounded-full px-4 py-2 text-sm text-gray-400 border border-gray-200 shadow-sm flex items-center justify-between">
            <span>Message</span>
            <div className="flex items-center gap-3">
                <Paperclip className="w-5 h-5 text-gray-400" />
                <Camera className="w-5 h-5 text-gray-400" />
            </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#075e54] flex items-center justify-center text-white">
          <Mic className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default WhatsAppChatPreview;
