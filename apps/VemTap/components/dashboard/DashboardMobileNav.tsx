import React from 'react';
import { usePathname } from 'next/navigation';
import { Home, Users, ShoppingBag, TrendingUp, MoreHorizontal, Wand2, Settings } from 'lucide-react';
import { useSudoStore } from '@/store/useSudoStore';
import { useAuthStore } from '@/store/useAuthStore';
import { canAccessMenuItem } from '@/lib/utils/nav-filter';

interface DashboardMobileNavProps {
    onOpenSidebar?: () => void;
}

export default function DashboardMobileNav({ onOpenSidebar }: DashboardMobileNavProps) {
    const pathname = usePathname();
    const { activeSession } = useSudoStore();
    const isAdminMode = activeSession !== null;
    const user = useAuthStore((state) => state.user);

    const navItems = [
        {
            label: 'Home',
            icon: Home,
            href: '/dashboard',
            roles: ['owner', 'manager', 'cashier', 'inventory', 'marketing', 'customer_service', 'staff'],
        },
        {
            label: 'Customers',
            icon: Users,
            href: '/dashboard/visitors',
            roles: ['owner', 'manager', 'customer_service', 'staff'],
        },
        {
            label: 'My Store',
            icon: ShoppingBag,
            href: '/dashboard/commerce',
            roles: ['owner', 'manager', 'inventory', 'cashier', 'staff'],
        },
        {
            label: 'Experience',
            icon: Wand2,
            href: '/dashboard/customer-experience',
            roles: ['owner', 'manager', 'marketing', 'staff'],
        },
        {
            label: 'More',
            icon: MoreHorizontal,
            href: '/dashboard/more',
            roles: ['owner', 'manager', 'cashier', 'inventory', 'marketing', 'customer_service', 'staff'],
        },
    ];

    const userPermissions = user?.permissions || [];
    const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());

    const filteredNavItems = navItems.filter(item => {
        const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

        if (isAdminMode) {
            return !item.roles || item.roles.includes('owner');
        }

        return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
    });

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex justify-around items-center h-20 px-2">
                {filteredNavItems.map((item) => {
                    const isActive = (() => {
                        if (item.label === 'Home') return pathname === '/dashboard' || pathname === '/dashboard/';
                        if (item.label === 'My Store') {
                            return pathname.startsWith('/dashboard/commerce') || 
                                   pathname.startsWith('/dashboard/catalogue') || 
                                   pathname.startsWith('/dashboard/inventory') || 
                                   pathname.startsWith('/dashboard/pos');
                        }
                        if (item.label === 'More') {
                            return pathname.startsWith('/dashboard/more') || 
                                   pathname.startsWith('/dashboard/analytics') || 
                                   pathname.startsWith('/dashboard/explore-qrthrive') || 
                                   pathname.startsWith('/dashboard/settings') || 
                                   pathname.startsWith('/dashboard/staff');
                        }
                        return pathname.startsWith(item.href);
                    })();
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.href}
                            onClick={onOpenSidebar}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${
                                isActive 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                                    : 'bg-transparent'
                            }`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[11px] mt-1.5 font-semibold tracking-tight transition-all ${
                                isActive ? 'text-primary opacity-100' : 'text-gray-400 opacity-80'
                            }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
