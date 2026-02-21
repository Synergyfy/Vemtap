export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;

    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const state = JSON.parse(authStorage).state;
                if (state?.token) {
                    defaultHeaders['Authorization'] = `Bearer ${state.token}`;
                }
            } catch (e) {
                console.error('Error parsing auth storage', e);
            }
        }
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
};

export const api = {
    post: (endpoint: string, data: any, options: RequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
    get: (endpoint: string, options: RequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'GET' }),
    put: (endpoint: string, data: any, options: RequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
    patch: (endpoint: string, data: any, options: RequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
    delete: (endpoint: string, options: RequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'DELETE' }),
};
