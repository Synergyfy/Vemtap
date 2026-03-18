import type { CSSProperties } from 'react';

export const buildBrandCssVars = (brandColor?: string) => {
    if (!brandColor) return undefined;
    const rgb = parseHexColor(brandColor);
    if (!rgb) return undefined;

    const primary = toHex(rgb);
    const light = toHex(shift(rgb, 0.3));
    const dark = toHex(shift(rgb, -0.2));
    const hover = toHex(shift(rgb, -0.1));

    return {
        ['--color-primary' as string]: primary,
        ['--color-primary-light' as string]: light,
        ['--color-primary-dark' as string]: dark,
        ['--color-primary-hover' as string]: hover,
    } as CSSProperties;
};

const parseHexColor = (value: string) => {
    const raw = value.trim().replace('#', '');
    const hex = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
    const int = parseInt(hex, 16);
    return {
        r: (int >> 16) & 255,
        g: (int >> 8) & 255,
        b: int & 255,
    };
};

const shift = (color: { r: number; g: number; b: number }, amount: number) => {
    const adjust = (channel: number) =>
        amount >= 0
            ? Math.round(channel + (255 - channel) * amount)
            : Math.round(channel * (1 + amount));

    return {
        r: clamp(adjust(color.r)),
        g: clamp(adjust(color.g)),
        b: clamp(adjust(color.b)),
    };
};

const clamp = (value: number) => Math.min(255, Math.max(0, value));

const toHex = (color: { r: number; g: number; b: number }) => {
    const toChannel = (channel: number) => channel.toString(16).padStart(2, '0');
    return `#${toChannel(color.r)}${toChannel(color.g)}${toChannel(color.b)}`;
};
