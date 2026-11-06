import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, XCircle, RotateCw, Send, ShieldCheck, Globe, HelpCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { detectBrowser, type BrowserInfo } from '@/lib/pushNotifications';

type PushNotificationsTabProps = {
    pushSupported: boolean;
    pushPermission: NotificationPermission;
    pushSubscribed: boolean;
    pushLoading: boolean;
    pushError: string | null;
    vapidPublicKey: string | null;
    onEnable: () => void;
    onDisable: () => void;
    onRefresh: () => void;
    onTest?: () => void;
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
    onRefresh,
    onTest,
    supportEmail,
}: PushNotificationsTabProps) {
    const [currentOrigin, setCurrentOrigin] = useState('');
    const [isSecure, setIsSecure] = useState(true);
    const [browser, setBrowser] = useState<BrowserInfo | null>(null);
    const [copied, setCopied] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentOrigin(window.location.origin);
            setIsSecure(window.isSecureContext);
            setBrowser(detectBrowser());
        }
    }, []);

    const handleCopyOrigin = () => {
        if (typeof navigator !== 'undefined' && currentOrigin) {
            navigator.clipboard.writeText(currentOrigin);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Push Notifications</h3>
                            <p className="text-xs text-text-secondary mt-0.5">
                                Enable instant browser notifications for real-time customer taps and alerts.
                            </p>
                        </div>
                    </div>
                    <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            pushSupported
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                    >
                        {pushSupported ? 'Device Supported' : 'Unsupported'}
                    </span>
                </div>

                <div className="p-8 space-y-6">
                    {/* Diagnostic Bar */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Globe size={15} className="text-slate-500" />
                            <span className="font-medium text-slate-500">Current Site Origin:</span>
                            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-bold text-slate-900">
                                {currentOrigin || 'loading...'}
                            </code>
                            <button
                                onClick={handleCopyOrigin}
                                className="p-1 rounded hover:bg-slate-200 text-slate-500 transition"
                                title="Copy origin URL"
                            >
                                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 font-semibold ${isSecure ? 'text-emerald-700' : 'text-amber-700'}`}>
                                <span className={`size-1.5 rounded-full ${isSecure ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {isSecure ? 'Secure Context (Active)' : 'Insecure Context (Requires HTTPS)'}
                            </span>
                            <button
                                onClick={() => setShowGuide(!showGuide)}
                                className="inline-flex items-center gap-1 text-primary hover:underline font-bold"
                            >
                                <HelpCircle size={13} />
                                {showGuide ? 'Hide Help' : 'Troubleshoot Browser Settings'}
                            </button>
                        </div>
                    </div>

                    {/* Troubleshooting Guide Box */}
                    {showGuide && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-xs text-blue-950 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                                    <HelpCircle size={16} className="text-primary" />
                                    Why is my browser not showing the notification prompt?
                                </h4>
                                <button
                                    onClick={() => setShowGuide(false)}
                                    className="text-blue-600 hover:text-blue-800 font-bold"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                <div className="bg-white rounded-xl p-3.5 border border-blue-100 space-y-1.5 shadow-2xs">
                                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                                        <span className="size-4 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[10px]">1</span>
                                        Check the Address Bar
                                    </p>
                                    <p className="text-slate-600 leading-relaxed">
                                        Look for <strong>{browser?.addressBarIconHint ?? 'the permission icon in your address bar'}</strong>. Click it, set <strong>Notifications</strong> to <strong>Allow</strong>, then reload.
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-3.5 border border-blue-100 space-y-1.5 shadow-2xs">
                                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                                        <span className="size-4 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[10px]">2</span>
                                        Add to Allowed List
                                    </p>
                                    <p className="text-slate-600 leading-relaxed">
                                        Open {browser?.settingsLabel ? (
                                            <code className="text-slate-800 font-mono bg-slate-100 px-1 rounded">{browser.settingsLabel}</code>
                                        ) : (
                                            'your browser notification settings'
                                        )}{' '}
                                        and, under <strong>Allowed to send notifications</strong>, click <strong>Add</strong> and paste <code className="text-primary font-mono">{currentOrigin}</code>.
                                    </p>
                                </div>
                                <div className="bg-white rounded-xl p-3.5 border border-blue-100 space-y-1.5 shadow-2xs">
                                    <p className="font-bold text-blue-900 flex items-center gap-1.5">
                                        <span className="size-4 rounded-full bg-blue-100 text-primary flex items-center justify-center text-[10px]">3</span>
                                        System Notifications
                                    </p>
                                    <p className="text-slate-600 leading-relaxed">
                                        If <strong>Focus Assist / Do Not Disturb</strong> is active, or notifications for {browser?.name ?? 'your browser'} are turned off in your OS settings, prompts and alerts are silenced.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Permission Status Box */}
                        <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Browser Permission</p>
                            <div className="flex items-center gap-2">
                                {pushPermission === 'granted' && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                                {pushPermission === 'denied' && <XCircle size={16} className="text-rose-500 shrink-0" />}
                                {pushPermission === 'default' && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                                <p className="text-sm font-bold text-text-main capitalize">
                                    {pushPermission === 'granted' ? 'Allowed' : pushPermission === 'denied' ? 'Blocked' : 'Ask (Default)'}
                                </p>
                            </div>
                        </div>

                        {/* Subscription Status Box */}
                        <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Push Service</p>
                            <div className="flex items-center gap-2">
                                {pushSubscribed ? (
                                    <>
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <p className="text-sm font-bold text-emerald-600">Active & Connected</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="size-2 rounded-full bg-gray-400 shrink-0" />
                                        <p className="text-sm font-bold text-gray-500">Not Subscribed</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Delivery Method Box */}
                        <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Delivery Protocol</p>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={16} className="text-primary shrink-0" />
                                <p className="text-sm font-bold text-text-main">Web Push (VAPID)</p>
                            </div>
                        </div>
                    </div>

                    {/* Blocked Permission Banner */}
                    {pushPermission === 'denied' && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-900 space-y-3">
                            <div className="flex items-start gap-3">
                                <XCircle size={20} className="text-rose-600 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-rose-900">Notifications are blocked in {browser?.name ?? 'your browser'}</h4>
                                    <p className="text-xs text-rose-700 leading-relaxed">
                                        {browser?.name ?? 'Your browser'} is currently configured to block notifications for <strong>{currentOrigin}</strong>.
                                    </p>
                                    <ol className="text-xs text-rose-800 list-decimal list-inside space-y-1 mt-2 font-medium">
                                        <li>Click <strong>{browser?.addressBarIconHint ?? 'the permission icon in the address bar'}</strong>.</li>
                                        <li>Change <strong>Notifications</strong> from &quot;Block&quot; to <strong>&quot;Allow&quot;</strong>, or add this site to the <strong>Allowed</strong> list under {browser?.settingsLabel ?? 'your browser notification settings'}.</li>
                                        <li>Click <strong>Re-check Status</strong> below to apply.</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={onRefresh}
                                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm"
                                >
                                    <RotateCw size={14} />
                                    Re-check Status
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Default/Ask Permission Advice Banner */}
                    {pushPermission === 'default' && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Click <strong>Enable Push Notifications</strong> below to request permission.
                                    </p>
                                    <p className="text-[11px] text-amber-700">
                                        If no popup appears, {browser?.name ?? 'your browser'} may be silencing prompts. Check {browser?.addressBarIconHint ?? 'the permission icon in the address bar'}, or add <code className="font-mono bg-amber-100 px-1 rounded">{currentOrigin}</code> to your <strong>Allowed to send notifications</strong> list{browser?.settingsLabel ? ` (${browser.settingsLabel})` : ''}.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onRefresh}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 shrink-0 transition"
                            >
                                <RotateCw size={12} />
                                Re-check
                            </button>
                        </div>
                    )}

                    {/* Granted Banner */}
                    {pushPermission === 'granted' && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-900 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                <p className="text-xs text-emerald-800 font-medium">
                                    Browser permission is granted. {pushSubscribed ? 'Push notifications are active on this device.' : 'Click "Enable Push" to activate.'}
                                </p>
                            </div>
                            {pushSubscribed && onTest && (
                                <button
                                    onClick={onTest}
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shrink-0"
                                >
                                    <Send size={12} />
                                    Send Test
                                </button>
                            )}
                        </div>
                    )}

                    {/* Error Banner */}
                    {pushError && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-medium flex items-start gap-3">
                            <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                            <div className="flex-1 space-y-1">
                                <p className="font-bold text-red-800">Status Notice</p>
                                <p>{pushError}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        {pushSubscribed ? (
                            <>
                                <button
                                    onClick={onDisable}
                                    disabled={pushLoading}
                                    className="h-11 px-5 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-50 disabled:opacity-60 transition"
                                >
                                    {pushLoading ? 'Updating...' : 'Disable Push'}
                                </button>
                                {onTest && (
                                    <button
                                        onClick={onTest}
                                        disabled={pushLoading}
                                        className="h-11 px-5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/10 transition flex items-center gap-2"
                                    >
                                        <Send size={14} />
                                        Test Notification
                                    </button>
                                )}
                            </>
                        ) : pushPermission === 'denied' ? (
                            <>
                                <button
                                    onClick={onRefresh}
                                    className="h-11 px-6 rounded-xl bg-gray-200 text-gray-500 text-xs font-black uppercase tracking-widest transition flex items-center gap-2 cursor-not-allowed"
                                    disabled
                                >
                                    <XCircle size={15} />
                                    Blocked in Browser
                                </button>
                                <button
                                    onClick={onRefresh}
                                    className="h-11 px-5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/10 transition flex items-center gap-2"
                                >
                                    <RotateCw size={14} />
                                    Re-check Status
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onEnable}
                                disabled={pushLoading || !pushSupported}
                                className="h-11 px-6 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-60 transition flex items-center gap-2"
                            >
                                <Bell size={15} />
                                {pushLoading ? 'Enabling...' : 'Enable Push Notifications'}
                            </button>
                        )}
                        <button
                            onClick={onRefresh}
                            title="Refresh permission and subscription status"
                            className="h-11 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
                        >
                            <RotateCw size={14} />
                            Sync Status
                        </button>
                    </div>

                    {!vapidPublicKey && (
                        <p className="text-[11px] text-amber-600 font-medium">
                            Warning: VAPID public key is missing in environment variables.
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-display font-bold text-text-main text-lg tracking-tight">Notification Channels</h3>
                    <p className="text-xs text-text-secondary mt-1">
                        Choose what alerts you want to receive across devices.
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
