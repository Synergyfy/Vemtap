import {
    Home, Users, Gift, BarChart, Settings, HelpCircle,
    MessageSquare, ShieldCheck, MessageCircle, Zap, ShoppingBag, QrCode, FileText
} from 'lucide-react';

export interface SubmenuItem {
    label: string;
    href: string;
    feature?: string;
    featureName?: string;
    keywords?: string[];
}

export interface MenuItem {
    id: string;
    label: string;
    icon: any;
    href?: string;
    roles?: string[];
    permission?: string;
    feature?: string;
    featureName?: string;
    submenu?: SubmenuItem[];
    keywords?: string[];
}

export const OWNER_MENU_ITEMS: MenuItem[] = [
    {
        id: 'overview',
        label: 'Dashboard',
        icon: Home,
        href: '/dashboard',
        roles: ['owner', 'manager', 'staff'],
        permission: 'dashboard',
        keywords: ['home', 'overview', 'stats', 'main', 'summary', 'welcome', 'index']
    },
    {
        id: 'visitors',
        label: 'Visitors',
        icon: Users,
        roles: ['owner', 'manager', 'staff'],
        permission: 'visitors',
        keywords: ['customers', 'contacts', 'users', 'shoppers', 'database', 'audience'],
        submenu: [
            { label: 'Overview', href: '/dashboard/visitors', keywords: ['summary', 'analytics', 'statistics', 'charts'] },
            { label: 'All Visitors', href: '/dashboard/visitors/all', keywords: ['contacts', 'users', 'shoppers', 'database', 'list'] },
            { label: 'New Visitors', href: '/dashboard/visitors/new', keywords: ['recent', 'signup', 'fresh', 'acquired'] },
            { label: 'Returning', href: '/dashboard/visitors/returning', keywords: ['loyal', 'frequent', 'active', 're-engaged'] },
        ]
    },
    {
        id: 'live-chat',
        label: 'In-App Chat',
        icon: MessageCircle,
        href: '/dashboard/messaging/chat',
        roles: ['owner', 'manager', 'staff'],
        permission: 'chat',
        keywords: ['support', 'messages', 'live', 'realtime', 'conversations', 'in-app', 'inbox']
    },
    {
        id: 'messaging-center',
        label: 'Channels',
        icon: MessageSquare,
        roles: ['owner', 'manager'],
        permission: 'messages',
        keywords: ['whatsapp', 'sms', 'email', 'credits', 'broadcasts', 'history', 'campaigns'],
        submenu: [
            { label: 'WhatsApp', href: '/dashboard/messaging/whatsapp', keywords: ['meta', 'whatsapp', 'templates', 'api'] },
            { label: 'SMS', href: '/dashboard/messaging/sms', keywords: ['texts', 'credits', 'mobile', 'numbers'] },
            { label: 'Email', href: '/dashboard/messaging/email', keywords: ['newsletter', 'campaigns', 'inbox', 'smtp'] },
            { label: 'Messaging Credits', href: '/dashboard/messaging/credits', keywords: ['topup', 'buy', 'balance', 'pricing', 'purchase'] },
            { label: 'History', href: '/dashboard/messaging/history', keywords: ['logs', 'sent', 'status', 'delivery', 'records'] },
        ]
    },
    {
        id: 'loyalty',
        label: 'Loyalty',
        icon: Gift,
        href: '/dashboard/loyalty',
        roles: ['owner', 'manager', 'staff'],
        permission: 'loyalty',
        feature: 'loyalty',
        featureName: 'Loyalty Programs',
        keywords: ['rewards', 'points', 'stamps', 'cards', 'memberships', 'gift', 'coupons', 'discounts']
    },
    {
        id: 'catalogue',
        label: 'Catalogue',
        icon: ShoppingBag,
        roles: ['owner', 'manager'],
        permission: 'catalogue',
        feature: 'catalogue',
        featureName: 'Catalogue',
        keywords: ['products', 'offers', 'categories', 'orders', 'bookings', 'shop', 'storefront', 'items'],
        submenu: [
            { label: 'Overview', href: '/dashboard/catalogue', keywords: ['shop', 'storefront', 'summary'] },
            { label: 'Products', href: '/dashboard/catalogue/products', keywords: ['items', 'inventory', 'pricing', 'goods'] },
            { label: 'Offers', href: '/dashboard/catalogue/offers', keywords: ['discounts', 'deals', 'sales', 'coupons'] },
            { label: 'Categories', href: '/dashboard/catalogue/categories', keywords: ['sections', 'groups', 'types', 'tags'] },
            { label: 'Orders', href: '/dashboard/catalogue/orders', keywords: ['purchases', 'transactions', 'sales', 'delivery'] },
            { label: 'Bookings', href: '/dashboard/catalogue/bookings', keywords: ['reservations', 'appointments', 'schedules', 'calendar'] },
        ]
    },
    {
        id: 'analytics',
        label: 'Advanced Analytics ',
        icon: BarChart,
        roles: ['owner', 'manager'],
        permission: 'analytics',
        keywords: ['charts', 'metrics', 'stats', 'data', 'reports', 'footfall', 'peak times', 'trends'],
        submenu: [
            { label: 'Overview', href: '/dashboard/analytics', keywords: ['summary', 'statistics', 'charts'] },
            { label: 'Footfall', href: '/dashboard/analytics/footfall', feature: 'footfall', featureName: 'Advanced Analytics', keywords: ['visits', 'visitors', 'traffic', 'traffic-analysis'] },
            { label: 'Peak Times', href: '/dashboard/analytics/peak-times', feature: 'peak-times', featureName: 'Advanced Analytics', keywords: ['busy', 'hours', 'popular', 'times', 'schedule'] },
        ]
    },
    {
        id: 'manage-forms',
        label: 'Manage Forms',
        icon: FileText,
        href: '/dashboard/engagement/forms',
        roles: ['owner', 'manager', 'staff'],
        permission: 'engagement',
        keywords: ['submissions', 'questionnaires', 'feedback', 'surveys', 'signups', 'templates']
    },
    {
        id: 'agent-desk',
        label: 'Support Desk',
        icon: HelpCircle,
        href: '/agent/dashboard',
        roles: ['staff', 'manager'],
        permission: 'support',
        keywords: ['tickets', 'helpdesk', 'issues', 'bugs', 'resolutions', 'agent']
    },
    {
        id: 'admin-nfc',
        label: 'Admin NFC Grants',
        icon: ShieldCheck,
        href: '/admin/nfc-grants',
        roles: ['admin'],
        keywords: ['quota', 'credits', 'allocations', 'permissions', 'grants', 'nfc', 'sudo']
    },
    {
        id: 'explore-qrthrive',
        label: 'Explore QRThrive',
        icon: QrCode,
        href: '/dashboard/explore-qrthrive',
        roles: ['owner', 'manager', 'staff'],
        permission: 'qrthrive',
        keywords: ['qr', 'generator', 'codes', 'thrive', 'marketing', 'flyers']
    },
    {
        id: 'customer-experience',
        label: 'Customer Experience',
        icon: Zap,
        href: '/dashboard/customer-experience',
        roles: ['owner', 'manager', 'staff'],
        permission: 'customer-experience',
        keywords: ['feedback', 'satisfaction', 'reviews', 'ratings', 'engagement', 'nps']
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/dashboard/settings',
        roles: ['owner', 'manager'],
        permission: 'settings',
        keywords: ['configuration', 'preferences', 'profile', 'billing', 'subscription', 'branches', 'team', 'compliance'],
        submenu: [
            { label: 'Profile', href: '/dashboard/settings/profile', keywords: ['personal', 'account', 'business', 'email', 'avatar'] },
            { label: 'Business Locations', href: '/dashboard/settings/branches', keywords: ['outlets', 'branches', 'stores', 'maps', 'addresses'] },
            { label: 'Team', href: '/dashboard/staff', keywords: ['staff', 'employees', 'members', 'roles', 'permissions'] },
            { label: 'Subscription', href: '/dashboard/settings/subscription', keywords: ['billing', 'plans', 'invoice', 'upgrade', 'pricing', 'tier'] },
            { label: 'Support', href: '/dashboard/support', keywords: ['tickets', 'contact', 'help', 'email', 'bug'] },
            { label: 'Legal & Compliance', href: '/dashboard/compliance', keywords: ['legal', 'terms', 'privacy', 'gdpr', 'agreements'] },
        ]
    },
];
