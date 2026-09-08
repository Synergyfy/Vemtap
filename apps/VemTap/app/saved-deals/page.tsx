'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSavedDeals } from '@/services/deals/engagement-hooks';
import { formatNaira } from '@/components/home/mappers';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import { Bookmark, Search, ArrowLeft, Loader2 } from 'lucide-react';

const C = {
  bg: '#f7f9fb',
  primary: '#0055c4',
  onSurface: '#191c1e',
  onSurfaceVariant: '#424655',
  outline: '#727786',
  outlineVariant: '#c2c6d7',
};

export default function SavedDealsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSavedDeals(page, 20);

  const savedDeals = data?.data || [];
  const totalPages = data?.totalPages || 1;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen font-sans flex flex-col" style={{ background: C.bg }}>
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: C.outlineVariant }}>
          <div className="vemtap-container h-[56px] flex items-center gap-4">
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
              <ArrowLeft size={18} style={{ color: C.onSurface }} />
            </button>
            <h1 className="text-[16px] font-bold" style={{ color: C.onSurface }}>Saved Deals</h1>
          </div>
        </header>

        {/* Empty / Auth Required State */}
        <main className="flex-1 flex items-center justify-center px-6 pb-20 md:pb-0">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Bookmark size={36} className="text-gray-300" />
            </div>
            <h2 className="text-[20px] font-bold mb-2" style={{ color: C.onSurface }}>Sign in to see saved deals</h2>
            <p className="text-[14px] mb-6" style={{ color: C.onSurfaceVariant }}>
              Save deals you love and they&apos;ll appear here for easy access later.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-white font-bold text-[13px] uppercase tracking-wider"
              style={{ background: C.primary }}
            >
              Sign In
            </Link>
          </div>
        </main>

        <PublicBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: C.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: C.outlineVariant }}>
        <div className="vemtap-container h-[56px] flex items-center gap-4">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <ArrowLeft size={18} style={{ color: C.onSurface }} />
          </button>
          <h1 className="text-[16px] font-bold" style={{ color: C.onSurface }}>Saved Deals</h1>
          {!isLoading && savedDeals.length > 0 && (
            <span className="ml-auto text-[12px] font-medium px-2.5 py-1 rounded-full bg-gray-100" style={{ color: C.onSurfaceVariant }}>
              {savedDeals.length} {savedDeals.length === 1 ? 'deal' : 'deals'}
            </span>
          )}
        </div>
      </header>

      <main className="vemtap-container py-6 pb-24 md:pb-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin" style={{ color: C.primary }} />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <p className="text-[14px] text-red-500 mb-4">Failed to load saved deals</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: C.primary, color: '#fff' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && savedDeals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Bookmark size={36} className="text-gray-300" />
            </div>
            <h2 className="text-[20px] font-bold mb-2" style={{ color: C.onSurface }}>No saved deals yet</h2>
            <p className="text-[14px] max-w-sm mx-auto mb-6" style={{ color: C.onSurfaceVariant }}>
              When you find a deal you love, tap the bookmark icon to save it here for later. Your favorites, always one tap away.
            </p>
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-[13px] uppercase tracking-wider"
              style={{ background: C.primary }}
            >
              <Search size={16} />
              Browse Deals
            </Link>
          </div>
        )}

        {/* Saved Deals Grid */}
        {!isLoading && !error && savedDeals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {savedDeals.map((deal: any) => {
              const dealPrice = deal.dealPrice ?? deal.price ?? null;
              const originalPrice = deal.originalPrice ?? null;
              const discountPercent = deal.discountPercent || (originalPrice && dealPrice ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : null);
              const href = deal.business?.slug
                ? `/deals/${deal.business.slug}/${deal.id}`
                : `/deals?search=${encodeURIComponent(deal.name || '')}`;

              return (
                <div
                  key={deal.id}
                  className="rounded-xl overflow-hidden shadow-sm relative group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col"
                  style={{ background: '#ffffff', border: `1px solid ${C.outlineVariant}` }}
                >
                  <Link href={href} className="block flex-1">
                    <div className="h-[120px] md:h-[160px] relative w-full overflow-hidden" style={{ background: C.outlineVariant }}>
                      <img
                        src={deal.mainImage || deal.image || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=400&fit=crop'}
                        alt={deal.name || deal.title || 'Saved deal'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {discountPercent && discountPercent > 0 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-bold bg-red-500 text-white" style={{ fontSize: 10, lineHeight: '14px' }}>
                          {discountPercent}% OFF
                        </div>
                      )}
                      {deal.discountLabel === 'FREE' && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-bold bg-green-600 text-white" style={{ fontSize: 10, lineHeight: '14px' }}>
                          FREE
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <h3 className="text-[13px] md:text-[14px] font-semibold line-clamp-1" style={{ color: C.onSurface }}>
                        {deal.business?.name || deal.businessName || 'Business'}
                      </h3>
                      <p className="text-[11px] md:text-[12px] line-clamp-1" style={{ color: C.onSurfaceVariant }}>
                        {deal.name || deal.title || 'Exclusive Offer'}
                      </p>
                      <div className="flex items-center gap-2">
                        {dealPrice != null && (
                          <span className="text-[14px] md:text-[16px] font-bold" style={{ color: C.primary }}>
                            {Number(dealPrice) === 0 ? 'FREE' : formatNaira(dealPrice)}
                          </span>
                        )}
                        {originalPrice != null && dealPrice != null && originalPrice > dealPrice && (
                          <span className="text-[11px] line-through" style={{ color: C.outline }}>
                            {formatNaira(originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-2">
                    <DealEngagementBar
                      offerId={deal.id}
                      offerTitle={deal.name || deal.title || ''}
                      offerDescription={deal.description || ''}
                      dealUrl={href}
                      businessName={deal.business?.name || ''}
                      compact
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
              style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurface }}
            >
              Previous
            </button>
            <span className="text-sm font-medium px-3" style={{ color: C.onSurfaceVariant }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
              style={{ background: C.primary, color: '#fff' }}
            >
              Next
            </button>
          </div>
        )}
      </main>

      <PublicBottomNav />
    </div>
  );
}
