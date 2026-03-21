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

export default function ProfileTabs({ tabs, activeTab, onChange }: ProfileTabsProps) {
    const containerId = 'profile-tabs-container';

    return (
        <div className="relative mb-8">
            <div className="absolute left-0 top-0 bottom-2 z-10">
                <button
                    onClick={() =>
                        document.getElementById(containerId)?.scrollBy({ left: -200, behavior: 'smooth' })
                    }
                    className="h-full px-2 bg-white border-r border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                >
                    <span className="material-icons-round text-gray-400">chevron_left</span>
                </button>
            </div>
            <div
                id={containerId}
                className="flex items-center gap-1 overflow-x-auto scroll-smooth pb-2 border-b border-gray-100 px-10"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-text-secondary hover:bg-gray-50'
                        }`}
                    >
                        <span className="material-icons-round text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="absolute right-0 top-0 bottom-2 z-10">
                <button
                    onClick={() =>
                        document.getElementById(containerId)?.scrollBy({ left: 200, behavior: 'smooth' })
                    }
                    className="h-full px-2 bg-white border-l border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                >
                    <span className="material-icons-round text-gray-400">chevron_right</span>
                </button>
            </div>
        </div>
    );
}
