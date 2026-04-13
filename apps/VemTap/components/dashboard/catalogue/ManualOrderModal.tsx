'use client';

import React, { useState, useMemo } from 'react';
import { 
    X, 
    Plus, 
    Trash2, 
    User, 
    Phone, 
    Mail, 
    ShoppingCart, 
    Search,
    ChevronRight,
    ChevronLeft,
    Check
} from 'lucide-react';
import { 
    useCatalogueItems, 
    useCatalogueOffersAdmin, 
    useCreateCatalogueOrder,
    useCatalogueCategories,
    CatalogueItem,
    CatalogueOffer
} from '@/services/catalogue/hooks';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ManualOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchId: string;
}

type Step = 'customer' | 'items' | 'review';

export default function ManualOrderModal({ isOpen, onClose, branchId }: ManualOrderModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<Step>('customer');
    
    // Form State
    const [customerInfo, setCustomerInfo] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        notes: '',
        tableNumber: ''
    });

    const [selectedItems, setSelectedItems] = useState<{
        itemId?: string;
        offerId?: string;
        newItem?: {
            name: string;
            price: number;
            categoryId?: string;
        };
        name: string;
        price: number;
        quantity: number;
        type: 'item' | 'offer' | 'new';
    }[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddItem, setQuickAddItem] = useState({
        name: '',
        price: '',
        categoryId: ''
    });

    // Queries
    const { data: items = [] } = useCatalogueItems({ branchId });
    const { data: offers = [] } = useCatalogueOffersAdmin({ branchId });
    const { data: categories = [] } = useCatalogueCategories();
    const createOrderMutation = useCreateCatalogueOrder();

    // Filtered lists
    const filteredItems = useMemo(() => 
        items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]);

    const filteredOffers = useMemo(() => 
        offers.filter(offer => offer.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [offers, searchTerm]);

    const totalAmount = useMemo(() => 
        selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0),
    [selectedItems]);

    if (!isOpen) return null;

    const handleAddItem = (item: CatalogueItem) => {
        setSelectedItems(prev => {
            const existing = prev.find(p => p.itemId === item.id);
            if (existing) {
                return prev.map(p => p.itemId === item.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { itemId: item.id, name: item.name, price: Number(item.price), quantity: 1, type: 'item' }];
        });
        toast.success(`Added ${item.name}`);
    };

    const handleAddOffer = (offer: CatalogueOffer) => {
        setSelectedItems(prev => {
            const existing = prev.find(p => p.offerId === offer.id);
            if (existing) {
                return prev.map(p => p.offerId === offer.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { offerId: offer.id, name: offer.name, price: Number(offer.calculatedPrice), quantity: 1, type: 'offer' }];
        });
        toast.success(`Added ${offer.name}`);
    };

    const handleQuickAdd = () => {
        if (!quickAddItem.name || !quickAddItem.price) {
            toast.error('Name and price are required');
            return;
        }

        const price = parseFloat(quickAddItem.price);
        if (isNaN(price)) {
            toast.error('Invalid price');
            return;
        }

        const newItem = {
            name: quickAddItem.name,
            price: price,
            categoryId: quickAddItem.categoryId || undefined
        };

        setSelectedItems(prev => [
            ...prev, 
            { 
                newItem, 
                name: newItem.name, 
                price: newItem.price, 
                quantity: 1, 
                type: 'new' 
            }
        ]);

        toast.success(`Added new item: ${newItem.name}`);
        setQuickAddItem({ name: '', price: '', categoryId: '' });
        setIsQuickAddOpen(false);
    };

    const updateQuantity = (index: number, delta: number) => {
        setSelectedItems(prev => {
            const newItems = [...prev];
            const newQty = newItems[index].quantity + delta;
            if (newQty <= 0) {
                newItems.splice(index, 1);
            } else {
                newItems[index] = { ...newItems[index], quantity: newQty };
            }
            return newItems;
        });
    };

    const handleSubmit = async () => {
        if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone) {
            toast.error('First name, last name and phone are required');
            setStep('customer');
            return;
        }

        if (selectedItems.length === 0) {
            toast.error('Please add at least one item');
            setStep('items');
            return;
        }

        const payload: any = {
            ...customerInfo,
            branchId,
            items: selectedItems.map(si => ({
                itemId: si.itemId,
                offerId: si.offerId,
                newItem: si.newItem,
                quantity: si.quantity
            }))
        };

        if (!payload.email) {
            delete payload.email;
        }

        try {
            await createOrderMutation.mutateAsync(payload);

            toast.success('Order created successfully');
            queryClient.invalidateQueries({ queryKey: ['catalogue', 'orders'] });
            onClose();
            // Reset state
            setStep('customer');
            setCustomerInfo({ firstName: '', lastName: '', phone: '', email: '', notes: '', tableNumber: '' });
            setSelectedItems([]);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to create order');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
                    <div>
                        <h2 className="text-xl font-black text-text-main uppercase tracking-tight flex items-center gap-2">
                            <ShoppingCart className="text-primary" /> Create Manual Order
                        </h2>
                        <p className="text-xs text-text-secondary mt-1 font-medium">Step {step === 'customer' ? '1' : step === 'items' ? '2' : '3'} of 3</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-100">
                    <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${step === 'customer' ? '33.33' : step === 'items' ? '66.66' : '100'}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {step === 'customer' && (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest flex items-center gap-2">
                                    <User size={16} className="text-primary" /> Customer Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">First Name *</label>
                                        <input 
                                            type="text"
                                            value={customerInfo.firstName}
                                            onChange={e => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Last Name *</label>
                                        <input 
                                            type="text"
                                            value={customerInfo.lastName}
                                            onChange={e => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Doe"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Phone Number *</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="tel"
                                                value={customerInfo.phone}
                                                onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium"
                                                placeholder="+234..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Email (Optional)</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="email"
                                                value={customerInfo.email}
                                                onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-text-secondary uppercase tracking-widest">Order Context</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Table Number</label>
                                        <input 
                                            type="text"
                                            value={customerInfo.tableNumber}
                                            onChange={e => setCustomerInfo({...customerInfo, tableNumber: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Table 5"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Internal Notes</label>
                                        <input 
                                            type="text"
                                            value={customerInfo.notes}
                                            onChange={e => setCustomerInfo({...customerInfo, notes: e.target.value})}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium"
                                            placeholder="Manual entry from dashboard"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'items' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                            {/* Selection Panel */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder="Search products or offers..."
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all bg-white shadow-sm font-medium"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                        className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shadow-sm cursor-pointer ${
                                            isQuickAddOpen 
                                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' 
                                            : 'bg-white text-primary border-gray-100 hover:bg-gray-50'
                                        }`}
                                    >
                                        {isQuickAddOpen ? <X size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                                        {isQuickAddOpen ? 'Cancel' : 'Quick Add Item'}
                                    </button>
                                </div>

                                {isQuickAddOpen && (
                                    <div className="bg-white p-6 rounded-2xl border-2 border-primary/20 shadow-xl shadow-primary/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-black text-primary uppercase tracking-widest">Create New Item</h3>
                                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">On-the-fly</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Item Name *</label>
                                                <input 
                                                    type="text"
                                                    value={quickAddItem.name}
                                                    onChange={e => setQuickAddItem({...quickAddItem, name: e.target.value})}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium bg-gray-50/50"
                                                    placeholder="e.g. Special Coffee"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Price *</label>
                                                <input 
                                                    type="number"
                                                    value={quickAddItem.price}
                                                    onChange={e => setQuickAddItem({...quickAddItem, price: e.target.value})}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium bg-gray-50/50"
                                                    placeholder="2500"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-1.5">
                                                <label className="text-xs font-black text-text-secondary uppercase tracking-wider">Category (Optional)</label>
                                                <select 
                                                    value={quickAddItem.categoryId}
                                                    onChange={e => setQuickAddItem({...quickAddItem, categoryId: e.target.value})}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all text-sm font-medium bg-gray-50/50"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleQuickAdd}
                                            className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Plus size={16} strokeWidth={3} /> Add to Order
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2">
                                    {filteredOffers.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Available Offers</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {filteredOffers.map(offer => (
                                                    <button 
                                                        key={offer.id}
                                                        onClick={() => handleAddOffer(offer)}
                                                        className="flex items-center gap-4 p-3 bg-white hover:bg-primary/5 border border-gray-100 rounded-2xl transition-all group text-left cursor-pointer"
                                                    >
                                                        {offer.mainImage ? (
                                                            <img src={offer.mainImage} className="w-12 h-12 rounded-xl object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">O</div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-text-main truncate group-hover:text-primary">{offer.name}</p>
                                                            <p className="text-xs font-black text-primary uppercase">₦{offer.calculatedPrice.toLocaleString()}</p>
                                                        </div>
                                                        <Plus size={18} className="text-gray-300 group-hover:text-primary" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {filteredItems.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest pl-1">Available Products</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {filteredItems.map(item => (
                                                    <button 
                                                        key={item.id}
                                                        onClick={() => handleAddItem(item)}
                                                        className="flex items-center gap-4 p-3 bg-white hover:bg-primary/5 border border-gray-100 rounded-2xl transition-all group text-left cursor-pointer"
                                                    >
                                                        {item.mainImage ? (
                                                            <img src={item.mainImage} className="w-12 h-12 rounded-xl object-cover" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">P</div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-text-main truncate group-hover:text-primary">{item.name}</p>
                                                            <p className="text-xs font-black text-text-secondary uppercase">₦{item.price.toLocaleString()}</p>
                                                        </div>
                                                        <Plus size={18} className="text-gray-300 group-hover:text-primary" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cart Summary (Selected Items) */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center justify-between">
                                        Selected Items
                                        <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{selectedItems.length}</span>
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {selectedItems.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-300">
                                            <ShoppingCart size={32} strokeWidth={1} />
                                            <p className="text-xs font-medium mt-2">No items selected</p>
                                        </div>
                                    ) : (
                                        selectedItems.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex flex-col gap-1 flex-1 pr-2">
                                                        <span className="text-sm font-bold text-text-main leading-tight">{item.name}</span>
                                                        {item.type === 'new' && (
                                                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded w-fit uppercase tracking-wider border border-amber-100">New Item</span>
                                                        )}
                                                    </div>
                                                    <button onClick={() => updateQuantity(idx, -item.quantity)} className="text-red-400 hover:text-red-500 cursor-pointer">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-black text-primary uppercase tracking-wider">₦{(item.price * item.quantity).toLocaleString()}</span>
                                                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                                        <button onClick={() => updateQuantity(idx, -1)} className="text-text-secondary hover:text-primary cursor-pointer font-black">-</button>
                                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(idx, 1)} className="text-text-secondary hover:text-primary cursor-pointer font-black">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-black text-text-secondary uppercase tracking-wider">Total Amount</span>
                                        <span className="text-lg font-black text-primary">₦{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-emerald-900 font-bold">Review Order Details</h3>
                                    <p className="text-emerald-700/70 text-sm mt-0.5">Please confirm the customer and order details before submitting.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">Customer Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><User size={14} /></div>
                                            <span className="text-sm font-bold text-text-main">{customerInfo.firstName} {customerInfo.lastName}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><Phone size={14} /></div>
                                            <span className="text-sm font-bold text-text-main">{customerInfo.phone}</span>
                                        </div>
                                        {customerInfo.email && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><Mail size={14} /></div>
                                                <span className="text-sm font-bold text-text-main">{customerInfo.email}</span>
                                            </div>
                                        )}
                                        {customerInfo.tableNumber && (
                                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Sitting At</p>
                                                <p className="text-sm font-bold text-amber-900">{customerInfo.tableNumber}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                    <h4 className="text-xs font-black text-text-secondary uppercase tracking-widest">Order Summary</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="text-text-secondary truncate pr-4 font-medium">{item.quantity}x {item.name}</span>
                                                <span className="text-text-main font-bold shrink-0">₦{(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-sm font-black text-text-main uppercase tracking-wider">Total</span>
                                        <span className="text-xl font-black text-primary">₦{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
                    <button 
                        onClick={() => {
                            if (step === 'items') setStep('customer');
                            else if (step === 'review') setStep('items');
                        }}
                        disabled={step === 'customer'}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all cursor-pointer ${
                            step === 'customer' ? 'opacity-0 pointer-events-none' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                    >
                        <ChevronLeft size={16} /> Previous
                    </button>

                    {step !== 'review' ? (
                        <button 
                            onClick={() => {
                                if (step === 'customer') {
                                    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone) {
                                        toast.error('Please fill all required fields');
                                        return;
                                    }
                                    setStep('items');
                                } else if (step === 'items') {
                                    if (selectedItems.length === 0) {
                                        toast.error('Please add at least one item');
                                        return;
                                    }
                                    setStep('review');
                                }
                            }}
                            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all cursor-pointer"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={createOrderMutation.isPending}
                            className="flex items-center gap-2 px-10 py-3 bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {createOrderMutation.isPending ? 'Processing...' : 'Complete Order'} <Check size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
