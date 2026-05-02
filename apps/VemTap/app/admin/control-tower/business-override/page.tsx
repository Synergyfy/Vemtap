'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, 
    ShieldCheck, 
    LogIn, 
    Loader2, 
    Clock, 
    History, 
    UserPlus, 
    AlertCircle, 
    Shield, 
    Plus,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Timer,
    Check
} from 'lucide-react';
import { 
    useControlTowerBusinesses, 
    useControlTowerCustomers, 
    useExecuteBusinessSudoAction,
    useExecuteCustomerSudoAction
} from '@/services/control-tower/hooks';
import { 
    ControlTowerSession, 
    AccessRequest, 
    PermissionLevel,
    TargetType 
} from '@/services/control-tower/types';
import { useAdminUsers } from '@/services/users/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { useSudoStore } from '@/store/useSudoStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { MessageSquare, AlertTriangle, ExternalLink } from 'lucide-react';

type TabType = 'active-sessions' | 'access-requests' | 'history' | 'manual-assignment';

export default function BusinessOverridePage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('active-sessions');
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
    const [isAutoAssignEnabled, setIsAutoAssignEnabled] = useState(false);
    
    // Filtering State
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    const [activeSessionsFilter, setActiveSessionsFilter] = useState<'all' | 'business' | 'customer'>('all');
    
    // Manual Assignment State
    const [businessQuery, setBusinessQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const debouncedBusinessQuery = useDebounce(businessQuery, 500);
    
    // Grant Modal State
    const [grantTargetType, setGrantTargetType] = useState<TargetType>('business');
    const [grantPermission, setGrantPermission] = useState<PermissionLevel>('VIEW_EDIT');
    const [grantDuration, setGrantDuration] = useState('15');
    const [grantTargetId, setGrantTargetId] = useState('');
    const [grantAgent, setGrantAgent] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);
    
    // Fetch real agents
    const { data: agentsData } = useAdminUsers({ role: 'agent', limit: 50 });
    const agents = agentsData?.items || [];

    // Reset to page 1 when search query changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedBusinessQuery]);

    // Data Fetching
    const { data: allBusinesses = [], isLoading: isLoadingBusinesses } = useControlTowerBusinesses({
        query: debouncedBusinessQuery,
        limit: 100,
    });

    const { data: allCustomers = [], isLoading: isLoadingCustomers } = useControlTowerCustomers({
        query: grantTargetType === 'customer' ? grantTargetId : '',
        limit: 10,
    });

    // Client-side pagination logic
    const itemsPerPage = 10;
    const totalItems = allBusinesses.length;
    const lastPage = Math.ceil(totalItems / itemsPerPage);
    const paginatedBusinesses = allBusinesses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const { startSession } = useSudoStore();
    const { setActiveBranch } = useAuthStore();
    const sudoMutation = useExecuteBusinessSudoAction();
    const customerSudoMutation = useExecuteCustomerSudoAction();
    const queryClient = useQueryClient();

    const handleSudoLogin = async (biz: any) => {
        try {
            const durationMs = parseInt(grantDuration) * 60 * 1000 || 15 * 60 * 1000; 
            const response = await sudoMutation.mutateAsync({
                businessUid: biz.uid,
                actionKey: 'assume_session',
                payload: {
                    businessName: biz.name,
                    adminEntry: true,
                    expiresAt: Date.now() + durationMs,
                }
            });

            // Clear caches and state before entering new session
            queryClient.clear();
            setActiveBranch(null);

            startSession({
                type: 'business',
                subjectId: biz.uid,
                token: response.data.token,
                expiresAt: Date.now() + durationMs,
                permissions: [grantPermission]
            });

            toast.success(`Entering Sudo mode for ${biz.name}`);
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.message || 'Failed to start sudo session');
        }
    };

    const handleGrantAccess = async () => {
        if (!grantTargetId) {
            toast.error('Please select a target account');
            return;
        }

        const durationMs = parseInt(grantDuration) * 60 * 1000;
        
        try {
            if (grantTargetType === 'business') {
                const biz = allBusinesses.find(b => b.uid === grantTargetId || b.name === grantTargetId);
                if (biz) {
                    await handleSudoLogin(biz);
                } else {
                    // Fallback for direct ID entry
                    const response = await sudoMutation.mutateAsync({
                        businessUid: grantTargetId,
                        actionKey: 'assume_session',
                        payload: { adminEntry: true, expiresAt: Date.now() + durationMs }
                    });

                    // Clear caches and state
                    queryClient.clear();
                    setActiveBranch(null);

                    startSession({
                        type: 'business',
                        subjectId: grantTargetId,
                        token: response.data.token,
                        expiresAt: Date.now() + durationMs,
                        permissions: [grantPermission]
                    });
                    toast.success('Session started for business ID: ' + grantTargetId);
                    router.push('/dashboard');
                }
            } else {
                // Customer session
                const response = await customerSudoMutation.mutateAsync({
                    customerUid: grantTargetId,
                    businessUid: '', // customer sudo doesn't strictly need this on frontend if direct
                    actionKey: 'assume_session',
                    payload: { adminEntry: true, expiresAt: Date.now() + durationMs }
                });

                // Clear caches and state
                queryClient.clear();
                setActiveBranch(null);

                startSession({
                    type: 'customer',
                    subjectId: grantTargetId,
                    token: response.data.token,
                    expiresAt: Date.now() + durationMs,
                    permissions: [grantPermission]
                });
                toast.success('Session started for customer ID: ' + grantTargetId);
                router.push(`/customer/dashboard?admin_mode=1&customer_uid=${grantTargetId}`);
            }
            
            setIsGrantModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to start sudo session');
        }
    };

    const handleMessageAgent = (agentName: string) => {
        toast.success(`Opening internal chat with ${agentName}...`);
    };

    // Mock data for Active Sessions
    const activeSessions: ControlTowerSession[] = [
        {
            id: 'sess_1',
            agentId: 'agent_1',
            agentName: 'Admin User',
            targetType: 'business',
            targetName: 'Starbucks Central',
            businessId: 'biz_abc123',
            permissionLevel: 'VIEW_EDIT',
            startTime: new Date().toISOString(),
            endTime: '',
            expiresAt: Date.now() + 12.75 * 60 * 1000,
            status: 'active'
        },
        {
            id: 'sess_2',
            agentId: 'agent_2',
            agentName: 'Support Agent A',
            targetType: 'customer',
            targetName: 'John Doe',
            customerId: 'cust_xyz789',
            permissionLevel: 'VIEW_ONLY',
            startTime: new Date().toISOString(),
            endTime: '',
            expiresAt: Date.now() + 5.33 * 60 * 1000,
            status: 'active'
        }
    ];

    const filteredActiveSessions = activeSessions.filter(s => 
        activeSessionsFilter === 'all' || s.targetType === activeSessionsFilter
    );

    // Mock data for Access Requests
    const accessRequests: AccessRequest[] = [
        { 
            id: 'req_1', 
            requestedBy: 'agent_c', 
            requestedByName: 'Agent C', 
            targetId: 'biz_dmp1', 
            targetName: 'Dominos Pizza', 
            targetType: 'business', 
            duration: '30m', 
            reason: 'Order verification issue', 
            status: 'pending', 
            timestamp: new Date().toISOString() 
        },
        { 
            id: 'req_2', 
            requestedBy: 'agent_d', 
            requestedByName: 'Agent D', 
            targetId: 'cust_as2', 
            targetName: 'Alice Smith', 
            targetType: 'customer', 
            duration: '15m', 
            reason: 'Refund request audit', 
            status: 'pending', 
            timestamp: new Date().toISOString() 
        },
    ];

    // Mock data for History
    const historyLogs = [
        { id: 'log_1', agent: 'Admin', target: 'Starbucks', action: 'Session Ended', time: '2026-04-10 14:30', duration: '15m' },
        { id: 'log_2', agent: 'Agent A', target: 'John Doe', action: 'Updated Profile', time: '2026-04-10 12:15', duration: '10m' },
        { id: 'log_3', agent: 'Agent B', target: 'Burger King', action: 'Paused Business', time: '2026-04-09 16:45', duration: '5m' },
    ];

    const handleExtendSession = (sessionId: string) => {
        toast.success('Session extended by 10 minutes');
    };

    const handleTerminateSession = (sessionId: string) => {
        if (window.confirm('Are you sure you want to force-terminate this session? The agent will be logged out immediately.')) {
            toast.success('Session terminated successfully');
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header section with Grant Access CTA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Control Tower</p>
                    <h1 className="text-3xl font-display font-bold text-text-main mt-1">System Oversight</h1>
                    <p className="text-sm text-text-secondary font-medium mt-1">Manage secure, time-limited access to business and customer accounts.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2.5 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary leading-none">Auto-Assign</span>
                            <span className={`text-[10px] font-bold ${isAutoAssignEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {isAutoAssignEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                        </div>
                        <button 
                            onClick={() => setIsAutoAssignEnabled(!isAutoAssignEnabled)}
                            className={`w-10 h-5 rounded-full transition-all relative ${isAutoAssignEnabled ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAutoAssignEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsGrantModalOpen(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Grant Access
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Timer size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Active Sessions</p>
                        <p className="text-2xl font-display font-bold text-text-main">{activeSessions.length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Pending Requests</p>
                        <p className="text-2xl font-display font-bold text-text-main">{accessRequests.length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">System Health</p>
                        <p className="text-2xl font-display font-bold text-text-main">Secure</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'active-sessions', label: 'Active Sessions', icon: Clock },
                        { id: 'manual-assignment', label: 'Manual Assignment', icon: UserPlus },
                        { id: 'access-requests', label: 'Access Requests', icon: AlertCircle },
                        { id: 'history', label: 'History / Logs', icon: History },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex items-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-main'
                            }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'active-sessions' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                            <div className="flex gap-2">
                                {(['all', 'business', 'customer'] as const).map(f => (
                                    <button 
                                        key={f}
                                        onClick={() => setActiveSessionsFilter(f)}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${activeSessionsFilter === f ? 'bg-primary text-white border-primary' : 'bg-white text-text-secondary border-gray-200 hover:border-primary/50'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-200">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Agent</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Target</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Permission</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Time Left</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                        <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredActiveSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-sm text-text-secondary italic">No active sessions found for this filter</td>
                                        </tr>
                                    ) : (
                                        filteredActiveSessions.map((session) => (
                                            <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                                                            {session.agentName.charAt(0)}
                                                        </div>
                                                        <p className="font-bold text-sm text-text-main">{session.agentName}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-sm text-text-main">{session.targetName}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase font-black">{session.targetType}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                        <Shield size={10} />
                                                        {session.permissionLevel}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="font-mono text-xs font-bold text-text-main">
                                                        {Math.floor((session.expiresAt - Date.now()) / 60000)}:{(Math.floor((session.expiresAt - Date.now()) / 1000) % 60).toString().padStart(2, '0')}
                                                    </p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-600">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleMessageAgent(session.agentName)}
                                                            className="p-2 text-text-secondary hover:text-primary transition-colors hover:bg-gray-100 rounded-lg" 
                                                            title="Message Agent (Step 19)"
                                                        >
                                                            <MessageSquare size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleExtendSession(session.id)}
                                                            className="p-2 text-text-secondary hover:text-primary transition-colors hover:bg-gray-100 rounded-lg" 
                                                            title="Extend Time"
                                                        >
                                                            <Clock size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleTerminateSession(session.id)}
                                                            className="p-2 text-text-secondary hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg" 
                                                            title="End Session"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'manual-assignment' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="flex-1 max-w-xl">
                                <h2 className="text-xl font-display font-bold text-text-main">Direct Override</h2>
                                <p className="text-xs text-text-secondary mt-1">Directly impersonate a business account for urgent support. Standard 15m session.</p>
                                <div className="relative mt-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        value={businessQuery}
                                        onChange={(e) => setBusinessQuery(e.target.value)}
                                        className="w-full h-12 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        placeholder="Search business by name, owner, or email..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead className="bg-gray-50/50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Business Info</th>
                                        <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Users</th>
                                        <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Status</th>
                                        <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoadingBusinesses ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-sm text-text-secondary italic">Loading data...</td>
                                        </tr>
                                    ) : paginatedBusinesses.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center text-sm text-text-secondary italic">No businesses found</td>
                                        </tr>
                                    ) : (
                                        paginatedBusinesses.map((biz: any) => (
                                            <tr
                                                key={biz.uid}
                                                className="hover:bg-gray-50/50 transition-colors group"
                                            >
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">{biz.name}</p>
                                                    <p className="text-[10px] text-text-secondary font-mono mt-0.5">{biz.uid} • {biz.owner}</p>
                                                </td>
                                                <td className="py-4 px-6 text-sm font-bold text-text-main">{biz.users}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${biz.status === 'active' ? 'bg-green-50 text-green-600' : biz.status === 'suspended' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>
                                                        {biz.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => handleSudoLogin(biz)}
                                                        disabled={sudoMutation.isPending}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-md shadow-primary/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                                                    >
                                                        {sudoMutation.isPending ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <LogIn size={14} />
                                                        )}
                                                        Sudo Login
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Workaround Pagination Controls */}
                            {totalItems > itemsPerPage && (
                                <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                        Page <span className="text-text-main">{currentPage}</span> of <span className="text-text-main">{lastPage}</span>
                                        <span className="ml-2 font-medium capitalize">({totalItems} results available)</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(lastPage, prev + 1))}
                                            disabled={currentPage === lastPage}
                                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'access-requests' && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-200">
                                <tr>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Agent</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Requested Target</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Duration</th>
                                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Reason</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-wider text-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {accessRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-black">
                                                    {req.requestedByName.charAt(0)}
                                                </div>
                                                <p className="font-bold text-sm text-text-main">{req.requestedByName}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="font-bold text-sm text-text-main">{req.targetName}</p>
                                            <p className="text-[10px] text-text-secondary uppercase font-black">{req.targetType}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs font-bold text-text-main">{req.duration}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-xs text-text-secondary italic">"{req.reason}"</p>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleMessageAgent(req.requestedByName)}
                                                    className="p-2 text-text-secondary hover:text-primary transition-colors hover:bg-gray-100 rounded-lg" 
                                                    title="Message Agent"
                                                >
                                                    <MessageSquare size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => toast.success('Access request approved')}
                                                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => toast.error('Access request rejected')}
                                                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-wrap gap-4 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    placeholder="Filter by agent or target..."
                                    className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                            <select 
                                value={historyFilter}
                                onChange={(e) => setHistoryFilter(e.target.value)}
                                className="h-10 px-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-text-main focus:outline-none"
                            >
                                <option value="all">All Targets</option>
                                <option value="business">Business Only</option>
                                <option value="customer">Customer Only</option>
                            </select>
                            <button className="h-10 px-4 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all">
                                Export Logs
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-200">
                                    <tr>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Agent</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Target</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Action</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Permission</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary">Time</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-text-secondary text-right">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historyLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-6 text-sm font-bold text-text-main">{log.agent}</td>
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-bold text-text-main">{log.target}</p>
                                                <p className="text-[10px] text-text-secondary uppercase font-black">Business</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-text-main">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-[10px] font-bold text-blue-600">VIEW_EDIT</span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-text-secondary font-mono">{log.time}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-4">
                                                    <span className="text-xs text-text-secondary font-bold">{log.duration}</span>
                                                    <button 
                                                        onClick={() => setSelectedLog(log)}
                                                        className="p-2 text-text-secondary hover:text-primary transition-colors hover:bg-gray-100 rounded-lg"
                                                    >
                                                        <Search size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Log Details Modal */}
            <Modal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Activity Log Details"
                description="Comprehensive breakdown of the recorded administrative action."
                size="md"
            >
                {selectedLog && (
                    <div className="space-y-6 py-2">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Agent</p>
                                <p className="text-sm font-bold text-text-main mt-1">{selectedLog.agent}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Timestamp</p>
                                <p className="text-sm font-bold text-text-main mt-1">{selectedLog.time}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Target</p>
                                <p className="text-sm font-bold text-text-main mt-1">{selectedLog.target}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Session ID</p>
                                <p className="text-sm font-mono text-text-secondary mt-1">sess_{Math.random().toString(36).substr(2, 9)}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Action Performed</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-primary">POST</span>
                                <code className="text-xs font-mono text-text-main">/api/v1/business/settings/update</code>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3">Metadata Payload</p>
                            <pre className="p-4 bg-slate-900 text-slate-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                                {JSON.stringify({
                                    updates: {
                                        businessName: "Starbucks Central",
                                        status: "active",
                                        modifiedBy: "ControlTower_Agent"
                                    },
                                    ip: "192.168.1.105",
                                    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
                                }, null, 4)}
                            </pre>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2.5 bg-gray-100 text-text-secondary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                Close Entry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Grant Access Modal */}
            <Modal
                isOpen={isGrantModalOpen}
                onClose={() => setIsGrantModalOpen(false)}
                title="Grant Temporary Access"
                description="Manually assign an agent to a business or customer account."
                size="lg"
            >
                <div className="space-y-6 py-2">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-amber-900 font-bold">System Rules Enforcement (Step 21)</p>
                            <p className="text-[10px] text-amber-800 font-medium mt-0.5 leading-relaxed">
                                All sessions are strictly time-bound. Access to passwords or billing is restricted. Every action is logged and linked to the assigned agent's profile for audit compliance.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Target Type</label>
                            <select 
                                value={grantTargetType}
                                onChange={(e) => setGrantTargetType(e.target.value as any)}
                                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="business">Business Account</option>
                                <option value="customer">Customer Account</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Permission Level</label>
                            <select 
                                value={grantPermission}
                                onChange={(e) => setGrantPermission(e.target.value as any)}
                                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="VIEW_ONLY">VIEW_ONLY</option>
                                <option value="VIEW_EDIT">VIEW_EDIT</option>
                                <option value="VIEW_REPLY">VIEW_REPLY</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Search {grantTargetType === 'business' ? 'Business' : 'Customer'} Account
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                value={grantTargetId}
                                onChange={(e) => setGrantTargetId(e.target.value)}
                                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder={`Enter ${grantTargetType} name or ID...`}
                            />
                        </div>
                        {grantTargetType === 'business' && allBusinesses.length > 0 && grantTargetId && (
                            <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-100">
                                {allBusinesses.filter(b => b.name.toLowerCase().includes(grantTargetId.toLowerCase())).map(b => (
                                    <button 
                                        key={b.uid} 
                                        onClick={() => setGrantTargetId(b.uid)}
                                        className="w-full text-left px-4 py-2 hover:bg-white text-xs flex items-center justify-between"
                                    >
                                        <span>{b.name} <span className="text-gray-400 font-mono ml-2">({b.uid})</span></span>
                                        {grantTargetId === b.uid && <Check size={14} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Assign Agent (Step 18)</label>
                            <select 
                                value={grantAgent}
                                onChange={(e) => setGrantAgent(e.target.value)}
                                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Select an available agent...</option>
                                {agents.map((agent: any) => (
                                    <option key={agent.id} value={agent.id}>{agent.name || agent.email}</option>
                                ))}
                                <option value="admin">Admin (Self)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Duration (Step 4)</label>
                            <select 
                                value={grantDuration}
                                onChange={(e) => setGrantDuration(e.target.value)}
                                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="10">10 Minutes</option>
                                <option value="15">15 Minutes (Default)</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                                <option value="custom">Custom...</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsGrantModalOpen(false)}
                            className="px-6 py-3 bg-gray-100 text-text-secondary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleGrantAccess}
                            className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-md shadow-primary/10"
                        >
                            Assign & Notify Agent
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-gray-100/50 rounded-xl p-6 border border-dashed border-gray-200 mt-8">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest text-center flex items-center justify-center gap-2">
                    <Shield size={14} />
                    All Control Tower actions are encrypted and logged for security compliance.
                </p>
            </div>
        </div>
    );
}
