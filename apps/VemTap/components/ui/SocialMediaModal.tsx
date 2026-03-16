'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Twitter, Facebook, Linkedin, Star } from 'lucide-react';

interface SocialMediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        reviewUrl?: string;
        trustpilotUrl?: string;
    };
}

export const SocialMediaModal: React.FC<SocialMediaModalProps> = ({ isOpen, onClose, socialLinks }) => {
    const normalizeSocialUrl = (value: string | undefined, prefix: string) => {
        if (!value) return undefined;
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith('www.')) return `https://${trimmed}`;
        if (trimmed.startsWith('@')) return `${prefix}${trimmed.slice(1)}`;
        if (!trimmed.includes('.') && !trimmed.includes('/')) return `${prefix}${trimmed}`;
        return `https://${trimmed}`;
    };

    const socials = [
        { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', url: normalizeSocialUrl(socialLinks?.instagram, 'https://instagram.com/') },
        { name: 'X / Twitter', icon: Twitter, color: 'text-slate-900', bg: 'bg-slate-50', url: normalizeSocialUrl(socialLinks?.twitter, 'https://x.com/') },
        { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', url: normalizeSocialUrl(socialLinks?.facebook, 'https://facebook.com/') },
        { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50', url: normalizeSocialUrl(socialLinks?.linkedin, 'https://linkedin.com/in/') },
        { name: 'Google Review', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', url: normalizeSocialUrl(socialLinks?.reviewUrl, '') },
        { name: 'Trustpilot', icon: Star, color: 'text-emerald-600', bg: 'bg-emerald-50', url: normalizeSocialUrl(socialLinks?.trustpilotUrl, '') },
    ].filter(s => s.url && s.url !== '');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-[360px] bg-white rounded-3xl p-8 shadow-2xl overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Connect with us</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1">Follow our official handles</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {socials.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-between p-4 rounded-2xl ${social.bg} group transition-all hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-xl bg-white shadow-sm ${social.color}`}>
                                            <social.icon size={20} />
                                        </div>
                                        <span className="font-bold text-slate-900">{social.name}</span>
                                    </div>
                                    <X size={16} className="text-slate-300 group-hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all rotate-45" />
                                </a>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full mt-8 h-14 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
