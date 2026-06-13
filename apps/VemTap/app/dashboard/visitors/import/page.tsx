"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, Download, FileText, CheckCircle2, 
    AlertCircle, ArrowRight, ArrowLeft, Info,
    X, ShieldCheck, Database, FileDown, Search,
    Check, ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function CRMImportExportPage() {
    const [step, setStep] = useState(1);
    const [isExporting, setIsExporting] = useState(false);

    return (
        <div className="pb-32 md:pb-20 max-w-5xl mx-auto p-4 md:p-8">
            <Link href="/dashboard/visitors" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors mb-6">
                <ArrowLeft size={14} />
                Back to CRM
            </Link>

            <div className="mb-12">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Import & Export</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">
                    Move your customer data safely in and out of Vemtap.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* IMPORT SECTION */}
                <div className="rounded-[48px] bg-white p-10 shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="size-16 rounded-[22px] bg-blue-50 text-[#066CF4] flex items-center justify-center mb-8 shadow-sm">
                        <Upload size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Import Customers</h2>
                    <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">
                        Upload your existing customer records from CSV or Excel files. We'll help you map the fields automatically.
                    </p>

                    <div className="space-y-4 mb-10 flex-1">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Supports CSV, XLSX formats
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Automatic duplicate detection
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-700">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Smart field mapping
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full h-14 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                            Choose File To Upload
                        </Button>
                        <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4]">
                            Download Sample Template
                        </Button>
                    </div>
                </div>

                {/* EXPORT SECTION */}
                <div className="rounded-[48px] bg-white p-10 shadow-sm border border-gray-100 flex flex-col h-full">
                    <div className="size-16 rounded-[22px] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 shadow-sm">
                        <Download size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Export Customers</h2>
                    <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">
                        Download your customer database for external marketing, reporting, or backup purposes.
                    </p>

                    <div className="space-y-6 mb-10 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Export Format</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['CSV', 'Excel', 'PDF'].map(f => (
                                    <button key={f} className={cn(
                                        "h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                        f === 'CSV' ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-400 border border-gray-100"
                                    )}>{f}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Data Selection</label>
                            <div className="space-y-2">
                                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-left">
                                    <span className="text-xs font-bold text-gray-900">All Customers</span>
                                    <Check size={14} className="text-[#066CF4]" />
                                </button>
                                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 text-left opacity-60">
                                    <span className="text-xs font-bold text-gray-400">By Segment...</span>
                                    <ChevronRight size={14} className="text-gray-300" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={() => setIsExporting(true)}
                        className="w-full h-14 rounded-2xl bg-gray-900 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-black/10 active:scale-95 transition-all"
                    >
                        {isExporting ? 'Generating File...' : 'Export Database Now'}
                    </Button>
                </div>
            </div>

            {/* DATA MANAGEMENT SETTINGS */}
            <div className="mt-12 rounded-[40px] bg-gray-900 p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#066CF4]/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-2xl font-black mb-4">Data Management</h3>
                        <p className="text-sm font-medium text-white/50 mb-8 leading-relaxed">
                            Configure how Vemtap handles your customer data and privacy requirements.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={18} className="text-[#066CF4]" />
                                    <span className="text-xs font-bold">Duplicate Detection</span>
                                </div>
                                <div className="h-6 w-11 bg-[#066CF4] rounded-full relative p-1">
                                    <div className="size-4 bg-white rounded-full absolute right-1 shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <Database size={18} className="text-[#066CF4]" />
                                    <span className="text-xs font-bold">Auto-Merge Customers</span>
                                </div>
                                <div className="h-6 w-11 bg-white/10 rounded-full relative p-1">
                                    <div className="size-4 bg-white/40 rounded-full absolute left-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { label: 'Data Retention Policy', icon: Info },
                            { label: 'Privacy Settings', icon: ShieldCheck },
                            { label: 'GDPR Compliance Export', icon: FileText },
                            { label: 'Audit Log', icon: Clock }
                        ].map((item, i) => (
                            <button key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group">
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className="text-white/40 group-hover:text-white transition-colors" />
                                    <span className="text-xs font-bold">{item.label}</span>
                                </div>
                                <ChevronRight size={14} className="text-white/20 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Clock({ size, className }: { size: number, className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
