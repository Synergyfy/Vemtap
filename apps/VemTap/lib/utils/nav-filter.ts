export interface NavFilterItem {
  roles?: string[];
  permission?: string;
}

export function canAccessMenuItem(
  item: NavFilterItem,
  userRole: string,
  userPermissions: string[],
  isOwnerOrAdmin: boolean,
): boolean {
  if (item.roles && !item.roles.includes(userRole)) {
    return false;
  }

  if (isOwnerOrAdmin) return true;

  if (item.permission) {
    return userPermissions.includes(item.permission);
  }

  return true;
}

import { NAVIGATION_SECTIONS, MenuItem } from '@/constants/ownerNavigation';

export function getDashboardNavItems(): MenuItem[] {
  return NAVIGATION_SECTIONS.flatMap((s) => s.items);
}

export function findNavItemForPath(pathname: string): MenuItem | undefined {
  return getDashboardNavItems().find((item) => {
    if (item.href === pathname) return true;
    return !!item.submenu?.some((s) => s.href === pathname);
  });
}

export function isRouteAllowed(
  pathname: string,
  userRole: string,
  userPermissions: string[],
  isOwnerOrAdmin: boolean,
): boolean {
  if (isOwnerOrAdmin) return true;
  const item = findNavItemForPath(pathname);
  if (!item) return true;

  // For items with submenus, check the specific sub-permission
  if (item.submenu && item.permission) {
    const subIdx = item.submenu.findIndex(s => s.href === pathname);
    if (subIdx !== -1) {
      const sub = item.submenu[subIdx];
      const subKey = `${item.permission}:${sub.label.toLowerCase().replace(/\s+/g, '-')}`;
      // If user has the specific sub-permission, allow
      if (userPermissions.includes(subKey)) return true;
      // Fallback: if user has parent permission and this is the first submenu
      // item (main page), allow — prevents redirect loops.
      if (userPermissions.includes(item.permission) && subIdx === 0) return true;
      return false;
    }
    // Route is the parent's own href, not a submenu item — check parent permission
    return userPermissions.includes(item.permission);
  }

  return canAccessMenuItem(item, userRole, userPermissions, false);
}

export function getFirstPermittedDashboardRoute(userRole: string, userPermissions: string[]): string | null {
  if (userRole === 'owner' || userRole === 'admin') return '/dashboard';
  for (const item of getDashboardNavItems()) {
    if (!item.href) continue;
    if (canAccessMenuItem(item, userRole, userPermissions, false)) {
      return item.href;
    }
  }
  return null;
}
