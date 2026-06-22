'use client';

import React, { useState } from 'react';
import { usePosStore } from '@/store/usePosStore';
import { useHoldPosSale } from '@/services/pos/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { Trash2, UserPlus, Tag, Plus, Minus, X, ArrowRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { CustomerSelectorModal } from './CustomerSelectorModal';
import { DiscountModal } from './DiscountModal';
import toast from 'react-hot-toast';

export function CartPanel({ onNavigate }: { onNavigate?: () => void } = {}) {
  const router = useRouter();
  const { activeBranchId } = useActiveBranch();
  const holdSale = useHoldPosSale();
  const { 
    cart, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart,
    getCartSubtotal,
    getCartTotal,
    getCartDiscountAmount,
    attachedCustomer,
    attachCustomer,
    cartDiscount,
    setCartDiscount
  } = usePosStore();

  const [showOptions, setShowOptions] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const subtotal = getCartSubtotal();
  const total = getCartTotal();
  const discount = getCartDiscountAmount();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
        <div className="size-24 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm mb-6">
          <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
            <ShoppingBagIcon />
          </div>
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Cart is empty</h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
          Scan a barcode or tap products to add them to the cart
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-gray-900">Current Sale</h2>
          <span className="bg-[#066CF4]/10 text-[#066CF4] text-[10px] font-black px-2 py-0.5 rounded-md">
            {itemCount} items
          </span>
        </div>
        <button 
          onClick={clearCart}
          className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
        >
          Clear
        </button>
      </div>

      {/* Customer & Discount Bar */}
      <div className="p-4 border-b border-gray-100 grid grid-cols-2 gap-3 shrink-0 bg-gray-50/30">
        <button 
          onClick={() => setIsCustomerModalOpen(true)}
          className={cn(
            "flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest",
            attachedCustomer 
              ? "bg-blue-50 border-blue-100 text-blue-600" 
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
          )}
        >
          {attachedCustomer ? <User size={14} /> : <UserPlus size={14} />}
          {attachedCustomer ? attachedCustomer.name.split(' ')[0] : 'Add Customer'}
        </button>
        <button 
          onClick={() => setIsDiscountModalOpen(true)}
          className={cn(
          "flex items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest",
          discount > 0 
            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
        )}>
          <Tag size={14} />
          {discount > 0 ? `Discount Applied` : 'Add Discount'}
        </button>
      </div>

      <CustomerSelectorModal 
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={(customer) => attachCustomer(customer)}
        selectedCustomerId={attachedCustomer?.id}
      />

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onApplyDiscount={setCartDiscount}
        currentDiscount={cartDiscount}
        subtotal={subtotal}
      />

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item) => (
          <div key={item.id} className="flex flex-col p-4 bg-white border border-gray-100 rounded-[24px] shadow-sm relative group hover:border-[#066CF4]/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="size-12 bg-gray-50 rounded-[14px] flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBagIcon size={20} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="text-[13px] font-black text-gray-900 leading-tight truncate">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-black text-[#066CF4]">₦{item.price.toLocaleString()}</span>
                  {item.discount > 0 && (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 rounded-sm">-₦{item.discount}</span>
                  )}
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end gap-2 shrink-0">
                <span className="text-[13px] font-black text-gray-900">
                  ₦{((item.price * item.quantity) - item.discount).toLocaleString()}
                </span>
                <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                  <button 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                    className="size-7 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded-lg transition-all"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-[11px] font-black text-gray-900">{item.quantity}</span>
                  <button 
                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                    className="size-7 flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm rounded-lg transition-all"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Summary */}
      <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)] shrink-0 rounded-t-[32px] relative z-10">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-[11px] font-bold text-gray-500">
            <span>Subtotal</span>
            <span className="text-gray-900">₦{subtotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[11px] font-bold text-emerald-500">
              <span>Discount</span>
              <span>-₦{discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-end pt-3 border-t border-gray-100">
            <span className="text-[12px] font-black uppercase tracking-widest text-gray-900">Total</span>
            <span className="text-2xl font-black text-[#066CF4] tracking-tight">₦{total.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={() => {
              holdSale.mutate({
                branchId: activeBranchId ?? '',
                customerId: attachedCustomer?.id ?? undefined,
                note: 'Held by cashier',
                subtotal,
                discountAmount: discount,
                items: cart.map(i => ({
                  productId: i.productId,
                  productName: i.name,
                  unitPrice: i.price,
                  quantity: i.quantity,
                  discount: i.discount,
                  totalPrice: i.price * i.quantity - i.discount,
                })),
              }, {
                onSuccess: () => {
                  clearCart();
                  toast.success('Sale held');
                },
              });
            }}
            className="col-span-1 h-14 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-[20px] flex items-center justify-center transition-colors border border-gray-200"
            title="Hold Sale"
          >
            <span className="text-[9px] font-black uppercase tracking-widest">Hold</span>
          </button>
          <button 
            onClick={() => { onNavigate?.(); router.push('/dashboard/pos/payment'); }}
            className="col-span-3 h-14 bg-[#066CF4] text-white rounded-[20px] flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
          >
            <span className="text-[12px] font-black uppercase tracking-[0.15em]">Charge ₦{total.toLocaleString()}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ShoppingBagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
