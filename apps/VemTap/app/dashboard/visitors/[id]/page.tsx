'use client';
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/dashboard/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import SendMessageModal from '@/components/dashboard/SendMessageModal';
import EditVisitorModal from '@/components/dashboard/EditVisitorModal';
import AddNoteModal from '@/components/dashboard/AddNoteModal';
import { notify } from '@/lib/notify';
import { useVisitor } from '@/services/visitors/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';


export default function VisitorProfilePage() {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMsgOpen, setIsMsgOpen] = useState(false);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const params = useParams<{ id: string }>();
    const visitorId = params?.id || '';

    const userBranchId = useAuthStore((state) => state.user?.businessId);
    const { data: serverVisitor, isLoading } = useVisitor(visitorId, userBranchId);

    // Fallback object to map data safely if isLoading
    const visitorObj = serverVisitor || {
        id: visitorId,
        name: 'Loading...',
        email: '',
        phone: '',
        visits: 0,
        joinedDate: '',
        lastVisit: '',
        status: 'Loading',
        totalSpent: '0',
        tags: [],
    };

    const visitor = visitorObj;
    const displayName = visitor.name ||
        (visitor.firstName || visitor.lastName
            ? `${visitor.firstName || ''} ${visitor.lastName || ''}`.trim()
            : 'Unknown Visitor');
    const joinedCandidates: Array<string | Date | null | undefined> = [
        visitor.joinedDate,
        visitor.lastVisit,
        visitor.time,
        typeof visitor.timestamp === 'number'
            ? new Date(visitor.timestamp < 1_000_000_000_000 ? visitor.timestamp * 1000 : visitor.timestamp)
            : null,
    ];
    const joinedLabel = (() => {
        for (const candidate of joinedCandidates) {
            const formatted = formatDate(candidate);
            if (formatted !== 'N/A' && formatted !== 'Invalid Date') return formatted;
            if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
        }
        return 'Not provided';
    })();

    const handleEditSubmit = (data: any) => {
        // You'd trigger an api.patch mutation here
        setIsEditOpen(false);
        notify.success('Visitor profile updated successfully');
    };

    const handleNoteSubmit = (data: any) => {
        setIsNoteOpen(false);
        notify.success('Note added to visitor profile');
    };

    const timeline = [
        { date: 'Today, 2:15 PM', activity: 'Visited Main Entrance', location: 'Branch A', icon: 'nfc' },
        { date: 'Yesterday, 9:20 AM', activity: 'Redeemed Free Coffee Reward', location: 'Branch A', icon: 'redeem' },
        { date: 'Oct 25, 2024', activity: 'Received SMS Message "Weekend Special"', location: 'System', icon: 'sms' },
        { date: 'Oct 20, 2024', activity: 'Visited Table 4', location: 'Branch A', icon: 'nfc' },
        { date: 'Oct 15, 2024', activity: 'Visited Bar Area', location: 'Branch A', icon: 'nfc' },
    ];

    return (
        <div className="p-8">
            <PageHeader
                title="Visitor Profile"
                description={`Detailed information for ${displayName}`}
                actions={
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-text-main font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                        >
                            <span className="material-icons-round text-lg">edit</span>
                            Edit Profile
                        </button>
                        <button
                            onClick={() => setIsMsgOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all text-sm shadow-md shadow-primary/20"
                        >
                            <span className="material-icons-round text-lg">message</span>
                            Send Message
                        </button>
                    </div>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl mb-4 border-4 border-white shadow-lg">
                                    {displayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                                </div>
                                <h2 className="text-2xl font-display font-bold text-text-main">{displayName}</h2>
                                <span className="mt-2 inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-100 text-yellow-700">
                                    {visitor.status}
                                </span>
                            </div>

                            <div className="space-y-4 border-t border-gray-100 pt-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-gray-400">email</span>
                                    <span className="text-sm font-medium text-text-main">{visitor.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-gray-400">phone</span>
                                    <span className="text-sm font-medium text-text-main">{visitor.phone}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="material-icons-round text-gray-400">calendar_today</span>
                                    <span className="text-sm font-medium text-text-main">Joined: {joinedLabel}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {(visitor.tags || []).length > 0 ? visitor.tags.map((tag: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                                            {tag}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-text-secondary italic">No tags assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Total Visits</p>
                                <p className="text-2xl font-display font-bold text-text-main">{visitor.visits}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Total Spent</p>
                                <p className="text-2xl font-display font-bold text-text-main">{visitor.totalSpent}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activity Timeline */}
                    <div className="lg:col-span-2">
                        <ChartCard title="Activity Timeline" subtitle="Recent interactions with your business">
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                {timeline.map((item, index) => (
                                    <div key={index} className="relative flex items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="relative z-10 w-10 h-10 flex items-center justify-center bg-white border-2 border-primary/20 rounded-full shadow-sm">
                                                <span className="material-icons-round text-primary text-xl">{item.icon}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main">{item.activity}</p>
                                                <p className="text-xs text-text-secondary">{item.location} • {item.date}</p>
                                            </div>
                                        </div>
                                        <button className="text-text-secondary hover:text-primary">
                                            <span className="material-icons-round text-lg">chevron_right</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>

                        <div className="mt-8">
                            <ChartCard title="Notes" actions={
                                <button
                                    onClick={() => setIsNoteOpen(true)}
                                    className="text-primary text-sm font-bold flex items-center gap-1"
                                >
                                    <span className="material-icons-round text-sm">add</span>
                                    Add Note
                                </button>
                            }>
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                    <p className="text-sm text-text-main leading-relaxed">
                                        "Prefers seating near the window. Usually visits on Tuesday mornings for a double espresso."
                                    </p>
                                    <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                        <span>By John Manager</span>
                                        <span>Oct 28, 2024</span>
                                    </div>
                                </div>
                            </ChartCard>
                        </div>
                    </div>
                </div>
            )}

            <EditVisitorModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                visitor={visitor}
                onSubmit={handleEditSubmit}
            />

            <SendMessageModal
                isOpen={isMsgOpen}
                onClose={() => setIsMsgOpen(false)}
                recipientName={displayName}
                recipientPhone={visitor.phone}
                recipientEmail={visitor.email}
                visitors={[visitor]}
                type="welcome"
            />

            <AddNoteModal
                isOpen={isNoteOpen}
                onClose={() => setIsNoteOpen(false)}
                onSubmit={handleNoteSubmit}
            />
        </div>
    );
}
