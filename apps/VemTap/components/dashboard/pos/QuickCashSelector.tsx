'use client';

import React from 'react';
import { Banknote, Check } from 'lucide-react';

interface QuickCashSelectorProps {
  totalAmount: number;
  selectedAmount: number;
  onSelectAmount: (amount: number) => void;
  currencySymbol?: string;
}

export function QuickCashSelector({
  totalAmount,
  selectedAmount,
  onSelectAmount,
  currencySymbol = '₦',
}: QuickCashSelectorProps) {
  const quickValues = React.useMemo(() => {
    if (totalAmount <= 0) return [500, 1000, 2000, 5000, 10000, 20000];

    const values = new Set<number>();
    values.add(totalAmount); // Exact amount

    // Next round 500
    const next500 = Math.ceil(totalAmount / 500) * 500;
    if (next500 > totalAmount) values.add(next500);

    // Common bills above total
    const bills = [1000, 2000, 5000, 10000, 20000, 50000];
    bills.forEach((b) => {
      if (b >= totalAmount) values.add(b);
    });

    return Array.from(values).sort((a, b) => a - b).slice(0, 6);
  }, [totalAmount]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
          <Banknote size={14} className="text-[#066CF4]" /> Quick Cash Presets
        </span>
        <span className="text-xs font-bold text-gray-400">Tap to select amount</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {quickValues.map((val) => {
          const isExact = val === totalAmount;
          const isSelected = selectedAmount === val;

          return (
            <button
              key={val}
              type="button"
              onClick={() => onSelectAmount(val)}
              className={`relative h-14 sm:h-16 px-3 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center justify-center font-black active:scale-95 ${
                isSelected
                  ? 'border-[#066CF4] bg-blue-50 text-[#066CF4] shadow-md shadow-blue-500/10 scale-[1.02]'
                  : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isExact && (
                <span className="absolute top-1 left-2 text-[8px] font-black uppercase tracking-wider text-[#066CF4] bg-blue-100/80 px-1.5 py-0.2 rounded-full">
                  Exact
                </span>
              )}
              <span className="text-base sm:text-lg">
                {currencySymbol}
                {val.toLocaleString()}
              </span>
              {isSelected && (
                <Check
                  size={14}
                  className="absolute top-2 right-2 text-[#066CF4]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
