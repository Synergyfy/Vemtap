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
        <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-sm">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt={storeName}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-300 text-lg">storefront</span>
                    </div>
                )}
            </div>
            <div className="text-left">
                <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">{storeName}</h2>
                {tag && <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mt-0.5">{tag}</p>}
            </div>
        </div>
    );
};
