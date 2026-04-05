'use client';

import React from 'react';
import Link from 'next/link';
import { useProductFormStore } from '@/store/useProductFormStore';
import { CheckCircle, Check, Star, ArrowRight, PlusCircle, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminProductsApi } from '@/lib/api/admin';
import { ProductCategory } from '@/types/marketplace';

export default function StepSuccess() {
    const { formData, resetForm } = useProductFormStore();

    const { data: categories } = useQuery<ProductCategory[]>({
        queryKey: ['admin-product-types'],
        queryFn: () => adminProductsApi.getAllTypes(),
    });

    const categoryName = categories?.find((c) => c.id === formData.productTypeId)?.name || 'Uncategorized';

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500">

            {/* Success Icon */}
            <div className="mb-10 relative">
                <div className="size-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                    <CheckCircle size={48} strokeWidth={2.5} />
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-2 -right-4 text-yellow-400 animate-bounce delay-100">
                    <Star fill="currentColor" size={24} />
                </div>
                <div className="absolute bottom-0 -left-6 text-primary animate-bounce delay-300">
                    <Star fill="currentColor" size={16} />
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent pb-2 font-display">
                Product is Live!
            </h1>

            <p className="text-text-secondary text-lg md:text-xl font-medium max-w-lg mb-12 leading-relaxed">
                The <span className="font-bold text-text-main">{formData.title || 'Product'}</span> has been successfully published to the marketplace.
            </p>

            {/* Product Preview Snippet */}
            <div className="w-full bg-white rounded-2xl p-4 flex items-center gap-5 border border-gray-100 mb-12 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="size-20 shrink-0 bg-gray-50 rounded-xl overflow-hidden shadow-inner border border-gray-100 flex items-center justify-center">
                    {formData.images.primary.url ? (
                        <img src={formData.images.primary.url} className="w-full h-full object-contain p-2" />
                    ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    )}
                </div>
                <div className="flex flex-col justify-center grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 rounded-full ${formData.tagColor.replace('bg-', 'bg-')}/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${formData.tagColor.replace('bg-', 'text-')} border border-current/10`}>
                            {formData.tag}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{categoryName}</span>
                    </div>
                    <h3 className="font-bold text-text-main text-base truncate">{formData.title || 'Product Name'}</h3>
                    <p className="text-xs text-text-secondary mt-0.5 font-mono">{formData.sku || 'SKU-000'}</p>
                </div>
                <div className="hidden sm:flex items-center justify-center size-10 rounded-full bg-gray-50 text-gray-400 border border-gray-100">
                    <ArrowRight size={20} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                    href="/marketplace"
                    className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 min-w-[200px]"
                >
                    <span>View in Marketplace</span>
                    <ExternalLink size={18} />
                </Link>
                <button
                    onClick={resetForm}
                    className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white border-2 border-gray-100 hover:border-primary/20 text-text-main hover:text-primary font-bold text-sm uppercase tracking-widest transition-all hover:bg-gray-50 min-w-[200px]"
                >
                    <PlusCircle size={18} />
                    <span>Upload Another</span>
                </button>
            </div>
        </div>
    );
}
