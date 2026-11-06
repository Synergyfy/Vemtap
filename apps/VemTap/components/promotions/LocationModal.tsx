'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { getBrowserLocation, geocodeAddress, reverseGeocode, GeolocationCoordinates } from '@/lib/geolocation';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSet: (coords: GeolocationCoordinates, label?: string) => void;
    title?: string;
    description?: string;
}

export default function LocationModal({
    isOpen,
    onClose,
    onLocationSet,
    title = "Find what's around you",
    description = 'Allow VEMTAP to use your location to show nearby businesses and deals.',
}: LocationModalProps) {
    const [mode, setMode] = useState<'pick' | 'manual'>('pick');
    const [manualAddress, setManualAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleUseCurrentLocation = async () => {
        setLoading(true);
        setError('');
        try {
            const coords = await getBrowserLocation();
            let label: string | undefined;
            try {
                label = await reverseGeocode(coords);
            } catch (reverseErr) {
                console.warn('Reverse geocoding failed:', reverseErr);
            }
            onLocationSet(coords, label);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Could not get your location');
            setLoading(false);
        }
    };

    const handleManualSearch = async () => {
        if (!manualAddress.trim()) return;
        setLoading(true);
        setError('');
        try {
            const coords = await geocodeAddress(manualAddress.trim());
            onLocationSet(coords, manualAddress.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || 'Could not find that location');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                    aria-label="Close"
                >
                    <X size={18} className="text-gray-400" />
                </button>

                {mode === 'pick' ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto bg-[#066CF4]/10 rounded-full flex items-center justify-center mb-6">
                            <MapPin size={28} className="text-[#066CF4]" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">{title}</h2>
                        <p className="text-sm text-gray-500 font-medium mb-8">
                            {description}
                        </p>

                        {error && (
                            <p className="text-xs font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleUseCurrentLocation}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 h-14 bg-[#066CF4] text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 transition-all active:scale-[0.98] disabled:opacity-60"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Navigation size={18} />
                                )}
                                {loading ? 'Detecting...' : 'Use my location'}
                            </button>
                            <button
                                onClick={() => setMode('manual')}
                                className="w-full flex items-center justify-center gap-3 h-14 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm border border-gray-200 hover:bg-gray-100 transition-all active:scale-[0.98]"
                            >
                                <Search size={18} />
                                Search a location instead
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8">
                        <div className="w-16 h-16 mx-auto bg-[#066CF4]/10 rounded-full flex items-center justify-center mb-6">
                            <Search size={28} className="text-[#066CF4]" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 text-center mb-2">Search a location instead</h2>
                        <p className="text-sm text-gray-500 font-medium text-center mb-6">
                            Enter your city, area, or address to find deals nearby.
                        </p>

                        {error && (
                            <p className="text-xs font-bold text-red-500 bg-red-50 rounded-xl px-4 py-3 mb-4">{error}</p>
                        )}

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={manualAddress}
                                onChange={(e) => setManualAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                                placeholder="e.g. Apo, Abuja"
                                className="w-full h-14 px-5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-[#066CF4]/20 outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleManualSearch}
                                disabled={loading || !manualAddress.trim()}
                                className="w-full h-14 bg-[#066CF4] text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                {loading ? 'Searching...' : 'Search Location'}
                            </button>
                            <button
                                onClick={() => { setMode('pick'); setError(''); }}
                                className="w-full h-12 text-gray-500 font-bold text-xs hover:text-gray-700 transition-colors"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
