type PushNotificationsTabProps = {
    pushSupported: boolean;
    pushPermission: NotificationPermission;
    pushSubscribed: boolean;
    pushLoading: boolean;
    pushError: string | null;
    vapidPublicKey: string;
    onEnable: () => void;
    onDisable: () => void;
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
}: PushNotificationsTabProps) {
    return (
        <div className="space-y-6">
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
        </div>
    );
}
