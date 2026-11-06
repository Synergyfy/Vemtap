'use client';

import Script from 'next/script';
import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Music2,
  ExternalLink,
  MessageCircle,
  Clock,
} from 'lucide-react';
import { BusinessHours } from '@/services/public/types';
import { normalizeDayHours } from '@/lib/businessHours';

export interface ProfileSocials {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  xUrl?: string | null;
  linkedinUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
}

interface OverviewTabProps {
  about?: string | null;
  welcomeMessage?: string | null;
  hours?: unknown;
  isOpenNow: boolean | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  socials: ProfileSocials;
  locationDisplay: string;
  directionsUrl: string;
  mapCoords: { lat: number; lon: number } | null;
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_DISPLAY: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const formatHours = (hours?: BusinessHours) => {
  const norm = normalizeDayHours(hours);
  if (!norm || norm.isClosed) return 'Closed';
  if (!norm.from || !norm.to) return 'Closed';
  return `${norm.from} - ${norm.to}`;
};

export default function OverviewTab({
  about,
  welcomeMessage,
  hours,
  isOpenNow,
  phone,
  whatsapp,
  email,
  website,
  socials,
  locationDisplay,
  directionsUrl,
  mapCoords,
}: OverviewTabProps) {
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const todayName = DAY_NAMES[new Date().getDay()];

  // ─── LEAFLET MAP EFFECT ───
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !mapCoords || !leafletReady) return;
      const leaflet = (window as typeof window & { L?: any }).L;
      if (!leaflet) return;
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = leaflet.map(mapRef.current).setView([mapCoords.lat, mapCoords.lon], 14);
        leaflet
          .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          })
          .addTo(mapInstanceRef.current);
        markerRef.current = leaflet.marker([mapCoords.lat, mapCoords.lon]).addTo(mapInstanceRef.current);
      } else {
        mapInstanceRef.current.setView([mapCoords.lat, mapCoords.lon], 14);
        if (markerRef.current) {
          markerRef.current.setLatLng([mapCoords.lat, mapCoords.lon]);
        }
      }
    };
    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [mapCoords, leafletReady]);

  // ─── LEAFLET CSS ───
  useEffect(() => {
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  const socialItems = [
    { key: 'facebook', label: 'Facebook', icon: Facebook, url: socials.facebookUrl },
    { key: 'instagram', label: 'Instagram', icon: Instagram, url: socials.instagramUrl },
    { key: 'x', label: 'X (Twitter)', icon: Twitter, url: socials.xUrl },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: socials.linkedinUrl },
    { key: 'tiktok', label: 'TikTok', icon: Music2, url: socials.tiktokUrl },
    { key: 'youtube', label: 'YouTube', icon: Youtube, url: socials.youtubeUrl },
  ];

  const whatsappDigits = (whatsapp || phone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = whatsappDigits ? `https://wa.me/${whatsappDigits}` : null;

  return (
    <div className="space-y-6">
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
        onLoad={() => setLeafletReady(true)}
      />

      {/* STORY / ABOUT */}
      {about && (
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-3.5">About Us</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            {about}
          </p>
          {welcomeMessage && (
            <div className="mt-5 p-4.5 bg-blue-50/40 rounded-2xl border border-blue-100/30 italic text-slate-600 text-sm">
              &ldquo;{welcomeMessage}&rdquo;
            </div>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* OPENING HOURS */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              OPENING HOURS
            </h3>
            {isOpenNow !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isOpenNow
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-red-50 text-red-500 border border-red-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {isOpenNow ? 'Open Now' : 'Closed'}
              </span>
            )}
          </div>
          <div className="space-y-2.5">
            {DAY_ORDER.map((day) => {
              const dayHours = (hours as any)?.[day] as BusinessHours | undefined;
              const isToday = day === todayName;
              const isClosed = !dayHours || (typeof dayHours.isClosed === 'boolean' ? dayHours.isClosed : !!dayHours.closed);
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-xl ${
                    isToday ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold ${isToday ? 'text-slate-900' : 'text-slate-600'}`}>
                      {DAY_DISPLAY[day] || day}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-100">
                        Today
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold ${isClosed ? 'text-slate-400' : 'text-slate-800'}`}>
                    {formatHours(dayHours)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* CONTACT INFO */}
        {(phone || email || website) && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              CONTACT DETAILS
            </h3>
            <div className="space-y-3.5">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-3 group text-xs">
                  <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Phone size={15} />
                  </div>
                  <span className="font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                    {phone}
                  </span>
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group text-xs">
                  <div className="w-8.5 h-8.5 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MessageCircle size={15} />
                  </div>
                  <span className="font-semibold text-slate-600 group-hover:text-emerald-600 transition-colors">
                    Chat on WhatsApp
                  </span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-3 group text-xs">
                  <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail size={15} />
                  </div>
                  <span className="font-semibold text-slate-600 group-hover:text-blue-600 transition-colors break-all">
                    {email}
                  </span>
                </a>
              )}
              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 group text-xs"
                >
                  <div className="w-8.5 h-8.5 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Globe size={15} />
                  </div>
                  <span className="font-semibold text-slate-600 group-hover:text-blue-600 transition-colors inline-flex items-center gap-1">
                    {website}
                    <ExternalLink size={11} className="text-slate-400" />
                  </span>
                </a>
              )}
            </div>

            {socialItems.some((s) => s.url) && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  FOLLOW SOCIALS
                </p>
                <div className="flex gap-2.5">
                  {socialItems
                    .filter((s) => s.url)
                    .map((social) => (
                      <a
                        key={social.key}
                        href={social.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title={social.label}
                      >
                        {React.createElement(social.icon, { size: 16 })}
                      </a>
                    ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* MAP & ADDRESS */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
          LOCATION FINDER
        </h3>
        {mapCoords && (
          <div
            ref={mapRef}
            className="w-full h-40 rounded-2xl overflow-hidden border border-slate-150 mb-3.5"
          />
        )}
        <div className="flex items-start gap-2.5 mb-4 text-xs leading-relaxed text-slate-500">
          <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p>{locationDisplay}</p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-600/10"
        >
          <MapPin size={14} strokeWidth={2.5} />
          Get Navigation Path
        </a>
      </section>

      {/* HOURS NOTE */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
        <Clock size={12} />
        Hours shown in your local time
      </div>
    </div>
  );
}
