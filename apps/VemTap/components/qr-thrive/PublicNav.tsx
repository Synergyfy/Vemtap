import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Zap, LayoutGrid, LogOut, Menu, X, ChevronRight } from 'lucide-react';
import { useCurrentUser, useLogout } from '../hooks/useApi';
import { getDashboardPath } from '../utils/auth';
import AuthModal from './AuthModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PublicNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: userData } = useCurrentUser();
  const logoutMutation = useLogout();
  const user = userData?.user;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setIsMenuOpen(false);
      toast.success('Logged out successfully');
      router.push('/');
    } catch (e) {
      console.error('Logout failed', e);
      toast.error('Logout failed. Please try again.');
    }
  };

  const navLinks = [
    { name: 'Why Us', path: '/why-us' },
    { name: 'Solutions', path: '/solutions' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-xl z-[100] border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group cursor-pointer shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-lg shadow-blue-500/20">
                <Zap className="text-white w-6 h-6 fill-yellow-300" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black tracking-tighter text-gray-900">QR Thrive</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-0.5">Marketing</span>
              </div>
            </Link>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-50/50 p-1 rounded-2xl border border-gray-100/50">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  href={link.path} 
                  className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    pathname === link.path 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="relative group">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} // Reusing menu open state for dropdown or adding a new bit
                    onMouseEnter={() => setIsMenuOpen(true)}
                    className="flex items-center gap-3 pl-4 pr-3 py-1.5 bg-white hover:bg-gray-50 rounded-full transition-all border border-gray-100 shadow-sm group"
                  >
                    <div className="flex flex-col items-end -space-y-1">
                      <span className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</span>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{user.role}</span>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                    <div className="p-4 border-b border-gray-50 mb-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Logged in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                    </div>
                    
                    <button 
                      onClick={() => router.push(getDashboardPath(user.role))}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                    >
                      <LayoutGrid size={18} /> My Dashboard
                    </button>
                    
                    <div className="h-px bg-gray-50 my-2" />
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <LogOut size={18} /> Logout Session
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-full transition-all"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setIsAuthModalOpen(true)} 
                    className="px-8 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-all shadow-xl shadow-blue-600/30 active:scale-95 uppercase tracking-widest"
                  >
                    Get Started Free
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-3 bg-gray-50 rounded-2xl text-gray-600 hover:text-blue-600 transition-colors" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Content */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-50 group transition-all"
                    >
                      <span className="font-bold text-gray-700 group-hover:text-blue-600">{link.name}</span>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>

                <div className="pt-4 space-y-3">
                  {user ? (
                    <button 
                      onClick={() => { router.push(getDashboardPath(user.role)); setIsMenuOpen(false); }}
                      className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
                    >
                      <LayoutGrid size={20} /> My Dashboard
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
                      >
                        Create Account
                      </button>
                      <button 
                        onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                        className="w-full p-4 bg-gray-50 text-gray-700 rounded-2xl font-bold border border-gray-100 text-center"
                      >
                        Log In
                      </button>
                    </>
                  )}
                  {user && (
                    <button 
                      onClick={handleLogout}
                      className="w-full p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors"
                    >
                      Logout Session
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {}} 
      />
    </>
  );
}

