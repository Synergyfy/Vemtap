'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useCatalogueItems, useUpdateCatalogueItem } from '@/services/catalogue/hooks';
import { generateBarcodeValue } from '@/lib/barcode';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import BarcodeLabelSheet from '@/components/dashboard/catalogue/BarcodeLabelSheet';
import { 
  Tag, Printer, Download, RefreshCw, 
  Search, Loader2, CheckCircle, 
  AlertTriangle, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BarcodeCenter() {
  const { data: business } = useMyBusiness();
  const activeBranchId = business?.branches?.[0]?.id || '';
  const { data: items = [], isLoading } = useCatalogueItems({ branchId: activeBranchId });

  const getFinalPrice = (item: any) => {
    const price = Number(item.price) || 0;
    const hasDiscount = item.discountType && item.discountType !== 'none' && item.discountValue;
    if (!hasDiscount) return price;
    const dv = Number(item.discountValue) || 0;
    return item.discountType === 'percentage' ? price - (price * dv / 100) : price - dv;
  };

  const hasDiscount = (item: any) => item.discountType && item.discountType !== 'none' && item.discountValue;
  const updateMutation = useUpdateCatalogueItem();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [processingPrint, setProcessingPrint] = useState(false);

  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    items.forEach((item: any) => {
      const cat = item.category;
      if (cat?.id && cat?.name) cats.set(cat.id, cat.name);
    });
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item: any) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.barcode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter;
      return matchesSearch && matchesCategory && item.status !== 'suspended';
    });
  }, [items, searchTerm, categoryFilter]);

  const selectedProducts = useMemo(() => {
    return items.filter((item: any) => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const withBarcode = filtered.filter((item: any) => item.barcode);
  const withoutBarcode = filtered.filter((item: any) => !item.barcode);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((item: any) => item.id)));
    }
  };

  const handleGenerateMissing = async () => {
    const missing = withoutBarcode;
    if (missing.length === 0) {
      toast('All products already have barcodes');
      return;
    }
    setGenerating(true);
    let count = 0;
    for (const item of missing) {
      try {
        const barcode = generateBarcodeValue(item.id, item.name);
        await updateMutation.mutateAsync({ id: item.id, data: { barcode } as any });
        count++;
      } catch {}
    }
    setGenerating(false);
    toast.success(`${count} barcodes generated`);
  };

  const handlePrint = useCallback(() => {
    if (selectedProducts.length === 0) {
      toast.error('Select at least one product');
      return;
    }
    setProcessingPrint(true);
    setTimeout(() => {
      setProcessingPrint(false);
      window.print();
    }, 300);
  }, [selectedProducts]);

  const handleExportPdf = useCallback(async () => {
    if (selectedProducts.length === 0) {
      toast.error('Select at least one product');
      return;
    }
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageW = 210;
      const margin = 10;
      const cols = 3;
      const cardW = (pageW - margin * 2) / cols;
      const cardH = 40;

      const { renderBarcodeDataUrl } = await import('@/lib/barcode');

      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        if (i > 0 && i % (cols * 7) === 0) doc.addPage();

        const col = i % cols;
        const row = Math.floor(i / cols) % 7;
        const x = margin + col * cardW;
        const y = margin + row * cardH;

        if (product.barcode) {
          try {
            const dataUrl = await renderBarcodeDataUrl(product.barcode);
            doc.addImage(dataUrl, 'PNG', x + 2, y + 2, cardW - 4, 20);
          } catch {}
        }
        doc.setFontSize(7);
        doc.text(product.name, x + cardW / 2, y + 28, { align: 'center' });
        doc.setFontSize(8);
        doc.text(`₦${product.price.toLocaleString()}`, x + cardW / 2, y + 34, { align: 'center' });
      }

      doc.save('barcodes.pdf');
      toast.success('PDF exported');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  }, [selectedProducts]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
        <POSPageHeader title="Barcode Center" subtitle="Generate and print product barcodes" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader title="Barcode Center" subtitle="Generate and print product barcodes" />

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, barcode, or SKU..."
            className="w-full h-12 pl-11 pr-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-[#066CF4]/50 focus:ring-4 focus:ring-[#066CF4]/10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-12 px-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none cursor-pointer min-w-[140px]"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-2xl font-black text-gray-900">{items.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Total Products</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{withBarcode.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">With Barcode</p>
        </div>
        <div className={cn(
          "p-4 rounded-2xl border shadow-sm",
          withoutBarcode.length > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"
        )}>
          <p className="text-2xl font-black text-amber-600">{withoutBarcode.length}</p>
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Missing Barcode</p>
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={toggleSelectAll}
              className="size-5 accent-[#066CF4] rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {selectedIds.size} Selected
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateMissing}
              disabled={generating || withoutBarcode.length === 0}
              className="h-9 px-4 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Generate Missing
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-400">Generate barcodes once you've added products to your catalogue</p>
            </div>
          ) : (
            filtered.map((item: any) => {
              const hasBarcode = !!item.barcode;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer",
                    selectedIds.has(item.id) && "bg-[#066CF4]/5"
                  )}
                  onClick={() => toggleSelect(item.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => {}}
                    className="size-5 accent-[#066CF4] rounded-lg shrink-0"
                  />
                  {item.mainImage ? (
                    <img src={item.mainImage} alt={item.name} className="size-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <div className="size-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-gray-400">₦{getFinalPrice(item).toLocaleString()}</p>
                    {hasDiscount(item) && <p className="text-[9px] font-bold text-gray-400 line-through">₦{Number(item.price).toLocaleString()}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    {hasBarcode ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{item.barcode}</span>
                        <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-500 uppercase">Missing</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExportPdf}
          disabled={selectedProducts.length === 0}
          className="flex-1 h-14 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 disabled:opacity-40 transition-all shadow-sm"
        >
          <Download size={18} />
          Export PDF ({selectedProducts.length})
        </button>
        <button
          onClick={handlePrint}
          disabled={selectedProducts.length === 0 || processingPrint}
          className="flex-1 h-14 bg-[#066CF4] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
        >
          {processingPrint ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
          Print Labels ({selectedProducts.length})
        </button>
      </div>

      {/* Hidden Print Sheet */}
      <div className="hidden print:block fixed inset-0 z-[200] bg-white">
        <BarcodeLabelSheet products={selectedProducts.map((p: any) => ({ name: p.name, price: p.price, barcode: p.barcode || '' }))} />
      </div>
    </div>
  );
}
