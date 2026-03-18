/**
 * Utility functions for WhatsApp "Click to Chat" integration.
 * Rules:
 * - No plus sign in phone number.
 * - No spaces in phone number.
 * - International format.
 */

/**
 * Formats a phone number for WhatsApp wa.me links.
 * @param phone The raw phone number string.
 * @returns A formatted phone number string for WhatsApp.
 */
export function formatPhoneForWhatsApp(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0 (e.g., 080...), replace the 0 with 234
    if (cleaned.startsWith('0')) {
        cleaned = '234' + cleaned.substring(1);
    }
    
    // Ensure it has at least some digits and isn't just an empty string
    return cleaned;
}

/**
 * Generates a WhatsApp wa.me link with an optional prefilled message.
 * @param phone The recipient's phone number.
 * @param message The optional text message to prefill.
 * @returns A full wa.me link.
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const baseUrl = `https://wa.me/${formattedPhone}`;
    
    if (message) {
        const encodedMessage = encodeURIComponent(message);
        return `${baseUrl}?text=${encodedMessage}`;
    }
    
    return baseUrl;
}

/**
 * Replaces placeholders in a message template.
 * @param template The message template with placeholders like [name], [business-name].
 * @param data An object containing values for the placeholders.
 * @returns The message with placeholders replaced.
 */
export function processTemplate(template: string, data: { name?: string; businessName?: string }): string {
    let processed = template;
    
    if (data.name) {
        processed = processed.replace(/\[name\]/g, data.name);
    }
    
    if (data.businessName) {
        processed = processed.replace(/\[business-name\]/g, data.businessName);
    }
    
    return processed;
}

/**
 * Generates a short VemTap Chat Bridge Link.
 * Uses the /chat/[code] redirect route for clean, short URLs in WhatsApp.
 * Example: https://vemtap.com/chat/abc123
 * @param businessCode The unique code of the business.
 * @param visitorId Optional visitor ID to identify the customer.
 * @param visitorName Optional visitor name for personalization.
 * @returns A short URL that redirects to the customer chat page.
 */
export function generateBridgeLink(businessCode: string, visitorId?: string, visitorName?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vemtap.com';
    const url = `${baseUrl}/chat/${businessCode}`;
    
    const params = new URLSearchParams();
    if (visitorId) params.append('v', visitorId);
    if (visitorName) params.append('n', visitorName);
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
}

