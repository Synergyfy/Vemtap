'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Mail, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerRegisterRequestOtp, useCustomerResendRegistrationOtp, useCustomerRegisterVerifyAndSetPin } from '@/services/auth/hooks';

interface PinSetupModalProps {
  isOpen: boolean;
  email?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type View = 'request' | 'verify' | 'success';

export default function PinSetupModal({ isOpen, email, onClose, onSuccess }: PinSetupModalProps) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [view, setView] = useState<View>('request');
  const [emailValue, setEmailValue] = useState(email || '');
  const [otpCode, setOtpCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { requestOtp } = useCustomerRegisterRequestOtp();
  const { resendOtp } = useCustomerResendRegistrationOtp();
  const { verifyAndSetPin } = useCustomerRegisterVerifyAndSetPin();
  const resendDisabled = resendTimer > 0;

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      setEmailValue(email || '');
      setView(email ? 'verify' : 'request');
      setOtpCode('');
      setPin('');
      setConfirmPin('');
      setError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, email]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailValue.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOtp({ email: emailValue.trim() });
      setView('verify');
      setOtpCode('');
      setResendTimer(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Verification code must be exactly 6 digits');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await verifyAndSetPin({
        email: emailValue.trim(),
        code: otpCode.trim(),
        pin,
      });

      if (response?.user && response?.access_token) {
        await login(response.user, response.access_token);
      }
      setView('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendDisabled) return;
    setError(null);
    setResendLoading(true);
    try {
      await resendOtp({ email: emailValue.trim() });
      setResendTimer(60);
      setOtpCode('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification code. Please try again.';
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleDone = () => {
    onClose();
    if (onSuccess) onSuccess();
    router.push('/customer/dashboard');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[180] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white pt-3 pb-2 px-6 z-10 border-b border-gray-100">
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {view !== 'request' && view !== 'success' && (
                    <button
                      onClick={() => { setView('request'); setError(null); }}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <h3 className="font-bold text-gray-900 text-base">
                    {view === 'success' ? 'All Set!' : 'Set Up Your PIN'}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-8 pt-5">
              {view === 'success' ? (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">PIN Set Successfully!</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Your security PIN is ready. Use your email and 6-digit PIN to sign in next time.
                    </p>
                  </div>
                  <button
                    onClick={handleDone}
                    className="w-full py-3 bg-[#0055c4] text-white font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : view === 'request' ? (
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div className="text-center mb-2">
                    <Shield className="mx-auto mb-3 text-[#0055c4]" size={32} />
                    <p className="text-sm text-gray-500">
                      You need to set a 6-digit security PIN before you can access your account.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      We&apos;ll send a verification code to your email to confirm it&apos;s you.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => { setEmailValue(e.target.value); setError(null); }}
                      placeholder="Email Address"
                      required
                      className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !emailValue.trim()}
                    className="w-full h-12 bg-[#0055c4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyAndSetPin} className="space-y-4">
                  <div className="text-center mb-2">
                    <Mail className="mx-auto mb-3 text-[#0055c4]" size={32} />
                    <p className="text-sm text-gray-500">
                      We sent a verification code to{' '}
                      <span className="font-semibold text-gray-900">{emailValue.trim()}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Enter the code below and set your 6-digit PIN.</p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="6-digit PIN"
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                      />
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="Confirm PIN"
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length < 6 || pin.length < 6 || confirmPin.length < 6}
                    className="w-full h-12 bg-[#0055c4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Verify & Set PIN'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendDisabled || resendLoading}
                    className="w-full text-center text-sm text-[#0055c4] font-semibold hover:underline disabled:text-gray-400 disabled:hover:no-underline"
                  >
                    {resendLoading
                      ? 'Resending...'
                      : resendDisabled
                        ? `Resend code in ${resendTimer}s`
                        : 'Resend code'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}