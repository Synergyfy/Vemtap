'use client';

import { useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';

interface ProductsTabProps {
  items: any[];
  isLoading: boolean;
  phone?: string | null;
}

function itemImage(item: any): string {
  return item?.mainImage || item?.galleryImages?.[0] || item?.image || '';
}

export default function ProductsTab({ items, isLoading, phone }: ProductsTabProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const item of items || []) {
      const name = item?.category?.name || item?.categoryName;
      if (name) names.add(name);
    }
    return ['All', ...Array.from(names)];
  }, [items]);

  const filtered =
    activeCategory === 'All'
      ? items
      : items.filter(
          (item) =>
            (item?.category?.name || item?.categoryName) === activeCategory
        );

  return (
    <section id="products-section" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 scroll-mt-32">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-slate-900">Products</h3>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
          {items?.length || 0} Items
        </span>
      </div>

      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-4 mb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#066CF4] text-white border-[#066CF4] shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-[#066CF4]/30 hover:text-[#066CF4]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((item: any) => {
            const image = itemImage(item);
            return (
              <div
                key={item.id}
                className="group border border-slate-100 hover:border-blue-100 bg-white rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col"
              >
                <div className="relative aspect-square bg-gradient-to-br from-blue-50 to-slate-50 overflow-hidden">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package size={32} className="text-[#066CF4]/30" />
                    </div>
                  )}
                </div>
                <div className="p-3.5 flex flex-col flex-1">
                  <h4 className="text-[13px] font-bold text-slate-900 truncate mb-1">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="min-w-0">
                      {item.price !== undefined && item.price !== null && (
                        <span className="text-sm font-black text-slate-900">
                          ₦{Number(item.price).toLocaleString()}
                        </span>
                      )}
                      {item.originalPrice > item.price && (
                        <span className="text-[11px] text-slate-400 line-through ml-1.5">
                          ₦{Number(item.originalPrice).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <a
                      href={phone ? `tel:${phone}` : '#'}
                      aria-label={`Inquire about ${item.name}`}
                      className="size-8 rounded-full bg-blue-50 text-[#066CF4] hover:bg-[#066CF4] hover:text-white flex items-center justify-center transition-all active:scale-90 shrink-0"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
          <Package className="w-8 h-8 text-slate-300 mx-auto mb-2.5" />
          <p className="text-sm font-bold text-slate-600">No products listed yet</p>
          <p className="text-xs text-slate-400 mt-1">Check back soon for new arrivals.</p>
        </div>
      )}
    </section>
  );
}
