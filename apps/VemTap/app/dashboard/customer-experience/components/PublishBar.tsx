'use client';

import React, { useState } from 'react';
import { Save, Loader2, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

interface PublishBarProps {
    onSaveDraft: () => Promise<void>;
    onPublish: () => Promise<void>;
    lastSaved?: string;
    leftElement?: React.ReactNode;
}

export function PublishBar({ onSaveDraft, onPublish, lastSaved, leftElement }: PublishBarProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try { await onSaveDraft(); } finally { setIsSaving(false); }
    };

    const handlePublish = async () => {
        setIsPublishing(true);
        try { await onPublish(); } finally { setIsPublishing(false); }
    };

    return (
        <motion.footer
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] xl:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-fit"
        >
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-gray-900/20 rounded-[1.5rem] px-3 py-2.5 md:px-5 md:py-3 flex items-center gap-3 md:gap-4 ring-1 ring-black/5">
                {/* Left Side (Optional View Toggle) */}
                {leftElement && (
                    <div className="flex items-center pr-3 border-r border-gray-100">
                        {leftElement}
                    </div>
                )}

                {/* Status - Hidden on small mobile to save space */}
                <div className="hidden sm:flex flex-col pr-4 border-r border-gray-100">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {lastSaved || 'Not saved yet'}
                    </span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                        Drafting mode
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 md:gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 md:px-5 py-2.5 text-[11px] font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin text-primary" /> : <Save size={14} />}
                        <span className="hidden xs:inline">Save</span>
                    </button>
                    <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="px-4 md:px-6 py-2.5 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                        Publish
                    </button>
                </div>
            </div>
        </motion.footer>
    );
}
