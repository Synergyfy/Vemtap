'use client';

import React, { useState } from 'react';
import { 
    Boxes, Plus, Edit3, Trash2, Search, 
    Filter, CheckCircle2, XCircle, Info,
    ChevronLeft, Tag
} from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';

const MOCK_CAT_TYPES = [
    { id: '1', name: 'Discounts', desc: 'Percentage or flat amount off purchase.', count: 145, status: 'Active' },
    { id: '2', name: 'Buy One Get One', desc: 'BOGO offers for products or services.', count: 82, status: 'Active' },
    { id: '3', name: 'Free Gift', desc: 'Complimentary item with minimum spend.', count: 34, status: 'Active' },
    { id: '4', name: 'Free Delivery', desc: 'Zero shipping costs for logistics partners.', count: 56, status: 'Inactive' },
];

export default function ManageOfferCategoriesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCat, setEditingCat] = useState<any>(null);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <Link 
                    href="/admin/discovery/categories"
                    className="flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors text-xs font-black uppercase tracking-widest"
                >
                    <ChevronLeft size={16} /> Back to Analytics
                </Link>
                <button 
                    onClick={() => { setEditingCat(null); setIsModalOpen(true); }}
                    className="h-12 px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={16} /> Create Category
                </button>
            </div>

            <Link href="/admin/discovery/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-main transition-colors mb-6">
                <ChevronLeft size={14} /> Back to Discovery
            </Link>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-lg font-display font-bold text-text-main">Offer Category Types</h2>
                    <p className="text-xs font-medium text-text-secondary">Define what types of offers businesses can create.</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Category Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-center">Active Offers</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {MOCK_CAT_TYPES.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                <Tag size={16} />
                                            </div>
                                            <p className="font-bold text-text-main">{cat.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-secondary font-medium italic max-w-xs truncate">
                                        {cat.desc}
                                    </td>
                                    <td className="px-6 py-4 text-center font-black text-text-main">
                                        {cat.count}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            cat.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {cat.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => { setEditingCat(cat); setIsModalOpen(true); }}
                                                className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button className="p-2 rounded-lg bg-gray-50 text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={editingCat ? 'Edit Category' : 'Create Category'}
            >
                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="size-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                            <Tag size={32} />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-text-main">{editingCat ? 'Modify Category' : 'New Offer Type'}</h3>
                        <p className="text-sm font-medium text-text-secondary">Define the rules for this offer segment.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Category Name</label>
                            <input 
                                type="text" 
                                defaultValue={editingCat?.name}
                                placeholder="e.g. Seasonal Flash Sale"
                                className="w-full h-12 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-text-main focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 mb-2 block">Internal Description</label>
                            <textarea 
                                defaultValue={editingCat?.desc}
                                placeholder="Explain the purpose of this category..."
                                className="w-full h-24 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div>
                                <p className="text-xs font-bold text-text-main">Enable Category</p>
                                <p className="text-[10px] text-text-secondary font-medium mt-0.5">Allow businesses to select this type.</p>
                            </div>
                            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white cursor-pointer shadow-lg shadow-primary/20">
                                <CheckCircle2 size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl border border-gray-200 text-text-main text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            className="flex-[1.5] h-12 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                            {editingCat ? 'Save Changes' : 'Create Category'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
