
'use client';

import React from 'react';
import { useProductFormStore } from '@/store/useProductFormStore';
import StepDetails from '@/components/admin/products/create/StepDetails';
import StepMedia from '@/components/admin/products/create/StepMedia';
import StepPricing from '@/components/admin/products/create/StepPricing';
import StepSuccess from '@/components/admin/products/create/StepSuccess';
import { Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CreateProductPage() {
    const { currentStep, setStep, editingProductId } = useProductFormStore();

    const steps = [
        { id: 1, label: 'Details' },
        { id: 2, label: 'Media' },
        { id: 3, label: 'Pricing' },
        { id: 4, label: 'Review' },
    ];

    return (
        <div className="p-8 md:p-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Link href="/admin/products" className="hover:text-primary transition-colors">Products</Link>
                    <ChevronRight size={14} />
                    <span className="text-text-secodnary">{editingProductId ? 'Edit Hardware' : 'Add New Hardware'}</span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-600">
                            {currentStep === 4 ? 'Success!' : editingProductId ? 'Edit Product' : 'Add New Product'}
                        </h1>
                        <p className="text-lg text-text-secondary font-medium">
                            {currentStep === 1 && `Enter the ${editingProductId ? 'updated' : 'basic'} product details below.`}
                            {currentStep === 2 && 'Upload high-quality images and specifications.'}
                            {currentStep === 3 && 'Configure pricing tiers and review.'}
                            {currentStep === 4 && `Your product has been ${editingProductId ? 'updated' : 'published'} successfully.`}
                        </p>
                    </div>

                    {currentStep < 4 && (
                        <div className="flex items-center gap-3">
                            <button className="px-6 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-text-secondary font-bold text-sm transition-colors s">
                                Save Draft
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Stepper */}
            {currentStep < 4 && (
                <div className="mb-12">
                    <div className="flex items-center w-full max-w-4xl relative">
                        {/* Track Background */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>

                        {/* Steps */}
                        {steps.map((step, index) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            const isLast = index === steps.length - 1;

                            return (
                                <React.Fragment key={step.id}>
                                    <div
                                        className="flex items-center gap-3 cursor-pointer group"
                                        onClick={() => setStep(step.id)}
                                    >
                                        <div
                                            className={`
                                                    size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm
                                                    ${isActive
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 ring-4 ring-white'
                                                    : isCompleted
                                                        ? 'bg-green-500 text-white ring-4 ring-white'
                                                        : 'bg-white border-2 border-gray-200 text-gray-400 group-hover:border-primary/50'
                                                }
                                                `}
                                        >
                                            {isCompleted ? <Check size={18} strokeWidth={3} /> : step.id}
                                        </div>
                                        <span
                                            className={`
                                                    font-bold text-sm hidden sm:block transition-colors
                                                    ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                                                `}
                                        >
                                            {step.label}
                                        </span>
                                    </div>

                                    {!isLast && (
                                        <div className="flex-1 mx-4 h-1 rounded-full overflow-hidden bg-gray-100">
                                            <div
                                                className={`h-full bg-green-500 transition-all duration-500 ease-out ${isCompleted ? 'w-full' : 'w-0'}`}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {currentStep === 1 && <StepDetails />}
                {currentStep === 2 && <StepMedia />}
                {currentStep === 3 && <StepPricing />}
                {currentStep === 4 && <StepSuccess />}
            </div>
        </div>
    );
}
