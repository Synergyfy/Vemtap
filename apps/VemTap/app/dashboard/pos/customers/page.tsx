'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomerStore } from '@/store/useCustomerStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Search, Plus, Filter, Users, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function CustomersDirectory() {
  const router = useRouter();
  const { customers, seedCustomers, isSeeded } = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isSeeded) seedCustomers();
  }, [isSeeded, seedCustomers]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Customer Directory" 
        subtitle="Manage loyalty, history, and CRM"
        actions={
          <button className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all">
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Add Customer</span>
          </button>
        }
      />

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        {/* Controls */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or email..." 
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10 bg-white"
            />
          </div>
          <button className="size-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors shrink-0">
            <Filter size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <motion.div 
                key={customer.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => router.push(`/dashboard/pos/customers/${customer.id}`)}
                className="bg-white border border-gray-200 rounded-[24px] p-6 hover:shadow-lg hover:border-[#066CF4]/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="size-12 rounded-xl bg-blue-50 text-blue-600 font-black flex items-center justify-center text-lg border border-blue-100">
                    {customer.name.charAt(0)}
                  </div>
                  {customer.tags.map(tag => (
                    <span key={tag} className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest", tag === 'VIP' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600")}>
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className="text-lg font-black text-gray-900 mb-1">{customer.name}</h3>
                <p className="text-xs font-bold text-gray-500 mb-6">{customer.phone} • {customer.email}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Lifetime Value</p>
                    <p className="text-sm font-black text-emerald-500">₦{customer.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Visits</p>
                    <p className="text-sm font-black text-gray-900">{customer.visitCount}</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full h-[400px] flex flex-col items-center justify-center text-center text-gray-500">
              <Users size={48} className="mb-4 text-gray-300" />
              <p className="text-sm font-black text-gray-900">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
