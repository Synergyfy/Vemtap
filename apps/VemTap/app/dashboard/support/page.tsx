'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Ticket, 
    Timer, 
    Star, 
    Plus,
    X,
    Loader2
} from 'lucide-react';
import { useUserSupportTickets, useCreateSupportTicket } from '@/services/support/hooks';
import Spinner from '@/components/ui/Spinner';
import { PageGuideButton, AICopilotButton } from '@/components/ai';
import toast from 'react-hot-toast';

const supportCategories = [
    { id: 'technical', name: 'Technical Issue' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'account', name: 'Account Access' },
    { id: 'feature', name: 'Feature Request' },
    { id: 'general', name: 'General Inquiry' },
];

export default function SupportDashboard() {
    const { data: ticketsData, isLoading } = useUserSupportTickets();
    const createTicketMutation = useCreateSupportTicket();
    const tickets = Array.isArray(ticketsData?.data) ? ticketsData.data : (Array.isArray(ticketsData) ? ticketsData : []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subject, setSubject] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [message, setMessage] = useState('');

    const handleNewTicket = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSubject('');
        setSelectedCategory('');
        setMessage('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            toast.error('Please enter a subject and message');
            return;
        }

        createTicketMutation.mutate(
            {
                subject,
                message,
                category: selectedCategory || 'general',
                priority: 'medium',
            },
            {
                onSuccess: () => {
                    toast.success('Support ticket submitted successfully');
                    handleCloseModal();
                },
                onError: (error: any) => {
                    toast.error(error?.message || 'Failed to submit support ticket');
                },
            }
        );
    };

    const openTickets = tickets.filter((t: any) => t.status === 'open' || t.status === 'new' || t.status === 'pending').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    const stats = [
        { label: 'Total Requests', value: tickets.length.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Open Tickets', value: openTickets.toString(), icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Avg. Response', value: '< 24 Hours', icon: Timer, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Satisfaction', value: '98%', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2"><h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Support Tickets</h1><PageGuideButton /><AICopilotButton /></div>
                    <p className="text-slate-500 text-sm font-medium mt-1">Reach out to the admin team for help with your account, billing, or technical issues.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleNewTicket}
                        className="flex items-center gap-2 h-10 px-5 bg-blue-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20"
                    >
                        <Plus size={16} />
                        New Ticket
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className={`size-10 rounded-lg flex items-center justify-center mb-4 shadow-sm ${stat.bg}`}>
                            <stat.icon size={20} className={stat.color} />
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.label}</p>
                        <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Ticket Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-6">Your Tickets</h3>
                <div className="overflow-x-auto">
                    {tickets.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    <th className="p-4">Ticket ID</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Created Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tickets.map((ticket: any) => (
                                    <tr key={ticket.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-mono text-xs font-bold text-slate-700">{ticket.id?.slice(0, 8)}</td>
                                        <td className="p-4 text-sm font-bold text-slate-900">{ticket.subject || ticket.title || 'Support Request'}</td>
                                        <td className="p-4 text-xs text-slate-500 font-bold capitalize">{ticket.category || 'General'}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                ticket.status === 'closed' || ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                                'bg-blue-50 text-blue-600 border border-blue-200'
                                            }`}>
                                                {ticket.status || 'Open'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-medium text-slate-500">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <Ticket size={48} className="mx-auto mb-4 text-slate-300" />
                            <h3 className="font-bold text-lg">Your support tickets will appear here</h3>
                            <p className="text-sm">Click &quot;New Ticket&quot; to create your first support request.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Ticket Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-slate-100">
                                <h2 className="font-display font-bold text-xl text-slate-900">Create New Support Ticket</h2>
                                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ticket Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Brief summary of your issue"
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                        required
                                    >
                                        <option value="" disabled>Select a category...</option>
                                        {supportCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your issue or request in detail..."
                                        rows={5}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-4 pt-2">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createTicketMutation.isPending}
                                        className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {createTicketMutation.isPending ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : null}
                                        Submit Ticket
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
