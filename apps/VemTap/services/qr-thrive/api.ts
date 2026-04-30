import type {
  QrThriveUser,
  QrThriveQRCode,
  CreateQrThriveQRDto,
  UpdateQrThriveQRDto,
  QrThriveScan,
  QrThriveFolder,
  CreateQrThriveFolderDto,
  QrThriveStats,
  QrThrivePlan,
  SubscriptionSyncDto,
  ProvisionUserDto,
  MagicLinkResponse,
  QrThriveListParams,
  QrThriveErrorResponse,
  QrThriveLead,
} from './types';

const QR_THRIVE_BASE_URL = process.env.NEXT_PUBLIC_QR_THRIVE_API_URL || 'https://api.qrthrive.com/api/v1/integration';
const QR_THRIVE_API_KEY = process.env.NEXT_PUBLIC_QR_THRIVE_API_KEY || '';
const VEMTAP_INTEGRATION_KEY = process.env.NEXT_PUBLIC_VEMTAP_INTEGRATION_KEY || '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class QrThriveApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'QrThriveApiError';
  }
}

async function qrThriveRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  let url = `${QR_THRIVE_BASE_URL}${endpoint}`;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-API-KEY': QR_THRIVE_API_KEY,
  });

  if (VEMTAP_INTEGRATION_KEY) {
    headers.set('x-vemtap-api-key', VEMTAP_INTEGRATION_KEY);
  }

  if (typeof window !== 'undefined') {
    const authStorage = localStorage.getItem('auth-storage-v2');
    if (authStorage) {
      try {
        const state = JSON.parse(authStorage).state;
        const token = state?.access_token || state?.token;
        if (token && token !== 'mock-token') {
          headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // Silent fail - no auth token
      }
    }

    const qrThriveStorage = localStorage.getItem('qr-thrive-storage');
    if (qrThriveStorage) {
      try {
        const { state } = JSON.parse(qrThriveStorage);
        if (state?.qrThriveUserId) {
          headers.set('X-QR-Thrive-User-Id', state.qrThriveUserId);
        }
      } catch {
        // Silent fail
      }
    }
  }

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `QR-Thrive API Error: ${response.status}`;
    try {
      const errorData: QrThriveErrorResponse = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Use default error message
    }
    throw new QrThriveApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

import { api } from '@/lib/api';

export const qrThriveApi = {
  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * Provision a new user in QR-Thrive via VemTap backend
   */
  provisionUser: async (): Promise<{ qrThriveUserId: string }> => {
    return api.post('/users/me/qr-thrive/provision', {});
  },

  /**
   * Check if current user is mapped to a QR-Thrive user via VemTap backend
   */
  getUserMapping: async (): Promise<{ qrThriveUserId: string | null }> => {
    return api.get('/users/me/qr-thrive');
  },

  /**
   * Get user by ID from QR-Thrive
   */
  getUser: async (userId: string): Promise<QrThriveUser> => {
    return qrThriveRequest<QrThriveUser>(`/users/${userId}`);
  },

  /**
   * Generate magic link for SSO into QR-Thrive
   */
  generateMagicLink: async (userId: string): Promise<MagicLinkResponse> => {
    return qrThriveRequest<MagicLinkResponse>(`/users/${userId}/magic-link`, {
      method: 'POST',
    });
  },

  // ============================================
  // QR CODES
  // ============================================

  /**
   * Get all QR codes for a user
   */
  getQRCodes: async (userId: string, params?: QrThriveListParams): Promise<QrThriveQRCode[]> => {
    return api.get(`/qr-thrive/branches/${userId}/qr-codes`, { params: params as any });
  },

  /**
   * Get a single QR code by ID
   */
  getQRCode: async (userId: string, qrId: string): Promise<QrThriveQRCode> => {
    return api.get(`/qr-thrive/branches/${userId}/qr-codes/${qrId}`);
  },

  /**
   * Create a new QR code
   */
  createQRCode: async (userId: string, data: CreateQrThriveQRDto): Promise<QrThriveQRCode> => {
    return api.post(`/qr-thrive/branches/${userId}/qr-codes`, data);
  },

  /**
   * Update an existing QR code
   */
  updateQRCode: async (userId: string, qrId: string, data: UpdateQrThriveQRDto): Promise<QrThriveQRCode> => {
    return api.put(`/qr-thrive/branches/${userId}/qr-codes/${qrId}`, data);
  },

  /**
   * Delete a QR code
   */
  deleteQRCode: async (userId: string, qrId: string): Promise<void> => {
    return api.delete(`/qr-thrive/branches/${userId}/qr-codes/${qrId}`);
  },

  /**
   * Duplicate a QR code
   */
  duplicateQRCode: async (userId: string, qrId: string): Promise<QrThriveQRCode> => {
    return api.post(`/qr-thrive/branches/${userId}/qr-codes/${qrId}/duplicate`, {});
  },

  /**
   * Archive/Unarchive a QR code
   */
  setQRCodeStatus: async (userId: string, qrId: string, status: 'active' | 'archived'): Promise<QrThriveQRCode> => {
    return api.patch(`/qr-thrive/branches/${userId}/qr-codes/${qrId}`, { status });
  },

  /**
   * Toggle a QR code's featured status on UBL
   */
  toggleUbl: async (userId: string, qrId: string, isFeatured: boolean): Promise<QrThriveQRCode> => {
    return api.patch(`/qr-thrive/branches/${userId}/qr-codes/${qrId}/ubl`, { isFeatured });
  },

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get scan analytics for a QR code
   */
  getScans: async (userId: string, qrId: string): Promise<QrThriveScan[]> => {
    return api.get(`/qr-thrive/branches/${userId}/qr-codes/${qrId}/scans`);
  },

  /**
   * Get form responses for a form-type QR code
   */
  getResponses: async (userId: string, qrId: string): Promise<Record<string, any>[]> => {
    return api.get(`/qr-thrive/branches/${userId}/qr-codes/${qrId}/responses`);
  },

  /**
   * Get all leads (form submissions) for a branch
   */
  getLeads: async (branchId: string): Promise<QrThriveLead[]> => {
    return api.get(`/qr-thrive/branches/${branchId}/leads`);
  },

  /**
   * Get dashboard statistics
   */
  getStats: async (userId: string): Promise<QrThriveStats> => {
    return api.get(`/qr-thrive/branches/${userId}/stats`);
  },

  // ============================================
  // FOLDERS
  // ============================================

  /**
   * Get all folders for a user
   */
  getFolders: async (userId: string): Promise<QrThriveFolder[]> => {
    return api.get(`/qr-thrive/branches/${userId}/folders`);
  },

  /**
   * Create a new folder
   */
  createFolder: async (userId: string, data: CreateQrThriveFolderDto): Promise<QrThriveFolder> => {
    return api.post(`/qr-thrive/branches/${userId}/folders`, data);
  },

  /**
   * Delete a folder
   */
  deleteFolder: async (userId: string, folderId: string): Promise<void> => {
    return api.delete(`/qr-thrive/branches/${userId}/folders/${folderId}`);
  },

  /**
   * Update a folder
   */
  updateFolder: async (userId: string, folderId: string, data: Partial<CreateQrThriveFolderDto>): Promise<QrThriveFolder> => {
    return api.put(`/qr-thrive/branches/${userId}/folders/${folderId}`, data);
  },

  // ============================================
  // PLANS & SUBSCRIPTION
  // ============================================

  /**
   * Get available QR-Thrive plans
   */
  getPlans: async (): Promise<QrThrivePlan[]> => {
    return qrThriveRequest<QrThrivePlan[]>('/plans');
  },

  /**
   * Sync subscription status with QR-Thrive
   */
  syncSubscription: async (userId: string, data: SubscriptionSyncDto): Promise<void> => {
    return qrThriveRequest<void>(`/users/${userId}/subscription`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  /**
   * Get public QR code data (no auth required)
   * Used for preview/scanning
   */
  getPublicQRCode: async (shortId: string): Promise<QrThriveQRCode> => {
    return qrThriveRequest<QrThriveQRCode>(`/public/qr-codes/${shortId}`);
  },
};

export { QrThriveApiError };