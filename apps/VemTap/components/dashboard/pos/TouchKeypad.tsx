'use client';

import React from 'react';
import { Delete, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TouchKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  onClear?: () => void;
  allowDecimal?: boolean;
  className?: string;
}

export function TouchKeypad({
  value,
  onChange,
  onEnter,
  onClear,
  allowDecimal = false,
  className,
}: TouchKeypadProps) {
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
      return;
    }

    if (key === 'clear') {
      if (onClear) onClear();
      else onChange('');
      return;
    }

    if (key === '.') {
      if (!allowDecimal || value.includes('.')) return;
      onChange(value === '' ? '0.' : value + '.');
      return;
    }

    if (key === '00' || key === '000') {
      if (value === '' || value === '0') return;
      onChange(value + key);
      return;
    }

    // Number keys
    if (value === '0') {
      onChange(key);
    } else {
      onChange(value + key);
    }
  };

  return (
    <div className={cn('grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner select-none', className)}>
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => handleKeyPress(num)}
          className="h-14 sm:h-16 rounded-xl bg-white border border-gray-200 text-xl sm:text-2xl font-black text-gray-800 shadow-sm active:scale-95 active:bg-gray-100 hover:border-blue-400 transition-all flex items-center justify-center"
        >
          {num}
        </button>
      ))}

      {allowDecimal ? (
        <button
          type="button"
          onClick={() => handleKeyPress('.')}
          className="h-14 sm:h-16 rounded-xl bg-white border border-gray-200 text-2xl font-black text-gray-800 shadow-sm active:scale-95 active:bg-gray-100 hover:border-blue-400 transition-all flex items-center justify-center"
        >
          .
        </button>
      ) : (
        <button
          type="button"
          onClick={() => handleKeyPress('00')}
          className="h-14 sm:h-16 rounded-xl bg-gray-100 border border-gray-200 text-sm font-black text-gray-600 shadow-sm active:scale-95 active:bg-gray-200 hover:border-blue-400 transition-all flex items-center justify-center"
        >
          00
        </button>
      )}

      <button
        type="button"
        onClick={() => handleKeyPress('0')}
        className="h-14 sm:h-16 rounded-xl bg-white border border-gray-200 text-xl sm:text-2xl font-black text-gray-800 shadow-sm active:scale-95 active:bg-gray-100 hover:border-blue-400 transition-all flex items-center justify-center"
      >
        0
      </button>

      <button
        type="button"
        onClick={() => handleKeyPress('backspace')}
        className="h-14 sm:h-16 rounded-xl bg-red-50 border border-red-200 text-red-600 shadow-sm active:scale-95 active:bg-red-100 hover:border-red-400 transition-all flex items-center justify-center"
        title="Backspace"
      >
        <Delete size={22} />
      </button>

      <button
        type="button"
        onClick={() => handleKeyPress('clear')}
        className="col-span-1 h-12 rounded-xl bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider active:scale-95 hover:bg-gray-300 transition-all flex items-center justify-center gap-1"
      >
        <X size={16} /> Clear
      </button>

      {onEnter && (
        <button
          type="button"
          onClick={onEnter}
          className="col-span-2 h-12 rounded-xl bg-[#066CF4] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-500/20 active:scale-95 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
        >
          <Check size={18} /> Confirm
        </button>
      )}
    </div>
  );
}
