'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Clock, MessageSquare, Award, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface SessionDetailsModalProps {
    session: any;
    onClose: () => void;
}

export default function SessionDetailsModal({ session, onClose }: SessionDetailsModalProps) {
    if (!session) return null;

    const mockHistory = [
        { type: 'message', content: 'Welcome to VemTap! Enjoy your bonus.', direction: 'OUTBOUND', time: '10 mins ago', status: 'Delivered' },
        { type: 'tag', content: 'New Customer', time: '12 mins ago' },
        { type: 'loyalty', content: '+50 Points Assigned', time: '12 mins ago' },
        { type: 'trigger', content: 'NFC Tap Detected', time: '15 mins ago' },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-text-main/40 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                            {session.visitor[0]}
                        </div>
                        <div>
                            <h3 className="text-xl font-display font-black text-text-main">{session.visitor}</h3>
                            <p className="text-sm text-text-secondary">{session.phone}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X size={24} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Status Banner */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Current Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${session.status === 'Running' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                <span className="text-sm font-bold text-text-main">{session.status}</span>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Automation</span>
                            <div className="flex items-center gap-2">
                                <Smartphone size={16} className="text-primary" />
                                <span className="text-sm font-bold text-text-main">{session.automation}</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-text-main px-2">Flow Timeline</h4>
                        <div className="space-y-4 relative">
                            <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-gray-100" />

                            {mockHistory.map((item, i) => (
                                <div key={i} className="flex gap-6 relative">
                                    <div className={`size-12 rounded-2xl shrink-0 z-10 flex items-center justify-center border-4 border-white ${item.type === 'message' ? 'bg-blue-50 text-blue-500' :
                                            item.type === 'loyalty' ? 'bg-emerald-50 text-emerald-500' :
                                                item.type === 'tag' ? 'bg-purple-50 text-purple-500' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        {item.type === 'message' && <MessageSquare size={18} />}
                                        {item.type === 'loyalty' && <Award size={18} />}
                                        {item.type === 'tag' && <Tag size={18} />}
                                        {item.type === 'trigger' && <CheckCircle2 size={18} />}
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-bold text-text-main">{item.content}</p>
                                            <span className="text-[10px] font-medium text-text-secondary">{item.time}</span>
                                        </div>
                                        {item.status && (
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                                                <CheckCircle2 size={10} />
                                                {item.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Current Step */}
                            <div className="flex gap-6 relative">
                                <div className="size-12 rounded-2xl shrink-0 z-10 flex items-center justify-center border-4 border-white bg-primary text-white animate-pulse">
                                    <Clock size={18} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <p className="text-sm font-black text-primary uppercase tracking-widest">Waiting for reply</p>
                                    <p className="text-[10px] text-text-secondary mt-1">The system is currently waiting for the customer to respond to the last message.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4">
                        <AlertCircle className="text-blue-500 shrink-0" size={20} />
                        <p className="text-xs text-blue-900 leading-relaxed font-medium">
                            This session is running on the <strong>WhatsApp Channel</strong>. All messages are logged for your review.
                        </p>
                    </div>
                </div>

                <div className="p-8 border-t border-gray-50 flex gap-4 bg-gray-50/30">
                    <button
                        onClick={onClose}
                        className="w-full h-16 bg-white border border-gray-100 text-text-main font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-gray-50 transition-all"
                    >
                        Close Details
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
