'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const setAuthCookie = (token: string) => {
  if (typeof document === 'undefined') return;
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `vemtap-auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { access_token, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Sync token to cookie whenever it changes or on hydration
    if (isAuthenticated && access_token) {
      // If it's a customer, we definitely want to ensure it's in cookies
      // as per user request for "last logged in customer"
      setAuthCookie(access_token);
    }
  }, [access_token, isAuthenticated, user?.role]);

  return <>{children}</>;
}
