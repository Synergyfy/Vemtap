import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export interface VisitorSignupInput {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  branchId?: string;
}

/**
 * Register a visitor via POST /visitors/signup and automatically log them in.
 *
 * The backend now issues an `access_token` / `user` directly in the signup
 * response for newly created customers, so no password prompt is needed.
 * For existing customers the token is absent, so we fall back to the legacy
 * default-password login flow.
 */
export async function signupVisitorAndLogin(data: VisitorSignupInput) {
  const nameParts = (data.name || '').trim().split(/\s+/);
  const firstName = data.firstName || nameParts[0] || 'Visitor';
  const lastName = data.lastName || nameParts.slice(1).join(' ') || ' ';
  const branchQuery = data.branchId ? `?branchId=${data.branchId}` : '';

  const signupResponse = await api.post(`/visitors/signup${branchQuery}`, {
    firstName,
    lastName,
    email: data.email,
    phone: data.phone || undefined,
  });

  // Auto-login with the token issued by the backend for new customers.
  if (signupResponse?.access_token && signupResponse?.user) {
    useAuthStore.getState().login(signupResponse.user, signupResponse.access_token);
    return signupResponse;
  }

  // Existing customers: fall back to the legacy default-password login.
  const identifier = data.email || data.phone || '';
  const authResponse = await api.post('/auth/login', {
    identifier,
    password: '123456',
  });

  if (authResponse?.access_token) {
    useAuthStore.getState().login(authResponse.user, authResponse.access_token);
  }

  return signupResponse;
}
