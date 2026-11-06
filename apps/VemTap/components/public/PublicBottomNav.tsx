'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AccountSheet from './AccountSheet';

interface NavItem {
  icon: string;
  label: string;
  href?: string;
  onClick?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'home', label: 'Home', href: '/' },
  { icon: 'explore', label: 'Discover', href: '/deals' },
  { icon: 'local_offer', label: 'Deals', href: '/deals' },
  { icon: 'bookmark', label: 'Saved', href: '/saved-deals' },
  { icon: 'person', label: 'Account' },
];

export default function PublicBottomNav() {
  const pathname = usePathname();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isActive = (item: NavItem) => {
    if (item.onClick || !item.href) return false;
    if (item.label === 'Discover') {
      return pathname.startsWith('/b/') || pathname === '/discover';
    }
    if (item.label === 'Deals') {
      return pathname.startsWith('/deals');
    }
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-2 h-16 bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.06)] rounded-t-xl border-t border-[#c2c6d7] pb-[env(safe-area-inset-bottom,0px)]">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);

          if (item.label === 'Account') {
            return (
              <button
                key={item.label}
                onClick={() => setIsAccountOpen(true)}
                className="flex flex-col items-center justify-center text-[#424655] active:scale-95 transition-transform duration-150 hover:text-[#0055c4] cursor-pointer p-1.5"
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={isAuthenticated ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="text-[12px] font-medium tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`flex flex-col items-center justify-center p-1.5 active:scale-95 transition-transform duration-150 ${
                active ? 'text-[#0055c4] font-bold' : 'text-[#424655] hover:text-[#0055c4]'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="text-[12px] font-medium tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AccountSheet isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </>
  );
}
