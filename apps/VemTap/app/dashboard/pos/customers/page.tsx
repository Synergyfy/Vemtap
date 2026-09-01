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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-full flex flex-col pb-24">
      {/* NATIVE APP HEADER SECTION */}
      <section className="relative bg-[#066CF4] -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-5 pb-14 rounded-b-[2rem] shadow-lg mb-6">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Users size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                Directory
              </p>
              <h1 className="text-lg md:text-2xl font-bold text-white tracking-tight">
                Customers
              </h1>
            </div>
          </div>
          
          <div className="pt-1 pb-2">
            <p className="text-blue-100 text-[11px] font-semibold mb-1 flex items-center gap-1.5">
              <Users size={12} /> Total Customers
            </p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {customers.length}
            </h2>
          </div>
        </div>

        {/* Search Bar - Overlapping the Header */}
        <div className="absolute left-0 right-0 -bottom-6 px-5 sm:px-8">
          <div className="relative shadow-lg shadow-black/5 rounded-2xl overflow-hidden">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone or email..."
              className="w-full h-14 pl-12 pr-4 bg-white border-0 text-sm font-bold outline-none text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>
      </section>

      <div className="pt-8 flex-1">
        {customers.length > 0 ? (
          <div className="space-y-3 pb-8">
            {filtered.map((customer, i) => (
              <motion.button
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/dashboard/pos/customers/${customer.id}`)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="size-12 rounded-[14px] bg-[#066CF4] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  {(customer.firstName?.[0] || '?').toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-gray-900 truncate mb-0.5">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-400 truncate">
                    {customer.phone && (
                      <span className="flex items-center gap-1 text-gray-500">
                        <Phone size={10} /> {customer.phone}
                      </span>
                    )}
                    <span>{customer.totalVisits} visits</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-gray-900 block mb-0.5">
                    ₦{customer.totalSpent.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                    Spent
                  </span>
                </div>
              </motion.button>
            ))}
            
            {filtered.length === 0 && (
              <div className="p-8 text-center bg-gray-50 rounded-2xl">
                <p className="text-sm font-bold text-gray-400">Couldn't find any customers matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="size-20 rounded-[24px] bg-blue-50 border border-blue-100 flex items-center justify-center mb-6">
              <Users size={32} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Customer Directory</h3>
            <p className="text-[11px] font-bold text-gray-500 max-w-[200px] leading-relaxed uppercase tracking-wider mx-auto">
              Customers added at checkout will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
