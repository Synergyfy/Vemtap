'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProductStore } from '@/store/useProductStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Plus, LayoutGrid, MoreVertical } from 'lucide-react';

export default function CategoriesList() {
  const router = useRouter();
  const { categories } = useProductStore();

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title="Categories" 
        subtitle="Organize your products"
        actions={
          <button 
            className="h-10 md:h-12 px-4 md:px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <Plus size={18} />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Add Category</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-sm hover:shadow-md hover:border-[#066CF4]/20 transition-all flex flex-col relative group">
            <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
              <MoreVertical size={18} />
            </button>
            
            <div className={`size-16 rounded-[20px] ${cat.color} text-white flex items-center justify-center text-2xl shadow-lg shadow-current/20 mb-6`}>
              {cat.icon}
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-2">{cat.name}</h3>
            <p className="text-xs font-medium text-gray-500 mb-6 line-clamp-2">{cat.description}</p>
            
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Products</span>
              <span className="text-sm font-black text-[#066CF4] bg-blue-50 px-3 py-1 rounded-lg">{cat.productCount}</span>
            </div>
          </div>
        ))}
        
        {/* Quick Add Card */}
        <button className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-6 flex flex-col items-center justify-center text-gray-400 hover:text-[#066CF4] hover:border-[#066CF4]/30 hover:bg-[#066CF4]/5 transition-all min-h-[240px]">
          <div className="size-16 rounded-[20px] bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm">
            <Plus size={24} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">Create New Category</span>
        </button>
      </div>
    </div>
  );
}
