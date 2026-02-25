import React from 'react';
import Image from 'next/image';

interface LogoIconProps {
    size?: number | string;
    className?: string;
}

export default function LogoIcon({ size = 24, className = "" }: LogoIconProps) {
    const pixelSize = typeof size === 'number' ? size : parseInt(size as string) || 24;

    return (
        <div className={`relative inline-block ${className}`} style={{ width: pixelSize, height: pixelSize }}>
            <Image
                src="/assets/vemtap_v.png"
                alt="VemTap Icon"
                fill
                className="object-contain"
                sizes={`${pixelSize}px`}
            />
        </div>
    );
}
