# QR-Thrive × VemTap Integration - Implementation Plan

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation

---

## Executive Summary

This document outlines the complete implementation plan for integrating QR-Thrive into VemTap, enabling:
1. **Unified SSO** - VemTap users access QR-Thrive without separate authentication
2. **Centralized QR Management** - Create, view, and manage QR codes from VemTap
3. **Subscription Synchronization** - Shared subscription state across platforms

---

## Architecture Overview

### Current State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VEMTAP PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                                          │
│  ├── apps/VemTap/                                                            │
│  │   ├── lib/api.ts                 → Authenticated API wrapper              │
│  │   ├── store/useAuthStore.ts       → User auth state (Zustand)             │
│  │   ├── services/qr-thrive/hooks.ts → QR-Thrive plans (needs expansion)      │
│  │   └── types/qr.ts                 → QR type definitions                    │
│  │                                                                           │
│  └── explore-qrthrive/page.tsx      → Preview-only (needs full integration)  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            QR-THRIVE PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                                     │
│  ├── apps/web/src/                                                           │
│  │   ├── services/api.ts             → API client (axios)                   │
│  │   ├── hooks/useApi.ts             → React Query hooks                    │
│  │   ├── pages/DashboardPage.tsx     → Full QR management UI                 │
│  │   └── types/api.ts                → Backend types                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VEMTAP PLATFORM                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    INTEGRATION LAYER                                   │    │
│  │  ├── services/qr-thrive/                                              │    │
│  │  │   ├── hooks.ts           → Extended React Query hooks              │    │
│  │  │   ├── types.ts           → Integration-specific types              │    │
│  │  │   └── api.ts             → QR-Thrive API client                    │    │
│  │  ├── store/useQrThriveStore.ts → QR-Thrive state (Zustand)            │    │
│  │  └── hooks/useQrThriveAuth.ts → Auto-provisioning logic               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │           EXPLORE-QRTHRIVE PAGE (Full Integration)                     │    │
│  │  ├── QR Type Selection        → Same as QR-Thrive                      │    │
│  │  ├── Content Configuration    → Dynamic forms per type                 │    │
│  │  ├── Design Customization     → Colors, shapes, frames, logos        │    │
│  │  ├── QR Code Preview          → Real-time rendering                    │    │
│  │  ├── QR Code Listing          → Grid view of all user's QRs            │    │
│  │  └── Quick Actions           → Edit, Delete, Download, Stats          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls (X-API-KEY auth)
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      QR-THRIVE INTEGRATION API                                │
│  Base URL: https://api.qrthrive.com/api/v1/integration                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  User Management:                                                            │
│  ├── POST /users                    → Provision user                        │
│  ├── POST /users/:userId/magic-link → Generate SSO token                    │
│  │                                                                           │
│  QR Management:                                                              │
│  ├── POST   /users/:userId/qr-codes        → Create QR                      │
│  ├── GET    /users/:userId/qr-codes        → List QRs                       │
│  ├── GET    /users/:userId/qr-codes/:id    → Get QR details                 │
│  ├── PUT    /users/:userId/qr-codes/:id    → Update QR                     │
│  ├── DELETE /users/:userId/qr-codes/:id    → Delete QR                     │
│  │                                                                           │
│  Analytics:                                                                  │
│  ├── GET /users/:userId/qr-codes/:id/scans     → Scan data                 │
│  ├── GET /users/:userId/qr-codes/:id/responses → Form responses            │
│  │                                                                           │
│  Subscription:                                                              │
│  ├── GET  /plans                    → Available plans                       │
│  └── POST /users/:userId/subscription → Sync subscription                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Types

### Task 1.1: Create Integration Types

**File:** `apps/VemTap/services/qr-thrive/types.ts`

```typescript
// Integration-specific user from QR-Thrive
export interface QrThriveUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  qrThriveUserId?: string; // The mapped user ID in QR-Thrive
}

// Magic link response for SSO
export interface MagicLinkResponse {
  token: string;
  url: string;
  expiresAt: string;
}

// QR Code from QR-Thrive
export interface QrThriveQRCode {
  id: string;
  shortId: string;
  shortUrl: string;
  name: string;
  description?: string;
  folderId?: string | null;
  type: string;
  isDynamic: boolean;
  status: 'active' | 'archived';
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width: number;
  height: number;
  margin: number;
  createdAt: string;
  updatedAt: string;
  scans: number;
  form?: {
    _count: { submissions: number };
  };
}

// Create QR Code DTO
export interface CreateQrThriveQRDto {
  name: string;
  description?: string;
  folderId?: string;
  type: string;
  isDynamic?: boolean;
  data: any;
  design: any;
  frame: any;
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}

// Scan data
export interface QrThriveScan {
  id: string;
  qrCodeId: string;
  ip?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  city?: string;
  country?: string;
  region?: string;
  createdAt: string;
}

// Folder
export interface QrThriveFolder {
  id: string;
  name: string;
  color: string;
  _count?: { qrCodes: number };
}

// Statistics
export interface QrThriveStats {
  totalQRs: number;
  totalScans: number;
  uniqueVisitors: number;
  scansLastHour: number;
  deviceDist: Record<string, number>;
  osDist: Record<string, number>;
  browserDist: Record<string, number>;
  countryDist: Record<string, number>;
  timeDist: Record<string, number>;
}

// Subscription sync
export interface SubscriptionSyncDto {
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
}
```

### Task 1.2: Create QR-Thrive API Client

**File:** `apps/VemTap/services/qr-thrive/api.ts`

```typescript
import { BASE_URL } from '@/lib/api';

const QR_THRIVE_BASE_URL = process.env.NEXT_PUBLIC_QR_THRIVE_API_URL || 'https://api.qrthrive.com/api/v1/integration';
const QR_THRIVE_API_KEY = process.env.QR_THRIVE_API_KEY || '';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

async function qrThriveRequest<T>(
  endpoint: string, 
  options: RequestOptions = {}
): Promise<T> {
  const url = `${QR_THRIVE_BASE_URL}${endpoint}`;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': QR_THRIVE_API_KEY,
    ...options.headers,
  });

  // Add VemTap user context if available
  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage-v2');
    if (authStorage) {
      const state = JSON.parse(authStorage).state;
      const token = state?.access_token || state?.token;
      if (token) {
        headers.set('X-VemTap-Auth', token);
      }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API Error' }));
    throw new Error(error.message || `QR-Thrive API Error: ${response.status}`);
  }

  return response.json();
}

export const qrThriveApi = {
  // User Management
  provisionUser: async (data: { email: string; firstName: string; lastName: string }) =>
    qrThriveRequest<QrThriveUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
  
  generateMagicLink: async (userId: string) =>
    qrThriveRequest<MagicLinkResponse>(`/users/${userId}/magic-link`, { method: 'POST' }),

  // QR Codes
  getQRCodes: async (userId: string, params?: { status?: string; folderId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return qrThriveRequest<QrThriveQRCode[]>(`/users/${userId}/qr-codes${query}`);
  },
  
  getQRCode: async (userId: string, qrId: string) =>
    qrThriveRequest<QrThriveQRCode>(`/users/${userId}/qr-codes/${qrId}`),
  
  createQRCode: async (userId: string, data: CreateQrThriveQRDto) =>
    qrThriveRequest<QrThriveQRCode>(`/users/${userId}/qr-codes`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  updateQRCode: async (userId: string, qrId: string, data: Partial<CreateQrThriveQRDto>) =>
    qrThriveRequest<QrThriveQRCode>(`/users/${userId}/qr-codes/${qrId}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  deleteQRCode: async (userId: string, qrId: string) =>
    qrThriveRequest<void>(`/users/${userId}/qr-codes/${qrId}`, { method: 'DELETE' }),

  // Analytics
  getScans: async (userId: string, qrId: string) =>
    qrThriveRequest<QrThriveScan[]>(`/users/${userId}/qr-codes/${qrId}/scans`),
  
  getResponses: async (userId: string, qrId: string) =>
    qrThriveRequest<any[]>(`/users/${userId}/qr-codes/${qrId}/responses`),

  // Folders
  getFolders: async (userId: string) =>
    qrThriveRequest<QrThriveFolder[]>(`/users/${userId}/folders`),
  
  createFolder: async (userId: string, data: { name: string; color: string }) =>
    qrThriveRequest<QrThriveFolder>(`/users/${userId}/folders`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  deleteFolder: async (userId: string, folderId: string) =>
    qrThriveRequest<void>(`/users/${userId}/folders/${folderId}`, { method: 'DELETE' }),

  // Stats
  getStats: async (userId: string) =>
    qrThriveRequest<QrThriveStats>(`/users/${userId}/stats`),

  // Subscription
  syncSubscription: async (userId: string, data: SubscriptionSyncDto) =>
    qrThriveRequest<void>(`/users/${userId}/subscription`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),

  // Plans
  getPlans: async () =>
    qrThriveRequest<any[]>('/plans'),
};
```

---

## Phase 2: State Management

### Task 2.1: Create QR-Thrive Zustand Store

**File:** `apps/VemTap/store/useQrThriveStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QrThriveState {
  // The QR-Thrive user ID (mapped from VemTap user)
  qrThriveUserId: string | null;
  
  // SSO token for magic link access
  magicLinkToken: string | null;
  magicLinkExpiresAt: string | null;
  
  // Provisioning status
  isProvisioned: boolean;
  isProvisioning: boolean;
  
  // Actions
  setQrThriveUser: (userId: string) => void;
  setMagicLink: (token: string, expiresAt: string) => void;
  setProvisioned: (status: boolean) => void;
  setProvisioning: (status: boolean) => void;
  clear: () => void;
}

export const useQrThriveStore = create<QrThriveState>()(
  persist(
    (set) => ({
      qrThriveUserId: null,
      magicLinkToken: null,
      magicLinkExpiresAt: null,
      isProvisioned: false,
      isProvisioning: false,
      
      setQrThriveUser: (userId) => set({ qrThriveUserId: userId, isProvisioned: true }),
      setMagicLink: (token, expiresAt) => set({ magicLinkToken: token, magicLinkExpiresAt: expiresAt }),
      setProvisioned: (status) => set({ isProvisioned: status }),
      setProvisioning: (status) => set({ isProvisioning: status }),
      clear: () => set({ 
        qrThriveUserId: null, 
        magicLinkToken: null, 
        magicLinkExpiresAt: null,
        isProvisioned: false,
        isProvisioning: false,
      }),
    }),
    {
      name: 'qr-thrive-storage',
    }
  )
);
```

### Task 2.2: Extend Auth Store with QR-Thrive User ID

**Modify:** `apps/VemTap/store/useAuthStore.ts`

Add to User interface:
```typescript
export interface User {
  // ... existing fields
  qrThriveUserId?: string; // Add this field
}
```

---

## Phase 3: React Query Hooks

### Task 3.1: Create Comprehensive Hooks

**File:** `apps/VemTap/services/qr-thrive/hooks.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { qrThriveApi } from './api';
import type { 
  QrThriveQRCode, 
  CreateQrThriveQRDto, 
  QrThriveScan, 
  QrThriveFolder,
  QrThriveStats,
  MagicLinkResponse 
} from './types';

// ============ USER PROVISIONING ============

export const useProvisionQrThriveUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { setQrThriveUser, setProvisioning, setProvisioned } = useQrThriveStore();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      setProvisioning(true);
      
      const response = await qrThriveApi.provisionUser({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      
      setQrThriveUser(response.id);
      return response;
    },
    onSuccess: () => {
      setProvisioning(false);
      setProvisioned(true);
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-user'] });
    },
    onError: () => {
      setProvisioning(false);
    },
  });
};

export const useGenerateMagicLink = () => {
  const { setMagicLink } = useQrThriveStore();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await qrThriveApi.generateMagicLink(userId);
      setMagicLink(response.token, response.expiresAt);
      return response;
    },
  });
};

// ============ QR CODES ============

export const useQrThriveCodes = (params?: { status?: string; folderId?: string }) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useQuery({
    queryKey: ['qr-thrive-codes', qrThriveUserId, params],
    queryFn: () => qrThriveApi.getQRCodes(qrThriveUserId!, params),
    enabled: !!qrThriveUserId && isProvisioned,
  });
};

export const useQrThriveCode = (qrId: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useQuery({
    queryKey: ['qr-thrive-code', qrId],
    queryFn: () => qrThriveApi.getQRCode(qrThriveUserId!, qrId),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId,
  });
};

export const useCreateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  
  return useMutation({
    mutationFn: (data: CreateQrThriveQRDto) => 
      qrThriveApi.createQRCode(qrThriveUserId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-stats'] });
    },
  });
};

export const useUpdateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  
  return useMutation({
    mutationFn: ({ qrId, data }: { qrId: string; data: Partial<CreateQrThriveQRDto> }) =>
      qrThriveApi.updateQRCode(qrThriveUserId!, qrId, data),
    onSuccess: (_, { qrId }) => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-code', qrId] });
    },
  });
};

export const useDeleteQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  
  return useMutation({
    mutationFn: (qrId: string) => qrThriveApi.deleteQRCode(qrThriveUserId!, qrId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-stats'] });
    },
  });
};

export const useDuplicateQrThriveCode = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  
  return useMutation({
    mutationFn: async (qrId: string) => {
      // Get the existing code
      const existing = await qrThriveApi.getQRCode(qrThriveUserId!, qrId);
      // Create a duplicate
      return qrThriveApi.createQRCode(qrThriveUserId!, {
        ...existing,
        name: `${existing.name} (Copy)`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

// ============ ANALYTICS ============

export const useQrThriveScans = (qrId: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useQuery({
    queryKey: ['qr-thrive-scans', qrId],
    queryFn: () => qrThriveApi.getScans(qrThriveUserId!, qrId),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId,
  });
};

export const useQrThriveResponses = (qrId: string) => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useQuery({
    queryKey: ['qr-thrive-responses', qrId],
    queryFn: () => qrThriveApi.getResponses(qrThriveUserId!, qrId),
    enabled: !!qrThriveUserId && isProvisioned && !!qrId,
  });
};

export const useQrThriveStats = () => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useQuery({
    queryKey: ['qr-thrive-stats'],
    queryFn: () => qrThriveApi.getStats(qrThriveUserId!),
    enabled: !!qrThriveUserId && isProvisioned,
  });
};

// ============ FOLDERS ============

export const useQrThriveFolders = () => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useQuery({
    queryKey: ['qr-thrive-folders'],
    queryFn: () => qrThriveApi.getFolders(qrThriveUserId!),
    enabled: !!qrThriveUserId && isProvisioned,
  });
};

export const useCreateQrThriveFolder = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      qrThriveApi.createFolder(qrThriveUserId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-folders'] });
    },
  });
};

export const useDeleteQrThriveFolder = () => {
  const queryClient = useQueryClient();
  const { qrThriveUserId } = useQrThriveStore();
  
  return useMutation({
    mutationFn: (folderId: string) =>
      qrThriveApi.deleteFolder(qrThriveUserId!, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-folders'] });
      queryClient.invalidateQueries({ queryKey: ['qr-thrive-codes'] });
    },
  });
};

// ============ PLANS ============

export const useQrThrivePlans = () => {
  return useQuery({
    queryKey: ['qr-thrive-plans'],
    queryFn: () => qrThriveApi.getPlans(),
  });
};

// ============ SUBSCRIPTION SYNC ============

export const useSyncQrThriveSubscription = () => {
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  
  return useMutation({
    mutationFn: (data: { planId: string; status: string }) => {
      if (!qrThriveUserId || !isProvisioned) {
        throw new Error('User not provisioned in QR-Thrive');
      }
      return qrThriveApi.syncSubscription(qrThriveUserId, data);
    },
  });
};
```

---

## Phase 4: Auto-Provisioning Hook

### Task 4.1: Create Auto-Provision Hook

**File:** `apps/VemTap/hooks/useQrThriveAuth.ts`

```typescript
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { useProvisionQrThriveUser } from '@/services/qr-thrive/hooks';
import { api } from '@/lib/api';

export function useQrThriveAuth() {
  const { user, isAuthenticated } = useAuthStore();
  const { isProvisioned, isProvisioning, qrThriveUserId, setQrThriveUser } = useQrThriveStore();
  const provisionMutation = useProvisionQrThriveUser();
  const hasAttemptedProvision = useRef(false);

  useEffect(() => {
    const provisionUser = async () => {
      // Skip if not authenticated, already provisioned, or currently provisioning
      if (!isAuthenticated || !user || isProvisioned || isProvisioning) {
        return;
      }

      // Skip if we've already attempted
      if (hasAttemptedProvision.current) {
        return;
      }

      hasAttemptedProvision.current = true;

      try {
        // First, check if VemTap backend already has the qrThriveUserId mapped
        const response = await api.get('/users/me/qr-thrive');
        if (response.qrThriveUserId) {
          setQrThriveUser(response.qrThriveUserId);
          return;
        }

        // If not mapped, provision new user
        await provisionMutation.mutateAsync();
      } catch (error) {
        console.error('Failed to provision QR-Thrive user:', error);
        // Reset so we can try again
        hasAttemptedProvision.current = false;
      }
    };

    provisionUser();
  }, [isAuthenticated, user, isProvisioned, isProvisioning]);

  // Reset provisioning state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hasAttemptedProvision.current = false;
    }
  }, [isAuthenticated]);

  return {
    isProvisioned,
    isProvisioning,
    qrThriveUserId,
    provisionUser: provisionMutation.mutate,
  };
}
```

### Task 4.2: Add to AuthProvider

**Modify:** `apps/VemTap/components/providers/AuthProvider.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQrThriveAuth } from '@/hooks/useQrThriveAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  // Auto-provision QR-Thrive on login
  useQrThriveAuth();

  return <>{children}</>;
}
```

---

## Phase 5: Explore QR-Thrive Page Redesign

### Task 5.1: Complete Page Redesign

**File:** `apps/VemTap/app/dashboard/explore-qrthrive/page.tsx`

The page needs to be completely redesigned to be functional rather than just a preview. Key components:

1. **QR Type Selection** - Same UI as current, but functional
2. **Content Form** - Dynamic form based on QR type
3. **Design Panel** - Full customization options
4. **QR Preview** - Real-time QR rendering
5. **QR Grid/List View** - Show all user's QR codes
6. **Action Buttons** - Create, Edit, Delete, Download, Stats

**Component Structure:**

```
page.tsx
├── QrTypeSelector.tsx        # Step 1: Select QR type
├── ContentForm/
│   ├── UrlForm.tsx           # URL type form
│   ├── VCardForm.tsx         # vCard form
│   ├── WifiForm.tsx         # WiFi form
│   ├── SocialForm.tsx        # Social media forms
│   ├── FileForm.tsx          # PDF, Video, MP3, Image
│   ├── BusinessForm.tsx      # Business profile
│   ├── MenuForm.tsx          # Menu builder
│   └── ...                   # Other type forms
├── DesignPanel/
│   ├── ShapeTab.tsx          # Dots, corners, colors
│   ├── FrameTab.tsx          # Frame styles
│   └── LogoTab.tsx           # Logo upload
├── QrPreview.tsx            # Real-time QR rendering
├── QrGrid.tsx               # Grid of user's QR codes
└── QrCodeActions.tsx        # Edit, Delete, Download, Stats
```

### Task 5.2: Create Content Form Components

**Directory:** `apps/VemTap/app/dashboard/explore-qrthrive/components/`

Each form component will:
- Use React Hook Form for validation
- Match QR-Thrive's form structure exactly
- Support real-time preview updates

### Task 5.3: Create Design Panel Component

The design panel will need:
- Dot style selector (square, dots, rounded, classy)
- Corner style selector
- Color picker with presets
- Frame options with preview
- Logo upload with positioning

---

## Phase 6: SSO Integration

### Task 6.1: Create SSO Redirect Handler

**File:** `apps/VemTap/app/dashboard/explore-qrthrive/sso/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenerateMagicLink } from '@/services/qr-thrive/hooks';
import { useQrThriveStore } from '@/store/useQrThriveStore';
import { Loader2 } from 'lucide-react';

export default function SSOPage() {
  const router = useRouter();
  const { qrThriveUserId, isProvisioned } = useQrThriveStore();
  const generateMagicLink = useGenerateMagicLink();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSSO = async () => {
      if (!isProvisioned || !qrThriveUserId) {
        setError('QR-Thrive account not provisioned');
        return;
      }

      try {
        const result = await generateMagicLink.mutateAsync(qrThriveUserId);
        // Redirect to QR-Thrive with magic link token
        window.location.href = result.url;
      } catch (err) {
        setError('Failed to generate login link');
      }
    };

    performSSO();
  }, [qrThriveUserId, isProvisioned]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600">{error}</p>
        <button onClick={() => router.back()} className="mt-4">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="mt-4 text-gray-600">Redirecting to QR-Thrive...</p>
    </div>
  );
}
```

### Task 6.2: Add "Open in QR-Thrive" Button

Add to explore-qrthrive page header:

```typescript
<a 
  href="/dashboard/explore-qrthrive/sso" 
  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50"
>
  <ExternalLink className="w-4 h-4" />
  Open in QR-Thrive
</a>
```

---

## Phase 7: Subscription Synchronization

### Task 7.1: Sync on Subscription Change

** Modify:** Any subscription-related mutations in VemTap

When a user's subscription changes in VemTap:
1. Get the mapped `qrThrivePlanId` from VemTap's plan
2. Call `POST /users/:userId/subscription` on QR-Thrive

```typescript
// In subscription hooks
const syncSubscription = useSyncQrThriveSubscription();

// After VemTap subscription update
await syncSubscription.mutateAsync({
  planId: vemtapPlan.qrThrivePlanId,
  status: 'active', // or appropriate status
});
```

### Task 7.2: Webhook Handler for QR-Thrive Callbacks

**File:** `apps/VemTap/app/api/integration/qr-thrive/callback/route.ts`

This endpoint receives webhooks from QR-Thrive for:
- Branding updates
- User sync events
- Scan milestones

---

## Phase 8: Environment Configuration

### Task 8.1: Add Environment Variables

**File:** `.env.local` / `.env.production`

```bash
# QR-Thrive Integration
NEXT_PUBLIC_QR_THRIVE_API_URL=https://api.qrthrive.com/api/v1/integration
QR_THRIVE_API_KEY=<internal-api-key-from-qrthrive>
NEXT_PUBLIC_QR_THRIVE_APP_URL=https://qr-thrive.com
```

---

## Implementation Order

### Sprint 1: Foundation (Days 1-3)
- [ ] Task 1.1: Create Integration Types
- [ ] Task 1.2: Create QR-Thrive API Client
- [ ] Task 2.1: Create Zustand Store
- [ ] Task 2.2: Extend Auth Store

### Sprint 2: Data Layer (Days 4-6)
- [ ] Task 3.1: Create React Query Hooks
- [ ] Task 4.1: Create Auto-Provision Hook
- [ ] Task 4.2: Add to AuthProvider

### Sprint 3: UI Components (Days 7-14)
- [ ] Task 5.1: Page Redesign - Main Layout
- [ ] Task 5.2: Content Form Components
- [ ] Task 5.3: Design Panel Component
- [ ] QR Preview Component
- [ ] QR Grid Component
- [ ] Action Buttons Component

### Sprint 4: Integration Features (Days 15-17)
- [ ] Task 6.1: SSO Redirect Handler
- [ ] Task 6.2: "Open in QR-Thrive" Button
- [ ] Task 7.1: Subscription Sync
- [ ] Task 7.2: Webhook Handler

### Sprint 5: Testing & Polish (Days 18-21)
- [ ] End-to-end testing
- [ ] Error handling
- [ ] Loading states
- [ ] Edge cases
- [ ] Mobile responsiveness

---

## API Endpoints Required from Backend

The VemTap backend needs to expose/support:

1. **GET /users/me/qr-thrive**
   - Returns `{ qrThriveUserId: string | null }`
   - Used to check if user is already mapped

2. **POST /users/me/qr-thrive/provision**
   - Provisions user in QR-Thrive
   - Returns `{ qrThriveUserId: string }`
   - Stores mapping in VemTap database

3. **Subscription hook integration**
   - On subscription create/update/cancel
   - Sync to QR-Thrive with mapped plan ID

---

## Testing Checklist

### Unit Tests
- [ ] API client methods
- [ ] Zustand store actions
- [ ] React Query hooks
- [ ] Form validation
- [ ] QR preview rendering

### Integration Tests
- [ ] Auto-provisioning flow
- [ ] QR code CRUD operations
- [ ] SSO magic link generation
- [ ] Subscription synchronization

### E2E Tests
- [ ] User signup → auto-provision
- [ ] Login → QR-Thrive accessible
- [ ] Create QR code from VemTap
- [ ] View QR codes from both platforms
- [ ] SSO redirect works
- [ ] Subscription changes sync

---

## Rollback Plan

If integration causes issues:

1. **Feature Flag:** Wrap all QR-Thrive code in feature flag
2. **Graceful Degradation:** Show "Coming Soon" for QR-Thrive features
3. **Auth Isolation:** QR-Thrive provisioning failures shouldn't block VemTap login
4. **Data Isolation:** QR-Thrive data stored separately, can be cleared without affecting VemTap

---

## Monitoring & Observability

### Metrics to Track
- Provisioning success rate
- QR code creation success rate
- API response times
- Error rates by endpoint
- SSO success rate

### Logging
- Log all API calls to QR-Thrive
- Log provisioning attempts
- Log subscription sync events
- Alert on repeated failures

---

## Security Considerations

1. **API Key Storage:** Never expose `QR_THRIVE_API_KEY` to client-side
   - Use server-side proxy if needed
   - Or use VemTap backend as middleware

2. **Token Expiry:** Magic links expire after use and time limit
   - Implement token refresh if user needs extended access

3. **Rate Limiting:** Respect QR-Thrive API rate limits
   - Implement exponential backoff
   - Queue operations if needed

4. **Data Validation:** Validate all data before sending to QR-Thrive
   - Sanitize file uploads
   - Validate URLs and inputs

---

## Appendix A: QR Types Reference

| Type | Dynamic | Description |
|------|---------|-------------|
| url | ✓ | Website link |
| vcard | ✓ | Digital business card |
| wifi | ✗ | WiFi credentials |
| email | ✗ | Email composition |
| sms | ✗ | SMS composition |
| whatsapp | ✓ | WhatsApp chat |
| pdf | ✓ | PDF document viewer |
| video | ✓ | Video player |
| image | ✓ | Image gallery |
| mp3 | ✓ | Audio player |
| socials | ✓ | Social media links |
| business | ✓ | Business profile |
| menu | ✓ | Restaurant menu |
| app | ✓ | App store links |
| coupon | ✓ | Discount coupon |
| booking | ✓ | Booking page |
| form | ✓ | Custom form |

---

## Appendix B: Design Tokens

Match QR-Thrive's design system:
- Primary: `#2563EB` (Blue 600)
- Secondary: `#7C3AED` (Purple 600)
- Background: `#F8FAFC`
- Rounded: `rounded-2xl` to `rounded-[40px]`
- Shadow: `shadow-xl shadow-blue-100`

---

## Sign-off

**Technical Lead:** _______________  
**Product Owner:** _______________  
**Date:** _______________