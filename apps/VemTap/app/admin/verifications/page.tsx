'use client';

import React, { useState } from 'react';
import {
    Search, Filter, CheckCircle, XCircle, Eye,
    FileText, User, Store, Calendar, ArrowRight,
    Download, ShieldCheck, AlertCircle, Clock
} from 'lucide-react';

// Mock Data for Verifications
const MOCK_VERIFICATIONS = [
    {
        id: 'VER-001',
        businessName: 'TechFlow Solutions',
        ownerName: 'Samuel Okon',
        type: 'Business',
        submittedAt: '2024-03-05T10:30:00Z',
        status: 'pending',
        documents: [
            { id: 'doc1', name: 'CAC Business License', type: 'licence', url: 'https://images.unsplash.com/photo-1554224155-1696413565d3?q=80&w=1000' },
            { id: 'doc2', name: 'Owner National ID', type: 'id', url: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1000' }
        ]
    },
    {
        id: 'VER-002',
        businessName: 'Green Earth Logistics',
        ownerName: 'Chioma Adebayo',
        type: 'Business',
        submittedAt: '2024-03-06T14:45:00Z',
        status: 'pending',
        documents: [
            { id: 'doc3', name: 'Business Registration Certificate', type: 'licence', url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=1000' },
            { id: 'doc4', name: 'Voters Card', type: 'id', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000' }
        ]
    },
    {
        id: 'VER-003',
        businessName: 'Pulse Digital',
        ownerName: 'David Chen',
        type: 'Individual',
        submittedAt: '2024-03-07T09:15:00Z',
        status: 'pending',
        documents: [
            { id: 'doc5', name: 'International Passport', type: 'id', url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=1000' }
        ]
    }
];

export default function VerificationsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVerification, setSelectedVerification] = useState<any>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [activeDocIndex, setActiveDocIndex] = useState(0);

    const filteredVerifications = MOCK_VERIFICATIONS.filter(v =>
        v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewDetails = (v: any) => {
        setSelectedVerification(v);
        setActiveDocIndex(0);
        setIsViewerOpen(true);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-text-main mb-2">Verifications</h1>
                    <p className="text-text-secondary font-medium">Review and verify customer business licenses and IDs</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm">
                        <button className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 rounded-lg">Pending</button>
                        <button className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-main transition-colors">Approved</button>
                        <button className="px-4 py-2 text-xs font-bold text-text-secondary hover:text-text-main transition-colors">Rejected</button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Pending', value: '42', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Verified Today', value: '18', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Avg. Review Time', value: '4.2h', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Suspicious Flag', value: '3', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">{stat.label}</p>
                                <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by ID, Business, or Owner name..."
                        className="w-full h-12 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="h-12 px-6 border border-gray-200 rounded-xl font-bold text-text-secondary flex items-center gap-2 hover:bg-gray-50 transition-colors">
                    <Filter size={18} />
                    <span>Filter</span>
                </button>
            </div>

            {/* Verifications Table/List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Request ID</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Entity</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">Submitted</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Documents</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                            {filteredVerifications.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-text-secondary bg-gray-100 px-2 py-1 rounded">
                                            {v.id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                                {v.type === 'Business' ? <Store size={20} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-text-main leading-tight">{v.businessName || v.ownerName}</p>
                                                <p className="text-[11px] text-text-secondary mt-0.5">{v.ownerName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${v.type === 'Business' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'
                                            }`}>
                                            {v.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                                        {new Date(v.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {v.documents.map((doc, idx) => (
                                                <div
                                                    key={idx}
                                                    title={doc.name}
                                                    className="w-8 h-8 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-all cursor-help"
                                                >
                                                    <FileText size={14} />
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewDetails(v)}
                                            className="px-4 py-2 bg-text-main text-white text-xs font-bold rounded-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2 ml-auto shadow-sm"
                                        >
                                            <Eye size={14} />
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredVerifications.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                            <Search size={32} />
                        </div>
                        <p className="font-bold text-text-main">No requests found</p>
                        <p className="text-sm text-text-secondary">Try adjusting your search query</p>
                    </div>
                )}
            </div>

            {/* Multi-Document Viewer Modal */}
            {isViewerOpen && selectedVerification && (
                <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsViewerOpen(false)} />

                    <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                        {/* Sidebar: Details & Document List */}
                        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col bg-gray-50/50">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-display font-bold text-text-main mb-4">Verification Review</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Entity Name</p>
                                        <p className="text-sm font-bold text-text-main">{selectedVerification.businessName}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Owner / Representative</p>
                                        <p className="text-sm font-bold text-text-main">{selectedVerification.ownerName}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-text-secondary mb-1">Type</p>
                                            <p className="text-sm font-bold text-indigo-600">{selectedVerification.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-text-secondary mb-1">ID</p>
                                            <p className="text-sm font-bold text-text-main">{selectedVerification.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                <p className="text-[10px] font-black uppercase text-text-secondary px-2 mb-2">Submitted Documents</p>
                                {selectedVerification.documents.map((doc: any, idx: number) => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setActiveDocIndex(idx)}
                                        className={`w-full p-3 rounded-2xl border text-left transition-all ${activeDocIndex === idx
                                                ? 'bg-white border-primary shadow-lg shadow-primary/5 text-primary ring-2 ring-primary/5'
                                                : 'bg-white border-gray-200 text-text-secondary hover:border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${activeDocIndex === idx ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold leading-none mb-1">{doc.name}</p>
                                                <p className="text-[10px] font-medium opacity-70 capitalize">{doc.type}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-white border-t border-gray-100 space-y-3">
                                <button className="w-full h-12 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                    <CheckCircle size={18} />
                                    <span>Approve Verification</span>
                                </button>
                                <button className="w-full h-12 bg-white border border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                                    <XCircle size={18} />
                                    <span>Reject Request</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Content: ImageViewer */}
                        <div className="flex-1 bg-gray-100 relative flex flex-col">
                            {/* Toolbar */}
                            <div className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-text-secondary">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-text-main line-clamp-1">{selectedVerification.documents[activeDocIndex].name}</p>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Page 1 of 1</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 rounded-xl bg-gray-50 text-text-secondary hover:text-text-main transition-colors border border-gray-100">
                                        <Download size={20} />
                                    </button>
                                    <div className="w-px h-6 bg-gray-200 mx-2" />
                                    <button
                                        onClick={() => setIsViewerOpen(false)}
                                        className="p-2.5 rounded-xl bg-white text-text-secondary hover:text-red-500 hover:bg-red-50 transition-all border border-gray-200"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Image Container */}
                            <div className="flex-1 p-8 overflow-hidden relative">
                                <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-auto p-4 flex items-center justify-center">
                                    <img
                                        src={selectedVerification.documents[activeDocIndex].url}
                                        alt={selectedVerification.documents[activeDocIndex].name}
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                    />
                                </div>

                                {/* Bottom Floating Controls */}
                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/90 text-white rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl backdrop-blur-md">
                                    <button
                                        onClick={() => setActiveDocIndex(i => Math.max(0, i - 1))}
                                        className={`hover:text-primary transition-colors ${activeDocIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                        Doc {activeDocIndex + 1} / {selectedVerification.documents.length}
                                    </span>
                                    <button
                                        onClick={() => setActiveDocIndex(i => Math.min(selectedVerification.documents.length - 1, i + 1))}
                                        className={`hover:text-primary transition-colors ${activeDocIndex === selectedVerification.documents.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

