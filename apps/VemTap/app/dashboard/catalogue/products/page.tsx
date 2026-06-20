"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Package, Upload, Image as ImageIcon, Tags, 
    DollarSign, Save, ArrowLeft, Plus, X, Type, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConfigureProductPage() {
    const [product, setProduct] = useState({
        name: 'New Premium Product',
        description: 'Detailed description of this premium item goes here. Highlight the benefits and features that make it special.',
        price: '150.00',
        category: 'Electronics',
        stock: '50'
    });

    const [isHoveringDropzone, setIsHoveringDropzone] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/catalogue">
                        <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm transition-all hover:-translate-x-1">
                            <ArrowLeft size={20} className="text-gray-400" />
                        </Button>
                    </Link>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Catalogue Manager</p>
                        <h1 className="text-2xl font-black text-gray-900 leading-none">Configure Product</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50">
                        Cancel
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-[#066CF4] hover:bg-[#4293FF] text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2">
                        <Save size={16} />
                        Publish Item
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Configuration Form */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Media Upload */}
                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <ImageIcon size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Product Media</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Images & Video</p>
                            </div>
                        </div>

                        <div 
                            onDragEnter={() => setIsHoveringDropzone(true)}
                            onDragLeave={() => setIsHoveringDropzone(false)}
                            onDrop={() => setIsHoveringDropzone(false)}
                            onDragOver={(e) => e.preventDefault()}
                            className={`relative overflow-hidden rounded-[24px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-16 px-6 text-center ${
                                isHoveringDropzone ? 'border-[#066CF4] bg-blue-50/50 scale-[0.99]' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                            }`}
                        >
                            <div className="size-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-gray-400">
                                <Upload size={28} className={isHoveringDropzone ? 'text-[#066CF4] animate-bounce' : ''} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 mb-2">Drag & Drop Media</h4>
                            <p className="text-xs font-medium text-gray-500 mb-6 max-w-xs">High-resolution images work best. Supported formats: JPG, PNG, WEBP, MP4.</p>
                            <Button className="rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-6 h-10 shadow-lg">
                                Browse Files
                            </Button>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-xl bg-blue-50 text-[#066CF4] flex items-center justify-center">
                                <Type size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Basic Information</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name & Description</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Product Name</label>
                                <div className="relative">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={product.name}
                                        onChange={(e) => setProduct({...product, name: e.target.value})}
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#066CF4] transition-all text-sm font-bold text-gray-900"
                                        placeholder="e.g. Signature Coffee Blend"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Category</label>
                                    <div className="relative">
                                        <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <select 
                                            value={product.category}
                                            onChange={(e) => setProduct({...product, category: e.target.value})}
                                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#066CF4] transition-all text-sm font-bold text-gray-900 appearance-none"
                                        >
                                            <option>Electronics</option>
                                            <option>Food & Beverage</option>
                                            <option>Apparel</option>
                                            <option>Services</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Price (₦)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="number" 
                                            value={product.price}
                                            onChange={(e) => setProduct({...product, price: e.target.value})}
                                            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#066CF4] transition-all text-sm font-bold text-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 ml-2">Description</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                                    <textarea 
                                        rows={4}
                                        value={product.description}
                                        onChange={(e) => setProduct({...product, description: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#066CF4] transition-all text-sm font-medium text-gray-600 resize-none"
                                        placeholder="Describe the product..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Preview */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-8">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Preview</h3>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Customer View
                            </span>
                        </div>

                        {/* Storefront Card Preview */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-[32px] bg-white overflow-hidden shadow-2xl shadow-black/5 border border-gray-100"
                        >
                            <div className="aspect-[4/3] bg-gray-100 relative group">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50">
                                    <ImageIcon size={64} className="opacity-50" />
                                </div>
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
                                    <p className="text-sm font-black text-gray-900">₦{Number(product.price).toLocaleString()}</p>
                                </div>
                            </div>
                            
                            <div className="p-8">
                                <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
                                    {product.category || 'Category'}
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-3">{product.name || 'Product Name'}</h3>
                                <p className="text-sm font-medium text-gray-500 line-clamp-3 leading-relaxed mb-6">
                                    {product.description || 'Description will appear here...'}
                                </p>
                                <Button className="w-full h-14 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                                    Add to Cart
                                </Button>
                            </div>
                        </motion.div>

                        <div className="mt-6 rounded-[24px] bg-[#066CF4]/5 border border-[#066CF4]/10 p-6 flex items-start gap-4">
                            <div className="size-10 rounded-xl bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center shrink-0">
                                <Package size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 mb-1">Inventory Management</h4>
                                <p className="text-xs font-medium text-gray-600 leading-relaxed">This product will be immediately available in your POS and digital storefront once published.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
