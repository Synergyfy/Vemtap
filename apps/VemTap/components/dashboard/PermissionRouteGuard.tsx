'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { getFirstPermittedDashboardRoute, isRouteAllowed } from '@/lib/utils/nav-filter';

export default function PermissionRouteGuard({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const role = (user?.role as string)?.toLowerCase() || '';
    const permissions = user?.permissions || [];
    const isOwnerOrAdmin = role === 'owner' || role === 'admin';

    useEffect(() => {
        if (!user || isOwnerOrAdmin) return;
        const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        if (isRouteAllowed(normalized, role, permissions, false)) return;
        const landing = getFirstPermittedDashboardRoute(role, permissions);
        if (landing && landing !== normalized) {
            router.replace(landing);
        }
    }, [pathname, user, role, permissions, isOwnerOrAdmin, router]);

    if (!user || isOwnerOrAdmin) return <>{children}</>;

    const normalized = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    if (!isRouteAllowed(normalized, role, permissions, false)) return null;

    return <>{children}</>;
}
