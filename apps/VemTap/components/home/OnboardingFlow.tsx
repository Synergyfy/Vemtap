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
    gradient: 'from-[#066CF4] via-blue-600 to-indigo-700',
  },
  {
    id: 'how-it-works',
    badge: 'HOW IT WORKS',
    headline: 'Three simple steps to connect with the best local businesses and offers.',
    subtitle: '',
    primaryCta: 'Continue',
    secondaryCta: 'Skip',
    gradient: 'from-gray-900 via-gray-800 to-gray-900',
    isHowItWorks: true,
  },
];

function WelcomeScreen() {
  return (
    <div className="absolute inset-0">
      {/* Top image area - 55% */}
      <div className="absolute top-0 left-0 w-full h-[55%] rounded-b-[2rem] overflow-hidden">
        <img
          src="/assets/Screen-3.png"
          alt="Discover nearby businesses and deals"
          className="w-full h-full object-cover"
        />
        {/* Gradient fade to blend with white bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>
    </div>
  );
}

function HowItWorksScreen() {
  const steps = [
    { num: '01', icon: MapPin, title: 'DISCOVER', desc: 'Find businesses and deals near you.', color: 'bg-[#066CF4]', glow: 'bg-[#066CF4]/10' },
    { num: '02', icon: Search, title: 'EXPLORE', desc: 'Browse offers, products, and services.', color: 'bg-emerald-600', glow: 'bg-emerald-500/10' },
    { num: '03', icon: Handshake, title: 'CONNECT', desc: 'Interact with businesses directly.', color: 'bg-amber-600', glow: 'bg-amber-500/10' },
  ];

  return (
    <div className="absolute inset-0 bg-white">
      {/* Header with progress + skip */}
      <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10">
        <div className="flex gap-1.5 w-20">
          <div className="h-1 flex-1 bg-[#066CF4] rounded-full" />
          <div className="h-1 flex-1 bg-[#066CF4] rounded-full" />
          <div className="h-1 flex-1 bg-[#066CF4] rounded-full" />
        </div>
        <button className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors py-2 px-1">
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 pt-16 pb-32">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight mb-3">
            How VEMTAP Works
          </h1>
          <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">
            Three simple steps to connect with the best local businesses and offers.
          </p>
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
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-white overflow-hidden">
      {/* Mobile phone frame */}
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
            {/* Screen content */}
            <div className="absolute inset-0">
              {screen.id === 'welcome' && <WelcomeScreen />}
              {screen.id === 'how-it-works' && <HowItWorksScreen />}
            </div>

            {/* Bottom content - shared across all screens */}
            <div className="absolute bottom-0 left-0 right-0 z-20">
              {/* How it works has its own bottom buttons */}
              {screen.isHowItWorks ? (
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-white">
                  <button
                    onClick={goNext}
                    className="w-full h-12 rounded-full bg-[#066CF4] text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
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
                  {/* Gradient backdrop */}
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="mb-5">
                      <h1 className="text-[28px] font-black text-gray-900 tracking-tight leading-tight mb-2">
                        {screen.headline}
                      </h1>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {screen.subtitle}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={goNext}
                        className="w-full h-12 rounded-full bg-[#066CF4] text-white font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {screen.primaryCta}
                      </button>
                      {screen.id === 'welcome' && (
                        <button
                          onClick={onComplete}
                          className="w-full h-12 rounded-full border border-gray-200 bg-white text-gray-600 font-bold text-sm flex items-center justify-center hover:border-gray-300 active:scale-[0.98] transition-all cursor-pointer"
                        >
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

        {/* Back button (not on first screen) */}
        {currentScreen > 0 && (
          <button
            onClick={goPrev}
            className="absolute top-5 left-5 z-30 size-9 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white transition-all shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Dot indicators */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {ONBOARDING_SCREENS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentScreen ? 'w-6 bg-[#066CF4]' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
