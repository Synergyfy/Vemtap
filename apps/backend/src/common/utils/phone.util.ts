/**
 * Utility to format phone numbers to E.164 standard.
 * Currently handles Nigerian numbers by default.
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove any character that is not a digit or the plus sign
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If it already starts with +, assume it's already in international format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove all non-digits for further processing
  const digits = cleaned.replace(/\D/g, '');

  // Nigeria specific: numbers starting with 0 (e.g., 070, 080, 081, 090, 091)
  // Usually 11 digits long.
  if (digits.startsWith('0') && digits.length === 11) {
    return `+234${digits.substring(1)}`;
  }

  // If it starts with 234 but no +, add the +
  if (digits.startsWith('234') && (digits.length === 13 || digits.length === 12)) {
    return `+${digits}`;
  }

  // If it's already 11-15 digits and doesn't start with 0 or +, 
  // it might be an international number without the +.
  if (digits.length >= 10 && digits.length <= 15) {
    // If it doesn't start with a common country code, we might need more logic
    // but for now let's just add + if it looks like a full international number
    if (!digits.startsWith('0')) {
       return `+${digits}`;
    }
  }

  return phone;
}
