'use client';

import React, { useRef } from 'react';
import { Printer, MessageCircle, Mail, Share2 } from 'lucide-react';

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  business: {
    name: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  };
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  customer?: { firstName: string; lastName: string } | null;
  hideCustomerInfo: boolean;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  showLoyaltyOnReceipt?: boolean;
  loyaltyPointsEarned?: number;
  redeemedReward?: string | null;
  rewardDiscount?: number;
  redeemedPromotion?: { claimCode: string; offerName: string } | null;
}

interface ReceiptProps {
  data: ReceiptData;
  showActions?: boolean;
}

export default function Receipt({ data, showActions = false }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const { business, receiptNumber, createdAt, cashierName, customer, hideCustomerInfo, items, subtotal, discountAmount, total, paymentMethod, amountPaid, change, showLoyaltyOnReceipt, loyaltyPointsEarned, redeemedReward, rewardDiscount, redeemedPromotion } = data;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const receiptHtml = receiptRef.current?.innerHTML || '';
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${receiptNumber}</title>
          <style>
            @page { margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #333; }
            .receipt-print { width: 300px; margin: 0 auto; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 4px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-t { border-top: 1px dashed #999; }
            .border-b { border-bottom: 1px dashed #999; }
            .pt-2 { padding-top: 8px; }
            .pb-2 { padding-bottom: 8px; }
            .mt-2 { margin-top: 8px; }
            .mb-2 { margin-bottom: 8px; }
            .text-lg { font-size: 16px; }
            .text-xs { font-size: 10px; }
            .uppercase { text-transform: uppercase; }
            .tracking-widest { letter-spacing: 2px; }
            img { max-width: 48px; max-height: 48px; }
          </style>
        </head>
        <body>
          <div class="receipt-print">${receiptHtml}</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleWhatsApp = () => {
    const text = [
      `*${business.name}*`,
      `Receipt: ${receiptNumber}`,
      `Date: ${new Date(createdAt).toLocaleString()}`,
      `Cashier: ${cashierName}`,
      '',
      ...items.map(i => `${i.productName} x${i.quantity} — ₦${i.totalPrice.toLocaleString()}`),
      '',
      ...(showLoyaltyOnReceipt && loyaltyPointsEarned && loyaltyPointsEarned > 0 ? [`Loyalty Points: +${loyaltyPointsEarned}`] : []),
      ...(redeemedReward && rewardDiscount ? [`Reward: ${redeemedReward} -₦${rewardDiscount.toLocaleString()}`] : []),
      ...(redeemedPromotion ? [`Promotion: ${redeemedPromotion.offerName} (${redeemedPromotion.claimCode})`] : []),
      `Subtotal: ₦${subtotal.toLocaleString()}`,
      ...(discountAmount > 0 ? [`Discount: -₦${discountAmount.toLocaleString()}`] : []),
      `*Total: ₦${total.toLocaleString()}*`,
      `Paid (${paymentMethod}): ₦${amountPaid.toLocaleString()}`,
      ...(change > 0 ? [`Change: ₦${change.toLocaleString()}`] : []),
      '',
      'Thank you for your patronage!',
      'Powered by VemTap POS',
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div>
      <div ref={receiptRef} className="font-mono text-sm text-gray-600">
        <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
          {business.logoUrl && (
            <div className="size-10 bg-gray-50 flex items-center justify-center mx-auto mb-2 rounded-lg overflow-hidden border border-gray-100">
              <img src={business.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            </div>
          )}
          <h2 className="text-base font-black text-gray-900 uppercase tracking-widest">{business.name}</h2>
          {business.address && <p className="text-[10px] mt-0.5">{business.address}</p>}
          {business.phone && <p className="text-[10px]">Tel: {business.phone}</p>}
        </div>

        <div className="space-y-1 mb-4 text-[11px]">
          <div className="flex justify-between">
            <span>Receipt No:</span>
            <span className="font-bold">{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{new Date(createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{cashierName}</span>
          </div>
          {customer && !hideCustomerInfo && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span>{customer.firstName} {customer.lastName}</span>
            </div>
          )}
        </div>

        <div className="border-y border-dashed border-gray-300 py-3 mb-4 space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <div className="max-w-[180px]">
                <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                <p className="text-gray-400">{item.quantity} x ₦{item.unitPrice.toLocaleString()}</p>
              </div>
              <span className="font-bold text-gray-900 shrink-0">₦{item.totalPrice.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {showLoyaltyOnReceipt && loyaltyPointsEarned && loyaltyPointsEarned > 0 && (
          <div className="text-center text-[10px] mb-3 py-2 px-3 bg-amber-50 border border-amber-100 rounded-md">
            <span className="font-bold text-amber-700">+{loyaltyPointsEarned} loyalty points earned</span>
          </div>
        )}

        {redeemedReward && rewardDiscount && rewardDiscount > 0 && (
          <div className="text-center text-[10px] mb-3 py-2 px-3 bg-emerald-50 border border-emerald-100 rounded-md">
            <span className="font-bold text-emerald-700">{redeemedReward} — ₦{rewardDiscount.toLocaleString()} reward discount</span>
          </div>
        )}

        {redeemedPromotion && (
          <div className="text-center text-[10px] mb-3 py-2 px-3 bg-blue-50 border border-blue-100 rounded-md">
            <span className="font-bold text-blue-700">{redeemedPromotion.offerName} — {redeemedPromotion.claimCode}</span>
          </div>
        )}

        <div className="space-y-1 text-[11px] mb-4 border-b border-dashed border-gray-300 pb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount:</span>
              <span>-₦{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-end mt-2 pt-2">
            <span className="font-black uppercase text-gray-900 text-sm">Total:</span>
            <span className="font-black text-gray-900 text-lg">₦{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-1 text-[11px] mb-6">
          <div className="flex justify-between">
            <span className="capitalize">{paymentMethod} Paid:</span>
            <span>₦{amountPaid.toLocaleString()}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between font-bold text-gray-900">
              <span>Change:</span>
              <span>₦{change.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="text-center text-[10px]">
          <p className="font-bold text-gray-900 mb-1">Thank you for your patronage!</p>
          <p className="text-gray-400">Powered by VemTap POS</p>
        </div>
      </div>

      {showActions && (
        <div className="grid grid-cols-4 gap-2 mt-6">
          <button onClick={handlePrint} className="flex flex-col items-center justify-center gap-1.5 bg-white border border-gray-100 p-3 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
            <div className="size-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
              <Printer size={16} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Print</span>
          </button>
          <button onClick={handleWhatsApp} className="flex flex-col items-center justify-center gap-1.5 bg-white border border-gray-100 p-3 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
            <div className="size-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
              <MessageCircle size={16} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">WhatsApp</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1.5 bg-white border border-gray-100 p-3 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
            <div className="size-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
              <Mail size={16} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Email</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1.5 bg-white border border-gray-100 p-3 rounded-2xl hover:border-emerald-500/30 hover:shadow-md transition-all active:scale-95 group">
            <div className="size-9 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 text-gray-400 group-hover:text-emerald-500 transition-colors">
              <Share2 size={16} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">Share</span>
          </button>
        </div>
      )}
    </div>
  );
}
