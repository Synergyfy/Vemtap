"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    QrCode, 
    CheckCircle2, 
    Clock, 
    Ticket, 
    Keyboard, 
    ScanLine, 
    ArrowRight, 
    RefreshCcw, 
    Loader2, 
    Gift,
    X,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { useVerifyRedemption, useGenerateRedemptionCode, useRewards } from '@/services/loyalty/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useVisitors } from '@/services/visitors/hooks';
import { useDebounce } from '@/hooks/useDebounce';
import { notify } from '@/lib/notify';
import { Reward } from '@/types/loyalty';
import { Visitor } from '@/services/visitors/types';
import CustomerProfileModal from '@/components/loyalty/CustomerProfileModal';

type ActionView = 'main' | 'generate' | 'verify' | 'scan' | 'success_generate' | 'success_verify';

export default function RedemptionsPage() {
    const { activeBranchId } = useActiveBranch();
    const [view, setView] = useState<ActionView>('main');
    const [searchQuery, setSearchQuery] = useState('');
    const [redemptionCode, setRedemptionCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [verifiedReward, setVerifiedReward] = useState<any>(null);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 400);
    const { data: paginatedData, isLoading: isLoadingVisitors } = useVisitors(undefined, {
        search: debouncedSearch
    });
    const { data: rewards = [] } = useRewards(activeBranchId || undefined);
    
    const verifyMutation = useVerifyRedemption(activeBranchId || undefined);
    const generateMutation = useGenerateRedemptionCode();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (view === 'verify') {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [view]);

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').substring(0, 9);
        let formatted = val;
        if (val.length > 3) formatted = val.slice(0, 3) + '-' + val.slice(3);
        if (val.length > 6) formatted = formatted.slice(0, 7) + '-' + val.slice(6);
        setRedemptionCode(formatted);
    };

    const handleVerifyCode = async () => {
        const cleanCode = redemptionCode.replace(/\D/g, '');
        if (cleanCode.length !== 9) {
            notify.error("Please enter a complete 9-digit code");
            return;
        }
        
        try {
            const result = await verifyMutation.mutateAsync(cleanCode);
            if (result.success && result.redemption) {
                setVerifiedReward({
                    customerName: result.redemption.loyaltyProfile?.user ? `${result.redemption.loyaltyProfile.user.firstName} ${result.redemption.loyaltyProfile.user.lastName}` : 'Valued Customer',
                    rewardName: result.redemption.reward?.name || 'Unknown Reward',
                    pointsSpent: result.redemption.pointsSpent,
                    code: redemptionCode
                });
                setView('success_verify');
                notify.success("Reward verified and redeemed successfully!");
            } else {
                notify.error(result.error || "Invalid or expired code");
            }
        } catch (error: any) {
            notify.error(error.message || "Failed to verify code");
        }
    };

    const handleGenerateCode = async (reward: Reward) => {
        try {
            const result = await generateMutation.mutateAsync({ 
                rewardId: reward.id,
                branchId: activeBranchId || undefined
            });
            if (result.redemptionCode) {
                setGeneratedCode(result.redemptionCode);
                setSelectedReward(reward);
                setView('success_generate');
                notify.success("Promo code generated successfully!");
            }
        } catch (error: any) {
            notify.error(error.message || "Failed to generate code");
        }
    };

    const resetAction = () => {
        setView('main');
        setRedemptionCode('');
        setGeneratedCode(null);
        setSelectedReward(null);
        setVerifiedReward(null);
        verifyMutation.reset();
        generateMutation.reset();
    };

    const customers = paginatedData?.data || [];

    const handleViewProfile = (visitor: Visitor) => {
        setSelectedVisitor(visitor);
        setIsProfileOpen(true);
    };

    return (
        <div className="space-y-10">
            {/* Quick Actions Header */}
            <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Loyalty Operations</h2>
                        <p className="text-xs md:text-sm text-gray-500">Process redemptions and monitor customer points.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <Button 
                            onClick={() => setView('generate')}
                            className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-primary text-white gap-2 font-bold shadow-lg shadow-primary/20 text-xs md:text-sm"
                        >
                            <Ticket className="w-4 h-4 md:w-[18px] md:h-[18px]" /> Generate
                        </Button>
                        <Button 
                            onClick={() => setView('verify')}
                            variant="outline"
                            className="flex-1 md:flex-none h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border-gray-100 gap-2 font-bold text-xs md:text-sm"
                        >
                            <Keyboard className="w-4 h-4 md:w-[18px] md:h-[18px]" /> Verify
                        </Button>
                        <Button 
                            onClick={() => setView('scan')}
                            variant="outline"
                            className="h-11 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl border-gray-100 gap-2 font-bold bg-gray-900 text-white hover:bg-gray-800 text-xs md:text-sm"
                        >
                            <QrCode className="w-4 h-4 md:w-[18px] md:h-[18px]" /> Scan
                        </Button>
                    </div>
                </div>
            </section>

            {/* Main Content Area: Conditional Views */}
            <AnimatePresence mode="wait">
                {view !== 'main' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden"
                    >
                        <button 
                            onClick={resetAction}
                            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* View: Generate Code List */}
                        {view === 'generate' && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                        <Ticket size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold">Select Reward to Generate Code</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {rewards.map((reward) => (
                                        <button
                                            key={reward.id}
                                            onClick={() => handleGenerateCode(reward)}
                                            className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all text-left group"
                                        >
                                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{reward.pointCost} PTS</p>
                                            <h4 className="font-bold text-white mb-2">{reward.name}</h4>
                                            <div className="mt-auto flex items-center text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                                                Select <ArrowRight size={12} className="ml-1" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* View: Verify Entry */}
                        {view === 'verify' && (
                            <div className="max-w-md mx-auto text-center space-y-8">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-primary mx-auto">
                                    <Keyboard size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Verify Customer Code</h3>
                                    <p className="text-white/60 text-sm mt-2">Enter the 9-digit code provided by the customer.</p>
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={redemptionCode}
                                    onChange={handleCodeChange}
                                    placeholder="000-000-000"
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 text-center font-display font-black text-4xl tracking-[0.2em] outline-none focus:border-primary focus:bg-white/10 transition-all text-white"
                                />
                                <Button 
                                    onClick={handleVerifyCode}
                                    disabled={redemptionCode.replace(/\D/g, '').length !== 9 || verifyMutation.isPending}
                                    className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50"
                                >
                                    {verifyMutation.isPending ? "Verifying..." : "Verify & Redeem"}
                                </Button>
                            </div>
                        )}

                        {/* View: Success Generate */}
                        {view === 'success_generate' && (
                            <div className="max-w-md mx-auto text-center space-y-8 py-4">
                                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto">
                                    <ShieldCheck size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">Code Generated!</h3>
                                    <p className="text-white/60 text-sm mt-2">Share this code for <span className="text-white font-bold">{selectedReward?.name}</span>.</p>
                                </div>
                                <div className="bg-white/5 border-2 border-dashed border-primary/30 rounded-3xl py-10">
                                    <p className="text-6xl font-black tracking-widest">
                                        {generatedCode?.slice(0, 3)}-{generatedCode?.slice(3, 6)}-{generatedCode?.slice(6, 9)}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={resetAction} className="flex-1 text-white hover:bg-white/5">Close</Button>
                                    <Button onClick={() => setView('generate')} className="flex-[2] bg-white text-gray-900 font-bold hover:bg-gray-100">Generate Another</Button>
                                </div>
                            </div>
                        )}

                        {/* View: Success Verify */}
                        {view === 'success_verify' && (
                            <div className="max-w-md mx-auto text-center space-y-8 py-4">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto">
                                    <CheckCircle2 size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-green-400">Verified & Redeemed</h3>
                                    <p className="text-white/60 text-sm mt-2">
                                        Successfully redeemed <span className="text-white font-bold">{verifiedReward?.rewardName}</span> for <span className="text-white font-bold">{verifiedReward?.customerName}</span>.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Code</p>
                                        <p className="font-bold">{verifiedReward?.code}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Cost</p>
                                        <p className="font-bold text-primary">{verifiedReward?.pointsSpent} PTS</p>
                                    </div>
                                </div>
                                <Button onClick={resetAction} className="w-full bg-white text-gray-900 font-bold hover:bg-gray-100 h-12 rounded-2xl">Done</Button>
                            </div>
                        )}

                        {/* View: Scan QR (Mock UI for now, logic as per requirements) */}
                        {view === 'scan' && (
                            <div className="max-w-md mx-auto text-center space-y-8">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
                                    <ScanLine size={32} />
                                </div>
                                <div className="aspect-square bg-white/5 border-2 border-white/10 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-transparent to-primary/10 animate-pulse" />
                                    <div className="z-10 flex flex-col items-center gap-4">
                                        <QrCode size={120} className="text-white/20" />
                                        <p className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Place QR code within frame</p>
                                    </div>
                                    {/* Scanner corners */}
                                    <div className="absolute top-10 left-10 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                                    <div className="absolute top-10 right-10 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                                    <div className="absolute bottom-10 left-10 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                                    <div className="absolute bottom-10 right-10 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
                                </div>
                                <p className="text-xs text-white/40 font-medium">Camera access required for scanning</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Customer Table List */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                        Customer Ledger
                        <Badge variant="outline" className="rounded-lg bg-gray-50 text-gray-400 text-[9px]">Live Data</Badge>
                    </h3>
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input 
                            placeholder="Search contacts..." 
                            className="pl-11 h-11 md:h-12 rounded-xl md:rounded-2xl border-gray-100 bg-white shadow-sm text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto scrollbar-hide">
                    <div className="min-w-[800px] md:min-w-full">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="py-4 md:py-5 px-6 font-bold text-gray-900">Customer</TableHead>
                                    <TableHead className="py-4 md:py-5 px-6 font-bold text-gray-900">Points</TableHead>
                                    <TableHead className="py-4 md:py-5 px-6 font-bold text-gray-900">Contact</TableHead>
                                    <TableHead className="py-4 md:py-5 px-6 font-bold text-gray-900">Activity</TableHead>
                                    <TableHead className="py-4 md:py-5 px-6 font-bold text-gray-900 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingVisitors ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin inline-block mr-2" size={16} /> Loading...</TableCell>
                                        </TableRow>
                                    ))
                                ) : customers.map((visitor) => (
                                    <TableRow key={visitor.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors group">
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {visitor.firstName?.[0] || visitor.lastName?.[0] || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{visitor.firstName} {visitor.lastName}</p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ID: {visitor.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <Gift size={16} className="text-secondary" />
                                                <span className="font-black text-gray-900 text-sm">{visitor.loyaltyProfile?.pointsBalance || 0}</span>
                                                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">pts</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="text-xs text-gray-500 space-y-0.5">
                                                <p className="font-bold text-gray-700 truncate max-w-[150px]">{visitor.email || 'No Email'}</p>
                                                <p>{visitor.phone || 'No Phone'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                <Clock size={14} />
                                                {visitor.lastVisit ? new Date(visitor.lastVisit).toLocaleDateString() : 'Never'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 px-6 text-right">
                                            <Button 
                                                variant="ghost" 
                                                className="text-primary font-bold hover:bg-primary/5 rounded-xl px-4 text-xs"
                                                onClick={() => handleViewProfile(visitor)}
                                            >
                                                Profile
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <CustomerProfileModal 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                visitor={selectedVisitor}
            />
        </div>
    );
}
