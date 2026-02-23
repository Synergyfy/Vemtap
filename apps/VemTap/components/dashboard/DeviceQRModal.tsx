import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicQRCode from '@/components/shared/DynamicQRCode';
import { Device } from '@/services/devices/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

interface DeviceQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    device: Device | null;
}

export default function DeviceQRModal({ isOpen, onClose, device }: DeviceQRModalProps) {
    const { setRedirect } = useCustomerFlowStore();
    const { user } = useAuthStore();

    // Construct the full URL for the QR Code
    // Pattern: /tap/[business-slug]/[device-id]
    const getQrUrl = () => {
        if (!device) return '';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const businessSlug = user?.businessName
            ? user.businessName.replace(/\s+/g, '-').toUpperCase()
            : 'DEMO-BUSINESS';
        return `${baseUrl}/tap/${businessSlug}/${device.id}`;
    };

    useEffect(() => {
        if (device && isOpen) {
            // Optional: Still set redirect for fallback scenarios
            const targetUrl = getQrUrl();
            setRedirect(device.id, targetUrl);
        }
    }, [device, isOpen, setRedirect, user]);

    if (!isOpen || !device) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <h3 className="font-display font-bold text-lg text-text-main">Device QR Code</h3>
                            <p className="text-xs text-text-secondary font-medium">{device.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        <DynamicQRCode
                            customUrl={getQrUrl()}
                            redirectId={device.id}
                            label={device.name}
                            subLabel={device.code}
                            color="#000000"
                        />
                        <p className="mt-6 text-xs text-center text-gray-400 font-medium max-w-xs">
                            Scan this code to instantly trigger the <strong>{device.location}</strong> flow.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
