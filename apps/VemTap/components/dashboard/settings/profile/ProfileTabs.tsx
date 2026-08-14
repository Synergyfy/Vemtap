import { Store, MessagesSquare, Bell, Calendar, Share2, Gift, QrCode, FileText } from 'lucide-react';

type ProfileTab = {
    id: string;
    label: string;
    icon: string;
};

type ProfileTabsProps = {
    tabs: ProfileTab[];
    activeTab: string;
    onChange: (tabId: string) => void;
};

const ICONS: Record<string, React.ElementType> = {
    business: Store,
    phone: MessagesSquare,
    notifications_active: Bell,
    calendar_today: Calendar,
    share: Share2,
    auto_awesome: Gift,
    qr_code_2: QrCode,
    description: FileText,
};

export default function ProfileTabs({ tabs, activeTab, onChange }: ProfileTabsProps) {
    const containerId = 'profile-tabs-container';

    return (
        <div className="relative mb-8">
            <div className="absolute left-0 top-0 bottom-2 z-10">
                <button
                    onClick={() =>
                        document.getElementById(containerId)?.scrollBy({ left: -200, behavior: 'smooth' })
                    }
                    className="h-full px-2 bg-white border-r border-gray-100 hover:bg-gray-50 flex items-center justify-center rounded-xl"
                    aria-label="Scroll tabs left"
                >
                    <span className="material-icons-round text-gray-400">chevron_left</span>
                </button>
            </div>
            <div
                id={containerId}
                className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 px-10"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
                {tabs.map((tab) => {
                    const Icon = ICONS[tab.icon] || Store;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border ${
                                isActive
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/15'
                                    : 'bg-white text-text-secondary border-gray-100 hover:border-primary/30 hover:text-primary hover:bg-primary/5'
                            }`}
                        >
                            <Icon size={15} strokeWidth={2.2} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <div className="absolute right-0 top-0 bottom-2 z-10">
                <button
                    onClick={() =>
                        document.getElementById(containerId)?.scrollBy({ left: 200, behavior: 'smooth' })
                    }
                    className="h-full px-2 bg-white border-l border-gray-100 hover:bg-gray-50 flex items-center justify-center rounded-xl"
                    aria-label="Scroll tabs right"
                >
                    <span className="material-icons-round text-gray-400">chevron_right</span>
                </button>
            </div>
        </div>
    );
}