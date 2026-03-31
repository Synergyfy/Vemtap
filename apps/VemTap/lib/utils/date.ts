import { format, formatDistanceToNow, isToday, isYesterday, isValid, parseISO } from 'date-fns';

/**
 * Formats a date string or Date object into a readable format.
 * Example: '2024-02-26T...' -> 'Feb 26, 2024'
 */
export function formatDate(date: string | Date | undefined | null, formatStr: string = 'MMM d, yyyy'): string {
    if (!date) return 'N/A';

    const d = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(d)) return 'Invalid Date';

    return format(d, formatStr);
}

/**
 * Returns a relative time string.
 * Example: '2 hours ago', '3 days ago'
 */
export function formatRelative(date: string | Date | undefined | null): string {
    if (!date) return 'N/A';

    const d = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(d)) return 'Invalid Date';

    return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Formats a date to include time.
 * Example: 'Feb 26, 2024 at 10:30 AM'
 */
export function formatDateTime(date: string | Date | undefined | null): string {
    return formatDate(date, 'MMM d, yyyy') + ' at ' + formatDate(date, 'h:mm a');
}

/**
 * Custom format for orders: Today, Yesterday, or MMM d, yyyy
 */
export function formatOrderDate(date: string | Date | undefined | null): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return 'Invalid Date';

    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    
    return format(d, 'MMM d, yyyy');
}
