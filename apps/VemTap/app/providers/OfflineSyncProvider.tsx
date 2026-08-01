'use client';

import { useEffect, ReactNode } from 'react';
import { syncManager } from '@/lib/offline/sync-manager';

export default function OfflineSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    syncManager.startAutoSync(30000);
    syncManager.refreshCount();

    if ('serviceWorker' in navigator) {
      const registerSw = async () => {
        try {
          const existing = await navigator.serviceWorker.getRegistration();
          if (!existing) {
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          }
        } catch (err) {
          console.warn('Service worker registration failed', err);
        }
      };
      if (document.readyState === 'complete') {
        registerSw();
      } else {
        window.addEventListener('load', registerSw);
      }
      return () => window.removeEventListener('load', registerSw);
    }
  }, []);

  return <>{children}</>;
}
