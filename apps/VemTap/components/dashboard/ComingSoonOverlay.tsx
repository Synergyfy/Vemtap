'use client';

import React from 'react';
import { Lock, Rocket, Bell } from 'lucide-react';

interface ComingSoonOverlayProps {
    title: string;
    description?: string;
}

export default function ComingSoonOverlay({ title, description }: ComingSoonOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 overflow-hidden">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-0" />
            
            {/* Modal Content */}
            <div className="relative z-10 bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 md:p-12 max-w-lg w-full text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary">
                    <Rocket size={40} className="animate-bounce" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
                    {title}
                </h2>
                
                <p className="text-slate-500 font-medium leading-relaxed mb-8">
                    {description || "We're currently building this feature to give you the best experience possible. It will be available very soon!"}
                </p>
                
                <div className="flex flex-col gap-3">
                    <button 
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                        onClick={() => window.history.back()}
                    >
                        Go Back
                    </button>
                    
                    <button 
                        className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        onClick={() => {
                            // Logic to notify user when ready could go here
                            alert("Thanks! We'll notify you when this feature launches.");
                        }}
                    >
                        <Bell size={18} />
                        Notify Me When Ready
                    </button>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <Lock size={14} />
                    Coming Soon to VemTap
                </div>
            </div>
        </div>
    );
}
