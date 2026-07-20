'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Users, Search, Phone, Mail, ShoppingBag, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface PosCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalVisits: number;
  lastVisitAt: string;
  createdAt: string;
}

// TODO: Replace with real API hook when endpoint is ready
// import { usePosCustomers } from '@/services/pos/hooks';

const MOCK_CUSTOMERS: PosCustomer[] = [
  { id: '1', firstName: 'Chioma', lastName: 'Okafor', email: 'chioma.o@example.com', phone: '+234 802 345 6789', totalSpent: 245800, totalVisits: 18, lastVisitAt: '2026-07-10T14:30:00Z', createdAt: '2025-11-03T10:00:00Z' },
  { id: '2', firstName: 'Emeka', lastName: 'Nwosu', email: 'emeka.n@example.com', phone: '+234 803 456 7890', totalSpent: 182500, totalVisits: 12, lastVisitAt: '2026-07-09T11:15:00Z', createdAt: '2026-01-15T09:00:00Z' },
  { id: '3', firstName: 'Aisha', lastName: 'Mohammed', email: 'aisha.m@example.com', phone: '+234 805 678 9012', totalSpent: 97200, totalVisits: 7, lastVisitAt: '2026-07-08T16:45:00Z', createdAt: '2026-03-20T12:00:00Z' },
  { id: '4', firstName: 'Tunde', lastName: 'Balogun', email: 'tunde.b@example.com', phone: '+234 806 789 0123', totalSpent: 534000, totalVisits: 31, lastVisitAt: '2026-07-10T09:00:00Z', createdAt: '2025-06-01T08:00:00Z' },
  { id: '5', firstName: 'Ngozi', lastName: 'Eze', email: 'ngozi.e@example.com', phone: '+234 807 890 1234', totalSpent: 68900, totalVisits: 5, lastVisitAt: '2026-07-05T13:20:00Z', createdAt: '2026-04-12T11:00:00Z' },
  { id: '6', firstName: 'Kofi', lastName: 'Mensah', email: 'kofi.m@example.com', phone: '+234 808 901 2345', totalSpent: 310200, totalVisits: 22, lastVisitAt: '2026-07-07T15:10:00Z', createdAt: '2025-09-18T10:00:00Z' },
  { id: '7', firstName: 'Zainab', lastName: 'Abubakar', email: 'zainab.a@example.com', phone: '+234 809 012 3456', totalSpent: 41000, totalVisits: 3, lastVisitAt: '2026-06-28T10:30:00Z', createdAt: '2026-05-05T09:00:00Z' },
  { id: '8', firstName: 'Chidi', lastName: 'Okonkwo', email: 'chidi.o@example.com', phone: '+234 810 123 4567', totalSpent: 756000, totalVisits: 45, lastVisitAt: '2026-07-10T12:00:00Z', createdAt: '2025-03-14T08:00:00Z' },
];

const usePosCustomers = (): { data: PosCustomer[]; isLoading: boolean } => ({ data: MOCK_CUSTOMERS, isLoading: false });

export default function CustomersDirectory() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: customers = [], isLoading } = usePosCustomers();

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
                        {new Date(customer.lastVisitAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
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
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-4 py-2 rounded-lg mt-6">
              Awaiting API Endpoint
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
