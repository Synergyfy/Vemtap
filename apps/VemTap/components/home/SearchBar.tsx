'use client';

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import SearchModal from './SearchModal';

interface SearchBarProps {
  locationLabel?: string | null;
  onLocationClick?: () => void;
  compact?: boolean;
  className?: string;
}

export default function SearchBar({ locationLabel, onLocationClick, compact, className }: SearchBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <div className={`w-full ${compact ? '' : 'max-w-xl mx-auto'} ${className ?? ''}`}>
        <button
          onClick={() => setSearchOpen(true)}
          className={`w-full flex items-center gap-2.5 bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all group cursor-text ${
            compact ? 'h-10 sm:h-12 px-3 sm:px-4 rounded-xl' : 'h-11 sm:h-14 px-3.5 sm:px-5 rounded-xl sm:rounded-2xl shadow-sm'
          }`}
        >
          <Search size={compact ? 15 : 16} className="text-gray-400 group-hover:text-primary transition-colors shrink-0" />
          <span className={`text-gray-400 group-hover:text-gray-500 flex-1 text-left truncate ${compact ? 'text-xs' : 'text-[13px] sm:text-[15px]'}`}>
            Search deals, businesses or locations
          </span>
          {onLocationClick && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onLocationClick();
              }}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors shrink-0"
            >
              <MapPin size={12} />
              {locationLabel ? (
                <span className="max-w-[100px] truncate">{locationLabel}</span>
              ) : (
                'Near Me'
              )}
            </span>
          )}
        </button>
      </div>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
