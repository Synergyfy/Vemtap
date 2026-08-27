'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Zap, Shield, Wifi, Share, Check } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallContextType {
  openPrompt: () => void;
  canInstall: boolean;
  isInstalled: boolean;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within PwaInstallProvider');
  return ctx;
}

// Alias for backwards-compat with any code using usePWA
export const usePWA = usePwaInstall;

const DISMISS_KEY = 'pwa-install-dismissed-at';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_SHOWN_KEY = 'pwa-install-session-shown';
const APP_NAME = 'Vemtap';
const AUTO_SHOW_DELAY = 1200;
const AUTO_HIDE_DELAY = 12000;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently() {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(DISMISS_KEY);
  if (!stored) return false;
  return Date.now() - Number(stored) < COOLDOWN_MS;
}

function wasShownThisSession() {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_SHOWN_KEY) === 'true';
}

const FEATURES = [
  { icon: Zap, label: 'Instant Access' },
  { icon: Shield, label: 'Works Offline' },
  { icon: Wifi, label: 'Push Alerts' },
];

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

const IOS_STEPS = [
  "Tap the Share button in Safari's toolbar.",
  'Scroll down and choose "Add to Home Screen".',
  'Tap "Add" in the top-right corner.',
];

export default function PwaInstallProvider({ children }: { children: ReactNode }) {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasDeferred, setHasDeferred] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detect iOS and standalone state after mount
  useEffect(() => {
    setIsIos(isIOS());
    setIsInstalled(isStandalone());

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', checkStandalone);

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setHasDeferred(false);
    };
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      mediaQuery.removeEventListener('change', checkStandalone);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  // Capture the beforeinstallprompt event (Chrome/Edge/Android)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setHasDeferred(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Auto-show once per session after a short delay
  useEffect(() => {
    if (!hasDeferred && !isIos) return;
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;
    if (wasShownThisSession()) return;

    const t = setTimeout(() => {
      try { sessionStorage.setItem(SESSION_SHOWN_KEY, 'true'); } catch { /* ignore */ }
      setOpenCount((c) => c + 1);
      setIsOpen(true);
    }, AUTO_SHOW_DELAY);

    return () => clearTimeout(t);
  }, [hasDeferred, isIos]);

  const dismiss = useCallback((persist = true) => {
    setIsOpen(false);
    setShowIosHelp(false);
    if (persist) {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    }
  }, []);

  // Auto-hide after AUTO_HIDE_DELAY ms (paused if user is viewing iOS instructions)
  useEffect(() => {
    if (!isOpen || showIosHelp) return;
    const t = setTimeout(() => dismiss(true), AUTO_HIDE_DELAY);
    return () => clearTimeout(t);
  }, [isOpen, showIosHelp, openCount, dismiss]);

  // Keyboard accessibility: dismiss on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dismiss]);

  const openPrompt = useCallback(() => {
    setShowIosHelp(false);
    setOpenCount((c) => c + 1);
    setIsOpen(true);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) {
      if (isIos) {
        setShowIosHelp(true);
        return;
      }
      toast('Open your browser menu and choose "Add to Home Screen" to install Vemtap.', {
        icon: '📱',
        duration: 4000,
      });
      dismiss(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPrompt.current = null;
    setHasDeferred(false);
    if (choice.outcome === 'accepted') {
      try { localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
      dismiss(false);
      toast.success('Vemtap installed. Enjoy the native experience!');
    } else {
      dismiss(true);
    }
  };

  const contextValue = useMemo(() => ({
    openPrompt,
    canInstall: !isInstalled,
    isInstalled,
  }), [openPrompt, isInstalled]);

  return (
    <PwaInstallContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="pwa-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              onClick={() => dismiss(true)}
              className="fixed inset-0 z-[490] bg-black/40 backdrop-blur-sm pointer-events-auto"
            />

            {/* Card */}
            <motion.div
              key="pwa-sheet"
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95, transition: { duration: 0.25, ease: 'easeIn' } }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Install ${APP_NAME} app`}
              className="fixed z-[500] bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-[420px] max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Animated gradient border */}
              <div
                className="p-[1px] rounded-2xl"
                style={{
                  background: 'linear-gradient(90deg, #2563eb, #60a5fa, #818cf8, #2563eb)',
                  backgroundSize: '300% 100%',
                  animation: 'pwa-gradient-shift 4s ease infinite',
                }}
              >
                {/* Inner card */}
                <div className="relative bg-white/[0.96] backdrop-blur-[24px] rounded-[15px] shadow-xl shadow-slate-900/10 overflow-hidden">
                  {/* Auto-dismiss progress bar */}
                  <div key={openCount} className="absolute top-0 left-0 right-0 h-0.5 z-10 overflow-hidden">
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: AUTO_HIDE_DELAY / 1000, ease: 'linear' }}
                      className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-400"
                    />
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => dismiss(true)}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="p-5 pt-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 pr-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.15 }}
                        className="relative shrink-0"
                      >
                        <div
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm flex items-center justify-center overflow-hidden"
                          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(37,99,235,0.15)' }}
                        >
                          <Image
                            src="/VEMTAP_PNG.png"
                            alt={APP_NAME}
                            width={40}
                            height={40}
                            className="w-9 h-9 object-contain"
                          />
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white" />
                        </span>
                      </motion.div>

                      <div className="min-w-0">
                        <motion.h3
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="text-[17px] font-bold text-slate-900 leading-tight"
                        >
                          Get the {APP_NAME} App
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.28, duration: 0.3 }}
                          className="text-[13px] text-slate-500 font-medium mt-0.5"
                        >
                          Install for a faster, native-like experience
                        </motion.p>
                      </div>
                    </div>

                    {/* Feature pills */}
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
                      }}
                      className="flex flex-wrap gap-2 mt-4"
                    >
                      {FEATURES.map((f) => (
                        <motion.span
                          key={f.label}
                          variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/5 border border-blue-600/10 text-blue-700 text-[11px] font-bold"
                        >
                          <f.icon className="w-3.5 h-3.5 text-blue-600/70" />
                          {f.label}
                        </motion.span>
                      ))}
                    </motion.div>

                    {/* iOS step-by-step help */}
                    {showIosHelp ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-5 rounded-2xl bg-blue-600/5 border border-blue-600/10 p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <Share className="w-4 h-4 text-blue-600" />
                          <p className="text-[13px] font-bold text-slate-900">Add to Home Screen</p>
                        </div>
                        <ol className="space-y-2.5">
                          {IOS_STEPS.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-px">
                                {i + 1}
                              </span>
                              <span className="text-[12px] text-slate-600 font-medium leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          onClick={() => dismiss(true)}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white text-sm font-bold shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 active:translate-y-0 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          Got it
                        </motion.button>
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2.5 mt-5">
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                          onClick={handleInstall}
                          className="relative flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white text-sm font-bold shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 active:translate-y-0 transition-all overflow-hidden"
                        >
                          <Download className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">{isIos ? 'How to Install' : 'Install App'}</span>
                        </motion.button>
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.55, duration: 0.3 }}
                          onClick={() => dismiss(true)}
                          className="px-5 py-3 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        >
                          Not now
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pwa-gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </PwaInstallContext.Provider>
  );
}
