import React, { useState } from 'react';
import { ChevronRight, UtensilsCrossed, ArrowLeft, ShoppingBag, X, CheckCircle } from 'lucide-react';
import type { MenuData } from '../types/qr';

interface MenuPreviewProps {
  data?: MenuData;
}

const MenuPreview: React.FC<MenuPreviewProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [cart, setCart] = useState<Record<string, { item: any, quantity: number }>>({});
  const [view, setView] = useState<'menu' | 'checkout' | 'details' | 'success'>('menu');
  const [note, setNote] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [details, setDetails] = useState({ name: '', email: '', phone: '', address: '' });

  const addToCart = (item: any) => setCart(prev => ({ ...prev, [item.id]: { item, quantity: (prev[item.id]?.quantity || 0) + 1 } }));
  const removeFromCart = (item: any) => {
    setCart(prev => {
        const newCart = { ...prev };
        if (newCart[item.id].quantity > 1) newCart[item.id].quantity -= 1;
        else delete newCart[item.id];
        return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((acc, curr) => acc + curr.quantity, 0);
  const totalPrice = Object.values(cart).reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);

  if (view === 'success') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{data?.successTitle || 'Order Placed!'}</h2>
            <p className="text-gray-500 mb-8">{data?.successMessage || `Thank you, ${details.name}. Your order is on the way.`}</p>
            <div className="flex flex-col gap-3 w-full max-w-[260px]">
              <button onClick={() => { setCart({}); setView('menu'); setSelectedCategory(null); }} className="w-full px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl">Back to Menu</button>
              {data?.showWhatsappCta && data?.whatsappNumber && (
                <a
                  href={`https://wa.me/${data.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-6 py-3 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-colors shadow-lg shadow-green-200"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Chat with us on WhatsApp
                </a>
              )}
            </div>
        </div>
      )
  }

  if (view === 'details') {
      return (
        <div className="flex-1 flex flex-col bg-gray-50 -mx-6 -mt-6 min-h-full p-6">
            <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setView('checkout')} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-xl font-bold">Customer Details</h2>
            </div>
            <div className="space-y-4">
                {(data?.customFields || [{id: '1', label: 'Full Name', type: 'text'}, {id: '2', label: 'Email', type: 'email'}, {id: '3', label: 'Phone', type: 'tel'}, {id: '4', label: 'Address', type: 'textarea'}]).map((field) => (
                    <div key={field.id} className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{field.label}</p>
                        {field.type === 'textarea' ? (
                            <textarea placeholder={field.label} className="w-full p-4 rounded-2xl text-sm border-0" value={(details as any)[field.label.toLowerCase().replace(/\s/g, '')] || ''} onChange={e => setDetails({...details, [field.label.toLowerCase().replace(/\s/g, '')]: e.target.value})} />
                        ) : (
                            <input type={field.type} placeholder={field.label} className="w-full p-4 rounded-2xl text-sm border-0" value={(details as any)[field.label.toLowerCase().replace(/\s/g, '')] || ''} onChange={e => setDetails({...details, [field.label.toLowerCase().replace(/\s/g, '')]: e.target.value})} />
                        )}
                    </div>
                ))}
                <button onClick={() => setView('success')} className="w-full max-w-[calc(100%-32px)] mx-auto block py-4 bg-gray-900 text-white font-bold rounded-2xl text-center">Confirm Order</button>
            </div>
        </div>
      )
  }

  if (view === 'checkout') {
      return (
        <div className="flex-1 flex flex-col bg-gray-50 -mx-6 -mt-6 min-h-full scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
            <div className="p-6 border-b border-gray-100 flex items-center sticky top-0 bg-white z-10 shadow-sm">
                <button onClick={() => setView('menu')} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-xl font-bold ml-2">Checkout</h2>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide">
                {Object.values(cart).map((c, i) => (
                    <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <img src={c.item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80"} className="w-16 h-16 rounded-2xl object-cover" />
                        <div className="flex-1">
                            <h3 className="font-bold text-sm">{c.item.name}</h3>
                            <p className="text-blue-600 font-bold text-xs">{data?.currency || '$'}{c.item.price.toLocaleString()}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <button onClick={() => removeFromCart(c.item)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">-</button>
                                <span className="font-bold text-sm w-4 text-center">{c.quantity}</span>
                                <button onClick={() => addToCart(c.item)} className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">+</button>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-sm">{data?.currency || '$'}{(c.item.price * c.quantity).toLocaleString()}</p>
                             <button onClick={() => setCart(prev => { const n = {...prev}; delete n[c.item.id]; return n; })} className="text-red-400 p-2"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 mt-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Details (Optional)</p>
                    <textarea placeholder="Add a note (e.g. no onions, extra sauce...)" className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-0 focus:ring-0" rows={2} value={note} onChange={e => setNote(e.target.value)} />
                    <input type="text" placeholder="Table number (optional)" className="w-full p-4 bg-gray-50 rounded-2xl text-sm border-0 focus:ring-0" value={tableNumber} onChange={e => setTableNumber(e.target.value)} />
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center mt-2">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                        <span className="text-lg font-black text-blue-900">{data?.currency || '$'}{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Items</span>
                         <span className="block font-black text-lg">{totalItems}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
                <button onClick={() => setView('details')} className="w-full max-w-[calc(100%-32px)] mx-auto py-4 bg-gray-900 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl text-sm">
                    <ShoppingBag className="w-4 h-4" />
                    PLACE ORDER - {data?.currency || '$'}{totalPrice.toLocaleString()}
                </button>
            </div>
        </div>
      )
  }

  if (selectedCategory) {
    return (
      <div className="flex-1 flex flex-col relative bg-white -mx-6 -mt-6 min-h-full">
        <div className="bg-white p-6 pb-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
          <button onClick={() => setSelectedCategory(null)} className="p-2 -ml-2"><ArrowLeft /></button>
          <h2 className="text-xl font-bold ml-2">{selectedCategory.name}</h2>
        </div>

        <div className="px-6 py-6 space-y-4 pb-24">
          {selectedCategory.items.map((item: any, idx: number) => {
            const demoImages = ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80"];
            const imageUrl = item.image || demoImages[idx % demoImages.length];
            const inCart = cart[item.id];
            return (
              <div key={idx} className="bg-white p-3 rounded-[2rem] border border-gray-100 flex gap-4">
                <div className="w-24 h-24 shrink-0 rounded-[1.5rem] overflow-hidden bg-gray-100">
                  <img src={imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center gap-1 pr-2 flex-1">
                  <h3 className="text-sm font-semibold">{item.name}</h3>
                  <p className="text-sm font-bold text-blue-600">{data?.currency || '$'}{item.price.toLocaleString()}</p>
                  
                  {inCart ? (
                    <div className="flex items-center gap-3 mt-1">
                        <button onClick={() => removeFromCart(item)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">-</button>
                        <span className="font-bold">{inCart.quantity}</span>
                        <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="mt-1 px-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl w-fit">Add</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {/* Floating Cart Footer */}
        {totalItems > 0 && (
            <div className="absolute bottom-6 left-6 right-6 bg-gray-900 text-white p-4 rounded-2xl flex justify-between items-center z-20 shadow-xl">
                <div>
                    <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">{totalItems} items</p>
                    <p className="font-bold">{data?.currency || '$'}{totalPrice.toLocaleString()}</p>
                </div>
                <button onClick={() => setView('checkout')} className="px-6 py-3 bg-blue-600 font-bold rounded-xl text-sm">Order Now</button>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative -mx-6 -mt-6" style={{ backgroundColor: data?.themeColor || '#3b82f6' }}>
      {data?.banner && (
        <div className="absolute top-0 left-0 w-full h-48">
          <img src={data.banner} className="w-full h-full object-cover opacity-20" />
        </div>
      )}
      <div className="px-6 pt-12 pb-8 text-center text-white relative z-10">
        <div className="w-24 h-24 rounded-3xl shadow-xl overflow-hidden bg-white flex items-center justify-center shrink-0 mx-auto mb-6 border-4 border-white">
          {data?.logo ? <img src={data.logo} className="w-full h-full object-cover" /> : <UtensilsCrossed className="w-12 h-12 text-gray-300" />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{data?.restaurantName || 'Restaurant'}</h1>
        {data?.description && <p className="text-md text-white/90 font-medium leading-relaxed mt-2 max-w-[280px] mx-auto">{data.description}</p>}
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] px-6 py-8 space-y-4">
        {(data?.categories || []).map((category) => (
          <button key={category.id} onClick={() => setSelectedCategory(category)} className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center transition-all hover:bg-gray-50">
            <span className="text-lg font-medium text-gray-900">{category.name || 'Category'}</span>
            <ChevronRight className="w-6 h-6 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuPreview;