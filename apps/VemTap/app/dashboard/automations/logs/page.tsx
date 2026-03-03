'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Search, Filter, ArrowRight, User, Calendar, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionDetailsModal from '@/components/messaging/SessionDetailsModal';
import { useAutomationLogs } from '@/services/messaging/hooks';

export default function AutomationLogsPage() {
    const { data: logData, isLoading } = useAutomationLogs();
    const [selectedLog, setSelectedLog] = React.useState<any>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    const logs = logData?.data || [];
    const filteredLogs = logs.filter(log =>
        log.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.visitorPhone?.includes(searchTerm) ||
        log.automationName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <PageHeader
                    title="Automation Logs"
                    description="Track every interaction and engagement triggered by your automations."
                />
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search visitor or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Visitor</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Automation</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Last Message</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary">Date</th>
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <Loader2 className="animate-spin text-primary mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => setSelectedLog({ ...log, visitor: log.visitorName, phone: log.visitorPhone, automation: log.automationName })}
                                        className="group hover:bg-gray-50/50 transition-all cursor-pointer"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs uppercase">
                                                    {log.visitorName?.split(' ').map(n => n[0]).join('') || 'V'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main text-sm">{log.visitorName || 'Unknown'}</p>
                                                    <p className="text-[10px] text-text-secondary font-medium">{log.visitorPhone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-bold text-text-main">{log.automationName}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-2 rounded-full ${log.status === 'COMPLETED' ? 'bg-emerald-500' :
                                                    log.status === 'RUNNING' ? 'bg-blue-500' : 'bg-amber-500'
                                                    }`} />
                                                <span className="text-xs font-bold text-text-secondary uppercase">{log.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 max-w-xs">
                                                <MessageSquare size={14} className="text-gray-300 shrink-0" />
                                                <p className="text-xs text-text-secondary truncate">{log.lastMessage || '...'}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Calendar size={14} />
                                                <span className="text-xs font-medium">
                                                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button className="p-2 hover:bg-white rounded-lg transition-all group-hover:text-primary">
                                                <ArrowRight size={18} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center text-text-secondary font-medium">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <AnimatePresence>
                {selectedLog && (
                    <SessionDetailsModal
                        session={selectedLog}
                        onClose={() => setSelectedLog(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

