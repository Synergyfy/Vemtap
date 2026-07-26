'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import POSHomeScreen from '@/components/dashboard/pos/POSHomeScreen';
import { CartPanel } from '@/components/dashboard/pos/CartPanel';
import { usePosStore } from '@/store/usePosStore';
import { ArrowLeft, ShoppingBag, Maximize2, Minimize2, Tag, ShoppingCart, Clock } from 'lucide-react';
import OfflineBanner from '@/components/dashboard/pos/OfflineBanner';

export default function DedicatedPOSModePage() {
  const router = useRouter();
  const { cart } = usePosStore();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col overflow-hidden select-none p-3 sm:p-5">
      <OfflineBanner />

      {/* POS Mode Top Action Bar */}
      <header className={`h-16 bg-gray-950/80 backdrop-blur-md text-white px-5 md:px-8 flex items-center justify-between shrink-0 shadow-lg rounded-2xl mb-3 sm:mb-4 border border-white/10 transition-all ${isFullscreen ? 'h-12 px-3 md:px-4 mb-2 rounded-xl' : ''}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => router.push('/dashboard/pos')}
            className={`flex items-center justify-center rounded-xl bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white transition-all border border-gray-700 shadow-sm active:scale-95 ${isFullscreen ? 'size-10' : 'gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider'}`}
            title="Exit POS Mode"
          >
            <ArrowLeft size={16} />
            <span className={isFullscreen ? 'hidden' : ''}>Exit Mode</span>
          </button>
          <div className={`h-5 w-px bg-gray-700 ${isFullscreen ? 'hidden' : 'hidden sm:block'}`} />
          <div className={`flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 ${isFullscreen ? 'hidden' : 'flex'}`}>
            <span className="text-xs sm:text-base font-black tracking-wide text-white flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" /> Point of Sale
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-400/20 w-fit">
              Full POS Mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center size-10 rounded-xl bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white transition-all border border-gray-700/60"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => router.push('/dashboard/pos/sales')}
            className={`flex items-center justify-center rounded-xl bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white transition-all border border-gray-700/60 ${isFullscreen ? 'size-10' : 'gap-1.5 h-10 px-4 text-xs font-black uppercase tracking-widest'}`}
            title="Sales History"
          >
            <Clock size={14} />
            <span className={isFullscreen ? 'hidden' : ''}>Sales History</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/pos/orders')}
            className={`flex items-center justify-center rounded-xl bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white transition-all border border-gray-700/60 ${isFullscreen ? 'size-10' : 'gap-1.5 h-10 px-4 text-xs font-black uppercase tracking-widest'}`}
            title="Orders"
          >
            <ShoppingBag size={14} />
            <span className={isFullscreen ? 'hidden' : ''}>Orders</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden gap-3 sm:gap-5 min-h-0">
        {/* Left Grid Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xl">
          <POSHomeScreen />
        </div>

        {/* Right Fixed Cart Panel */}
        <div className="w-[380px] lg:w-[440px] xl:w-[480px] flex flex-col bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-2xl shrink-0 p-1 sm:p-2">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}
