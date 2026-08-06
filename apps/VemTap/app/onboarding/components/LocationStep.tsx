'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Crosshair, CheckCircle2, AlertCircle, Loader2, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateBusiness } from '@/services/businesses/hooks';
import { api } from '@/lib/api';
import { getBrowserLocation, geocodeAddress } from '@/lib/geolocation';

interface AddressInfo {
  street: string;
  city: string;
  state: string;
  country: string;
}

type LocationState = 'prompt' | 'locating' | 'geocoding' | 'success' | 'error';

interface Props {
  address: AddressInfo;
  onNext: (data: { latitude?: number; longitude?: number }) => void;
}

export default function LocationStep({ address, onNext }: Props) {
  const [state, setState] = useState<LocationState>('prompt');
  const [message, setMessage] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const updateBusiness = useUpdateBusiness();

  const fullAddress = [address.street, address.city, address.state, address.country]
    .filter(Boolean)
    .join(', ');

  const saveCoordinates = async (lat: number, lng: number) => {
    await updateBusiness.mutateAsync({ updates: { latitude: lat, longitude: lng } });
    setCoordinates({ lat, lng });
  };

  const handleYes = async () => {
    setState('locating');
    setMessage('Getting your current location...');

    try {
      const pos = await getBrowserLocation();
      await saveCoordinates(pos.lat, pos.lng);
      setState('success');
      setMessage('Location found!');
      setTimeout(() => onNext({ latitude: pos.lat, longitude: pos.lng }), 1200);
    } catch (err: any) {
      setMessage(err.message || 'Could not get your location');
      setState('error');
    }
  };

  const handleNo = async () => {
    setState('geocoding');
    setMessage('Looking up your business address...');

    try {
      const pos = await geocodeAddress(fullAddress);
      await saveCoordinates(pos.lat, pos.lng);
      setState('success');
      setMessage('Location found from your address!');
      setTimeout(() => onNext({ latitude: pos.lat, longitude: pos.lng }), 1200);
    } catch (err: any) {
      try {
        await api.post('/businesses/my-business/enqueue-geocode', {});
        onNext({});
      } catch {
        setMessage(err.message || 'Could not find your address. We will look it up in the background.');
        setState('error');
      }
    }
  };

  const handleSkip = () => {
    api.post('/businesses/my-business/enqueue-geocode', {}).catch(() => {});
    onNext({});
  };

  const locationServiceText = () => {
    const hasGoogleKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return hasGoogleKey ? 'Google Maps' : 'OpenStreetMap';
  };

  return (
    <motion.div
      key="location"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12 pb-20"
    >
      <div className="space-y-4">
        <h1 className="text-3xl font-display font-black text-text-main tracking-tight">
          Business Location
        </h1>
        <p className="text-text-secondary font-medium">
          Help customers find your business easily.
        </p>
      </div>

      {/* Address Display */}
      <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-black text-sm text-text-main">Your Business Address</h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">{fullAddress || 'No address entered'}</p>
          </div>
        </div>
      </div>

      {/* Stateful Content */}
      {state === 'prompt' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 text-center space-y-6">
            <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
              <Crosshair size={36} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-black text-lg text-text-main">
                Are You Currently At Your Business Location?
              </h2>
              <p className="text-text-secondary font-medium text-sm">
                We can use your device's location for better accuracy, or find it from your address.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleYes}
              className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Navigation size={18} />
              Yes, I'm Here
            </Button>
            <Button
              onClick={handleNo}
              variant="outline"
              className="w-full border-2 border-gray-200 text-text-main font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <MapPin size={18} />
              No, Use My Address
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 mx-auto"
            >
              <SkipForward size={14} />
              Skip — Set Up Later
            </button>
          </div>
        </motion.div>
      )}

      {state === 'locating' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-50 rounded-[2rem] p-12 border border-gray-100 text-center space-y-6"
        >
          <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
            <Loader2 size={36} className="text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="font-black text-lg text-text-main">Getting Your Location</h2>
            <p className="text-text-secondary font-medium text-sm">{message}</p>
            <p className="text-[10px] font-medium text-text-secondary opacity-50">
              Please allow location access when prompted by your browser
            </p>
          </div>
        </motion.div>
      )}

      {state === 'geocoding' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-50 rounded-[2rem] p-12 border border-gray-100 text-center space-y-6"
        >
          <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
            <Loader2 size={36} className="text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="font-black text-lg text-text-main">Finding Your Location</h2>
            <p className="text-text-secondary font-medium text-sm">{message}</p>
            <p className="text-[10px] font-medium text-text-secondary opacity-50">
              Using {locationServiceText()} to geocode your address
            </p>
          </div>
        </motion.div>
      )}

      {state === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 rounded-[2rem] p-12 border border-green-100 text-center space-y-6"
        >
          <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="font-black text-2xl text-green-700">Location Saved!</h2>
            <p className="text-green-600 font-medium text-sm">
              {coordinates && `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
            </p>
          </div>
        </motion.div>
      )}

      {state === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-red-50 rounded-[2rem] p-8 border border-red-100 text-center space-y-4">
            <div className="size-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="font-black text-lg text-red-700">Location Not Found</h2>
              <p className="text-red-600 font-medium text-sm">{message}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleNo}
              className="w-full bg-primary text-white font-black uppercase tracking-widest text-xs py-8 rounded-2xl hover:bg-primary-hover transition-all"
            >
              Try Address Lookup
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="w-full border-2 border-gray-200 text-text-main font-black uppercase tracking-widest text-xs py-8 rounded-2xl"
            >
              Skip For Now
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
