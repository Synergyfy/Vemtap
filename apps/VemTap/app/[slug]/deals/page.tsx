'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useCatalogueOffersPublic } from '@/services/catalogue/hooks';
import { fetchContextByUsername } from '@/lib/api/devices';
import { formatDealPrice } from '@/lib/promotions';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import DealEngagementBar from '@/components/deals/DealEngagementBar';

export default function BusinessDealsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [searchQuery] = useState('');
    const [branchId, setBranchId] = useState('');
    const [businessName, setBusinessName] = useState('Business');
    const [resolving, setResolving] = useState(true);

    useEffect(() => {
        const resolve = async () => {
            try {
                const ctx = await fetchContextByUsername(slug);
                if (ctx?.business) {
                    setBranchId(ctx.business.id || '');
                    setBusinessName(ctx.business.name || 'Business');
                }
            } catch {
                // slug may be a branch code, not username
            } finally {
                setResolving(false);
            }
        };
        resolve();
    }, [slug]);

    const { data: apiDeals, isLoading: apiLoading } = useCatalogueOffersPublic(branchId, {
        search: searchQuery || undefined,
    }, { enabled: !!branchId });

    const deals = useMemo(() => {
        return apiDeals?.data || [];
    }, [apiDeals]);

    const isLoading = resolving || (apiLoading && !!branchId);

    return (
        <div className="min-h-screen bg-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Fixed Header */}
            <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex items-center justify-center">
                <div className="w-full max-w-5xl flex items-center justify-between px-5 h-14">
                    <button
                        onClick={() => router.back()}
                        aria-label="Go back"
                        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <ArrowLeft size={20} className="text-primary" />
                    </button>
                    <h1 className="font-semibold text-base text-primary truncate mx-4">Active Deals</h1>
                    <div className="w-8" />
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-14 pb-20">
                <div className="max-w-5xl mx-auto px-5 space-y-6">
                    {/* Header Info */}
                    <section className="text-center space-y-2 pt-4">
                        <h2 className="text-2xl font-semibold text-on-surface">Active Deals</h2>
                        <p className="text-sm text-on-surface-variant">{businessName}</p>
                    </section>

                    {/* Deals Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border border-outline-variant overflow-hidden animate-pulse">
                                    <div className="h-48 w-full bg-gray-200" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-5 bg-gray-200 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {deals.map((deal: Record<string, unknown>) => {
                                const dealId = (deal.id as string) || '';
                                const title = (deal.title as string) || (deal.name as string) || 'Deal';
                                const description = (deal.description as string) || '';
                                const dealPrice = (deal.dealPrice as number) ?? (deal.calculatedPrice as number) ?? (deal.price as number) ?? 0;
                                const originalPrice = (deal.originalPrice as number) ?? (deal.price as number) ?? 0;
                                const discountPercent = (deal.discountPercent as number) ?? (originalPrice > dealPrice ? Math.round(((originalPrice - dealPrice) / originalPrice) * 100) : null);
                                const badge = (deal.badge as string) || (deal.discountLabel as string) || (discountPercent ? `${discountPercent}% OFF` : null);
                                const image = (deal.image as string) || (deal.mainImage as string) || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop';
                                const time = (deal.time as string) || 'Limited time';
                                const href = (deal.href as string) || `/deals/${slug}/${dealId}/preview`;
                                const businessNameStr = (deal.businessName as string) || businessName;

                                return (
                                    <div
                                        key={dealId}
                                        className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <Link href={href} className="block">
                                            <div
                                                className="h-48 w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${image})` }}
                                            />
                                            <div className="p-4 flex flex-col space-y-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="text-base font-semibold text-on-surface line-clamp-2 pr-2">{title}</h3>
                                                    {badge && (
                                                        <span className="shrink-0 bg-error-container text-onErrorContainer text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                                                            {badge}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-xl font-bold text-primary">
                                                        {dealPrice === 0 ? 'FREE' : formatDealPrice(dealPrice)}
                                                    </span>
                                                    {originalPrice > dealPrice && (
                                                        <span className="text-sm text-outline line-through mb-0.5">
                                                            {formatDealPrice(originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center text-on-surface-variant pt-2 border-t border-outline-variant">
                                                    <Clock size={14} className="mr-1" />
                                                    <span className="text-xs font-medium">{time}</span>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="px-4 pb-3">
                                            <DealEngagementBar
                                                offerId={dealId}
                                                offerTitle={title}
                                                offerDescription={description}
                                                dealUrl={href}
                                                businessName={businessNameStr}
                                                compact
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </section>
                    )}

                    {!isLoading && deals.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-on-surface-variant">No active deals available from this business.</p>
                        </div>
                    )}
                </div>
            </main>

            <PublicBottomNav />
        </div>
    );
}
