import React from 'react';

interface VisitorHeaderProps {
    logoUrl?: string | null;
    storeName: string;
    tag?: string;
    variant?: 'stacked' | 'inline';
}

export const VisitorHeader: React.FC<VisitorHeaderProps> = ({ logoUrl, storeName, tag, variant = 'stacked' }) => {
    const [imageFailed, setImageFailed] = React.useState(false);
    const displayLogo = logoUrl && !imageFailed ? logoUrl : null;
    const fallbackInitial = storeName?.trim()?.charAt(0)?.toUpperCase();

    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="size-10 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-1 shrink-0 shadow-sm transition-transform hover:scale-105">
                {displayLogo ? (
                    <img
                        src={displayLogo}
                        alt={storeName}
                        className="w-full h-full object-contain"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <span className="text-xs font-bold text-slate-400">{fallbackInitial || ''}</span>
                )}
            </div>
            <div className="text-left min-w-0 flex-1">
                <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight truncate">
                    {storeName}
                </h2>
                {tag && (
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mt-1">
                        {tag}
                    </p>
                )}
            </div>
        </div>
    );
};
