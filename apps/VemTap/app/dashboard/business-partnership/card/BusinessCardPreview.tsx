'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { MapPin, Phone, Mail, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface BusinessInfo {
    name: string;
    category: string;
    location: string;
    phone: string;
    email: string;
    website: string;
    partner: string;
    role: string;
    tagline: string;
    logo: string;
    referralCode: string;
    qrValue: string;
}

export const cardLayouts = [
    { id: 'split-right', label: 'Split Right', desc: '3/4 white + colored right strip' },
    { id: 'split-left', label: 'Split Left', desc: 'Colored left strip + 3/4 white' },
    { id: 'split-bottom', label: 'Split Bottom', desc: 'White with colored bottom bar' },
    { id: 'split-top', label: 'Split Top', desc: 'Colored top bar + white body' },
    { id: 'full', label: 'Full Color', desc: 'Single color all over' },
    { id: 'border', label: 'Bordered', desc: 'White with thick colored border' },
    { id: 'diagonal', label: 'Diagonal', desc: 'Diagonal color split' },
    { id: 'double-stripe', label: 'Double Stripe', desc: 'Two thin accent stripes' },
] as const;

export type CardLayoutId = typeof cardLayouts[number]['id'];

interface CardProps {
    accentColor: string;
    textDark?: string;
    layout: CardLayoutId;
    business: BusinessInfo;
    flipped?: boolean;
    onFlip?: () => void;
    size?: 'md' | 'lg';
}

const sizeMap = {
    md: { w: 'w-full max-w-[300px] md:max-w-[340px]', aspect: 'aspect-[1.586/1]', logo: 'size-14 md:size-16', logoInner: 36, qr: 40, name: 'text-sm md:text-base', text: 'text-[9px] md:text-[10px]', textMd: 'text-[10px] md:text-xs' },
    lg: { w: 'w-full max-w-[420px]', aspect: 'aspect-[1.586/1]', logo: 'size-20', logoInner: 52, qr: 52, name: 'text-lg md:text-xl', text: 'text-xs', textMd: 'text-sm' },
};

const isDark = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
};

/* ─── FRONT FACE: all business info + QR ─── */
const FrontSplitRight = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex rounded-[inherit] overflow-hidden">
        <div className="flex-[3] bg-white flex flex-col justify-center px-4 md:px-5 py-3 gap-1.5">
            <p className="text-xs md:text-sm font-semibold text-gray-900" style={textDark ? { color: textDark } : undefined}>{business.name}</p>
            <p className="text-[9px] md:text-[11px] text-gray-400" style={textDark ? { color: textDark, opacity: 0.65 } : undefined}>{business.role} · {business.category}</p>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><MapPin size={10} className="shrink-0" />{business.location}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Phone size={10} className="shrink-0" />{business.phone}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500 truncate" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Mail size={10} className="shrink-0" />{business.email}</div>
            <p className="text-[8px] md:text-[10px] text-gray-400 truncate" style={textDark ? { color: textDark, opacity: 0.5 } : undefined}>{business.website}</p>
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: accent }}>
            <div className="size-14 md:size-16 bg-white rounded-xl p-1.5 flex items-center justify-center">
                <QRCodeSVG value={business.qrValue} size={44} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    </div>
);

const FrontSplitLeft = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex rounded-[inherit] overflow-hidden">
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: accent }}>
            <div className="size-14 md:size-16 bg-white rounded-xl p-1.5 flex items-center justify-center">
                <QRCodeSVG value={business.qrValue} size={44} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
        <div className="flex-[3] bg-white flex flex-col justify-center px-4 md:px-5 py-3 gap-1.5">
            <p className="text-xs md:text-sm font-semibold text-gray-900" style={textDark ? { color: textDark } : undefined}>{business.name}</p>
            <p className="text-[9px] md:text-[11px] text-gray-400" style={textDark ? { color: textDark, opacity: 0.65 } : undefined}>{business.role} · {business.category}</p>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><MapPin size={10} className="shrink-0" />{business.location}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Phone size={10} className="shrink-0" />{business.phone}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500 truncate" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Mail size={10} className="shrink-0" />{business.email}</div>
            <p className="text-[8px] md:text-[10px] text-gray-400 truncate" style={textDark ? { color: textDark, opacity: 0.5 } : undefined}>{business.website}</p>
        </div>
    </div>
);

const FrontSplitBottom = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex flex-col rounded-[inherit] overflow-hidden">
        <div className="flex-[3] bg-white flex flex-col justify-center px-4 md:px-5 py-3 gap-1.5">
            <p className="text-xs md:text-sm font-semibold text-gray-900" style={textDark ? { color: textDark } : undefined}>{business.name}</p>
            <p className="text-[9px] md:text-[11px] text-gray-400" style={textDark ? { color: textDark, opacity: 0.65 } : undefined}>{business.role} · {business.category}</p>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><MapPin size={10} className="shrink-0" />{business.location}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Phone size={10} className="shrink-0" />{business.phone}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500 truncate" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Mail size={10} className="shrink-0" />{business.email}</div>
            <p className="text-[8px] md:text-[10px] text-gray-400 truncate" style={textDark ? { color: textDark, opacity: 0.5 } : undefined}>{business.website}</p>
            <div className="flex justify-center mt-1">
                <div className="size-11 md:size-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center">
                    <QRCodeSVG value={business.qrValue} size={36} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </div>
        <div className="flex-1" style={{ backgroundColor: accent }} />
    </div>
);

const FrontSplitTop = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex flex-col rounded-[inherit] overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: accent }} />
        <div className="flex-[3] bg-white flex flex-col justify-center px-4 md:px-5 py-3 gap-1.5">
            <p className="text-xs md:text-sm font-semibold text-gray-900" style={textDark ? { color: textDark } : undefined}>{business.name}</p>
            <p className="text-[9px] md:text-[11px] text-gray-400" style={textDark ? { color: textDark, opacity: 0.65 } : undefined}>{business.role} · {business.category}</p>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><MapPin size={10} className="shrink-0" />{business.location}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Phone size={10} className="shrink-0" />{business.phone}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500 truncate" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Mail size={10} className="shrink-0" />{business.email}</div>
            <p className="text-[8px] md:text-[10px] text-gray-400 truncate" style={textDark ? { color: textDark, opacity: 0.5 } : undefined}>{business.website}</p>
            <div className="flex justify-center mt-1">
                <div className="size-11 md:size-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center">
                    <QRCodeSVG value={business.qrValue} size={36} style={{ width: '100%', height: '100%' }} />
                </div>
            </div>
        </div>
    </div>
);

const FrontFull = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => {
    const d = isDark(accent);
    const fallback = d ? '#FFFFFF' : '#111827';
    const tc = textDark || fallback;
    const muted = textDark ? { color: textDark, opacity: 0.5 } : { color: d ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' };
    return (
        <div className="h-full w-full flex flex-col justify-center px-5 gap-2 rounded-[inherit]" style={{ backgroundColor: accent }}>
            <p className="text-xs md:text-sm font-semibold" style={{ color: tc }}>{business.name}</p>
            <p className="text-[9px] md:text-[11px]" style={muted}>{business.role} · {business.category}</p>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px]" style={muted}><MapPin size={10} className="shrink-0" />{business.location}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px]" style={muted}><Phone size={10} className="shrink-0" />{business.phone}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] truncate" style={muted}><Mail size={10} className="shrink-0" />{business.email}</div>
            <p className="text-[8px] md:text-[10px] truncate" style={muted}>{business.website}</p>
            <div className="flex justify-center mt-1">
                <div className="size-11 md:size-12 bg-white rounded-lg p-1 flex items-center justify-center"><QRCodeSVG value={business.qrValue} size={36} style={{ width: '100%', height: '100%' }} /></div>
            </div>
        </div>
    );
};

const FrontBorder = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full bg-white flex flex-col justify-center px-5 gap-1.5 rounded-[inherit]" style={{ border: `3px solid ${accent}` }}>
        <p className="text-xs md:text-sm font-semibold text-gray-900" style={textDark ? { color: textDark } : undefined}>{business.name}</p>
        <p className="text-[9px] md:text-[11px] text-gray-400" style={textDark ? { color: textDark, opacity: 0.65 } : undefined}>{business.role} · {business.category}</p>
        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><MapPin size={10} className="shrink-0" />{business.location}</div>
        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Phone size={10} className="shrink-0" />{business.phone}</div>
        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500 truncate" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Mail size={10} className="shrink-0" />{business.email}</div>
        <p className="text-[8px] md:text-[10px] text-gray-400 truncate" style={textDark ? { color: textDark, opacity: 0.5 } : undefined}>{business.website}</p>
        <div className="flex justify-center mt-1">
            <div className="size-11 md:size-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center"><QRCodeSVG value={business.qrValue} size={36} style={{ width: '100%', height: '100%' }} /></div>
        </div>
    </div>
);

const FrontDiagonal = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => {
    const fallback = isDark(accent) ? '#FFFFFF' : '#111827';
    const tc = textDark || fallback;
    return (
    <div className="h-full w-full relative overflow-hidden bg-white rounded-[inherit]">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent} 65%, transparent 65.5%)` }} />
        <div className="relative z-10 h-full flex flex-col justify-center px-5 gap-1.5">
            <p className="text-xs md:text-sm font-semibold" style={{ color: tc }}>{business.name}</p>
            <p className="text-[9px] md:text-[11px]" style={{ color: tc, opacity: 0.7 }}>{business.role} · {business.category}</p>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px]" style={{ color: tc, opacity: 0.6 }}><MapPin size={10} className="shrink-0" />{business.location}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px]" style={{ color: tc, opacity: 0.6 }}><Phone size={10} className="shrink-0" />{business.phone}</div>
            <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] truncate" style={{ color: tc, opacity: 0.6 }}><Mail size={10} className="shrink-0" />{business.email}</div>
            <p className="text-[8px] md:text-[10px] truncate" style={{ color: tc, opacity: 0.5 }}>{business.website}</p>
            <div className="flex justify-center mt-1">
                <div className="size-11 md:size-12 bg-white/90 rounded-lg p-1 flex items-center justify-center"><QRCodeSVG value={business.qrValue} size={36} style={{ width: '100%', height: '100%' }} /></div>
            </div>
        </div>
    </div>
);};

const FrontDoubleStripe = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full bg-white flex flex-col justify-center px-5 gap-1.5 relative rounded-[inherit]">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
        <p className="text-xs md:text-sm font-semibold text-gray-900" style={textDark ? { color: textDark } : undefined}>{business.name}</p>
        <p className="text-[9px] md:text-[11px] text-gray-400" style={textDark ? { color: textDark, opacity: 0.65 } : undefined}>{business.role} · {business.category}</p>
        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><MapPin size={10} className="shrink-0" />{business.location}</div>
        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Phone size={10} className="shrink-0" />{business.phone}</div>
        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] text-gray-500 truncate" style={textDark ? { color: textDark, opacity: 0.6 } : undefined}><Mail size={10} className="shrink-0" />{business.email}</div>
        <p className="text-[8px] md:text-[10px] text-gray-400 truncate" style={textDark ? { color: textDark, opacity: 0.5 } : undefined}>{business.website}</p>
        <div className="flex justify-center mt-1">
            <div className="size-11 md:size-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center"><QRCodeSVG value={business.qrValue} size={36} style={{ width: '100%', height: '100%' }} /></div>
        </div>
    </div>
);

/* ─── BACK FACE: only logo + business name ─── */
const BackSplitRight = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex rounded-[inherit] overflow-hidden">
        <div className="flex-[3] bg-white flex flex-col items-center justify-center gap-3 p-4">
            <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${accent}15` }}>
                <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-gray-900 text-center" style={textDark ? { color: textDark } : undefined}>{business.name}</h3>
        </div>
        <div className="flex-1" style={{ backgroundColor: accent }} />
    </div>
);

const BackSplitLeft = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex rounded-[inherit] overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: accent }} />
        <div className="flex-[3] bg-white flex flex-col items-center justify-center gap-3 p-4">
            <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${accent}15` }}>
                <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-gray-900 text-center" style={textDark ? { color: textDark } : undefined}>{business.name}</h3>
        </div>
    </div>
);

const BackSplitBottom = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex flex-col rounded-[inherit] overflow-hidden">
        <div className="flex-[3] bg-white flex flex-col items-center justify-center gap-3 p-4">
            <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${accent}15` }}>
                <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-gray-900 text-center" style={textDark ? { color: textDark } : undefined}>{business.name}</h3>
        </div>
        <div className="flex-1" style={{ backgroundColor: accent }} />
    </div>
);

const BackSplitTop = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full flex flex-col rounded-[inherit] overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: accent }} />
        <div className="flex-[3] bg-white flex flex-col items-center justify-center gap-3 p-4">
            <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${accent}15` }}>
                <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-gray-900 text-center" style={textDark ? { color: textDark } : undefined}>{business.name}</h3>
        </div>
    </div>
);

const BackFull = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => {
    const d = isDark(accent);
    const fallback = d ? '#FFFFFF' : '#111827';
    const tc = textDark || fallback;
    return (
        <div className="h-full w-full flex flex-col items-center justify-center gap-3 p-4 rounded-[inherit]" style={{ backgroundColor: accent }}>
            <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: d ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}>
                <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-center" style={{ color: tc }}>{business.name}</h3>
        </div>
    );
};

const BackBorder = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center gap-3 p-4 rounded-[inherit]" style={{ border: `3px solid ${accent}` }}>
        <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${accent}15` }}>
            <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
        </div>
        <h3 className="text-sm md:text-base font-bold text-gray-900 text-center" style={textDark ? { color: textDark } : undefined}>{business.name}</h3>
    </div>
);

const BackDiagonal = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => {
    const fallback = isDark(accent) ? '#FFFFFF' : '#111827';
    const tc = textDark || fallback;
    return (
    <div className="h-full w-full relative overflow-hidden bg-white rounded-[inherit]">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent} 65%, transparent 65.5%)` }} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 p-4">
            <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm bg-white/90">
                <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
            </div>
            <h3 className="text-sm md:text-base font-bold text-center" style={{ color: tc }}>{business.name}</h3>
        </div>
    </div>
);};

const BackDoubleStripe = ({ accent, business, textDark }: { accent: string; business: BusinessInfo; textDark?: string }) => (
    <div className="h-full w-full bg-white flex flex-col items-center justify-center gap-3 p-4 relative rounded-[inherit]">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
        <div className="size-16 md:size-20 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${accent}15` }}>
            <Image src={business.logo} alt="" width={48} height={48} className="size-10 md:size-12 object-contain" />
        </div>
        <h3 className="text-sm md:text-base font-bold text-gray-900 text-center" style={textDark ? { color: textDark } : undefined}>{business.name}</h3>
    </div>
);

/* ─── Component maps ─── */
export const faceComponents = {
    front: {
        'split-right': FrontSplitRight,
        'split-left': FrontSplitLeft,
        'split-bottom': FrontSplitBottom,
        'split-top': FrontSplitTop,
        'full': FrontFull,
        'border': FrontBorder,
        'diagonal': FrontDiagonal,
        'double-stripe': FrontDoubleStripe,
    } as Record<CardLayoutId, React.FC<{ accent: string; business: BusinessInfo; textDark?: string }>>,
    back: {
        'split-right': BackSplitRight,
        'split-left': BackSplitLeft,
        'split-bottom': BackSplitBottom,
        'split-top': BackSplitTop,
        'full': BackFull,
        'border': BackBorder,
        'diagonal': BackDiagonal,
        'double-stripe': BackDoubleStripe,
    } as Record<CardLayoutId, React.FC<{ accent: string; business: BusinessInfo; textDark?: string }>>,
};

export const CardFlip = ({ accentColor, textDark, layout, business, flipped, onFlip, size = 'md' }: CardProps) => {
    const s = sizeMap[size];
    const FrontComp = faceComponents.front[layout];
    const BackComp = faceComponents.back[layout];

    return (
        <div
            className={cn(s.w, 'select-none')}
            style={{ perspective: '1000px', cursor: 'pointer' }}
            onClick={onFlip}
        >
            <div
                className={cn('relative w-full rounded-2xl md:rounded-[20px] shadow-lg md:shadow-xl overflow-hidden', s.aspect)}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <motion.div
                    className="absolute inset-0 rounded-[inherit]"
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <FrontComp accent={accentColor} textDark={textDark} business={business} />
                </motion.div>
                <motion.div
                    className="absolute inset-0 rounded-[inherit]"
                    animate={{ rotateY: flipped ? 0 : 180 }}
                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <BackComp accent={accentColor} textDark={textDark} business={business} />
                </motion.div>
            </div>
        </div>
    );
};

/* ─── Mini layout preview ─── */
export const MiniLayoutPreview = ({ layout, accent }: { layout: CardLayoutId; accent: string }) => {
    const s = 'w-10 h-[26px]';
    switch (layout) {
        case 'split-right':
            return <div className={cn(s, 'rounded flex overflow-hidden shrink-0')}><div className="flex-[3] bg-white border-r border-gray-100" /><div className="flex-1" style={{ backgroundColor: accent }} /></div>;
        case 'split-left':
            return <div className={cn(s, 'rounded flex overflow-hidden shrink-0')}><div className="flex-1" style={{ backgroundColor: accent }} /><div className="flex-[3] bg-white border-l border-gray-100" /></div>;
        case 'split-bottom':
            return <div className={cn(s, 'rounded flex flex-col overflow-hidden shrink-0')}><div className="flex-[3] bg-white border-b border-gray-100" /><div className="flex-1" style={{ backgroundColor: accent }} /></div>;
        case 'split-top':
            return <div className={cn(s, 'rounded flex flex-col overflow-hidden shrink-0')}><div className="flex-1" style={{ backgroundColor: accent }} /><div className="flex-[3] bg-white border-t border-gray-100" /></div>;
        case 'full':
            return <div className={cn(s, 'rounded overflow-hidden shrink-0')} style={{ backgroundColor: accent }} />;
        case 'border':
            return <div className={cn(s, 'rounded overflow-hidden shrink-0 bg-white')} style={{ border: `2px solid ${accent}` }} />;
        case 'diagonal':
            return <div className={cn(s, 'rounded overflow-hidden shrink-0')} style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent} 35%, #f3f4f6 35.5%)` }} />;
        case 'double-stripe':
            return <div className={cn(s, 'rounded overflow-hidden shrink-0 bg-white relative')}><div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: accent }} /><div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accent }} /></div>;
        default:
            return <div className={cn(s, 'rounded overflow-hidden shrink-0')} style={{ backgroundColor: accent }} />;
    }
};

/* ─── Modal ─── */
interface CardDesignPreviewProps {
    accentColor: string;
    textDark?: string;
    layout: CardLayoutId;
    business: BusinessInfo;
    onClose: () => void;
    footer?: React.ReactNode;
}

export const CardDesignPreview = ({ accentColor, textDark, layout, business, onClose, footer }: CardDesignPreviewProps) => {
    const [flipped, setFlipped] = React.useState(false);
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Business Card</h3>
                            <p className="text-xs text-gray-500">Tap card to flip</p>
                        </div>
                        <button onClick={onClose} className="size-10 rounded-xl bg-gray-50 flex items-center justify-center hover:bg-gray-100"><X size={16} className="text-gray-500" /></button>
                    </div>
                    <div className="p-6 flex justify-center">
                        <CardFlip accentColor={accentColor} textDark={textDark} layout={layout} business={business} flipped={flipped} onFlip={() => setFlipped(!flipped)} size="lg" />
                    </div>
                    {footer && <div className="p-4 border-t border-gray-100">{footer}</div>}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
