/**
 * Generates a valid username from a branch name
 * Rules: lowercase, alphanumeric + hyphens, 3-30 chars
 */
export function generateUsernameFromName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except hyphen
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/--+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Trim hyphens
    .substring(0, 30); // Max length

  return sanitized;
}

/**
 * Validates username format
 * Rules: 3-30 chars, lowercase, alphanumeric + hyphens, must start/end with alnum
 */
export function isValidUsername(username: string): boolean {
  if (!username || username.length < 3 || username.length > 30) {
    return false;
  }
  const usernameRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
  return usernameRegex.test(username);
}

/**
 * Reserved words that cannot be used as usernames (to avoid route conflicts)
 */
export const RESERVED_USERNAMES = [
  'admin',
  'api',
  'tap',
  'b',
  's',
  'dashboard',
  'login',
  'logout',
  'register',
  'auth',
  'branch',
  'business',
  'customer',
  'support',
  'public',
  'static',
  'assets',
  'images',
  'uploads',
  'api',
  'socket',
  'ws',
];
