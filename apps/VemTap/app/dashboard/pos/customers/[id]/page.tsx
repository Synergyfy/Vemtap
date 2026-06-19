'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerStore, type Customer } from '@/store/useCustomerStore';
import { usePosStore } from '@/store/usePosStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Phone, Mail, MapPin, Edit, Calendar, Banknote, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomerDetailsScreen() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { getCustomer } = useCustomerStore();
  const { completedSales } = usePosStore();
  
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);

  useEffect(() => {
    setCustomer(getCustomer(id));
  }, [id, getCustomer]);

  if (!customer) return null;

  // Find sales for this customer
  const customerSales = completedSales.filter(s => s.customer?.id === customer.id);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title={customer.name}
        subtitle="Customer Profile & History"
        actions={
          <button className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 flex items-center gap-2 hover:bg-gray-200 transition-colors">
            <Edit size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Edit Profile</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col — Profile Meta */}
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 p-6 md:p-8 shadow-sm">
            <div className="size-24 rounded-2xl bg-[#066CF4] text-white text-4xl font-black flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
              {customer.name.charAt(0)}
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-1">{customer.name}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Customer since {new Date(customer.createdAt).getFullYear()}</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0"><Phone size={14} /></div>
                <span className="text-sm font-bold">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0"><Mail size={14} /></div>
                <span className="text-sm font-bold truncate">{customer.email}</span>
              </div>
            </div>
            
            {customer.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {customer.tags.map(tag => (
                    <span key={tag} className={cn("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest", tag === 'VIP' ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-600")}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col — Stats & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
              <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4"><Banknote size={18} /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">₦{customer.totalSpent.toLocaleString()}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Lifetime Value</p>
            </div>
            <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4"><ShoppingBag size={18} /></div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">{customer.visitCount}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Visits</p>
            </div>
            <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
              <div className="size-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4"><Calendar size={18} /></div>
              <h3 className="text-lg font-black text-gray-900 mb-1 line-clamp-1">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Last Visit</p>
            </div>
          </div>

          {/* Purchase History */}
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900">Purchase History</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Past receipts linked to this profile</p>
            </div>
            
            <div className="p-4 space-y-2">
              {customerSales.length > 0 ? (
                customerSales.map(sale => (
                  <div key={sale.id} onClick={() => router.push(`/dashboard/pos/sales/${sale.id}`)} className="p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#066CF4] transition-colors">
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900">{sale.receiptNumber}</h4>
                        <p className="text-[10px] font-bold text-gray-500 mt-0.5">{new Date(sale.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#066CF4]">₦{sale.total.toLocaleString()}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{sale.items.length} items</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-xs font-bold uppercase tracking-widest">No purchases yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
