'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, LayoutGrid, List, Loader2, ScanLine, ChevronDown, Clock } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItemsPublic, useCatalogueCategoriesPublic } from '@/services/catalogue/hooks';
import { cn } from '@/lib/utils';
import POSPageHeader from './shared/POSPageHeader';
import BarcodeScanner from '@/components/dashboard/catalogue/BarcodeScanner';
import toast from 'react-hot-toast';
import { cacheProducts } from '@/lib/offline/db';
import { useRouter } from 'next/navigation';

interface POSHomeScreenProps {
  onOpenCart?: () => void;
  businessCode?: string;
  isPublic?: boolean;
  headerActions?: React.ReactNode;
}

export default function POSHomeScreen({ onOpenCart, businessCode, isPublic = false, headerActions }: POSHomeScreenProps) {
  const router = useRouter();
  const { cart, addToCart } = usePosStore();
  const { activeBranchId } = useActiveBranch();
  
  const branchId = isPublic ? businessCode : activeBranchId;
  
  const { data: productsData, isLoading: loadingProducts } = useCatalogueItemsPublic(branchId ?? '');
  const { data: categoriesData = [] } = useCatalogueCategoriesPublic(branchId ?? '');
  const products = productsData?.data ?? [];
  const categories = categoriesData ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    return matchesSearch && matchesCategory && p.status !== 'suspended' && p.status !== 'out_of_stock';
  });

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Cache products in IndexedDB for offline use
  useEffect(() => {
    if (products.length > 0 && navigator.onLine) {
      const offlineProducts = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        categoryId: p.categoryId,
        mainImage: p.mainImage,
        galleryImages: p.galleryImages,
        sku: p.sku,
        barcode: p.barcode,
        weight: p.weight,
        dimensions: p.dimensions,
        stockQuantity: p.stockQuantity,
        discountType: p.discountType,
        discountValue: p.discountValue,
        enableLoyaltyPoints: p.enableLoyaltyPoints,
        loyaltyPointsValue: p.loyaltyPointsValue || p.loyaltyPoints,
        allowBackOrder: p.allowBackOrder,
        cachedAt: Date.now(),
      }));
      cacheProducts(offlineProducts);
    }
  }, [products]);

  const handleBarcodeScan = (product: any) => {
    if (product) {
      const existing = cart.find(item => item.productId === product.id);
      const currentQty = existing?.quantity || 0;
      const stockQty = product.stockQuantity ?? Infinity;
      if (currentQty + 1 > stockQty) {
        toast.error(`Not enough stock for ${product.name}`);
        setShowBarcodeScanner(false);
        return;
      }
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice || 0,
        quantity: 1,
        stockQuantity: product.stockQuantity,
        sku: product.sku || '',
        barcode: product.barcode || '',
        image: product.image || '',
        enableLoyaltyPoints: product.enableLoyaltyPoints || false,
        loyaltyPointsValue: product.loyaltyPointsValue || 0,
      });
      toast.success(`${product.name} added to cart`);
    }
    setShowBarcodeScanner(false);
  };

  const scannedProducts = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    barcode: p.barcode || '',
    image: p.mainImage || '',
    categoryId: p.categoryId,
    sku: p.sku || '',
  }));

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {!isPublic && (
        <div className="shrink-0 px-4 pt-4 md:px-0 md:pt-0">
          <POSPageHeader title="Point of Sale" showBack={false} />
        </div>
      )}

      <div className="shrink-0 px-4 md:px-0 mb-4 space-y-4">
        {/* Search bar + Quick Actions row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 md:h-14 pl-12 pr-12 rounded-[24px] border border-gray-200 bg-white shadow-sm focus:outline-none focus:border-[#066CF4]/50 focus:ring-4 focus:ring-[#066CF4]/10 text-sm font-bold text-gray-900 transition-all placeholder:font-medium placeholder:text-gray-400"
            />
            <button onClick={() => setShowBarcodeScanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 size-8 bg-[#066CF4]/10 rounded-xl flex items-center justify-center text-[#066CF4] hover:bg-[#066CF4]/20 transition-colors">
              <ScanLine size={16} />
            </button>
          </div>
          {headerActions && (
            <div className="hidden md:flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                onClick={() => router.push('/dashboard/pos/sales')}
                className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <Clock size={12} /> History
              </button>
            </div>
          )}
        </div>

        {/* Category dropdown */}
        <div className="relative" ref={categoryRef}>
          <button
            onClick={() => { setCategoryOpen(!categoryOpen); setCategorySearch(''); }}
            className="w-full flex items-center gap-3 px-4 h-12 md:h-14 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-gray-300 transition-all"
          >
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest truncate">
                {activeCategory === 'all' ? 'All Items' : categories.find((c: any) => c.id === activeCategory)?.name || 'All Items'}
              </span>
            </div>
            <ChevronDown size={16} className={cn('text-gray-400 transition-transform shrink-0', categoryOpen && 'rotate-180')} />
          </button>
          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-lg z-30 overflow-hidden">
              <div className="p-2 border-b border-gray-50">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium text-gray-900 focus:outline-none focus:border-gray-200 placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                <button
                  onClick={() => { setActiveCategory('all'); setCategoryOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                    activeCategory === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  All Items
                </button>
                {categories
                  .filter((cat: any) => cat.name?.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((cat: any) => (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveCategory(cat.id); setCategoryOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                        activeCategory === cat.id
                          ? 'bg-[#066CF4]/10 text-[#066CF4] font-black'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="shrink-0 px-4 md:px-0 mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filteredProducts.length} items</span>
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
              viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <List size={12} /> List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
              viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <LayoutGrid size={12} /> Grid
          </button>
        </div>
      </div>

      {/* Product grid — scrollable independently */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-4">
        {filteredProducts.length > 0 ? (
          viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product: any) => {
              const stockWarning = product.stockQuantity <= (product.minStock || 5) && product.stockQuantity > 0;
              const outOfStock = product.stockQuantity === 0;
              const inCart = cart.some(item => item.productId === product.id);

              return (
                <button
                  key={product.id}
                  disabled={outOfStock || inCart}
                  onClick={() => addToCart({
                    id: product.id,
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    costPrice: product.costPrice || 0,
                    quantity: 1,
                    stockQuantity: product.stockQuantity,
                    sku: product.sku,
                    barcode: product.barcode,
                    image: product.mainImage,
                    enableLoyaltyPoints: product.enableLoyaltyPoints || false,
                    loyaltyPointsValue: product.loyaltyPointsValue || 0,
                  })}
                  className={cn(
                    "flex flex-col text-left bg-white border rounded-[28px] p-3 shadow-sm transition-all relative group",
                    outOfStock
                      ? "opacity-50 cursor-not-allowed grayscale border-gray-100"
                      : inCart
                        ? "border-[#066CF4] ring-2 ring-[#066CF4]/20 bg-[#066CF4]/5 cursor-default"
                        : "border-gray-100 hover:border-[#066CF4]/30 hover:shadow-md active:scale-95"
                  )}
                >
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    {outOfStock && (
                      <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg">Empty</span>
                    )}
                    {stockWarning && !outOfStock && (
                      <span className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm">Low</span>
                    )}
                  </div>

                  <div className="w-full aspect-square bg-gray-50 rounded-[20px] mb-3 flex items-center justify-center border border-gray-100 overflow-hidden relative group-hover:bg-[#066CF4]/5 transition-colors">
                    {product.mainImage ? (
                      <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <LayoutGrid size={32} className="text-gray-300 group-hover:text-[#066CF4]/30 transition-colors" />
                    )}
                  </div>
                  <div className="px-1 flex-1 flex flex-col justify-between">
                    <h3 className="text-xs font-black text-gray-900 leading-snug line-clamp-2 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-[11px] font-black text-[#066CF4]">₦{product.price.toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{product.stockQuantity} left</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product: any) => {
                const stockWarning = product.stockQuantity <= (product.minStock || 5) && product.stockQuantity > 0;
                const outOfStock = product.stockQuantity === 0;
                const inCart = cart.some(item => item.productId === product.id);

                return (
                  <button
                    key={product.id}
                    disabled={outOfStock || inCart}
                    onClick={() => addToCart({
                      id: product.id,
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      costPrice: product.costPrice || 0,
                      quantity: 1,
                      stockQuantity: product.stockQuantity,
                      sku: product.sku,
                      barcode: product.barcode,
                      image: product.mainImage,
                      enableLoyaltyPoints: product.enableLoyaltyPoints || false,
                      loyaltyPointsValue: product.loyaltyPointsValue || 0,
                    })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 bg-white border rounded-2xl shadow-sm transition-all text-left",
                      outOfStock
                        ? "opacity-50 cursor-not-allowed grayscale border-gray-100"
                        : inCart
                          ? "border-[#066CF4] ring-2 ring-[#066CF4]/20 bg-[#066CF4]/5 cursor-default"
                          : "border-gray-100 hover:border-[#066CF4]/30 hover:shadow-md active:scale-[0.99]"
                    )}
                  >
                    <div className="size-11 md:size-14 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {product.mainImage ? (
                        <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <LayoutGrid size={18} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-black text-gray-900 truncate">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-[#066CF4]">₦{product.price.toLocaleString()}</span>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{product.stockQuantity} left</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {outOfStock && <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg">Empty</span>}
                      {stockWarning && !outOfStock && <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-sm">Low</span>}
                      {inCart && (
                        <div className="size-8 rounded-lg bg-[#066CF4]/10 flex items-center justify-center text-[#066CF4]">
                          <ShoppingBag size={14} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="size-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Start adding products to ring up your first sale</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Try adjusting your search or category</p>
          </div>
        )}
      </div>

      {/* Mobile floating cart button */}
      {!isPublic && (
        <div className="shrink-0 md:hidden px-4 pb-4">
          <button
            onClick={onOpenCart}
            className={cn(
              "w-full h-14 rounded-[20px] shadow-xl flex items-center justify-between px-6 transition-all active:scale-[0.98]",
              cartItemCount > 0
                ? "bg-[#066CF4] text-white shadow-[#066CF4]/30"
                : "bg-gray-900 text-white shadow-gray-900/20"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-[#066CF4] text-[9px] font-black size-5 rounded-full flex items-center justify-center shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">View Cart</span>
            </div>
            {cartItemCount > 0 && (
              <span className="text-sm font-black">
                ₦{usePosStore.getState().getCartTotal().toLocaleString()}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        products={scannedProducts}
        onScan={handleBarcodeScan}
        onClose={() => setShowBarcodeScanner(false)}
      />
    </div>
  );
}
