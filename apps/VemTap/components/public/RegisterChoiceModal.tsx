'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Briefcase, ShoppingBag, ChevronRight, ArrowLeft, Mail, Phone, User, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

interface RegisterChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'choice' | 'customer-register' | 'customer-success';

export default function RegisterChoiceModal({ isOpen, onClose }: RegisterChoiceModalProps) {
  const router = useRouter();
  const { login } = useAuthStore();
  const [view, setView] = useState<View>('choice');
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('choice');
        setCustomerForm({ name: '', phone: '', email: '', password: '' });
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

  const handleBusinessRegister = () => {
    onClose();
    router.push('/get-started');
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerForm.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!customerForm.email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a random password for the customer
      const randomPass = `Vemtap${Math.random().toString(36).slice(-6)}!`;
      setGeneratedPassword(randomPass);

      const response = await api.post('/auth/register', {
        name: customerForm.name.trim(),
        email: customerForm.email.trim(),
        phone: customerForm.phone.trim() || undefined,
        password: randomPass,
        role: 'Customer',
      });

      if (response?.user && response?.access_token) {
        await login(response.user, response.access_token);
        setView('customer-success');
      } else {
        // If auto-login fails, show instructions
        setView('customer-success');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
                      Get started in seconds! We&apos;ll create your account and send a password to your email.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleCustomerRegister} className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        placeholder="Full Name"
                        required
                        className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
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
                      disabled={isSubmitting || !customerForm.name.trim() || !customerForm.email.trim()}
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

              {/* Customer Success View */}
              {view === 'customer-success' && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">You&apos;re All Set!</h3>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      Your account has been created. Here&apos;s how to get started:
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

                  {generatedPassword && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                      <p className="text-xs font-bold text-amber-800 mb-1">Your Temporary Password</p>
                      <code className="block p-2 bg-white rounded-lg text-sm font-mono text-gray-800 border border-amber-100">
                        {generatedPassword}
                      </code>
                      <p className="text-[11px] text-amber-700 mt-2">
                        Save this password! Go to Settings to change it anytime.
                      </p>
                    </div>
                  )}

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
