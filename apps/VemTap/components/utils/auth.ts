/**
 * Utility to determine the correct dashboard path based on user role
 */
export const getDashboardPath = (role?: string): string => {
  if (role === 'ADMIN') {
    return '/admin';
  }
  return '/dashboard';
};
