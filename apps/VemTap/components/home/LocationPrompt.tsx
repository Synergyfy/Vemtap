'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, X, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onAllowLocation: () => void;
  onSearchLocation: (query: string) => void;
  isLoading: boolean;
}

export default function LocationPrompt({ isOpen, onClose, onAllowLocation, onSearchLocation, isLoading }: LocationPromptProps) {
  const [mode, setMode] = useState<'pick' | 'search'>('pick');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearchLocation(searchQuery.trim());
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Set Your Location</h3>
                  <p className="text-xs text-gray-500">Find deals and businesses near you</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'pick' ? (
                <motion.div
                  key="pick"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Allow VEMTAP to use your location to show relevant businesses and deals around you.
                  </p>

                  <Button
                    onClick={onAllowLocation}
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Navigation size={18} />
                    )}
                    {isLoading ? 'Finding your location...' : 'Use My Location'}
                  </Button>

                  <button
                    onClick={() => setMode('search')}
                    className="w-full text-center text-sm font-semibold text-gray-500 hover:text-primary transition-colors py-2"
                  >
                    Search a location instead
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-gray-600">
                    Enter a city, area or address to find nearby deals.
                  </p>

                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder='Try "Wuse, Abuja" or "Lekki, Lagos"'
                      className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setMode('pick')}
                      className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || isLoading}
                      className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      Search
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
