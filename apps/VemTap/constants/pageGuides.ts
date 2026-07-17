export interface TourStep {
    title: string;
    content: string;
    icon: string;
}

export interface SectionGuide {
    id: string;
    title: string;
    description: string;
    steps: TourStep[];
}

export const PAGE_GUIDES: Record<string, SectionGuide> = {
    '/dashboard': {
        id: 'home',
        title: 'Home Dashboard',
        description: 'Your business command center. Get a real-time snapshot of performance, recent activity, and quick actions.',
        steps: [
            { title: 'Welcome Overview', content: 'See your key metrics at a glance — total customers, active campaigns, revenue generated, and loyalty redemptions. Everything updates in real time.', icon: 'LayoutDashboard' },
            { title: 'Quick Actions', content: 'Jump to common tasks like creating a campaign, viewing recent visitors, or checking your POS sales. These shortcuts save you time every day.', icon: 'Zap' },
            { title: 'Activity Feed', content: 'Stay on top of what matters. See recent customer sign-ups, campaign performance alerts, and system notifications as they happen.', icon: 'Activity' },
            { title: 'Setup Checklist', content: 'New to VemTap? Follow the activation checklist to complete your profile, set up your QR code, create marketing assets, and launch your first campaign.', icon: 'ClipboardCheck' },
        ],
    },
    '/dashboard/pos': {
        id: 'pos',
        title: 'Point of Sale',
        description: 'Process transactions, manage your register, and track sales in real time.',
        steps: [
            { title: 'Start a Sale', content: 'Add products to the cart by scanning barcodes or searching your catalogue. The POS auto-calculates totals, discounts, and taxes.', icon: 'ShoppingBag' },
            { title: 'Payment Processing', content: 'Accept payments via card, cash, or mobile money. Each transaction is logged automatically and synced with your sales reports.', icon: 'CreditCard' },
            { title: 'Customer Lookup', content: 'Attach a sale to a customer profile to earn them loyalty points. Search by name, phone number, or scan their VemTap QR code.', icon: 'Users' },
            { title: 'Register Management', content: 'Open and close your register with cash count tracking. View end-of-day summaries and reconcile discrepancies easily.', icon: 'CashRegister' },
            { title: 'Sales History', content: 'Browse past transactions, issue refunds, and reprint receipts. Every sale is searchable by date, customer, or payment method.', icon: 'Receipt' },
        ],
    },
    '/dashboard/customers': {
        id: 'customers',
        title: 'Customer Directory',
        description: 'Your centralized customer database. View profiles, track engagement, and manage customer relationships.',
        steps: [
            { title: 'Customer Profiles', content: 'Each customer has a rich profile with contact info, visit history, loyalty balance, total spend, and engagement score. Click any customer to see full details.', icon: 'User' },
            { title: 'Search & Filter', content: 'Find customers instantly by name, email, phone, or tag. Use filters to segment by loyalty tier, visit frequency, or last active date.', icon: 'Search' },
            { title: 'Add Customers', content: 'Manually add new customers or import them in bulk via CSV. Customers can also self-register through your QR code or engagement forms.', icon: 'UserPlus' },
            { title: 'Customer Actions', content: 'Send a message, award points, view visit timeline, or update customer details. The three-dot menu on each row gives you quick access to all actions.', icon: 'MoreHorizontal' },
        ],
    },
    '/dashboard/visitors': {
        id: 'visitors',
        title: 'Visitor Tracking',
        description: 'Track who visits your business, how often they return, and what they do during each visit.',
        steps: [
            { title: 'Visit Log', content: 'Every visit is automatically recorded when a customer scans in. See timestamp, duration, items purchased, and referral source for each visit.', icon: 'Footprints' },
            { title: 'New vs Returning', content: 'The dashboard highlights first-time visitors and tracks return rates. Returning customers are your most valuable — watch this metric grow.', icon: 'RefreshCw' },
            { title: 'Visitor Segments', content: 'Group visitors by behavior: VIPs, regulars, at-risk, and lapsed. Use these segments to target your marketing campaigns effectively.', icon: 'Users' },
            { title: 'Import Visitors', content: 'Already have customer data? Import it via CSV to seed your visitor history and start tracking engagement from day one.', icon: 'Upload' },
            { title: 'Visitor Detail', content: 'Click any visitor to see their full timeline — every visit, purchase, loyalty transaction, and campaign interaction in one place.', icon: 'Clock' },
        ],
    },
    '/dashboard/analytics': {
        id: 'analytics',
        title: 'Analytics & Reports',
        description: 'Deep-dive into your business performance with detailed charts, filters, and exportable reports.',
        steps: [
            { title: 'Overview Metrics', content: 'Start with the high-level KPIs: total revenue, customer growth, average spend per visit, and campaign ROI. Use the date range picker to compare periods.', icon: 'BarChart3' },
            { title: 'Sales Analytics', content: 'Track sales trends over time, identify peak hours, and see which products drive the most revenue. Break down by category, payment method, or staff member.', icon: 'TrendingUp' },
            { title: 'Customer Analytics', content: 'Understand your customer base — demographics, visit frequency, lifetime value, and churn risk. Use these insights to personalize your marketing.', icon: 'Users' },
            { title: 'Discovery Analytics', content: 'See how customers find you through the discovery network. Track referral traffic, attribution sources, and the revenue generated from each channel.', icon: 'MapPin' },
            { title: 'Export Reports', content: 'Download any report as PDF or Excel. Schedule automated reports to be sent to your email weekly or monthly.', icon: 'Download' },
        ],
    },
    '/dashboard/loyalty': {
        id: 'loyalty',
        title: 'Loyalty Programs',
        description: 'Build customer loyalty with points, rewards, and tiered programs that keep customers coming back.',
        steps: [
            { title: 'Loyalty Dashboard', content: 'See total points issued, redemptions, active members, and program ROI at a glance. The overview cards show your program health in real time.', icon: 'Gift' },
            { title: 'Points & Rewards', content: 'Configure how customers earn points (per naira spent, per visit, referral bonuses) and what they can redeem. Set up reward tiers for your best customers.', icon: 'Star' },
            { title: 'Redemption Center', content: 'Process loyalty redemptions at the POS or through the dashboard. Each redemption is logged with the customer, item redeemed, and points deducted.', icon: 'Check' },
            { title: 'Program Settings', content: 'Customize your loyalty program: point expiry rules, tier thresholds, birthday bonuses, and welcome rewards. Fine-tune to match your business model.', icon: 'Settings' },
        ],
    },
    '/dashboard/engagement': {
        id: 'engagement',
        title: 'Customer Engagement',
        description: 'Create interactive forms, social media integrations, and capture experiences that delight customers.',
        steps: [
            { title: 'Engagement Hub', content: 'This is your creative control center. Design how customers interact with your brand — from QR code scans to social media follows to feedback forms.', icon: 'Layout' },
            { title: 'Custom Forms', content: 'Build registration forms, surveys, and feedback forms with a drag-and-drop editor. Each form can trigger automations when submitted.', icon: 'FileText' },
            { title: 'Social Integration', content: 'Connect your social media accounts and create scan-to-follow experiences. Turn every QR scan into a new follower across Instagram, TikTok, and more.', icon: 'Share2' },
            { title: 'Appearance & Branding', content: 'Customize the look and feel of your customer-facing experiences. Upload your logo, set brand colors, and preview before going live.', icon: 'Palette' },
            { title: 'Preview & Test', content: 'Preview exactly what customers see before publishing. Test the scan experience on your own phone to make sure everything works perfectly.', icon: 'Eye' },
        ],
    },
    '/dashboard/messaging': {
        id: 'messaging',
        title: 'Messaging Center',
        description: 'Send SMS, email, WhatsApp, and in-app messages to your customers. Manage templates and track delivery.',
        steps: [
            { title: 'Channel Overview', content: 'Choose your messaging channel: SMS for reach, Email for rich content, WhatsApp for conversations, or In-App for engaged users. Each channel has its own settings and credits.', icon: 'MessageSquare' },
            { title: 'Compose Message', content: 'Create a new message by selecting the channel, choosing recipients (all customers, segments, or individuals), and writing your content with personalization tokens.', icon: 'Send' },
            { title: 'Templates', content: 'Save time with reusable templates for common messages — welcome series, birthday rewards, promotional blasts, and order confirmations. Use variables like {first_name} for personalization.', icon: 'FileText' },
            { title: 'Credits & Billing', content: 'Each channel uses credits. Monitor your balance, top up when low, and set spending limits to avoid surprises. SMS and WhatsApp are pay-per-message.', icon: 'CreditCard' },
            { title: 'Message History', content: 'Track every message sent — delivery status, open rates, click rates, and replies. Use this data to optimize your messaging strategy over time.', icon: 'Clock' },
        ],
    },
    '/dashboard/marketing-assets': {
        id: 'marketing-assets',
        title: 'Marketing Assets',
        description: 'Create and manage branded digital assets — flyers, social posts, banners, and promotional materials.',
        steps: [
            { title: 'Asset Library', content: 'Browse your collection of marketing materials. Assets are organized by category and type. Use the search and filter to find what you need quickly.', icon: 'Folder' },
            { title: 'Create New Asset', content: 'Design new marketing materials using templates or start from scratch. Add your branding, text, and images to create professional-looking assets.', icon: 'Plus' },
            { title: 'Categories', content: 'Organize assets by type: social media posts, flyers, banners, email headers, and more. Categories help your team find the right asset fast.', icon: 'Tag' },
            { title: 'Share & Distribute', content: 'Download assets for manual sharing or generate shareable links. Assets can be auto-included in customer communications and campaigns.', icon: 'Share2' },
        ],
    },
    '/dashboard/catalogue': {
        id: 'catalogue',
        title: 'Product Catalogue',
        description: 'Manage your products, services, menus, and pricing. Keep your inventory synced across all channels.',
        steps: [
            { title: 'Product List', content: 'See all your products in one place with images, prices, stock status, and categories. Use the grid or list view to browse your catalogue.', icon: 'Package' },
            { title: 'Add Products', content: 'Create new products with images, descriptions, pricing, and variants. Set up product categories to keep your catalogue organized.', icon: 'Plus' },
            { title: 'Menus & Services', content: 'For restaurants and service businesses, set up menus with items, modifiers, and pricing.Menus can be synced to your POS and customer-facing apps.', icon: 'BookOpen' },
            { title: 'Orders Management', content: 'View and manage incoming orders from all channels. Update order status, add notes, and notify customers when their order is ready.', icon: 'ShoppingCart' },
            { title: 'Import & Export', content: 'Bulk import products via CSV or export your catalogue for use in other systems. Keep your data in sync across platforms.', icon: 'Upload' },
        ],
    },
    '/dashboard/inventory': {
        id: 'inventory',
        title: 'Inventory Management',
        description: 'Track stock levels, manage adjustments, and get alerts when items are running low.',
        steps: [
            { title: 'Stock Overview', content: 'See current stock levels for all products at a glance. Low-stock items are highlighted in red so you never run out of popular products.', icon: 'Package' },
            { title: 'Stock Adjustments', content: 'Record stock changes from sales, returns, damage, or audits. Every adjustment is logged with a reason for full traceability.', icon: 'Edit' },
            { title: 'Low Stock Alerts', content: 'Set minimum stock thresholds for each product. When stock drops below the threshold, you get an alert so you can reorder in time.', icon: 'AlertTriangle' },
            { title: 'Stock History', content: 'View the complete history of stock movements for any product. Filter by date range, adjustment type, or staff member who made the change.', icon: 'Clock' },
            { title: 'Receiving', content: 'Log incoming stock from suppliers. Scan items or enter quantities to update your inventory counts instantly.', icon: 'Truck' },
        ],
    },
    '/dashboard/referrals': {
        id: 'referrals',
        title: 'Referral Program',
        description: 'Turn your customers into advocates. Track referrals, reward referrers, and grow through word-of-mouth.',
        steps: [
            { title: 'Referral Dashboard', content: 'See total referrals, conversion rate, top referrers, and revenue generated from referrals. The overview shows your program performance at a glance.', icon: 'Users' },
            { title: 'Unique Referral Link', content: 'Each customer gets a unique referral link. Share it via SMS, WhatsApp, or social media. When someone signs up through the link, the referrer gets rewarded.', icon: 'Link' },
            { title: 'Tracking & Attribution', content: 'Track every referral from share to conversion. See which customers refer the most, which channels work best, and the lifetime value of referred customers.', icon: 'BarChart3' },
            { title: 'Earnings & Payouts', content: 'View referral earnings by period and track pending vs. completed payouts. Set up automatic payouts or process them manually.', icon: 'DollarSign' },
        ],
    },
    '/dashboard/business-partnership': {
        id: 'partnerships',
        title: 'Business Partnerships',
        description: 'Collaborate with other businesses to share customers, cross-promote, and grow together.',
        steps: [
            { title: 'Partnership Network', content: 'View your active partnerships and discover new businesses to collaborate with. The network shows partner businesses, shared customers, and joint revenue.', icon: 'Users' },
            { title: 'Agreements', content: 'Create and manage partnership agreements. Define terms, commission splits, shared offers, and duration. Both parties must agree before a partnership goes live.', icon: 'FileText' },
            { title: 'Partner Rewards', content: 'Set up reward structures for cross-referrals. Earn points or commissions when you send customers to partner businesses (and vice versa).', icon: 'Gift' },
            { title: 'Analytics & Leaderboard', content: 'See which partnerships drive the most value. The leaderboard ranks your top partners by shared customers, revenue generated, and engagement.', icon: 'Trophy' },
            { title: 'Wallet & Earnings', content: 'Track your partnership earnings in the wallet. View transaction history, pending payouts, and withdraw earnings to your bank account.', icon: 'Wallet' },
        ],
    },
    '/dashboard/automations': {
        id: 'automations',
        title: 'Automations',
        description: 'Set up automated workflows that run in the background — welcome messages, birthday rewards, re-engagement campaigns, and more.',
        steps: [
            { title: 'Automation Dashboard', content: 'See all your active automations, their performance metrics, and recent trigger history. The overview shows what is running and what needs attention.', icon: 'Zap' },
            { title: 'Create Automation', content: 'Build automations with a trigger → condition → action model. For example: "When a customer visits for the first time → send a welcome SMS with a 10% discount."', icon: 'Plus' },
            { title: 'Templates', content: 'Start with pre-built templates: welcome series, birthday rewards, win-back campaigns, and milestone celebrations. Customize them to match your brand.', icon: 'Layout' },
            { title: 'Logs & Performance', content: 'View detailed logs of every automation trigger. See how many customers were reached, conversion rates, and revenue generated per automation.', icon: 'BarChart3' },
        ],
    },
    '/dashboard/staff': {
        id: 'staff',
        title: 'Staff Management',
        description: 'Manage your team members, assign roles, and track staff activity and performance.',
        steps: [
            { title: 'Staff Directory', content: 'View all staff members with their roles, status, and last active time. Add new team members or deactivate accounts you no longer need.', icon: 'Users' },
            { title: 'Roles & Permissions', content: 'Assign roles like Admin, Manager, Cashier, or Staff. Each role has different access levels to protect sensitive data while giving staff what they need.', icon: 'Shield' },
            { title: 'Activity Logs', content: 'Track what each staff member does — sales processed, messages sent, settings changed. This helps with accountability and training.', icon: 'Clock' },
            { title: 'Invite Staff', content: 'Send email invitations to new team members. They will create their own account and get access based on the role you assign.', icon: 'UserPlus' },
        ],
    },
    '/dashboard/settings': {
        id: 'settings',
        title: 'Settings',
        description: 'Configure your business profile, subscription, privacy preferences, and account settings.',
        steps: [
            { title: 'Business Profile', content: 'Update your business name, logo, contact info, category, and description. This information appears on your public profile and in the discovery network.', icon: 'Building' },
            { title: 'Branches & Locations', content: 'Manage multiple business locations. Each branch has its own settings, staff, and inventory. Switch between branches from the sidebar.', icon: 'MapPin' },
            { title: 'Subscription', content: 'View your current plan, usage limits, and billing history. Upgrade or downgrade your plan as your business grows.', icon: 'CreditCard' },
            { title: 'Privacy & Security', content: 'Control data retention, two-factor authentication, and notification preferences. Keep your account and customer data secure.', icon: 'Lock' },
        ],
    },
    '/dashboard/support': {
        id: 'support',
        title: 'Help & Support',
        description: 'Get help when you need it. Contact support, browse FAQs, or manage your support tickets.',
        steps: [
            { title: 'Support Dashboard', content: 'See your open tickets, recent responses, and support status. The dashboard gives you a quick overview of any unresolved issues.', icon: 'HelpCircle' },
            { title: 'Create Ticket', content: 'Have a question or issue? Create a support ticket with a description and screenshots. Our team typically responds within a few hours.', icon: 'MessageSquare' },
            { title: 'Knowledge Base', content: 'Browse articles and guides organized by topic. Most common questions are answered here, and new articles are added regularly.', icon: 'BookOpen' },
            { title: 'Live Chat', content: 'Need immediate help? Start a live chat with our support team. Available during business hours for real-time assistance.', icon: 'MessageCircle' },
        ],
    },
    '/dashboard/devices': {
        id: 'devices',
        title: 'Device Management',
        description: 'Manage POS terminals, tablets, and other devices connected to your VemTap account.',
        steps: [
            { title: 'Connected Devices', content: 'See all devices linked to your account with their status, last seen time, and assigned branch. Each device can be named for easy identification.', icon: 'Smartphone' },
            { title: 'Register Device', content: 'Connect a new device by scanning the QR code from your VemTap app or entering the pairing code. Only authorized devices can access your data.', icon: 'QrCode' },
            { title: 'Device Settings', content: 'Configure device-specific settings like receipt printers, barcode scanners, and cash drawers. Each device can have its own hardware configuration.', icon: 'Settings' },
            { title: 'Security', content: 'Remotely lock or wipe a lost device. View login history and revoke access for any device instantly from the dashboard.', icon: 'Shield' },
        ],
    },
    '/dashboard/feedback': {
        id: 'feedback',
        title: 'Customer Feedback',
        description: 'Collect and analyze customer feedback to improve your products, services, and experience.',
        steps: [
            { title: 'Feedback Overview', content: 'See all submitted feedback in one place with ratings, categories, and sentiment analysis. The summary cards show average rating and response rate.', icon: 'MessageSquare' },
            { title: 'Rating Breakdown', content: 'View the distribution of ratings from 1 to 5 stars. Identify trends and see which areas of your business need the most attention.', icon: 'Star' },
            { title: 'Respond to Feedback', content: 'Reply to customer feedback directly from the dashboard. Thank positive reviewers and address concerns from negative feedback promptly.', icon: 'Reply' },
            { title: 'Categories & Tags', content: 'Organize feedback by category: service, product, ambiance, value, and more. Use tags to track recurring themes and prioritize improvements.', icon: 'Tag' },
        ],
    },
    '/dashboard/sales': {
        id: 'sales',
        title: 'Sales Overview',
        description: 'Track your revenue, transactions, and sales performance across all channels.',
        steps: [
            { title: 'Revenue Dashboard', content: 'See your total revenue, average transaction value, and revenue trends over time. The chart shows daily, weekly, and monthly performance.', icon: 'TrendingUp' },
            { title: 'Transaction List', content: 'Browse all transactions with details: amount, payment method, items purchased, and staff member. Click any transaction for full details.', icon: 'List' },
            { title: 'Sales by Channel', content: 'Compare sales across POS, online, and in-app channels. Identify which channel drives the most revenue and optimize accordingly.', icon: 'BarChart3' },
            { title: 'Peak Hours & Days', content: 'Discover when your busiest times are. Use this data to optimize staffing, schedule promotions, and plan inventory restocking.', icon: 'Clock' },
        ],
    },
    '/dashboard/commerce': {
        id: 'commerce',
        title: 'Commerce',
        description: 'Manage your online store, payment methods, and e-commerce integrations.',
        steps: [
            { title: 'Storefront', content: 'Set up your online store with products, pricing, and checkout. Customers can browse and purchase directly from your VemTap-powered storefront.', icon: 'Store' },
            { title: 'Payment Methods', content: 'Configure accepted payment methods: cards, bank transfers, mobile money, and cash on delivery. Each method has its own processing fees and settlement times.', icon: 'CreditCard' },
            { title: 'Orders & Fulfillment', content: 'View incoming online orders, update their status (processing, shipped, delivered), and notify customers at each step.', icon: 'Package' },
            { title: 'Shipping Settings', content: 'Set up delivery zones, shipping rates, and pickup options. Offer free shipping thresholds to increase average order value.', icon: 'Truck' },
        ],
    },
    '/dashboard/explore-qrthrive': {
        id: 'explore-qrthrive',
        title: 'Explore QRThrive',
        description: 'Discover the QRThrive ecosystem — leads, integrations, and SSO connections.',
        steps: [
            { title: 'Lead Generation', content: 'QRThrive helps you capture leads through QR code scans. View all captured leads with their contact info and scan context.', icon: 'UserPlus' },
            { title: 'SSO Integrations', content: 'Connect your VemTap account to other platforms via Single Sign-On. One login gives you access to integrated tools and services.', icon: 'Key' },
            { title: 'Analytics', content: 'Track QR code performance — total scans, unique users, conversion rates, and geographic distribution of your scan traffic.', icon: 'BarChart3' },
        ],
    },
    '/dashboard/notifications': {
        id: 'notifications',
        title: 'Notifications',
        description: 'Stay informed with real-time alerts about your business activity.',
        steps: [
            { title: 'Notification Feed', content: 'See all your notifications in chronological order. Unread notifications are highlighted so you never miss important updates.', icon: 'Bell' },
            { title: 'Notification Types', content: 'Notifications cover customer activity, campaign performance, system alerts, and staff actions. Each type is visually distinct for quick scanning.', icon: 'Filter' },
            { title: 'Manage Preferences', content: 'Control which notifications you receive and how. Choose between in-app, email, and push notifications for different alert types.', icon: 'Settings' },
        ],
    },
    '/dashboard/more': {
        id: 'more',
        title: 'More Features',
        description: 'Additional tools and features available for your business.',
        steps: [
            { title: 'Additional Modules', content: 'This section houses extra features and integrations that complement the core dashboard. Explore what is available for your plan tier.', icon: 'Grid' },
            { title: 'Feature Requests', content: 'Have an idea for a new feature? Submit it from here. We prioritize features based on customer demand and business impact.', icon: 'Lightbulb' },
        ],
    },
    '/dashboard/products-stock': {
        id: 'products-stock',
        title: 'Products & Stock',
        description: 'Combined view of your product catalogue and inventory levels.',
        steps: [
            { title: 'Product Overview', content: 'See all products with their current stock levels in a single view. Quickly identify items that need restocking or price adjustments.', icon: 'Package' },
            { title: 'Quick Edit', content: 'Edit product details, prices, and stock counts directly from this view without navigating to individual product pages.', icon: 'Edit' },
            { title: 'Bulk Actions', content: 'Select multiple products to update prices, adjust stock, change categories, or export data in bulk.', icon: 'CheckSquare' },
        ],
    },
    '/dashboard/business-link': {
        id: 'business-link',
        title: 'Business Link',
        description: 'Share your business profile via a unique link. Customers can view your info, products, and offers.',
        steps: [
            { title: 'Your Link', content: 'Your unique business link (vemtap.com/your-business) is your digital storefront. Share it on social media, in messages, or on printed materials.', icon: 'Link' },
            { title: 'Customize', content: 'Customize what appears on your public page: business info, product showcase, offers, and contact options. Make it match your brand.', icon: 'Palette' },
            { title: 'Share & Track', content: 'Share your link and track how many people view it, what they click on, and how many convert to customers.', icon: 'BarChart3' },
        ],
    },
};

export function getGuideForPath(pathname: string): SectionGuide | null {
    const sortedKeys = Object.keys(PAGE_GUIDES).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
        if (pathname === key || pathname.startsWith(key + '/')) {
            return PAGE_GUIDES[key];
        }
    }
    return null;
}
