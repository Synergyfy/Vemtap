import React from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';

interface StepWelcomeBackProps {
    storeName: string;
    logoUrl?: string | null;
    customWelcomeMessage?: string | null;
    customWelcomeTitle?: string | null;
    customWelcomeButton?: string | null;
    customWelcomeTag?: string | null;
    customPrivacyMessage?: string | null;
    userData: any;
    visitCount: number;
    rewardVisitThreshold: number;
    hasRewardSetup: boolean;
    redemptionStatus: 'none' | 'pending' | 'approved' | 'declined';
    showConsent?: boolean;
    isCustomer?: boolean;
    onRedeem: () => void;
    onContinue: () => void;
    onClear: () => void;
}

export const StepWelcomeBack: React.FC<StepWelcomeBackProps> = ({
    storeName,
    logoUrl,
    customWelcomeMessage,
    customWelcomeTitle,
    customWelcomeButton,
    customWelcomeTag,
    customPrivacyMessage,
    userData,
    visitCount,
    rewardVisitThreshold,
    hasRewardSetup,
    redemptionStatus,
    showConsent = false,
    isCustomer = false,
    onRedeem,
    onContinue,
    onClear
}) => {
    const [hasConsented, setHasConsented] = React.useState(!showConsent);

    return (
        <motion.div
            key="welcome-back"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={presets.card}
        >
            <VisitorHeader logoUrl={logoUrl} storeName={storeName} tag="Returning Guest" />

            <div className="mb-10 text-left">
                <span className={presets.tag}>{customWelcomeTag || "Welcome back"}</span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2">     
                    {customWelcomeTitle ? customWelcomeTitle.replace('{name}', (userData?.firstName || userData?.name?.split(' ')[0] || 'there')) : (
                        <>Hi, <span className="text-primary">{(userData?.firstName || userData?.name?.split(' ')[0] || 'there')}!</span></>
                    )}
                </h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    {customWelcomeMessage || `It's great to see you again at ${storeName}.`}
                </p>
            </div>

            {hasRewardSetup && (
                <div className="mb-8 p-6 rounded-2xl bg-gray-50/50 border border-gray-100 text-left relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Loyalty Progress</p>
                                <p className="text-lg font-black text-slate-900 tracking-tight">
                                    {visitCount} of {rewardVisitThreshold} Visits
                                </p>
                            </div>
                            <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">redeem</span>
                            </div>
                        </div>

                        <div className="h-2 w-full bg-gray-200/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((visitCount / rewardVisitThreshold) * 100, 100)}%` }}
                                className="h-full bg-primary"
                            />
                        </div>

                        <p className="mt-4 text-[11px] text-gray-400 font-medium">
                            {visitCount >= rewardVisitThreshold
                                ? "You've earned a reward! You can claim it below."
                                : `Just ${rewardVisitThreshold - visitCount} more visits to unlock your next reward.`}
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 size-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                </div>
            )}

            <div className="mb-8 space-y-3">
                {isCustomer && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left">        
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Your Verified Profile</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">person</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 leading-none mb-1">Full Name</p>
                                    <p className="text-xs font-black text-slate-900">
                                        {userData?.firstName} {userData?.lastName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400 text-lg">mail</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 leading-none mb-1">Email Address</p>
                                    <p className="text-xs font-black text-slate-900">{userData?.email}</p>
                                </div>
                            </div>
                            {userData?.phone && (
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">smartphone</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 leading-none mb-1">Phone Number</p>
                                        <p className="text-xs font-black text-slate-900">{userData?.phone}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showConsent && (
                    <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50/50 cursor-pointer group hover:bg-white hover:border-primary/20 transition-all text-left">
                        <input
                            type="checkbox"
                            checked={hasConsented}
                            onChange={(e) => setHasConsented(e.target.checked)}
                            className="size-4 accent-primary mt-1"
                        />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-900 group-hover:text-primary">I Accept Privacy Terms</p>
                            <p className="text-[10px] text-gray-400 font-medium leading-tight mt-1">      
                                {customPrivacyMessage || "I agree to have my visits securely tracked and data collected just for feedback and loyalty rewards."}
                            </p>
                        </div>
                    </label>
                )}
            </div>

            <div className="space-y-4">
                {/* Reward Redemption Action */}
                {hasRewardSetup && visitCount >= rewardVisitThreshold && (
                    <div className="space-y-2">
                         {redemptionStatus === 'none' ? (
                            <button
                                onClick={onRedeem}
                                disabled={!hasConsented}
                                className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                <span className="material-symbols-outlined text-sm">redeem</span>
                                Redeem My Reward
                            </button>
                        ) : redemptionStatus === 'pending' ? (
                            <div className="w-full h-14 rounded-2xl bg-emerald-50 text-emerald-600 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-emerald-100">      
                                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                                Pending Staff Approval...
                            </div>
                        ) : redemptionStatus === 'approved' ? (
                            <button
                                onClick={onContinue}
                                className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-bold uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Claim Approved Reward
                            </button>
                        ) : null}
                    </div>
                )}

                {/* Primary Visit Action */}
                <button
                    onClick={onContinue}
                    disabled={!hasConsented}
                    className={`w-full h-14 rounded-2xl ${!hasConsented ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white shadow-primary/20'} font-bold uppercase tracking-widest text-xs shadow-xl ${!hasConsented ? '' : 'hover:scale-[1.02] active:scale-95'} transition-all flex items-center justify-center gap-2`}
                >
                    {customWelcomeButton || (showConsent ? 'Submit & Get Reward' : 'Continue to Experience')}
                </button>

                <button
                    onClick={onClear}
                    className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors py-2 block w-full disabled:opacity-50"
                >
                    Not you? Clear Profile
                </button>
            </div>
        </motion.div>
    );
};
