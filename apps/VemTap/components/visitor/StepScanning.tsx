import React from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { cn } from '@/lib/utils';

interface StepScanningProps {
    storeName: string;
    isPreview?: boolean;
}

export const StepScanning: React.FC<StepScanningProps> = ({ storeName, isPreview = false }) => {
    return (
        <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(presets.card, isPreview && "p-0 shadow-none border-none bg-transparent")}
        >
            <span className={presets.tag}>Connection Hub</span>
            <h1 className={presets.title}>Locating...</h1>
            <p className={`${presets.body} mt-4 mb-12`}>Syncing with the sensor at <span className="text-primary font-bold">{storeName}</span>.</p>
            <div className="size-48 mx-auto relative flex items-center justify-center">
                <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.05, 0.1] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-primary/20 rounded-full" />
                <div className="size-20 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-50 z-10 transition-transform hover:scale-110">
                    <motion.span animate={{ rotate: [0, 10, 0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="material-symbols-outlined text-primary text-4xl">contactless</motion.span>
                </div>
            </div>
            <p className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest mt-10 animate-pulse">Handshake in progress</p>
        </motion.div>
    );
};
