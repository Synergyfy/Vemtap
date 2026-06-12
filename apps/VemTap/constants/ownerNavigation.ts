import {
    Home, Users, Gift, BarChart, Settings, HelpCircle,
    MessageSquare, ShieldCheck, MessageCircle, Zap, ShoppingBag, QrCode, FileText, Palette,
    Package, Target, Globe, Star
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
        id: 'customer-capture-setup',
        label: 'Customer Capture',
        icon: QrCode,
        roles: ['owner', 'manager'],
        permission: 'dashboard',
        keywords: ['qr', 'setup', 'capture', 'link', 'shortlink', 'generator', 'customize'],
        submenu: [
            { label: 'Capture Setup', href: '/dashboard/customer-capture/setup', keywords: ['wizard', 'onboarding', 'activation'] },
            { label: 'Manage QR Codes', href: '/dashboard/explore-qrthrive', keywords: ['list', 'edit', 'thrive'] },
        ]
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
        id: 'inventory',
        label: 'Inventory',
        icon: Package,
        href: '/dashboard/inventory',
        roles: ['owner', 'manager'],
        permission: 'inventory',
        keywords: ['stock', 'items', 'products', 'inventory', 'warehouse', 'reorder'],
    },
    {
        id: 'pos',
        label: 'Point Of Sale',
        icon: Zap,
        href: '/dashboard/pos',
        roles: ['owner', 'manager', 'staff'],
        permission: 'pos',
        keywords: ['pos', 'checkout', 'register', 'sales', 'transaction'],
    },
    {
        id: 'messaging-center',
        label: 'Messaging Center',
        icon: MessageSquare,
        roles: ['owner', 'manager'],
        permission: 'messages',
        keywords: ['whatsapp', 'sms', 'email', 'credits', 'broadcasts', 'history', 'campaigns', 'marketing'],
        submenu: [
            { label: 'Overview', href: '/dashboard/messaging', keywords: ['summary', 'analytics', 'dashboard'] },
            { label: 'Create Campaign', href: '/dashboard/messaging/create', keywords: ['new', 'compose', 'wizard', 'send'] },
            { label: 'Campaign History', href: '/dashboard/messaging/history', keywords: ['logs', 'sent', 'status', 'delivery', 'records'] },
            { label: 'Reports', href: '/dashboard/messaging/reports', keywords: ['analytics', 'performance', 'roi', 'stats'] },
            { label: 'Messaging Credits', href: '/dashboard/messaging/credits', keywords: ['topup', 'buy', 'balance', 'pricing', 'purchase'] },
        ]
    },
    {
        id: 'automations',
        label: 'Automations',
        icon: Zap,
        roles: ['owner', 'manager'],
        permission: 'automations',
        keywords: ['workflow', 'trigger', 'welcome', 'birthday', 'reactivation', 'smart', 'automatic'],
        submenu: [
            { label: 'Overview', href: '/dashboard/automations', keywords: ['dashboard', 'summary', 'active'] },
            { label: 'Welcome Flow', href: '/dashboard/automations/welcome', keywords: ['onboarding', 'new', 'registration'] },
            { label: 'Birthday Flow', href: '/dashboard/automations/birthday', keywords: ['celebration', 'rewards', 'annual'] },
            { label: 'Reactivation Flow', href: '/dashboard/automations/reactivation', keywords: ['winback', 'inactive', 'reminder'] },
            { label: 'Activity Logs', href: '/dashboard/automations/logs', keywords: ['history', 'execution', 'audit'] },
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
        label: 'Advanced Analytics',
        icon: BarChart,
        roles: ['owner', 'manager'],
        permission: 'analytics',
        keywords: ['charts', 'metrics', 'stats', 'data', 'reports', 'footfall', 'peak times', 'trends'],
        submenu: [
            { label: 'Overview', href: '/dashboard/analytics', keywords: ['summary', 'statistics', 'charts'] },
            { label: 'Customers', href: '/dashboard/analytics/customers', keywords: ['behavior', 'growth', 'retention'] },
            { label: 'Sales', href: '/dashboard/analytics/sales', keywords: ['revenue', 'transactions', 'orders'] },
            { label: 'Inventory', href: '/dashboard/analytics/inventory', keywords: ['stock', 'products', 'reorder'] },
            { label: 'Customer Value', href: '/dashboard/analytics/customer-value', keywords: ['clv', 'loyalty', 'spending'] },
            { label: 'Marketing', href: '/dashboard/analytics/marketing', keywords: ['campaigns', 'conversion'] },
            { label: 'Discovery', href: '/dashboard/analytics/discovery', keywords: ['network', 'reach'] },
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
        id: 'intelligence',
        label: 'Customer Intelligence',
        icon: Target,
        href: '/dashboard/intelligence',
        roles: ['owner', 'manager'],
        permission: 'analytics',
        keywords: ['intelligence', 'crm', 'growth', 'insights', 'health', 'value'],
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
        id: 'marketing-assets',
        label: 'Marketing Materials',
        icon: Palette,
        href: '/dashboard/marketing-assets',
        roles: ['owner', 'manager'],
        permission: 'dashboard',
        keywords: ['marketing', 'flyers', 'posters', 'cards', 'tent', 'designs', 'creative', 'brand', 'print']
    },
    {
        id: 'discovery',
        label: 'Discovery Network',
        icon: Globe,
        roles: ['owner', 'manager'],
        permission: 'discovery',
        keywords: ['network', 'marketplace', 'discovery', 'leads', 'traffic', 'promotions'],
        submenu: [
            { label: 'Overview', href: '/dashboard/discovery', keywords: ['summary', 'analytics', 'dashboard'] },
            { label: 'Business Listing', href: '/dashboard/discovery/settings', keywords: ['profile', 'settings', 'visibility'] },
            { label: 'Promotions', href: '/dashboard/discovery/promotions', keywords: ['offers', 'campaigns', 'deals'] },
            { label: 'Analytics', href: '/dashboard/discovery/analytics', keywords: ['performance', 'reports', 'stats'] },
        ]
    },
    {
        id: 'feedback',
        label: 'Feedback & Reviews',
        icon: Star,
        roles: ['owner', 'manager'],
        permission: 'feedback',
        keywords: ['reviews', 'ratings', 'feedback', 'comments', 'sentiment', 'support'],
        submenu: [
            { label: 'Overview', href: '/dashboard/feedback', keywords: ['summary', 'analytics', 'dashboard'] },
            { label: 'Review Requests', href: '/dashboard/feedback/requests', keywords: ['send', 'compose', 'campaign'] },
            { label: 'Responses', href: '/dashboard/feedback/responses', keywords: ['replies', 'inbox', 'customer'] },
            { label: 'Insights', href: '/dashboard/feedback/insights', keywords: ['analytics', 'performance', 'reports'] },
        ]
    },
    {
        id: 'referrals',
        label: 'Referrals',
        icon: Users,
        roles: ['owner', 'manager'],
        permission: 'referrals',
        keywords: ['refer', 'commissions', 'affiliate', 'invites', 'partners'],
        submenu: [
            { label: 'Overview', href: '/dashboard/referrals', keywords: ['summary', 'analytics', 'dashboard'] },
            { label: 'Referral Link', href: '/dashboard/referrals/link', keywords: ['invite', 'share', 'code'] },
            { label: 'Tracking', href: '/dashboard/referrals/tracking', keywords: ['pipeline', 'status', 'list'] },
            { label: 'Earnings', href: '/dashboard/referrals/earnings', keywords: ['commissions', 'revenue', 'stats'] },
            { label: 'Payouts', href: '/dashboard/referrals/payouts', keywords: ['withdraw', 'balance', 'bank'] },
        ]
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
