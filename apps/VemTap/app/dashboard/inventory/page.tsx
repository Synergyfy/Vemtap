'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCatalogueItems } from '@/services/catalogue/hooks';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Package, Plus, Search, Edit2, Archive, AlertTriangle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ProductModal from '@/components/dashboard/catalogue/ProductModal';
import AddProductMethodModal from '@/components/dashboard/catalogue/AddProductMethodModal';
import BarcodeScanner from '@/components/dashboard/catalogue/BarcodeScanner';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function InventoryDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: business } = useMyBusiness();
  const activeBranchId = business?.branches?.[0]?.id || '';
  const { data: items = [], isLoading } = useCatalogueItems({ branchId: activeBranchId });
  
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [scannedProductData, setScannedProductData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Open method chooser if ?add=true in URL
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowMethodModal(true);
      router.replace('/dashboard/inventory', { scroll: false });
    }
  }, [searchParams, router]);

  const filteredItems = items.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.stockQuantity || 0), 0);
  const outOfStock = items.filter((item: any) => (item.stockQuantity || 0) === 0).length;
  const lowStock = items.filter((item: any) => (item.stockQuantity || 0) > 0 && (item.stockQuantity || 0) <= 5).length;

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setScannedProductData(null);
    setShowMethodModal(true);
  };

  const handleMethodSelect = (method: 'manual' | 'bulk' | 'barcode') => {
    setShowMethodModal(false);
    if (method === 'manual') {
      setShowProductModal(true);
    } else if (method === 'bulk') {
      router.push('/dashboard/catalogue/import');
    } else if (method === 'barcode') {
      setShowBarcodeScanner(true);
    }
  };

  const handleBarcodeScan = (product: any) => {
    if (product) {
      setScannedProductData({
        name: product.name,
        price: product.price,
        shortDescription: '',
        description: '',
        categoryId: '',
        branchId: activeBranchId,
        sku: product.sku,
        itemType: 'product' as const,
        discountType: 'none' as const,
        discountValue: 0,
        stockQuantity: 0,
        loyaltyPoints: 0,
        allowBackOrder: true,
        applyGlobally: false,
        mainImage: '',
        galleryImages: [],
      });
      setShowBarcodeScanner(false);
      setShowProductModal(true);
    } else {
      setShowBarcodeScanner(false);
      setShowMethodModal(true);
    }
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
    setScannedProductData(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 pb-28 md:pb-8">
      <POSPageHeader 
        title="Inventory Manager" 
        subtitle="Source of truth for all your products, stock levels, and pricing"
        actions={
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard/catalogue/import')}
              className="h-12 px-6 rounded-2xl bg-white border border-gray-100 text-gray-900 flex items-center gap-2 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Upload size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest hidden md:inline">Bulk Import</span>
            </button>
            <button 
              onClick={handleAdd}
              className="h-12 px-6 rounded-2xl bg-[#066CF4] text-white flex items-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
            >
              <Plus size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest hidden md:inline">Add Product</span>
            </button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-[#066CF4]/20 transition-colors">
          <div className="size-12 rounded-2xl flex items-center justify-center mb-4 border bg-blue-50 text-[#066CF4] border-blue-100 transition-transform group-hover:scale-110">
            <Package size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 leading-none mb-1">{items.length}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Items</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-emerald-500/20 transition-colors">
          <div className="size-12 rounded-2xl flex items-center justify-center mb-4 border bg-emerald-50 text-emerald-500 border-emerald-100 transition-transform group-hover:scale-110">
            <span className="font-bold text-lg">₦</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">₦{totalValue.toLocaleString()}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Value</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-amber-500/20 transition-colors">
          <div className="size-12 rounded-2xl flex items-center justify-center mb-4 border bg-amber-50 text-amber-500 border-amber-100 transition-transform group-hover:scale-110">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 leading-none mb-1">{lowStock}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Low Stock</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-red-500/20 transition-colors">
          <div className="size-12 rounded-2xl flex items-center justify-center mb-4 border bg-red-50 text-red-500 border-red-100 transition-transform group-hover:scale-110">
            <Archive size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-gray-900 leading-none mb-1">{outOfStock}</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Out of Stock</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content — Products Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-black text-gray-900">All Products</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, category, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Product</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Price</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm font-bold">Loading products...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm font-bold">No products found.</td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
                          {item.mainImage ? <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" /> : <Package size={20} className="text-gray-400" />}
                        </div>
                        <div>
                          <div className="text-sm font-black text-gray-900">{item.name}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">SKU: {item.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">{item.category?.name || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-gray-900">₦{Number(item.price).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn("text-sm font-black", (item.stockQuantity || 0) === 0 ? "text-red-500" : (item.stockQuantity || 0) <= 5 ? "text-amber-500" : "text-emerald-500")}>
                        {item.stockQuantity || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border", item.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-600 border-gray-200")}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-[#066CF4] hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddProductMethodModal
        isOpen={showMethodModal}
        onSelectMethod={handleMethodSelect}
        onClose={() => setShowMethodModal(false)}
      />

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={() => { setShowBarcodeScanner(false); setShowMethodModal(true); }}
      />

      <ProductModal 
        isOpen={showProductModal} 
        onClose={handleCloseProductModal} 
        product={selectedProduct || scannedProductData} 
        activeBranchId={activeBranchId} 
      />
    </div>
  );
}
