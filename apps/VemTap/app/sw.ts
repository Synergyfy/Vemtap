/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, StaleWhileRevalidate, NetworkFirst, Serwist } from "serwist";

interface SerwistGlobal extends ServiceWorkerGlobalScope, SerwistGlobalConfig {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
}

declare const self: SerwistGlobal;

// API routes that should use NetworkOnly (mutations and real-time data)
// Note: the API lives on a different origin (NEXT_PUBLIC_API_URL), so these rules
// match by pathname, not origin — the service worker can intercept and cache
// cross-origin requests made by controlled pages.
const mutationPaths = ["/api/pos/sales", "/api/auth", "/api/loyalty/points/give"];

const apiNetworkOnlyRule = {
  matcher: ({ url, request }: { url: URL; request: Request }) => {
    const isApiPath = url.pathname.startsWith("/api/");
    const isMutation = mutationPaths.some((p) => url.pathname.startsWith(p));
    const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    return isApiPath && (isMutation || isWriteMethod);
  },
  handler: new NetworkOnly(),
};

// POS data API routes cached with StaleWhileRevalidate for offline support
const posCacheRule = {
  matcher: ({ url, request }: { url: URL; request: Request }) => {
    const isApiPath = url.pathname.startsWith("/api/");
    const isGetMethod = request.method === "GET";
    const isPosData =
      url.pathname.includes("/catalogue") ||
      url.pathname.includes("/categories") ||
      url.pathname.includes("/businesses/my-business") ||
      url.pathname.includes("/branches") ||
      url.pathname.includes("/loyalty/rewards") ||
      url.pathname.includes("/loyalty/rules") ||
      url.pathname.includes("/loyalty/points/balance") ||
      url.pathname.includes("/pos/settings") ||
      url.pathname.includes("/subscriptions");
    return isApiPath && isGetMethod && isPosData;
  },
  handler: new StaleWhileRevalidate({
    cacheName: "pos-data-cache",
  }),
};

// POS pages and RSC payloads cached with NetworkFirst to ensure offline reloads work
const posPagesRule = {
  matcher: ({ url, request }: { url: URL; request: Request }) => {
    const isPosPage = url.pathname.startsWith("/dashboard/pos");
    const isNavigate = request.mode === "navigate";
    const isRsc = url.searchParams.has("_rsc");
    return isPosPage && (isNavigate || isRsc);
  },
  handler: new NetworkFirst({
    cacheName: "pos-pages-cache",
    networkTimeoutSeconds: 3,
  }),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiNetworkOnlyRule, posCacheRule, posPagesRule, ...defaultCache],
});

serwist.addEventListeners();

self.addEventListener("push", (event: PushEvent) => {
  const rawData = event.data ? event.data : null;
  let payload: any = {};

  if (rawData) {
    try {
      payload = rawData.json();
    } catch {
      payload = { body: rawData.text() };
    }
  }

  const title = payload.title || "VemTap Notification";
  const options: NotificationOptions = {
    body: payload.body || "You have a new update.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: payload.url || "/",
      ...payload,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const windowClient = client as WindowClient;
          if (windowClient.url === targetUrl && "focus" in windowClient) {
            return windowClient.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
