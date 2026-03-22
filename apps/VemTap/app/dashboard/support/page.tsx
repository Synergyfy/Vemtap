'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Ticket, 
    Timer, 
    Star, 
    MoreVertical, 
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Circle,
    X
} from 'lucide-react';

const stats = [
    { label: 'Total Requests', value: '1,542', change: '+12.5%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Open Tickets', value: '48', sub: 'High Priority', trend: 'neutral', icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Response', value: '2h 15m', change: '-15m', trend: 'down', icon: Timer, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Satisfaction', value: '4.8/5.0', change: '+0.2', trend: 'up', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const supportCategories = [
    { id: 'tech', name: 'Technical Issue' },
    { id: 'billing', name: 'Billing & Payments' },
    { id: 'account', name: 'Account Access' },
    { id: 'feature', name: 'Feature Request' },
    { id: 'general', name: 'General Inquiry' },
];

export default function SupportDashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [message, setMessage] = useState('');

    const handleNewTicket = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCategory('');
        setMessage('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle ticket submission logic here
        console.log({
            category: selectedCategory,
            message,
        });
        handleCloseModal();
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-display font-black text-slate-900 tracking-tight">Support Tickets</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Reach out to the admin team for help with your account, billing, or technical issues.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleNewTicket}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                    >
                        <Plus size={18} />
                        New Ticket
                    </button>
                </div>
            </div>

            {/* My Tickets List */}
            <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="font-display font-black text-slate-900 text-lg">My Tickets</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search my tickets..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {/* This will be replaced with a dynamic list of tickets */}
                    <div className="p-8 text-center text-slate-500">
                        <Ticket size={48} className="mx-auto mb-4 text-slate-300" />
                        <h3 className="font-bold text-lg">No tickets yet</h3>
                        <p className="text-sm">Click "New Ticket" to create your first support request.</p>
                    </div>
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg"
                        >
                            <div className="p-6 flex justify-between items-center border-b border-slate-100">
                                <h2 className="font-display font-bold text-xl text-slate-900">Create New Ticket</h2>
                                <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</label>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your issue or request..."
                                        rows={6}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-4">
                                    <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-600/20 disabled:opacity-50">
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
