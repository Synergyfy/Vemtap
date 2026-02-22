'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PhoneFrameProps {
    children: React.ReactNode;
    title?: string;
}

export default function PhoneFrame({ children, title }: PhoneFrameProps) {
    return (
        <div className="flex flex-col items-center">
            {title && (
                <div className="mb-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
                        {title}
                    </p>
                </div>
            )}

            <div className="relative w-[320px] h-[650px] bg-slate-900 rounded-[3.5rem] p-3 border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-30" />

                {/* Camera / Sensors in Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40">
                    <div className="size-1.5 rounded-full bg-slate-800" />
                    <div className="w-8 h-1 rounded-full bg-slate-800" />
                </div>

                {/* Internal Screen */}
                <div className="bg-white w-full h-full rounded-[2.8rem] overflow-hidden relative">
                    {/* Status Bar */}
                    <div className="h-6 flex items-center justify-between px-8 pt-4">
                        <span className="text-[10px] font-black text-slate-900">9:41</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-2 rounded-[2px] border border-slate-900/20 relative">
                                <div className="absolute inset-[1px] bg-slate-900 rounded-[1px]" />
                            </div>
                        </div>
                    </div>

                    <div className="h-full overflow-y-auto pt-4 touch-pan-y no-scrollbar">
                        {children}
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-200 rounded-full z-20" />
                </div>
            </div>
        </div>
    );
}
