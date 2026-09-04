'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowRight, Search, Handshake, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const ONBOARDING_SCREENS = [
  {
    id: 'welcome',
    badge: 'WELCOME',
    headline: "Discover what's around you.",
    subtitle: 'Find nearby businesses, deals, products and services.',
    primaryCta: 'Start Exploring',
    secondaryCta: 'Maybe Later',
  },
  {
    id: 'how-it-works',
    badge: 'HOW IT WORKS',
    headline: 'Three simple steps to connect with the best local businesses and offers.',
    subtitle: '',
    primaryCta: 'Continue',
    secondaryCta: 'Skip',
    isHowItWorks: true,
  },
];

function WelcomeScreen({ isDesktop }: { isDesktop: boolean }) {
  return (
    <>
      {/* Mobile: full bleed image top */}
      <div className={`absolute top-0 left-0 w-full ${isDesktop ? 'h-full' : 'h-[55%] rounded-b-[2rem]'} overflow-hidden`}>
        <img
          src="/assets/Screen-3.png"
          alt="Discover nearby businesses and deals"
          className="w-full h-full object-cover"
        />
        {isDesktop && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        )}
        {!isDesktop && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
        )}
      </div>
    </>
  );
}

function HowItWorksScreen({ isDesktop }: { isDesktop: boolean }) {
  const steps = [
    { num: '01', icon: MapPin, title: 'DISCOVER', desc: 'Find businesses and deals near you.', color: 'bg-[#066CF4]', glow: 'bg-[#066CF4]/10' },
    { num: '02', icon: Search, title: 'EXPLORE', desc: 'Browse offers, products, and services.', color: 'bg-emerald-600', glow: 'bg-emerald-500/10' },
    { num: '03', icon: Handshake, title: 'CONNECT', desc: 'Interact with businesses directly.', color: 'bg-amber-600', glow: 'bg-amber-500/10' },
  ];

  if (isDesktop) {
    return (
      <div className="absolute inset-0 bg-white flex">
        {/* Left: image */}
        <div className="w-1/2 relative overflow-hidden">
          <img src="/assets/Screen-3.png" alt="How it works" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-white/40" />
        </div>
        {/* Right: steps */}
        <div className="w-1/2 flex flex-col justify-center px-12 lg:px-16">
          <div className="mb-10">
            <h1 className="text-[36px] font-black text-gray-900 tracking-tight mb-3">How VEMTAP Works</h1>
            <p className="text-[15px] text-gray-500 leading-relaxed">Three simple steps to connect with the best local businesses and offers.</p>
          </div>
          <div className="space-y-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className="relative bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm overflow-hidden"
              >
                <div className={`absolute -right-4 -top-4 size-24 ${step.glow} rounded-full blur-2xl`} />
                <div className={`size-12 shrink-0 ${step.color} rounded-xl flex items-center justify-center shadow-md z-10`}>
                  <step.icon size={22} className="text-white" />
                </div>
                <div className="flex-1 z-10">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-black text-[#066CF4]">{step.num}</span>
                    <h3 className="text-[15px] font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-[13px] text-gray-500">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-white">
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10">
        <div className="flex gap-1.5 w-20">
          <div className="h-1 flex-1 bg-[#066CF4] rounded-full" />
          <div className="h-1 flex-1 bg-[#066CF4] rounded-full" />
          <div className="h-1 flex-1 bg-[#066CF4] rounded-full" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col justify-center px-6 pt-16 pb-32">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight mb-3">How VEMTAP Works</h1>
          <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">Three simple steps to connect with the best local businesses and offers.</p>
        </div>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="relative bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-4 shadow-sm overflow-hidden"
            >
              <div className={`absolute -right-4 -top-4 size-24 ${step.glow} rounded-full blur-2xl`} />
              <div className={`size-11 shrink-0 ${step.color} rounded-xl flex items-center justify-center shadow-md z-10`}>
                <step.icon size={20} className="text-white" />
              </div>
              <div className="flex-1 z-10">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black text-[#066CF4]">{step.num}</span>
                  <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen size on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      setIsDesktop(window.innerWidth >= 768);
    }
  });

  const goNext = useCallback(() => {
    if (currentScreen < ONBOARDING_SCREENS.length - 1) {
      setDirection(1);
      setCurrentScreen(prev => prev + 1);
    } else {
      onComplete();
    }
  }, [currentScreen, onComplete]);

  const goPrev = useCallback(() => {
    if (currentScreen > 0) {
      setDirection(-1);
      setCurrentScreen(prev => prev - 1);
    }
  }, [currentScreen]);

  const screen = ONBOARDING_SCREENS[currentScreen];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={screen.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
          >
            {screen.id === 'welcome' && <WelcomeScreen isDesktop />}
            {screen.id === 'how-it-works' && <HowItWorksScreen isDesktop />}

            {/* Desktop: bottom overlay for welcome */}
            {!screen.isHowItWorks && (
              <div className="absolute bottom-0 right-0 w-1/2 p-12 lg:p-16 z-20">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-2xl border border-gray-100">
                  <h1 className="text-[36px] font-black text-gray-900 tracking-tight leading-tight mb-3">{screen.headline}</h1>
                  <p className="text-[15px] text-gray-500 leading-relaxed mb-8">{screen.subtitle}</p>
                  <div className="space-y-3">
                    <button
                      onClick={goNext}
                      className="w-full h-14 rounded-full bg-[#066CF4] text-white font-bold text-[15px] flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-[#0557b3] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {screen.primaryCta}
                    </button>
                    {screen.id === 'welcome' && (
                      <button
                        onClick={onComplete}
                        className="w-full h-14 rounded-full border border-gray-200 bg-white text-gray-600 font-bold text-[15px] flex items-center justify-center hover:border-gray-300 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {screen.secondaryCta}
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center mt-6">
                    <Link href="/business-landing" className="text-[13px] font-bold text-[#066CF4] flex items-center gap-1 hover:underline">
                      Own a business? Register your business <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop: how it works bottom buttons */}
            {screen.isHowItWorks && (
              <div className="absolute bottom-0 right-0 w-1/2 p-12 lg:p-16 z-20">
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-100">
                  <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full bg-[#066CF4] text-white font-bold text-[15px] flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-[#0557b3] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Continue
                  </button>
                  <div className="flex justify-center mt-4">
                    <Link href="/business-landing" className="text-[13px] font-bold text-[#066CF4] flex items-center gap-1 hover:underline">
                      Own a business? Register your business <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Desktop: dot indicators */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {ONBOARDING_SCREENS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentScreen ? 'w-8 bg-[#066CF4]' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>

        {/* Desktop: back button */}
        {currentScreen > 0 && (
          <button onClick={goPrev}
            className="absolute top-6 left-6 z-30 size-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
        )}
      </div>
    );
  }

  // Mobile layout
  return (
    <div className="fixed inset-0 z-[1000] bg-white overflow-hidden">
      <div className="w-full h-full max-w-md mx-auto relative bg-white shadow-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={screen.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0">
              {screen.id === 'welcome' && <WelcomeScreen isDesktop={false} />}
              {screen.id === 'how-it-works' && <HowItWorksScreen isDesktop={false} />}
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20">
              {screen.isHowItWorks ? (
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white">
                  <button onClick={goNext}
                    className="w-full h-12 rounded-full bg-[#066CF4] text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer">
                    Continue
                  </button>
                  <div className="flex justify-center mt-4">
                    <Link href="/business-landing" className="text-xs font-bold text-[#066CF4] flex items-center gap-1">
                      Own a business? Register your business <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="px-6 pb-8 pt-4">
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="mb-5">
                      <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight mb-2">{screen.headline}</h1>
                      <p className="text-sm text-gray-500 leading-relaxed">{screen.subtitle}</p>
                    </div>
                    <div className="space-y-3">
                      <button onClick={goNext}
                        className="w-full h-12 rounded-full bg-[#066CF4] text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer">
                        {screen.primaryCta}
                      </button>
                      {screen.id === 'welcome' && (
                        <button onClick={onComplete}
                          className="w-full h-12 rounded-full border border-gray-200 bg-white text-gray-600 font-bold text-sm flex items-center justify-center hover:border-gray-300 active:scale-[0.98] transition-all cursor-pointer">
                          {screen.secondaryCta}
                        </button>
                      )}
                    </div>
                    <div className="flex justify-center mt-5">
                      <Link href="/business-landing" className="text-xs font-bold text-[#066CF4] flex items-center gap-1">
                        Own a business? Register your business <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {currentScreen > 0 && (
          <button onClick={goPrev}
            className="absolute top-5 left-5 z-30 size-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-all shadow-sm">
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {ONBOARDING_SCREENS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentScreen ? 'w-6 bg-[#066CF4]' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
