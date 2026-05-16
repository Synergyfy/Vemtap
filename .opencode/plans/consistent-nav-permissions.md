# Plan: Consistent Nav Permissions (Permission Overrides Role)

## Problem
Both `DashboardSidebar` (left) and `DashboardMobileNav` (bottom) have duplicated filtering logic. Worse, the `roles` check runs before `permission`, so a staff with `catalogue` permission is still blocked by `roles: ['owner', 'manager']`.

## Solution
Create a shared utility and change the priority: `permission` overrides `roles`.

## Step 1: Create shared utility

**New file:** `apps/VemTap/lib/utils/nav-filter.ts`

```ts
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
  // Owner/Admin bypass all checks
  if (isOwnerOrAdmin) return true;

  // Permission check takes priority: if permission defined, it alone decides
  if (item.permission) {
    return userPermissions.includes(item.permission);
  }

  // No permission field → fall back to role check
  if (item.roles && !item.roles.includes(userRole)) {
    return false;
  }

  return true;
}
```

## Step 2: Update `DashboardSidebar.tsx`

Replace lines 315-343 (the `filteredMenuItems` logic) with:

```ts
const filteredMenuItems = menuItems.filter(item => {
  const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

  // Admin/Agent Impersonation: only business owner menus
  if (isAdminMode) {
    if (item.id === 'staff') return false;
    if (item.id === 'agent-desk') return false;
    if (item.id === 'admin-nfc') return false;
    return !item.roles || item.roles.includes('owner');
  }

  // Admin sees everything
  if (realUserRole === 'admin') return true;

  // Use shared filter: permission overrides role
  return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
});
```

Add import at top:
```ts
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
```

## Step 3: Update `DashboardMobileNav.tsx`

Replace the inline filter logic (lines 54-73) with:

```ts
const userPermissions = user?.permissions || [];
const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());

const filteredNavItems = navItems.filter(item => {
  const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

  if (isAdminMode) {
    return !item.roles || item.roles.includes('owner');
  }

  if (realUserRole === 'admin') return true;

  return canAccessMenuItem(item, realUserRole, userPermissions, isOwnerOrAdmin);
});
```

Add import at top:
```ts
import { canAccessMenuItem } from '@/lib/utils/nav-filter';
```

## Verification

| Scenario | Sidebar | Mobile Nav |
|----------|---------|------------|
| Staff with `catalogue` permission | Shows Catalogue | Shows Catalogue |
| Staff without `catalogue` permission | Hides Catalogue | Hides Catalogue |
| Owner (bypasses all) | Shows all with permission fields | Shows all with permission fields |
| Admin (bypasses all) | Shows all | Shows all |
| Staff with `chat` permission | Shows Chat | Shows Chat |
| Staff without `chat` permission | Hides Chat | Hides Chat |
| Admin impersonating | Owner-level items only | Owner-level items only |
