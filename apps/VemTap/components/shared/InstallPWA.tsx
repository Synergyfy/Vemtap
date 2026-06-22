"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Zap, Shield, Wifi } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTO_HIDE_MS = 12000; // 12 seconds

const FEATURES = [
    { icon: Zap, label: "Instant Access" },
    { icon: Shield, label: "Works Offline" },
    { icon: Wifi, label: "Push Alerts" },
];

export default function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        timerRef.current = setTimeout(() => {
            setShowPrompt(false);
        }, AUTO_HIDE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [showPrompt]);

    useEffect(() => {
        document.documentElement.style.setProperty("--pwa-banner-offset", showPrompt ? "0px" : "0px");

        return () => {
            document.documentElement.style.setProperty("--pwa-banner-offset", "0px");
        };
    }, [showPrompt]);

    const handleInstall = async () => {
        if (!deferredPrompt || isInstalling) {
            return;
        }

        setIsInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setShowPrompt(false);
            window.localStorage.removeItem(DISMISS_KEY);
        }
        setIsInstalling(false);
    };

    const handleClose = () => {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setShowPrompt(false);
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* Backdrop overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[59] bg-black/20 backdrop-blur-[2px]"
                        onClick={handleClose}
                    />

                    {/* Floating bottom-sheet prompt */}
                    <motion.div
                        initial={{ y: 80, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 80, opacity: 0, scale: 0.95 }}
                        transition={{
                            type: "spring",
                            damping: 28,
                            stiffness: 340,
                            mass: 0.8,
                        }}
                        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-[420px] z-[60]"
                    >
                        {/* Outer glow wrapper */}
                        <div className="relative">
                            {/* Animated gradient border */}
                            <div
                                className="absolute -inset-[1px] rounded-2xl opacity-60"
                                style={{
                                    background: "linear-gradient(135deg, #2563eb, #60a5fa, #818cf8, #2563eb)",
                                    backgroundSize: "300% 300%",
                                    animation: "pwa-gradient-shift 4s ease infinite",
                                }}
                            />

                            {/* Main card */}
                            <div
                                className="relative rounded-2xl overflow-hidden"
                                style={{
                                    background: "rgba(255, 255, 255, 0.92)",
                                    backdropFilter: "blur(24px)",
                                    WebkitBackdropFilter: "blur(24px)",
                                    boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.15), 0 0 40px -8px rgba(37, 99, 235, 0.12)",
                                }}
                            >
                                {/* Auto-dismiss progress bar */}
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-100/60 overflow-hidden">
                                    <motion.div
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        transition={{ duration: AUTO_HIDE_MS / 1000, ease: "linear" }}
                                        className="h-full"
                                        style={{
                                            background: "linear-gradient(90deg, #2563eb, #60a5fa)",
                                        }}
                                    />
                                </div>

                                {/* Close button */}
                                <button
                                    onClick={handleClose}
                                    className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-all duration-200 z-10"
                                    aria-label="Dismiss install prompt"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Content */}
                                <div className="px-5 pt-5 pb-4">
                                    {/* Header with logo */}
                                    <div className="flex items-center gap-3.5 mb-4">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{
                                                type: "spring",
                                                damping: 14,
                                                stiffness: 200,
                                                delay: 0.15,
                                            }}
                                            className="relative flex-shrink-0"
                                        >
                                            <div
                                                className="w-14 h-14 rounded-[16px] flex items-center justify-center overflow-hidden"
                                                style={{
                                                    background: "linear-gradient(145deg, #f0f5ff 0%, #dbeafe 100%)",
                                                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                                                }}
                                            >
                                                <Image
                                                    src="/VEMTAP_PNG.png"
                                                    alt="VemTap"
                                                    width={40}
                                                    height={40}
                                                    className="object-contain"
                                                />
                                            </div>
                                            {/* Live indicator dot */}
                                            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white" />
                                            </span>
                                        </motion.div>

                                        <div className="min-w-0">
                                            <motion.h3
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.2, duration: 0.3 }}
                                                className="font-display font-bold text-[17px] text-gray-900 tracking-tight leading-tight"
                                            >
                                                Get the VemTap App
                                            </motion.h3>
                                            <motion.p
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.28, duration: 0.3 }}
                                                className="text-[13px] text-gray-500 mt-0.5 leading-snug"
                                            >
                                                Install for a faster, native-like experience
                                            </motion.p>
                                        </div>
                                    </div>

                                    {/* Feature pills */}
                                    <div className="flex items-center gap-2 mb-5">
                                        {FEATURES.map((feat, i) => (
                                            <motion.div
                                                key={feat.label}
                                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{
                                                    delay: 0.35 + i * 0.08,
                                                    type: "spring",
                                                    damping: 20,
                                                    stiffness: 300,
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-primary bg-primary/[0.06] border border-primary/[0.08]"
                                            >
                                                <feat.icon className="w-3.5 h-3.5 text-primary/70" />
                                                {feat.label}
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2.5">
                                        <motion.button
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5, duration: 0.3 }}
                                            onClick={handleInstall}
                                            disabled={isInstalling}
                                            className="relative flex-1 group overflow-hidden px-5 py-2.5 rounded-xl font-semibold text-[14px] text-white transition-all duration-300 disabled:opacity-70"
                                            style={{
                                                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)",
                                                boxShadow: "0 4px 14px -2px rgba(37, 99, 235, 0.4), 0 1px 3px rgba(37, 99, 235, 0.2)",
                                            }}
                                            whileHover={{ scale: 1.02, y: -1 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Shimmer effect */}
                                            <span
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                style={{
                                                    background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                                                    backgroundSize: "200% 100%",
                                                    animation: "pwa-shimmer 1.5s ease-in-out infinite",
                                                }}
                                            />
                                            <span className="relative flex items-center justify-center gap-2">
                                                <Download className="w-4 h-4" />
                                                {isInstalling ? "Installing…" : "Install App"}
                                            </span>
                                        </motion.button>

                                        <motion.button
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.55, duration: 0.3 }}
                                            onClick={handleClose}
                                            className="px-4 py-2.5 rounded-xl font-medium text-[14px] text-gray-500 hover:text-gray-700 hover:bg-gray-100/70 transition-all duration-200"
                                        >
                                            Not now
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Keyframe styles */}
            <style jsx global>{`
                @keyframes pwa-gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes pwa-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </AnimatePresence>
    );
}
