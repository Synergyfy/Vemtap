import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ShoppingBag,
    Calendar,
    Gift,
    ChevronRight,
    ShieldCheck,
    Clock,
    ClipboardList,
    Share2,
    Link2,
    FileText,
    Image as ImageIcon,
    Contact
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FaWhatsapp } from 'react-icons/fa';
import { getQrIcon, getQrDescription } from '@/lib/utils/qr-icons';

interface PortalWelcomeProps {
    branchName: string;
    logoUrl?: string;
    welcomeTitle?: string;
    welcomeMessage?: string;
    onAction: (id: string) => void;
    productCount?: number;
    serviceCount?: number;
    offerCount?: number;
    formCount?: number;
    isFirstTimeVisit?: boolean;
    isReturningUser?: boolean;
    engagement?: any;
    whatsappNumber?: string | null;
    qrThriveCodes?: any[];
    availableForms?: any[];
    availableRewards?: any[];
    ublSequence?: string[];
    brandColor?: string;
    isPreview?: boolean;
}

export const PortalWelcome: React.FC<PortalWelcomeProps> = ({
    branchName,
    logoUrl,
    welcomeTitle,
    welcomeMessage,
    onAction,
    productCount,
    serviceCount,
    offerCount,
    formCount,
    isFirstTimeVisit,
    isReturningUser,
    engagement,
    whatsappNumber,
    qrThriveCodes,
    availableForms,
    availableRewards,
    ublSequence,
    brandColor,
    isPreview = false
}) => {
    const isServiceOnly = serviceCount && serviceCount > 0 && (!productCount || productCount === 0);

    const dynamicActions = useMemo(() => {
        if (!ublSequence) return null;
        const sequenceToUse = ublSequence;

        const formMap = new Map(availableForms?.map(f => [f.id, f]) || []);
        const rewardMap = new Map(availableRewards?.map(r => [r.id, r]) || []);
        const qrMap = new Map(qrThriveCodes?.map(q => [q.id, q]) || []);
        const customLabels = engagement?.ublSequenceLabels || {};

        return sequenceToUse.map(id => {
            const customTitle = customLabels[id];
            if (id === 'system:order') return { id: 'order', label: customTitle || 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: isPreview ? 1 : productCount };
            if (id === 'system:service') return { id: 'service', label: customTitle || (isServiceOnly ? 'Book Appointment' : 'Book Service'), icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: isServiceOnly ? 'Secure Your Time Slot' : 'Reservations & Slots', count: isPreview ? 1 : serviceCount };
            if (id === 'system:offers') return { id: 'offers', label: customTitle || 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: isPreview ? 1 : offerCount };
            if (id === 'system:whatsapp') return { id: 'whatsapp', label: customTitle || 'WhatsApp', icon: FaWhatsapp, color: 'text-green-500', bg: 'bg-green-50', desc: 'Instant Support', count: isPreview ? 1 : (whatsappNumber ? 1 : 0) };
            if (id === 'system:forms') return { id: 'forms', label: customTitle || 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Share your thoughts', count: isPreview ? 1 : formCount };
            if (id === 'system:engagement') return { id: 'engagement', label: customTitle || 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Follow us online', count: isPreview ? 1 : (Object.keys(engagement || {}).length > 0 ? 1 : 0) };

            const form = formMap.get(id);
            if (form) return { id: `form-${form.uniqueCode}`, label: customTitle || form.title, icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Feedback Form', count: 1 };
            
            const reward = rewardMap.get(id);
            if (reward) return { id: 'rewards', label: customTitle || reward.name, icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Loyalty Reward', count: 1 };
            
            const qr = qrMap.get(id);
            if (qr) return {
                id: `qr-${qr.shortId}`,
                label: customTitle || qr.name,
                icon: getQrIcon(qr.type),
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                desc: getQrDescription(qr.type),
                isQr: true,
                qrType: qr.type,
                shortId: qr.shortId,
                count: 1
            };
            return null;
        }).filter(action => action && (action as any).count !== 0);
    }, [ublSequence, availableForms, availableRewards, qrThriveCodes, productCount, serviceCount, isServiceOnly, offerCount, whatsappNumber, formCount, engagement, isPreview]);

    const actions = useMemo(() => {
        if (dynamicActions) return dynamicActions;
        return [
            { id: 'order', label: 'Place Order', icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-50', desc: 'Browse our Full Menu', count: productCount },
            { id: 'service', label: isServiceOnly ? 'Book Appointment' : 'Book Service', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50', desc: isServiceOnly ? 'Secure Your Time Slot' : 'Reservations & Slots', count: serviceCount },
            { id: 'offers', label: 'See Offers', icon: Gift, color: 'text-emerald-500', bg: 'bg-emerald-50', desc: 'Exclusive Hot Deals', count: offerCount },
            { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: 'text-green-500', bg: 'bg-green-50', desc: 'Instant Support', count: whatsappNumber ? 1 : 0 },
            { id: 'forms', label: 'Fill Feedback', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Share your thoughts', count: formCount },
            ...(qrThriveCodes || []).map((code: any) => ({
                id: `qr-${code.shortId}`,
                label: code.name,
                icon: code.type === 'pdf' ? FileText : code.type === 'image' ? ImageIcon : code.type === 'vcard' ? Contact : Link2,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                desc: code.type.toUpperCase(),
                count: 1,
                isExternal: true,
                url: `https://api.qrthrive.com/s/${code.shortId}`
            })),
            { id: 'engagement', label: 'Social Connect', icon: Share2, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Follow us online', count: Object.keys(engagement || {}).length > 0 ? 1 : 0 },
        ].filter(action => (action as any).count !== 0);
    }, [dynamicActions, productCount, serviceCount, isServiceOnly, offerCount, whatsappNumber, formCount, qrThriveCodes, engagement]);

    if (isServiceOnly && !ublSequence?.length) {
        (actions as any[]).sort((a, b) => a.id === 'service' ? -1 : (b.id === 'service' ? 1 : 0));
    }

    const useGrid = actions.length >= 4 && !isPreview;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn("w-full space-y-4 md:space-y-6 pt-6 md:pt-8 pb-6", isPreview && "space-y-2 pt-6 pb-0 px-3 shadow-none border-none bg-transparent")}
        >
            <div className={cn("flex items-center gap-4 mb-4 border-b border-slate-100/50 pb-4", isPreview && "mb-2 pb-2 gap-2")}>
                {logoUrl ? (
                    <div className={cn("size-12 md:size-16 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white shrink-0", isPreview && "size-8 border-none shadow-sm")}>
                        <img src={logoUrl} alt={branchName} className="size-full object-cover" />
                    </div>
                ) : (
                    <div className={cn("size-12 md:size-16 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shrink-0", isPreview && "size-8 shadow-sm")}>
                        <span className={cn("font-headline font-black text-lg md:text-xl uppercase tracking-tighter", isPreview && "text-sm")}>
                            {branchName.charAt(0)}
                        </span>
                    </div>
                )}
                <div className="space-y-0.5 flex-grow min-w-0">
                    <h1 className={cn("text-sm md:text-2xl font-headline font-bold text-on-surface leading-tight tracking-tight break-words", isPreview && "text-[10px] font-black")}>
                        {welcomeTitle || `Welcome to ${branchName}`}
                    </h1>
                    <p className={cn("text-on-surface-variant text-[7px] md:text-[10px] max-w-xs font-medium opacity-70 italic break-words", isPreview && "text-[8px]")}>
                        {welcomeMessage || "Select an option below"}
                    </p>
                </div>
            </div>

            <div className={cn(
                "gap-3 md:gap-4",
                useGrid ? "grid grid-cols-2" : "flex flex-col",
                isPreview && "grid grid-cols-2 gap-1.5"
            )}>
                {actions.filter(item => item !== null).map((item, idx) => (
                    <motion.button
                        key={item!.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (idx * 0.1) }}
                        onClick={() => (item as any).isExternal ? window.open((item as any).url, '_blank') : onAction(item!.id)}
                        className={cn(
                            "group relative flex border border-slate-50 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left overflow-hidden bg-white asymmetric-leaf",
                            useGrid
                                ? "flex-col gap-3 md:gap-5 p-5 md:p-8"
                                : "flex-row items-center gap-4 md:gap-5 p-4 md:p-5 w-full",
                            isPreview && "!flex-col !items-start !gap-1.5 !p-2.5 rounded-xl shadow-sm hover:-translate-y-0 hover:shadow-sm"
                        )}
                    >
                        <div className={cn(
                            "rounded-lg md:rounded-xl flex items-center justify-center shadow-inner shrink-0 transition-transform group-hover:scale-105",
                            item!.bg,
                            item!.color,
                            useGrid ? "size-12 md:size-16" : "size-11 md:size-13",
                            isPreview && "!size-7 rounded-lg"
                        )}>
                            {React.createElement(item!.icon, { 
                                size: useGrid ? 24 : 20, 
                                className: cn(useGrid ? "md:size-8" : "md:size-6", isPreview && "!size-3.5"), 
                                strokeWidth: 2.5 
                            })}
                        </div>
                        <div className="min-w-0 flex-1 w-full">
                            <h3 
                                className={cn(
                                    "font-headline font-bold tracking-tight leading-snug truncate block",
                                    useGrid ? "text-sm md:text-xl" : "text-xs md:text-base",
                                    isPreview && "!text-[9px] w-full"
                                )}
                                style={{ color: brandColor || '#0f172a' }}
                            >{item!.label}</h3>
                            <p className={cn(
                                "text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate block",
                                useGrid ? "text-[8px] md:text-[10px]" : "text-[7px] md:text-[10px]",
                                isPreview && "!text-[7px] w-full"
                            )}>{item!.desc}</p>
                        </div>
                        <div className={cn(
                            "p-1 opacity-10 group-hover:opacity-100 transition-opacity",
                            useGrid ? "absolute top-5 right-5 md:top-8 md:right-8" : "shrink-0",
                            isPreview && "hidden"
                        )}>
                            <ChevronRight className="text-primary" size={useGrid ? 16 : 14} />
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className={cn("flex justify-center gap-6 py-4 opacity-40 border-t border-slate-100/50", isPreview && "py-2 gap-3 opacity-30 border-none")}>
                <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400", isPreview && "text-[7px]")}>
                    <ShieldCheck size={isPreview ? 10 : 12} />
                    Verified
                </div>
                <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400", isPreview && "text-[7px]")}>
                    <Clock size={isPreview ? 10 : 12} />
                    Instant Service
                </div>
            </div>
        </motion.div>
    );
};
