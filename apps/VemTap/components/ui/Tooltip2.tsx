'use client';

import React, { useState } from 'react';

interface Tooltip2Props {
    content: string;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip2({ content, children, side = 'top' }: Tooltip2Props) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-50 max-w-72 w-max rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-[12px] font-medium leading-relaxed text-white shadow-2xl ${positionClasses[side]}`}>
                    {content}
                </div>
            )}
        </div>
    );
}
