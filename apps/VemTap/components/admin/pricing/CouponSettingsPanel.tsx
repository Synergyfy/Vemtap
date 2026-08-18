'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Plus, Loader2, Percent, Coins, Ticket, Power, Trash2, Search, History, Tag,
    CheckCircle2, XCircle, Calendar, Users, Wallet, TrendingUp, Layers,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import {
    useAdminCoupons,
    useCreateCoupon,
    useUpdateCoupon,
    useToggleCoupon,
    useDeleteCoupon,
    useAdminPromoCodes,
    useCreatePromoCode,
    useUpdatePromoCode,
    useTogglePromoCode,
    useCouponStats,
    useCouponRedemptions,
} from '@/services/coupons/hooks';
import { DiscountType, CouponDuration } from '@/types/subscriptions';
import type {
    CouponItem,
    CreateCouponPayload,
    CreatePromoCodePayload,
    PromoCodeItem,
} from '@/types/subscriptions';

const DURATIONS: Record<CouponDuration, string> = {
    ONCE: 'One-time',
    REPEATING: 'Repeating',
    FOREVER: 'Forever',
};

const fmtN = (n: number) => new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(Number(n) || 0);

const discountLabel = (c: Pick<CouponItem, 'discountType' | 'amount' | 'currency'>) =>
    c.discountType === 'PERCENTAGE'
        ? `${Number(c.amount)}% OFF`
        : `${c.currency || 'NGN'} ${fmtN(Number(c.amount))} OFF`;

interface CouponForm {
    name: string;
    discountType: DiscountType;
    amount: string;
    currency: string;
    maxDiscountAmount: string;
    minSubtotal: string;
    duration: CouponDuration;
    durationInMonths: string;
    applicableBillingPeriods: string[];
    isActive: boolean;
}

const emptyCouponForm: CouponForm = {
    name: '',
    discountType: DiscountType.PERCENTAGE,
    amount: '',
    currency: 'NGN',
    maxDiscountAmount: '',
    minSubtotal: '',
    duration: CouponDuration.ONCE,
    durationInMonths: '',
    applicableBillingPeriods: [],
    isActive: true,
};

const toCouponForm = (c: CouponItem): CouponForm => ({
    name: c.name || '',
    discountType: c.discountType || DiscountType.PERCENTAGE,
    amount: c.amount != null ? String(c.amount) : '',
    currency: c.currency || 'NGN',
    maxDiscountAmount: c.maxDiscountAmount != null ? String(c.maxDiscountAmount) : '',
    minSubtotal: c.minSubtotal != null ? String(c.minSubtotal) : '',
    duration: c.duration || CouponDuration.ONCE,
    durationInMonths: c.durationInMonths != null ? String(c.durationInMonths) : '',
    applicableBillingPeriods: c.applicableBillingPeriods || [],
    isActive: c.isActive ?? true,
});

const ALL_PERIODS = ['monthly', 'quarterly', 'yearly'];

// ---------------------------------------------------------------
// Coupon create/edit modal
// ---------------------------------------------------------------
function CouponModal({ open, onClose, coupon }: { open: boolean; onClose: () => void; coupon: CouponItem | null }) {
    const createMutation = useCreateCoupon();
    const updateMutation = useUpdateCoupon();
    const [form, setForm] = useState<CouponForm>(coupon ? toCouponForm(coupon) : emptyCouponForm);

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const handleSave = async () => {
        const amount = Number(form.amount);
        if (!form.name.trim()) return toast.error('Coupon name is required');
        if (!Number.isFinite(amount) || amount <= 0) return toast.error('Enter a valid discount amount');

        const payload: CreateCouponPayload = {
            name: form.name.trim(),
            discountType: form.discountType,
            amount,
            currency: form.discountType === 'FIXED_AMOUNT' ? form.currency || 'NGN' : 'NGN',
            duration: form.duration,
            applicableBillingPeriods: form.applicableBillingPeriods,
            isActive: form.isActive,
        };
        if (form.discountType === 'PERCENTAGE' && form.maxDiscountAmount) payload.maxDiscountAmount = Number(form.maxDiscountAmount);
        if (form.minSubtotal) payload.minSubtotal = Number(form.minSubtotal);
        if (form.duration === 'REPEATING') {
            const months = Number(form.durationInMonths);
            if (!Number.isFinite(months) || months < 1) return toast.error('Duration in months is required for repeating coupons');
            payload.durationInMonths = months;
        }

        if (coupon) {
            await updateMutation.mutateAsync({ id: coupon.id, data: payload }, {
                onSuccess: () => { toast.success('Coupon updated'); onClose(); },
                onError: (e: Error) => toast.error(e?.message || 'Failed to update coupon'),
            });
        } else {
            await createMutation.mutateAsync(payload, {
                onSuccess: () => { toast.success('Coupon created'); onClose(); },
                onError: (e: Error) => toast.error(e?.message || 'Failed to create coupon'),
            });
        }
    };

    return (
        <Modal isOpen={open} onClose={onClose} title={coupon ? 'Edit Coupon' : 'Create Coupon'} description="Define the discount math and plan restrictions." size="lg">
            <div className="space-y-4 py-2">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Coupon Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Q3 Growth Discount"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Discount Type</label>
                        <div className="flex gap-2">
                            {(['PERCENTAGE', 'FIXED_AMOUNT'] as DiscountType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm({ ...form, discountType: t })}
                                    className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${form.discountType === t ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                >
                                    {t === 'PERCENTAGE' ? '% Off' : '₦ Off'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                            {form.discountType === 'PERCENTAGE' ? 'Percent (%)' : 'Fixed Amount (₦)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                            placeholder={form.discountType === 'PERCENTAGE' ? '20' : '5000'}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Duration</label>
                        <div className="flex gap-2">
                            {(['ONCE', 'REPEATING', 'FOREVER'] as CouponDuration[]).map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setForm({ ...form, duration: d })}
                                    className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${form.duration === d ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                >
                                    {DURATIONS[d]}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.duration === 'REPEATING' && (
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Duration (months)</label>
                            <input
                                type="number"
                                min="1"
                                value={form.durationInMonths}
                                onChange={(e) => setForm({ ...form, durationInMonths: e.target.value })}
                                placeholder="3"
                                className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Applicable Billing Periods</label>
                    <div className="flex gap-2">
                        {ALL_PERIODS.map((p) => {
                            const active = form.applicableBillingPeriods.includes(p);
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setForm({
                                        ...form,
                                        applicableBillingPeriods: active
                                            ? form.applicableBillingPeriods.filter((x) => x !== p)
                                            : [...form.applicableBillingPeriods, p],
                                    })}
                                    className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${active ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-1.5">Leave none selected to apply to all billing cycles.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Max Discount (cap, ₦)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.maxDiscountAmount}
                            onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                            placeholder="Optional"
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Min Subtotal (₦)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.minSubtotal}
                            onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })}
                            placeholder="Optional"
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                        <p className="text-xs font-bold text-text-main">Active immediately</p>
                        <p className="text-[10px] font-medium text-slate-400">Suspended coupons disable all attached promo codes.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, isActive: !form.isActive })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <span className={`absolute top-[2px] left-[2px] size-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Tag size={15} />}
                    {coupon ? 'Save Coupon' : 'Create Coupon'}
                </button>
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------
// Promo code create/edit modal
// ---------------------------------------------------------------
function PromoCodeModal({ open, onClose, promo, coupons, presetCouponId }: {
    open: boolean;
    onClose: () => void;
    promo: PromoCodeItem | null;
    coupons: CouponItem[];
    presetCouponId?: string;
}) {
    const createMutation = useCreatePromoCode();
    const updateMutation = useUpdatePromoCode();
    const [couponId, setCouponId] = useState(presetCouponId || promo?.couponId || '');
    const [code, setCode] = useState(promo?.code || '');
    const [isActive, setIsActive] = useState(promo?.isActive ?? true);
    const [expiresAt, setExpiresAt] = useState(promo?.expiresAt ? promo.expiresAt.slice(0, 16) : '');
    const [startsAt, setStartsAt] = useState(promo?.startsAt ? promo.startsAt.slice(0, 16) : '');
    const [maxRedemptions, setMaxRedemptions] = useState(promo?.maxRedemptions != null ? String(promo.maxRedemptions) : '');
    const [maxRedemptionsPerUser, setMaxRedemptionsPerUser] = useState(promo?.maxRedemptionsPerUser != null ? String(promo.maxRedemptionsPerUser) : '1');
    const [firstTimeOnly, setFirstTimeOnly] = useState(promo?.firstTimeOnly ?? false);
    const [allowedBusinessIds, setAllowedBusinessIds] = useState((promo?.allowedBusinessIds || []).join(', '));

    const startsAtRef = useRef<HTMLInputElement>(null);
    const expiresAtRef = useRef<HTMLInputElement>(null);

    const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => () => {
        const el = ref.current;
        if (el && typeof el.showPicker === 'function') {
            try { el.showPicker(); } catch { /* already open or unsupported */ }
        }
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    const handleSave = async () => {
        if (!couponId && !promo) return toast.error('Select a coupon');
        if (!code.trim()) return toast.error('Promo code is required');

        const payload: CreatePromoCodePayload = {
            code: code.trim().toUpperCase(),
            isActive,
            maxRedemptionsPerUser: maxRedemptionsPerUser ? Number(maxRedemptionsPerUser) : 1,
            firstTimeOnly,
            allowedBusinessIds: allowedBusinessIds.split(',').map((s) => s.trim()).filter(Boolean),
        };
        if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
        if (startsAt) payload.startsAt = new Date(startsAt).toISOString();
        if (maxRedemptions) payload.maxRedemptions = Number(maxRedemptions);

        if (promo) {
            await updateMutation.mutateAsync({ id: promo.id, data: payload }, {
                onSuccess: () => { toast.success('Promo code updated'); onClose(); },
                onError: (e: Error) => toast.error(e?.message || 'Failed to update promo code'),
            });
        } else {
            await createMutation.mutateAsync({ couponId, data: payload }, {
                onSuccess: () => { toast.success('Promo code created'); onClose(); },
                onError: (e: Error) => toast.error(e?.message || 'Failed to create promo code'),
            });
        }
    };

    return (
        <Modal isOpen={open} onClose={onClose} title={promo ? `Edit ${promo.code}` : 'Generate Promo Code'} description="Customer-facing code with capacity & eligibility rules." size="lg">
            <div className="space-y-4 py-2">
                {!promo && (
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Parent Coupon</label>
                        <select
                            value={couponId}
                            onChange={(e) => setCouponId(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        >
                            <option value="">Select a coupon…</option>
                            {coupons.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} — {discountLabel(c)}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Promo Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="e.g. SAVE50"
                        className="w-full h-11 px-3 uppercase bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Starts At</label>
                        <input
                            ref={startsAtRef}
                            type="datetime-local"
                            value={startsAt}
                            onClick={openPicker(startsAtRef)}
                            onChange={(e) => setStartsAt(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Expires At</label>
                        <input
                            ref={expiresAtRef}
                            type="datetime-local"
                            value={expiresAt}
                            onClick={openPicker(expiresAtRef)}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Max Redemptions (global)</label>
                        <input
                            type="number"
                            min="0"
                            value={maxRedemptions}
                            onChange={(e) => setMaxRedemptions(e.target.value)}
                            placeholder="Unlimited"
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Per-Business Limit</label>
                        <input
                            type="number"
                            min="1"
                            value={maxRedemptionsPerUser}
                            onChange={(e) => setMaxRedemptionsPerUser(e.target.value)}
                            placeholder="1"
                            className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Allowed Business IDs (comma separated)</label>
                    <input
                        type="text"
                        value={allowedBusinessIds}
                        onChange={(e) => setAllowedBusinessIds(e.target.value)}
                        placeholder="Leave empty to allow any business"
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-xs font-bold text-text-main">Active</p>
                            <p className="text-[10px] font-medium text-slate-400">Suspend the code immediately.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-[2px] left-[2px] size-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-xs font-bold text-text-main">First-time subscribers only</p>
                            <p className="text-[10px] font-medium text-slate-400">Restrict to businesses with no prior paid subscription.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFirstTimeOnly(!firstTimeOnly)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${firstTimeOnly ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-[2px] left-[2px] size-5 rounded-full bg-white shadow transition-transform ${firstTimeOnly ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full h-12 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Ticket size={15} />}
                    {promo ? 'Save Promo Code' : 'Generate Promo Code'}
                </button>
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------
export default function CouponSettingsPanel() {
    const [tab, setTab] = useState<'coupons' | 'promo-codes' | 'redemptions'>('coupons');
    const [search, setSearch] = useState('');
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
    const [presetCouponId, setPresetCouponId] = useState<string | undefined>(undefined);
    const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);
    const [filterCouponId, setFilterCouponId] = useState<string>('');

    const { data: coupons = [], isLoading: couponsLoading } = useAdminCoupons();
    const { data: promoCodes = [], isLoading: promoCodesLoading } = useAdminPromoCodes(filterCouponId ? { couponId: filterCouponId } : undefined);
    const { data: redemptions = [], isLoading: redemptionsLoading } = useCouponRedemptions();
    const { data: stats } = useCouponStats();

    const toggleCouponMutation = useToggleCoupon();
    const deleteCouponMutation = useDeleteCoupon();
    const togglePromoMutation = useTogglePromoCode();

    const filteredPromoCodes = promoCodes.filter((p) =>
        !search.trim() ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.coupon?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredRedemptions = redemptions.filter((r) =>
        !search.trim() ||
        r.promotionCode?.code?.toLowerCase().includes(search.toLowerCase()) ||
        r.paymentReference?.toLowerCase().includes(search.toLowerCase()) ||
        r.business?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const openNewCoupon = () => { setEditingCoupon(null); setCouponModalOpen(true); };
    const openEditCoupon = (c: CouponItem) => { setEditingCoupon(c); setCouponModalOpen(true); };
    const openNewPromo = (couponId?: string) => { setEditingPromo(null); setPresetCouponId(couponId); setPromoModalOpen(true); };
    const openEditPromo = (p: PromoCodeItem) => { setEditingPromo(p); setPresetCouponId(undefined); setPromoModalOpen(true); };

    const statCards = [
        { label: 'Coupons', value: stats?.totalCoupons ?? 0, icon: Tag, color: 'text-primary bg-primary/10' },
        { label: 'Active Coupons', value: stats?.activeCoupons ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Promo Codes', value: stats?.totalPromoCodes ?? 0, icon: Ticket, color: 'text-violet-600 bg-violet-50' },
        { label: 'Active Codes', value: stats?.activePromoCodes ?? 0, icon: Power, color: 'text-amber-600 bg-amber-50' },
        { label: 'Redemptions', value: stats?.totalRedemptions ?? 0, icon: Users, color: 'text-sky-600 bg-sky-50' },
        { label: 'Discounts Given', value: `₦${fmtN(stats?.totalDiscountAmountGiven ?? 0)}`, icon: Wallet, color: 'text-rose-600 bg-rose-50' },
        { label: 'Discounted Revenue', value: `₦${fmtN(stats?.totalRevenueFromDiscountedSales ?? 0)}`, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                {statCards.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-1.5 shadow-sm"
                    >
                        <div className={`size-8 rounded-lg flex items-center justify-center ${s.color}`}>
                            <s.icon size={15} />
                        </div>
                        <span className="text-lg font-black text-text-main leading-none">{s.value}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Sub-tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex">
                    {([
                        { key: 'coupons' as const, label: 'Coupons' },
                        { key: 'promo-codes' as const, label: 'Promo Codes' },
                        { key: 'redemptions' as const, label: 'Redemptions' },
                    ]).map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 h-10 rounded-lg text-xs font-bold transition-all ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    {tab !== 'coupons' && (
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={tab === 'redemptions' ? 'Search ref / code / business…' : 'Search codes…'}
                                className="w-52 h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-text-main placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
                            />
                        </div>
                    )}
                    {tab === 'coupons' ? (
                        <button onClick={openNewCoupon} className="h-10 px-4 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                            <Plus size={14} /> New Coupon
                        </button>
                    ) : tab === 'promo-codes' ? (
                        <button onClick={() => openNewPromo()} className="h-10 px-4 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                            <Plus size={14} /> Generate Code
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Coupons tab */}
            {tab === 'coupons' && (
                couponsLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>
                ) : coupons.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                        <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4"><Tag size={32} className="opacity-20 text-slate-900" /></div>
                        <p className="font-bold text-sm text-text-main">No coupons created yet</p>
                        <p className="text-xs mb-6">Create a coupon to define discount rules, then generate promo codes.</p>
                        <button onClick={openNewCoupon} className="h-10 px-6 bg-white border border-slate-200 rounded-xl font-bold text-xs hover:border-primary hover:text-primary transition-all flex items-center gap-2 shadow-sm">
                            <Plus size={14} /> Create Your First Coupon
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {coupons.map((c) => {
                            const promoCount = c.promotionCodes?.length ?? 0;
                            const expanded = expandedCouponId === c.id;
                            return (
                                <motion.div
                                    key={c.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm"
                                >
                                    <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${c.isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                                {c.discountType === 'PERCENTAGE' ? <Percent size={20} /> : <Coins size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-black text-text-main text-sm">{c.name}</p>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                                                        {discountLabel(c)}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${c.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                        {c.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                                        {c.isActive ? 'Active' : 'Suspended'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-slate-400 flex-wrap">
                                                    <span className="font-bold uppercase">{DURATIONS[c.duration]}{c.duration === 'REPEATING' && c.durationInMonths ? ` · ${c.durationInMonths}mo` : ''}</span>
                                                    <span>·</span>
                                                    <span>{promoCount} promo code{promoCount !== 1 ? 's' : ''}</span>
                                                    {c.minSubtotal != null && Number(c.minSubtotal) > 0 && (
                                                        <>
                                                            <span>·</span><span>Min ₦{fmtN(Number(c.minSubtotal))}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setExpandedCouponId(expanded ? null : c.id)}
                                                className="h-9 px-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary transition-colors"
                                            >
                                                {promoCount > 0 ? `Codes (${promoCount})` : 'Codes'}
                                            </button>
                                            <button
                                                onClick={() => openNewPromo(c.id)}
                                                className="h-9 px-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
                                            >
                                                <Plus size={12} /> Code
                                            </button>
                                            <button
                                                onClick={() => toggleCouponMutation.mutate({ id: c.id, isActive: !c.isActive })}
                                                disabled={toggleCouponMutation.isPending}
                                                className={`size-9 rounded-xl flex items-center justify-center transition-colors ${c.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                title={c.isActive ? 'Suspend' : 'Activate'}
                                            >
                                                <Power size={14} />
                                            </button>
                                            <button
                                                onClick={() => openEditCoupon(c)}
                                                className="size-9 rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-slate-100 flex items-center justify-center transition-colors"
                                                title="Edit"
                                            >
                                                <Layers size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Delete coupon "${c.name}"?`)) {
                                                        deleteCouponMutation.mutate(c.id);
                                                    }
                                                }}
                                                disabled={deleteCouponMutation.isPending}
                                                className="size-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {expanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                                            <CouponCodesList couponId={c.id} />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Promo codes tab */}
            {tab === 'promo-codes' && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Ticket size={15} />
                            <span className="text-[10px] font-black uppercase tracking-widest">All Promo Codes</span>
                        </div>
                        <select
                            value={filterCouponId}
                            onChange={(e) => setFilterCouponId(e.target.value)}
                            className="ml-auto h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/15"
                        >
                            <option value="">All coupons</option>
                            {coupons.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    {promoCodesLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>
                    ) : filteredPromoCodes.length === 0 ? (
                        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                            <Ticket size={28} className="opacity-20 text-slate-900 mb-3" />
                            <p className="font-bold text-sm text-text-main">No promo codes{filterCouponId ? ' for this coupon' : ''}</p>
                            <p className="text-xs">Generate a code to start distributing discounts.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {filteredPromoCodes.map((p) => (
                                <div key={p.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-black text-sm tracking-wider uppercase shrink-0">{p.code}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-text-main truncate">{p.coupon?.name || '—'}</p>
                                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center gap-1"><Users size={11} /> {p.timesRedeemed}{p.maxRedemptions != null ? `/${p.maxRedemptions}` : ''}</span>
                                                {p.expiresAt && (
                                                    <span className="inline-flex items-center gap-1"><Calendar size={11} /> {new Date(p.expiresAt).toLocaleDateString()}</span>
                                                )}
                                                {p.firstTimeOnly && <span className="font-bold text-violet-500">First-timers</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                            {p.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            {p.isActive ? 'Active' : 'Suspended'}
                                        </span>
                                        <button
                                            onClick={() => togglePromoMutation.mutate({ id: p.id, isActive: !p.isActive })}
                                            disabled={togglePromoMutation.isPending}
                                            className={`size-8 rounded-lg flex items-center justify-center transition-colors ${p.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                            title={p.isActive ? 'Suspend' : 'Activate'}
                                        >
                                            <Power size={13} />
                                        </button>
                                        <button
                                            onClick={() => openEditPromo(p)}
                                            className="size-8 rounded-lg bg-slate-50 text-slate-400 hover:text-primary hover:bg-slate-100 flex items-center justify-center transition-colors"
                                            title="Edit"
                                        >
                                            <Layers size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Redemptions tab */}
            {tab === 'redemptions' && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                        <History size={15} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Redemption Audit Log</span>
                        <span className="ml-auto text-[10px] font-bold text-slate-400">{redemptions.length} redemptions</span>
                    </div>
                    {redemptionsLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 size={24} className="animate-spin text-primary" /></div>
                    ) : filteredRedemptions.length === 0 ? (
                        <p className="py-16 text-center text-sm font-medium text-slate-400">No redemptions recorded yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Business</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Period</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Original</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Discount</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Tax</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Final</th>
                                        <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRedemptions.map((r) => (
                                        <tr key={r.id} className="border-b border-slate-50 last:border-0">
                                            <td className="px-5 py-3.5">
                                                <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-black text-[11px] tracking-wider uppercase">
                                                    {r.promotionCode?.code || '—'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-xs font-bold text-text-main max-w-[160px] truncate">{r.business?.name || '—'}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{r.paymentReference}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{r.billingPeriod}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-bold text-slate-600">₦{fmtN(r.originalAmount)}</td>
                                            <td className="px-5 py-3.5 text-xs font-bold text-emerald-600">-₦{fmtN(r.discountAmount)}</td>
                                            <td className="px-5 py-3.5 text-xs font-bold text-slate-500">₦{fmtN(r.taxAmount)}</td>
                                            <td className="px-5 py-3.5 text-xs font-black text-text-main">₦{fmtN(r.finalAmount)}</td>
                                            <td className="px-5 py-3.5 text-[10px] font-medium text-slate-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <CouponModal
                key={couponModalOpen ? (editingCoupon?.id ?? 'new') : 'closed'}
                open={couponModalOpen}
                onClose={() => setCouponModalOpen(false)}
                coupon={editingCoupon}
            />
            <PromoCodeModal
                key={promoModalOpen ? (editingPromo?.id ?? `new-${presetCouponId ?? ''}`) : 'closed'}
                open={promoModalOpen}
                onClose={() => setPromoModalOpen(false)}
                promo={editingPromo}
                coupons={coupons}
                presetCouponId={presetCouponId}
            />
        </div>
    );
}

// ---------------------------------------------------------------
// Inline promo codes list under an expanded coupon
// ---------------------------------------------------------------
function CouponCodesList({ couponId }: { couponId: string }) {
    const { data: codes = [], isLoading } = useAdminPromoCodes({ couponId });
    const toggleMutation = useTogglePromoCode();

    if (isLoading) {
        return <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin text-primary" /></div>;
    }
    if (codes.length === 0) {
        return <p className="py-6 text-center text-xs font-medium text-slate-400">No promo codes for this coupon yet.</p>;
    }
    return (
        <div className="flex flex-wrap gap-2">
            {codes.map((p) => (
                <div key={p.id} className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <span className="text-xs font-black text-primary uppercase tracking-wider">{p.code}</span>
                    <span className="text-[10px] font-bold text-slate-400">{p.timesRedeemed}{p.maxRedemptions != null ? `/${p.maxRedemptions}` : ''}</span>
                    <button
                        onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                        className={`size-6 rounded-md flex items-center justify-center transition-colors ${p.isActive ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}
                        title={p.isActive ? 'Suspend' : 'Activate'}
                    >
                        <Power size={11} />
                    </button>
                </div>
            ))}
        </div>
    );
}
