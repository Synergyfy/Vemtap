import React from 'react';
import { Wifi, ShieldCheck, Lock, Copy, CheckCircle2, Signal, Radio, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface WifiProfilePreviewProps {
  ssid?: string;
  password?: string;
  encryption?: string;
}

const WifiProfilePreview: React.FC<WifiProfilePreviewProps> = ({ 
  ssid = "Guest Network",
  password = "",
  encryption = "WPA"
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans bg-[#F8FAFF] overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/10 rounded-full blur-[60px] pointer-events-none" />
      
      <div className="flex-1 overflow-y-auto scrollbar-hide py-8 px-6 flex flex-col items-center z-10">
        
        {/* Compact Animated Wifi Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-60 animate-pulse" />
          <div className="w-20 h-20 bg-white border border-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center relative shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)]">
             <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/50 to-transparent" />
             </div>
             <Wifi className="w-10 h-10 relative z-10" />
             
             {/* Micro-animation rings */}
             <div className="absolute -inset-2 border border-blue-200/50 rounded-[40px] animate-[ping_3s_linear_infinite]" />
             <div className="absolute -inset-4 border border-blue-100/30 rounded-[48px] animate-[ping_4s_linear_infinite]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <Lock size={14} fill="currentColor" />
          </div>
        </div>

        <div className="text-center space-y-2 mb-8 px-2">
           <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-1">
              <Signal size={10} className="text-blue-500" />
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Secure Hotspot Access</span>
           </div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
             Instant Connect
           </h1>
           <p className="text-[11px] font-medium text-slate-500 max-w-[220px] mx-auto leading-relaxed">
             Join the wireless network by using the credentials verified below.
           </p>
        </div>

        {/* network Card - Clean Light Mode */}
        <div className="w-full bg-white p-6 rounded-[32px] border border-blue-100/50 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.08)] relative group mb-8">
           <div className="space-y-6">
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Network Name (SSID)</p>
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 w-full justify-center">
                    <Radio size={14} className="text-blue-500 shrink-0" />
                    <span className="text-base font-black text-slate-900 truncate">{ssid}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-50">
                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Encryption Mode</p>
                    <div className="w-full px-4 py-3 bg-slate-50/50 rounded-2xl flex items-center gap-3 border border-slate-100">
                       <ShieldCheck className="w-4 h-4 text-blue-500" />
                       <span className="text-[11px] font-bold text-slate-600">
                         {encryption === 'nopass' ? 'Open Network' : encryption === 'WEP' ? 'Legacy WEP' : 'WPA/WPA2 Personal'}
                       </span>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] pl-1">Network Password</p>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setShowPassword(!showPassword)}
                         className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 font-mono text-xs font-bold text-slate-900 overflow-hidden active:scale-[0.98] transition-all"
                       >
                          <span className="truncate">{showPassword ? password : '••••••••••••'}</span>
                          <span className="text-[8px] text-blue-600 uppercase font-black shrink-0">{showPassword ? 'Hide' : 'Show'}</span>
                       </button>
                       <button 
                         onClick={handleCopy}
                         className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border mb-0 ${copied ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-blue-100 text-blue-600 shadow-sm hover:bg-blue-50'}`}
                       >
                          {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="w-full px-4 mb-4">
           <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="w-8 h-8 bg-white text-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                 <CheckCircle2 size={16} />
              </div>
              <p className="text-[10px] font-bold text-emerald-700 leading-snug">
                Network credentials verified. Scan with your camera to join automatically.
              </p>
           </div>
        </div>
      </div>
      
      {/* Premium Light Footer */}
      <div className="p-6 bg-white border-t border-blue-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
         <div className="flex items-center justify-between">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Created via</span>
               <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                     <Wifi size={10} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-900 tracking-tight">QR Thrive</span>
               </div>
            </div>
            
            <button className="h-10 px-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
               Learn More
               <ArrowRight size={12} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default WifiProfilePreview;

