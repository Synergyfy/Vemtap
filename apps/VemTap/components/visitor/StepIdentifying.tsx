import React from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { cn } from '@/lib/utils';

interface StepIdentifyingProps {
    isPreview?: boolean;
}

export const StepIdentifying: React.FC<StepIdentifyingProps> = ({ isPreview = false }) => {
    return (
        <motion.div
            key="id"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(presets.card, "text-center", isPreview && "p-0 shadow-none border-none bg-transparent")}
        >
            <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/10 relative">
                <span className="material-symbols-outlined text-primary animate-spin text-3xl">sync</span>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full opacity-20"
                />
            </div>
            <h1 className={presets.title}>Verifying Connection</h1>
            <p className={presets.body + " mt-4 uppercase text-[10px] font-black tracking-widest text-primary animate-pulse"}>
                Checking local profile cache...
            </p>
            <p className="text-[10px] text-gray-400 font-bold mt-2">Almost there.</p>
        </motion.div>
    );
};
