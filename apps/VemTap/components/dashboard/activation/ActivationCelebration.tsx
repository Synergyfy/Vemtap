'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    CheckCircle2, Sparkles, Building, QrCode, 
    Download, Users, Megaphone, ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface ActivationCelebrationProps {
    onFinish: () => void;
}

export default function ActivationCelebration({ onFinish }: ActivationCelebrationProps) {
    useEffect(() => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const achievements = [
        { icon: Building, label: 'Profile Complete' },
        { icon: QrCode, label: 'QR Generated' },
        { icon: Download, label: 'Assets Ready' },
        { icon: Users, label: 'Growth Started' },
        { icon: Megaphone, label: 'Campaign Sent' },
    ];

    return (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white px-6">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="text-center"
            >
                <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-[40px] bg-emerald-50 text-emerald-500 shadow-2xl shadow-emerald-500/10">
                    <CheckCircle2 size={64} />
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-4 -top-4 text-emerald-400"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                </div>

                <h1 className="mb-4 text-4xl font-black leading-tight text-gray-900 md:text-5xl">
                    🎉 You're Ready To Grow
                </h1>
                <p className="mx-auto mb-12 max-w-sm text-lg font-medium text-gray-500">
                    Your business is fully activated and ready to capture your first customer.
                </p>

                <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-5">
                    {achievements.map((item, index) => (
                        <motion.div 
                            key={item.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + (index * 0.1) }}
                            className="flex flex-col items-center gap-2 rounded-3xl bg-gray-50 p-4"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm">
                                <item.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={onFinish}
                        className="h-16 w-full rounded-2xl bg-[#066CF4] px-12 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        Go To Dashboard
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                    <button 
                        onClick={onFinish}
                        className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
