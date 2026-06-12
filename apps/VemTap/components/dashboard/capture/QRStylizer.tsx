'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    QrCode, Palette, Layout, Type, Image as ImageIcon, 
    Check, ArrowRight, AlertTriangle, X 
} from 'lucide-react';
import { useCustomerCaptureStore } from '@/store/useCustomerCaptureStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
    { name: 'Vemtap Blue', hex: '#066CF4' },
    { name: 'Pitch Black', hex: '#000000' },
    { name: 'Rose Red', hex: '#EF4444' },
    { name: 'Emerald Green', hex: '#10B981' },
    { name: 'Royal Purple', hex: '#8B5CF6' },
    { name: 'Sunset Orange', hex: '#F59E0B' },
];

const FRAME_OPTIONS = [
    { id: 'simple', label: 'Simple' },
    { id: 'rounded', label: 'Rounded' },
    { id: 'modern', label: 'Modern' },
    { id: 'bold', label: 'Bold' },
    { id: 'premium', label: 'Premium' },
    { id: 'minimal', label: 'Minimal' },
];

const STYLE_OPTIONS = [
    { id: 'square', label: 'Square' },
    { id: 'rounded', label: 'Rounded' },
    { id: 'dots', label: 'Dots' },
    { id: 'modern', label: 'Modern' },
];

export default function QRStylizer() {
    const { qrData, updateQRData, shortLink, setStep } = useCustomerCaptureStore();
    const { data: business } = useMyBusiness();
    const [useBusinessLogo, setUseBusinessLogo] = useState(true);

    const handleColorSelect = (hex: string) => {
        updateQRData({ color: hex });
    };

    const handleFrameSelect = (frameId: any) => {
        updateQRData({ frame: frameId });
    };

    const handleStyleSelect = (styleId: any) => {
        updateQRData({ dotStyle: styleId });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Customize QR Code</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">Make your QR code match your brand identity.</p>
            </div>

            {/* Live QR Preview Card */}
            <div className="sticky top-4 z-20 rounded-[32px] bg-white p-8 shadow-xl border border-blue-100 flex flex-col items-center">
                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Live Preview</div>
                
                <div className="relative p-8 rounded-[40px] bg-white shadow-2xl shadow-black/5 border border-gray-50 flex flex-col items-center">
                    {/* Simulated Frame */}
                    <div className={cn(
                        "transition-all duration-300 flex flex-col items-center",
                        qrData.frame === 'bold' ? "border-8 p-4" : "",
                        qrData.frame === 'rounded' ? "rounded-[60px] p-6" : "",
                        qrData.frame === 'modern' ? "bg-gray-50 p-6" : ""
                    )} style={{ borderColor: qrData.color }}>
                        
                        <div className="bg-white p-2 rounded-2xl">
                            <QRCodeCanvas 
                                value={shortLink || 'https://vemtap.com'} 
                                size={160}
                                level="H"
                                fgColor={qrData.color}
                                imageSettings={useBusinessLogo && business?.logoUrl ? {
                                    src: business.logoUrl,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                } : undefined}
                            />
                        </div>

                        {qrData.ctaText && (
                            <div className="mt-4 text-center">
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: qrData.color }}>
                                    {qrData.ctaText}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-amber-700 border border-amber-100">
                    <AlertTriangle size={14} className="shrink-0" />
                    <p className="text-[10px] font-bold">Ensure high contrast for reliable scanning.</p>
                </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-6">
                {/* Logo Upload */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <ImageIcon size={18} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Logo Upload</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-gray-100">
                                    {business?.logoUrl ? (
                                        <img src={business.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="text-gray-300" size={20} />
                                    )}
                                </div>
                                <span className="text-xs font-bold text-gray-900">Use Business Logo</span>
                            </div>
                            <button 
                                onClick={() => setUseBusinessLogo(!useBusinessLogo)}
                                className={cn(
                                    "h-6 w-12 rounded-full transition-all relative",
                                    useBusinessLogo ? "bg-[#066CF4]" : "bg-gray-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 size-4 rounded-full bg-white transition-all",
                                    useBusinessLogo ? "left-7" : "left-1"
                                )} />
                            </button>
                        </div>
                        <Button variant="outline" className="w-full h-12 rounded-xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#066CF4]">
                            Upload Custom Logo
                        </Button>
                    </div>
                </div>

                {/* Color Selection */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Palette size={18} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Brand Color</h3>
                    </div>

                    <div className="grid grid-cols-6 gap-3">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color.hex}
                                onClick={() => handleColorSelect(color.hex)}
                                className={cn(
                                    "aspect-square rounded-xl border-4 transition-all flex items-center justify-center",
                                    qrData.color === color.hex ? "border-blue-100" : "border-transparent"
                                )}
                                style={{ backgroundColor: color.hex }}
                            >
                                {qrData.color === color.hex && <Check size={16} className="text-white" />}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="h-10 w-full rounded-xl bg-gray-50 border border-gray-100 px-4 flex items-center gap-2">
                            <div className="size-5 rounded-full border border-gray-200" style={{ backgroundColor: qrData.color }} />
                            <input 
                                type="text" 
                                value={qrData.color}
                                onChange={(e) => handleColorSelect(e.target.value)}
                                className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Frame Selection */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <Layout size={18} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Frame Style</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {FRAME_OPTIONS.map((frame) => (
                            <button
                                key={frame.id}
                                onClick={() => handleFrameSelect(frame.id)}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                                    qrData.frame === frame.id ? "border-[#066CF4] bg-blue-50/30" : "border-gray-50 bg-gray-50 hover:border-gray-100"
                                )}
                            >
                                <div className={cn(
                                    "size-8 rounded-lg border-2",
                                    frame.id === 'bold' ? "border-4" : "",
                                    frame.id === 'rounded' ? "rounded-full" : ""
                                )} style={{ borderColor: qrData.color }} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-900">{frame.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* CTA Text */}
                <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Type size={18} />
                        </div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">CTA Text</h3>
                    </div>

                    <div className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="e.g. Scan To Connect"
                            value={qrData.ctaText}
                            onChange={(e) => updateQRData({ ctaText: e.target.value })}
                            className="w-full h-12 rounded-xl bg-gray-50 border border-gray-100 px-5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#066CF4]/20 transition-all"
                        />
                        <div className="flex flex-wrap gap-2">
                            {['Scan To Register', 'Scan To Join', 'Connect With Us'].map((text) => (
                                <button
                                    key={text}
                                    onClick={() => updateQRData({ ctaText: text })}
                                    className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-white hover:text-[#066CF4] transition-all"
                                >
                                    {text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 flex gap-4">
                <Button 
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                    Back
                </Button>
                <Button 
                    onClick={() => setStep(3)}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20"
                >
                    Continue to Download
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
