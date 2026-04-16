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
  { id: 'rounded-thick', label: 'Rounded Thick' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'bracket', label: 'Bracket' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'phone', label: 'Phone' },
  { id: 'circular', label: 'Circular' },
  { id: 'tag', label: 'Tag' },
  { id: 'minimal', label: 'Minimal' },
];

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dot Style</h4>
              <div className="grid grid-cols-3 gap-3">
                {DOT_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => handleDotStyleChange(style.id)}
                    className={cn(
                      "aspect-square bg-slate-50 rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]",
                      design.dots.type === style.id 
                        ? "border-blue-600 bg-blue-50/50" 
                        : "border-transparent hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 bg-slate-900",
                      style.id === 'dots' && "rounded-full",
                      style.id === 'rounded' && "rounded-lg",
                      style.id === 'extra-rounded' && "rounded-2xl",
                      style.id === 'classy' && "rounded-sm",
                      style.id === 'classy-rounded' && "rounded-xl",
                      style.id === 'square' && "rounded-none"
                    )} />
                    <span className="text-[10px] font-medium text-slate-500">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Corner Style</h4>
              <div className="grid grid-cols-3 gap-3">
                {CORNER_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => onDesignChange({ 
                      cornersSquare: { ...design.cornersSquare, type: style.id },
                      cornersDot: { ...design.cornersDot, type: style.id },
                    })}
                    className={cn(
                      "aspect-square bg-slate-50 rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]",
                      design.cornersSquare.type === style.id 
                        ? "border-blue-600 bg-blue-50/50" 
                        : "border-transparent hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 border-4 border-slate-900",
                      style.id === 'dot' && "rounded-full",
                      style.id === 'extra-rounded' && "rounded-xl"
                    )} />
                    <span className="text-[10px] font-medium text-slate-500">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dot Color</h4>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => onDesignChange({ dots: { ...design.dots, color } })}
                    className={cn(
                      "aspect-square rounded-full border-2 transition-transform hover:scale-110",
                      design.dots.color === color ? "border-white ring-2 ring-blue-600 ring-offset-2" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Background Color</h4>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map(color => (
                  <button
                    key={`bg-${color}`}
                    onClick={() => onDesignChange({ background: { ...design.background, color } })}
                    className={cn(
                      "aspect-square rounded-full border-2 transition-transform hover:scale-110",
                      design.background.color === color ? "border-white ring-2 ring-blue-600 ring-offset-2" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Corner Color</h4>
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map(color => (
                  <button
                    key={`corner-${color}`}
                    onClick={() => onDesignChange({ 
                      cornersSquare: { ...design.cornersSquare, color },
                      cornersDot: { ...design.cornersDot, color },
                    })}
                    className={cn(
                      "aspect-square rounded-full border-2 transition-transform hover:scale-110",
                      design.cornersSquare.color === color ? "border-white ring-2 ring-blue-600 ring-offset-2" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'frame' && (
        <div className="space-y-8">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Frame Style</h4>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {FRAME_STYLES.map(f => (
                <button
                  key={f.id}
                  onClick={() => onFrameChange({ type: f.id as any })}
                  className={cn(
                    "aspect-square bg-slate-50 rounded-2xl border-2 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]",
                    frame.type === f.id 
                      ? "border-blue-600 bg-blue-50/50" 
                      : "border-transparent hover:border-slate-200"
                  )}
                >
                  <Frame className={cn("w-6 h-6", frame.type === f.id ? "text-blue-600" : "text-slate-400")} />
                  <span className="text-[10px] font-medium text-slate-500">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {frame.type !== 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl space-y-4">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frame Text</label>
                <input 
                  type="text" 
                  placeholder="SCAN ME"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 text-sm font-bold"
                  value={frame.text || ''}
                  onChange={(e) => onFrameChange({ text: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Frame Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <button 
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                        frame.color === color ? "border-white ring-2 ring-blue-600 ring-offset-2" : "border-slate-200"
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
        <div className="text-center py-12 space-y-6">
          <div className="w-32 h-32 bg-slate-50 rounded-3xl mx-auto flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-contain p-4" />
            ) : (
              <ImageIcon className="w-12 h-12 text-slate-300" />
            )}
          </div>
          
          {logo && (
            <button 
              onClick={() => onLogoUpload(undefined)}
              className="text-xs text-red-500 font-medium hover:text-red-700"
            >
              Remove logo
            </button>
          )}
          
          <div>
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
              className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              {logo ? 'Change Image' : 'Upload Logo'}
            </label>
          </div>
          
          <p className="text-xs text-slate-400">Upload a PNG or JPG. Recommended size: 500x500px</p>

          <div className="pt-8 mt-8 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Popular Icons</h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 justify-items-center">
              {PRESET_LOGOS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => onLogoUpload(preset.url)}
                  className={cn(
                    "w-12 h-12 p-2 border-2 rounded-xl flex items-center justify-center transition-all hover:scale-110",
                    logo === preset.url ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-100 hover:border-slate-300 bg-white"
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