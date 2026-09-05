'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Menu"
        className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[#0055c4] text-[24px]">menu</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[200]"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-80 bg-white z-[201] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                <img src="/VEMTAP_PNG.png" alt="VemTap" className="h-10 w-auto" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-gray-500 text-[20px]">close</span>
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
              {[
                { icon: 'home', label: 'Home', href: '/' },
                { icon: 'local_offer', label: 'Deals', href: '/deals' },
                { icon: 'bookmark', label: 'Saved', href: '/saved' },
                { icon: 'payments', label: 'Pricing', href: '/pricing' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-gray-500 text-[22px]">{item.icon}</span>
                  <span className="text-[14px] font-medium text-gray-700">{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 pb-6 space-y-2">
              <Link
                href="/get-started"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-3 rounded-xl bg-[#0055c4] text-white font-bold text-[13px] uppercase tracking-wider hover:bg-[#004bb5] transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-[13px] uppercase tracking-wider hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
