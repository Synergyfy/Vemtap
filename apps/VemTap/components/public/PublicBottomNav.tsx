'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'home', label: 'HOME', href: '/' },
  { icon: 'local_offer', label: 'DEALS', href: '/deals' },
  { icon: 'bookmark', label: 'SAVED', href: '/saved' },
  { icon: 'person', label: 'ACCOUNT', href: '/login' },
];

export default function PublicBottomNav() {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 flex justify-around items-center px-4 h-[56px] bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] rounded-t-xl border-t border-[#e0e3e5]">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center active:scale-95 transition-transform duration-150 ${
              active ? 'text-[#0055c4] font-bold' : 'text-[#727786] hover:text-[#0055c4]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[11px] font-medium tracking-tight mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
