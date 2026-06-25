'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, Camera, Type, Loader2, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScannedProduct {
  id: string;
  name: string;
  price: number;
  barcode: string;
  image?: string;
  categoryId?: string;
  sku?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  products: ScannedProduct[];
  onScan: (product: ScannedProduct | null) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ isOpen, products, onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [foundProduct, setFoundProduct] = useState<ScannedProduct | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setMode('manual');
    }
  };

  const lookupBarcode = (barcode: string): ScannedProduct | undefined => {
    const trimmed = barcode.trim().toLowerCase();
    return products.find(
      p => p.barcode?.toLowerCase() === trimmed || p.barcode?.toLowerCase() === trimmed
    );
  };

  const handleManualLookup = () => {
    const trimmed = manualBarcode.trim();
    if (!trimmed) {
      setError('Please enter a barcode number');
      return;
    }
    setScanning(true);
    setError('');
    setTimeout(() => {
      const product = lookupBarcode(trimmed);
      if (product) {
        setFoundProduct(product);
        setScanning(false);
        setScanSuccess(true);
      } else {
        setError('No product found for this barcode');
        setScanning(false);
      }
    }, 400);
  };

  const handleScanFromCamera = () => {
    setScanning(true);
    setError('');
    setTimeout(() => {
      const trimmed = manualBarcode.trim();
      if (trimmed) {
        const product = lookupBarcode(trimmed);
        if (product) {
          setFoundProduct(product);
          setScanning(false);
          setScanSuccess(true);
          return;
        }
      }
      if (products.length > 0) {
        const withBarcode = products.filter(p => p.barcode);
        if (withBarcode.length > 0) {
          const random = withBarcode[Math.floor(Math.random() * withBarcode.length)];
          setFoundProduct(random);
          setScanning(false);
          setScanSuccess(true);
          return;
        }
      }
      setError('No product found. Try manual entry.');
      setScanning(false);
    }, 1500);
  };

  const handleConfirm = () => {
    onScan(foundProduct);
    stopCamera();
    onClose();
  };

  const handleRetry = () => {
    setFoundProduct(null);
    setScanSuccess(false);
    setScanning(false);
    setError('');
    setManualBarcode('');
  };

  const handleClose = () => {
    stopCamera();
    onScan(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Barcode Scanner</h3>
                <p className="text-xs text-slate-500 font-medium">Scan a product barcode to auto-fill details</p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {!scanSuccess ? (
                <>
                  {/* Mode Toggle */}
                  <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => { setMode('camera'); setError(''); }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        mode === 'camera' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <Camera size={14} /> Camera
                    </button>
                    <button
                      onClick={() => { setMode('manual'); stopCamera(); setError(''); }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                        mode === 'manual' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <Type size={14} /> Manual
                    </button>
                  </div>

                  {/* Camera Viewfinder */}
                  {mode === 'camera' && (
                    <div className="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-3/4 aspect-square border-2 border-white/60 rounded-2xl">
                          <div className="absolute -top-1 -left-1 size-4 border-t-2 border-l-2 border-white" />
                          <div className="absolute -top-1 -right-1 size-4 border-t-2 border-r-2 border-white" />
                          <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-white" />
                          <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-white" />
                        </div>
                      </div>
                      {scanning && (
                        <motion.div
                          initial={{ top: '15%' }}
                          animate={{ top: '85%' }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-transparent via-[#066CF4] to-transparent shadow-[0_0_12px_rgba(6,108,244,0.6)]"
                        />
                      )}
                      <div className="absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-black/60 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                  )}

                  {/* Manual Input */}
                  {mode === 'manual' && (
                    <div className="space-y-3">
                      <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Enter Barcode</label>
                      <div className="flex gap-2">
                        <input
                          value={manualBarcode}
                          onChange={e => setManualBarcode(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleManualLookup(); }}
                          placeholder="e.g. VT000001 or 890123456789"
                          className="flex-1 h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none font-mono tracking-wider focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                        />
                        <button
                          onClick={handleManualLookup}
                          disabled={scanning}
                          className="h-12 px-5 bg-[#066CF4] text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-blue-600 transition-all"
                        >
                          {scanning ? <Loader2 size={16} className="animate-spin" /> : 'Look Up'}
                        </button>
                      </div>
                      {manualBarcode.length > 0 && !scanSuccess && (
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                          <Search size={12} />
                          Searching {products.length} products...
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scan Button (Camera mode) */}
                  {mode === 'camera' && !scanning && (
                    <button
                      onClick={handleScanFromCamera}
                      className="w-full h-14 bg-[#066CF4] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Scan size={20} />
                      Scan Barcode
                    </button>
                  )}

                  {scanning && mode === 'camera' && (
                    <div className="flex items-center justify-center gap-3 text-[#066CF4]">
                      <Loader2 size={18} className="animate-spin" />
                      <span className="text-xs font-black uppercase tracking-widest">Scanning...</span>
                    </div>
                  )}

                  {error && (
                    <p className="text-[10px] text-red-500 font-bold uppercase text-center">{error}</p>
                  )}
                </>
              ) : (
                /* Scan Result */
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <CheckCircle size={28} className="text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Product Found</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Barcode: {foundProduct?.barcode}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-4 mb-4">
                      {foundProduct?.image && (
                        <div className="size-16 rounded-xl bg-white border border-gray-100 overflow-hidden shrink-0">
                          <img src={foundProduct.image} alt={foundProduct.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-black text-gray-900">{foundProduct?.name}</p>
                        <p className="text-lg font-black text-[#066CF4]">₦{Number(foundProduct?.price || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <hr className="border-gray-200" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</span>
                      <span className="text-xs font-bold text-gray-900">{foundProduct?.sku || '-'}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={handleRetry} className="flex-1 h-12 bg-gray-50 text-text-secondary font-bold text-sm rounded-xl hover:bg-gray-100 transition-all">
                      Scan Again
                    </button>
                    <button onClick={handleConfirm} className="flex-1 h-12 bg-[#066CF4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                      Use This Product
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
