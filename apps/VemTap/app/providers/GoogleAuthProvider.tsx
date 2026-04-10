'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';

export default function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn('Google Client ID is not defined in environment variables. Google Login will not function correctly.');
  }

  return (
    <GoogleOAuthProvider clientId={clientId || "placeholder-id"}>
      {children}
    </GoogleOAuthProvider>
  );
}
