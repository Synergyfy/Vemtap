'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Cluster } from '@/lib/api/clusters';
import ClusterRotatorPanel from './ClusterRotatorPanel';

interface ClusterRotatorDrawerProps {
    open: boolean;
    cluster: Cluster | null;
    onClose: () => void;
}

export default function ClusterRotatorDrawer({ open, cluster, onClose }: ClusterRotatorDrawerProps) {
    if (!open || !cluster) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-y-0 right-0 w-full sm:w-[440px] md:w-[500px] lg:w-[540px] bg-white shadow-2xl flex flex-col"
                >
                    <ClusterRotatorPanel variant="drawer" cluster={cluster} onClose={onClose} />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}