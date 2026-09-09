'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Mail, User, Phone, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { signupVisitorAndLogin } from '@/lib/visitorAuth';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface OnboardingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMPT_SEEN_KEY = 'vemtap_auth_prompt_seen';
const SNOOZE_KEY = 'vemtap_auth_prompt_snoozed';

export default function OnboardingAuthModal({ isOpen, onClose }: OnboardingAuthModalProps) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDone = () => {
    try {
      localStorage.setItem(PROMPT_SEEN_KEY, 'true');
    } catch {}
    onClose();
  };

  const handleSnooze = () => {
    try {
      sessionStorage.setItem(SNOOZE_KEY, '1');
    } catch {}
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleSnooze();
      };
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await signupVisitorAndLogin({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });

      if (useAuthStore.getState().isAuthenticated) {
        toast.success('Account created successfully!');
        handleDone();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (res: any) => {
    // After Google auth, send default password to user's email
    if (res.user?.email) {
      try {
        await api.post('/auth/resend-default-password', { identifier: res.user.email });
      } catch {
        // Silently fail — user is already logged in
      }
    }
    handleDone();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
          onClick={handleSnooze}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Accent header */}
            <div className="px-6 pt-4 sm:pt-6 pb-5 bg-gradient-to-br from-[#0055c4] to-[#066CF4] text-white">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Zap size={24} className="text-white" fill="currentColor" />
                </div>
                <button
                  onClick={handleSnooze}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <h2 className="font-black text-xl mt-4">
                Join VemTap
              </h2>
              <p className="text-white/80 text-sm mt-1 leading-relaxed">
                Create an account to save deals, claim offers, earn rewards, and get personalized offers near you.
              </p>
            </div>

            <div className="px-6 py-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Google Auth */}
              <div className="mb-4">
                <GoogleAuthButton role="Customer" onSuccess={handleGoogleSuccess} />
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute w-full h-px bg-gray-200" />
                <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  or
                </span>
              </div>

              {/* Signup Form */}
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="Full Name"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="Email Address"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(null); }}
                    placeholder="Phone Number (optional)"
                    autoComplete="tel"
                    className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !email.trim()}
                  className="w-full h-12 bg-[#0055c4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="text-[#0055c4] hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-[#0055c4] hover:underline">Privacy Policy</Link>
                </p>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={handleSnooze}
                  className="text-[12px] font-semibold text-gray-400 hover:text-gray-600"
                >
                  Maybe later
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="text-[12px] font-semibold text-[#0055c4] hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
