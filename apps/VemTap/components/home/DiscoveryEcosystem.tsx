'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniCard {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  x: string;
  y: string;
  delay: number;
}

const CARDS: MiniCard[] = [
  { id: '1', title: 'Bella Restaurant', subtitle: '800m', badge: '20% OFF', x: '8%', y: '12%', delay: 0.1 },
  { id: '2', title: 'StyleHub', subtitle: '1.2km', badge: 'Sale', x: '58%', y: '8%', delay: 0.25 },
  { id: '3', title: 'Glow Beauty', subtitle: '650m', x: '72%', y: '42%', delay: 0.4 },
  { id: '4', title: '₦5,000 OFF', subtitle: 'TechCity', badge: 'Deal', x: '5%', y: '55%', delay: 0.55 },
  { id: '5', title: 'FreshMart', subtitle: '1.5km', x: '48%', y: '68%', delay: 0.7 },
];

interface DiscoveryEcosystemProps {
  className?: string;
}

export default function DiscoveryEcosystem({ className }: DiscoveryEcosystemProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative w-full aspect-square max-w-[380px] mx-auto',
        'rounded-[2rem] overflow-hidden',
        'bg-gradient-to-br from-[#066CF4]/[0.08] via-white to-blue-50/80',
        'border border-[#066CF4]/10 shadow-xl shadow-[#066CF4]/10',
        className
      )}
      aria-hidden
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,108,244,0.12),transparent_60%)]" />

      {/* Orbit rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[55%] rounded-full border border-[#066CF4]/15" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[78%] rounded-full border border-dashed border-[#066CF4]/10" />

      {/* Center YOU marker */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
        initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative flex size-14 items-center justify-center rounded-full bg-[#066CF4] text-white shadow-lg shadow-[#066CF4]/40"
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 10px 25px -5px rgba(6,108,244,0.4)',
                    '0 10px 35px -5px rgba(6,108,244,0.55)',
                    '0 10px 25px -5px rgba(6,108,244,0.4)',
                  ],
                }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MapPin size={22} fill="currentColor" />
          {!reduceMotion && (
            <span className="absolute inset-0 rounded-full animate-ping bg-[#066CF4]/30" />
          )}
        </motion.div>
        <span className="mt-2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#066CF4] shadow-sm border border-[#066CF4]/10">
          You
        </span>
      </motion.div>

      {/* Floating mini cards */}
      {CARDS.map((card) => (
        <motion.div
          key={card.id}
          className="absolute z-10 max-w-[130px]"
          style={{ left: card.x, top: card.y }}
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.9 }}
          animate={
            reduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: [0, -6, 0],
                  scale: 1,
                }
          }
          transition={
            reduceMotion
              ? { duration: 0.2 }
              : {
                  opacity: { delay: card.delay, duration: 0.45 },
                  scale: { delay: card.delay, duration: 0.45 },
                  y: {
                    delay: card.delay + 0.5,
                    duration: 3 + card.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }
          }
        >
          <div className="rounded-xl border border-white/80 bg-white/95 backdrop-blur-sm px-2.5 py-2 shadow-lg shadow-black/5">
            {card.badge && (
              <span className="mb-1 inline-block rounded-md bg-[#066CF4] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
                {card.badge}
              </span>
            )}
            <p className="text-[11px] font-bold text-gray-900 leading-tight truncate">{card.title}</p>
            <p className="text-[9px] font-medium text-gray-500 mt-0.5">{card.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
