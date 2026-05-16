# Fix: DashboardMobileNav Permission Filtering

## Problem
`DashboardMobileNav.tsx` shows all 5 bottom nav items regardless of the staff user's role or permissions.

## Solution
Add role/permission filtering matching the logic in `DashboardSidebar.tsx`.

## File to Edit
`apps/VemTap/components/dashboard/DashboardMobileNav.tsx`

## Changes

### 1. Add import for `useAuthStore`
After the `useSudoStore` import, add:
```ts
import { useAuthStore } from '@/store/useAuthStore';
```

### 2. Add user state inside the component
After `const isAdminMode = activeSession !== null;`, add:
```ts
const user = useAuthStore((state) => state.user);
```

### 3. Add `roles` and `permission` to each nav item
```ts
const navItems = [
    {
        label: 'Home', icon: Home, href: '/dashboard',
        roles: ['owner', 'manager', 'staff'], permission: 'dashboard',
    },
    {
        label: 'Visitor', icon: Users, href: '/dashboard/visitors',
        roles: ['owner', 'manager', 'staff'], permission: 'visitors',
    },
    {
        label: 'Catalogue', icon: ShoppingBag, href: '/dashboard/catalogue',
        roles: ['owner', 'manager'], permission: 'catalogue',
    },
    {
        label: 'Chat', icon: MessageCircle, href: '/dashboard/messaging/chat',
        roles: ['owner', 'manager', 'staff'], permission: 'chat',
    },
    {
        label: 'Channels', icon: MessageSquare, href: '/dashboard/messaging',
        roles: ['owner', 'manager'], permission: 'messages',
    },
];
```

### 4. Add filtering logic before the return statement
After the `navItems` array and before the `return`, add:
```ts
const userPermissions = user?.permissions || [];
const isOwnerOrAdmin = ['owner', 'admin'].includes((user?.role as string)?.toLowerCase());

const filteredNavItems = navItems.filter(item => {
    const realUserRole = (user?.role as string)?.toLowerCase() || 'owner';

    if (isAdminMode) {
        return !item.roles || item.roles.includes('owner');
    }

    if (realUserRole === 'admin') return true;

    if (item.roles && !item.roles.includes(realUserRole)) return false;

    if (item.permission && !isOwnerOrAdmin && !userPermissions.includes(item.permission)) {
        return false;
    }

    return true;
});
```

### 5. Use `filteredNavItems` instead of `navItems` in the map
Change:
```tsx
{navItems.map((item) => {
```
To:
```tsx
{filteredNavItems.map((item) => {
```

## Verification
- A `staff` user without `catalogue` or `messages` permissions will no longer see Catalogue or Channels in the bottom nav
- An `owner` bypasses permission checks (sees all items)
- An `admin` sees everything
- Admin impersonation mode shows only items available to `owner` role
- The desktop sidebar (`DashboardSidebar.tsx`) already handles this correctly -- replicate its exact filtering logic
