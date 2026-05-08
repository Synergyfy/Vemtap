import React from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';
import { cn } from '@/lib/utils';

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
    visitSource?: string | null;
    isPreview?: boolean;
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
    visitSource,
    isPreview = false,
    onRedeem,
    onContinue,
    onClear
}) => {
    const [hasConsented, setHasConsented] = React.useState(!showConsent);

    // Sync hasConsented if showConsent changes (e.g. after late profile fetch)
    React.useEffect(() => {
        if (!showConsent) {
            setHasConsented(true);
        }
    }, [showConsent]);


    return (
        <motion.div
            key="welcome-back"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(presets.card, isPreview && "p-0 shadow-none border-none bg-transparent")}
        >
            <VisitorHeader logoUrl={logoUrl} storeName={storeName} tag="Returning Guest" />

            <div className="mb-10 text-left">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={presets.tag}>{customWelcomeTag || "Welcome back"}</span>
                    {visitSource === 'whatsapp' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 shadow-sm">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Came from WhatsApp
                        </span>
                    )}
                </div>
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
