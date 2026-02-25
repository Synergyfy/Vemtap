import React from 'react';
import { formatNumber, normalizeNumberInput } from '@/lib/utils/number';

type FormattedNumberInputProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    allowDecimal?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    min?: number;
};

export default function FormattedNumberInput({
    value,
    onChange,
    className,
    placeholder,
    allowDecimal = false,
    inputMode = 'numeric',
    min,
}: FormattedNumberInputProps) {
    const formatted = value === '' ? '' : formatNumber(value, {
        minFractionDigits: 0,
        maxFractionDigits: allowDecimal ? 2 : 0,
    });

    return (
        <input
            type="text"
            inputMode={inputMode}
            pattern={allowDecimal ? '[0-9.,]*' : '[0-9,]*'}
            value={formatted}
            onChange={(e) => {
                const raw = normalizeNumberInput(e.target.value, allowDecimal);
                onChange(raw);
            }}
            placeholder={placeholder}
            min={min}
            className={className}
        />
    );
}
