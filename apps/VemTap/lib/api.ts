export const normalizeBaseUrl = (raw?: string) => {
    if (!raw) return 'http://localhost:3001/api/v1';
    const trimmed = raw.replace(/\/+$/, '');
    if (trimmed.endsWith('/api/v1')) return trimmed;
    return `${trimmed}/api/v1`;
};

export const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

export interface ExtendedRequestInit extends RequestInit {
    params?: Record<string, any>;
}

export const apiCall = async (endpoint: string, options: ExtendedRequestInit = {}) => {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${BASE_URL}${normalizedEndpoint}`;

    if (options.params) {
        const query = Object.entries(options.params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&');
        if (query) {
            url += `?${query}`;
        }
    }

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options.headers,
    });

    if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage-v2');
        if (authStorage) {
            try {
                const state = JSON.parse(authStorage).state;
                // Support both access_token and token keys just in case
                const token = state?.access_token || state?.token;
                if (token && token !== 'mock-token') {
                    headers.set('Authorization', `Bearer ${token}`);
                }
            } catch (e) {
                console.error('Error parsing auth storage', e);
            }
        }

        // --- Sudo Header Interceptor ---
        const sudoStorage = localStorage.getItem('vemtap-sudo-storage');
        if (sudoStorage) {
            try {
                const { state } = JSON.parse(sudoStorage);
                const session = state?.activeSession;
                if (session && Date.now() < session.expiresAt) {
                    const headerKey = session.type === 'business' ? 'X-VemTap-Sudo-Business' : 'X-VemTap-Sudo-Customer';
                    headers.set(headerKey, session.subjectId);
                    if (session.ticketRef) {
                        headers.set('X-VemTap-Sudo-Ticket', session.ticketRef);
                    }
                }
            } catch (e) {
                console.error('Error parsing sudo storage', e);
            }
        }
        // ------------------------------
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            console.warn(`Unauthorized access to ${url}. Token might be invalid or expired.`);

            // Auto-clear auth on 401 (expired/invalid token)
            // Skip if this is the login endpoint itself
            if (!normalizedEndpoint.includes('/auth/login') && !normalizedEndpoint.includes('/auth/register')) {
                try {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('auth-storage-v2');
                        document.cookie = 'vemtap-auth-token=; path=/; max-age=0; SameSite=Lax';
                    }
                    
                    // Only redirect to login if we are on a protected route
                    if (typeof window !== 'undefined') {
                        const protectedRoutes = ['/dashboard', '/admin', '/agent', '/business', '/marketplace', '/customer', '/user-step', '/bussinesss'];
                        const isProtectedRoute = protectedRoutes.some(route => window.location.pathname.startsWith(route));

                        if (isProtectedRoute && window.location.pathname !== '/login') {
                            window.location.href = '/login';
                            return Promise.reject(new Error('Session expired. Redirecting to login...'));
                        }
                    }                } catch (e) {
                    // ignore errors during cleanup
                }
            }
        }

        let errorData;
        try {
            const text = await response.text();
            errorData = text ? JSON.parse(text) : { message: `API Error: ${response.status}` };
        } catch (e) {
            errorData = { message: `API Error: ${response.status}` };
        }

        throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

export const api = {
    post: (endpoint: string, data: any, options: ExtendedRequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
    get: (endpoint: string, options: ExtendedRequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'GET' }),
    put: (endpoint: string, data: any, options: ExtendedRequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
    patch: (endpoint: string, data: any, options: ExtendedRequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),
    delete: (endpoint: string, data?: any, options: ExtendedRequestInit = {}) =>
        apiCall(endpoint, { ...options, method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
};
