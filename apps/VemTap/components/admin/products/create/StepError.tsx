'use client';

import React from 'react';
import Link from 'next/link';
import { useProductFormStore } from '@/store/useProductFormStore';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function StepError() {
    const { formData, submissionError, resetForm, setStep } = useProductFormStore();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-500">
            <div className="mb-10 relative">
                <div className="size-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-100">
                    <AlertTriangle size={48} strokeWidth={2.5} />
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 bg-linear-to-r from-red-600 to-amber-500 bg-clip-text text-transparent pb-2 font-display">
                Publish Failed
            </h1>

            <p className="text-text-secondary text-lg md:text-xl font-medium max-w-lg mb-6 leading-relaxed">
                We couldn’t publish <span className="font-bold text-text-main">{formData.title || 'this product'}</span>.
                Please review the details and try again.
            </p>

            {submissionError && (
                <div className="w-full bg-red-50/70 border border-red-100 text-left rounded-2xl p-5 mb-10">
                    <p className="text-xs uppercase tracking-widest text-red-400 font-bold mb-2">Error Details</p>
                    <p className="text-sm text-red-700 font-semibold">{submissionError}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button
                    onClick={() => setStep(3)}
                    className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 min-w-[200px]"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Review</span>
                </button>
                <button
                    onClick={resetForm}
                    className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white border-2 border-gray-100 hover:border-primary/20 text-text-main hover:text-primary font-bold text-sm uppercase tracking-widest transition-all hover:bg-gray-50 min-w-[200px]"
                >
                    <RefreshCw size={18} />
                    <span>Start Over</span>
                </button>
                <Link
                    href="/admin/products"
                    className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white border-2 border-red-100 text-red-600 hover:text-red-700 font-bold text-sm uppercase tracking-widest transition-all hover:bg-red-50 min-w-[200px]"
                >
                    <span>Back to Products</span>
                </Link>
            </div>
        </div>
    );
}
