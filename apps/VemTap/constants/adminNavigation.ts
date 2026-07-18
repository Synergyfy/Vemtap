import {
    Home, Store, Users, Nfc, CreditCard, BarChart, MessageSquare, Activity,
    Settings, ShieldCheck, Gift, Package, FileText, Tag, Workflow, Eye, Zap, ClipboardList, Headset, Megaphone, Palette
} from 'lucide-react';

export interface SubmenuItem {
    label: string;
    href: string;
    keywords?: string[];
}

export interface MenuItem {
    id: string;
    label: string;
    icon: any;
    href?: string;
    submenu?: SubmenuItem[];
    permission?: string;
    keywords?: string[];
}

export const ADMIN_MENU_ITEMS: MenuItem[] = [
    {
        id: 'overview',
        label: 'Dashboard',
        icon: Home,
        href: '/admin/dashboard',
        permission: 'admin:dashboard',
        keywords: ['home', 'overview', 'stats', 'main', 'summary', 'welcome']
    },
    {
        id: 'businesses',
        label: 'Businesses',
        icon: Store,
        submenu: [
            { label: 'All Businesses', href: '/admin/businesses', keywords: ['stores', 'shops', 'companies', 'merchants', 'sellers', 'view'] },
            { label: 'Business Categories', href: '/admin/categories', keywords: ['industries', 'niche', 'classification', 'tags', 'groups'] },
            { label: 'Badge Approval', href: '/admin/businesses/pending', keywords: ['verification', 'pending', 'verify', 'trust', 'badges', 'approve'] },
            { label: 'Suspended', href: '/admin/businesses/suspended', keywords: ['banned', 'blocked', 'disabled', 'inactive', 'suspended'] },
        ],
        permission: 'admin:businesses',
        keywords: ['business', 'vendors', 'stores', 'shops', 'partners']
    },
    {
        id: 'customers',
        label: 'Customers',
        icon: Users,
        href: '/admin/users/customers',
        permission: 'admin:customers',
        keywords: ['users', 'shoppers', 'accounts', 'clients', 'consumers']
    },
    {
        id: 'agents',
        label: 'Support Agents',
        icon: ShieldCheck,
        href: '/admin/agents',
        permission: 'admin:agents',
        keywords: ['staff', 'helpers', 'admins', 'moderators', 'crew', 'members']
    },
    {
        id: 'devices',
        label: 'Devices',
        icon: Nfc,
        submenu: [
            { label: 'All Devices', href: '/admin/devices', keywords: ['nfc', 'tags', 'scanners', 'hardware', 'view'] },
            { label: 'Active', href: '/admin/devices/active', keywords: ['enabled', 'online', 'running'] },
            { label: 'Inactive', href: '/admin/devices/inactive', keywords: ['disabled', 'offline', 'stopped'] },
        ],
        permission: 'admin:devices',
        keywords: ['nfc', 'tags', 'hardware', 'equipment', 'tokens']
    },
    {
        id: 'subscriptions',
        label: 'Subscriptions',
        icon: CreditCard,
        href: '/admin/subscriptions',
        permission: 'admin:subscriptions',
        keywords: ['plans', 'billing', 'payments', 'revenue', 'recurring', 'memberships']
    },
    {
        id: 'products',
        label: 'Products',
        icon: Package,
        submenu: [
            { label: 'All Products', href: '/admin/products', keywords: ['inventory', 'items', 'catalog', 'goods', 'view'] },
            { label: 'Hardware Orders', href: '/admin/orders', keywords: ['shipments', 'deliveries', 'purchases', 'sales'] },
            { label: 'Quote Requests', href: '/admin/quotes', keywords: ['pricing', 'estimates', 'leads', 'inquiries'] },
            { label: 'Product Categories', href: '/admin/products/types', keywords: ['sections', 'types', 'tags', 'groups'] },
            { label: 'Add New Product', href: '/admin/products/create', keywords: ['create', 'new', 'upload', 'insert'] },
        ],
        permission: 'admin:products',
        keywords: ['shop', 'goods', 'items', 'hardware', 'inventory']
    },
    {
        id: 'analytics',
        label: 'Platform Analytics',
        icon: BarChart,
        href: '/admin/analytics',
        permission: 'admin:analytics',
        keywords: ['charts', 'metrics', 'stats', 'data', 'reports', 'graphs', 'growth']
    },
    {
        id: 'loyalty',
        label: 'Loyalty Control',
        icon: Gift,
        href: '/admin/loyalty',
        permission: 'admin:loyalty',
        keywords: ['rewards', 'points', 'coupons', 'discounts', 'offers', 'bonuses', 'programs']
    },
    {
        id: 'discovery',
        label: 'Discovery Network',
        icon: Zap,
        href: '/admin/discovery/dashboard',
        permission: 'admin:all',
        keywords: ['discovery', 'network', 'referrals', 'attribution', 'partnerships', 'nearby']
    },
    {
        id: 'support',
        label: 'Support Tickets',
        icon: MessageSquare,
        href: '/admin/support',
        permission: 'admin:support',
        keywords: ['issues', 'tickets', 'helpdesk', 'bugs', 'complaints', 'requests']
    },
    {
        id: 'support-chat',
        label: 'Support Chat Desk',
        icon: Headset,
        href: '/admin/support/chat-desk',
        permission: 'admin:support',
        keywords: ['live', 'chat', 'desk', 'messages', 'realtime', 'conversations']
    },
    {
        id: 'forms',
        label: 'Form Approvals',
        icon: FileText,
        href: '/admin/forms',
        permission: 'admin:forms',
        keywords: ['submissions', 'reviews', 'applications', 'documents', 'verify']
    },
    {
        id: 'nfc-grants',
        label: 'NFC Quota Grants',
        icon: ShieldCheck,
        href: '/admin/nfc-grants',
        permission: 'admin:all',
        keywords: ['quota', 'credits', 'allocations', 'permissions', 'grants', 'nfc']
    },
    {
        id: 'marketing-assets',
        label: 'Marketing Kit',
        icon: Palette,
        href: '/admin/marketing-assets',
        permission: 'admin:all',
        keywords: ['marketing', 'flyers', 'posters', 'qr', 'print', 'branding', 'graphics']
    },
    {
        id: 'engagement',
        label: 'Engagement Control',
        icon: Zap,
        href: '/admin/forms',
        permission: 'admin:forms',
        keywords: ['campaigns', 'promotions', 'blasts', 'triggers', 'activity']
    },
    {
        id: 'messaging',
        label: 'Messaging Control',
        icon: MessageSquare,
        submenu: [
            { label: 'WhatsApp Templates', href: '/admin/messaging', keywords: ['whatsapp', 'sms', 'templates', 'canned'] },
            { label: 'Credits & Packages', href: '/admin/messaging/credits', keywords: ['pricing', 'balance', 'purchase', 'buy', 'sms', 'billing'] },
        ],
        permission: 'admin:messaging',
        keywords: ['sms', 'whatsapp', 'notifications', 'credits', 'texts']
    },
    {
        id: 'flow-engine',
        label: 'Flow Engine',
        icon: Workflow,
        submenu: [
            { label: 'Overview', href: '/admin/flow-engine', keywords: ['flow', 'automations', 'pipelines'] },
            { label: 'Flow Templates', href: '/admin/flow-engine/templates', keywords: ['blueprints', 'presets', 'samples'] },
            { label: 'Trigger Management', href: '/admin/flow-engine/triggers', keywords: ['hooks', 'events', 'listeners'] },
            { label: 'WhatsApp Settings', href: '/admin/flow-engine/settings', keywords: ['config', 'api', 'credentials'] },
            { label: 'Sessions Monitor', href: '/admin/flow-engine/sessions', keywords: ['active', 'status', 'live'] },
            { label: 'Logs & Errors', href: '/admin/flow-engine/logs', keywords: ['exceptions', 'debug', 'history'] },
            { label: 'System Analytics', href: '/admin/flow-engine/analytics', keywords: ['charts', 'engine', 'performance'] },
        ],
        permission: 'admin:flow-engine',
        keywords: ['automations', 'workflows', 'triggers', 'bot', 'engine']
    },
    {
        id: 'control-tower',
        label: 'Control Tower',
        icon: Eye,
        submenu: [
            { label: 'Business Override', href: '/admin/control-tower/business-override', keywords: ['bypass', 'impersonate', 'override', 'business'] },
            { label: 'Customer Override', href: '/admin/control-tower/customer-override', keywords: ['bypass', 'impersonate', 'override', 'customer'] },
        ],
        permission: 'admin:control-tower',
        keywords: ['override', 'moderation', 'supervise', 'control', 'impersonate']
    },
    {
        id: 'pricing',
        label: 'Pricing Plans',
        icon: Tag,
        href: '/admin/pricing',
        permission: 'admin:pricing',
        keywords: ['plans', 'subscriptions', 'packages', 'rates', 'fees']
    },
    {
        id: 'health',
        label: 'System Health',
        icon: Activity,
        href: '/admin/health',
        permission: 'admin:health',
        keywords: ['status', 'uptime', 'database', 'servers', 'monitoring', 'cpu']
    },
    {
        id: 'observability',
        label: 'API Observability',
        icon: Activity,
        href: '/admin/observability',
        permission: 'admin:health',
        keywords: ['logs', 'metrics', 'tracing', 'requests', 'errors', 'telemetry']
    },
    {
        id: 'banners',
        label: 'Banner Management',
        icon: Megaphone,
        href: '/admin/banners',
        permission: 'admin:settings',
        keywords: ['ads', 'announcements', 'marketing', 'headers', 'sliders']
    },
    {
        id: 'settings',
        label: 'System Settings',
        icon: Settings,
        href: '/admin/settings',
        permission: 'admin:settings',
        keywords: ['configuration', 'preferences', 'security', 'keys', 'variables']
    },
    {
        id: 'business-profiling',
        label: 'Business Profiling',
        icon: ClipboardList,
        href: '/admin/business-profiling',
        permission: 'admin:all',
        keywords: ['questionnaire', 'onboarding', 'auditing', 'reviews', 'details']
    },
];
