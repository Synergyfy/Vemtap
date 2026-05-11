'use client';

import React, { useState } from 'react';
import { 
    Palette, 
    Frame as FrameIcon, 
    Image as ImageIcon, 
    Check, 
    X, 
    Layout, 
    Square, 
    Circle, 
    RefreshCw, 
    Upload, 
    Loader2,
    Type as TypeIcon,
    Sliders
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QrThriveDesign, QrThriveFrame, DEFAULT_QR_DESIGN, DEFAULT_QR_FRAME } from '@/services/qr-thrive/types';

interface DesignPanelProps {
  design: QrThriveDesign;
  frame: QrThriveFrame;
  onDesignChange: (design: Partial<QrThriveDesign>) => void;
  onFrameChange: (frame: Partial<QrThriveFrame>) => void;
  onLogoUpload: (logo: string | undefined) => void;
  logo?: string;
  activeTab: 'shape' | 'frame' | 'logo';
}

const DOT_STYLES = [
  { id: 'square', label: 'Classic' },
  { id: 'dots', label: 'Dots' },
  { id: 'rounded', label: 'Soft' },
  { id: 'extra-rounded', label: 'Curve' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Modern' },
];

const CORNER_SQUARE_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'dot', label: 'Circle' },
  { id: 'extra-rounded', label: 'Rounded' },
];

const CORNER_DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'dot', label: 'Circle' },
];

const FRAME_STYLES = [
    { id: 'none', label: 'Plain' },
    { id: 'simple', label: 'Simple' },
    { id: 'text-below', label: 'Text' },
    { id: 'bubble', label: 'Bubble' },
    { id: 'ribbon', label: 'Ribbon' },
    { id: 'phone', label: 'Phone' },
    { id: 'circular', label: 'Circular' },
    { id: 'tag', label: 'Tag' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'bracket', label: 'Bracket' },
    { id: 'rounded-thick', label: 'Bold' },
    { id: 'shadow', label: 'Glow' },
];

const PRESET_LOGOS = [
    { name: 'PayPal', url: 'https://cdn-icons-png.flaticon.com/512/174/174861.png' },
    { name: 'Instagram', url: 'https://cdn-icons-png.flaticon.com/512/174/174855.png' },
    { name: 'Facebook', url: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' },
    { name: 'LinkedIn', url: 'https://cdn-icons-png.flaticon.com/512/174/174857.png' },
    { name: 'Twitter', url: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' },
    { name: 'WhatsApp', url: 'https://cdn-icons-png.flaticon.com/512/733/733585.png' },
    { name: 'YouTube', url: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
    { name: 'TikTok', url: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png' },
    { name: 'Apple', url: 'https://cdn-icons-png.flaticon.com/512/882/882704.png' },
    { name: 'Shopify', url: 'https://cdn-icons-png.flaticon.com/512/825/825508.png' },
];

// --- Preview Components ---

const DotPreview = ({ type, active }: { type: string; active: boolean }) => {
    const color = active ? '#ffffff' : '#1e293b';
    const viewBox = "0 0 24 24";
    
    switch (type) {
      case 'dots':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <circle cx="6" cy="6" r="2.5" fill={color} />
            <circle cx="18" cy="6" r="2.5" fill={color} />
            <circle cx="6" cy="18" r="2.5" fill={color} />
            <circle cx="18" cy="18" r="2.5" fill={color} />
          </svg>
        );
      case 'rounded':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="3.5" y="3.5" width="6" height="6" rx="2" fill={color} />
            <rect x="14.5" y="3.5" width="6" height="6" rx="2" fill={color} />
            <rect x="3.5" y="14.5" width="6" height="6" rx="2" fill={color} />
            <rect x="14.5" y="14.5" width="6" height="6" rx="2" fill={color} />
          </svg>
        );
      case 'extra-rounded':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="3.5" y="3.5" width="6" height="6" rx="3" fill={color} />
            <rect x="14.5" y="3.5" width="6" height="6" rx="3" fill={color} />
            <rect x="3.5" y="14.5" width="6" height="6" rx="3" fill={color} />
            <rect x="14.5" y="14.5" width="6" height="6" rx="3" fill={color} />
          </svg>
        );
      case 'classy':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <path d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4z" fill={color} />
            <circle cx="18" cy="18" r="3" fill={color} />
          </svg>
        );
      case 'classy-rounded':
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="4" y="4" width="6" height="6" rx="3" fill={color} />
            <path d="M16 4h4a0 0 0 0 1 0 0v4a0 0 0 0 1 0 0h-4a3 3 0 0 1-3-3v0a3 3 0 0 1 3-3z" fill={color} transform="rotate(90 18 6)" />
            <circle cx="6" cy="18" r="3" fill={color} />
            <rect x="15" y="15" width="6" height="6" rx="2" fill={color} />
          </svg>
        );
      default:
        return (
          <svg viewBox={viewBox} className="w-8 h-8">
            <rect x="4" y="4" width="6" height="6" fill={color} />
            <rect x="14" y="4" width="6" height="6" fill={color} />
            <rect x="4" y="14" width="6" height="6" fill={color} />
            <rect x="14" y="14" width="6" height="6" fill={color} />
          </svg>
        );
    }
};

const EyeOuterPreview = ({ type, active }: { type: string; active: boolean }) => {
    const color = active ? '#ffffff' : '#1e293b';
    switch (type) {
      case 'dot':
        return <div className="w-6 h-6 rounded-full border-[3px]" style={{ borderColor: color }} />;
      case 'extra-rounded':
        return <div className="w-6 h-6 rounded-lg border-[3px]" style={{ borderColor: color }} />;
      default:
        return <div className="w-6 h-6 border-[3px]" style={{ borderColor: color }} />;
    }
};

const EyeInnerPreview = ({ type, active }: { type: string; active: boolean }) => {
    const color = active ? '#ffffff' : '#1e293b';
    switch (type) {
      case 'dot':
        return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />;
      default:
        return <div className="w-4 h-4" style={{ backgroundColor: color }} />;
    }
};

const FramePreviewIcon = ({ type, active }: { type: string; active: boolean }) => {
    const borderColor = active ? '#ffffff' : '#94a3b8';
    
    switch (type) {
        case 'none': return <div className="h-6 w-6 border-2 border-dashed border-gray-400 flex items-center justify-center rounded-sm"><X className="w-3 h-3 text-gray-400" /></div>;
        case 'simple': return <div className="h-6 w-6 border-2 rounded-sm" style={{ borderColor }} />;
        case 'bubble': return <div className="h-6 w-6 border-[3px] rounded-full" style={{ borderColor }} />;
        case 'rounded-thick': return <div className="h-6 w-6 border-[4px] rounded-md" style={{ borderColor }} />;
        case 'shadow': return <div className="h-6 w-6 border-2 rounded-lg shadow-sm" style={{ borderColor, boxShadow: `0 4px 6px ${borderColor}44` }} />;
        case 'bracket': return <div className="h-6 w-6 border-x-2 border-y-[1px] rounded-sm" style={{ borderColor }} />;
        case 'ribbon': return <div className="h-6 w-6 border-t-2 border-x-2 rounded-sm relative"><div className="absolute bottom-0 left-[-2px] right-[-2px] h-2 bg-current" style={{ color: borderColor }} /></div>;
        case 'text-below': return <div className="h-6 w-6 flex flex-col items-center justify-between"><div className="h-4 w-6 border-2 rounded-sm" style={{ borderColor }} /><div className="h-1 w-4 bg-current rounded-full" style={{ color: borderColor }} /></div>;
        case 'phone': return <div className="h-8 w-5 border-2 rounded-lg relative flex flex-col items-center" style={{ borderColor }}><div className="h-0.5 w-2 bg-current mt-1 rounded-full" style={{ color: borderColor }} /><div className="mt-1 h-3 w-3 border-[1px] rounded-sm" style={{ borderColor }} /><div className="absolute bottom-0.5 h-1 w-1 bg-current rounded-full" style={{ color: borderColor }} /></div>;
        case 'circular': return <div className="h-8 w-8 border-2 rounded-full flex items-center justify-center p-1" style={{ borderColor }}><div className="h-full w-full border-[1px] rounded-full" style={{ borderColor }} /></div>;
        case 'tag': return <div className="h-8 w-6 border-2 rounded-md flex flex-col pt-1" style={{ borderColor }}><div className="h-0.5 w-1 bg-current self-center rounded-full" style={{ color: borderColor }} /><div className="mx-0.5 mb-0.5 flex-1 border-[1px]" style={{ borderColor }} /></div>;
        case 'minimal': return <div className="h-6 w-6 flex flex-col"><div className="h-1 w-full bg-current rounded-full mb-1" style={{ color: borderColor }} /><div className="flex-1 border-2" style={{ borderColor }} /></div>;
        default: return <div className="h-6 w-6 border-2 rounded-sm" style={{ borderColor }} />;
    }
};

// --- Main Component ---

export const DesignPanel: React.FC<DesignPanelProps> = ({ 
  design, frame, onDesignChange, onFrameChange, onLogoUpload, logo, activeTab 
}) => {
    const [uploading, setUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            const reader = new FileReader();
            reader.onload = (ev) => {
                onLogoUpload(ev.target?.result as string);
                setUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-full overflow-hidden">
            {activeTab === 'shape' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    {/* Patterns & Colors */}
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-blue-600" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Dot Patterns & Base Colors</p>
                            </div>
                            <button 
                                onClick={() => onDesignChange(DEFAULT_QR_DESIGN)}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3 h-3" /> Reset
                            </button>
                        </div>

                        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-2 px-2">
                            {DOT_STYLES.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => onDesignChange({ dots: { ...design.dots, type: t.id } })}
                                    className={cn(
                                        "flex-shrink-0 w-24 h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm",
                                        design.dots.type === t.id
                                            ? 'border-blue-600 bg-blue-50/50'
                                            : 'border-slate-50 bg-white hover:border-blue-100'
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                        design.dots.type === t.id ? 'bg-blue-600 shadow-lg shadow-blue-200 text-white' : 'bg-slate-50'
                                    )}>
                                        <DotPreview type={t.id} active={design.dots.type === t.id} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        design.dots.type === t.id ? 'text-blue-600' : 'text-gray-400'
                                    )}>
                                        {t.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pattern Color</label>
                                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:border-blue-600">
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                        <input
                                            type="color"
                                            value={design.dots.color}
                                            onChange={(e) => onDesignChange({ dots: { ...design.dots, color: e.target.value } })}
                                            className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={design.dots.color.toUpperCase()}
                                        onChange={(e) => onDesignChange({ dots: { ...design.dots, color: e.target.value } })}
                                        className="w-full text-sm font-semibold text-slate-900 outline-none uppercase tracking-wider"
                                    />
                                    <Palette className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1">Background Color</label>
                                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:border-blue-600">
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                        <input
                                            type="color"
                                            value={design.background.color}
                                            onChange={(e) => onDesignChange({ background: { ...design.background, color: e.target.value } })}
                                            className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={design.background.color.toUpperCase()}
                                        onChange={(e) => onDesignChange({ background: { ...design.background, color: e.target.value } })}
                                        className="w-full text-sm font-semibold text-slate-900 outline-none uppercase tracking-wider"
                                    />
                                    <Palette className="w-4 h-4 text-slate-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Eye Outer & Inner */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Square className="w-4 h-4 text-blue-600" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Outer Shape</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {CORNER_SQUARE_STYLES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onDesignChange({ cornersSquare: { ...design.cornersSquare, type: t.id } })}
                                        className={cn(
                                            "h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm",
                                            design.cornersSquare.type === t.id
                                                ? 'border-blue-600 bg-blue-50/50'
                                                : 'border-slate-50 bg-white hover:border-blue-100'
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                            design.cornersSquare.type === t.id ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-50'
                                        )}>
                                            <EyeOuterPreview type={t.id} active={design.cornersSquare.type === t.id} />
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-widest",
                                            design.cornersSquare.type === t.id ? 'text-blue-600' : 'text-gray-400'
                                        )}>
                                            {t.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:border-blue-600">
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                    <input
                                        type="color"
                                        value={design.cornersSquare.color}
                                        onChange={(e) => onDesignChange({ cornersSquare: { ...design.cornersSquare, color: e.target.value } })}
                                        className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Outer Color</p>
                                    <input
                                        type="text"
                                        value={design.cornersSquare.color.toUpperCase()}
                                        onChange={(e) => onDesignChange({ cornersSquare: { ...design.cornersSquare, color: e.target.value } })}
                                        className="w-full text-sm font-semibold text-slate-900 outline-none uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                                <Circle className="w-4 h-4 text-blue-600" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Eye Inner Shape</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {CORNER_DOT_STYLES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => onDesignChange({ cornersDot: { ...design.cornersDot, type: t.id } })}
                                        className={cn(
                                            "h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm",
                                            design.cornersDot.type === t.id
                                                ? 'border-blue-600 bg-blue-50/50'
                                                : 'border-slate-50 bg-white hover:border-blue-100'
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                            design.cornersDot.type === t.id ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-50'
                                        )}>
                                            <EyeInnerPreview type={t.id} active={design.cornersDot.type === t.id} />
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-widest",
                                            design.cornersDot.type === t.id ? 'text-blue-600' : 'text-gray-400'
                                        )}>
                                            {t.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:border-blue-600">
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                    <input
                                        type="color"
                                        value={design.cornersDot.color}
                                        onChange={(e) => onDesignChange({ cornersDot: { ...design.cornersDot, color: e.target.value } })}
                                        className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Inner Color</p>
                                    <input
                                        type="text"
                                        value={design.cornersDot.color.toUpperCase()}
                                        onChange={(e) => onDesignChange({ cornersDot: { ...design.cornersDot, color: e.target.value } })}
                                        className="w-full text-sm font-semibold text-slate-900 outline-none uppercase tracking-wider"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'frame' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4 text-blue-600" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Frame & Container</p>
                            </div>
                            <button 
                                onClick={() => onFrameChange(DEFAULT_QR_FRAME)}
                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3 h-3" /> Reset
                            </button>
                        </div>

                        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-2 px-2">
                            {FRAME_STYLES.map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => onFrameChange({ type: f.id as any })}
                                    className={cn(
                                        "flex-shrink-0 w-24 h-28 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 shadow-sm",
                                        frame.type === f.id
                                            ? "border-blue-600 bg-blue-50/50 shadow-inner"
                                            : "border-slate-50 bg-white hover:border-blue-100"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                        frame.type === f.id ? "bg-blue-600 shadow-lg shadow-blue-200 text-white" : "bg-slate-50"
                                    )}>
                                        <FramePreviewIcon type={f.id} active={frame.type === f.id} />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        frame.type === f.id ? "text-blue-600 font-black" : "text-gray-400"
                                    )}>
                                        {f.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {frame.type !== 'none' && (
                            <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <TypeIcon className="w-3.5 h-3.5 text-blue-600" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Call to Action</p>
                                        </div>
                                        <input
                                            type="text"
                                            value={frame.text || ''}
                                            onChange={(e) => onFrameChange({ text: e.target.value })}
                                            placeholder="SCAN ME"
                                            className="w-full px-5 py-4 border-2 border-slate-100 focus:border-blue-600 rounded-2xl outline-none text-slate-900 font-bold bg-white transition-all shadow-sm text-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <Palette className="w-3.5 h-3.5 text-blue-600" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Frame Color</p>
                                        </div>
                                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:border-blue-600">
                                            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                                <input
                                                    type="color"
                                                    value={frame.color || '#000000'}
                                                    onChange={(e) => onFrameChange({ color: e.target.value })}
                                                    className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={(frame.color || '#000000').toUpperCase()}
                                                onChange={(e) => onFrameChange({ color: e.target.value })}
                                                className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent uppercase tracking-wider"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 ml-1">
                                        <Palette className="w-3.5 h-3.5 text-blue-600" />
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Text Color</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all focus-within:border-blue-600 max-w-[240px]">
                                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                                            <input
                                                type="color"
                                                value={frame.textColor || '#ffffff'}
                                                onChange={(e) => onFrameChange({ textColor: e.target.value })}
                                                className="absolute inset-0 w-full h-full cursor-pointer scale-150"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={(frame.textColor || '#ffffff').toUpperCase()}
                                            onChange={(e) => onFrameChange({ textColor: e.target.value })}
                                            className="w-full text-sm font-semibold text-slate-900 outline-none bg-transparent uppercase tracking-wider"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'logo' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-blue-600" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Center Identity</p>
                            </div>
                            {logo && (
                                <button 
                                    onClick={() => onLogoUpload(undefined)}
                                    className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-1.5"
                                >
                                    <X className="w-3 h-3" /> Remove
                                </button>
                            )}
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-slate-500 ml-1">Quick Presets</p>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                                    {PRESET_LOGOS.map((l) => (
                                        <button
                                            key={l.name}
                                            onClick={() => onLogoUpload(l.url)}
                                            className={cn(
                                                "relative aspect-square rounded-xl border-2 transition-all p-2 flex items-center justify-center group overflow-hidden bg-white shadow-sm",
                                                logo === l.url 
                                                    ? "border-blue-600 shadow-md shadow-blue-100" 
                                                    : "border-slate-50 hover:border-blue-100"
                                            )}
                                            title={l.name}
                                        >
                                            <img src={l.url} alt={l.name} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                                            {logo === l.url && (
                                                <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center backdrop-blur-[1px]">
                                                    <div className="bg-blue-600 text-white rounded-full p-0.5">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-100"></span>
                                </div>
                                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
                                    <span className="bg-white px-6 text-slate-300">or upload</span>
                                </div>
                            </div>

                            <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl p-8 hover:border-blue-300 transition-all bg-slate-50/50 group h-[160px] cursor-pointer">
                                {uploading ? (
                                    <>
                                        <div className="bg-blue-50 p-4 rounded-full mb-3">
                                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                        </div>
                                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Uploading...</span>
                                    </>
                                ) : logo && !PRESET_LOGOS.some(p => p.url === logo) ? (
                                    <div className="relative h-full flex items-center justify-center">
                                        <img src={logo} alt="Custom Logo" className="max-h-24 object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="bg-white p-4 rounded-full mb-3 group-hover:scale-110 group-hover:bg-blue-50 transition-all shadow-sm">
                                            <Upload className="w-6 h-6 text-slate-300 group-hover:text-blue-600" />
                                        </div>
                                        <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-bold uppercase tracking-widest transition-colors">Choose File</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                            </div>

                            {logo && (
                                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 space-y-8 animate-in zoom-in-95 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logo Scaling</p>
                                                </div>
                                                <span className="text-[10px] font-black text-blue-600 px-3 py-1 bg-blue-50 rounded-full">
                                                    {Math.round((design.imageOptions?.imageSize || 0.4) * 100)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="0.5"
                                                step="0.05"
                                                value={design.imageOptions?.imageSize || 0.4}
                                                onChange={(e) => onDesignChange({ 
                                                    imageOptions: { ...design.imageOptions, imageSize: parseFloat(e.target.value) } 
                                                } as any)}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                                <span>Small</span>
                                                <span>Medium</span>
                                                <span>Large</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-blue-100">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="hideDots"
                                                    checked={design.imageOptions?.hideBackgroundDots}
                                                    onChange={(e) => onDesignChange({ 
                                                        imageOptions: { ...design.imageOptions, hideBackgroundDots: e.target.checked } 
                                                    } as any)}
                                                    className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-600 cursor-pointer transition-all"
                                                />
                                            </div>
                                            <label htmlFor="hideDots" className="text-[11px] font-bold text-slate-600 cursor-pointer uppercase tracking-tight leading-none">
                                                Remove dots under logo
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignPanel;