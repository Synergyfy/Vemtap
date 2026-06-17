'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Star, ArrowRight,
    Home, ChevronRight, ChevronLeft, ShieldCheck, Truck, Headset,
    Share2, X, CheckCircle2, Play, ChevronDown, AlertTriangle
} from 'lucide-react';
import { fetchProductDetail, requestQuote, createOrder } from '@/lib/api/marketplace';
import { ProductDetailSkeleton } from '@/components/marketplace/Skeletons';
import useEmblaCarousel from 'embla-carousel-react';
import toast from 'react-hot-toast';
import { loadPaystackScript } from '@/lib/loadPaystackScript';
import { useAuthStore } from '@/store/useAuthStore';
import { calculateQuotePrice } from '@/lib/utils/calculateQuotePrice';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ProductClient({ id }: { id: string }) {
    const router = useRouter();

    const { data: product, isLoading, isError } = useQuery({
        queryKey: ['product', id],
        queryFn: () => fetchProductDetail(id)
    });

    const { user } = useAuthStore();
    const [selectedImage, setSelectedImage] = useState(0);
    const [activeTab, setActiveTab] = useState<'specs' | 'how-to' | 'reviews'>('specs');
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'quote' | 'moq' | 'consultation'>('quote');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [moqWarning, setMoqWarning] = useState(false);

    const [quoteData, setQuoteData] = useState({
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        phone: (user as any)?.phone || '',
        company: (user as any)?.businessName || '',
        quantity: '',
        location: '',
        notes: ''
    });

    React.useEffect(() => {
        if (user) {
            setQuoteData(prev => ({
                ...prev,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                phone: (user as any).phone || '',
                company: (user as any).businessName || ''
            }));
        }
    }, [user]);
    const [reviews, setReviews] = React.useState([
        { id: 1, user: 'Samuel O.', rating: 5, date: '2 days ago', comment: 'Excellent quality, exactly what we needed for our office access system.', approved: true },
        { id: 2, user: 'Chioma A.', rating: 4, date: '1 week ago', comment: 'Good value for money. Setup was straightforward.', approved: true },
    ]);
    const [newReview, setNewReview] = React.useState({ rating: 5, comment: '' });
    const [showReviewSuccess, setShowReviewSuccess] = React.useState(false);
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });



    React.useEffect(() => {
        if (emblaApi) {
            emblaApi.on('select', () => {
                setSelectedImage(emblaApi.selectedScrollSnap());
            });
        }
    }, [emblaApi]);

    const scrollToImage = (index: number) => {
        if (emblaApi) emblaApi.scrollTo(index);
    };

    if (isLoading) return <ProductDetailSkeleton />;
    if (isError || !product) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Product not found</h2>
            <button onClick={() => router.back()} className="text-primary underline">Go Back</button>
        </div>
    );

    const handleShare = async () => {
        const shareData = {
            title: `VemTap - ${product.name}`,
            text: product.description,
            url: window.location.href
        };

        try {
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            }
        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                console.error('Share failed:', err);
                toast.error('Sharing failed');
            }
        }
    };





    const handleQuoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('Please login to request a quote');
            return;
        }

        const quantity = parseInt(quoteData.quantity);
        if (isNaN(quantity) || quantity < 1) {
            toast.error('Please enter a valid quantity');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestQuote(product.id, {
                quantity,
                location: quoteData.location,
                businessName: quoteData.company,
                notes: quoteData.notes || 'Interested in this product'
            });

            toast.success(`Quote request sent for ${product.name}!`);
            setIsQuoteModalOpen(false);
            setActiveTab('specs');
            setQuoteData({
                firstName: user?.name?.split(' ')[0] || '',
                lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                email: user?.email || '',
                phone: (user as any)?.phone || '',
                company: (user as any)?.businessName || '',
                quantity: '',
                location: '',
                notes: ''
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit quote request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBuyNow = async () => {
        if (!user) {
            toast.error('Please login to place an order');
            return;
        }

        const quantity = parseInt(quoteData.quantity);
        if (isNaN(quantity) || quantity < 1) {
            toast('Please select a quantity in the Request Quote form (or we will use the MOQ)');
            // Fallback to MOQ if not specified in form
        }

        const finalQuantity = quantity || product.moq || 1;
        const totalAmount = finalQuantity * product.price;

        const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

        if (!publicKey || publicKey.includes('placeholder')) {
            toast.error('Payment gateway not configured');
            return;
        }

        setIsSubmitting(true);

        try {
            await loadPaystackScript();
            // @ts-ignore
            const handler = window.PaystackPop.setup({
                key: publicKey,
                email: user.email,
                amount: totalAmount * 100,
                currency: 'NGN',
                ref: `ORD-${user.id}-${Date.now()}`,
                onClose: () => {
                    setIsSubmitting(false);
                    toast.error('Payment cancelled');
                },
                callback: function (response: any) {
                    createOrder({
                        productId: product.id,
                        quantity: finalQuantity,
                        paymentReference: response.reference
                    }).then(() => {
                        toast.success('Order placed successfully!');
                        router.push('/dashboard/hardware');
                    }).catch((err: any) => {
                        toast.error(err.message || 'Failed to complete order after payment. Please contact support.');
                    }).finally(() => {
                        setIsSubmitting(false);
                    });
                }
            });
            handler.openIframe();
        } catch (err) {
            setIsSubmitting(false);
            toast.error('Failed to initialize payment');
        }
    };

    return (
        <div className="min-h-screen bg-white pb-0">
            <Navbar />

            <main className="max-w-350 mx-auto px-4 md:px-8 py-8 pt-28">
                {/* Breadcrumb */}
                <nav className="flex mb-8 text-sm font-medium text-slate-500">
                    <Link href="/" className="hover:text-primary flex items-center gap-1"><Home size={14} /> Home</Link>
                    <ChevronRight size={14} className="mx-2 self-center" />
                    <Link href="/marketplace" className="hover:text-primary">Marketplace</Link>
                    <ChevronRight size={14} className="mx-2 self-center" />
                    <span className="text-slate-900 font-bold">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Images */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm">
                            <div className="h-full w-full" ref={emblaRef}>
                                <div className="flex h-full">
                                    {product.images.map((img: string, i: number) => (
                                        <div className="flex-[0_0_100%] min-w-0 relative flex items-center justify-center p-12" key={i}>
                                            <img
                                                src={img}
                                                alt={`${product.name} - View ${i + 1}`}
                                                className="max-w-full h-full object-contain"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute top-6 left-6 z-10">
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${product.tagColor}`}>
                                    {product.tag}
                                </span>
                            </div>

                            {/* Chevron Controls */}
                            <div className="absolute inset-y-0 left-4 flex items-center z-20">
                                <button
                                    onClick={() => emblaApi?.scrollPrev()}
                                    className="p-3 bg-white/90 hover:bg-white text-slate-900 rounded-xl shadow-xl border border-slate-100 transition-all active:scale-95 group"
                                >
                                    <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                            <div className="absolute inset-y-0 right-4 flex items-center z-20">
                                <button
                                    onClick={() => emblaApi?.scrollNext()}
                                    className="p-3 bg-white/90 hover:bg-white text-slate-900 rounded-xl shadow-xl border border-slate-100 transition-all active:scale-95 group"
                                >
                                    <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {product.images.map((img: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => scrollToImage(i)}
                                    className={`aspect-square rounded-xl border-2 overflow-hidden bg-white hover:opacity-100 transition-all ${selectedImage === i ? 'border-primary opacity-100 shadow-lg shadow-primary/10' : 'border-slate-200 opacity-60 hover:border-slate-300'}`}
                                >
                                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain p-2" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Product Details */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-green-100 text-green-800">
                                    In Stock
                                </span>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                                >
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.floor(product.rating || 4.5) ? "text-primary fill-primary" : "text-slate-300"} />
                                    ))}
                                    <span className="text-xs font-bold text-slate-500 ml-1 underline decoration-primary/30">({product.reviews ?? 0} Reviews)</span>
                                </button>
                            </div>
                            <h1 className="text-4xl font-display font-bold text-slate-900 mb-2 leading-tight">{product.name}</h1>

                            <p className="text-slate-600 leading-relaxed font-medium line-clamp-4">
                                {product.longDescription || product.description}
                            </p>

                            <div className="flex items-center gap-6 pt-2">
                                <button onClick={handleShare} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                    <Share2 size={14} /> Share Product
                                </button>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <div className="text-xs font-medium text-slate-500">
                                    <span className="font-bold text-slate-900">Price per unit:</span> ₦{product.price.toLocaleString()}
                                </div>
                                <div className="h-4 w-px bg-slate-200"></div>
                                <div className="text-xs font-medium text-slate-500">
                                    <span className="font-bold text-slate-900">Lower than MOQ:</span> Contact for pricing
                                </div>
                            </div>
                        </div>

                        {/* Pricing Tiers */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                            <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Volume Pricing</h4>
                            <div className="space-y-2">
                                {product.tieredPricing?.map((tier: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0">
                                        <span className="text-sm font-medium text-slate-600">
                                            {tier.minQuantity} - {tier.maxQuantity || '∞'} units
                                        </span>
                                        `                                                                          <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                                                {typeof tier.price === 'number' ? `₦${tier.price.toLocaleString()}` : 'Contact for quote'}
                                            </span>

                                            {typeof tier.price === 'number' && (
                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                    / unit
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Minimum Order Display */}
                        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Minimum Quantity</span>
                                <span className="text-2xl font-black text-primary">{product.moq || product.tieredPricing?.[0]?.minQuantity || 1} Pieces</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">Unit Price</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-900">₦{product.price.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">/ unit</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setModalType('quote'); setIsQuoteModalOpen(true); }}
                                disabled={isSubmitting}
                                className="w-full mt-4 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Request Quote'}
                                {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </div>

                        {/* MOQ Quote Section */}
                        <div id="moq-quote-section" className="bg-amber-50 p-6 rounded-2xl border border-amber-200 space-y-3">
                            <div className="flex items-center gap-2">
                                <ChevronDown size={18} className="text-amber-700 animate-bounce" />
                                <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">Need Less Than {product.moq || product.tieredPricing?.[0]?.minQuantity || 1} Units?</h4>
                            </div>
                            <p className="text-sm text-amber-800 font-medium">Contact us for special pricing on smaller quantities</p>
                            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                                <span className="material-icons-round text-lg">phone</span>
                                <a href="tel:+2348012345678" className="hover:underline">+234 801 234 5678</a>
                            </div>
                            <button
                                onClick={() => { setModalType('moq'); setIsQuoteModalOpen(true); }}
                                className="w-full py-3 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                            >
                                <ChevronDown size={16} />
                                Request MOQ Quote
                            </button>
                        </div>





                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500 pt-4">
                            <div className="flex items-center gap-2">
                                <Truck size={16} className="text-primary" /> Ships in 24-48 Hours
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-green-500" /> Genuine Product
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Tabs / Sections */}
                    <div className="lg:col-span-8">
                        {/* Tabbed Navigation */}
                        <div className="border-b border-slate-200 dark:border-slate-800 mb-8">
                            <nav className="flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('specs')}
                                    className={`border-b-2 py-4 text-sm font-bold transition-all ${activeTab === 'specs' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Specifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('how-to')}
                                    className={`border-b-2 py-4 text-sm font-bold transition-all ${activeTab === 'how-to' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    How to Use
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`border-b-2 py-4 text-sm font-bold transition-all ${activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                >
                                    Reviews
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-12">
                            {activeTab === 'specs' && (
                                <section className="space-y-12 animate-in fade-in duration-300">
                                    {/* Video Showcase Section */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <Play size={20} fill="currentColor" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900">Product Demonstration</h3>
                                        </div>
                                        <div className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden group border border-slate-200">
                                            <video
                                                src="/assets/videos/VemTap_Video.mp4"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                                            <div className="absolute bottom-8 left-8 text-white">
                                                <p className="text-xs font-black uppercase tracking-widest mb-1 text-primary">Live Preview</p>
                                                <h4 className="text-xl font-bold">Watch how it works</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-bold text-slate-900">Technical Specifications</h3>
                                        <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-xl border border-slate-100">
                                            <p className="text-slate-600 leading-relaxed text-lg">{product.longDescription || product.description}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <tbody className="divide-y divide-slate-100">
                                                {Object.entries(product.specifications || {}).map(([key, value]) => (
                                                    <tr key={key}>
                                                        <td className="px-6 py-4 font-bold text-slate-500 w-1/3 bg-slate-50/50">{key}</td>
                                                        <td className="px-6 py-4 text-slate-900 font-medium">{value as string}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'how-to' && (
                                <section className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                                    <div className="bg-slate-50 p-8 border border-slate-200 rounded-2xl">
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">How to Use {product.name}</h3>
                                        <p className="text-slate-600 mb-8">Follow these simple steps to get started with your new device.</p>

                                        <div className="space-y-6">
                                            {(product.howToSteps || []).map((step: any, index: number) => (
                                                <div key={index} className="flex gap-4">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900">{step.title}</h4>
                                                        <p className="text-slate-600 text-sm mt-1">{step.description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!product.howToSteps || product.howToSteps.length === 0) && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3 text-amber-600">
                                                        <AlertTriangle size={20} />
                                                        <p className="font-bold">Instructions Pending</p>
                                                    </div>
                                                    <p className="text-slate-500 italic">Admin has not yet provided specific usage steps for this product.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'reviews' && (
                                <section className="animate-in fade-in duration-300 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-slate-900">Customer Reviews</h3>
                                        <span className="text-sm text-slate-500 font-medium">
                                            {reviews.filter(r => r.approved).length} Approved Reviews
                                        </span>
                                    </div>

                                    {/* Review Success Message */}
                                    {showReviewSuccess && (
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
                                                <div>
                                                    <h4 className="font-bold text-green-900 mb-1">Review Submitted!</h4>
                                                    <p className="text-sm text-green-800">Your review has been submitted and is pending admin approval. It will be visible once approved.</p>
                                                </div>
                                                <button onClick={() => setShowReviewSuccess(false)} className="ml-auto text-green-600 hover:text-green-800">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Approved Reviews */}
                                    <div className="space-y-6">
                                        {reviews.filter(r => r.approved).map((review) => (
                                            <div key={review.id} className="p-6 border border-slate-100 bg-slate-50/50 rounded-2xl">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} className={i < review.rating ? "text-primary fill-primary" : "text-slate-300"} />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium">{review.date}</span>
                                                </div>
                                                <p className="text-slate-700 font-medium mb-2">{review.comment}</p>
                                                <p className="text-xs font-bold text-slate-900">— {review.user}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Review Form */}
                                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                                        <h4 className="text-lg font-bold text-slate-900 mb-4">Write a Review</h4>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            if (!newReview.comment.trim()) {
                                                toast.error('Please write a review comment');
                                                return;
                                            }
                                            // Add review as pending (approved: false)
                                            const pendingReview = {
                                                id: reviews.length + 1,
                                                user: user?.name || 'Anonymous',
                                                rating: newReview.rating,
                                                date: 'Just now',
                                                comment: newReview.comment,
                                                approved: false // Pending admin approval
                                            };
                                            setReviews([...reviews, pendingReview]);
                                            setNewReview({ rating: 5, comment: '' });
                                            setShowReviewSuccess(true);
                                            // Auto-hide success message after 5 seconds
                                            setTimeout(() => setShowReviewSuccess(false), 5000);
                                        }} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 mb-2">Rating</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <button
                                                            key={rating}
                                                            type="button"
                                                            onClick={() => setNewReview({ ...newReview, rating })}
                                                            className="p-2 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <Star
                                                                size={24}
                                                                className={rating <= newReview.rating ? "text-primary fill-primary" : "text-slate-300"}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 mb-2">Your Review</label>
                                                <textarea
                                                    rows={4}
                                                    value={newReview.comment}
                                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                                    placeholder="Share your experience with this product..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                                                    required
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all"
                                            >
                                                Submit Review (Pending Approval)
                                            </button>
                                        </form>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Right / Sidebar removal placeholder - now spanning 8/12 grid but we can adjust to centered if needed or just keep empty */}
                    <div className="hidden lg:block lg:col-span-4">
                        <div className="bg-primary/5 p-8 border border-primary/10 space-y-6 rounded-2xl">
                            <Headset size={40} className="text-primary" />
                            <h4 className="text-xl font-bold text-slate-900">Need Customization?</h4>
                            <p className="text-sm text-slate-600 font-medium">Our hardware team specializes in custom NFC builds for large-scale enterprise deployments.</p>
                            <button
                                onClick={() => { setModalType('consultation'); setIsQuoteModalOpen(true); }}
                                className="w-full py-4 bg-white border border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-all rounded-2xl"
                            >
                                Request Consultation
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Quote Modal */}
            {isQuoteModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsQuoteModalOpen(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row">
                        {/* Signup Suggestion Side Panel */}
                        {!user && (
                            <div className="w-full md:w-80 bg-primary/5 p-8 border-b md:border-b-0 md:border-r border-primary/10 flex flex-col justify-center">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                                    <Star size={24} className="fill-primary" />
                                </div>
                                <h4 className="font-display font-bold text-xl text-slate-900 mb-3">Save your quotes</h4>
                                <p className="text-sm text-slate-600 mb-8 leading-relaxed font-medium">
                                    Create an account to track your bulk requests, get faster responses, and access exclusive member pricing.
                                </p>
                                <Link
                                    href="/get-started"
                                    className="w-full py-3 bg-white border border-primary text-primary font-bold text-center hover:bg-primary hover:text-white transition-all text-sm rounded-2xl"
                                >
                                    Create Account
                                </Link>
                                <p className="text-[10px] text-gray-400 mt-4 text-center font-bold uppercase tracking-wider font-display">Takes less than 1 minute</p>
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-display font-bold text-xl text-text-main">
                                        {modalType === 'quote' ? 'Request Bulk Quote' : modalType === 'moq' ? 'Request MOQ Quote' : 'Request Consultation'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {modalType === 'quote'
                                            ? 'Fill in the details for bulk pricing.'
                                            : modalType === 'moq'
                                                ? 'Request special pricing for smaller quantities.'
                                                : 'Schedule a call with our technical team.'}
                                    </p>
                                </div>
                                <button onClick={() => setIsQuoteModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleQuoteSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">First Name</label>
                                        <input
                                            type="text"
                                            value={quoteData.firstName}
                                            onChange={(e) => setQuoteData({ ...quoteData, firstName: e.target.value })}
                                            placeholder="John"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Last Name</label>
                                        <input
                                            type="text"
                                            value={quoteData.lastName}
                                            onChange={(e) => setQuoteData({ ...quoteData, lastName: e.target.value })}
                                            placeholder="Doe"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Work Email</label>
                                        <input
                                            type="email"
                                            value={quoteData.email}
                                            onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                                            placeholder="john@company.com"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={quoteData.phone || ''}
                                            onChange={(e) => setQuoteData({ ...quoteData, phone: e.target.value })}
                                            placeholder="+234 800 000 0000"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Location / State</label>
                                        <input
                                            type="text"
                                            value={quoteData.location}
                                            onChange={(e) => setQuoteData({ ...quoteData, location: e.target.value })}
                                            placeholder="Lagos, Nigeria"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={quoteData.company}
                                            onChange={(e) => setQuoteData({ ...quoteData, company: e.target.value })}
                                            placeholder="Company Ltd."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                {(modalType === 'quote' || modalType === 'moq') && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Quantity Needed</label>
                                            <input
                                                type="number"
                                                value={quoteData.quantity}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setQuoteData({ ...quoteData, quantity: val });
                                                    const moq = product.moq || product.tieredPricing?.[0]?.minQuantity || 1;
                                                    setMoqWarning(!!val && parseInt(val) > 0 && parseInt(val) < moq);
                                                }}
                                                placeholder="e.g. 100"
                                                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-colors ${moqWarning ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                                                    }`}
                                                required
                                                min="1"
                                            />
                                        </div>

                                        {moqWarning && modalType === 'quote' && (
                                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-amber-900">Quantity below standard minimum ({product.moq || product.tieredPricing?.[0]?.minQuantity || 1} units)</p>
                                                    <p className="text-xs text-amber-700 mt-1">For smaller quantities, please use the <strong>MOQ Quote</strong> option or contact sales.</p>
                                                </div>
                                            </div>
                                        )}
                                        {modalType === 'moq' && !moqWarning && quoteData.quantity && (
                                            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-amber-900">Bulk Quantity Detected ({quoteData.quantity} units)</p>
                                                    <p className="text-xs text-amber-700 mt-1">This quantity qualifies for standard Bulk Pricing. Please use the <strong>Request Bulk Quote</strong> form for faster processing.</p>
                                                </div>
                                            </div>
                                        )}
                                        {modalType === 'moq' && moqWarning && (
                                            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                                <ShieldCheck size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-blue-900">Custom MOQ Request</p>
                                                    <p className="text-xs text-blue-700 mt-1">We specialize in custom batches. Our team will review your request for {quoteData.quantity || 'small quantities'} units.</p>
                                                </div>
                                            </div>
                                        )}
                                        {modalType === 'quote' && !moqWarning && quoteData.quantity && (
                                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                                                <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-green-900">Bulk Tier Pricing</p>
                                                    <p className="text-xs text-green-700 mt-1">Your quantity qualifies for volume discounts. See the estimated total below.</p>
                                                </div>
                                            </div>
                                        )}

                                        {quoteData.quantity && !isNaN(parseInt(quoteData.quantity)) && parseInt(quoteData.quantity) > 0 && (() => {
                                            const qty = parseInt(quoteData.quantity);
                                            const calculated = calculateQuotePrice(product.tieredPricing || [], qty);
                                            const unitPrice = calculated === 'quote' ? product.price : calculated / qty;
                                            const total = calculated === 'quote' ? null : calculated;
                                            return (
                                                <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Estimated Total</span>
                                                        <span className="text-xs text-slate-500 font-medium">Based on ₦{unitPrice.toLocaleString()} / unit</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-slate-900">
                                                        {total !== null ? `₦${total.toLocaleString()}` : 'Contact for quote'}
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </>
                                )}
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Additional Notes</label>
                                    <textarea
                                        rows={4}
                                        value={quoteData.notes}
                                        onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                                        placeholder="Any specific requirements?"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                                    ></textarea>
                                </div>
                                <button type="submit" className="w-full py-5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                                    Submit Request
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
