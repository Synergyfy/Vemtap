'use client';

import React, { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { Search, Users, Plus, Check, Loader2, X, UserPlus, Info } from 'lucide-react';
import { useMessagingVisitorsByBranch } from '@/services/visitors/hooks';
import { useCreateSegment, useAddSegmentMembers } from '@/services/messaging/hooks';
import { useMessagingBranch } from '@/hooks/useMessagingBranch';
import { notify } from '@/lib/notify';

interface CreateSegmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateSegmentModal({ isOpen, onClose }: CreateSegmentModalProps) {
    const { branchId } = useMessagingBranch();
    const [searchQuery, setSearchQuery] = useState('');
    const [segmentName, setSegmentName] = useState('');
    const [segmentDescription, setSegmentDescription] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const { data: visitors = [], isLoading: isVisitorsLoading } = useMessagingVisitorsByBranch(branchId || undefined, {
        search: searchQuery
    });
    
    const createSegment = useCreateSegment();
    const addSegmentMembers = useAddSegmentMembers();
    
    const isCreating = createSegment.isPending || addSegmentMembers.isPending;

    const toggleUser = (userId: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const toggleAll = () => {
        if (selectedUserIds.size === visitors.length) {
            setSelectedUserIds(new Set());
        } else {
            setSelectedUserIds(new Set(visitors.map(v => v.id)));
        }
    };

    const handleCreate = async () => {
        if (!segmentName.trim()) {
            notify.error('Please enter a segment name');
            return;
        }
        if (selectedUserIds.size === 0) {
            notify.error('Please select at least one customer');
            return;
        }

        try {
            const segment = await createSegment.mutateAsync({
                name: segmentName.trim(),
                description: segmentDescription.trim(),
                branchId: branchId || undefined
            });

            await addSegmentMembers.mutateAsync({
                segmentId: segment.id,
                userIds: Array.from(selectedUserIds)
            });

            notify.success(`Segment "${segment.name}" created with ${selectedUserIds.size} members`);
            onClose();
            // Reset state
            setSegmentName('');
            setSegmentDescription('');
            setSelectedUserIds(new Set());
        } catch (error: any) {
            console.error('Create segment error:', error);
            notify.error(error?.response?.data?.message || 'Failed to create segment');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Segment"
            description="Group your customers to send targeted broadcasts and campaigns."
            size="2xl"
        >
            <div className="space-y-6 py-2">
                {/* Segment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Segment Name</label>
                        <input
                            type="text"
                            value={segmentName}
                            onChange={(e) => setSegmentName(e.target.value)}
                            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-sm placeholder:text-slate-300"
                            placeholder="e.g. VIP Customers"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description (Optional)</label>
                        <input
                            type="text"
                            value={segmentDescription}
                            onChange={(e) => setSegmentDescription(e.target.value)}
                            className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all text-sm placeholder:text-slate-300"
                            placeholder="e.g. Customers with over 10 visits"
                        />
                    </div>
                </div>

                {/* Visitor Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Customers ({selectedUserIds.size})</label>
                        <button 
                            onClick={toggleAll}
                            className="text-[10px] font-bold text-primary hover:underline"
                        >
                            {selectedUserIds.size === visitors.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 bg-slate-100 border-none rounded-xl pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                        />
                    </div>

                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {isVisitorsLoading ? (
                                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                                    <Loader2 className="animate-spin text-primary" size={24} />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Customers...</p>
                                </div>
                            ) : visitors.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Users className="mx-auto text-slate-200 mb-2" size={32} />
                                    <p className="text-sm text-slate-400 font-medium">Your first customer is waiting. Let's capture them today.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {visitors.map((visitor) => {
                                        const name = visitor.name || (visitor.firstName ? `${visitor.firstName} ${visitor.lastName || ''}`.trim() : '');
                                        const displayName = name || visitor.email || visitor.phone || 'Unknown Customer';
                                        
                                        return (
                                            <button
                                                key={visitor.id}
                                                onClick={() => toggleUser(visitor.id)}
                                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${selectedUserIds.has(visitor.id) ? 'bg-primary' : 'bg-slate-200'}`}>
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 truncate">{displayName}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium truncate">
                                                            {visitor.phone || visitor.email || 'No contact info'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedUserIds.has(visitor.id) ? 'bg-primary border-primary text-white' : 'border-slate-200 bg-white group-hover:border-slate-300'}`}>
                                                    {selectedUserIds.has(visitor.id) && <Check size={14} strokeWidth={3} />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex gap-3">
                    <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0 flex items-center justify-center">
                        <Info size={16} />
                    </div>
                    <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                        Segments allow you to target specific groups for broadcasts. For example, create a "Weekend Regulars" segment to send special Saturday offers.
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 h-12 border border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm active:scale-[0.98]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !segmentName.trim() || selectedUserIds.size === 0}
                        className="flex-[2] h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                    >
                        {isCreating ? (
                            <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Create Segment ({selectedUserIds.size})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
