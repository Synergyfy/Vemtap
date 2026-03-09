/**
 * Input Sanitization Utilities
 * Prevents XSS, script injection, and other common attacks.
 * Use `sanitizeText` for general strings, `sanitizeEmail` for emails, etc.
 */

// Strip all HTML tags and script content
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;

// Dangerous patterns for XSS / CSRF
const DANGEROUS_PATTERNS = [
    /javascript:/gi,
    /on\w+\s*=/gi,         // onerror=, onclick=, onload=, etc.
    /data:\s*text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,   // CSS expression()
    /url\s*\(/gi,          // CSS url()
];

/**
 * Escape HTML entities to prevent rendering of injected HTML.
 */
export function escapeHtml(str: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#96;',
    };
    return str.replace(/[&<>"'`/]/g, (char) => map[char] || char);
}

/**
 * Strip HTML tags completely from a string.
 */
export function stripHtml(str: string): string {
    return str
        .replace(SCRIPT_REGEX, '')
        .replace(HTML_TAG_REGEX, '')
        .trim();
}

/**
 * Remove dangerous patterns (event handlers, javascript: URIs, etc.)
 */
export function removeDangerousPatterns(str: string): string {
    let result = str;
    for (const pattern of DANGEROUS_PATTERNS) {
        result = result.replace(pattern, '');
    }
    return result;
}

/**
 * Sanitize for business names - preserves spaces and allows more characters.
 * Only strips HTML and dangerous patterns, no trimming.
 */
export function sanitizeBusinessName(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return removeDangerousPatterns(stripHtmlNoTrim(input));
}

function stripHtmlNoTrim(str: string): string {
    return str
        .replace(SCRIPT_REGEX, '')
        .replace(HTML_TAG_REGEX, '');
}

/**
 * Main sanitize function for general text inputs.
 * Strips HTML, removes dangerous patterns, and trims whitespace.
 */
export function sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return removeDangerousPatterns(stripHtml(input)).trim();
}

/**
 * Sanitize email addresses — strips tags and validates format.
 */
export function sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') return '';
    const cleaned = stripHtml(input).trim().toLowerCase();
    // Remove any characters not valid in an email
    return cleaned.replace(/[^a-z0-9@._+\-]/g, '');
}

/**
 * Sanitize phone numbers — allow only digits, +, -, (, ), spaces
 */
export function sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/[^0-9+\-() ]/g, '').trim();
}

/**
 * Sanitize URL inputs — strips tags and dangerous protocols
 */
export function sanitizeUrl(input: string): string {
    if (!input || typeof input !== 'string') return '';
    const cleaned = stripHtml(input).trim();
    // Block dangerous protocols
    if (/^(javascript|vbscript|data):/i.test(cleaned)) return '';
    return cleaned;
}

/**
 * Sanitize a full form data object by applying sanitizeText to all string values.
 * Skips sanitization for keys that are likely to contain base64 data URLs or 
 * legitimate external URLs (e.g., Cloudinary links) to prevent corruption.
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
    const sanitized = { ...data };
    const skipKeys = ['businessLogo', 'logoUrl', 'imageUrl', 'profilePic', 'coverUrl', 'qrCode', 'logo'];

    for (const key in sanitized) {
        const value = sanitized[key];
        if (typeof value === 'string') {
            if (skipKeys.includes(key) || value.startsWith('data:image/') || value.startsWith('http')) {
                // Preserve URLs and Data URLs
                (sanitized as Record<string, unknown>)[key] = value;
            } else {
                (sanitized as Record<string, unknown>)[key] = sanitizeText(value);
            }
        }
    }
    return sanitized;
}
