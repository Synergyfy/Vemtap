"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    UploadCloud, FileSpreadsheet, AlertCircle, 
    CheckCircle2, ArrowLeft, ArrowRight, Download,
    Database, Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConfigureBulkImportPage() {
    const [step, setStep] = useState(1);
    const [isHoveringDropzone, setIsHoveringDropzone] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 md:pb-10 max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-12">
                <Link href="/dashboard/catalogue">
                    <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm transition-all hover:-translate-x-1">
                        <ArrowLeft size={20} className="text-gray-400" />
                    </Button>
                </Link>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Catalogue Manager</p>
                    <h1 className="text-2xl font-black text-gray-900 leading-none">Bulk Import Wizard</h1>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-12 relative px-4">
                <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />
                <div 
                    className="absolute top-1/2 left-8 h-1 bg-[#066CF4] -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
                    style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                />
                
                {[
                    { num: 1, label: 'Upload File' },
                    { num: 2, label: 'Map Columns' },
                    { num: 3, label: 'Review & Import' }
                ].map((s) => (
                    <div key={s.num} className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                            step >= s.num ? 'bg-[#066CF4] text-white shadow-lg shadow-blue-500/30' : 'bg-white text-gray-300 border-2 border-gray-100'
                        }`}>
                            {step > s.num ? <CheckCircle2 size={18} /> : s.num}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                            {s.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <motion.div 
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
                {step === 1 && (
                    <div className="p-12 text-center">
                        <div className="size-20 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <FileSpreadsheet size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-4">Upload your catalogue data</h2>
                        <p className="text-sm font-medium text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
                            Upload a CSV or Excel file containing your products or services. Need help formatting? 
                            <a href="#" className="text-[#066CF4] hover:underline ml-1 font-bold">Download our template.</a>
                        </p>

                        <div 
                            onDragEnter={() => setIsHoveringDropzone(true)}
                            onDragLeave={() => setIsHoveringDropzone(false)}
                            onDrop={() => setIsHoveringDropzone(false)}
                            onDragOver={(e) => e.preventDefault()}
                            className={`border-2 border-dashed rounded-[32px] p-16 transition-all duration-300 max-w-2xl mx-auto cursor-pointer ${
                                isHoveringDropzone ? 'border-[#066CF4] bg-blue-50/50 scale-[0.98]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                            }`}
                        >
                            <UploadCloud size={48} className={`mx-auto mb-4 ${isHoveringDropzone ? 'text-[#066CF4] animate-bounce' : 'text-gray-400'}`} />
                            <h3 className="text-lg font-black text-gray-900 mb-2">Drag and drop your file here</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">or click to browse</p>
                            <Button className="rounded-xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg">
                                Select File
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="p-12">
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Map your columns</h2>
                        <p className="text-sm font-medium text-gray-500 mb-8">Match your file columns to the standard fields in VemTap.</p>

                        <div className="space-y-4 max-w-3xl mx-auto">
                            {['Product Name', 'Description', 'Price', 'Category', 'Stock Quantity'].map((field, i) => (
                                <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="w-1/3 text-sm font-black text-gray-900">{field} <span className="text-red-500">*</span></div>
                                    <ArrowRight size={16} className="text-gray-300 shrink-0" />
                                    <select className="flex-1 h-12 px-4 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-[#066CF4] text-sm font-medium text-gray-600 appearance-none bg-white">
                                        <option>Select column...</option>
                                        <option selected>Col_{field.replace(' ', '')}</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="p-12 text-center">
                        <div className="size-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Database size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Ready to Import!</h2>
                        <p className="text-base font-medium text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
                            We found <strong>248</strong> products ready to be added to your catalogue. No errors detected in your data.
                        </p>

                        <div className="flex items-center justify-center gap-12 bg-gray-50 rounded-[24px] p-8 max-w-lg mx-auto border border-gray-100">
                            <div>
                                <div className="text-3xl font-black text-gray-900">248</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Valid Rows</div>
                            </div>
                            <div className="w-px h-12 bg-gray-200" />
                            <div>
                                <div className="text-3xl font-black text-emerald-500">0</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Errors</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className="font-bold text-xs uppercase tracking-widest text-gray-500 disabled:opacity-50"
                    >
                        Back
                    </Button>
                    <Button 
                        onClick={() => {
                            if (step < 3) setStep(step + 1);
                            // handle submit on step 3
                        }}
                        className={`h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all ${
                            step === 3 ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-[#066CF4] hover:bg-[#4293FF] shadow-blue-500/20'
                        }`}
                    >
                        {step === 3 ? 'Start Import' : 'Continue'}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
