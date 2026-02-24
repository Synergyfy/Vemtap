"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTO_HIDE_MS = 12000; // 12 seconds

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            if (window.matchMedia("(display-mode: standalone)").matches) {
                return;
            }

            const dismissedAtRaw = window.localStorage.getItem(DISMISS_KEY);
            const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
            const isDismissedRecently = dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_TTL_MS;

            if (isDismissedRecently) {
                return;
            }

            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            setTimeout(() => {
                setShowPrompt(true);
            }, 1200);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    useEffect(() => {
        if (!showPrompt) {
            return;
        }

        const timer = setTimeout(() => {
            setShowPrompt(false);
        }, AUTO_HIDE_MS);

        return () => clearTimeout(timer);
    }, [showPrompt]);

    useEffect(() => {
        // Keep navbar spacing in sync while the top banner is visible.
        document.documentElement.style.setProperty("--pwa-banner-offset", showPrompt ? "88px" : "0px");

        return () => {
            document.documentElement.style.setProperty("--pwa-banner-offset", "0px");
        };
    }, [showPrompt]);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
            window.localStorage.removeItem(DISMISS_KEY);
        }
    };

    const handleClose = () => {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShowPrompt(false);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="fixed top-0 left-0 right-0 z-[60]"
                >
                    <div className="w-full bg-white border-y border-gray-200 shadow-lg px-4 md:px-8 py-3 md:py-4">
                        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-primary/10 rounded-lg">
                                    <Smartphone className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-base text-text-main">Install VemTap App</h3>
                                    <p className="text-xs md:text-sm text-text-secondary">Add VemTap to your home screen for faster access.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 md:flex-none px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Install
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="p-2 text-text-secondary hover:bg-black/5 rounded-lg transition-all"
                                    aria-label="Dismiss install prompt"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
