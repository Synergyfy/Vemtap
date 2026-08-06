'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Users, Search, Phone, Mail, ShoppingBag, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePosCustomers } from '@/services/pos/hooks';

export default function CustomersDirectory() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: response, isLoading, isError } = usePosCustomers({ search: search || undefined, limit: 50 });
  const customers = response?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  }, [customers, search]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto h-full flex items-center justify-center pt-4 px-4 md:px-0 pb-24 min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto h-full flex flex-col items-center justify-center pt-4 px-4 md:px-0 pb-24 min-h-[400px]">
        <p className="text-sm font-bold text-red-500">Failed to load customers. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader
        title="Customer Directory"
        subtitle={customers.length > 0 ? `${customers.length} total customers` : 'Manage loyalty, history, and CRM'}
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers by name, email or phone..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-gray-200 text-sm font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        {customers.length > 0 ? (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Customer</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden md:table-cell">Contact</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Total Spent</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center hidden sm:table-cell">Visits</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hidden lg:table-cell">Last Visit</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => router.push(`/dashboard/pos/customers/${customer.id}`)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-[12px] bg-gradient-to-br from-blue-500 to-blue-600 text-white font-black flex items-center justify-center shrink-0 shadow-sm">
                          {(customer.firstName?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{customer.firstName} {customer.lastName}</p>
                          <p className="text-[10px] font-bold text-gray-400">Customer since {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <Mail size={12} className="text-gray-400" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <Phone size={12} className="text-gray-400" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-black text-gray-900">₦{customer.totalSpent.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center justify-center size-8 rounded-xl bg-gray-100 text-gray-600 text-xs font-black">
                        {customer.totalVisits}
                      </span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <Calendar size={12} className="text-gray-400" />
                        {customer.lastVisitAt ? new Date(customer.lastVisitAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <ArrowUpRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && customers.length > 0 && (
              <div className="p-12 text-center">
                <p className="text-sm font-bold text-gray-400">Couldn't find that customer. Try a different name or phone number.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="size-24 rounded-[28px] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center mb-6">
              <Users size={40} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Customer Directory</h3>
            <p className="text-sm font-medium text-gray-500 max-w-sm leading-relaxed">
              Customers added at checkout will appear here. You&apos;ll be able to view their purchase history, contact info, and loyalty activity.
            </p>
            <div className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
              <span>No customers registered yet</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
