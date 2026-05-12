import React from 'react';
import { cn } from '@/lib/utils';

interface VisitorHeaderProps {
    logoUrl?: string | null;
    storeName: string;
    tag?: string;
    variant?: 'stacked' | 'inline';
    isPreview?: boolean;
}

export const VisitorHeader: React.FC<VisitorHeaderProps> = ({ logoUrl, storeName, tag, variant = 'stacked', isPreview = false }) => {
    const [imageFailed, setImageFailed] = React.useState(false);
    const displayLogo = logoUrl && !imageFailed ? logoUrl : null;
    const fallbackInitial = storeName?.trim()?.charAt(0)?.toUpperCase();

    return (
        <div className={cn("flex items-center gap-2 mb-1", isPreview && "mb-0.5 gap-1")}>
            <div className={cn("size-8 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-sm", isPreview && "size-7")}>
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
                <h2 className={cn("text-xs font-black text-slate-900 tracking-tight leading-tight truncate", isPreview && "text-[11px]")}>
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
