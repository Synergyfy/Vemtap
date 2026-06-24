'use client';

import React, { useState } from 'react';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { ShoppingBag, Clock, CheckCircle, XCircle, Loader2, ChevronRight, Phone, User, Package, ArrowLeft, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalogueOrders, useCatalogueOrderDetails, useUpdateCatalogueOrderStatus, OrderStatus } from '@/services/catalogue/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { motion, AnimatePresence } from 'framer-motion';
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
  rejected: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: 'Rejected' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function OrdersDashboard() {
  const { activeBranchId } = useActiveBranch();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const updateStatus = useUpdateCatalogueOrderStatus();

  const { data: ordersData, isLoading } = useCatalogueOrders({
    branchId: activeBranchId ?? undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const orders = ordersData?.data ?? [];
  const totalOrders = ordersData?.total ?? 0;

  const { data: orderDetail, isLoading: loadingDetail } = useCatalogueOrderDetails(selectedOrderId ?? '');

  const handleStatusChange = (id: string, status: OrderStatus) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast.success(`Order ${status === 'completed' ? 'completed' : status === 'processing' ? 'accepted' : status === 'rejected' ? 'rejected' : 'updated'}`);
        setSelectedOrderId(null);
      },
      onError: (err: any) => toast.error(err?.message || 'Failed to update order'),
    });
  };

  const getActionButtons = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange(selectedOrderId!, 'processing')}
              disabled={updateStatus.isPending}
              className="flex-1 h-12 bg-[#066CF4] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
              Accept Order
            </button>
            <button
              onClick={() => handleStatusChange(selectedOrderId!, 'rejected')}
              disabled={updateStatus.isPending}
              className="h-12 px-4 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        );
      case 'processing':
        return (
          <button
            onClick={() => handleStatusChange(selectedOrderId!, 'completed')}
            disabled={updateStatus.isPending}
            className="w-full h-12 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={16} />}
            Mark Complete
          </button>
        );
      default:
        return null;
    }
  };

  const newOrdersCount = orders.filter(o => o.status === 'new').length;

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Orders"
        subtitle="Manage incoming orders from your public POS"
        actions={
          newOrdersCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
              <AlertCircle size={16} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{newOrdersCount} new</span>
            </div>
          )
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-5 h-10 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0",
              statusFilter === tab.value
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List vs Detail View */}
      {selectedOrderId && orderDetail ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
          {/* Detail Header */}
          <div className="p-6 border-b border-gray-100 flex items-center gap-4">
            <button onClick={() => setSelectedOrderId(null)} className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <h3 className="text-lg font-black text-gray-900">Order Details</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {orderDetail.id?.slice(0, 8)}</p>
            </div>
            <span className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
              STATUS_STYLES[orderDetail.status]?.bg,
              STATUS_STYLES[orderDetail.status]?.text,
              STATUS_STYLES[orderDetail.status]?.bg.replace('bg-', 'border-').replace('50', '200'),
            )}>
              {STATUS_STYLES[orderDetail.status]?.label}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Customer Info */}
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</h4>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        {orderDetail.customer?.firstName} {orderDetail.customer?.lastName}
                      </p>
                      <a href={`tel:${orderDetail.customer?.phone}`} className="text-[10px] font-bold text-[#066CF4] hover:underline">
                        {orderDetail.customer?.phone}
                      </a>
                    </div>
                  </div>
                  {orderDetail.customer?.email && (
                    <p className="text-xs text-gray-500">{orderDetail.customer.email}</p>
                  )}
                  {orderDetail.tableNumber && (
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                      <span>Table: {orderDetail.tableNumber}</span>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items ({orderDetail.items?.length || 0})</h4>
                    <span className="text-[10px] font-bold text-gray-400">{new Date(orderDetail.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="space-y-2">
                    {(orderDetail.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                            <Package size={16} className="text-gray-400" />
                          </div>
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

                {/* Notes */}
                {orderDetail.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                      <p className="text-xs font-bold text-amber-700">{orderDetail.notes}</p>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-sm font-black text-gray-900">Total</span>
                  <span className="text-2xl font-black text-[#066CF4]">₦{Number(orderDetail.totalAmount).toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                  {getActionButtons(orderDetail.status)}
                  {['completed', 'cancelled', 'rejected'].includes(orderDetail.status) && (
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
                      This order has been {orderDetail.status}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Orders List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={32} className="animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm flex flex-col items-center justify-center text-center p-12">
                <div className="size-20 bg-gray-50 rounded-[24px] flex items-center justify-center mb-4 border border-gray-100">
                  <ShoppingBag size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No orders yet</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-xs leading-relaxed">
                  {statusFilter === 'all' ? 'Orders from your public POS will appear here' : `No ${statusFilter} orders found`}
                </p>
              </div>
            ) : (
              orders.map((order: any) => {
                const style = STATUS_STYLES[order.status] || STATUS_STYLES.new;
                const itemCount = order.items?.length || 0;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="w-full bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left group active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("size-12 rounded-2xl flex items-center justify-center shrink-0 border", style.bg, style.bg.replace('bg-', 'border-').replace('50', '100'))}>
                        <ShoppingBag size={22} className={style.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-black text-gray-900 truncate">
                            {order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName || ''}` : 'Anonymous Customer'}
                          </h4>
                          <span className={cn("size-2 rounded-full shrink-0", style.dot)} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400">
                          {order.customer?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              {order.customer.phone}
                            </span>
                          )}
                          <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                          <span>{timeAgo(order.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-gray-900">₦{Number(order.totalAmount).toLocaleString()}</p>
                        <span className={cn("inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest", style.bg, style.text)}>
                          {style.label}
                        </span>
                      </div>
                      <div className="flex items-center pl-2">
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
