"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, 
    Zap, 
    Users, 
    Gift, 
    ShieldCheck, 
    ArrowRight,
    Search,
    Filter,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import CustomerSelector from '@/components/loyalty/CustomerSelector';
import AwardPointsConfirmation from '@/components/loyalty/AwardPointsConfirmation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { PageGuideButton, AICopilotButton } from '@/components/ai';

export default function AwardPointsPage() {
    const router = useRouter();
    const { activeBranchId } = useActiveBranch();
    const { availableRewards, fetchRewards, earnPoints, isLoading: isActionLoading } = useLoyaltyStore();
    const { user } = useAuthStore();
    
    const [selectedProgramId, setSelectedProgramId] = useState<string>('');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [customPoints, setCustomPoints] = useState<number>(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Customers, 2: Program, 3: Finalize

    // Role check
    const isAuthorized = ['owner', 'manager'].includes((user?.role as string)?.toLowerCase());
    const isStaff = (user?.role as string)?.toLowerCase() === 'staff';

    useEffect(() => {
        if (activeBranchId) {
            fetchRewards(activeBranchId);
        }
    }, [activeBranchId, fetchRewards]);

    const selectedProgram = availableRewards.find(r => r.id === selectedProgramId);

    const handleNext = () => {
        if (step === 1 && selectedCustomerIds.length === 0) {
            toast.error('Please select at least one customer');
            return;
        }
        if (step === 2 && !selectedProgramId) {
            toast.error('Please select a loyalty program');
            return;
        }
        setStep(prev => prev + 1);
    };

    const handleAwardPoints = async () => {
        if (!isAuthorized && !isStaff) {
            toast.error('You are not authorized to perform this action');
            return;
        }

        if (isStaff) {
            toast.success('Approval request sent to manager');
            setIsConfirmOpen(false);
            router.push('/dashboard/loyalty');
            return;
        }

        try {
            const pointsToAward = customPoints > 0 ? customPoints : (selectedProgram?.pointCost || 0);
            
            // In a real app, you might have a bulk earn points API. 
            // For now, we'll iterate or assume the backend handles multiple userIds if supported.
            // Based on loyaltyApi.ts, it seems to take a single userId.
            
            let successCount = 0;
            for (const userId of selectedCustomerIds) {
                const response = await earnPoints({
                    userId,
                    branchId: activeBranchId || user?.branchId || '',
                    isVisit: false,
                    metadata: {
                        source: 'manual_award',
                        rewardId: selectedProgramId,
                        points: pointsToAward,
                        awardedBy: user?.id
                    }
                });
                if (response.success) successCount++;
            }

            if (successCount > 0) {
                toast.success(`Successfully awarded points to ${successCount} customers!`);
                setIsConfirmOpen(false);
                router.push('/dashboard/loyalty');
            } else {
                toast.error('Failed to award points. Please try again.');
            }
        } catch (error) {
            toast.error('An error occurred while awarding points.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl md:rounded-2xl hover:bg-gray-100"
                        onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2"><h1 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">Give Points</h1><PageGuideButton /><AICopilotButton /></div>
                        <p className="text-xs md:text-base text-gray-500 font-medium">Issue loyalty points to your customers</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10">
                    <ShieldCheck size={18} className="text-primary" />
                    <span className="text-sm font-bold text-primary capitalize">{user?.role} Access</span>
                </div>
            </div>

            {/* Steps Progress */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-10 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 1, label: 'Customers' },
                    { id: 2, label: 'Program' },
                    { id: 3, label: 'Finalize' }
                ].map((s, i) => (
                    <React.Fragment key={s.id}>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className={`size-6 md:size-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-sm transition-all ${
                                step >= s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 text-gray-400'
                            }`}>
                                {s.id}
                            </div>
                            <span className={`text-[10px] md:text-sm font-bold ${step >= s.id ? 'text-gray-900' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < 2 && <div className={`h-px w-6 md:w-10 shrink-0 ${step > s.id ? 'bg-primary' : 'bg-gray-100'}`} />}
                    </React.Fragment>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6 md:space-y-8">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                                    <h2 className="text-lg md:text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <Users className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        Identify Customers
                                    </h2>
                                    <CustomerSelector 
                                        selectedIds={selectedCustomerIds}
                                        onSelect={setSelectedCustomerIds}
                                    />
                                </div>
                            </motion.section>
                        )}

                        {step === 2 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                                    <h2 className="text-lg md:text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                            <Gift className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        Choose Loyalty Reward
                                    </h2>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {availableRewards.map((reward) => (
                                            <button
                                                key={reward.id}
                                                onClick={() => setSelectedProgramId(reward.id)}
                                                className={`p-5 md:p-6 rounded-2xl md:rounded-3xl text-left transition-all border-2 ${
                                                    selectedProgramId === reward.id 
                                                        ? 'border-primary bg-primary/5 shadow-md' 
                                                        : 'border-gray-50 bg-gray-50/50 hover:border-gray-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-sm">
                                                        <Zap className={cn("w-4 h-4 md:w-5 md:h-5", selectedProgramId === reward.id ? 'text-primary' : 'text-gray-400')} />
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-lg font-black text-gray-900">{reward.pointCost}</span>
                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Points</p>
                                                    </div>
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{reward.name}</h3>
                                                <p className="text-[10px] md:text-xs text-gray-500 line-clamp-2">{reward.description}</p>
                                            </button>
                                        ))}
                                    </div>

                                    {availableRewards.length === 0 && (
                                        <div className="py-12 md:py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                            <p className="text-sm md:text-base text-gray-400 font-medium">No rewards found. Create one first.</p>
                                            <Button 
                                                variant="outline" 
                                                className="mt-4 rounded-xl border-gray-200 font-bold"
                                                onClick={() => router.push('/dashboard/loyalty/rewards')}
                                            >
                                                Go to Create Rewards
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {step === 3 && (
                            <motion.section 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-8 shadow-sm">
                                    <h2 className="text-lg md:text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl">
                                            <Zap className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        Finalize Points
                                    </h2>

                                    <div className="space-y-6 md:space-y-8">
                                        <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-gray-50 border border-gray-100">
                                            <label className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider block mb-4">
                                                Points Amount
                                            </label>
                                            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
                                                <div className="flex-1">
                                                    <Input 
                                                        type="number"
                                                        value={customPoints || selectedProgram?.pointCost || 0}
                                                        onChange={(e) => setCustomPoints(Number(e.target.value))}
                                                        className="h-12 md:h-16 text-xl md:text-3xl font-black rounded-xl md:rounded-2xl border-gray-100 bg-white shadow-inner focus:ring-primary"
                                                    />
                                                </div>
                                                <div className="pb-2 md:pb-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">
                                                    Points / Customer
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-4 italic">
                                                Defaults to the cost of <strong>{selectedProgram?.name}</strong>
                                            </p>
                                        </div>

                                        <div className="flex items-start gap-3 md:gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                            <div className="p-2 bg-white rounded-xl shadow-sm text-primary shrink-0">
                                                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <p className="text-[11px] md:text-sm font-medium text-gray-600 leading-relaxed">
                                                Total of <span className="font-black text-gray-900">{(customPoints || selectedProgram?.pointCost || 0) * selectedCustomerIds.length}</span> points will be issued to <span className="font-black text-gray-900">{selectedCustomerIds.length}</span> customers.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4">
                        <Button 
                            variant="ghost" 
                            className="rounded-xl md:rounded-2xl h-12 md:h-14 px-6 md:px-8 font-bold text-gray-500 hover:bg-gray-100 text-xs md:text-base"
                            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
                        >
                            Back
                        </Button>
                        <Button 
                            className="rounded-xl md:rounded-2xl h-12 md:h-14 px-8 md:px-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02] text-xs md:text-base"
                            onClick={() => step === 3 ? setIsConfirmOpen(true) : handleNext()}
                        >
                            {step === 3 ? (isStaff ? 'Request Approval' : 'Confirm') : 'Continue'}
                            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-[28px] md:rounded-[32px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
                        {/* Decoration */}
                        <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        
                        <h3 className="text-md md:text-lg font-black mb-6 md:mb-8 flex items-center gap-2">
                            <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary fill-primary" />
                            Award Summary
                        </h3>

                        <div className="space-y-5 md:space-y-6 relative z-10">
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 tracking-widest">Selected Reward</p>
                                <p className="text-xs md:text-sm font-bold text-white">{selectedProgram?.name || 'Not selected'}</p>
                            </div>

                            <div className="space-y-1 md:space-y-2">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 tracking-widest">Customers</p>
                                <p className="text-xs md:text-sm font-bold text-white">{selectedCustomerIds.length} selected</p>
                            </div>

                            <div className="pt-4 md:pt-6 border-t border-white/10 space-y-1 md:space-y-2">
                                <p className="text-[9px] md:text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Points</p>
                                <p className="text-3xl md:text-4xl font-black text-primary">
                                    {((customPoints || selectedProgram?.pointCost || 0) * selectedCustomerIds.length).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isAuthorized && isStaff && (
                        <div className="bg-amber-50 rounded-2xl md:rounded-3xl p-5 md:p-6 border border-amber-100 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] md:text-xs font-medium text-amber-700 leading-relaxed">
                                <strong>Staff Account:</strong> Your awards require manager approval before being applied to customer accounts.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <AwardPointsConfirmation 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleAwardPoints}
                programName={selectedProgram?.name || ''}
                points={customPoints || selectedProgram?.pointCost || 0}
                customerCount={selectedCustomerIds.length}
                isLoading={isActionLoading}
            />
        </div>
    );
}
