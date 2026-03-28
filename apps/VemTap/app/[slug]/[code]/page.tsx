'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';
import { fetchDeviceByCode } from '@/lib/api/devices';
import { api } from '@/lib/api';
import { 
    useCatalogueItemsPublic, 
    useCatalogueOffersPublic, 
    CatalogueItem, 
    CatalogueOffer,
    useCreateCatalogueOrder
} from '@/services/catalogue/hooks';

// Components
import { VisitorLayout } from '@/components/visitor/VisitorLayout';
import { StepScanning } from '@/components/visitor/StepScanning';
import { StepIdentifying } from '@/components/visitor/StepIdentifying';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { 
    ShoppingBag, 
    Calendar, 
    Gift, 
    MessageSquare, 
    ChevronRight, 
    ArrowLeft, 
    Plus, 
    Minus, 
    Loader2,
    Star,
    CheckCircle2,
    Sparkles,
    Clock,
    Tag,
    ShieldCheck,
    ChevronLeft,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/store/useAuthStore';

// --- Sub-components for the Portal ---

const PortalWelcome = ({ branchName, welcomeMessage, logoUrl, onAction }: { branchName: string, welcomeMessage: string | null, logoUrl: string | null, onAction: (action: string) => void }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-10 py-4"
        >
            {/* Hero Section */}
            <div className="relative flex flex-col items-center text-center px-4">
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10" />
                
                {logoUrl ? (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="size-28 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl border-4 border-white ring-1 ring-slate-100 p-3 mb-8"
                    >
                        <img src={logoUrl} alt={branchName} className="size-full object-contain" />
                    </motion.div>
                ) : (
                    <div className="size-28 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white mb-8 shadow-2xl">
                        <Sparkles size={40} />
                    </div>
                )}

                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-tight">
                        {branchName}
                    </h1>
                    <p className="text-base text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        {welcomeMessage || "Experience the best of our services and products tailored just for you."}
                    </p>
                </div>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
                {[
                    { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu' },
                    { id: 'service', label: 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Reservations & Slots' },
                    { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals' },
                    { id: 'chat', label: 'Support Chat', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Direct Assistance' },
                ].map((item, idx) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        onClick={() => onAction(item.id)}
                        className="group relative flex flex-col gap-4 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-1 transition-all text-left"
                    >
                        <div className={cn("size-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110", item.bg, item.color)}>
                            <item.icon size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{item.label}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                        </div>
                        <div className="absolute top-8 right-8 size-10 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="text-primary" size={20} />
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Featured Trust Badges */}
            <div className="flex justify-center gap-12 py-6 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all border-t border-slate-100">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <ShieldCheck size={14} />
                    Secure Payments
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={14} />
                    Instant Confirmation
                </div>
            </div>
        </motion.div>
    );
};

const PortalList = ({ 
    type, 
    items, 
    offers, 
    onBack, 
    onSelect 
}: { 
    type: 'product' | 'service' | 'offer', 
    items: CatalogueItem[], 
    offers: CatalogueOffer[], 
    onBack: () => void,
    onSelect: (item: CatalogueItem | CatalogueOffer) => void
}) => {
    const displayItems = type === 'offer' ? offers : items.filter(i => i.itemType === type);
    const title = type === 'product' ? 'Our Menu' : type === 'service' ? 'Services' : 'Exclusive Offers';

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full space-y-10 pb-20"
        >
            <div className="flex items-center justify-between sticky top-0 bg-[#fafbfc]/90 backdrop-blur-xl py-6 z-10 -mx-6 px-6 border-b border-slate-100/50">
                <div className="flex items-center gap-5">
                    <button onClick={onBack} className="size-14 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600 hover:text-primary active:scale-95">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{displayItems.length} items currently available</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {displayItems.map((item) => {
                    const isOffer = 'calculatedPrice' in item;
                    const price = isOffer ? (item as CatalogueOffer).calculatedPrice : (item as CatalogueItem).price;
                    const points = item.loyaltyPoints || 0;
                    const image = isOffer ? (item as CatalogueOffer).mainImage : (item as CatalogueItem).mainImage;
                    const categoryName = !isOffer ? (item as CatalogueItem).category?.name : 'Bundle';

                    return (
                        <motion.button
                            layout
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="group flex flex-col bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all text-left overflow-hidden h-full"
                        >
                            <div className="relative h-56 w-full bg-slate-50 overflow-hidden">
                                <img src={image || '/placeholder.png'} alt={item.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {points > 0 && (
                                    <div className="absolute top-5 left-5 flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                        <Star size={12} fill="currentColor" />
                                        +{points} Pts
                                    </div>
                                )}

                                {isOffer && (
                                    <div className="absolute top-5 right-5 bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                        Value Bundle
                                    </div>
                                )}
                            </div>

                            <div className="p-8 space-y-5 flex-1 flex flex-col">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-lg bg-primary/5 text-[10px] font-black text-primary uppercase tracking-widest">{categoryName}</span>
                                        {!isOffer && (item as CatalogueItem).stockQuantity !== undefined && (
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Stock: {(item as CatalogueItem).stockQuantity}</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 line-clamp-1 tracking-tight">{item.name}</h3>
                                    <p className="text-sm text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="text-2xl font-black text-slate-900 font-display">
                                        ₦{(Number(price)).toLocaleString()}
                                    </div>
                                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                                        <Plus size={24} />
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {displayItems.length === 0 && (
                <div className="py-32 text-center space-y-6 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                        <ShoppingBag size={40} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xl font-black text-slate-900 uppercase tracking-widest">Nothing Found</p>
                        <p className="text-sm text-slate-400 font-medium">We don't have any {type}s listed at the moment.</p>
                    </div>
                    <button onClick={onBack} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">Browse Other Sections</button>
                </div>
            )}
        </motion.div>
    );
};

const PortalDetail = ({ 
    item, 
    onBack, 
    onOrder,
    isSubmitting
}: { 
    item: CatalogueItem | CatalogueOffer, 
    onBack: () => void, 
    onOrder: (qty: number) => void,
    isSubmitting: boolean
}) => {
    const isOffer = 'calculatedPrice' in item;
    const initialImage = isOffer ? (item as CatalogueOffer).mainImage : (item as CatalogueItem).mainImage;
    const [activeImage, setActiveImage] = useState(initialImage || '/placeholder.png');
    const [qty, setQty] = useState(1);
    
    const price = isOffer ? (item as CatalogueOffer).calculatedPrice : (item as CatalogueItem).price;
    const points = item.loyaltyPoints || 0;
    const type = isOffer ? 'product' : (item as CatalogueItem).itemType;
    const gallery = !isOffer ? (item as CatalogueItem).galleryImages || [] : (item as CatalogueOffer).galleryImages || [];
    const allImages = useMemo(() => [initialImage, ...gallery].filter(Boolean) as string[], [initialImage, gallery]);

    // Calculate savings for offers
    const savingsInfo = useMemo(() => {
        if (!isOffer) return null;
        const offer = item as CatalogueOffer;
        const originalPrice = offer.items.reduce((sum, i) => sum + Number(i.price), 0);
        const savings = originalPrice - offer.calculatedPrice;
        const percent = Math.round((savings / originalPrice) * 100);
        return savings > 0 ? { amount: savings, percent, original: originalPrice } : null;
    }, [item, isOffer]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full space-y-8 pb-20"
        >
            {/* Header / Back button */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="size-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-600 active:scale-95">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {isOffer ? 'Special Bundle' : (item as CatalogueItem).category?.name || 'General'}
                        </span>
                        {points > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 rounded-lg text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                                <Star size={10} fill="currentColor" />
                                {points} Pts
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">{item.name}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Media Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="relative aspect-square lg:aspect-[4/3] rounded-[3rem] overflow-hidden bg-white shadow-2xl border-8 border-white ring-1 ring-slate-100">
                        <motion.img 
                            key={activeImage}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={activeImage} 
                            alt={item.name} 
                            className="size-full object-cover"
                        />
                        
                        {savingsInfo && (
                            <div className="absolute top-6 right-6 bg-emerald-500 text-white px-5 py-2.5 rounded-2xl shadow-xl font-black text-xs uppercase tracking-widest animate-bounce">
                                {savingsInfo.percent}% OFF
                            </div>
                        )}
                    </div>

                    {allImages.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto py-2 px-1 no-scrollbar">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    className={cn(
                                        "size-24 rounded-3xl overflow-hidden border-4 transition-all shrink-0 shadow-md hover:shadow-xl active:scale-95",
                                        activeImage === img ? "border-primary scale-105 shadow-primary/20" : "border-white hover:border-slate-200"
                                    )}
                                >
                                    <img src={img} className="size-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Column */}
                <div className="lg:col-span-5 space-y-8">
                    {/* Price Card */}
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Current Price</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-5xl font-black text-slate-900 font-display tracking-tight">
                                    ₦{(Number(price)).toLocaleString()}
                                </span>
                                {savingsInfo && (
                                    <span className="text-xl font-bold text-slate-300 line-through">
                                        ₦{savingsInfo.original.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {savingsInfo && (
                            <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                                <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Bundle Savings</p>
                                    <p className="text-sm font-bold text-emerald-500">You save ₦{savingsInfo.amount.toLocaleString()} today</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Select Quantity</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal: ₦{(price * qty).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-[2rem] border border-slate-100 shadow-inner">
                                <button 
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="size-14 flex items-center justify-center bg-white rounded-2xl shadow-md text-slate-600 hover:text-primary transition-all disabled:opacity-50 active:scale-90"
                                    disabled={qty <= 1}
                                >
                                    <Minus size={24} />
                                </button>
                                <span className="flex-1 text-center text-3xl font-black text-slate-900 font-display">{qty}</span>
                                <button 
                                    onClick={() => setQty(qty + 1)}
                                    className="size-14 flex items-center justify-center bg-white rounded-2xl shadow-md text-slate-600 hover:text-primary transition-all active:scale-90"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={() => onOrder(qty)}
                            disabled={isSubmitting}
                            className="w-full h-24 bg-slate-900 text-white text-xl font-black rounded-[2.5rem] shadow-2xl shadow-slate-900/30 hover:bg-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-5 disabled:opacity-70 uppercase tracking-widest"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={28} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={28} />
                                    <span>{type === 'service' ? 'Book Appointment' : 'Confirm Order'}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Trust / Features */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                            <div className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Verified</p>
                        </div>
                        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-2">
                            <div className="size-10 rounded-xl bg-orange-500/5 text-orange-500 flex items-center justify-center">
                                <Clock size={20} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Fast Process</p>
                        </div>
                    </div>
                </div>

                {/* Details Section - Full Width on Mobile, spans under on Desktop */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="size-1 bg-primary rounded-full" />
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Description</h4>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            {item.description}
                        </p>
                    </div>

                    {isOffer && (item as CatalogueOffer).items && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="size-1 bg-emerald-500 rounded-full" />
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em]">Bundle Content</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(item as CatalogueOffer).items.map((sub) => (
                                    <div key={sub.id} className="flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="size-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                            <img src={sub.mainImage || '/placeholder.png'} className="size-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-black text-slate-900 tracking-tight truncate">{sub.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{sub.category?.name || 'General'}</p>
                                                <span className="size-1 rounded-full bg-slate-300" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Included in Deal</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---

export default function DynamicTapJourneyPage() {
    const params = useParams();
    const router = useRouter();
    const deviceCode = params.code as string;

    const {
        currentStep, setStep, storeName, setUserData, resetFlow,
        initializeFromBusiness, branchId, logoUrl, businessId,
        customWelcomeMessage
    } = useCustomerFlowStore();

    const { user, isAuthenticated, login } = useAuthStore();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CatalogueItem | CatalogueOffer | null>(null);
    const [activePortalType, setActivePortalType] = useState<'product' | 'service' | 'offer' | null>(null);
    const [pendingAction, setPendingAction] = useState<((userFromForm: User) => void) | null>(null);

    // Data hooks - extracting 'data' array from paginated response
    const { data: catalogueResponse } = useCatalogueItemsPublic(branchId || '');
    const { data: offersResponse } = useCatalogueOffersPublic(branchId || '');
    
    const catalogueItems = catalogueResponse?.data || [];
    const offers = offersResponse?.data || [];
    
    const createOrderMutation = useCreateCatalogueOrder();

    // Context Initialization
    useEffect(() => {
        const initJourney = async () => {
            if (!deviceCode) return;
            try {
                if (!businessId || deviceCode !== useCustomerFlowStore.getState().deviceCode) {
                    const device = await fetchDeviceByCode(deviceCode);
                    if (device) {
                        initializeFromBusiness(device);
                    }
                }
                if (useCustomerFlowStore.getState().currentStep === 'SELECT_TYPE' || useCustomerFlowStore.getState().currentStep === 'SCANNING') {
                    setStep('SCANNING');
                }
            } catch (err) {
                console.error('Journey Init Failed:', err);
                router.push('/tap/invalid');
            } finally {
                setIsLoading(false);
            }
        };
        initJourney();
    }, [deviceCode, businessId, initializeFromBusiness, router, setStep]);

    // Navigation logic
    useEffect(() => {
        if (currentStep === 'SCANNING') {
            const timer = setTimeout(() => setStep('IDENTIFYING'), 1200);
            return () => clearTimeout(timer);
        }
        if (currentStep === 'IDENTIFYING') {
            const timer = setTimeout(() => {
                setStep('PORTAL_MENU');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentStep, setStep]);

    const handleAction = (id: string) => {
        if (id === 'order') {
            setActivePortalType('product');
            setStep('PORTAL_LIST');
        } else if (id === 'service') {
            setActivePortalType('service');
            setStep('PORTAL_LIST');
        } else if (id === 'offers') {
            setActivePortalType('offer');
            setStep('PORTAL_LIST');
        } else if (id === 'chat') {
            const navigateToChat = () => {
                const businessBranchId = branchId || businessId;
                router.push(`/customer/messaging/chat?branchId=${businessBranchId}`);
            };

            if (!isAuthenticated) {
                setPendingAction(() => navigateToChat);
                setStep('FORM');
            } else {
                navigateToChat();
            }
        }
    };

    const handleItemSelect = (item: CatalogueItem | CatalogueOffer) => {
        setSelectedItem(item);
        setStep('PORTAL_DETAIL');
    };

    const handleFinalOrder = async (qty: number) => {
        if (!selectedItem || !branchId) return;

        const executeOrder = async (currentUser: User) => {
            setIsSubmitting(true);
            try {
                const isOffer = 'calculatedPrice' in selectedItem;
                const payload = {
                    branchId: branchId,
                    deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                    lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                    email: currentUser.email || undefined,
                    phone: currentUser.phone || 'N/A',
                    items: [
                        isOffer 
                        ? { offerId: selectedItem.id, quantity: qty }
                        : { itemId: selectedItem.id, quantity: qty }
                    ]
                };

                await createOrderMutation.mutateAsync(payload);
                toast.success('Success! Your request has been sent.', { icon: '🎉' });
                setStep('FINAL_SUCCESS');
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to process order');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
            setPendingAction(() => (userFromForm: User) => executeOrder(userFromForm));
            setStep('FORM');
        } else {
            executeOrder(user as User);
        }
    };

    const onRegistrationComplete = async (data: StepFormData) => {
        setIsSubmitting(true);
        try {
            const nameParts = data.name?.trim().split(/\s+/) || ['Visitor'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || ' ';
            const defaultPassword = '123456';

            await api.post(`/visitors/signup`, {
                firstName,
                lastName,
                email: data.email,
                phone: data.phone
            });

            const authResponse = await api.post('/auth/login', {
                identifier: data.email,
                password: defaultPassword
            });

            if (authResponse?.access_token) {
                login(authResponse.user, authResponse.access_token);
                setUserData(data);
                
                if (pendingAction) {
                    await pendingAction(authResponse.user);
                    setPendingAction(null);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Setting up portal...</p>
                </div>
            </div>
        );
    }

    return (
        <VisitorLayout
            onReset={resetFlow}
            brandColor={useCustomerFlowStore.getState().engagementSettings?.brandColor}
        >
            <AnimatePresence mode="wait">
                {currentStep === 'SCANNING' && <StepScanning storeName={storeName} />}
                
                {currentStep === 'IDENTIFYING' && <StepIdentifying />}

                {currentStep === 'PORTAL_MENU' && (
                    <PortalWelcome 
                        branchName={storeName}
                        welcomeMessage={customWelcomeMessage}
                        logoUrl={logoUrl}
                        onAction={handleAction}
                    />
                )}

                {currentStep === 'PORTAL_LIST' && activePortalType && (
                    <PortalList 
                        type={activePortalType}
                        items={catalogueItems}
                        offers={offers}
                        onBack={() => setStep('PORTAL_MENU')}
                        onSelect={handleItemSelect}
                    />
                )}

                {currentStep === 'PORTAL_DETAIL' && selectedItem && (
                    <PortalDetail 
                        item={selectedItem}
                        isSubmitting={isSubmitting}
                        onBack={() => setStep('PORTAL_LIST')}
                        onOrder={handleFinalOrder}
                    />
                )}

                {currentStep === 'FORM' && (
                    <StepForm
                        storeName={storeName}
                        logoUrl={logoUrl}
                        customWelcomeTitle="Join to Continue"
                        customWelcomeMessage="Quickly share your details to proceed with your request."
                        submitLabel="Complete Registration"
                        isSubmitting={isSubmitting}
                        onBack={() => {
                            setPendingAction(null);
                            setStep('PORTAL_MENU');
                        }}
                        onSubmit={onRegistrationComplete}
                    />
                )}

                {currentStep === 'FINAL_SUCCESS' && (
                    <SuccessRedirect />
                )}
            </AnimatePresence>
        </VisitorLayout>
    );
}

const SuccessRedirect = () => {
    const router = useRouter();
    const { resetFlow } = useCustomerFlowStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            resetFlow();
            router.push('/customer/dashboard/orders');
        }, 3000);
        return () => clearTimeout(timer);
    }, [router, resetFlow]);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-center space-y-8 bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100"
        >
            <div className="size-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Request Received!</h2>
                <p className="text-slate-500 font-medium">
                    We've received your request and are processing it. Redirecting you to your dashboard...
                </p>
            </div>
            <button 
                onClick={() => {
                    resetFlow();
                    router.push('/customer/dashboard/orders');
                }}
                className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
                <span>Go to My Dashboard</span>
                <ArrowRight size={16} />
            </button>
        </motion.div>
    );
};
