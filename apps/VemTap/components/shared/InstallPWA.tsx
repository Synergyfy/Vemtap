"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const pathname = usePathname();
    const isLandingPage = pathname === "/";

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Don't show immediately, wait a bit
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setShowPrompt(false);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    // Auto-close after 3 minutes
    useEffect(() => {
        if (showPrompt) {
            const timer = setTimeout(() => {
                setShowPrompt(false);
            }, 180000); // 3 minutes
            return () => clearTimeout(timer);
        }
    }, [showPrompt]);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleClose = () => {
        setShowPrompt(false);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {isLandingPage ? (
                        /* Banner for Landing Page */
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            className="fixed top-0 left-0 right-0 z-[100] px-4 pt-4 md:px-8"
                        >
                            <div className="mx-auto max-w-7xl glass-morphism rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-primary/20 my-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <Smartphone className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-lg text-text-main">Install VemTap App</h3>
                                        <p className="text-sm text-text-secondary">Get the best experience with our desktop and mobile app.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={handleInstall}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        Install Now
                                    </button>
                                    <button
                                        onClick={handleClose}
                                        className="p-2.5 text-text-secondary hover:bg-black/5 rounded-xl transition-all"
                                        aria-label="Close"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Creative Modal for Other Pages */
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed bottom-6 right-6 z-[100] max-w-[320px] glass-morphism rounded-3xl p-6 shadow-2xl border-primary/20 overflow-hidden"
                        >
                            {/* Decorative background element */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">
                                        <Smartphone className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 text-text-secondary hover:bg-black/5 rounded-full transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <h3 className="font-display font-bold text-xl text-text-main mb-2">VemTap on your Home Screen</h3>
                                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                                    Fast, reliable, and always ready. Install our app for a seamless engagement experience.
                                </p>

                                <button
                                    onClick={handleInstall}
                                    className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98]"
                                >
                                    <Download className="w-5 h-5" />
                                    Add to Home Screen
                                </button>

                                <p className="text-[10px] text-center text-text-secondary mt-4 uppercase tracking-widest font-bold opacity-50">
                                    Secure & Lightweight
                                </p>
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
