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
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[3rem] border-t border-slate-200 shadow-[0_-20px_40px_rgba(0,74,198,0.05)]">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button
                        key={item.id}
                        onClick={() => router.push(item.path)}
                        className={cn(
                            "flex flex-col items-center justify-center p-2 transition-all duration-300",
                            isActive 
                                ? "bg-primary text-white rounded-full p-4 mb-4 transform -translate-y-4 shadow-lg shadow-primary/20 scale-110" 
                                : "text-slate-400 hover:text-primary"
                        )}
                    >
                        <item.icon size={isActive ? 28 : 24} />
                        {!isActive && (
                            <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
};
