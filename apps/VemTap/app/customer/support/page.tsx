'use client';

import React, { useState } from 'react';
import { MessageSquare, LifeBuoy, Clock, Search, Filter, Plus, ChevronRight, HelpCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CreateTicketModal from '@/components/ui/CreateTicketModal';
import { notify } from '@/lib/notify';
import { useCreateCustomerSupportTicket, useCustomerSupportTickets } from '@/services/customer/hooks';

export default function CustomerSupportPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { data: ticketsData = [] } = useCustomerSupportTickets();
    const createTicketMutation = useCreateCustomerSupportTicket();
    const tickets = Array.isArray(ticketsData) ? ticketsData : (ticketsData?.data || []);

    const handleCreateTicket = (data: any) => {
        createTicketMutation.mutate(data, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                notify.success('Support ticket created successfully. Our team will review it soon.');
            },
            onError: (error) => {
                notify.error(error instanceof Error ? error.message : 'Failed to create support ticket');
            }
        });
    };

    const faqs = [
        { q: 'How do I earn points?', a: 'Just tap your phone on any VemTap terminal at participating businesses.' },
        { q: 'Can I transfer points?', a: 'Currently, points are tied to your specific identity and cannot be transferred.' },
        { q: 'What happens if a reward expires?', a: 'Expired rewards cannot be reclaimed, but you can always earn new ones!' },
    ];

    return (
        <>
            <div className="max-w-5xl mx-auto space-y-5 md:space-y-8 pb-20 p-4 md:p-0">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-text-main tracking-tight">Help & Resolution</h1>
                        <p className="text-text-secondary font-medium mt-0.5">We're here to ensure your VemTap experience is seamless</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2.5 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={16} />
                        New Support Request
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Left Column: Tickets */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-display font-bold text-text-main flex items-center gap-2">
                            <MessageSquare size={20} className="text-primary" />
                            Active Conversations
                        </h3>

                        {tickets.length > 0 ? (
                            <div className="space-y-3">
                                {tickets.map((ticket: any) => (
                                    <div key={ticket.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all group cursor-pointer">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">{ticket.id}</span>
                                                <h4 className="font-bold text-text-main mt-2 group-hover:text-primary transition-colors text-sm">{ticket.subject}</h4>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === 'Open' || ticket.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                                                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                ticket.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                ticket.status === 'Cancelled' || ticket.status === 'Closed' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-xs text-text-secondary font-medium">
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1"><Filter size={12} /> {ticket.category}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt || ticket.date || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
                                    <MessageSquare size={28} />
                                </div>
                                <h4 className="font-bold text-text-main">No active tickets</h4>
                                <p className="text-sm text-text-secondary mt-1.5">Need help? Create a ticket and we'll be right with you.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: FAQ & Quick Help */}
                    <div className="space-y-4">
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <h3 className="text-lg font-display font-bold text-text-main mb-4 flex items-center gap-2">
                                <HelpCircle size={20} className="text-primary" />
                                Frequent Questions
                            </h3>
                            <div className="space-y-4">
                                {faqs.map((faq, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <p className="text-sm font-bold text-text-main">{faq.q}</p>
                                        <p className="text-xs text-text-secondary leading-relaxed">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => notify.info('Our dedicated Help Center is coming soon! For now, please use the New Support Request form.')}
                                className="w-full mt-5 py-2.5 bg-gray-50 text-primary font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-primary/5 transition-all"
                            >
                                Visit Help Center
                            </button>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                            <h4 className="font-bold text-primary mb-1.5">Live Support Hours</h4>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Our technical agents are online Monday to Friday, 9:00 AM — 6:00 PM (WAT).
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateTicketModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateTicket}
                        isLoading={createTicketMutation.isPending}
                        userType="customer"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
