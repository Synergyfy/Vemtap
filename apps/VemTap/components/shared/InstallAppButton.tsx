'use client';

import { Download } from 'lucide-react';
import { usePwaInstall } from '@/components/providers/PWAProvider';

interface InstallAppButtonProps {
    className?: string;
    label?: string;
    iconOnly?: boolean;
    title?: string;
}

export default function InstallAppButton({ 
    className, 
    label = 'Install App', 
    iconOnly = false,
    title = 'Install App'
}: InstallAppButtonProps) {
    const { openPrompt, canInstall } = usePwaInstall();

    if (!canInstall) return null;

    if (iconOnly) {
        return (
            <button
                onClick={openPrompt}
                className={className ?? "inline-flex items-center justify-center size-9 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-primary hover:border-primary/30 hover:bg-primary/5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer shrink-0"}
                title={title}
                aria-label={title}
            >
                <Download size={16} />
            </button>
        );
    }

    return (
        <button
            onClick={openPrompt}
            className={className ?? 'flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer'}
            title={title}
        >
            <Download className="w-4 h-4" />
            {label}
        </button>
    );
}
