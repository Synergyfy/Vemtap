'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Crosshair, Loader2, CheckCircle2, AlertCircle, X, Search } from 'lucide-react';
import { getBrowserLocation, geocodeAddress } from '@/lib/geolocation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false });

type SetupView = 'menu' | 'browser-geo' | 'address-geocode' | 'map-picker' | 'manual-entry' | 'success' | 'error';

interface LocationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (lat: number, lng: number) => void;
  addressHint?: string;
}

export default function LocationSetupModal({ isOpen, onClose, onLocationSet, addressHint }: LocationSetupModalProps) {
  const [view, setView] = useState<SetupView>('menu');
  const [message, setMessage] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const reset = useCallback(() => {
    setView('menu');
    setMessage('');
    setManualLat('');
    setManualLng('');
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSuccess = (lat: number, lng: number) => {
    setView('success');
    setMessage(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setTimeout(() => {
      onLocationSet(lat, lng);
      handleClose();
    }, 1000);
  };

  const handleBrowserGeo = async () => {
    setView('browser-geo');
    setMessage('Getting your current location...');
    try {
      const pos = await getBrowserLocation();
      handleSuccess(pos.lat, pos.lng);
    } catch (err: any) {
      setMessage(err.message || 'Could not get your location');
      setView('error');
    }
  };

  const handleAddressGeocode = async () => {
    if (!addressHint) {
      setView('manual-entry');
      return;
    }
    setView('address-geocode');
    setMessage(`Looking up "${addressHint}"...`);
    try {
      const pos = await geocodeAddress(addressHint);
      handleSuccess(pos.lat, pos.lng);
    } catch {
      setView('manual-entry');
      setMessage('Could not geocode the address. Please enter coordinates manually.');
    }
  };

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng)) {
      setMessage('Please enter valid latitude and longitude values.');
      return;
    }
    if (lat < -90 || lat > 90) {
      setMessage('Latitude must be between -90 and 90.');
      return;
    }
    if (lng < -180 || lng > 180) {
      setMessage('Longitude must be between -180 and 180.');
      return;
    }
    handleSuccess(lat, lng);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-display font-bold text-text-main">Set Location</h3>
            <p className="text-sm text-text-secondary font-medium mt-1">
              {view === 'menu' ? 'Choose how to set your location coordinates' : ''}
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Menu View */}
        {view === 'menu' && (
          <div className="space-y-3">
            <OptionCard
              icon={<Navigation size={22} />}
              title="Use Current Location"
              description="Auto-detect using your device's GPS"
              onClick={handleBrowserGeo}
              color="primary"
            />
            <OptionCard
              icon={<Search size={22} />}
              title="Search on Map"
              description="Find your location visually on a map"
              onClick={() => setView('map-picker')}
              color="emerald"
            />
            <OptionCard
              icon={<MapPin size={22} />}
              title="Geocode from Address"
              description={addressHint ? `Look up "${addressHint}"` : 'Enter coordinates manually'}
              onClick={handleAddressGeocode}
              color="amber"
            />
            <OptionCard
              icon={<Crosshair size={22} />}
              title="Enter Coordinates Manually"
              description="Paste latitude and longitude values"
              onClick={() => setView('manual-entry')}
              color="gray"
            />
          </div>
        )}

        {/* Loading States */}
        {(view === 'browser-geo' || view === 'address-geocode') && (
          <div className="py-12 text-center space-y-5">
            <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
              <Loader2 size={36} className="text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-text-main">
                {view === 'browser-geo' ? 'Getting Your Location' : 'Looking Up Address'}
              </p>
              <p className="text-sm text-text-secondary font-medium">{message}</p>
              {view === 'browser-geo' && (
                <p className="text-[10px] font-medium text-text-secondary opacity-50">
                  Please allow location access when prompted by your browser
                </p>
              )}
            </div>
          </div>
        )}

        {/* Map Picker */}
        {view === 'map-picker' && (
          <LocationPicker
            onChange={(lat, lng) => handleSuccess(lat, lng)}
          />
        )}

        {/* Manual Entry */}
        {view === 'manual-entry' && (
          <div className="space-y-5">
            {message && view === 'manual-entry' && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-2xl px-4 py-3">
                <AlertCircle size={16} className="shrink-0" />
                <span className="font-medium">{message}</span>
              </div>
            )}
            <p className="text-sm text-text-secondary font-medium">Enter the latitude and longitude of this location.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g. 6.5244"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="e.g. 3.3792"
                  className="w-full h-14 bg-gray-50 border border-gray-200 rounded-2xl px-5 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => setView('menu')} className="rounded-xl font-bold h-12">
                Back
              </Button>
              <Button onClick={handleManualSubmit} className="rounded-xl font-bold h-12 bg-primary text-white">
                Set Coordinates
              </Button>
            </div>
          </div>
        )}

        {/* Error View */}
        {view === 'error' && (
          <div className="py-8 text-center space-y-5">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-red-700">Location Not Found</p>
              <p className="text-sm text-red-600 font-medium">{message}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => setView('menu')} className="rounded-xl font-bold h-12">
                Try Another Method
              </Button>
              <Button variant="outline" onClick={handleClose} className="rounded-xl font-bold h-12 border-red-200 text-red-600 hover:bg-red-50">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Success View */}
        {view === 'success' && (
          <div className="py-12 text-center space-y-5">
            <div className="size-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg text-emerald-700">Location Set!</p>
              <p className="text-sm text-emerald-600 font-mono font-medium">{message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCard({ icon, title, description, onClick, color }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: 'primary' | 'emerald' | 'amber' | 'gray';
}) {
  const colors = {
    primary: 'hover:bg-primary/5 hover:border-primary/20 group-hover:text-primary',
    emerald: 'hover:bg-emerald-50 hover:border-emerald-200 group-hover:text-emerald-600',
    amber: 'hover:bg-amber-50 hover:border-amber-200 group-hover:text-amber-600',
    gray: 'hover:bg-gray-50 hover:border-gray-300 group-hover:text-gray-700',
  };
  const icons = {
    primary: 'text-primary bg-primary/10',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    gray: 'text-gray-500 bg-gray-100',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 transition-all text-left group',
        colors[color]
      )}
    >
      <div className={cn('size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors', icons[color])}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800 group-hover:text-inherit transition-colors">{title}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">{description}</p>
      </div>
    </button>
  );
}
