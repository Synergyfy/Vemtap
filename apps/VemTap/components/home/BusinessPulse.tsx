'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Store, User, Star, ShoppingBag, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

const CUSTOMERS = [
  { icon: User, x: '10%', y: '15%', delay: 0.2 },
  { icon: ShoppingBag, x: '75%', y: '10%', delay: 0.4 },
  { icon: Coffee, x: '85%', y: '55%', delay: 0.6 },
  { icon: Star, x: '15%', y: '70%', delay: 0.8 },
];

interface BusinessPulseProps {
  className?: string;
}

export default function BusinessPulse({ className }: BusinessPulseProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative w-full aspect-square max-w-[380px] mx-auto',
        'rounded-[2rem] overflow-hidden',
        'bg-gradient-to-br from-emerald-50/80 via-white to-[#066CF4]/[0.05]',
        'border border-emerald-100/60 shadow-xl shadow-emerald-500/5',
        className
      )}
      aria-hidden
    >
      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_60%)]" />

      {/* Orbit rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[50%] rounded-full border border-emerald-200/40" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[75%] rounded-full border border-dashed border-emerald-200/25" />

      {/* Center business marker */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
        initial={reduceMotion ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="relative flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
          animate={
            reduceMotion
              ? undefined
              : {
                  boxShadow: [
                    '0 10px 25px -5px rgba(16,185,129,0.4)',
                    '0 10px 35px -5px rgba(16,185,129,0.55)',
                    '0 10px 25px -5px rgba(16,185,129,0.4)',
                  ],
                }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Store size={26} />
          {!reduceMotion && (
            <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30" />
          )}
        </motion.div>
        <span className="mt-2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 shadow-sm border border-emerald-100">
          Your Business
        </span>
      </motion.div>

      {/* Customer icons */}
      {CUSTOMERS.map((customer, i) => {
        const Icon = customer.icon;
        return (
          <motion.div
            key={i}
            className="absolute z-10"
            style={{ left: customer.x, top: customer.y }}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: 1,
                    y: [0, -5, 0],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0.2 }
                : {
                    opacity: { delay: customer.delay, duration: 0.5 },
                    scale: { delay: customer.delay, duration: 0.5 },
                    y: {
                      delay: customer.delay + 0.5,
                      duration: 3 + i * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
            }
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-lg shadow-black/5 text-emerald-500">
              <Icon size={18} />
            </div>
          </motion.div>
        );
      })}

      {/* Connecting lines */}
      <svg className="absolute inset-0 size-full z-0" viewBox="0 0 380 380">
        {CUSTOMERS.map((customer, i) => {
          const cx = 190;
          const cy = 190;
          const x = (parseFloat(customer.x) / 100) * 380;
          const y = (parseFloat(customer.y) / 100) * 380;
          return (
            <motion.line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="4 4"
              strokeOpacity="0.2"
              initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: customer.delay + 0.3, duration: 0.8 }}
            />
          );
        })}
      </svg>
    </div>
  );
}
