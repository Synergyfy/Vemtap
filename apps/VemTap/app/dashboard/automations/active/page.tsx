'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Search, Filter, ArrowRight, Smartphone, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionDetailsModal from '@/components/messaging/SessionDetailsModal';
import { useAutomationLogs } from '@/services/messaging/hooks';

export default function ActiveAutomationsPage() {
    const { data: logData, isLoading } = useAutomationLogs();
    const [selectedSession, setSelectedSession] = React.useState<any>(null);

    // Filter for running or delayed sessions
    const activeSessions = (logData?.data || []).filter(log =>
        log.status === 'RUNNING' || log.status === 'DELAYED'
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <PageHeader
                    title="Active Automations"
                    description="View real-time automation sessions currently running for your customers."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {isLoading ? (
                    <div className="lg:col-span-3 flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : activeSessions.length > 0 ? (
                    activeSessions.map((session, i) => (
                        <motion.div
                            key={session.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all flex flex-col group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black uppercase">
                                        {session.visitorName?.[0] || 'V'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-text-main">{session.visitorName || 'Unknown Visitor'}</h4>
                                        <p className="text-[10px] text-text-secondary">{session.visitorPhone}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider ${session.status === 'RUNNING' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {session.status}
                                </div>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Current Step</p>
                                    <p className="text-sm font-bold text-text-main flex items-center gap-2">
                                        <Clock size={14} className="text-primary" />
                                        {session.currentStep || 'Initializing...'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-bold text-text-secondary">
                                    <span className="flex items-center gap-1">
                                        <Smartphone size={12} />
                                        {session.automationName}
                                    </span>
                                    <span>{new Date(session.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedSession(session)}
                                className="w-full h-12 mt-6 bg-white border border-gray-100 text-text-main font-bold text-xs rounded-xl hover:bg-gray-50 hover:text-primary transition-all flex items-center justify-center gap-2 group-hover:border-primary/20"
                            >
                                View Full Session
                                <ArrowRight size={14} />
                            </button>
                        </motion.div>
                    ))
                ) : (
                    <div className="lg:col-span-3 text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                        <Smartphone size={48} className="mx-auto text-gray-200 mb-4" />
                        <h4 className="text-lg font-bold text-text-main">No active sessions</h4>
                        <p className="text-sm text-text-secondary max-w-sm mx-auto mt-2">When customers engage with your automations, they will appear here in real-time.</p>
                    </div>
                )}
            </div>

            <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4">
                <AlertCircle className="text-blue-500 shrink-0" size={24} />
                <div>
                    <h5 className="font-bold text-blue-900 text-sm">Pro Tip: Real-time Monitoring</h5>
                    <p className="text-xs text-blue-800 leading-relaxed mt-1">
                        Active sessions show you exactly which step of the automation your customers are currently in. This helps you understand where they might be dropping off or waiting for replies.
                    </p>
                </div>
            </div>
            <AnimatePresence>
                {selectedSession && (
                    <SessionDetailsModal
                        session={selectedSession}
                        onClose={() => setSelectedSession(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

