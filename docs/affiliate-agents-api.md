# Affiliate Agents API — VEMTAP Main Backend Proxy

## Overview

The Affiliate Agents API provides proxy endpoints that let the VEMTAP FOS frontend read and manage agent data from the affiliate backend (`affiliate-api.vemtap.com`). The VEMTAP main backend acts as a BFF (Backend For Frontend), forwarding requests to the affiliate API and returning the response.

**Flow:**
```
VEMTAP FOS (Frontend) ──► VEMTAP Main Backend (Proxy) ──► Affiliate Backend
```

**Base URL:** `http://localhost:3001/api/v1` (local)  
**Auth:** Bearer JWT token in `Authorization` header (ADMIN role required)  
**Swagger Docs:** `http://localhost:3002/api-docs`  
**Error Envelope:** `{ statusCode, timestamp, path, method, error, message }`

---

## Authentication

All endpoints require a valid admin JWT token:

```http
Authorization: Bearer <token>
```

| Response | Condition |
|----------|-----------|
| `401 Unauthorized` | Token missing, expired, or invalid |
| `403 Forbidden` | Token is valid but user lacks `ADMIN` role |

---

## Error Response Format

```typescript
interface ApiErrorResponse {
  statusCode: number;   // HTTP status code
  timestamp: string;    // ISO 8601
  path: string;         // Request URL
  method: string;       // HTTP method
  error: string;        // Error type name or message
  message: string;      // Human-readable error
}
```

### Common Error Codes

| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Validation failed (invalid UUID, invalid enum value, missing required field) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks ADMIN role |
| 404 | Not Found | Agent with given ID does not exist |
| 409 | Conflict | Email or phone already in use (POST / PATCH) |
| 500 | Internal Server Error | Affiliate backend returned an error |
| 503 | Service Unavailable | Affiliate backend is unreachable |

---

## Endpoints

### 1. GET /affiliates/agents — List Agents

Returns paginated agents with computed metrics (network size, revenue generated, commissions).

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (min 1) |
| perPage | number | No | 10 | Results per page (min 1, max 100) |
| search | string | No | — | Search by name, email, or phone |
| status | string | No | — | Filter by status: `ACTIVE`, `SUSPENDED`, `DEACTIVATED` |

#### Response

```typescript
// 200 OK
interface ListAgentsResponse {
  agents: AgentListItem[];
  total: number;
}

interface AgentListItem {
  id: string;                 // UUID
  name: string;               // Full name
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  dateJoined: string;         // ISO 8601
  managerId: string | null;   // null = Manager (no one above)
  managerName: string | null; // Parent agent's name
  businessesCount: number;    // Network Size
  managedMrr: number;         // Revenue Generated (sum of MRR)
  commissionEarned: number;   // Sum of commissions
}
```

#### Edge Cases

- **Empty results:** Returns `{ agents: [], total: 0 }`
- **Invalid UUID format for status:** Returns 400 with validation error
- **Page beyond available data:** Returns `{ agents: [], total: <actual_total> }`
- **Null managerId:** Agent is a Manager (no parent). `managerName` will also be `null`
- **Agent without businesses:** `businessesCount: 0`, `managedMrr: 0`, `commissionEarned: 0`

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/affiliates/agents?page=1&perPage=10&status=ACTIVE"
```

```json
{
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Chidi Okafor",
      "email": "chidi@vemtap.com",
      "phone": "+2348022334455",
      "status": "ACTIVE",
      "dateJoined": "2026-01-15T00:00:00.000Z",
      "managerId": "550e8400-e29b-41d4-a716-446655440001",
      "managerName": "Azeem Bello",
      "businessesCount": 6,
      "managedMrr": 1250000,
      "commissionEarned": 187500
    }
  ],
  "total": 42
}
```

---

### 2. GET /affiliates/agents/:id — Agent Detail

Returns full agent profile including subordinates and businesses.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Agent identifier |

#### Response

```typescript
// 200 OK
interface AgentDetailResponse {
  id: string;                 // UUID
  name: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  dateJoined: string;         // ISO 8601
  managerId: string | null;
  managerName: string | null;
  businessesCount: number;
  managedMrr: number;
  commissionEarned: number;
  subordinates: Subordinate[];
  businesses: AgentBusiness[];
}

interface Subordinate {
  id: string;   // Subordinate's UUID
  name: string; // Subordinate's full name
  email: string;
}

interface AgentBusiness {
  id: string;                      // Business UUID
  name: string;                    // Business name
  plan: 'BASIC' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  mrr: number;                     // Monthly recurring revenue
  status: string;                  // Business status
}
```

#### Edge Cases

- **Invalid UUID format:** Returns 400 with validation error
- **Agent not found:** Returns 404 with `{ statusCode: 404, message: "Agent not found" }`
- **Manager with no subordinates:** `subordinates` is an empty array `[]`
- **Agent with no businesses:** `businesses` is an empty array `[]`
- **Manager (managerId = null):** `managerId` is `null`, `managerName` is `null`

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/affiliates/agents/550e8400-e29b-41d4-a716-446655440000"
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Chidi Okafor",
  "email": "chidi@vemtap.com",
  "phone": "+2348022334455",
  "status": "ACTIVE",
  "dateJoined": "2026-01-15T00:00:00.000Z",
  "managerId": "550e8400-e29b-41d4-a716-446655440001",
  "managerName": "Azeem Bello",
  "businessesCount": 6,
  "managedMrr": 1250000,
  "commissionEarned": 187500,
  "subordinates": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "name": "Sub Agent One",
      "email": "sub1@vemtap.com"
    }
  ],
  "businesses": [
    {
      "id": "biz-uuid-1",
      "name": "The Azure Bistro",
      "plan": "PROFESSIONAL",
      "mrr": 250000,
      "status": "ACTIVE"
    }
  ]
}
```

---

### 3. GET /affiliates/agents/:id/revenue — Monthly Revenue Trend

Returns 12 months of historical revenue data for a bar chart.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Agent identifier |

#### Response

```typescript
// 200 OK
interface RevenueTrendResponse {
  months: MonthlyRevenue[];
}

interface MonthlyRevenue {
  month: string;   // 3-letter abbreviation: "Jan", "Feb", etc.
  revenue: number; // Cumulative MRR for that month
}
```

#### Edge Cases

- **Invalid UUID format:** Returns 400
- **Agent not found:** Returns 404
- **No business activity in a month:** That month returns `revenue: 0`
- **Exactly 12 months returned:** Always returns 12 months worth of data (Jul–Jun or similar)

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/affiliates/agents/550e8400-e29b-41d4-a716-446655440000/revenue"
```

```json
{
  "months": [
    { "month": "Jul", "revenue": 0 },
    { "month": "Aug", "revenue": 850000 },
    { "month": "Sep", "revenue": 920000 },
    { "month": "Oct", "revenue": 1100000 },
    { "month": "Nov", "revenue": 1250000 },
    { "month": "Dec", "revenue": 1250000 },
    { "month": "Jan", "revenue": 1300000 },
    { "month": "Feb", "revenue": 1400000 },
    { "month": "Mar", "revenue": 1350000 },
    { "month": "Apr", "revenue": 1500000 },
    { "month": "May", "revenue": 1600000 },
    { "month": "Jun", "revenue": 1700000 }
  ]
}
```

---

### 4. POST /affiliates/agents — Create Agent

Creates a new agent user in the affiliate system.

#### Request Body

```typescript
interface CreateAgentRequest {
  name: string;        // Required. Agent's full name
  email: string;       // Required. Agent's email (must be unique)
  phone: string;       // Required. Agent's phone (must be unique)
  password?: string;   // Optional. Auto-generated 12-char if omitted
  status?: string;     // Optional. Default: "ACTIVE". "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
  managerId?: string;  // Optional. UUID of parent agent. null = Manager
}
```

#### Response

```typescript
// 201 Created
// Returns the full AgentDetailResponse shape (same as GET /agents/:id)
type CreateAgentResponse = AgentDetailResponse;
```

#### Edge Cases

- **Missing required fields (name, email, phone):** Returns 400
- **Invalid email format:** Returns 400
- **Email or phone already in use:** Returns 409 with `{ statusCode: 409, message: "Agent with this email or phone already exists" }`
- **managerId refers to non-existent agent:** Returns 404 (validated by affiliate backend)
- **Omitted password:** Affiliate backend auto-generates a 12-character password

#### Example

```bash
curl -X POST "http://localhost:3002/api/v1/affiliates/agents" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chidi Okafor",
    "email": "chidi@vemtap.com",
    "phone": "+2348022334455",
    "managerId": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Chidi Okafor",
  "email": "chidi@vemtap.com",
  "phone": "+2348022334455",
  "status": "ACTIVE",
  "dateJoined": "2026-06-03T00:00:00.000Z",
  "managerId": "550e8400-e29b-41d4-a716-446655440001",
  "managerName": "Azeem Bello",
  "businessesCount": 0,
  "managedMrr": 0,
  "commissionEarned": 0,
  "subordinates": [],
  "businesses": []
}
```

---

### 5. PATCH /affiliates/agents/:id — Update Agent

Updates one or more fields on an existing agent. All body fields are optional — only provided fields are updated.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Agent identifier |

#### Request Body

```typescript
interface UpdateAgentRequest {
  name?: string;       // Agent's full name
  email?: string;      // Agent's email (must be unique)
  phone?: string;      // Agent's phone (must be unique)
  status?: string;     // "ACTIVE" | "SUSPENDED" | "DEACTIVATED"
  managerId?: string;  // UUID of parent agent. null = make this agent a Manager
}
```

#### Response

```typescript
// 200 OK
// Returns the full updated AgentDetailResponse shape
type UpdateAgentResponse = AgentDetailResponse;
```

#### Edge Cases

- **Empty body (no fields provided):** Returns 200 with existing data unchanged — no-op
- **Invalid UUID for managerId:** Returns 400
- **Agent not found:** Returns 404
- **Email/phone conflict with another agent:** Returns 409
- **Setting managerId to null:** Promotes agent to Manager role
- **Partial update:** Only provided fields are changed; all existing values persist

#### Example

```bash
curl -X PATCH "http://localhost:3002/api/v1/affiliates/agents/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chidi Updated",
    "status": "SUSPENDED"
  }'
```

---

### 6. DELETE /affiliates/agents/:id — Deactivate Agent

Soft-deletes an agent by setting their status to `DEACTIVATED`.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string (UUID) | Yes | Agent identifier |

#### Response

```typescript
// 204 No Content
// No response body on success
```

#### Edge Cases

- **Agent not found:** Returns 404
- **Agent already DEACTIVATED:** Returns 204 (idempotent — no error)
- **Invalid UUID:** Returns 400

#### Example

```bash
curl -X DELETE "http://localhost:3002/api/v1/affiliates/agents/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

Response: `204 No Content` (empty body)

---

## TypeScript Interfaces Summary

```typescript
// === Query DTOs ===

interface ListAgentsQuery {
  page?: number;              // default: 1
  perPage?: number;           // default: 10, max: 100
  search?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

interface CreateAgentRequest {
  name: string;
  email: string;
  phone: string;
  password?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  managerId?: string;
}

interface UpdateAgentRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  managerId?: string;
}

// === Response DTOs ===

interface AgentListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  dateJoined: string;
  managerId: string | null;
  managerName: string | null;
  businessesCount: number;
  managedMrr: number;
  commissionEarned: number;
}

interface ListAgentsResponse {
  agents: AgentListItem[];
  total: number;
}

interface Subordinate {
  id: string;
  name: string;
  email: string;
}

interface AgentBusiness {
  id: string;
  name: string;
  plan: 'BASIC' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  mrr: number;
  status: string;
}

interface AgentDetailResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  dateJoined: string;
  managerId: string | null;
  managerName: string | null;
  businessesCount: number;
  managedMrr: number;
  commissionEarned: number;
  subordinates: Subordinate[];
  businesses: AgentBusiness[];
}

interface MonthlyRevenue {
  month: string;   // "Jan" | "Feb" | ... | "Dec"
  revenue: number;
}

interface RevenueTrendResponse {
  months: MonthlyRevenue[];
}

interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string;
}
```

---

## Validation Rules

| Field | Validator | Rule |
|-------|-----------|------|
| page | `@IsInt()` `@Min(1)` | Integer, minimum 1 |
| perPage | `@IsInt()` `@Min(1)` `@Max(100)` | Integer, 1–100 |
| search | `@IsString()` `@IsOptional()` | Free string |
| status | `@IsEnum(AgentStatus)` | Must be `ACTIVE`, `SUSPENDED`, or `DEACTIVATED` |
| id (path) | `ParseUUIDPipe` | Valid UUID v4 |
| name | `@IsString()` | Required for POST, optional for PATCH |
| email | `@IsEmail()` | Required for POST, optional for PATCH |
| phone | `@IsString()` | Required for POST, optional for PATCH |
| managerId | `@IsUUID()` | Optional. Valid UUID or omitted/null |

---

## Rate Limiting

The API applies global rate limiting via `@nestjs/throttler`. Default: 10 requests per 60 seconds per IP. Configured via `THROTTLE_TTL` and `THROTTLE_LIMIT` environment variables.

---

## Data Flow Summary

```
VEMTAP FOS (Frontend)              VEMTAP Main Backend                Affiliate Backend
       │                                  │                                  │
       │  GET /affiliates/agents          │                                  │
       │ ──────────────────────►          │  GET /agents                     │
       │                                  │ ──────────────────────────────►  │
       │                                  │  ◄────────────────────────────── │
       │  ◄──────────────────────         │                                  │
       │                                  │                                  │
       │  GET /affiliates/agents/:id      │                                  │
       │ ──────────────────────►          │  GET /agents/:id                 │
       │                                  │ ──────────────────────────────►  │
       │                                  │  ◄────────────────────────────── │
       │  ◄──────────────────────         │                                  │
       │                                  │                                  │
       │  GET /affiliates/agents/:id/revenue                               │
       │ ──────────────────────►          │  GET /agents/:id/revenue         │
       │                                  │ ──────────────────────────────►  │
       │                                  │  ◄────────────────────────────── │
       │  ◄──────────────────────         │                                  │
       │                                  │                                  │
       │  POST /affiliates/agents         │                                  │
       │ ──────────────────────►          │  POST /agents                    │
       │                                  │ ──────────────────────────────►  │
       │                                  │  ◄────────────────────────────── │
       │  ◄──────────────────────         │                                  │
       │                                  │                                  │
       │  PATCH /affiliates/agents/:id    │                                  │
       │ ──────────────────────►          │  PATCH /agents/:id               │
       │                                  │ ──────────────────────────────►  │
       │                                  │  ◄────────────────────────────── │
       │  ◄──────────────────────         │                                  │
       │                                  │                                  │
       │  DELETE /affiliates/agents/:id   │                                  │
       │ ──────────────────────►          │  DELETE /agents/:id              │
       │                                  │ ──────────────────────────────►  │
       │                                  │  ◄────────────────────────────── │
       │  ◄──────────────────────         │                                  │
```

---

## Implementation Notes

- **Auth delegation:** The frontend authenticates to VEMTAP main backend via JWT (admin only). The backend then authenticates to the affiliate backend via `x-vemtap-secret` header. Frontend never needs the shared secret.
- **Error passthrough:** HTTP errors from the affiliate backend are forwarded with appropriate NestJS exceptions (404 → `NotFoundException`, 409 → `ConflictException`). If the affiliate backend is unreachable, the proxy returns `503 Service Unavailable`.
- **Idempotent DELETE:** The `DELETE` endpoint is idempotent — calling it on an already-deactivated agent returns `204 No Content` (no error).
