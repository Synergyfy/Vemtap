'use client';

import React, { useState } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    side?: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export default function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div
            className={`relative inline-block ${className || ''}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-[99999] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md whitespace-nowrap shadow-xl pointer-events-none transition-opacity duration-200 ${positionClasses[side]}`}>
                    {content}
                    {/* Arrow */}
                    <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 
                        ${side === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
                        ${side === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
                        ${side === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
                        ${side === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
                    `}></div>
                </div>
            )}
        </div>
    );
}
