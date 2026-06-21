import {
    Home, Users, Gift, BarChart, Settings, HelpCircle,
    MessageSquare, ShieldCheck, MessageCircle, Zap, ShoppingBag, QrCode, FileText, Palette,
    Package, Target, Globe, Star, LayoutDashboard, Megaphone, Workflow, Share2, 
    LineChart, CreditCard, Layers, Globe2, Cpu, BookOpen, Settings2, Wallet, 
    UserCheck, Wand2, BarChart3, TrendingUp, Search, Users2
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

export interface NavSection {
    id: string;
    label: string;
    items: MenuItem[];
}

export const NAVIGATION_SECTIONS: NavSection[] = [
    {
        id: 'section-dashboard',
        label: '',
        items: [
            {
                id: 'overview',
                label: 'Dashboard',
                icon: Home,
                href: '/dashboard',
                roles: ['owner', 'manager', 'cashier', 'inventory', 'marketing', 'customer_service', 'staff'],
                permission: 'dashboard',
                keywords: ['home', 'overview', 'stats', 'main', 'summary', 'welcome', 'index']
            }
        ]
    },
    {
        id: 'section-commerce',
        label: 'My Store',
        items: [
            {
                id: 'products-stock',
                label: 'Products & Stock',
                icon: Package,
                href: '/dashboard/products-stock',
                roles: ['owner', 'manager', 'inventory'],
                permission: 'inventory',
                submenu: [
                    { label: 'Overview', href: '/dashboard/products-stock' },
                    { label: 'Catalogue', href: '/dashboard/catalogue' },
                    { label: 'Inventory', href: '/dashboard/inventory' },
                ],
                keywords: ['products', 'stock', 'inventory', 'warehouse', 'reorder', 'catalogue']
            },
            {
                id: 'sales',
                label: 'Sales',
                icon: CreditCard,
                href: '/dashboard/sales',
                roles: ['owner', 'manager', 'cashier', 'staff'],
                permission: 'pos',
                submenu: [
                    { label: 'Sales Dashboard', href: '/dashboard/sales' },
                    { label: 'POS Home', href: '/dashboard/pos' },
                    { label: 'Settings', href: '/dashboard/pos/settings' },
                    { label: 'Help', href: '/dashboard/pos/support' },
                ],
                keywords: ['pos', 'checkout', 'register', 'sales', 'transaction', 'orders']
            },
            {
                id: 'commerce-customers',
                label: 'Customers',
                icon: Users,
                href: '/dashboard/customers',
                roles: ['owner', 'manager', 'cashier', 'customer_service', 'staff'],
                permission: 'visitors',
                submenu: [
                    { label: 'Overview', href: '/dashboard/customers' },
                    { label: 'Customer List', href: '/dashboard/pos/customers' },
                    { label: 'Loyalty', href: '/dashboard/loyalty' },
                    { label: 'Visitors', href: '/dashboard/visitors' },
                ],
                keywords: ['customers', 'contacts', 'users', 'shoppers', 'database', 'audience', 'loyalty']
            }
        ]
    },
    {
        id: 'section-engagement',
        label: 'Customer Engagement',
        items: [
            {
                id: 'in-app-chat',
                label: 'In-App Chat',
                icon: MessageSquare,
                href: '/dashboard/messaging/chat',
                roles: ['owner', 'manager', 'customer_service', 'staff'],
                permission: 'messages',
                keywords: ['chat', 'whatsapp', 'sms', 'email', 'inbox', 'broadcast'],
            },
            {
                id: 'channels',
                label: 'Channels',
                icon: Globe2,
                href: '/dashboard/customer-capture/channels',
                roles: ['owner', 'manager', 'marketing', 'customer_service'],
                permission: 'dashboard',
                keywords: ['qr', 'setup', 'capture', 'link', 'shortlink', 'generator', 'customize'],
            },
            {
                id: 'manage-forms',
                label: 'Forms',
                icon: FileText,
                href: '/dashboard/engagement/forms',
                roles: ['owner', 'manager', 'customer_service', 'staff'],
                permission: 'engagement',
                keywords: ['submissions', 'questionnaires', 'feedback', 'surveys', 'signups', 'templates']
            }
        ]
    },
    {
        id: 'section-experience',
        label: 'Customer Experience',
        items: [
            {
                id: 'my-business-qr',
                label: 'My Business QR',
                icon: QrCode,
                href: '/dashboard/customer-experience',
                roles: ['owner', 'manager', 'marketing', 'staff'],
                permission: 'customer-experience',
                keywords: ['qr', 'code', 'scan', 'setup']
            },
            {
                id: 'marketing-assets',
                label: 'Marketing Kit',
                icon: Palette,
                href: '/dashboard/marketing-assets',
                roles: ['owner', 'manager', 'marketing', 'staff'],
                permission: 'marketing',
                keywords: ['assets', 'printables', 'flyers', 'stickers', 'posters']
            }
        ]
    },
    {
        id: 'section-discovery',
        label: '',
        items: [
            {
                id: 'discovery',
                label: 'Get Customers',
                icon: null,
                href: '/dashboard/discovery',
                roles: ['owner', 'manager', 'marketing'],
                permission: 'discovery',
                keywords: ['network', 'marketplace', 'discovery', 'leads', 'traffic', 'promotions']
            }
        ]
    },
    {
        id: 'section-analytics',
        label: 'Analytics',
        items: [
            {
                id: 'analytics-overview',
                label: 'Advanced Analytics',
                icon: BarChart3,
                href: '/dashboard/analytics',
                roles: ['owner', 'manager'],
                permission: 'analytics',
                submenu: [
                    { label: 'Overview', href: '/dashboard/analytics' },
                    { label: 'Sales Reports', href: '/dashboard/analytics/sales' },
                    { label: 'Inventory Reports', href: '/dashboard/analytics/inventory' },
                ],
                keywords: ['stats', 'overview', 'executive', 'data', 'insights', 'charts']
            },
            {
                id: 'staff',
                label: 'Staff',
                icon: Users2,
                href: '/dashboard/staff',
                roles: ['owner', 'manager'],
                permission: 'staff',
                submenu: [
                    { label: 'Directory', href: '/dashboard/staff' },
                    { label: 'Roles & Permissions', href: '/dashboard/staff/roles' },
                    { label: 'Activity Log', href: '/dashboard/staff/activity' },
                ],
                keywords: ['team', 'employees', 'cashiers', 'managers', 'roles', 'permissions']
            }
        ]
    },
    {
        id: 'section-qrthrive',
        label: 'QRThrive',
        items: [
            {
                id: 'qr-codes',
                label: 'Explore QRThrive',
                icon: QrCode,
                href: '/dashboard/explore-qrthrive',
                roles: ['owner', 'manager', 'marketing', 'staff'],
                permission: 'qrthrive',
            }
        ]
    },
    {
        id: 'section-settings',
        label: 'Settings',
        items: [
            {
                id: 'preferences',
                label: 'Settings',
                icon: Settings,
                href: '/dashboard/settings',
                roles: ['owner', 'manager'],
                permission: 'settings'
            }
        ]
    }
];

export const OWNER_MENU_ITEMS: MenuItem[] = NAVIGATION_SECTIONS.flatMap(s => s.items);

