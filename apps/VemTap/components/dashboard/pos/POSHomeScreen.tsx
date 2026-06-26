'use client';

import React, { useState } from 'react';
import { ShoppingBag, Search, LayoutGrid, Loader2, ScanLine } from 'lucide-react';
import { usePosStore } from '@/store/usePosStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useCatalogueItemsPublic, useCatalogueCategoriesPublic } from '@/services/catalogue/hooks';
import { cn } from '@/lib/utils';
import POSPageHeader from './shared/POSPageHeader';
import BarcodeScanner from '@/components/dashboard/catalogue/BarcodeScanner';
import toast from 'react-hot-toast';

interface POSHomeScreenProps {
  onOpenCart?: () => void;
  businessCode?: string;
  isPublic?: boolean;
  headerActions?: React.ReactNode;
}

export default function POSHomeScreen({ onOpenCart, businessCode, isPublic = false, headerActions }: POSHomeScreenProps) {
  const { cart, addToCart } = usePosStore();
  const { activeBranchId } = useActiveBranch();
  
  const branchId = isPublic ? businessCode : activeBranchId;
  
  const { data: productsData, isLoading: loadingProducts } = useCatalogueItemsPublic(branchId ?? '');
  const { data: categoriesData = [] } = useCatalogueCategoriesPublic(branchId ?? '');
  const products = productsData?.data ?? [];
  const categories = categoriesData ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
    return matchesSearch && matchesCategory && p.status !== 'suspended' && p.status !== 'out_of_stock';
  });

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleBarcodeScan = (product: any) => {
    if (product) {
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice || 0,
        quantity: 1,
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
          <div className="relative flex-1 max-w-lg">
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
            </div>
          )}
        </div>

        {/* Category pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-5 h-10 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              activeCategory === 'all'
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
            )}
          >
            All Items
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 h-10 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border flex items-center gap-2",
                activeCategory === cat.id
                  ? "bg-[#066CF4] text-white border-[#066CF4] shadow-md shadow-[#066CF4]/20"
                  : "bg-white text-gray-600 border-gray-100 hover:border-gray-300"
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid — scrollable independently */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 pb-4">
        {filteredProducts.length > 0 ? (
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
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="size-20 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No products found</h3>
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
