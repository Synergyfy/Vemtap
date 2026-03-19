/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

// 1. Give it a UNIQUE name to avoid recursive reference errors
interface SerwistGlobal extends ServiceWorkerGlobalScope, SerwistGlobalConfig {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
}

// 2. Tell TS that 'self' is this specific type
declare const self: SerwistGlobal;

const apiNetworkOnlyRule = {
  matcher: ({ url }: { url: URL }) => {
    const isApiPath = url.pathname.startsWith("/api/");
    const isKnownApiHost = url.origin === self.location.origin;

    return isApiPath && isKnownApiHost;
  },
  method: "GET" as const,
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [apiNetworkOnlyRule, ...defaultCache],
});

serwist.addEventListeners();

// 3. Listeners will now recognize 'push' and 'notificationclick'
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
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
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
    })
  );
});
