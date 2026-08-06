const STORAGE_KEY = 'vemtap_category_icons';

export function getCategoryIcon(name: string): string {
    const stored = getStoredIcons();
    if (stored[name]) return stored[name];
    const defaults: Record<string, string> = {
        'Food & Drinks': '🍔',
        'Fashion': '👔',
        'Electronics': '📱',
        'Health & Beauty': '💇',
        'Services': '🔧',
        'Supermarket': '🛒',
        'Pharmacy': '💊',
        'Cafes': '☕',
        'Gym': '🏋️',
        'Restaurants': '🍽️',
        'Technology': '💻',
        'Education': '📚',
        'Real Estate': '🏠',
        'Automotive': '🚗',
        'Logistics': '🚚',
        'Construction': '🔨',
        'Agriculture': '🌾',
        'Manufacturing': '🏭',
        'Entertainment': '🎬',
        'Health': '🏥',
        'Beauty': '💄',
        'Professional Services': '💼',
    };
    return defaults[name] || '🏪';
}

export function setCategoryIcon(name: string, emoji: string): void {
    const stored = getStoredIcons();
    stored[name] = emoji;
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
}

export function getAllCategoryIcons(): Record<string, string> {
    const defaults: Record<string, string> = {
        'Food & Drinks': '🍔',
        'Fashion': '👔',
        'Electronics': '📱',
        'Health & Beauty': '💇',
        'Services': '🔧',
        'Supermarket': '🛒',
        'Pharmacy': '💊',
        'Cafes': '☕',
        'Gym': '🏋️',
        'Restaurants': '🍽️',
        'Technology': '💻',
        'Education': '📚',
        'Real Estate': '🏠',
        'Automotive': '🚗',
        'Logistics': '🚚',
        'Construction': '🔨',
        'Agriculture': '🌾',
        'Manufacturing': '🏭',
        'Entertainment': '🎬',
        'Health': '🏥',
        'Beauty': '💄',
        'Professional Services': '💼',
    };
    return { ...defaults, ...getStoredIcons() };
}

function getStoredIcons(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export const EMOJI_OPTIONS = [
    '🍔', '🍕', '🌮', '🥗', '☕', '🍽️',
    '👔', '👗', '👠', '🧢', '👟',
    '📱', '💻', '🖥️', '🎮', '📷',
    '💇', '💄', '💅', '🧴', '💆',
    '🏋️', '🏃', '🧘', '⚽', '🏀',
    '🛒', '🏪', '🛍️', '📦',
    '💊', '🏥', '🩺', '💉',
    '🔧', '🔨', '🚗', '🔩',
    '🏠', '🏢', '🏗️', '🏘️',
    '🚚', '📬', '🚛', '📦',
    '🌾', '🌿', '🌻', '🐄',
    '🏭', '⚙️', '🔬', '🧪',
    '🎬', '🎵', '🎨', '🎪',
    '📚', '🎓', '✏️', '📖',
    '💼', '📊', '📈', '🤝',
    '🏪', '🎯', '⭐', '🔥',
];