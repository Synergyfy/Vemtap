'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePosStore, type CompletedSale } from '@/store/usePosStore';
import POSPageHeader from '@/components/dashboard/pos/shared/POSPageHeader';
import { Printer, MessageCircle, Mail, RotateCcw, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';

export default function SingleTransactionScreen() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { getSaleById } = usePosStore();
  const [sale, setSale] = useState<CompletedSale | undefined>(undefined);

  const { data: myBusiness } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();

  const currentBranch = React.useMemo(() => {
      if (!activeBranchId) return null;
      return branches.find(b => b.id === activeBranchId);
  }, [branches, activeBranchId]);

  const businessLogo = currentBranch?.logoUrl || myBusiness?.logoUrl || '/VEMTAP_PNG.png';
  const businessName = currentBranch?.name || myBusiness?.name || 'VemTap';

  useEffect(() => {
    setSale(getSaleById(id));
  }, [id, getSaleById]);

  if (!sale) return null;

  const handleRefund = () => {
    if (sale?.status === 'refunded') return;
    if (window.confirm('Are you sure you want to refund this sale? The inventory will be restocked automatically.')) {
      usePosStore.getState().refundSale(sale!.id);
      
      // Restock the items
      const { useProductStore } = require('@/store/useProductStore');
      useProductStore.getState().returnStock(
        sale!.items.map((item: any) => ({ productId: item.productId, quantity: item.quantity }))
      );
      
      setSale({ ...sale!, status: 'refunded' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4 px-4 md:px-0 pb-24">
      <POSPageHeader 
        title={`Receipt ${sale.receiptNumber}`}
        subtitle={`${new Date(sale.createdAt).toLocaleString()} • Cashier: ${sale.cashierName}`}
        actions={
          sale.status !== 'refunded' && (
            <button 
              onClick={handleRefund}
              className="h-10 md:h-12 px-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-2 hover:bg-red-100 transition-colors"
            >
              <RotateCcw size={18} />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest hidden sm:inline">Refund Sale</span>
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Col — Digital Receipt Preview */}
        <div className="flex justify-center">
          <div className="w-full max-w-[340px] bg-white shadow-xl rounded-sm overflow-hidden border border-gray-100 relative">
            <div className="absolute top-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />
            
            <div className="p-8 pt-10 pb-12 font-mono text-sm text-gray-600 flex flex-col">
              <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-6">
                <div className="size-12 bg-gray-50 flex items-center justify-center mx-auto mb-3 rounded-xl overflow-hidden border border-gray-100">
                  <img src={businessLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                </div>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest">{businessName} Retail</h2>
              </div>

              <div className="space-y-1 mb-6 text-xs">
                <div className="flex justify-between"><span>Receipt No:</span> <span className="font-bold">{sale.receiptNumber}</span></div>
                <div className="flex justify-between"><span>Date:</span> <span>{new Date(sale.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Cashier:</span> <span>{sale.cashierName}</span></div>
                {sale.customer && !sale.hideCustomerInfoOnReceipt && (
                  <div className="flex justify-between"><span>Customer:</span> <span>{sale.customer.name}</span></div>
                )}
              </div>

              <div className="border-y border-dashed border-gray-300 py-3 mb-4 space-y-3">
                {sale.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <div className="max-w-[180px]">
                      <p className="font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-gray-400">{item.quantity} x ₦{item.price.toLocaleString()}</p>
                    </div>
                    <span className="font-bold text-gray-900">₦{((item.price * item.quantity) - item.discount).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs mb-6 border-b border-dashed border-gray-300 pb-4">
                <div className="flex justify-between"><span>Subtotal:</span> <span>₦{sale.subtotal.toLocaleString()}</span></div>
                {sale.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount:</span> <span>-₦{sale.discountAmount.toLocaleString()}</span></div>}
                <div className="flex justify-between items-end mt-2 pt-2">
                  <span className="font-black uppercase text-gray-900 text-sm">Total:</span> 
                  <span className="font-black text-gray-900 text-lg">₦{sale.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs mb-8">
                <div className="flex justify-between">
                  <span className="capitalize">{sale.payment.method} Paid:</span> 
                  <span>₦{sale.payment.amountPaid.toLocaleString()}</span>
                </div>
                {sale.payment.change > 0 && (
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Change:</span> 
                    <span>₦{sale.payment.change.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {sale.status !== 'completed' && (
                <div className="text-center text-xs text-red-500 font-black uppercase tracking-widest mt-4 p-2 border-2 border-red-500 rounded">
                  {sale.status.replace('_', ' ')}
                </div>
              )}
            </div>
            
            <div className="absolute bottom-0 inset-x-0 h-2 bg-repeat-x" style={{ backgroundImage: 'radial-gradient(circle at 4px 8px, transparent 4px, white 5px)', backgroundSize: '8px 8px' }} />
          </div>
        </div>

        {/* Right Col — Actions & Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Receipt Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-[20px] hover:border-[#066CF4]/30 hover:bg-[#066CF4]/5 hover:text-[#066CF4] transition-all group">
                <Printer size={20} className="text-gray-400 group-hover:text-[#066CF4]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Print</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-[20px] hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-600 transition-all group">
                <MessageCircle size={20} className="text-gray-400 group-hover:text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-[20px] hover:border-blue-500/30 hover:bg-blue-50 hover:text-blue-600 transition-all group">
                <Mail size={20} className="text-gray-400 group-hover:text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-[20px] hover:border-purple-500/30 hover:bg-purple-50 hover:text-purple-600 transition-all group">
                <FileText size={20} className="text-gray-400 group-hover:text-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">PDF Export</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Transaction Meta</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Transaction ID</span>
                <span className="text-xs font-black text-gray-900">{sale.id}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Device</span>
                <span className="text-xs font-black text-gray-900">Main Register 1</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Items Count</span>
                <span className="text-xs font-black text-gray-900">{sale.items.reduce((acc, i) => acc + i.quantity, 0)} units</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
