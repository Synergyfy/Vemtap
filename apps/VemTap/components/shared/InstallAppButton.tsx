"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            if (window.matchMedia("(display-mode: standalone)").matches) {
                return; // Already installed
            }
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handler);
        
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt || isInstalling) return;

        setIsInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
        setIsInstalling(false);
    };

    if (!deferredPrompt) {
        return null;
    }

    return (
        <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-all text-sm shadow-sm disabled:opacity-50"
        >
            <Download size={16} className={isInstalling ? "animate-pulse" : ""} />
            {isInstalling ? "Installing..." : "Install App"}
        </button>
    );
}
