'use client';

import { useState } from 'react';
import { MessageCircle, Link2, Check, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import BottomSheet from './BottomSheet';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  businessLogo?: string;
  pageUrl: string;
}

export default function ShareSheet({ isOpen, onClose, businessName, businessLogo, pageUrl }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, url: pageUrl });
      } catch {
        /* dismissed */
      }
    } else {
      handleCopy();
    }
  };

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Check out ${businessName} on VemTap: ${pageUrl}`)}`;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share this business">
      <div className="flex flex-col items-center text-center">
        {/* Business row */}
        <div className="flex items-center gap-3 mb-5">
          <div className="size-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
            {businessLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={businessLogo} alt={businessName} className="w-full h-full object-contain p-1.5" />
            ) : (
              <span className="text-xl font-black text-[#066CF4]">
                {businessName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-900 text-left">{businessName}</p>
        </div>

        {/* QR code */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-2">
          <QRCodeSVG value={pageUrl} size={160} level="M" />
        </div>
        <p className="text-[11px] text-slate-400 font-medium mb-5">
          Scan to open this storefront
        </p>

        {/* Share options */}
        <div className="w-full grid grid-cols-3 gap-3">
          <a
            href={whatsappShare}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 active:scale-95 transition-all group"
          >
            <MessageCircle size={24} className="text-slate-500 group-hover:text-emerald-600" />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900">WhatsApp</span>
          </a>
          <button
            onClick={handleCopy}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 active:scale-95 transition-all group cursor-pointer"
          >
            {copied ? (
              <Check size={24} className="text-emerald-600" />
            ) : (
              <Link2 size={24} className="text-slate-500 group-hover:text-[#066CF4]" />
            )}
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900">
              {copied ? 'Copied!' : 'Copy Link'}
            </span>
          </button>
          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 active:scale-95 transition-all group cursor-pointer"
          >
            <Share2 size={24} className="text-slate-500 group-hover:text-[#066CF4]" />
            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900">More</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
