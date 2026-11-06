import { UserRole } from '../users/entities/user.entity';

/**
 * Customer and business accounts sign up and sign in with a 6-digit PIN only.
 * Platform roles (admin, super admin, agent) keep passwords.
 */
export const PIN_ROLES: UserRole[] = [UserRole.CUSTOMER, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF];

export const PIN_PATTERN = /^\d{6}$/;

export const PIN_FORMAT_MESSAGE = 'PIN must be exactly 6 digits';

export const PIN_SIGN_IN_MESSAGE =
  'Sign in with your 6-digit PIN. Forgot it or never set one? Use Forgot PIN.';

export const isPinRole = (role?: UserRole | string | null): boolean =>
  Boolean(role && PIN_ROLES.includes(role as UserRole));

export const isPin = (value?: string | null): boolean => typeof value === 'string' && PIN_PATTERN.test(value);
