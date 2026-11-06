'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import PinSetupModal from '@/components/auth/PinSetupModal';
import RegisterChoiceModal from '@/components/public/RegisterChoiceModal';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { getFirstPermittedDashboardRoute } from '@/lib/utils/nav-filter';

interface OnboardingAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROMPT_SEEN_KEY = 'vemtap_auth_prompt_seen';
const SNOOZE_KEY = 'vemtap_auth_prompt_snoozed';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isPhone = (v: string) => /^[\+\d][\d\s\-\(\)]{7,20}$/.test(v.trim());
const isValidIdentifier = (v: string) => isEmail(v) || isPhone(v);

const getErrorMessage = (err: unknown, fallback: string): string =>
    err instanceof Error && err.message ? err.message : fallback;

export default function OnboardingAuthModal({ isOpen, onClose }: OnboardingAuthModalProps) {
  const router = useRouter();
  const { login } = useAuthStore();

  const [view, setView] = useState<'choice' | 'email'>('choice');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [pendingLogin, setPendingLogin] = useState<{ identifier: string; password: string } | null>(null);
  const [pinSetup, setPinSetup] = useState<{ open: boolean; email: string }>({ open: false, email: '' });
  const [showRegister, setShowRegister] = useState(false);
  const showRegisterRef = useRef(false);
  useEffect(() => {
    showRegisterRef.current = showRegister;
  }, [showRegister]);

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
      setView('choice');
      setFormData({ email: '', password: '' });
      setFieldErrors({});
      setError(null);
      setShowPassword(false);
      setRequires2FA(false);
      setTwoFACode('');
      setPendingLogin(null);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !showRegisterRef.current) handleSnooze();
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

  const routeAfterLogin = (role: string, businessId?: string, isNewUser?: boolean, permissions: string[] = []) => {
    const normalizedRole = role?.toLowerCase();
    const landing = getFirstPermittedDashboardRoute(normalizedRole, permissions);
    if (normalizedRole === 'admin') {
      router.push('/admin');
    } else if (normalizedRole === 'owner' && (!businessId || isNewUser)) {
      router.push('/onboarding');
    } else if (businessId && (normalizedRole === 'owner' || normalizedRole === 'manager' || normalizedRole === 'staff')) {
      router.push(landing ?? '/dashboard');
    } else if (normalizedRole === 'customer') {
      router.push('/customer/dashboard');
    } else {
      router.push(landing ?? '/dashboard');
    }
  };

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmed = formData.email.trim();

    if (!trimmed) {
      errors.email = 'Email or phone number is required';
    } else if (!isValidIdentifier(trimmed)) {
      errors.email = 'Enter a valid email address or phone number';
    }

    if (!formData.password) {
      errors.password = 'Password or PIN is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        identifier: formData.email.trim(),
        password: formData.password,
      });

      if (response?.requiresPinSetup) {
        setPinSetup({ open: true, email: response?.email || formData.email.trim() });
        setIsSubmitting(false);
        return;
      }

      if (response?.requiresTwoFactor) {
        setRequires2FA(true);
        setPendingLogin({ identifier: formData.email.trim(), password: formData.password });
        setIsSubmitting(false);
        return;
      }

      if (!response?.user || !response?.access_token) {
        setError('Invalid response from server');
        return;
      }

      await login(response.user, response.access_token);
      handleDone();
      routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser, response.user.permissions || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email, phone number or password'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async () => {
    setError(null);
    if (twoFACode.length !== 6 || !pendingLogin) return;
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        identifier: pendingLogin.identifier,
        password: pendingLogin.password,
        twoFactorCode: twoFACode,
      });
      if (!response?.user || !response?.access_token) {
        setError('Invalid 2FA code');
        return;
      }
      await login(response.user, response.access_token);
      handleDone();
      routeAfterLogin(response.user.role, response.user.businessId, response.isNewUser, response.user.permissions || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid 2FA code'));
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
    <>
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
                Sign in
              </h2>
              <p className="text-white/80 text-sm mt-1 leading-relaxed">
                Sign in to save deals, claim offers, earn rewards, and get personalized offers near you.
              </p>
            </div>

            <div className="px-6 py-5">
              {view === 'choice' ? (
                <>
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

                  {/* Sign in with email */}
                  <button
                    onClick={() => setView('email')}
                    className="w-full h-12 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail size={18} className="text-[#0055c4]" />
                    Sign in with email
                  </button>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => setShowRegister(true)}
                      className="text-[#0055c4] font-bold hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center">
                    <button
                      onClick={handleSnooze}
                      className="text-[12px] font-semibold text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Maybe later
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setView('choice')}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#0055c4] mb-4 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2"
                    >
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-600">{error}</p>
                    </motion.div>
                  )}

                  {requires2FA ? (
                    <div className="space-y-3">
                      <div className="text-center mb-2">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                          <ShieldCheck size={24} className="text-primary" />
                        </div>
                        <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-xs text-gray-400 mt-1">Enter the 6-digit code from your authenticator app</p>
                      </div>
                      <input
                        type="text"
                        value={twoFACode}
                        onChange={(e) => {
                          setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6));
                          if (error) setError(null);
                        }}
                        placeholder="000000"
                        autoFocus
                        className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl outline-none font-semibold text-lg text-center tracking-[0.4em] focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                      />
                      <button
                        type="button"
                        disabled={isSubmitting || twoFACode.length !== 6}
                        onClick={handle2FASubmit}
                        className="w-full h-12 bg-[#066CF4] text-white font-bold uppercase tracking-wider text-[11px] rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Verify Code'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRequires2FA(false); setTwoFACode(''); setPendingLogin(null); setError(null); }}
                        className="w-full text-sm font-semibold text-gray-400 hover:text-[#066CF4] transition-colors cursor-pointer"
                      >
                        Back to login
                      </button>
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleEmailLogin} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-text-secondary">Email or Phone Number</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              value={formData.email}
                              onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                                if (error) setError(null);
                              }}
                              placeholder="name@business.com or +2348012345678"
                              autoFocus
                              className={cn(
                                "w-full pl-10 pr-3 h-12 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-normal text-text-main transition-all placeholder:text-gray-400 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10",
                                fieldErrors.email && "border-red-300 focus:border-red-300 focus:ring-4 focus:ring-red-100"
                              )}
                            />
                          </div>
                          {fieldErrors.email && (
                            <p className="text-xs font-medium text-red-500 flex items-center gap-1.5">
                              <AlertCircle size={12} />
                              {fieldErrors.email}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-text-secondary">Password or PIN</label>
                            <Link href="/forgot-pin" title="reset pin" className="text-xs font-semibold text-primary hover:underline">
                              Forgot Password?
                            </Link>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                                if (error) setError(null);
                              }}
                              placeholder="••••••••"
                              className={cn(
                                "w-full pl-10 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-normal text-text-main transition-all placeholder:text-gray-400 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10",
                                fieldErrors.password && "border-red-300 focus:border-red-300 focus:ring-4 focus:ring-red-100"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          {fieldErrors.password && (
                            <p className="text-xs font-medium text-red-500 flex items-center gap-1.5">
                              <AlertCircle size={12} />
                              {fieldErrors.password}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting || !formData.email || !formData.password}
                          className="w-full h-12 bg-[#066CF4] text-white font-bold uppercase tracking-wider text-[11px] rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            'Login To Dashboard'
                          )}
                        </button>
                      </form>

                      <button
                        onClick={() => setView('choice')}
                        className="mt-3 w-full text-sm font-semibold text-gray-400 hover:text-[#0055c4] transition-colors cursor-pointer"
                      >
                        Back to sign in options
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <PinSetupModal
      isOpen={pinSetup.open}
      email={pinSetup.email}
      onClose={() => setPinSetup({ open: false, email: '' })}
    />

    <RegisterChoiceModal
      isOpen={showRegister}
      onClose={() => setShowRegister(false)}
    />
    </>
  );
}