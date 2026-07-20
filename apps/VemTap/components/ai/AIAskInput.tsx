'use client';

import React, { useState, useRef } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { AI_CREDIT_COST } from '@/services/ai/types';

interface AIAskInputProps {
  page: string;
  placeholder?: string;
  onSubmit?: (query: string) => void;
  disabled?: boolean;
}

export default function AIAskInput({
  page,
  placeholder = 'Ask AI about your business...',
  onSubmit,
  disabled = false,
}: AIAskInputProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed || disabled) return;
    onSubmit?.(trimmed);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-2 bg-white border rounded-2xl transition-all ${
          isFocused ? 'border-primary ring-4 ring-primary/5 shadow-sm' : 'border-gray-200'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="pl-4 flex items-center text-gray-400">
          <Sparkles size={16} aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 h-12 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none min-w-0"
          aria-label={placeholder}
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || disabled}
          className="mr-2 size-9 rounded-xl bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Ask AI"
        >
          <ArrowUp size={16} />
        </button>
      </div>

      {isFocused && (
        <p className="text-[10px] text-gray-400 mt-1.5 px-1 flex items-center gap-1">
          <span className="inline-block size-1 rounded-full bg-gray-300" />
          Quick analysis consumes {AI_CREDIT_COST.quickAnalysis} credit
        </p>
      )}
    </div>
  );
}
