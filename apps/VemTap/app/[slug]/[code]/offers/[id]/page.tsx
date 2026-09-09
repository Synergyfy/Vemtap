'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    X,
    Clock,
    Sparkles,
    Gift,
    ShieldCheck,
} from 'lucide-react';
import ImageGallery from '@/components/ui/ImageGallery';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useCatalogueOfferDetails, CatalogueItem } from '@/services/catalogue/hooks';
import { formatPrice } from '@/lib/utils';
import ClaimDealModal from '@/components/deals/ClaimDealModal';

function formatDateLong(dateStr?: string): string {
    if (!dateStr) return 'No expiry date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'No expiry date';
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OfferDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName } = useCustomerFlowStore();

    const { data: offer, isLoading } = useCatalogueOfferDetails(params.id as string);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [previewItem, setPreviewItem] = useState<CatalogueItem | null>(null);

    const meta = useMemo(() => {
        if (!offer) return null;
        const originalPrice = offer.items.reduce((sum, i) => sum + Number(i.price), 0);
        const savings = originalPrice - offer.calculatedPrice;
        const percent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
        return { originalPrice, savings, percent };
    }, [offer]);

    const claimConfig = useMemo(() => ({
        branchId: branchId || '',
        deviceId: useCustomerFlowStore.getState().deviceId || undefined,
        sessionToken: useCustomerFlowStore.getState().sessionToken || undefined,
        successPath: `/${params.slug}/${params.code}/success`,
    }), [branchId, params.slug, params.code]);

    if (isLoading || !offer || !meta) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center pb-32">
                <Loader2 size={32} className="animate-spin text-[#0055c4]" />
            </div>
        );
    }

    const { originalPrice, savings, percent } = meta;

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-body pb-36">
            {/* ─── Header ─── */}
            <header className="fixed top-0 w-full z-50 flex justify-center transition-colors duration-300" style={{ background: 'rgba(247,249,251,0.9)', backdropFilter: 'blur(12px)' }}>
                <div className="flex items-center justify-between w-full max-w-5xl px-5 h-[44px]">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#f2f4f6] transition-colors active:scale-95 bg-white shadow-sm border border-[#c2c6d7]/30"
                    >
                        <ArrowLeft size={20} className="text-[#191c1e]" />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#727786]">Exclusive Offer</span>
                        <span className="text-[16px] font-semibold text-[#191c1e] leading-tight">{storeName}</span>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            {/* ─── Hero Image Gallery ─── */}
            <div className="relative w-full bg-[#f7f9fb]">
                <div className="max-w-5xl mx-auto px-4 pt-14">
                    {(() => {
                        const allImages = [offer.mainImage, ...(offer.galleryImages || [])].filter(Boolean) as string[];
                        return allImages.length > 0 ? (
                            <ImageGallery
                                images={allImages}
                                alt={offer.name}
                                layout="product"
                                className="w-full"
                                showDots={true}
                                showArrows={true}
                            />
                        ) : (
                            <div className="aspect-square w-full bg-gray-200 rounded-xl" />
                        );
                    })()}
                </div>
                {percent > 0 && (
                    <div className="absolute top-[70px] left-6 bg-[#ba1a1a] text-white px-3 py-1 rounded-full text-[12px] font-semibold shadow-md flex items-center gap-1 pointer-events-none z-10">
                        <Sparkles size={14} />
                        {percent}% OFF
                    </div>
                )}
            </div>

            {/* ─── Main Content ─── */}
            <main className="relative z-10 -mt-6 bg-white rounded-t-xl px-5 pt-6 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] max-w-5xl mx-auto">
                {/* Price Bento */}
                <div className="bg-[#0055c4]/5 border border-[#0055c4]/10 rounded-xl p-4 mb-6 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#0055c4]/10 rounded-full blur-xl" />
                    <div>
                        <p className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-1">Offer Price</p>
                        <div className="flex items-end gap-2">
                            <span className="text-[20px] font-bold text-[#0055c4]">
                                {Number(offer.calculatedPrice) === 0 ? 'FREE' : formatPrice(offer.calculatedPrice)}
                            </span>
                            {savings > 0 && (
                                <span className="text-[14px] text-[#727786] line-through mb-0.5">{formatPrice(originalPrice)}</span>
                            )}
                        </div>
                    </div>
                    {savings > 0 && (
                        <div className="bg-[#0055c4] text-white text-[14px] font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                            SAVE {formatPrice(savings)}
                        </div>
                    )}
                </div>

                {/* Bundle Items */}
                {offer.items.length > 0 && (
                    <section className="mb-6">
                        <h2 className="text-[18px] font-semibold text-[#191c1e] mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#0055c4]" style={{ fontSize: 20 }}>inventory_2</span>
                            What&apos;s in the bundle
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {offer.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setPreviewItem(item)}
                                    className="group bg-[#f7f9fb] border border-[#c2c6d7]/30 rounded-xl p-3 flex items-center gap-3 text-left hover:border-[#0055c4]/40 hover:shadow-sm transition-all active:scale-[0.99]"
                                >
                                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#eef2f7]">
                                        <img src={item.mainImage || '/placeholder.png'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-[#191c1e] truncate">{item.name}</p>
                                        <p className="text-[11px] font-medium text-[#0055c4] uppercase">
                                            {item.category?.name || (item.itemType === 'service' ? 'Service' : 'Product')}
                                        </p>
                                        <p className="text-[13px] font-bold text-[#424655] mt-0.5">{formatPrice(Number(item.price))}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#c2c6d7] group-hover:text-[#0055c4] transition-colors" style={{ fontSize: 18 }}>chevron_right</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                            <Clock size={18} className="text-[#0055c4]" />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Valid Until</h3>
                            <p className="text-[14px] font-semibold text-[#191c1e]">{formatDateLong(offer.endDate)}</p>
                        </div>
                    </div>
                    <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                            <Gift size={18} className="text-[#0055c4]" />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Loyalty Rewards</h3>
                            <p className="text-[14px] font-semibold text-[#191c1e]">+{offer.loyaltyPoints || 0} Pts</p>
                        </div>
                    </div>
                    <div className="bg-[#f2f4f6] p-4 rounded-xl border border-[#c2c6d7]/30 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} className="text-[#0055c4]" />
                        </div>
                        <div>
                            <h3 className="text-[12px] font-medium text-[#424655] uppercase tracking-wider mb-0.5">Availability</h3>
                            <p className="text-[14px] font-semibold text-[#191c1e]">Limited quantity</p>
                        </div>
                    </div>
                </div>

                {/* Terms */}
                {offer.terms && offer.terms.length > 0 && (
                    <section className="border-t border-[#c2c6d7]/40 pt-4">
                        <details className="group cursor-pointer [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex items-center justify-between text-[14px] font-semibold text-[#191c1e] py-2 select-none">
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#424655]" style={{ fontSize: 20 }}>gavel</span>
                                    Terms &amp; Conditions
                                </span>
                                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180">expand_more</span>
                            </summary>
                            <div className="mt-3 pb-3 text-[14px] text-[#424655] space-y-2">
                                {offer.terms.map((term: string, i: number) => (
                                    <p key={i}>• {term}</p>
                                ))}
                            </div>
                        </details>
                    </section>
                )}
            </main>

            {/* ─── Sticky Bottom Action Bar ─── */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#c2c6d7]/30 z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] pb-6 pt-3 flex justify-center">
                <div className="w-full max-w-5xl px-5">
                    <button
                        onClick={() => setShowClaimModal(true)}
                        disabled={isLoading || !offer}
                        className="w-full h-12 bg-[#0055c4] text-white text-[14px] font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-[#0055c4]/90 transition-colors active:scale-95 duration-100"
                    >
                        <Gift size={18} />
                        CLAIM DEAL — {Number(offer.calculatedPrice) === 0 ? 'FREE' : formatPrice(offer.calculatedPrice)}
                    </button>
                </div>
            </div>

            {/* ─── Item Preview Modal ─── */}
            {previewItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        onClick={() => setPreviewItem(null)}
                        className="absolute inset-0 bg-black/50"
                    />
                    <div
                        className="relative w-full max-w-lg bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                    >
                        <button
                            onClick={() => setPreviewItem(null)}
                            className="absolute top-4 right-4 z-10 size-9 bg-white shadow-md rounded-full flex items-center justify-center hover:bg-[#f2f4f6] transition-colors"
                        >
                            <X size={18} className="text-[#191c1e]" />
                        </button>
                        <div className="overflow-y-auto">
                            <div className="relative aspect-video w-full">
                                <img src={previewItem.mainImage || '/placeholder.png'} alt={previewItem.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-5 left-5 right-5">
                                    <span className="px-2.5 py-1 bg-[#0055c4] text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block">
                                        {previewItem.category?.name || (previewItem.itemType === 'service' ? 'Service' : 'Product')}
                                    </span>
                                    <h2 className="text-[22px] font-bold text-white tracking-tight leading-tight">{previewItem.name}</h2>
                                </div>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#727786]">Description</h4>
                                    <p className="text-[14px] leading-relaxed text-[#424655] whitespace-pre-wrap">
                                        {previewItem.description || previewItem.shortDescription || 'No description available for this item.'}
                                    </p>
                                    <p className="text-[18px] font-bold text-[#191c1e] pt-1">{formatPrice(Number(previewItem.price))}</p>
                                </div>
                                <button
                                    onClick={() => setPreviewItem(null)}
                                    className="w-full py-3.5 bg-[#0055c4] text-white font-semibold rounded-xl hover:bg-[#0055c4]/90 transition-all uppercase tracking-widest text-[12px]"
                                >
                                    Back to Offer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Claim Deal Modal ─── */}
            <ClaimDealModal
                isOpen={showClaimModal}
                onClose={() => setShowClaimModal(false)}
                deal={{
                    id: offer.id,
                    title: offer.name,
                    businessName: storeName,
                    image: offer.mainImage || '',
                    dealPrice: Number(offer.calculatedPrice),
                    originalPrice,
                    discountLabel: percent > 0 ? `${percent}% OFF` : '',
                    slug: params.slug as string,
                }}
                claimConfig={claimConfig}
            />
        </div>
    );
}