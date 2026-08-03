'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, Loader2, ExternalLink, Copy, CheckCircle2, RefreshCw, AlertTriangle, Type, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult?: (decodedText: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onResult }: QRScannerModalProps) {
    const [error, setError] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [scanned, setScanned] = useState<{ text: string; isUrl: boolean } | null>(null);
    const [manualMode, setManualMode] = useState(false);
    const [manualText, setManualText] = useState('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const elementId = 'customer-qr-scanner';
    const handledRef = useRef(false);

    const stopScanner = useCallback(async () => {
        const scanner = scannerRef.current;
        scannerRef.current = null;
        if (scanner && scanner.isScanning) {
            try {
                await scanner.stop();
            } catch {
                // ignore
            }
        }
    }, []);

    const startScanner = useCallback(async () => {
        if (!isOpen || manualMode) return;
        setIsStarting(true);
        setError('');
        setScanned(null);
        handledRef.current = false;
        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(elementId);
            }
            await scannerRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    handleDecode(decodedText);
                },
                () => {
                    // per-frame error, ignore
                }
            );
        } catch (err: any) {
            console.error('[QR SCANNER] Camera start failed:', err);
            setError(err?.message || 'Camera could not be started. Check permissions and try again.');
        } finally {
            setIsStarting(false);
        }
    }, [isOpen, manualMode]);

    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => startScanner(), 300);
            return () => {
                clearTimeout(t);
                stopScanner();
            };
        }
    }, [isOpen, manualMode, startScanner, stopScanner]);

    useEffect(() => {
        if (!isOpen) {
            setScanned(null);
            setError('');
            setManualMode(false);
            setManualText('');
        }
    }, [isOpen]);

    const handleDecode = (text: string) => {
        if (scanned || handledRef.current) return;
        handledRef.current = true;
        const trimmed = text.trim();
        const looksLikeUrl = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed);
        const normalized = looksLikeUrl && !/^https?:\/\//i.test(trimmed) ? `https://${trimmed}` : trimmed;
        setScanned({ text: normalized, isUrl: looksLikeUrl });
        stopScanner();
        onResult?.(trimmed);
    };

    const handleOpenUrl = () => {
        if (!scanned?.text) return;
        window.location.href = scanned.text;
    };

    const handleCopy = () => {
        if (!scanned?.text) return;
        navigator.clipboard.writeText(scanned.text);
        toast.success('Copied to clipboard');
    };

    const handleRetry = () => {
        setScanned(null);
        setError('');
        setManualText('');
        setManualMode(false);
        handledRef.current = false;
        startScanner();
    };

    const handleManualSubmit = () => {
        const trimmed = manualText.trim();
        if (!trimmed) {
            toast.error('Enter or paste the QR code content');
            return;
        }
        handleDecode(trimmed);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
                    >
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-lg font-display font-black text-slate-900 flex items-center gap-2">
                                    <Scan size={20} className="text-primary" />
                                    Scan QR
                                </h3>
                                <p className="text-[11px] text-slate-500 font-medium">Point at any VemTap QR to visit a business</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {!scanned ? (
                                <>
                                    {!manualMode ? (
                                        <>
                                            <div className="relative aspect-square bg-black rounded-2xl overflow-hidden">
                                                <div id={elementId} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                                                {isStarting && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                                                        <Loader2 size={28} className="animate-spin text-white" />
                                                        <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Starting camera...</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="relative w-3/4 aspect-square border-2 border-white/60 rounded-2xl">
                                                        <div className="absolute -top-1 -left-1 size-4 border-t-2 border-l-2 border-white" />
                                                        <div className="absolute -top-1 -right-1 size-4 border-t-2 border-r-2 border-white" />
                                                        <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-white" />
                                                        <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-white" />
                                                    </div>
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                            </div>

                                            <p className="text-center text-[11px] text-slate-400 font-medium leading-relaxed">
                                                Align the QR code inside the frame. It will be detected automatically.
                                            </p>

                                            {error && (
                                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2.5">
                                                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-[11px] font-bold text-red-600">{error}</p>
                                                        <button
                                                            onClick={handleRetry}
                                                            className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-black text-red-600 hover:underline"
                                                        >
                                                            <RefreshCw size={12} /> Retry
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-text-secondary uppercase tracking-widest">
                                                Enter QR Content
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={manualText}
                                                    onChange={(e) => setManualText(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                                                    placeholder="e.g. https://vemtap.com/b/CODE"
                                                    className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none font-mono tracking-wider focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                />
                                                <button
                                                    onClick={handleManualSubmit}
                                                    className="h-12 px-5 bg-primary text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-primary-hover transition-all"
                                                >
                                                    Go
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                If your camera is unavailable, enter the link shown on the QR code manually.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            setManualMode(!manualMode);
                                            setError('');
                                        }}
                                        className={cn(
                                            "w-full h-11 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                            manualMode
                                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                                : "bg-gray-50 text-text-secondary hover:bg-gray-100"
                                        )}
                                    >
                                        {manualMode ? (
                                            <>
                                                <Scan size={16} /> Use Camera
                                            </>
                                        ) : (
                                            <>
                                                <Type size={16} /> Enter Manually
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                                            <CheckCircle2 size={28} className="text-emerald-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-emerald-600">QR Detected</p>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {scanned.isUrl ? 'This QR contains a link' : 'This QR contains text'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                                        <div className="size-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                                            <Link2 size={16} className="text-primary" />
                                        </div>
                                        <p className="text-[11px] font-bold text-gray-700 font-mono break-all flex-1 leading-relaxed">
                                            {scanned.text}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleRetry}
                                            className="flex-1 h-12 bg-gray-50 text-text-secondary font-bold text-sm rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={14} /> Scan Again
                                        </button>
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 h-12 bg-gray-100 text-text-main font-bold text-sm rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Copy size={14} /> Copy
                                        </button>
                                    </div>

                                    {scanned.isUrl ? (
                                        <button
                                            onClick={handleOpenUrl}
                                            className="w-full h-14 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                        >
                                            <ExternalLink size={18} />
                                            Open Link
                                        </button>
                                    ) : (
                                        <p className="text-center text-[11px] text-gray-400 font-medium">
                                            This QR contains plain text, not a link.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
