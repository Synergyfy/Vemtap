'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

export default function SuccessPage() {
    const router = useRouter();
    const params = useParams();
    const { resetFlow } = useCustomerFlowStore();

    useEffect(() => {
        const timer = setTimeout(() => {
            // Optional: auto redirect after some time
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const handleDone = () => {
        router.push(`/${params.slug}/${params.code}`);
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md text-center space-y-8 bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100"
            >
                <div className="size-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Request Received!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Your request has been sent successfully. The team will process it and get back to you shortly.
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <button 
                        onClick={() => router.push('/customer/dashboard/orders')}
                        className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                    >
                        <span>View My Orders</span>
                        <ArrowRight size={18} />
                    </button>
                    
                    <button 
                        onClick={handleDone}
                        className="w-full h-16 bg-white text-slate-900 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={18} />
                        <span>Continue Shopping</span>
                    </button>
                </div>

                <div className="pt-8 opacity-30 flex items-center justify-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest">Powered by</span>
                    <div className="h-4 w-px bg-slate-400" />
                    <span className="text-sm font-black tracking-tighter">VemTap</span>
                </div>
            </motion.div>
        </div>
    );
}
