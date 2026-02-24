'use client';

import React, { useState, useCallback, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import Tooltip from '@/components/ui/Tooltip';
import { sanitizeText, sanitizeEmail, sanitizePhone, sanitizeUrl, sanitizeBusinessName } from '@/lib/utils/sanitize';
import { HelpCircle } from 'lucide-react';

type InputType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'businessName';

interface SanitizedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    /** Label text displayed above the input */
    label: string;
    /** Value controlled externally */
    value: string;
    /** Callback with the sanitized value */
    onChange: (sanitizedValue: string) => void;
    /** Material icon name for the left icon */
    icon?: string;
    /** Whether this field is required (shows red asterisk) */
    required?: boolean;
    /** Tooltip text explaining this field */
    tooltip?: string;
    /** Input type — determines which sanitizer is used */
    type?: InputType;
    /** Custom class for the wrapper */
    wrapperClassName?: string;
    /** Error message to display inline */
    error?: string;
    /** Show password visibility toggle */
    showPasswordToggle?: boolean;
    /** Controlled password visibility state */
    showPassword?: boolean;
    /** Callback for toggling password visibility */
    onTogglePassword?: () => void;
}

interface SanitizedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    label: string;
    value: string;
    onChange: (sanitizedValue: string) => void;
    required?: boolean;
    tooltip?: string;
    wrapperClassName?: string;
}

function getSanitizer(type: InputType) {
    switch (type) {
        case 'email':
            return sanitizeEmail;
        case 'tel':
            return sanitizePhone;
        case 'url':
            return sanitizeUrl;
        case 'password':
            return (v: string) => v; // Don't sanitize passwords
        case 'businessName':
            return sanitizeBusinessName;
        default:
            return sanitizeText;
    }
}

/**
 * SanitizedInput — A drop-in input component with built-in:
 * - XSS/CSRF sanitization on change
 * - Red asterisk for required fields
 * - Tooltip using the existing Tooltip component
 * - Consistent styling matching the app's design system
 */
export function SanitizedInput({
    label,
    value,
    onChange,
    icon,
    required = false,
    tooltip,
    type = 'text',
    wrapperClassName = '',
    className,
    error,
    showPasswordToggle = false,
    showPassword = false,
    onTogglePassword,
    ...rest
}: SanitizedInputProps) {
    const sanitize = getSanitizer(type);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            onChange(sanitize(raw));
        },
        [onChange, sanitize]
    );

    return (
        <div className={`space-y-1.5 ${wrapperClassName}`}>
            <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {tooltip && (
                    <Tooltip content={tooltip} side="right">
                        <HelpCircle size={12} className="text-gray-400 hover:text-primary cursor-help transition-colors" />
                    </Tooltip>
                )}
            </div>
            <div className="relative">
                {icon && (
                    <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        {icon}
                    </span>
                )}
                <input
                    type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
                    value={value}
                    onChange={handleChange}
                    className={`w-full h-12 bg-gray-50 border rounded-xl ${icon ? 'pl-12' : 'pl-4'} ${showPasswordToggle ? 'pr-12' : 'pr-5'} font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-100'} ${className || ''}`}
                    {...rest}
                />
                {showPasswordToggle && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                        <span className="material-icons-round text-xl">
                            {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
            )}
        </div>
    );
}

/**
 * SanitizedTextarea — Same security features for multi-line inputs.
 */
export function SanitizedTextarea({
    label,
    value,
    onChange,
    required = false,
    tooltip,
    wrapperClassName = '',
    className,
    ...rest
}: SanitizedTextareaProps) {
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange(sanitizeText(e.target.value));
        },
        [onChange]
    );

    return (
        <div className={`space-y-1.5 ${wrapperClassName}`}>
            <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                    {label}
                    {required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {tooltip && (
                    <Tooltip content={tooltip} side="right">
                        <HelpCircle size={12} className="text-gray-400 hover:text-primary cursor-help transition-colors" />
                    </Tooltip>
                )}
            </div>
            <textarea
                value={value}
                onChange={handleChange}
                className={`w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm resize-none ${className || ''}`}
                {...rest}
            />
        </div>
    );
}

export default SanitizedInput;
