'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Phone,
  Share2,
  CheckCircle2,
  MessageCircle,
  Tag,
  Briefcase,
  ArrowLeft,
  Ellipsis,
} from 'lucide-react';

export interface StorefrontTab {
  id: string;
  label: string;
  target: string;
}

interface StorefrontHeroProps {
  profileName: string;
  profileLogo: string;
  coverUrl?: string;
  locationDisplay: string;
  isOpenNow: boolean | null;
  directionsUrl: string;
  profilePhone?: string | null;
  showServicesAction: boolean;
  tabs: StorefrontTab[];
  onShare: () => void;
  onChat: () => void;
  onMore: () => void;
}

export default function StorefrontHero({
  profileName,
  profileLogo,
  coverUrl,
  locationDisplay,
  isOpenNow,
  directionsUrl,
  profilePhone,
  showServicesAction,
  tabs,
  onShare,
  onChat,
  onMore,
}: StorefrontHeroProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');

  useEffect(() => {
    setLogoFailed(false);
    setLogoLoaded(false);
  }, [profileLogo]);

  // Scroll-spy: highlight the tab whose section is in view.
  useEffect(() => {
    if (tabs.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const tab = tabs.find((t) => t.target === entry.target.id);
            if (tab) setActiveTab(tab.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    for (const tab of tabs) {
      const el = document.getElementById(tab.target);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [tabs]);

  const handleTabClick = (tab: StorefrontTab) => {
    setActiveTab(tab.id);
    document.getElementById(tab.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickActions = [
    { icon: MessageCircle, label: 'Chat', action: onChat },
    { icon: Tag, label: 'Offers', href: '#offers-section' },
    ...(showServicesAction ? [{ icon: Briefcase, label: 'Services', href: '#services-section' }] : []),
    { icon: Phone, label: 'Call', href: profilePhone ? `tel:${profilePhone}` : undefined },
    { icon: Ellipsis, label: 'More', action: onMore },
  ];

  return (
    <>
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3.5">
          <a href="/" className="flex items-center gap-2.5 text-slate-900 hover:text-blue-600 transition-colors">
            <ArrowLeft size={18} strokeWidth={2.5} />
            <span className="text-lg font-bold tracking-tight font-display">Vemtap</span>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={onShare}
              className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100/80 active:scale-90 flex items-center justify-center text-slate-600 transition-all border border-slate-100"
              aria-label="Share business profile"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero / Cover Banner */}
      <div className="w-full h-48 sm:h-64 md:h-80 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 relative overflow-hidden">
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverUrl}
              alt={`${profileName} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2" />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          </>
        )}
      </div>

      {/* Profile Info Header Container */}
      <div id="overview" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-20 sm:-mt-24 scroll-mt-24">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6">
            {/* Logo */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {profileLogo && !logoFailed ? (
                <img
                  alt={profileName}
                  className={`w-full h-full object-contain p-2.5 transition-opacity duration-300 ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                  src={profileLogo}
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-5xl font-black italic">
                  {profileName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Title & Reviews */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {profileName}
                </h1>
                <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold w-fit mx-auto sm:mx-0">
                  <CheckCircle2 size={13} strokeWidth={2.5} />
                  <span>Verified</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-2.5 text-sm">
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin size={14} className="shrink-0" />
                  <span className="truncate">{locationDisplay}</span>
                </div>
              </div>

              {isOpenNow !== null && (
                <div className="mt-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                      isOpenNow
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-red-50 text-red-500 border border-red-100'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {isOpenNow ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              )}
            </div>

            {/* Directions Action */}
            <div className="shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-600/10 transition-all w-full sm:w-auto"
              >
                <MapPin size={16} strokeWidth={2.5} />
                Get Directions
              </a>
            </div>
          </div>

          {/* Quick Button Controls */}
          <div className="flex justify-around sm:justify-start gap-4 sm:gap-8 border-t border-slate-100 mt-6 pt-5 bg-slate-50/20 rounded-2xl p-4">
            {quickActions.map((item) => (
              'action' in item && item.action ? (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex flex-col items-center gap-1.5 group sm:min-w-[64px]"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 active:scale-90 flex items-center justify-center text-slate-600 transition-all border border-slate-100/50">
                    <item.icon size={18} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                </button>
              ) : (
                <a
                  key={item.label}
                  href={'href' in item && item.href ? item.href : '#'}
                  className="flex flex-col items-center gap-1.5 group sm:min-w-[64px]"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 active:scale-90 flex items-center justify-center text-slate-600 transition-all border border-slate-100/50">
                    <item.icon size={18} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </span>
                </a>
              )
            ))}
          </div>
        </div>

        {/* Sticky tab bar */}
        {tabs.length > 0 && (
          <div className="sticky top-[68px] z-30 mt-4 -mx-1 px-1">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white/90 backdrop-blur-xl border border-slate-100 rounded-2xl p-1.5 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
