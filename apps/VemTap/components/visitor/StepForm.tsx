import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';

const visitorSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email("Invalid email format").optional().or(z.literal('')),
});

type VisitorFormData = z.infer<typeof visitorSchema>;

interface StepFormProps {
    storeName: string;
    logoUrl?: string | null;
    customWelcomeMessage?: string | null;
    customWelcomeTitle?: string | null;
    customWelcomeTag?: string | null;
    customPrivacyMessage?: string | null;
    submitLabel?: string | null;
    initialData?: any;
    isSyncingReal?: boolean;
    isDeviceSynced?: boolean;
    onBack: () => void;
    onSubmit: (data: VisitorFormData) => void;
}

export const StepForm: React.FC<StepFormProps> = ({
    storeName,
    logoUrl,
    customWelcomeMessage,
    customWelcomeTitle,
    customWelcomeTag,
    customPrivacyMessage,
    submitLabel,
    initialData,
    isSyncingReal,
    isDeviceSynced,
    onBack,
    onSubmit
}) => {
    const [hasConsented, setHasConsented] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<VisitorFormData>({
        resolver: zodResolver(visitorSchema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || ''
        },
        mode: 'onChange'
    });

    return (
        <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={presets.card}>
            <button
                onClick={onBack}
                className="absolute top-8 right-8 size-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
            >
                <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:text-primary transition-colors">close</span>
            </button>

            {isSyncingReal && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-10 text-center">
                    <div className="size-20 bg-[#4285F4]/10 rounded-full flex items-center justify-center mb-8 relative">
                        <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-[#4285F4] rounded-full" />
                        <svg className="size-10 text-[#4285F4] relative z-10" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-black text-[#4285F4] uppercase tracking-[0.2em]">Synchronizing</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-4">Connecting verified profile data.</p>
                </div>
            )}

            <VisitorHeader logoUrl={logoUrl} storeName={storeName} />

            <div className="mb-6">
                <span className={presets.tag}>{customWelcomeTag || "Quick Link"}</span>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-2 text-left">
                    {customWelcomeTitle || "Connect with us"}
                </h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed text-left">
                    {customWelcomeMessage || "Leave your details to stay in touch and earn rewards."}
                </p>
            </div>

            {isDeviceSynced && (
                <div className="mb-8 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-blue-500 text-xl">devices</span>
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none mb-1">Device Recognized</p>
                            <p className="text-[10px] font-bold text-gray-400">Synced from local memory</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1">
                    <label htmlFor="name" className={presets.label}>Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                        <input
                            id="name"
                            type="text"
                            {...register('name')}
                            autoComplete="name"
                            placeholder="Enter your name"
                            className={`${presets.input} ${errors.name ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        />
                    </div>
                    {errors.name && <p className={presets.error}>{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                    <label htmlFor="phone" className={presets.label}>Phone Number</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">smartphone</span>
                        </div>
                        <input
                            id="phone"
                            type="tel"
                            {...register('phone')}
                            autoComplete="tel"
                            placeholder="Phone number"
                            className={`${presets.input} ${errors.phone ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        />
                    </div>
                    {errors.phone && <p className={presets.error}>{errors.phone.message}</p>}
                </div>

                <div className="space-y-1">
                    <label htmlFor="email" className={presets.label}>Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                        </div>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            autoComplete="email"
                            placeholder="Optional email"
                            className={`${presets.input} ${errors.email ? 'border-red-500 ring-2 ring-red-500/10' : ''}`}
                        />
                    </div>
                    {errors.email && <p className={presets.error}>{errors.email.message}</p>}
                </div>

                <div className="pt-6 pb-2">
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
                </div>

                <button type="submit" disabled={!hasConsented || !isValid} className={presets.button}>
                    <span>{submitLabel || 'Submit'}</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
            </form>

            <div className="mt-10 border-t border-slate-50 pt-4 flex items-center justify-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Powered by <span className="text-primary font-black">VemTap</span>
                </p>
            </div>
        </motion.div>
    );
};
