type PushNotificationsTabProps = {
    pushSupported: boolean;
    pushPermission: NotificationPermission;
    pushSubscribed: boolean;
    pushLoading: boolean;
    pushError: string | null;
    vapidPublicKey: string;
    onEnable: () => void;
    onDisable: () => void;
    supportEmail?: string;
};

export default function PushNotificationsTab({
    pushSupported,
    pushPermission,
    pushSubscribed,
    pushLoading,
    pushError,
    vapidPublicKey,
    onEnable,
    onDisable,
    supportEmail,
}: PushNotificationsTabProps) {
    const notificationTypes = [
        {
            title: 'New Visitor Alerts',
            desc: 'Get notified as soon as a customer taps your NFC device',
            channels: ['Browser', 'Email']
        },
        {
            title: 'Daily Summary',
            desc: 'Receive a summary of your daily footfall and message performance',
            channels: ['Email']
        },
        {
            title: 'Device Issues',
            desc: 'Alerts if a device goes offline for more than 15 minutes',
            channels: ['Email', 'SMS']
        },
        {
            title: 'Message Reports',
            desc: 'Final reports when a message is completed',
            channels: ['Email']
        },
        {
            title: 'Weekly Insights',
            desc: 'Deep dive into your weekly growth and retention metrics',
            channels: ['Email']
        },
    ];

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Push Notifications</h3>
                        <p className="text-xs text-text-secondary mt-1">
                            Enable browser notifications for new messages and alerts.
                        </p>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            pushSupported
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                    >
                        {pushSupported ? 'Supported' : 'Unsupported'}
                    </span>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Permission</p>
                            <p className="text-sm font-bold text-text-main capitalize">{pushPermission}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Status</p>
                            <p className="text-sm font-bold text-text-main">{pushSubscribed ? 'Enabled' : 'Not enabled'}</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Delivery</p>
                            <p className="text-sm font-bold text-text-main">Browser push</p>
                        </div>
                    </div>

                    {pushPermission === 'denied' && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-700 font-medium">
                            Notifications are blocked in your browser settings. Enable them to receive push alerts.
                        </div>
                    )}

                    {pushError && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-xs text-red-600 font-medium">
                            {pushError}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {pushSubscribed ? (
                            <button
                                onClick={onDisable}
                                disabled={pushLoading}
                                className="h-11 px-5 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-50 disabled:opacity-60"
                            >
                                {pushLoading ? 'Updating...' : 'Disable Push'}
                            </button>
                        ) : (
                            <button
                                onClick={onEnable}
                                disabled={pushLoading || !pushSupported}
                                className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-60"
                            >
                                {pushLoading ? 'Enabling...' : 'Enable Push'}
                            </button>
                        )}
                    </div>

                    {!vapidPublicKey && (
                        <p className="text-[11px] text-text-secondary">
                            Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to enable browser push subscriptions.
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Notification Settings</h3>
                    <p className="text-xs text-text-secondary mt-1">
                        Choose how and when you want to stay updated.
                    </p>
                </div>
                <div className="divide-y divide-gray-100">
                    {notificationTypes.map((item, i) => (
                        <div key={i} className="p-8 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex-1 pr-8">
                                <h3 className="font-bold text-text-main mb-1">{item.title}</h3>
                                <p className="text-sm text-text-secondary font-medium">{item.desc}</p>
                                <div className="mt-3 flex gap-2">
                                    {item.channels.map((ch, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-gray-100 text-[10px] font-black uppercase tracking-widest text-text-secondary rounded">
                                            {ch}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {supportEmail && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                    <span className="material-icons-round text-primary mt-1">info</span>
                    <div>
                        <p className="font-bold text-blue-900 mb-1">Email Delivery</p>
                        <p className="text-sm text-blue-800 leading-relaxed font-medium">
                            Notifications are sent to <strong className="font-black underline decoration-primary/30 text-primary">{supportEmail}</strong>. 
                            You can change this in your profile settings above.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
