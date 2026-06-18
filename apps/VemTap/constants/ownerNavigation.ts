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
        label: 'Main',
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
        id: 'section-customers',
        label: 'Customers',
        items: [
            {
                id: 'visitors',
                label: 'Visitors',
                icon: Users,
                roles: ['owner', 'manager', 'customer_service', 'staff'],
                permission: 'visitors',
                href: '/dashboard/visitors',
                keywords: ['customers', 'contacts', 'users', 'shoppers', 'database', 'audience']
            },
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
                id: 'loyalty',
                label: 'Loyalty',
                icon: Gift,
                href: '/dashboard/loyalty',
                roles: ['owner', 'manager', 'customer_service', 'staff'],
                permission: 'loyalty',
                feature: 'loyalty',
                featureName: 'Loyalty Programs',
                keywords: ['rewards', 'points', 'stamps', 'cards', 'memberships', 'gift', 'coupons', 'discounts']
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
        id: 'section-commerce',
        label: 'Commerce',
        items: [
            {
                id: 'catalogue',
                label: 'Catalogue',
                icon: ShoppingBag,
                href: '/dashboard/catalogue',
                roles: ['owner', 'manager', 'inventory'],
                permission: 'catalogue',
                feature: 'catalogue',
                featureName: 'Catalogue',
                keywords: ['products', 'offers', 'categories', 'orders', 'bookings', 'shop', 'storefront', 'items']
            },
            {
                id: 'inventory',
                label: 'Inventory',
                icon: Package,
                href: '/dashboard/inventory',
                roles: ['owner', 'manager', 'inventory'],
                permission: 'inventory',
                keywords: ['stock', 'items', 'products', 'inventory', 'warehouse', 'reorder'],
            },
            {
                id: 'pos',
                label: 'POS',
                icon: CreditCard,
                href: '/dashboard/pos',
                roles: ['owner', 'manager', 'cashier', 'staff'],
                permission: 'pos',
                keywords: ['pos', 'checkout', 'register', 'sales', 'transaction'],
            },
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
                label: 'Marketing Assets',
                icon: Palette,
                href: '/dashboard/marketing-assets',
                roles: ['owner', 'manager', 'marketing', 'staff'],
                permission: 'marketing',
                keywords: ['assets', 'printables', 'flyers', 'stickers', 'posters']
            },
            {
                id: 'discovery',
                label: 'Discovery Network',
                icon: Globe,
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
                keywords: ['stats', 'overview', 'executive', 'data', 'insights', 'charts']
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

