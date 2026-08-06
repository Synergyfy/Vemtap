'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin, X, Loader2, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
    label: string;
    value: string;
    onChange: (value: string, place?: NominatimResult) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
    showLabel?: boolean;
    icon?: React.ReactNode;
}

/** What we pass back to ClusterFormModal — enough to extract lat/lng + address components. */
export interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address: Record<string, string>;
}

interface NominatimRaw {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: Record<string, string>;
}

export function LocationAutocomplete({
    label,
    value,
    onChange,
    placeholder,
    className,
    disabled,
    showLabel = true,
    icon,
}: LocationAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<NominatimResult | null>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchResults = useCallback(async (query: string) => {
        if (abortRef.current) abortRef.current.abort();
        if (!query.trim() || query.trim().length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        try {
            const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
            const data: NominatimRaw[] = await res.json();
            const mapped: NominatimResult[] = data.map(d => ({
                place_id: d.place_id,
                display_name: d.display_name,
                lat: d.lat,
                lon: d.lon,
                address: d.address || {},
            }));
            setResults(mapped);
            setOpen(mapped.length > 0);
        } catch {
            // Aborted or network error — just show nothing
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        onChange(v);
        setSelected(null);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchResults(v), 300);
    }, [onChange, fetchResults]);

    const handleSelect = useCallback((result: NominatimResult) => {
        setSelected(result);
        onChange(result.display_name, result);
        setOpen(false);
        setResults([]);
    }, [onChange]);

    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setSelected(null);
        setResults([]);
        setOpen(false);
        inputRef.current?.focus();
    }, [onChange]);

    const shortLabel = (name: string) => {
        const parts = name.split(',').map(s => s.trim());
        return parts.length > 1 ? `${parts[0]}, ${parts[1]}` : name;
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {showLabel && (
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-1.5 block">
                    {label}
                </label>
            )}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    {icon || <MapPin size={16} />}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => { if (results.length) setOpen(true); }}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                    className={cn(
                        "w-full h-12 pl-12 pr-10 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all outline-none",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
                {loading && (
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                )}
                {!loading && value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto custom-scrollbar">
                    {results.map((r) => (
                        <button
                            key={r.place_id}
                            type="button"
                            onClick={() => handleSelect(r)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-2.5 transition-colors"
                        >
                            <MapPin size={15} className="text-gray-300 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-gray-700 leading-snug truncate">
                                    {shortLabel(r.display_name)}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                                    {r.display_name}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {open && !loading && results.length === 0 && value.trim().length >= 2 && (
                <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-400 font-medium">No matching places found.</p>
                </div>
            )}

            {selected && (
                <p className="mt-1.5 text-[10px] font-medium text-primary flex items-center gap-1">
                    <Navigation size={10} /> {shortLabel(selected.display_name)}
                </p>
            )}
        </div>
    );
}