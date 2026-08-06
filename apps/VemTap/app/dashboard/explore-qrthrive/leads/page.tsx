'use client';

import React, { useState } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Search, Filter, Download, ChevronRight, 
    Calendar, Mail, Phone, MapPin, Hash, ExternalLink,
    X, Loader2, ArrowLeft, MoreHorizontal, Eye,
    CheckCircle2, AlertCircle, Clock, Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveLeads } from '@/services/qr-thrive/hooks';
import { QrThriveLead } from '@/services/qr-thrive/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function QrThriveLeadsPage() {
    const router = useRouter();
    const { activeBranchId } = useAuthStore();
    const { data: leads, isLoading, error } = useQrThriveLeads(activeBranchId);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<QrThriveLead | null>(null);
    const [filterForm, setFilterForm] = useState<string>('all');

    const filteredLeads = leads?.filter(lead => {
        const answers = lead.answers || {};
        const matchesSearch = Object.values(answers).some(val => 
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        ) || lead.form.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesForm = filterForm === 'all' || lead.formId === filterForm;
        
        return matchesSearch && matchesForm;
    });

    const uniqueFormsMap = new Map();
    leads?.forEach(l => {
        if (!uniqueFormsMap.has(l.formId)) {
            uniqueFormsMap.set(l.formId, l.form.title);
        }
    });
    const uniqueForms = Array.from(uniqueFormsMap.entries()).map(([id, title]) => ({ id, title }));

    const handleExport = () => {
        if (!filteredLeads || filteredLeads.length === 0) return;
        
        // Simple CSV export logic
        const headers = ['Date', 'Form', 'IP Address', 'Data'];
        const csvContent = [
            headers.join(','),
            ...filteredLeads.map(l => [
                format(new Date(l.createdAt), 'yyyy-MM-dd HH:mm'),
                l.form.title,
                l.ip || 'N/A',
                JSON.stringify(l.answers).replace(/,/g, ';')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leads_export_${format(new Date(), 'yyyyMMdd')}.csv`;
        link.click();
        toast.success('Leads exported successfully');
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Fetching your leads...</h2>
                <p className="text-gray-500 font-medium">This won't take long.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] p-6 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to load leads</h2>
                <p className="text-gray-500 max-w-md mb-8">
                    {error instanceof Error ? error.message : 'An unexpected error occurred while fetching your data.'}
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <div className="max-w-7xl mx-auto w-full p-4 lg:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.push('/dashboard/explore-qrthrive')}
                            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={16} className="text-blue-600" />
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">QRThrive Integration</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leads & Submissions</h1>
                            <p className="text-sm text-slate-400 font-medium mt-1">Manage and track responses from your QR forms</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="px-6 py-3.5 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3 bg-white rounded-[32px] border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text"
                                placeholder="Search leads by content..."
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-600/20 transition-all font-medium text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="text-slate-400 w-4 h-4 ml-2" />
                            <select 
                                className="bg-slate-50 border-none rounded-2xl px-4 py-3.5 font-bold text-xs outline-none focus:ring-0 cursor-pointer min-w-[160px]"
                                value={filterForm}
                                onChange={(e) => setFilterForm(e.target.value)}
                            >
                                <option value="all">All Forms</option>
                                {uniqueForms.map(f => (
                                    <option key={f.id} value={f.id}>{f.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[32px] p-6 shadow-xl shadow-blue-200 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Submissions</p>
                        <h3 className="text-4xl font-black text-white leading-none">{leads?.length || 0}</h3>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                    {!filteredLeads || filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                                <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Your first lead is out there — start engaging nearby customers</h3>
                            <p className="text-slate-400 max-w-xs mt-2 font-medium">
                                {searchQuery || filterForm !== 'all' 
                                    ? "Try adjusting your filters to find what you're looking for." 
                                    : "Start sharing your QR codes with forms to collect submissions."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50 bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lead / Submission</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Form Source</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data Points</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted At</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead, idx) => {
                                        const answers = lead.answers || {};
                                        const fields = lead.form.fields || [];
                                        
                                        const nameField = fields.find(f => f.label.toLowerCase().includes('name'))?.id;
                                        const emailField = fields.find(f => f.label.toLowerCase().includes('email'))?.id;
                                        
                                        const primaryText = nameField && answers[nameField] ? answers[nameField] : 
                                                           emailField && answers[emailField] ? answers[emailField] : 
                                                           Object.values(answers)[0] || 'Untitled Submission';
                                        
                                        const secondaryText = (nameField && emailField && answers[emailField]) ? answers[emailField] : 
                                                             (lead.ip ? `IP: ${lead.ip}` : 'Anonymous');

                                        return (
                                            <motion.tr 
                                                key={lead.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer"
                                                onClick={() => setSelectedLead(lead)}
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-110 transition-transform">
                                                            {String(primaryText).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 truncate">{primaryText}</p>
                                                            <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{secondaryText}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
                                                        <CheckCircle2 size={12} className="text-slate-400" />
                                                        <span className="text-[11px] font-bold text-slate-600">{lead.form.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-sm font-black text-slate-900">{Object.keys(answers).length}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-900">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</span>
                                                        <span className="text-[10px] font-medium text-slate-400">{format(new Date(lead.createdAt), 'h:mm a')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-slate-400 hover:text-blue-600 transition-all">
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed View Modal */}
            <AnimatePresence>
                {selectedLead && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Submission Details</h3>
                                        <p className="text-sm text-slate-400 font-medium">From {selectedLead.form.title}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedLead(null)}
                                    className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                <Calendar size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Submitted</p>
                                                <p className="text-sm font-bold text-slate-900">{format(new Date(selectedLead.createdAt), 'MMMM d, yyyy')}</p>
                                                <p className="text-xs font-medium text-slate-400">{format(new Date(selectedLead.createdAt), 'h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                <Smartphone size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Source QR</p>
                                                <p className="text-sm font-bold text-slate-900">{selectedLead.form.qrCode.name}</p>
                                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{selectedLead.form.qrCode.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Device Info</p>
                                                <p className="text-sm font-bold text-slate-900">IP: {selectedLead.ip || 'Unknown'}</p>
                                                <p className="text-xs font-medium text-slate-400">Verified Submission</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                <Hash size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Reference</p>
                                                <p className="text-xs font-mono font-bold text-slate-600 truncate max-w-[140px]">{selectedLead.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Submission Data</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {selectedLead.form.fields.map((field) => (
                                            <div key={field.id} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100/50">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <ChevronRight size={10} />
                                                    {field.label}
                                                </p>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {selectedLead.answers[field.id] || <span className="text-slate-300 italic">No response</span>}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                                <button 
                                    onClick={() => setSelectedLead(null)}
                                    className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    Close Details
                                </button>
                                <button 
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <Mail size={14} /> Send Email
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
