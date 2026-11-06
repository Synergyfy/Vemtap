'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Briefcase, ShoppingBag, ChevronRight, ArrowLeft, Mail, Phone, User, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerRegisterRequestOtp, useCustomerResendRegistrationOtp, useCustomerRegisterVerifyAndSetPin } from '@/services/auth/hooks';

interface RegisterChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'choice' | 'customer-register' | 'customer-otp' | 'customer-success';

export default function RegisterChoiceModal({ isOpen, onClose }: RegisterChoiceModalProps) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [view, setView] = useState<View>('choice');
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', phone: '', email: '', pin: '', confirmPin: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestOtp } = useCustomerRegisterRequestOtp();
  const { resendOtp } = useCustomerResendRegistrationOtp();
  const { verifyAndSetPin } = useCustomerRegisterVerifyAndSetPin();
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const resendDisabled = resendTimer > 0;

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('choice');
        setCustomerForm({ firstName: '', lastName: '', phone: '', email: '', pin: '', confirmPin: '' });
        setError(null);
      }, 0);
      return;
    }
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

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleBusinessRegister = () => {
    onClose();
    router.push('/get-started');
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerForm.firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!customerForm.lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!customerForm.email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send a verification code first
      await requestOtp({
        firstName: customerForm.firstName.trim(),
        lastName: customerForm.lastName.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim() || undefined,
      });
      setView('customer-otp');
      setOtpCode('');
      setResendTimer(60);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerForm.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Verification code must be exactly 6 digits');
      return;
    }
    if (!/^\d{6}$/.test(customerForm.pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }
    if (customerForm.pin !== customerForm.confirmPin) {
      setError('PINs do not match');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await verifyAndSetPin({
        email: customerForm.email.trim(),
        code: otpCode.trim(),
        pin: customerForm.pin,
        firstName: customerForm.firstName.trim(),
        lastName: customerForm.lastName.trim(),
        phone: customerForm.phone.trim() || undefined,
      });

      if (response?.user && response?.access_token) {
        await login(response.user, response.access_token);
      }
      setView('customer-success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCustomerOtp = async () => {
    if (resendDisabled) return;
    setError(null);
    setResendLoading(true);
    try {
      await resendOtp({ email: customerForm.email.trim() });
      setResendTimer(60);
      setOtpCode('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend verification code. Please try again.';
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[160] flex items-end justify-center bg-black/50 backdrop-blur-sm"
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
            {/* Header */}
            <div className="sticky top-0 bg-white pt-3 pb-2 px-6 z-10 border-b border-gray-100">
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {view !== 'choice' && (
                    <button
                      onClick={() => setView('choice')}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <h3 className="font-bold text-gray-900 text-base">
                    {view === 'choice' ? 'Join VemTap' : view === 'customer-register' ? 'Customer Sign Up' : 'Welcome!'}
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
              {/* Choice View */}
              {view === 'choice' && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-gray-500 mb-6">
                    How do you want to use VemTap?
                  </p>

                  {/* Business Option */}
                  <button
                    onClick={handleBusinessRegister}
                    className="w-full p-5 rounded-2xl border-2 border-gray-100 hover:border-[#0055c4]/30 hover:bg-[#0055c4]/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0055c4]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0055c4]/20 transition-colors">
                        <Briefcase size={24} className="text-[#0055c4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">Register as a Business</h4>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-[#0055c4] transition-colors" />
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          Create amazing deals to sell your products and services. Manage your customers, track analytics, and grow your business with powerful marketing tools.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {['Deal Creation', 'Customer CRM', 'Analytics', 'POS System'].map((f) => (
                            <span key={f} className="px-2.5 py-1 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Customer Option */}
                  <button
                    onClick={() => setView('customer-register')}
                    className="w-full p-5 rounded-2xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <ShoppingBag size={24} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">Register as a Customer</h4>
                          <ChevronRight size={18} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                          Discover amazing deals and offers around you. Save your favorite deals, earn rewards, and get exclusive discounts from local businesses.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {['Discover Deals', 'Save Favorites', 'Earn Rewards', 'Exclusive Offers'].map((f) => (
                            <span key={f} className="px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-center text-sm text-gray-500">
                      Already have an account?{' '}
                      <button
                        onClick={onClose}
                        className="text-[#0055c4] font-bold hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Register View */}
              {view === 'customer-register' && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-sm text-gray-500">
                      Get started in seconds! We&apos;ll verify your email and let you set a secure 6-digit PIN.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleCustomerRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={customerForm.firstName}
                          onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                          placeholder="First Name"
                          required
                          className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                      </div>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          value={customerForm.lastName}
                          onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                          placeholder="Last Name"
                          required
                          className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        placeholder="Email Address"
                        required
                        className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        placeholder="Phone Number (optional)"
                        className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !customerForm.firstName.trim() || !customerForm.lastName.trim() || !customerForm.email.trim()}
                      className="w-full h-12 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>

                  <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                    By signing up, you agree to our{' '}
                    <a href="#" className="text-[#0055c4] hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#0055c4] hover:underline">Privacy Policy</a>
                  </p>
                </div>
              )}

              {/* Customer OTP View */}
              {view === 'customer-otp' && (
                <form onSubmit={handleCustomerVerifyOtp} className="space-y-4">
                  <div className="text-center mb-2">
                    <Mail className="mx-auto mb-3 text-emerald-600" size={32} />
                    <p className="text-sm text-gray-500">
                      We sent a verification code to{' '}
                      <span className="font-semibold text-gray-900">{customerForm.email.trim()}</span>
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
                      placeholder="Enter 6-digit OTP code"
                      className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest font-mono text-sm-2 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={customerForm.pin}
                        onChange={(e) => setCustomerForm({ ...customerForm, pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                        placeholder="Create 6-digit PIN"
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="new-password"
                        value={customerForm.confirmPin}
                        onChange={(e) => setCustomerForm({ ...customerForm, confirmPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                        placeholder="Confirm PIN"
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-widest font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 6 || customerForm.pin.length < 6 || customerForm.confirmPin.length < 6}
                    className="w-full h-12 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      'Verify & Set PIN'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCustomerOtp}
                    disabled={resendDisabled || resendLoading}
                    className="w-full text-center text-sm text-emerald-600 font-semibold hover:underline disabled:text-gray-400 disabled:hover:no-underline"
                  >
                    {resendLoading
                      ? 'Resending...'
                      : resendDisabled
                        ? `Resend code in ${resendTimer}s`
                        : 'Resend code'}
                  </button>
                </form>
              )}

              {/* Customer Success View */}
              {view === 'customer-success' && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">You&apos;re All Set!</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Your account has been created with your new security PIN. Here&apos;s how to get started:
                    </p>
                  </div>

                  <div className="text-left space-y-3 py-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-[#0055c4] text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Explore Deals Near You</p>
                        <p className="text-xs text-gray-500">Browse deals from businesses in your area on the Deals page.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-[#0055c4] text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Claim or Buy Products</p>
                        <p className="text-xs text-gray-500">Click on any deal to claim offers or purchase products/services directly.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-[#0055c4] text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Save Your Favorites</p>
                        <p className="text-xs text-gray-500">Bookmark deals to check or claim later from your Saved Deals tab.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { onClose(); router.push('/deals'); }}
                    className="w-full py-3 bg-[#0055c4] text-white font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all"
                  >
                    Start Exploring Deals
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
