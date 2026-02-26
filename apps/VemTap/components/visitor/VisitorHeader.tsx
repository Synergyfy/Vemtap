import React from 'react';
import defaultLogo from '@/public/VEMTAP_PNG.png';

interface VisitorHeaderProps {
    logoUrl?: string | null;
    storeName: string;
    tag?: string;
}

export const VisitorHeader: React.FC<VisitorHeaderProps> = ({ logoUrl, storeName, tag }) => {
    return (
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-24 rounded-full bg-white shadow-xl shadow-primary/10 border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                <img
                    src={logoUrl || defaultLogo.src}
                    alt={storeName}
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{storeName}</h2>
                {tag && <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block">{tag}</span>}
            </div>
        </div>
    );
};
