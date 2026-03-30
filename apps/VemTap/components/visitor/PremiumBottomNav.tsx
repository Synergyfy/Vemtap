'use client';

import React from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User, Gift, Calendar, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PremiumBottomNav = () => {
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    
    const slug = params.slug;
    const code = params.code;

    const navItems = [
        { id: 'home', icon: Home, label: 'Home', path: `/${slug}/${code}` },
        { id: 'products', icon: ShoppingBag, label: 'Shop', path: `/${slug}/${code}/products` },
        { id: 'services', icon: Calendar, label: 'Book', path: `/${slug}/${code}/services` },
        { id: 'offers', icon: Gift, label: 'Offers', path: `/${slug}/${code}/offers` },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-3 pt-1.5 bg-surface/80 backdrop-blur-xl rounded-t-3xl border-t border-slate-200 shadow-[0_-15px_30px_rgba(0,74,198,0.05)]">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={cn(
                            "flex flex-col items-center justify-center p-1.5 transition-all duration-300",
                            isActive 
                                ? "bg-primary text-white rounded-full p-3 mb-2 transform -translate-y-2 shadow-lg shadow-primary/20 scale-105" 
                                : "text-slate-400 hover:text-primary"
                        )}
                    >
                        <item.icon size={isActive ? 22 : 18} />
                        <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider mt-0.5 transition-all",
                            isActive ? "block" : "block opacity-80"
                        )}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
