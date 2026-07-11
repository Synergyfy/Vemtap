'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Phone, Mail, ShoppingBag, Calendar, TrendingUp, Repeat, Star, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Receipt from '@/components/dashboard/pos/shared/Receipt';
import type { ReceiptData } from '@/components/dashboard/pos/shared/Receipt';

interface CustomerDetail extends Record<string, any> {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalVisits: number;
  lastVisitAt: string;
  createdAt: string;
  averageOrderValue: number;
  lifetimeValue: number;
  recentPurchases: { id: string; date: string; total: number; items: number; receipt: string }[];
}

// TODO: Replace with real API hook when endpoint is ready
// import { usePosCustomerDetail } from '@/services/pos/hooks';

const MOCK_CUSTOMERS: Record<string, CustomerDetail> = {
  '1': {
    id: '1', firstName: 'Chioma', lastName: 'Okafor', email: 'chioma.o@example.com', phone: '+234 802 345 6789',
    totalSpent: 245800, totalVisits: 18, lastVisitAt: '2026-07-10T14:30:00Z', createdAt: '2025-11-03T10:00:00Z',
    averageOrderValue: 13656, lifetimeValue: 245800,
    recentPurchases: [
      { id: 's1', date: '2026-07-10T14:30:00Z', total: 32400, items: 3, receipt: 'RCP-20260710-0042' },
      { id: 's2', date: '2026-07-08T11:20:00Z', total: 8500, items: 1, receipt: 'RCP-20260708-0038' },
      { id: 's3', date: '2026-07-05T16:10:00Z', total: 18700, items: 4, receipt: 'RCP-20260705-0029' },
      { id: 's4', date: '2026-06-30T09:45:00Z', total: 5200, items: 2, receipt: 'RCP-20260630-0021' },
      { id: 's5', date: '2026-06-25T13:00:00Z', total: 41000, items: 5, receipt: 'RCP-20260625-0015' },
    ],
  },
  '4': {
    id: '4', firstName: 'Tunde', lastName: 'Balogun', email: 'tunde.b@example.com', phone: '+234 806 789 0123',
    totalSpent: 534000, totalVisits: 31, lastVisitAt: '2026-07-10T09:00:00Z', createdAt: '2025-06-01T08:00:00Z',
    averageOrderValue: 17226, lifetimeValue: 534000,
    recentPurchases: [
      { id: 's6', date: '2026-07-10T09:00:00Z', total: 28500, items: 2, receipt: 'RCP-20260710-0041' },
      { id: 's7', date: '2026-07-07T12:30:00Z', total: 9200, items: 1, receipt: 'RCP-20260707-0035' },
      { id: 's8', date: '2026-07-04T15:15:00Z', total: 36200, items: 6, receipt: 'RCP-20260704-0027' },
      { id: 's9', date: '2026-06-28T10:00:00Z', total: 18500, items: 3, receipt: 'RCP-20260628-0019' },
    ],
  },
  '8': {
    id: '8', firstName: 'Chidi', lastName: 'Okonkwo', email: 'chidi.o@example.com', phone: '+234 810 123 4567',
    totalSpent: 756000, totalVisits: 45, lastVisitAt: '2026-07-10T12:00:00Z', createdAt: '2025-03-14T08:00:00Z',
    averageOrderValue: 16800, lifetimeValue: 756000,
    recentPurchases: [
      { id: 's10', date: '2026-07-10T12:00:00Z', total: 44000, items: 4, receipt: 'RCP-20260710-0043' },
      { id: 's11', date: '2026-07-08T14:20:00Z', total: 12100, items: 2, receipt: 'RCP-20260708-0037' },
      { id: 's12', date: '2026-07-06T17:30:00Z', total: 26800, items: 3, receipt: 'RCP-20260706-0032' },
      { id: 's13', date: '2026-07-03T08:45:00Z', total: 5250, items: 1, receipt: 'RCP-20260703-0024' },
      { id: 's14', date: '2026-06-30T11:15:00Z', total: 18900, items: 5, receipt: 'RCP-20260630-0020' },
      { id: 's15', date: '2026-06-27T10:00:00Z', total: 7200, items: 2, receipt: 'RCP-20260627-0016' },
    ],
  },
};

const usePosCustomerDetail = (id: string): { data: CustomerDetail | null; isLoading: boolean } => {
  const customer = MOCK_CUSTOMERS[id];
  if (!customer) {
    // Create fallback for any ID to show UI
    return {
      data: {
        id, firstName: 'Customer', lastName: id, email: 'customer@example.com', phone: '+234 800 000 0000',
        totalSpent: 0, totalVisits: 0, lastVisitAt: new Date().toISOString(), createdAt: new Date().toISOString(),
        averageOrderValue: 0, lifetimeValue: 0, recentPurchases: [],
      }, isLoading: false,
    };
  }
  return { data: customer, isLoading: false };
};

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: customer, isLoading } = usePosCustomerDetail(id);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto h-full flex items-center justify-center pt-4 px-4 md:px-0 pb-24 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
        <button onClick={() => router.push('/dashboard/pos/customers')} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-6 w-fit">
          <ArrowLeft size={14} /> Back to Customers
        </button>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-[32px] border border-gray-100 shadow-sm">
          <div className="size-24 rounded-[28px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">Customer Profile</h3>
          <p className="text-sm font-medium text-gray-500 max-w-sm leading-relaxed">
            Detailed profile and purchase history will appear here once a customer endpoint is available.
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-4 py-2 rounded-lg mt-6">
            Awaiting API Endpoint
          </p>
        </div>
      </div>
    );
  }

  const initials = ((customer.firstName?.[0] || '') + (customer.lastName?.[0] || '')).toUpperCase() || '?';

  const kpis = [
    { label: 'Total Spent', value: `₦${customer.totalSpent.toLocaleString()}`, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Visits', value: customer.totalVisits.toLocaleString(), icon: Repeat, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Avg Order', value: `₦${Math.round(customer.averageOrderValue).toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Lifetime Value', value: `₦${customer.lifetimeValue.toLocaleString()}`, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <button onClick={() => router.push('/dashboard/pos/customers')} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mb-6 w-fit">
        <ArrowLeft size={14} /> Back to Customers
      </button>

      {/* Customer Header */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-6 md:p-8 shadow-sm mb-6">
        <div className="flex items-center gap-5">
          <div className="size-16 rounded-[20px] bg-gradient-to-br from-blue-500 to-blue-600 text-white font-black flex items-center justify-center text-2xl shadow-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-gray-900">{customer.firstName} {customer.lastName}</h1>
            <p className="text-xs font-bold text-gray-400 mt-0.5">Customer since {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Mail size={13} className="text-gray-400" /> {customer.email}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Phone size={13} className="text-gray-400" /> {customer.phone}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                <Calendar size={13} className="text-gray-400" /> Last visit: {new Date(customer.lastVisitAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm"
          >
            <div className={`size-10 rounded-[12px] flex items-center justify-center mb-3 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-0.5">{kpi.label}</p>
            <p className="text-lg font-black text-gray-900">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Purchases */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm flex-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5">Recent Purchases</h3>
        {customer.recentPurchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Receipt</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Date</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Items</th>
                  <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customer.recentPurchases.map((p, i) => (
                  <tr key={p.id} onClick={() => setSelectedReceipt({
                    business: { name: 'VemTap Store', address: '123 Lagos Street', phone: '+234 800 000 0000' },
                    receiptNumber: p.receipt,
                    createdAt: p.date,
                    cashierName: 'Admin',
                    customer: { firstName: customer.firstName, lastName: customer.lastName },
                    hideCustomerInfo: false,
                    items: Array.from({ length: p.items }, (_, idx) => ({
                      productName: `Item ${idx + 1}`,
                      quantity: 1,
                      unitPrice: Math.round(p.total / p.items),
                      totalPrice: Math.round(p.total / p.items),
                    })),
                    subtotal: p.total,
                    discountAmount: 0,
                    total: p.total,
                    paymentMethod: 'cash',
                    amountPaid: p.total,
                    change: 0,
                  })} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                    <td className="py-3 font-bold text-sm text-blue-600 underline underline-offset-2 decoration-blue-200">{p.receipt}</td>
                    <td className="py-3 text-sm text-gray-500 hidden sm:table-cell">{new Date(p.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</td>
                    <td className="py-3 text-right text-sm font-bold text-gray-700">{p.items}</td>
                    <td className="py-3 text-right text-sm font-black text-gray-900">₦{p.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[180px] text-gray-300">
            <ShoppingBag size={36} className="mb-2 opacity-30" />
            <p className="text-xs font-black uppercase tracking-widest">No purchase history yet</p>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedReceipt(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="text-sm font-black text-gray-900">Receipt</h2>
                  <p className="text-[10px] font-bold text-gray-400">{selectedReceipt.receiptNumber}</p>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <Receipt data={selectedReceipt} showActions />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
