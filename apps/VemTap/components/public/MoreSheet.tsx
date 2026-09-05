'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, CreditCard, LogIn, UserPlus, HelpCircle, FileText, Shield } from 'lucide-react';

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const items = [
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'Sign In', href: '/login', icon: LogIn },
  { label: 'Sign Up', href: '/get-started', icon: UserPlus },
  { label: 'Help Center', href: '#', icon: HelpCircle },
  { label: 'Terms of Service', href: '#', icon: FileText },
  { label: 'Privacy Policy', href: '#', icon: Shield },
];

export default function MoreSheet({ isOpen, onClose }: MoreSheetProps) {
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

  return (
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
            className="w-full bg-white rounded-t-3xl shadow-2xl"
          >
            <div className="sticky top-0 bg-white pt-3 pb-2 px-6 z-10">
              <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base">More</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="px-6 pb-8 pt-2">
              <div className="space-y-1">
                {items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <item.icon size={20} className="text-gray-600" />
                    </div>
                    <span className="text-[15px] font-medium text-gray-900">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
