'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { Download, Smartphone, Zap, Bell, Globe, ShieldCheck, X } from 'lucide-react';

interface InstallAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInstall: () => void;
}

const benefits = [
    { icon: Zap, text: 'Lightning-fast performance & instant load times' },
    { icon: Bell, text: 'Real-time push notifications for orders & updates' },
    { icon: Globe, text: 'Offline access to your business data anytime' },
    { icon: Smartphone, text: 'Full-screen native-like app experience' },
    { icon: ShieldCheck, text: 'Secure & private — your data stays safe' },
];

export default function InstallAppModal({ isOpen, onClose, onInstall }: InstallAppModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" showClose={false}>
            <div className="relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />

                <div className="relative p-8 md:p-10">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-text-secondary hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon */}
                    <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                        <Download size={32} />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main text-center mb-3">
                        Install Vemtap
                    </h2>
                    <p className="text-text-secondary font-medium text-center mb-8 max-w-md mx-auto">
                        Get the best experience with the Vemtap app — faster access, offline support, and instant notifications right at your fingertips.
                    </p>

                    {/* Benefits */}
                    <div className="space-y-3 mb-8">
                        {benefits.map((benefit, idx) => {
                            const Icon = benefit.icon;
                            return (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80">
                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon size={18} className="text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-text-main">{benefit.text}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={onInstall}
                            className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                        >
                            <Download size={18} />
                            Install App
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full h-12 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all"
                        >
                            Maybe Later
                        </button>
                    </div>

                    <p className="mt-6 text-[10px] text-text-secondary/60 font-medium uppercase tracking-widest text-center">
                        Available on Android, iOS & Web
                    </p>
                </div>
            </div>
        </Modal>
    );
}
