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
    // Remove all non-numeric characters (including +, spaces, -, (, ))
    return phone.replace(/\D/g, '');
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
 * Generates a Venture Chat Bridge Link for a business.
 * @param businessId The unique ID or code of the business.
 * @param visitorId Optional visitor ID to identify the customer.
 * @returns A full URL to the bridge landing page.
 */
export function generateBridgeLink(businessId: string, visitorId?: string, visitorName?: string): string {
    // In a real scenario, this would use a public environment variable for the frontend URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vemtap.com';
    let url = `${baseUrl}/tap/${businessId}`;
    
    const params = new URLSearchParams();
    if (visitorId) params.append('v', visitorId);
    if (visitorName) params.append('n', visitorName);
    params.append('source', 'whatsapp');
    
    return `${url}?${params.toString()}`;
}
