import React from 'react';

interface VisitorHeaderProps {
    logoUrl?: string | null;
    storeName: string;
    tag?: string;
    variant?: 'stacked' | 'inline';
}

export const VisitorHeader: React.FC<VisitorHeaderProps> = ({ logoUrl, storeName, tag, variant = 'stacked' }) => {
    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-full bg-white shadow-md shadow-primary/10 border border-slate-100 overflow-hidden flex items-center justify-center p-1">
                    <img
                        src={logoUrl || '/VEMTAP_PNG.png'}
                        alt={storeName}
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-900 tracking-tight leading-none truncate">{storeName}</h2>
                    {tag && <span className="text-[9px] font-black text-primary uppercase tracking-[0.25em] block mt-1">{tag}</span>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 mb-8">
            <div className="size-24 rounded-full bg-white shadow-xl shadow-primary/10 border border-slate-100 overflow-hidden flex items-center justify-center p-2">
                <img
                    src={logoUrl || '/VEMTAP_PNG.png'}
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
