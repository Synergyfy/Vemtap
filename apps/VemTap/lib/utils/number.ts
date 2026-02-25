export type FormatNumberOptions = {
    locale?: string;
    minFractionDigits?: number;
    maxFractionDigits?: number;
};

export const formatNumber = (
    value: number | string,
    options: FormatNumberOptions = {}
): string => {
    if (value === '' || value === null || value === undefined) return '';
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    const {
        locale = 'en-NG',
        minFractionDigits = 0,
        maxFractionDigits = 0,
    } = options;
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    }).format(n);
};

export const normalizeNumberInput = (value: string, allowDecimal = false): string => {
    if (!value) return '';
    let cleaned = value.replace(/,/g, '').replace(/[^\d.]/g, '');
    if (!allowDecimal) {
        cleaned = cleaned.replace(/\./g, '');
        return cleaned;
    }
    const parts = cleaned.split('.');
    if (parts.length <= 2) return cleaned;
    return `${parts[0]}.${parts.slice(1).join('')}`;
};
