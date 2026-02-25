'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { Search, Filter, ArrowRight, User, Calendar, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SessionDetailsModal from '@/components/messaging/SessionDetailsModal';

const MOCK_LOGS = [
    { id: 1, visitor: 'Olamide Johnson', phone: '+234 812 345 6789', automation: 'New Customer Welcome', status: 'Completed', lastMessage: 'Welcome to VemTap! Enjoy your bonus.', date: '2026-02-25 14:30' },
    { id: 2, visitor: 'Chidi Okafor', phone: '+234 703 123 4567', automation: 'Repeat Visit Reward', status: 'Running', lastMessage: 'Thanks for coming back! Here is...', date: '2026-02-25 12:15' },
    { id: 3, visitor: 'Amina Bello', phone: '+234 901 987 6543', automation: 'Inactive Customer Reminder', status: 'Waiting Reply', lastMessage: 'We miss you at VemTap! Come visit...', date: '2026-02-24 10:00' },
    { id: 4, visitor: 'Emeka Obi', phone: '+234 805 555 4444', automation: 'New Customer Welcome', status: 'Completed', lastMessage: 'Welcome to VemTap! Enjoy your bonus.', date: '2026-02-24 09:30' },
];

export default function AutomationLogsPage() {
    const [selectedLog, setSelectedLog] = React.useState<any>(null);
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
                            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium text-sm"
                        />
                    </div>
                    <button className="h-12 px-5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 font-bold text-sm text-text-main shadow-sm">
                        <Filter size={18} />
                        Filter
                    </button>
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
                            {MOCK_LOGS.map((log) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={() => setSelectedLog(log)}
                                    className="group hover:bg-gray-50/50 transition-all cursor-pointer"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                                                {log.visitor.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main text-sm">{log.visitor}</p>
                                                <p className="text-[10px] text-text-secondary font-medium">{log.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-xs font-bold text-text-main">{log.automation}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${log.status === 'Completed' ? 'bg-emerald-500' :
                                                log.status === 'Running' ? 'bg-blue-500' : 'bg-amber-500'
                                                }`} />
                                            <span className="text-xs font-bold text-text-secondary">{log.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 max-w-xs">
                                            <MessageSquare size={14} className="text-gray-300 shrink-0" />
                                            <p className="text-xs text-text-secondary truncate">{log.lastMessage}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">{log.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 hover:bg-white rounded-lg transition-all group-hover:text-primary">
                                            <ArrowRight size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
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
