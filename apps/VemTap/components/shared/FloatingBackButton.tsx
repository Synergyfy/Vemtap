'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingBackButton() {
    const router = useRouter();
    const pathname = usePathname();

    // Don't show on common entry pages, root, or main dashboard bottom-nav tabs
    const isExcluded = pathname === '/' || 
                       pathname === '/login' || 
                       pathname === '/register' || 
                       pathname === '/forgot-password' ||
                       pathname?.startsWith('/auth') ||
                       pathname === '/dashboard' ||
                       pathname === '/dashboard/visitors' ||
                       pathname === '/dashboard/catalogue' ||
                       pathname === '/dashboard/commerce' ||
                       pathname === '/dashboard/customer-experience' ||
                       pathname?.startsWith('/dashboard/pos') ||
                       pathname === '/dashboard/more' ||
                       pathname === '/dashboard/settings';

    if (isExcluded) {
        return null;
    }

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="fixed top-6 left-6 z-[150] size-10 md:size-12 bg-white/90 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl shadow-black/10 border border-slate-200/50 hover:bg-white transition-all group"
            title="Go Back"
        >
            <ArrowLeft className="size-5 md:size-6 text-slate-900 group-hover:-translate-x-0.5 transition-transform" />
        </motion.button>
    );
}
