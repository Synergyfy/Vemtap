'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { ShoppingBag, CheckCircle, Loader2, ChevronRight, Phone, User, Package, ArrowLeft, AlertCircle, X, BarChart3, TrendingUp, RotateCcw, MessageSquare, Gift, Tag, CalendarDays, Star, Zap, AlertTriangle, Clock, TicketCheck, ShieldCheck, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalogueOrders, useCatalogueOrderDetails, useUpdateCatalogueOrderStatus, useBusinessClaims, OrderStatus, useRedeemClaim } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useBranches } from '@/services/branches/hooks';
import { usePosStore } from '@/store/usePosStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'New' },
  processing: { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500', label: 'Processing' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500', label: 'Completed' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Cancelled' },
  rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Refunded' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const d = Math.floor(hrs / 24);
  return `${d}d ago`;
}

interface StockWarningItem {
  name: string;
  orderedQty: number;
  availableQty: number;
}

export default function OrdersDashboard() {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const [activeTab, setActiveTab] = useState<'orders' | 'claims'>('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const updateStatus = useUpdateCatalogueOrderStatus();
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundItemIds, setRefundItemIds] = useState<Set<string>>(new Set());
  const redeemClaim = useRedeemClaim();
  const { data: claimsData, isLoading: claimsLoading } = useBusinessClaims();
  const { data: branches } = useBranches();

  const [stockWarningAffected, setStockWarningAffected] = useState<StockWarningItem[] | null>(null);
  const stockWarningRef = useRef<{ allItems: any[]; goToPayment: boolean } | null>(null);

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completingClaimId, setCompletingClaimId] = useState<string | null>(null);

  const currentBranch = branches?.find((b: any) => b.id === activeBranchId);
  const branchCodePrefix = currentBranch?.uniqueCode ? `VEM-${currentBranch.uniqueCode}-` : 'VEM-';

  const { data: ordersData, isLoading } = useCatalogueOrders({
    branchId: activeBranchId ?? undefined,
  });

  const allOrders = ordersData?.data ?? [];
  const totalOrders = ordersData?.total ?? 0;
  const claims = Array.isArray(claimsData) ? claimsData : (claimsData?.data || []);

  const displayedOrders = useMemo(() => {
    if (statusFilter === 'all') return allOrders;
    return allOrders.filter((o: any) => o.status === statusFilter);
  }, [allOrders, statusFilter]);

  interface Stats { new: number; processing: number; completed: number; cancelled: number; rejected: number; total: number; revenue: number; }
  const stats: Stats = useMemo(() => {
    const counts: Stats = { new: 0, processing: 0, completed: 0, cancelled: 0, rejected: 0, total: 0, revenue: 0 };
    allOrders.forEach((o: any) => {
      const key = o.status as keyof Stats;
      if (key in counts && key !== 'total' && key !== 'revenue') counts[key]++;
      if (o.status === 'completed') counts.revenue += Number(o.totalAmount || 0);
    });
    return { ...counts, total: allOrders.length };
  }, [allOrders]);

  const claimStats = useMemo(() => {
    const claimed = claims.filter((c: any) => c.status === 'claimed').length;
    const redeemed = claims.filter((c: any) => c.status === 'redeemed').length;
    return { total: claims.length, claimed, redeemed };
  }, [claims]);

  const chartDataByStatus = useMemo(() => [
    { name: 'New', value: stats.new, fill: '#3B82F6' },
    { name: 'Processing', value: stats.processing, fill: '#F59E0B' },
    { name: 'Completed', value: stats.completed, fill: '#10B981' },
    { name: 'Cancelled', value: stats.cancelled, fill: '#6B7280' },
    { name: 'Rejected', value: stats.rejected, fill: '#EF4444' },
  ], [stats]);

  const trendData = useMemo(() => {
    const daily: Record<string, { date: string; orders: number; completed: number; revenue: number }> = {};
    allOrders.forEach((o: any) => {
      if (!o.createdAt) return;
      const day = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!daily[day]) daily[day] = { date: day, orders: 0, completed: 0, revenue: 0 };
      daily[day].orders++;
      if (o.status === 'completed') {
        daily[day].completed++;
        daily[day].revenue += Number(o.totalAmount || 0);
      }
    });
    return Object.values(daily).sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return da.getTime() - db.getTime();
    });
  }, [allOrders]);

  const { data: orderDetail, isLoading: loadingDetail } = useCatalogueOrderDetails(selectedOrderId ?? '');

  const addItemsToCartAndCheckout = (items: any[], goToPayment = false) => {
    const posStore = usePosStore.getState();
    posStore.clearCart();
    items.forEach((item: any) => {
      const product = item.item || item;
      const cartItem = {
        id: product.id,
        productId: product.id,
        name: product.name || 'Item',
        price: Number(item.priceAtOrder || product.price || 0),
        costPrice: Number(product.costPrice || 0),
        quantity: item.quantity ?? 1,
        stockQuantity: product.stockQuantity,
        sku: product.sku || '',
        barcode: product.barcode || '',
        image: product.mainImage || product.image,
      };
      posStore.addToCart(cartItem);
    });
    router.push(goToPayment ? '/dashboard/pos/payment' : '/dashboard/pos');
  };

  const checkStockAndProceed = (items: any[], goToPayment: boolean) => {
    const affected: StockWarningItem[] = [];
    items.forEach((item: any) => {
      const product = item.item || item;
      if (product.stockQuantity != null && Number(product.stockQuantity) < Number(item.quantity)) {
        affected.push({
          name: product.name || 'Item',
          orderedQty: Number(item.quantity),
          availableQty: Number(product.stockQuantity),
        });
      }
    });
    if (affected.length > 0) {
      stockWarningRef.current = { allItems: items, goToPayment };
      setStockWarningAffected(affected);
    } else {
      addItemsToCartAndCheckout(items, goToPayment);
    }
  };

  const handleStockWarningProceed = () => {
    const data = stockWarningRef.current;
    if (!data) return;
    const adjustedItems = data.allItems
      .map((item: any) => {
        const product = item.item || item;
        const avail = Number(product.stockQuantity);
        if (product.stockQuantity != null && avail < Number(item.quantity)) {
          return { ...item, quantity: Math.max(0, avail) };
        }
        return item;
      })
      .filter((item: any) => (item.quantity ?? 1) > 0);
    setStockWarningAffected(null);
    stockWarningRef.current = null;
    addItemsToCartAndCheckout(adjustedItems, data.goToPayment);
  };

  const handleAcceptOrder = () => {
    if (!orderDetail?.items || orderDetail.items.length === 0) {
      toast.error('No items in this order');
      return;
    }
    checkStockAndProceed(orderDetail.items, false);
    updateStatus.mutate(
      { id: selectedOrderId!, status: 'processing' as OrderStatus },
      { onSuccess: () => toast.success('Order added to cart! You can review items before payment.') }
    );
  };

  const handleContinuePayment = () => {
    if (!orderDetail?.items || orderDetail.items.length === 0) {
      toast.error('No items in this order');
      return;
    }
    checkStockAndProceed(orderDetail.items, true);
    updateStatus.mutate(
      { id: selectedOrderId!, status: 'processing' as OrderStatus },
      { onSuccess: () => toast.success('Continuing payment for this order') }
    );
  };

  const handleAcceptClaim = async (claim: any) => {
    try {
      const res = await redeemClaim.mutateAsync(claim.claimCode);
      if (claim.offer?.items?.length > 0) {
        checkStockAndProceed(claim.offer.items.map((item: any) => ({
          item: item,
          quantity: 1,
          priceAtOrder: claim.offer.calculatedPrice,
        })), false);
      }
      toast.success(`${res.claim.offerName || 'Deal'} accepted!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept claim');
    }
  };

  const handleMarkCompleteClick = (claimId: string) => {
    setCompletingClaimId(claimId);
    setShowCompleteConfirm(true);
  };

  const handleConfirmComplete = async () => {
    const claim = claims.find((c: any) => c.id === completingClaimId);
    if (!claim) return;
    try {
      const res = await redeemClaim.mutateAsync(claim.claimCode);
      toast.success(`${res.claim.offerName} marked as completed!`);
      setShowCompleteConfirm(false);
      setCompletingClaimId(null);
      setSelectedClaimId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete deal');
    }
  };

  const handleStatusChange = (id: string, status: OrderStatus) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        const msgs: Record<string, string> = {
          completed: 'Order completed',
          processing: 'Order accepted',
          rejected: 'Order returned & refunded',
        };
        toast.success(msgs[status] || 'Order updated');
        setSelectedOrderId(null);
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to update order'),
    });
  };

  const openRefundModal = () => {
    if (orderDetail?.items) {
      setRefundItemIds(new Set(orderDetail.items.map((i: any) => i.id)));
    }
    setRefundReason('');
    setShowRefundModal(true);
  };

  const toggleRefundItem = (itemId: string) => {
    setRefundItemIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleRefundConfirm = () => {
    if (refundItemIds.size === 0) {
      toast.error('Select at least one item to refund');
      return;
    }
    if (!refundReason.trim()) {
      toast.error('Please provide a reason for the return');
      return;
    }
    setShowRefundModal(false);
    handleStatusChange(selectedOrderId!, 'rejected');
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col pb-24">
      {/* NATIVE APP HEADER SECTION */}
      <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-5 sm:px-8 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShoppingBag size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                Management
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Orders & Claims
              </h1>
            </div>
          </div>
          
          <div className="pt-2 pb-4">
            <p className="text-blue-100 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <TrendingUp size={14} /> Total Orders
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {stats.total}
            </h2>
          </div>
        </div>

        {/* Tab Toggle Overlapping Header */}
        <div className="absolute left-0 right-0 -bottom-6 px-5 sm:px-8">
          <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-black/5 flex items-center">
            <button onClick={() => setActiveTab('orders')} className={cn(
              "flex-1 h-12 rounded-xl text-sm font-black transition-all cursor-pointer",
              activeTab === 'orders' ? "bg-gray-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}>
              Orders
            </button>
            <button onClick={() => setActiveTab('claims')} className={cn(
              "flex-1 h-12 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2",
              activeTab === 'claims' ? "bg-gray-900 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
            )}>
              Deal Claims
              {claimStats.claimed > 0 && (
                <span className={cn("px-1.5 py-0.5 text-[9px] rounded-full", activeTab === 'claims' ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600")}>
                  {claimStats.claimed}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="px-5 sm:px-8 pt-10">
      {activeTab === 'orders' ? (
        <>
          {/* Summary Stats - Scrollable Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6 shrink-0">
            <div className="p-3 sm:p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-[90px] sm:h-[110px]">
              <div className="size-6 sm:size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={12} className="sm:w-4 sm:h-4" />
              </div>
              <div>
                <p className="text-base sm:text-xl font-black text-emerald-600 truncate">{stats.completed}</p>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-500 truncate">Completed</p>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm flex flex-col justify-between h-[90px] sm:h-[110px]">
              <div className="size-6 sm:size-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Zap size={12} className="sm:w-4 sm:h-4" />
              </div>
              <div>
                <p className="text-base sm:text-xl font-black text-blue-600 truncate">{stats.new}</p>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500 truncate">New</p>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-[90px] sm:h-[110px]">
              <div className="size-6 sm:size-8 rounded-full bg-gray-50 text-gray-900 flex items-center justify-center border border-gray-100">
                <span className="text-[10px] sm:text-xs font-black">₦</span>
              </div>
              <div>
                <p className="text-base sm:text-xl font-black text-gray-900 truncate">{stats.revenue > 99999 ? '99k+' : stats.revenue.toLocaleString()}</p>
                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 truncate">Revenue</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={16} className="text-gray-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Orders by Status</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataByStatus} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700 }} formatter={(value: unknown) => [Number(value) || 0, 'Orders']} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-gray-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Orders Over Time</h3>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700 }} />
                    <defs>
                      <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#066CF4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#066CF4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="orders" stroke="#066CF4" fill="url(#orderGradient)" strokeWidth={2} name="All Orders" />
                    <Area type="monotone" dataKey="completed" stroke="#10B981" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="w-full md:w-64 h-12 px-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none cursor-pointer focus:border-[#066CF4]/50 focus:ring-4 focus:ring-[#066CF4]/10 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                backgroundSize: '16px',
              }}
            >
              {STATUS_TABS.map(tab => (
                <option key={tab.value} value={tab.value}>{tab.label} Orders</option>
              ))}
            </select>
          </div>

          {/* Orders List vs Detail View */}
          {selectedOrderId && orderDetail ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[32px] shadow-sm">
              <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                <button onClick={() => setSelectedOrderId(null)} className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
                  <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900">Order Details</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {orderDetail.id?.slice(0, 8)}</p>
                </div>
                <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border", STATUS_STYLES[orderDetail.status]?.bg, STATUS_STYLES[orderDetail.status]?.text)}>
                  {STATUS_STYLES[orderDetail.status]?.label}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</h4>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center"><User size={18} /></div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{orderDetail.customer?.firstName} {orderDetail.customer?.lastName}</p>
                          <a href={`tel:${orderDetail.customer?.phone}`} className="text-[10px] font-bold text-[#066CF4] hover:underline">{orderDetail.customer?.phone}</a>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items ({orderDetail.items?.length || 0})</h4>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(orderDetail.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="space-y-2">
                        {(orderDetail.items || []).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100"><Package size={16} className="text-gray-400" /></div>
                              <div>
                                <p className="text-sm font-black text-gray-900">{item.item?.name || item.offer?.name || 'Item'}</p>
                                <p className="text-[10px] font-bold text-gray-400">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="text-sm font-black text-gray-900">₦{Number(item.priceAtOrder).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className="text-sm font-black text-gray-900">Total</span>
                      <span className="text-2xl font-black text-[#066CF4]">₦{Number(orderDetail.totalAmount).toLocaleString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      {orderDetail.status === 'new' && (
                        <button
                          onClick={handleAcceptOrder}
                          disabled={updateStatus.isPending}
                          className="w-full h-14 bg-[#066CF4] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                          {updateStatus.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={18} />}
                          Accept & Add to Cart
                        </button>
                      )}
                      {orderDetail.status === 'processing' && (
                        <>
                          <button
                            onClick={handleContinuePayment}
                            disabled={updateStatus.isPending}
                            className="w-full h-14 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            {updateStatus.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={18} />}
                            Continue Payment
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => { checkStockAndProceed(orderDetail.items, false); toast.success('Items added to cart for review'); }}
                              disabled={updateStatus.isPending}
                              className="h-12 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <ShoppingBag size={14} />
                              Add More Items
                            </button>
                            <button
                              onClick={() => handleStatusChange(selectedOrderId!, 'completed')}
                              disabled={updateStatus.isPending}
                              className="h-12 bg-gray-50 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              Mark Complete
                            </button>
                          </div>
                        </>
                      )}
                      {['new', 'processing', 'completed'].includes(orderDetail.status) && (
                        <button onClick={openRefundModal} disabled={updateStatus.isPending} className="w-full h-12 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                          <RotateCcw size={14} />
                          Return & Refund
                        </button>
                      )}
                      {['completed', 'cancelled', 'rejected'].includes(orderDetail.status) && (
                        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
                          {orderDetail.status === 'rejected' ? 'This order has been returned & refunded' : `This order has been ${orderDetail.status}`}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
              ) : displayedOrders.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm flex flex-col items-center justify-center text-center p-12">
                  <div className="size-20 bg-gray-50 rounded-[24px] flex items-center justify-center mb-4 border border-gray-100"><ShoppingBag size={40} className="text-gray-300" /></div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Your next order is waiting</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs leading-relaxed">
                    {statusFilter === 'all' ? 'Orders from your public POS will appear here' : `No ${statusFilter} orders found`}
                  </p>
                </div>
              ) : (
                displayedOrders.map((order: any) => {
                  const style = STATUS_STYLES[order.status] || STATUS_STYLES.new;
                  const itemCount = order.items?.length || 0;
                  return (
                    <button key={order.id} onClick={() => setSelectedOrderId(order.id)}
                      className="w-full bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group active:scale-[0.99]">
                      <div className="flex items-start gap-4">
                        <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0 border", style.bg, style.bg.replace('bg-', 'border-').replace('50', '100'))}>
                          <ShoppingBag size={22} className={style.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-black text-gray-900 truncate">{order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName || ''}` : 'Anonymous Customer'}</h4>
                            <span className={cn("size-2 rounded-full shrink-0", style.dot)} />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                            {order.customer?.phone && <span className="flex items-center gap-1"><Phone size={10} />{order.customer.phone}</span>}
                            <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                            <span>{timeAgo(order.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-black text-gray-900">₦{Number(order.totalAmount).toLocaleString()}</p>
                          <span className={cn("inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", style.bg, style.text)}>{style.label}</span>
                        </div>
                        <div className="flex items-center pl-2"><ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" /></div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Refund Modal */}
          <AnimatePresence>
            {showRefundModal && orderDetail && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm"  />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center"><RotateCcw size={18} className="text-red-500" /></div>
                      <div><h3 className="text-lg font-black text-gray-900">Return & Refund</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select items to refund</p></div>
                    </div>
                    <button onClick={() => setShowRefundModal(false)} className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><X size={16} /></button>
                  </div>
                  <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items to Refund</label>
                      {(orderDetail.items || []).map((item: any) => (
                        <label key={item.id} className={cn("flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all", refundItemIds.has(item.id) ? "bg-red-50/50 border-red-200" : "bg-gray-50 border-gray-100 hover:border-gray-200")}>
                          <input type="checkbox" checked={refundItemIds.has(item.id)} onChange={() => toggleRefundItem(item.id)} className="size-5 accent-red-500 rounded-lg" />
                          <div className="flex-1"><p className="text-sm font-black text-gray-900">{item.item?.name || item.offer?.name || 'Item'}</p><p className="text-[10px] font-bold text-gray-400">Qty: {item.quantity} × ₦{Number(item.priceAtOrder).toLocaleString()}</p></div>
                          <span className="text-sm font-black text-gray-900">₦{(Number(item.priceAtOrder) * item.quantity).toLocaleString()}</span>
                        </label>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Refund Total</span>
                      <span className="text-lg font-black text-red-500">₦{(orderDetail.items || []).filter((i: any) => refundItemIds.has(i.id)).reduce((sum: number, i: any) => sum + Number(i.priceAtOrder) * i.quantity, 0).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><MessageSquare size={12} />Reason for Return *</label>
                      <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Explain why this order/items are being returned..." rows={3} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none resize-none focus:border-red-300 focus:ring-4 focus:ring-red-500/10" />
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button onClick={() => setShowRefundModal(false)} className="flex-1 h-12 bg-gray-50 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                    <button onClick={handleRefundConfirm} disabled={updateStatus.isPending || refundItemIds.size === 0} className="flex-1 h-12 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}Confirm Refund
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Stock Warning Modal */}
          <AnimatePresence>
            {stockWarningAffected && (
              <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setStockWarningAffected(null); stockWarningRef.current = null; }} />
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center"><AlertTriangle size={18} className="text-amber-600" /></div>
                      <div><h3 className="text-lg font-black text-gray-900">Low Stock Warning</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Some items have insufficient inventory</p></div>
                    </div>
                    <button onClick={() => { setStockWarningAffected(null); stockWarningRef.current = null; }} className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><X size={16} /></button>
                  </div>
                  <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-xs font-bold text-gray-500">The following items don't have enough stock for the full order quantity:</p>
                    <div className="space-y-2">
                      {stockWarningAffected.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                              Ordered: <span className="text-gray-600">{item.orderedQty}</span> &middot; Available: <span className={item.availableQty > 0 ? 'text-amber-600' : 'text-red-500'}>{item.availableQty}</span>
                            </p>
                          </div>
                          <span className={cn("text-xs font-black px-2.5 py-1 rounded-lg", item.availableQty > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600')}>
                            {item.availableQty > 0 ? `${item.availableQty} available` : 'Out of stock'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button onClick={() => { setStockWarningAffected(null); stockWarningRef.current = null; }} className="flex-1 h-12 bg-gray-50 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                    <button onClick={handleStockWarningProceed} className="flex-1 h-12 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                      <ShoppingBag size={14} />
                      Add Available Stock Only
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      ) : (
        /* ─── DEAL CLAIMS TAB ─── */
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-2xl font-black text-gray-900">{claimStats.total}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1">Total Claims</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
              <p className="text-2xl font-black text-amber-600">{claimStats.claimed}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-1">Pending</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-2xl font-black text-emerald-600">{claimStats.redeemed}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mt-1">Redeemed</p>
            </div>
          </div>

          {selectedClaimId ? (
            /* ── Claim Detail Panel ── */
            (() => {
              const claim = claims.find((c: any) => c.id === selectedClaimId);
              if (!claim) return null;
              const isPending = claim.status === 'claimed';
              const hasProducts = claim.offer?.items?.length > 0;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[32px] shadow-sm">
                  <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <button onClick={() => setSelectedClaimId(null)} className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
                      <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-900">Deal Claim Details</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Code: {claim.claimCode}</p>
                    </div>
                    <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border", isPending ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}>
                      {isPending ? 'Pending' : 'Redeemed'}
                    </span>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Deal / Offer Info */}
                    <div className="bg-violet-50 rounded-2xl p-5 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-400">Deal Offer</h4>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center"><Gift size={18} /></div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{claim.offer?.name || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-gray-400">
                            {hasProducts ? `${claim.offer.items.length} product${claim.offer.items.length > 1 ? 's' : ''}` : 'Custom / Offline deal'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</h4>
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center"><User size={18} /></div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{claim.firstName} {claim.lastName || ''}</p>
                          {claim.phone && <a href={`tel:${claim.phone}`} className="text-[10px] font-bold text-[#066CF4] hover:underline">{claim.phone}</a>}
                          {claim.email && <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Mail size={10} />{claim.email}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Timeline: Claimed & Redeemed */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5"><Clock size={14} className="text-amber-600" /></div>
                          <div>
                            <p className="text-xs font-black text-gray-900">Claimed via Web / Form</p>
                            <p className="text-[9px] font-bold text-gray-400">{new Date(claim.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {!isPending && (
                          <div className="flex items-start gap-3">
                            <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck size={14} className="text-emerald-600" /></div>
                            <div>
                              <p className="text-xs font-black text-gray-900">Redeemed by Staff</p>
                              <p className="text-[9px] font-bold text-gray-400">{new Date(claim.updatedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Claim Code */}
                    <div className="bg-gray-50 rounded-2xl p-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Claim Code</h4>
                      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                        <p className="text-sm font-black text-gray-900 tracking-wider font-mono">{claim.claimCode}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      {isPending && (
                        <>
                          {hasProducts ? (
                            <button
                              onClick={() => handleAcceptClaim(claim)}
                              disabled={redeemClaim.isPending}
                              className="w-full h-14 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              {redeemClaim.isPending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={18} />}
                              Accept & Add to Cart
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkCompleteClick(claim.id)}
                              disabled={redeemClaim.isPending}
                              className="w-full h-14 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              {redeemClaim.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={18} />}
                              Mark as Completed
                            </button>
                          )}
                        </>
                      )}
                      {!isPending && (
                        <p className="text-center text-[10px] font-bold text-emerald-600 uppercase tracking-widest py-2 flex items-center justify-center gap-1.5">
                          <CheckCircle size={12} /> This claim has been redeemed
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()
          ) : (
            /* ── Claim List ── */
            <div className="space-y-3">
              {claimsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
              ) : claims.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm flex flex-col items-center justify-center text-center p-12">
                  <div className="size-20 bg-gray-50 rounded-[24px] flex items-center justify-center mb-4 border border-gray-100"><Gift size={40} className="text-gray-300" /></div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No deal claims yet</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs leading-relaxed">Customers will appear here when they claim your promotions</p>
                </div>
              ) : (
                claims.map((claim: any) => {
                  const isPending = claim.status === 'claimed';
                  const hasProducts = claim.offer?.items?.length > 0;
                  return (
                    <button key={claim.id} onClick={() => setSelectedClaimId(claim.id)}
                      className="w-full bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="size-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                          <Gift size={22} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm font-black text-gray-900 truncate">{claim.firstName} {claim.lastName || ''}</h4>
                            <span className={cn("size-2 rounded-full shrink-0", isPending ? 'bg-amber-500' : 'bg-emerald-500')} />
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 flex-wrap">
                            {claim.phone && <span className="flex items-center gap-1"><Phone size={10} />{claim.phone}</span>}
                            <span className="flex items-center gap-1"><Tag size={10} />{claim.claimCode}</span>
                            {claim.offer?.name && <span className="flex items-center gap-1"><Gift size={10} />{claim.offer.name}</span>}
                            <span>{timeAgo(claim.createdAt)}</span>
                          </div>
                          {hasProducts && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest">Has Products</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={cn("inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", isPending ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>
                            {isPending ? 'Pending' : 'Redeemed'}
                          </span>
                          <div className="mt-2 flex items-center justify-end"><ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" /></div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Mark Complete Confirmation Modal */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowCompleteConfirm(false); setCompletingClaimId(null); }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl overflow-hidden relative shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center"><CheckCircle size={18} className="text-emerald-600" /></div>
                  <div><h3 className="text-lg font-black text-gray-900">Complete Claim</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confirm redemption</p></div>
                </div>
                <button onClick={() => { setShowCompleteConfirm(false); setCompletingClaimId(null); }} className="size-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"><X size={16} /></button>
              </div>
              <div className="p-6">
                <p className="text-sm font-bold text-gray-600">Are you sure you want to mark this claim as completed?</p>
                <p className="text-[10px] font-bold text-gray-400 mt-2">This will mark the deal as redeemed and cannot be undone.</p>
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button onClick={() => { setShowCompleteConfirm(false); setCompletingClaimId(null); }} className="flex-1 h-12 bg-gray-50 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                <button onClick={handleConfirmComplete} disabled={redeemClaim.isPending} className="flex-1 h-12 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {redeemClaim.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Yes, Mark Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}