'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  popular?: string[];
}

const DEFAULT_POPULAR = ['Food', 'Fashion', 'Beauty', 'Electronics', 'Services'];

export default function SearchBar({
  className,
  placeholder = 'Search deals, businesses or locations',
  popular = DEFAULT_POPULAR,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (value: string) => {
    const q = value.trim();
    if (!q) {
      router.push('/deals');
      return;
    }
    router.push(`/deals?q=${encodeURIComponent(q)}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={onSubmit} className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search deals, businesses or locations"
          className={cn(
            'w-full h-14 pl-11 pr-4 rounded-2xl',
            'bg-white border border-gray-200 text-sm font-medium text-gray-900',
            'placeholder:text-gray-400 shadow-sm shadow-black/[0.03]',
            'focus:outline-none focus:ring-2 focus:ring-[#066CF4]/25 focus:border-[#066CF4]/40',
            'transition-shadow'
          )}
        />
      </form>
      {popular.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Popular near you
          </span>
          {popular.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => submit(item)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:border-[#066CF4]/40 hover:text-[#066CF4] active:scale-95 transition-all"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
