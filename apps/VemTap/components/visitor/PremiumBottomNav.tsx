'use client';

import React from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Home, Calendar, ShoppingCart, Gift, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useCartSummary } from '@/services/catalogue-cart/hooks';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';

export const PremiumBottomNav = () => {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const { isAuthenticated } = useAuthStore();
    const { branchId } = useCustomerFlowStore();

    const slug = params.slug;
    const code = params.code;

    // Cart count — server for auth users, guest store for others
    const { data: cartSummary } = useCartSummary(isAuthenticated ? branchId : null);
    const guestSummary = useGuestCartStore((s) =>
        branchId ? s.getSummaryForBranch(branchId) : { itemCount: 0, total: 0 }
    );
    const cartCount = isAuthenticated
        ? (cartSummary?.itemCount ?? 0)
        : guestSummary.itemCount;

    const navItems = [
        { id: 'home', icon: Home, label: 'Home', path: `/${slug}/${code}` },
        { id: 'products', icon: ShoppingBag, label: 'Shop', path: `/${slug}/${code}/products` },
        { id: 'services', icon: Calendar, label: 'Book', path: `/${slug}/${code}/services` },
        { id: 'offers', icon: Gift, label: 'Offers', path: `/${slug}/${code}/offers` },
        { id: 'cart', icon: ShoppingCart, label: 'Cart', path: `/${slug}/${code}/cart` },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-3 pt-1.5 bg-surface/80 backdrop-blur-xl rounded-t-3xl border-t border-slate-200 shadow-[0_-15px_30px_rgba(0,74,198,0.05)]">
            {navItems.map((item) => {
                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                const isBadged = item.id === 'cart' && cartCount > 0;
                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={cn(
                            'relative flex flex-col items-center justify-center p-1.5 transition-all duration-300',
                            isActive
                                ? 'bg-primary text-white rounded-full p-3 mb-2 transform -translate-y-2 shadow-lg shadow-primary/20 scale-105'
                                : 'text-slate-400 hover:text-primary'
                        )}
                    >
                        <div className="relative">
                            <item.icon size={isActive ? 22 : 18} />
                            {isBadged && !isActive && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-secondary text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </div>
                        <span
                            className={cn(
                                'text-[9px] font-bold uppercase tracking-wider mt-0.5 transition-all',
                                isActive ? 'block' : 'block opacity-80'
                            )}
                        >
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
