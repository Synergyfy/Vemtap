import React from 'react';
import { Phone, Video, MoreVertical, Smile, Paperclip, Camera, Mic, Check, Send } from 'lucide-react';

interface WhatsAppChatPreviewProps {
  name: string;
  message: string;
  onMessageChange?: (val: string) => void;
  onSend?: () => void;
  isCustom?: boolean;
}

const WhatsAppChatPreview: React.FC<WhatsAppChatPreviewProps> = ({ 
    name, 
    message, 
    onMessageChange, 
    onSend,
    isCustom = true
}) => {
  return (
    <div className="w-[360px] h-[640px] flex flex-col bg-[#e5ddd5] relative font-sans rounded-[3rem] overflow-hidden border-[8px] border-slate-800 shadow-2xl mx-auto ring-4 ring-slate-700/20">
      {/* Phone Notch/Status Bar Area */}
      <div className="h-6 bg-[#075e54] flex items-center justify-center">
          <div className="w-20 h-4 bg-black/20 rounded-full mt-1" />
      </div>

      {/* Header */}
      <div className="bg-[#075e54] text-white p-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/10">
            <span className="text-base font-bold">{(name || 'C').charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[120px]">{name || 'Contact'}</span>
            <span className="text-[10px] opacity-80">online</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <Video className="w-5 h-5 text-white/80" />
          <Phone className="w-5 h-5 text-white/80" />
          <MoreVertical className="w-5 h-5 text-white/80" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto relative custom-scrollbar flex flex-col justify-end">
        {/* Chat Background Pattern */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, #000 1px, transparent 0)', backgroundSize: '30px 30px' }} 
        />
        
        {message ? (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10 mb-2">
            <div className="bg-[#dcf8c6] px-3 py-2 rounded-lg rounded-tr-none shadow-sm text-[13px] relative max-w-[90%] min-w-[80px] leading-relaxed whitespace-pre-wrap break-words">
              {message}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Check className="w-3 h-3 text-[#34b7f1] fill-current" />
              </div>
              {/* Triangle Tail */}
              <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-r-[10px] border-r-transparent" />
            </div>
          </div>
        ) : (
            <div className="flex justify-center items-center h-full opacity-40">
                <p className="text-xs italic text-slate-500">Preview will appear here</p>
            </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="bg-transparent p-2 pb-4 flex items-end gap-2 relative z-20">
        <div className="flex-1 bg-white rounded-[1.5rem] px-3 py-2 flex items-center gap-2 shadow-sm border border-gray-200">
            <Smile className="w-6 h-6 text-gray-500 shrink-0 cursor-pointer" />
            
            <textarea
                value={message}
                onChange={(e) => onMessageChange?.(e.target.value)}
                placeholder="Message"
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none resize-none max-h-32 py-1"
                style={{ height: 'auto' }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                }}
            />

            <div className="flex items-center gap-3 shrink-0">
                <Paperclip className="w-5 h-5 text-gray-400 rotate-45 cursor-pointer" />
                {!message && <Camera className="w-5 h-5 text-gray-400 cursor-pointer" />}
            </div>
        </div>
        
        <button 
            onClick={onSend}
            className="w-12 h-12 rounded-full bg-[#075e54] flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition-transform"
        >
          {message ? <Send className="w-5 h-5 ml-1" /> : <Mic className="w-5 h-5" />}
        </button>
      </div>

      {/* Home Indicator */}
      <div className="h-4 bg-white/10 flex items-center justify-center pb-1">
          <div className="w-32 h-1 bg-black/20 rounded-full" />
      </div>
    </div>
  );
};

export default WhatsAppChatPreview;
