'use client';

import { useCallback, useState } from 'react';
import { Phone, MessageCircle, Share2, Bookmark, BookmarkCheck, Flag } from 'lucide-react';
import BottomSheet from './BottomSheet';

const SAVED_KEY = 'vemtap_saved_businesses';

interface SavedBusiness {
  code: string;
  name: string;
  logoUrl?: string;
  savedAt: number;
}

function loadSaved(): SavedBusiness[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface QuickActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  businessCode: string;
  businessName: string;
  businessLogo?: string;
  phone?: string | null;
  whatsapp?: string | null;
  onShare: () => void;
}

export default function QuickActionsSheet({
  isOpen,
  onClose,
  businessCode,
  businessName,
  businessLogo,
  phone,
  whatsapp,
  onShare,
}: QuickActionsSheetProps) {
  const [saved, setSaved] = useState(() =>
    loadSaved().some((b) => b.code === businessCode)
  );
  const [reported, setReported] = useState(false);

  const toggleSave = useCallback(() => {
    const list = loadSaved();
    if (list.some((b) => b.code === businessCode)) {
      localStorage.setItem(
        SAVED_KEY,
        JSON.stringify(list.filter((b) => b.code !== businessCode))
      );
      setSaved(false);
    } else {
      list.push({ code: businessCode, name: businessName, logoUrl: businessLogo, savedAt: Date.now() });
      localStorage.setItem(SAVED_KEY, JSON.stringify(list));
      setSaved(true);
    }
  }, [businessCode, businessName, businessLogo]);

  const whatsappDigits = (whatsapp || phone || '').replace(/[^0-9]/g, '');

  const rows = [
    ...(phone
      ? [{
          key: 'call',
          icon: Phone,
          label: 'Call',
          sub: phone,
          href: `tel:${phone}`,
          external: false,
        }]
      : []),
    ...(whatsappDigits
      ? [{
          key: 'whatsapp',
          icon: MessageCircle,
          label: 'WhatsApp',
          sub: 'Chat with this business',
          href: `https://wa.me/${whatsappDigits}`,
          external: true,
        }]
      : []),
    {
      key: 'share',
      icon: Share2,
      label: 'Share Business',
      sub: 'Send to friends and family',
      action: () => {
        onClose();
        onShare();
      },
      external: false,
    },
    {
      key: 'save',
      icon: saved ? BookmarkCheck : Bookmark,
      label: saved ? 'Saved' : 'Save Business',
      sub: saved ? 'In your saved businesses' : 'Find it again easily',
      action: toggleSave,
      external: false,
      active: saved,
    },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={businessName}>
      <div className="space-y-1">
        {rows.map((row) => {
          const Icon = row.icon;
          const isActive = 'active' in row && row.active;
          const content = (
            <>
              <div
                className={`size-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-[#066CF4] text-white'
                    : 'bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-[#066CF4]'
                }`}
              >
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-slate-900">{row.label}</p>
                {row.sub && <p className="text-xs text-slate-400 truncate">{row.sub}</p>}
              </div>
            </>
          );
          const cls =
            'w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition-all group cursor-pointer';
          return 'href' in row && row.href ? (
            <a
              key={row.key}
              href={row.href}
              {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={cls}
            >
              {content}
            </a>
          ) : (
            <button
              key={row.key}
              onClick={'action' in row ? row.action : undefined}
              className={cls}
            >
              {content}
            </button>
          );
        })}

        <button
          onClick={() => setReported(true)}
          disabled={reported}
          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-red-50/50 active:scale-[0.99] transition-all group cursor-pointer disabled:opacity-60"
        >
          <div className="size-11 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
            <Flag size={18} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-slate-700">
              {reported ? 'Report received' : 'Report Issue'}
            </p>
            <p className="text-xs text-slate-400">
              {reported ? 'Thanks — our team will review this business' : 'Wrong info, spam or abuse'}
            </p>
          </div>
        </button>
      </div>
    </BottomSheet>
  );
}
