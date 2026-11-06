'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Utensils, Shirt, Laptop, Sparkles, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealCard {
  icon: React.ElementType;
  title: string;
  badge?: string;
  x: string;
  y: string;
  delay: number;
  rotation: number;
}

const DEALS: DealCard[] = [
  { icon: Utensils, title: 'Food & Drinks', badge: '20% OFF', x: '8%', y: '10%', delay: 0.1, rotation: -4 },
  { icon: Shirt, title: 'Fashion', badge: 'Sale', x: '60%', y: '5%', delay: 0.25, rotation: 3 },
  { icon: Laptop, title: 'Electronics', x: '70%', y: '45%', delay: 0.4, rotation: -2 },
  { icon: Sparkles, title: 'Beauty', badge: 'New', x: '5%', y: '55%', delay: 0.55, rotation: 5 },
  { icon: Wrench, title: 'Services', x: '50%', y: '72%', delay: 0.7, rotation: -3 },
];

interface DealsConstellationProps {
  className?: string;
}

export default function DealsConstellation({ className }: DealsConstellationProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative w-full aspect-square max-w-[380px] mx-auto',
        'rounded-[2rem] overflow-hidden',
        'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/40',
        'border border-amber-100/60 shadow-xl shadow-amber-500/5',
        className
      )}
      aria-hidden
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.08),transparent_60%)]" />

      {/* Constellation lines */}
      <svg className="absolute inset-0 size-full z-0" viewBox="0 0 380 380">
        {DEALS.map((deal, i) => {
          const x = (parseFloat(deal.x) / 100) * 380 + 22;
          const y = (parseFloat(deal.y) / 100) * 380 + 22;
          const next = DEALS[(i + 1) % DEALS.length];
          const nx = (parseFloat(next.x) / 100) * 380 + 22;
          const ny = (parseFloat(next.y) / 100) * 380 + 22;
          return (
            <motion.line
              key={i}
              x1={x}
              y1={y}
              x2={nx}
              y2={ny}
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="4 4"
              strokeOpacity="0.15"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: deal.delay + 0.3, duration: 0.8 }}
            />
          );
        })}
      </svg>

      {/* Floating deal cards */}
      {DEALS.map((deal) => {
        const Icon = deal.icon;
        return (
          <motion.div
            key={deal.title}
            className="absolute z-10 max-w-[120px]"
            style={{ left: deal.x, top: deal.y }}
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.9, rotate: deal.rotation }}
            animate={
              reduceMotion
                ? { opacity: 1, rotate: deal.rotation }
                : {
                    opacity: 1,
                    y: [0, -6, 0],
                    scale: 1,
                    rotate: deal.rotation,
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : {
                    opacity: { delay: deal.delay, duration: 0.45 },
                    scale: { delay: deal.delay, duration: 0.45 },
                    y: {
                      delay: deal.delay + 0.5,
                      duration: 3 + deal.delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
            }
          >
            <div className="rounded-xl border border-white/80 bg-white/95 backdrop-blur-sm px-2.5 py-2 shadow-lg shadow-black/5">
              {deal.badge && (
                <span className="mb-1 inline-block rounded-md bg-amber-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
                  {deal.badge}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <Icon size={14} className="text-amber-500 shrink-0" />
                <p className="text-[11px] font-bold text-gray-900 leading-tight">{deal.title}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
