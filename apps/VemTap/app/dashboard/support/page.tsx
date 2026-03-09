'use client';

import React, { useState } from 'react';
import { MessageSquare, LifeBuoy, Clock, Search, Filter, Plus, ChevronRight, HelpCircle, ShieldAlert, Loader2 } from 'lucide-react';
import CreateTicketModal from '@/components/ui/CreateTicketModal';
import { notify } from '@/lib/notify';
import { useCustomerSupportTickets, useCreateCustomerSupportTicket } from '@/services/customer/hooks';

interface Ticket {
    id: string;
    subject: string;
    status: string;
    category: string;
    date: string;
}

export default function BusinessSupportPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: ticketsData, isLoading: isLoadingTickets } = useCustomerSupportTickets();
    const createTicket = useCreateCustomerSupportTicket();

    const rawTickets = Array.isArray(ticketsData)
        ? ticketsData
        : Array.isArray((ticketsData as any)?.data)
            ? (ticketsData as any).data
            : [];

    const tickets = rawTickets.map((ticket: any) => ({
        id: String(ticket?.id || 'ticket').slice(0, 8).toUpperCase(),
        subject: ticket?.subject || 'Untitled Ticket',
        status: ticket?.status || 'Open',
        category: ticket?.category || 'General',
        date: new Date(ticket?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }));

    const handleCreateTicket = (data: any) => {
        createTicket.mutate(data, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                notify.success('Technical support request received. A success engineer will reach out shortly.');
            },
            onError: () => {
                notify.error('Failed to create ticket. Please try again.');
            }
        });
    };

    return (
        <>
            <div className="p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-text-main tracking-tight">Technical Support</h1>
                        <p className="text-text-secondary font-medium mt-1">Direct access to our hardware and software engineers</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3.5 bg-primary text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-primary-hover shadow-xl shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Plus size={16} />
                        Request Priority Assistance
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Tickets */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-display font-bold text-text-main flex items-center gap-2">
                                <MessageSquare size={20} className="text-primary" />
                                My Tickets
                            </h3>
                        </div>

                        {isLoadingTickets ? (
                            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                                <Loader2 size={40} className="text-primary mx-auto animate-spin" />
                                <p className="text-sm text-text-secondary mt-4">Loading tickets...</p>
                            </div>
                        ) : tickets.length > 0 ? (
                            <div className="space-y-4">
                                {tickets.map((ticket: Ticket) => (
                                    <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all group cursor-pointer">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">{ticket.id}</span>
                                                <h4 className="font-bold text-text-main mt-3 group-hover:text-primary transition-colors text-base">{ticket.subject}</h4>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ticket.status === 'Open' ? 'bg-green-100 text-green-700' :
                                                ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-400'
                                                }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-text-secondary font-bold">
                                            <div className="flex items-center gap-6">
                                                <span className="flex items-center gap-1.5"><Filter size={14} className="text-gray-400" /> {ticket.category}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> {ticket.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                                                <span>View Thread</span>
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <LifeBuoy size={40} className="text-primary/20" />
                                </div>
                                <h4 className="text-xl font-display font-bold text-text-main">Clean Slate!</h4>
                                <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">No open support requests. Everything seems to be running smooth at your business.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Emergency & Doc Links */}
                    <div className="space-y-8">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-8">
                            <div className="flex items-center gap-3 text-red-600 mb-4">
                                <ShieldAlert size={20} />
                                <h3 className="font-bold uppercase tracking-widest text-[11px]">Emergency Protocol</h3>
                            </div>
                            <p className="text-xs text-red-800/80 leading-relaxed font-medium mb-6">
                                If your hardware is down or you cannot access your dashboard, call our merchant hotline immediately for 15-minute SLA.
                            </p>
                            <a href="tel:+234800SUPPORT" className="flex items-center justify-center h-12 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                                Call SLA Hotline
                            </a>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                            <h3 className="text-lg font-display font-bold text-text-main mb-6 flex items-center gap-2">
                                <HelpCircle size={20} className="text-primary" />
                                Merchant Docs
                            </h3>
                            <div className="space-y-4">
                                {[
                                    'How to link new NFC plates',
                                    'Exporting customer tax reports',
                                    'Customizing loyalty success screen',
                                    'Staff role permissions guide'
                                ].map((doc, i) => (
                                    <a key={i} href="#" className="flex items-center justify-between text-sm font-medium text-text-secondary hover:text-primary group transition-colors">
                                        {doc}
                                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CreateTicketModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTicket}
                userType="business"
                isLoading={createTicket.isPending}
            />
        </>
    );
}
