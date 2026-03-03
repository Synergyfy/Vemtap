import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const apiNetworkOnlyRule = {
  matcher: ({ url }: { url: URL }) => {
    const isApiPath = url.pathname.startsWith("/api/");
    const isKnownApiHost =
      url.hostname.includes("vemtap-api.vercel.app") ||
      url.hostname.includes("localhost");

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
