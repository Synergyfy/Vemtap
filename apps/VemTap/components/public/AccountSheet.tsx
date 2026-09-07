'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, Eye, EyeOff, User, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import RegisterChoiceModal from './RegisterChoiceModal';

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const helpLinks = [
  { label: 'Help Center', href: '/help', icon: 'help' },
  { label: 'Terms of Service', href: '/terms', icon: 'description' },
  { label: 'Privacy Policy', href: '/privacy', icon: 'shield' },
];

export default function AccountSheet({ isOpen, onClose }: AccountSheetProps) {
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter email and password');
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await api.post('/auth/login', {
        identifier: email.trim(),
        password,
      });
      if (!response?.user || !response?.access_token) {
        setError('Invalid credentials');
        return;
      }
      await login(response.user, response.access_token);
      onClose();
      const role = response.user.role?.toLowerCase();
      if (role === 'admin') router.push('/admin');
      else if (role === 'owner') router.push('/dashboard');
      else if (role === 'customer') router.push('/customer/dashboard');
      else router.push('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white pt-3 pb-2 px-6 z-10 border-b border-gray-100">
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-base">
                    {isAuthenticated ? 'Account' : 'Welcome'}
                  </h3>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="px-6 pb-8 pt-4">
                {/* ─── Authenticated State ─── */}
                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50">
                      <div className="w-12 h-12 rounded-full bg-[#0055c4] flex items-center justify-center text-white font-bold text-lg">
                        {user.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{user.name || 'User'}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {helpLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[22px] text-gray-400">{item.icon}</span>
                          <span className="flex-1 text-[15px] font-medium text-gray-900">{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                ) : showLogin ? (
                  /* ─── Login Form ─── */
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="w-14 h-14 bg-[#0055c4]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <User size={28} className="text-[#0055c4]" />
                      </div>
                      <h3 className="font-bold text-gray-900">Sign In</h3>
                      <p className="text-sm text-gray-500 mt-1">Access your account to manage deals</p>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-3">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(null); }}
                          placeholder="Email address"
                          className="w-full pl-10 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(null); }}
                          placeholder="Password"
                          className="w-full pl-10 pr-10 h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0055c4]/20 focus:border-[#0055c4]/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full h-12 bg-[#0055c4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoggingIn ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Sign In'
                        )}
                      </button>
                    </form>

                    <Link
                      href="/forgot-password"
                      className="block text-center text-xs font-semibold text-[#0055c4] hover:underline"
                    >
                      Forgot password?
                    </Link>

                    <div className="relative flex items-center justify-center my-2">
                      <div className="absolute w-full h-px bg-gray-200" />
                      <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-gray-400">or</span>
                    </div>

                    <p className="text-center text-sm text-gray-500">
                      Don&apos;t have an account?{' '}
                      <button
                        onClick={() => { setShowLogin(false); setShowRegister(true); }}
                        className="text-[#0055c4] font-bold hover:underline"
                      >
                        Create Account
                      </button>
                    </p>

                    <button
                      onClick={() => setShowLogin(false)}
                      className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
                    >
                      Back to menu
                    </button>
                  </div>
                ) : (
                  /* ─── Unauthenticated State ─── */
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0055c4] to-[#066CF4] text-white text-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                        <Zap size={28} className="text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">Discover Amazing Deals</h3>
                      <p className="text-white/80 text-sm mb-4">Sign in to save deals, track rewards, and get personalized offers near you.</p>
                      <button
                        onClick={() => setShowLogin(true)}
                        className="w-full py-3 bg-white text-[#0055c4] font-bold text-sm rounded-xl shadow-lg active:scale-95 transition-all"
                      >
                        Sign In
                      </button>
                    </div>

                    {/* Create Account CTA — right after Sign In */}
                    <p className="text-center text-sm text-gray-500">
                      Don&apos;t have an account?{' '}
                      <button
                        onClick={() => setShowRegister(true)}
                        className="text-[#0055c4] font-bold hover:underline"
                      >
                        Create Account
                      </button>
                    </p>

                    {/* Help Links */}
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      {helpLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98]"
                        >
                          <span className="material-symbols-outlined text-[22px] text-gray-400">{item.icon}</span>
                          <span className="flex-1 text-[15px] font-medium text-gray-900">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RegisterChoiceModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </>
  );
}
