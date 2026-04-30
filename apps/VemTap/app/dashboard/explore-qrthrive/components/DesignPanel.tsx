'use client';

import React from 'react';
import { Palette, Frame, Image as ImageIcon, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QrThriveDesign, QrThriveFrame } from '@/services/qr-thrive/types';

interface DesignPanelProps {
  design: QrThriveDesign;
  frame: QrThriveFrame;
  onDesignChange: (design: Partial<QrThriveDesign>) => void;
  onFrameChange: (frame: Partial<QrThriveFrame>) => void;
  onLogoUpload: (logo: string | undefined) => void;
  logo?: string;
  activeTab: 'shape' | 'frame' | 'logo';
}

const PRESET_LOGOS = [
  { id: 'whatsapp', name: 'WhatsApp', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg' },
  { id: 'instagram', name: 'Instagram', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg' },
  { id: 'facebook', name: 'Facebook', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg' },
  { id: 'twitter', name: 'Twitter (X)', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg' },
  { id: 'youtube', name: 'YouTube', url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png' },
  { id: 'paypal', name: 'PayPal', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
  { id: 'tiktok', name: 'TikTok', url: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg' },
];

const DOT_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'dots', label: 'Dots' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'extra-rounded', label: 'Extra Rounded' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy Rounded' },
];

const CORNER_STYLES = [
  { id: 'square', label: 'Square' },
  { id: 'dot', label: 'Dot' },
  { id: 'extra-rounded', label: 'Extra Rounded' },
];

const COLORS = [
  '#000000', '#2563EB', '#7C3AED', '#DC2626', '#059669', '#D97706', '#DB2777', '#0891B2', '#4F46E5', '#BE185D',
];

const FRAME_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'simple', label: 'Simple' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'rounded-thick', label: 'Modern Rounded' },
  { id: 'shadow', label: 'Retro Shadow' },
  { id: 'ribbon', label: 'Banner' },
  { id: 'circular', label: 'Circular' },
  { id: 'minimal', label: 'Clean Minimal' },
];

import { DEFAULT_QR_DESIGN, DEFAULT_QR_FRAME } from '@/services/qr-thrive/types';
import { RefreshCw, Sliders, Hexagon } from 'lucide-react';

export const DesignPanel: React.FC<DesignPanelProps> = ({ 
  design, frame, onDesignChange, onFrameChange, onLogoUpload, logo, activeTab 
}) => {

  const handleDotStyleChange = (style: string) => {
    onDesignChange({ 
      dots: { ...design.dots, type: style },
      cornersSquare: { ...design.cornersSquare, type: style === 'dots' ? 'dot' : style },
      cornersDot: { ...design.cornersDot, type: style === 'dots' ? 'dot' : style },
    });
  };

  return (
    <div className="space-y-8">
      {activeTab === 'shape' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Section: Patterns */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Palette className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">QR Patterns</h3>
              </div>
              <button 
                onClick={() => onDesignChange({ 
                  dots: { ...design.dots, type: DEFAULT_QR_DESIGN.dots.type },
                  cornersSquare: { ...design.cornersSquare, type: DEFAULT_QR_DESIGN.cornersSquare.type },
                  cornersDot: { ...design.cornersDot, type: DEFAULT_QR_DESIGN.cornersDot.type },
                })}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Reset Styles
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Dot Style</h4>
                <div className="grid grid-cols-3 gap-3">
                  {DOT_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleDotStyleChange(style.id)}
                      className={cn(
                        "aspect-square bg-white rounded-[1.5rem] border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm",
                        design.dots.type === style.id 
                          ? "border-blue-600 bg-blue-50/30" 
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 bg-slate-900 transition-all duration-300",
                        style.id === 'dots' && "rounded-full",
                        style.id === 'rounded' && "rounded-lg",
                        style.id === 'extra-rounded' && "rounded-2xl",
                        style.id === 'classy' && "rounded-sm",
                        style.id === 'classy-rounded' && "rounded-xl",
                        style.id === 'square' && "rounded-none"
                      )} />
                      <span className="text-[10px] font-bold text-slate-600">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Corner Style</h4>
                <div className="grid grid-cols-3 gap-3">
                  {CORNER_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => onDesignChange({ 
                        cornersSquare: { ...design.cornersSquare, type: style.id },
                        cornersDot: { ...design.cornersDot, type: style.id },
                      })}
                      className={cn(
                        "aspect-square bg-white rounded-[1.5rem] border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-sm",
                        design.cornersSquare.type === style.id 
                          ? "border-blue-600 bg-blue-50/30" 
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 border-4 border-slate-900 transition-all duration-300",
                        style.id === 'dot' && "rounded-full",
                        style.id === 'extra-rounded' && "rounded-xl"
                      )} />
                      <span className="text-[10px] font-bold text-slate-600">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section: Colors */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  <Hexagon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Color System</h3>
              </div>
              <button 
                onClick={() => onDesignChange({ 
                  dots: { ...design.dots, color: DEFAULT_QR_DESIGN.dots.color },
                  background: { ...design.background, color: DEFAULT_QR_DESIGN.background.color },
                  cornersSquare: { ...design.cornersSquare, color: DEFAULT_QR_DESIGN.cornersSquare.color },
                  cornersDot: { ...design.cornersDot, color: DEFAULT_QR_DESIGN.cornersDot.color },
                })}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-purple-600 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Reset Colors
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Dot Color */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dot Color</h4>
                  <button 
                    onClick={() => onDesignChange({ dots: { ...design.dots, color: DEFAULT_QR_DESIGN.dots.color } })}
                    className="w-6 h-6 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 px-4 py-2.5 rounded-2xl shadow-lg ring-4 ring-slate-900/5 transition-all focus-within:ring-blue-500/20">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: design.dots.color }} />
                  <input 
                    type="text" 
                    value={design.dots.color} 
                    onChange={(e) => onDesignChange({ dots: { ...design.dots, color: e.target.value } })}
                    className="text-[11px] font-black w-20 outline-none uppercase bg-transparent text-white tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => onDesignChange({ dots: { ...design.dots, color } })}
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all hover:scale-110",
                        design.dots.color.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-blue-600 ring-offset-2 scale-110" : "border-white shadow-sm"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Background</h4>
                  <button 
                    onClick={() => onDesignChange({ background: { ...design.background, color: DEFAULT_QR_DESIGN.background.color } })}
                    className="w-6 h-6 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 px-4 py-2.5 rounded-2xl shadow-lg ring-4 ring-slate-900/5 transition-all focus-within:ring-blue-500/20">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: design.background.color }} />
                  <input 
                    type="text" 
                    value={design.background.color} 
                    onChange={(e) => onDesignChange({ background: { ...design.background, color: e.target.value } })}
                    className="text-[11px] font-black w-20 outline-none uppercase bg-transparent text-white tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {COLORS.map(color => (
                    <button
                      key={`bg-${color}`}
                      onClick={() => onDesignChange({ background: { ...design.background, color } })}
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all hover:scale-110",
                        design.background.color.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-blue-600 ring-offset-2 scale-110" : "border-white shadow-sm"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Corner Color */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Corners</h4>
                  <button 
                    onClick={() => onDesignChange({ 
                      cornersSquare: { ...design.cornersSquare, color: DEFAULT_QR_DESIGN.cornersSquare.color },
                      cornersDot: { ...design.cornersDot, color: DEFAULT_QR_DESIGN.cornersDot.color }
                    })}
                    className="w-6 h-6 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 px-4 py-2.5 rounded-2xl shadow-lg ring-4 ring-slate-900/5 transition-all focus-within:ring-blue-500/20">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: design.cornersSquare.color }} />
                  <input 
                    type="text" 
                    value={design.cornersSquare.color} 
                    onChange={(e) => onDesignChange({ 
                      cornersSquare: { ...design.cornersSquare, color: e.target.value },
                      cornersDot: { ...design.cornersDot, color: e.target.value }
                    })}
                    className="text-[11px] font-black w-20 outline-none uppercase bg-transparent text-white tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {COLORS.map(color => (
                    <button
                      key={`corner-${color}`}
                      onClick={() => onDesignChange({ 
                        cornersSquare: { ...design.cornersSquare, color },
                        cornersDot: { ...design.cornersDot, color },
                      })}
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all hover:scale-110",
                        design.cornersSquare.color.toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-blue-600 ring-offset-2 scale-110" : "border-white shadow-sm"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'frame' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900">QR Frames</h3>
            <button 
              onClick={() => onFrameChange(DEFAULT_QR_FRAME)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-blue-600 border-2 border-blue-600 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-50 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Frame
            </button>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Frame Style</h4>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {FRAME_STYLES.map(f => (
                <button
                  key={f.id}
                  onClick={() => onFrameChange({ type: f.id as any })}
                  className={cn(
                    "aspect-square bg-white rounded-3xl border-2 p-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-sm",
                    frame.type === f.id 
                      ? "border-blue-600 bg-blue-50/50" 
                      : "border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                    frame.type === f.id ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                  )}>
                    <Frame className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 leading-tight">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {frame.type !== 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-50/50 border border-slate-100 rounded-[32px]">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Frame Text</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="SCAN ME"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-600 text-sm font-bold shadow-sm"
                    value={frame.text || ''}
                    onChange={(e) => onFrameChange({ text: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Frame Color</label>
                  <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 px-4 py-2 rounded-xl shadow-lg ring-4 ring-slate-900/5 transition-all focus-within:ring-blue-500/20">
                    <Hexagon className="w-4 h-4 text-blue-400" />
                    <input 
                      type="text" 
                      value={frame.color || '#000000'} 
                      onChange={(e) => onFrameChange({ color: e.target.value })}
                      className="text-[11px] font-black w-20 outline-none uppercase bg-transparent text-white tracking-widest"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  {COLORS.map(color => (
                    <button 
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                        (frame.color || '#000000').toLowerCase() === color.toLowerCase() ? "border-white ring-2 ring-blue-600 ring-offset-2" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onFrameChange({ color })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logo' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-slate-900">Custom Branding</h3>
            {logo && (
              <button 
                onClick={() => onLogoUpload(undefined)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all"
              >
                <X className="w-3 h-3" /> Remove Logo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] relative group transition-all hover:bg-white hover:border-blue-200">
              <div className="w-32 h-32 bg-white rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-slate-200/50 overflow-hidden relative transition-all duration-300">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                )}
              </div>
              
              <div className="mt-8">
                <input 
                  type="file" 
                  className="hidden" 
                  id="logo-upload" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => onLogoUpload(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label 
                  htmlFor="logo-upload"
                  className="inline-flex px-8 py-4 bg-blue-600 text-white rounded-[2rem] text-sm font-bold cursor-pointer hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-95"
                >
                  {logo ? 'Change Image' : 'Upload Logo'}
                </label>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">PNG or JPG, max 2MB</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sliders className="w-3 h-3" /> Logo Scale
                  </h4>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {Math.round((design.imageOptions?.imageSize || 0.4) * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.8" 
                  step="0.05"
                  value={design.imageOptions?.imageSize || 0.4}
                  onChange={(e) => onDesignChange({ 
                    imageOptions: { ...design.imageOptions, imageSize: parseFloat(e.target.value) } 
                  } as any)}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                  <span>Small</span>
                  <span>Center</span>
                  <span>Large</span>
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Options</h4>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onDesignChange({ 
                        imageOptions: { ...design.imageOptions, hideBackgroundDots: !design.imageOptions?.hideBackgroundDots } 
                      } as any)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        design.imageOptions?.hideBackgroundDots ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      Hide Dots Under Logo
                    </button>
                 </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Popular Icons</h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {PRESET_LOGOS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => onLogoUpload(preset.url)}
                  className={cn(
                    "aspect-square p-3 border-2 rounded-[24px] flex items-center justify-center transition-all hover:scale-110 shadow-sm",
                    logo === preset.url ? "border-blue-600 bg-blue-50 shadow-blue-100" : "border-slate-100 hover:border-slate-300 bg-white"
                  )}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignPanel;