# VEMTAP FOS — Authentication Guide for Frontend

## Base URL

```
http://<host>:3001/api/v1
```

Global prefix is `api/v1`, set in `apps/backend/src/main.ts`.

---

## 1. Getting an Admin Account

Send `POST /api/v1/auth/register/admin` with the env-configured admin code:

**Request:**
```json
{
  "firstName": "Azeem",
  "lastName": "Admin",
  "email": "azeem@vemtap.com",
  "phone": "+2348012345678",
  "password": "securePassword123!",
  "adminAccountCode": "989983bsdbs302930"
}
```

The `adminAccountCode` is the value of `ADMIN_ACCOUNT_CODE` in `.env`.

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "azeem@vemtap.com",
    "firstName": "Azeem",
    "lastName": "Admin",
    "role": "Admin",
    "status": "Active",
    ...
  },
  "isNewUser": true
}
```

Once registered, use the login flow going forward.

---

## 2. Login

```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "identifier": "azeem@vemtap.com",
  "password": "securePassword123!"
}
```

`identifier` accepts **email** or **phone number**.

**Success Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "azeem@vemtap.com",
    "firstName": "Azeem",
    "lastName": "Admin",
    "role": "Admin",
    "authProvider": "LOCAL",
    "phone": "+2348012345678",
    "status": "Active",
    "branchId": null,
    "businessId": null,
    "isPasswordChanged": false,
    "permissions": null,
    "avatar": null,
    "pushToken": null,
    "uniqueCode": null,
    "optInChannels": null,
    "optOut": false,
    "lastActive": null,
    "referralCode": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "isNewUser": false
}
```

**Key points:**
- `access_token` is a JWT string with `expiresIn: 1d` (set by `JWT_EXPIRATION` env var)
- `user.role` must be `"Admin"` for FOS access
- There is **no refresh token** — only a single access token

---

## 3. Authenticated Requests

Every API call **except login/register** must include:

```
Authorization: Bearer <access_token>
```

If missing or expired, the server returns `401 Unauthorized`.

---

## 4. Token Expiry & Re-login

This backend does **not** implement refresh tokens. The access token has a fixed lifespan (`JWT_EXPIRATION`, default `1d`).

**Flow:**

```
[Token valid]  →  API calls succeed
[Token expires] →  API returns 401
                →  Clear stored token
                →  Redirect to login page
                →  User re-enters credentials
                →  New token obtained
```

---

## 5. Recommended Frontend Implementation

### 5a. Axios Interceptor Pattern

```typescript
import axios, { AxiosInstance } from 'axios';

const FOS_API: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3002/api/v1',
});

// --- Attach token to every request ---
FOS_API.interceptors.request.use((config) => {
  const token = localStorage.getItem('fos_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Handle 401 → redirect to login ---
FOS_API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Avoid redirect loop if already on login page
      if (!currentPath.includes('/login')) {
        localStorage.removeItem('fos_access_token');
        localStorage.removeItem('fos_user');
        window.location.href = '/fos/login';
      }
    }
    return Promise.reject(err);
  }
);
```

### 5b. Login Function

```typescript
export async function fosLogin(email: string, password: string) {
  const { data } = await axios.post(
    'http://localhost:3002/api/v1/auth/login',
    { identifier: email, password },
  );
  // data = { access_token, user, isNewUser }
  localStorage.setItem('fos_access_token', data.access_token);
  localStorage.setItem('fos_user', JSON.stringify(data.user));
  return data;
}
```

### 5c. Logout

```typescript
export function fosLogout() {
  localStorage.removeItem('fos_access_token');
  localStorage.removeItem('fos_user');
  window.location.href = '/fos/login';
}
```

### 5d. Checking Auth State

```typescript
export function getFosToken(): string | null {
  return localStorage.getItem('fos_access_token');
}

export function getFosUser(): { role: string } | null {
  const raw = localStorage.getItem('fos_user');
  return raw ? JSON.parse(raw) : null;
}

export function isFosAuthenticated(): boolean {
  const token = getFosToken();
  if (!token) return false;
  // Optional: decode JWT to check expiry without a server call
  // const payload = JSON.parse(atob(token.split('.')[1]));
  // return payload.exp * 1000 > Date.now();
  return true;
}
```

---

## 6. JWT Payload (for client-side decoding)

Decode the token's middle segment (base64):

```json
{
  "email": "azeem@vemtap.com",
  "sub": "user-uuid",
  "role": "Admin",
  "branchId": null,
  "businessId": null,
  "referralCode": null,
  "iat": 1700000000,
  "exp": 1700086400
}
```

- `sub` is the user UUID
- `role` is the user role (`"Admin"`)
- `exp` is the Unix timestamp when the token expires

---

## 7. Protecting Routes (Frontend Router Guard)

```typescript
function requireFosAuth(to, from, next) {
  const token = localStorage.getItem('fos_access_token');
  if (!token) {
    next('/fos/login');
    return;
  }
  const user = JSON.parse(localStorage.getItem('fos_user') || '{}');
  if (user.role !== 'Admin') {
    next('/fos/login');  // or 403 page
    return;
  }
  next();
}
```

---

## 8. Summary

| Concept | Detail |
|---------|--------|
| Login | `POST /api/v1/auth/login` with `{identifier, password}` |
| Token Location | `access_token` field in login response |
| Token Type | Bearer JWT, `Authorization: Bearer <token>` header |
| Expiry | 1 day (configurable via `JWT_EXPIRATION` env var) |
| Refresh | **Not supported** — re-login required on expiry |
| Admin Registration | `POST /api/v1/auth/register/admin` with `adminAccountCode` |
| Role Check | All FOS endpoints require `role === "Admin"` |
| On 401 | Clear token, redirect to login page |
| React/Vue/Angular | Use axios interceptor pattern above |
