/**
 * Shared Web Push (VAPID) client helpers.
 *
 * Single source of truth for:
 *  - resolving the VAPID public key (no silent fallbacks),
 *  - base64url -> Uint8Array conversion,
 *  - browser feature detection,
 *  - subscription management.
 *
 * Used by both the dashboard profile page and the customer settings page.
 */

export const SERVICE_WORKER_URL = '/sw.js';
export const SERVICE_WORKER_SCOPE = '/';

export type BrowserKind = 'chrome' | 'edge' | 'firefox' | 'safari' | 'other';

export interface BrowserInfo {
    kind: BrowserKind;
    name: string;
    /** URL the user can paste to open this browser's notification settings. */
    settingsUrl: string;
    /** Human label for the settings page. */
    settingsLabel: string;
    /** Whether this browser has a Chromium-style "Quiet notification requests" toggle. */
    hasQuietPromptSetting: boolean;
    /** Where the user should look for a quiet/permission icon in the address bar. */
    addressBarIconHint: string;
}

function detectBrowserKind(): BrowserKind {
    if (typeof navigator === 'undefined') return 'other';
    const ua = navigator.userAgent || '';
    if (/Edg\//i.test(ua)) return 'edge';
    if (/Firefox\/|FxiOS\//i.test(ua)) return 'firefox';
    if (/Chrome\/|CriOS\//i.test(ua)) return 'chrome';
    if (/Safari\//i.test(ua)) return 'safari';
    return 'other';
}

/**
 * Detects the current browser and returns guidance tailored to it (settings
 * URL, whether it has a "quiet notification requests" mode, and where to find
 * the permission icon in the address bar).
 */
export function detectBrowser(): BrowserInfo {
    const kind = detectBrowserKind();
    switch (kind) {
        case 'edge':
            return {
                kind,
                name: 'Edge',
                settingsUrl: 'edge://settings/content/notifications',
                settingsLabel: 'edge://settings/content/notifications',
                hasQuietPromptSetting: true,
                addressBarIconHint: 'the bell/sliders icon in the address bar',
            };
        case 'firefox':
            return {
                kind,
                name: 'Firefox',
                settingsUrl: 'about:preferences#privacy',
                settingsLabel: 'Firefox Settings → Privacy & Security → Notifications',
                hasQuietPromptSetting: false,
                addressBarIconHint: 'the permission icon on the left of the address bar',
            };
        case 'safari':
            return {
                kind,
                name: 'Safari',
                settingsUrl: '',
                settingsLabel: 'Safari → Settings → Websites → Notifications',
                hasQuietPromptSetting: false,
                addressBarIconHint: 'the website settings icon in the toolbar',
            };
        case 'chrome':
        default:
            return {
                kind: 'chrome',
                name: 'Chrome',
                settingsUrl: 'chrome://settings/content/notifications',
                settingsLabel: 'chrome://settings/content/notifications',
                hasQuietPromptSetting: true,
                addressBarIconHint: 'the bell/sliders icon in the address bar',
            };
    }
}

export interface PushSupportInfo {
    supported: boolean;
    insecureContext: boolean;
    missingNotification: boolean;
    missingServiceWorker: boolean;
    missingPushManager: boolean;
}

/**
 * Detects whether the current browser can use the Web Push API.
 * Never throws — always returns a descriptive object.
 */
export function getPushSupportInfo(): PushSupportInfo {
    if (typeof window === 'undefined') {
        return {
            supported: false,
            insecureContext: false,
            missingNotification: false,
            missingServiceWorker: false,
            missingPushManager: false,
        };
    }

    const insecureContext =
        typeof window.isSecureContext === 'boolean' && !window.isSecureContext;
    const missingNotification = !('Notification' in window);
    const missingServiceWorker = !('serviceWorker' in navigator);
    const missingPushManager = !('PushManager' in window);

    return {
        supported:
            !insecureContext &&
            !missingNotification &&
            !missingServiceWorker &&
            !missingPushManager,
        insecureContext,
        missingNotification,
        missingServiceWorker,
        missingPushManager,
    };
}

export function isPushSupported(): boolean {
    return getPushSupportInfo().supported;
}

/**
 * Returns the VAPID public key from the environment, or null if missing.
 * There is intentionally no hardcoded fallback: a wrong key silently breaks
 * delivery, so we surface a clear warning instead.
 */
export function getVapidPublicKey(): string | null {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return null;
    const trimmed = key.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Converts a base64url-encoded VAPID applicationServerKey into a Uint8Array.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const cleaned = base64String.trim().replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (cleaned.length % 4)) % 4);
    const base64 = cleaned + padding;
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
    for (let i = 0; i < rawData.length; i += 1) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function getCurrentPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'default';
    }
    return Notification.permission;
}

/**
 * Requests notification permission from the user. Must be called from within a
 * user gesture (e.g. a click handler) or browsers will silently return
 * 'default'. Falls back to the legacy callback form for older browsers.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'default';
    }
    try {
        return await Notification.requestPermission();
    } catch {
        return await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission((result) => resolve(result));
        });
    }
}

/**
 * Returns the current push subscription for the active service worker, if any.
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return null;
        return (await registration.pushManager.getSubscription()) ?? null;
    } catch {
        return null;
    }
}

/**
 * Registers the service worker and returns a ready registration.
 */
export async function getReadyServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
    await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
        scope: SERVICE_WORKER_SCOPE,
    });
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
        throw new Error('Service Worker failed to activate.');
    }
    return registration;
}

/**
 * Creates (or replaces) the push subscription for this device.
 *
 * Expects permission to already be 'granted'. The caller is responsible for
 * requesting permission inside a user gesture.
 */
export async function subscribeToPush(): Promise<PushSubscription> {
    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) {
        throw new Error('Missing VAPID public key in environment variables.');
    }

    // Chrome can resolve Notification.requestPermission() to 'granted' a
    // fraction of a second before the push layer notices it. Re-reading here
    // avoids a confusing "Registration failed - permission denied" from
    // PushManager.subscribe() when the permission isn't truly applied yet.
    if (getCurrentPermission() !== 'granted') {
        // Give the permission change a moment to propagate, then re-check.
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (getCurrentPermission() !== 'granted') {
            throw new Error(
                'Notifications are not allowed yet. Click the padlock/bell icon in the address bar, set Notifications to "Allow", then reload the page and try again.',
            );
        }
    }

    const registration = await getReadyServiceWorkerRegistration();

    // Replace any stale subscription (e.g. subscribed under an older key).
    try {
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            await existing.unsubscribe();
        }
    } catch {
        // Non-fatal: proceed with a fresh subscription.
    }

    try {
        return await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
    } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        if (
            error?.name === 'NotAllowedError' ||
            /permission denied/i.test(error?.message ?? '')
        ) {
            throw new Error(
                'The browser refused the push subscription. Click the padlock/bell icon in the address bar, set Notifications to "Allow", then reload the page and try again.',
            );
        }
        throw err;
    }
}

/**
 * Unsubscribes this device locally (does not clear the server-side token).
 */
export async function unsubscribeFromPush(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return false;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
        await subscription.unsubscribe();
        return true;
    }
    return false;
}
