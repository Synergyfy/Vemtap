'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Store, Tag, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { MOCK_BUSINESSES, MOCK_TRENDING, HOME_CATEGORIES } from './mockData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  type: 'deal' | 'business' | 'category' | 'location';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
};

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches] = useState(['Restaurants near me', 'Fashion deals', 'Electronics Abuja']);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    MOCK_BUSINESSES.forEach((biz) => {
      if (biz.name.toLowerCase().includes(q) || biz.categoryName.toLowerCase().includes(q) || biz.city.toLowerCase().includes(q)) {
        found.push({
          id: biz.id,
          type: 'business',
          title: biz.name,
          subtitle: `${biz.categoryName} · ${biz.address}`,
          href: `/b/${biz.slug}`,
          icon: <Store size={16} className="text-primary" />,
        });
      }
    });

    MOCK_TRENDING.forEach((deal) => {
      if (deal.title.toLowerCase().includes(q) || deal.businessName.toLowerCase().includes(q) || deal.category.toLowerCase().includes(q) || deal.location.toLowerCase().includes(q)) {
        found.push({
          id: deal.id,
          type: 'deal',
          title: deal.title,
          subtitle: `${deal.businessName} · ${deal.location}`,
          href: `/deals`,
          icon: <Tag size={16} className="text-rose-500" />,
        });
      }
    });

    HOME_CATEGORIES.forEach((cat) => {
      if (cat.name.toLowerCase().includes(q)) {
        found.push({
          id: cat.id,
          type: 'category',
          title: cat.name,
          subtitle: `Browse ${cat.name} deals`,
          href: `/deals?category=${cat.id}`,
          icon: <span className="text-base">{cat.emoji}</span>,
        });
      }
    });

    const locations = ['Wuse 2, Abuja', 'Lekki, Lagos', 'Victoria Island, Lagos', 'Gwarinpa, Abuja', 'Ikoyi, Lagos', 'Computer Village, Lagos'];
    locations.forEach((loc) => {
      if (loc.toLowerCase().includes(q)) {
        found.push({
          id: loc,
          type: 'location',
          title: loc,
          subtitle: 'Search deals in this area',
          href: `/deals?location=${encodeURIComponent(loc)}`,
          icon: <MapPin size={16} className="text-violet-500" />,
        });
      }
    });

    setResults(found.slice(0, 8));
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 h-14 border-b border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deals, businesses, categories..."
                className="flex-1 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
              />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim() === '' ? (
                <div className="p-5">
                  {recentSearches.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Clock size={10} />
                        Recent Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => setQuery(search)}
                            className="text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Popular Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {HOME_CATEGORIES.slice(0, 6).map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/deals?category=${cat.id}`}
                          onClick={onClose}
                          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          <span>{cat.emoji}</span>
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="py-2">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{result.title}</p>
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                        {result.type}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Search size={32} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-600 mb-1">No results found</p>
                  <p className="text-xs text-gray-400">Try a different search term</p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <Link
                href={`/deals?search=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                {query.trim() ? `View all results for "${query}"` : 'Browse All Deals'}
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
