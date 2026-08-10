# Vemtap FOS — Frontend Integration Guide (Backend v1)

> **Audience:** Vemtap Front Office System (FOS) frontend team.
> **Backend base URL:** `/api/v1` (proxied through the FOS Next.js app via `apps/web/src/app/api/v1/[...path]/route.ts`, or hit directly).
> **Status:** Live — the endpoints below are implemented on the Vemtap backend and verified against the FOS API spec.

This guide replaces the mock layer. Read §1–§4 first (they describe conventions your interceptor already depends on), then jump to the endpoint section you need. Every endpoint documents the **request payload** and the **response `data` payload** (the shape after your interceptor unwraps `{ success, data }`).

---

## Table of contents

1. [Base URL & request conventions](#1-base-url--request-conventions)
2. [Authentication](#2-authentication)
3. [Response envelope & errors](#3-response-envelope--errors)
4. [Global conventions (money, dates, enums, pagination)](#4-global-conventions)
5. [Endpoint reference](#5-endpoint-reference)
   - [5.1 Auth](#51-auth)
   - [5.2 Dashboard](#52-dashboard)
   - [5.3 Revenue](#53-revenue)
   - [5.4 Expenses](#54-expenses)
   - [5.5 P&L & Cash Flow](#55-pl--cash-flow)
   - [5.6 Budgets & Forecasts](#56-budgets--forecasts)
   - [5.7 Goals](#57-goals)
   - [5.8 Receivables](#58-receivables)
   - [5.9 Payables](#59-payables)
   - [5.10 Businesses](#510-businesses)
   - [5.11 Affiliate Agents](#511-affiliate-agents)
   - [5.12 Messaging (SMS / Email)](#512-messaging-sms--email)
   - [5.13 QRThrive Funnel](#513-qrthrive-funnel)
   - [5.14 Notifications](#514-notifications)
   - [5.15 Settings & Team](#515-settings--team)
   - [5.16 Reports](#516-reports)
   - [5.17 AI Assistant](#517-ai-assistant)
   - [5.18 Forecasting](#518-forecasting)
   - [5.19 Financial Planning](#519-financial-planning)
6. [HTTP status codes](#6-http-status-codes)
7. [Envelope coverage summary](#7-envelope-coverage-summary)
8. [Integration checklist](#8-integration-checklist)

---

## 1. Base URL & request conventions

- **Base:** `/api/v1`
- **Content type:** `application/json` on request and response.
- **Auth header:** `Authorization: Bearer <access_token>` on every authenticated call.
- **IDs:** opaque strings (UUIDs). They are stable and round-trip exactly — treat them as opaque, never parse them.
- **Query params:** unknown/unsupported params are ignored (never 400).

Your axios instance is already configured with `baseURL: "/api/v1"` and the response interceptor that unwraps `{ success, data }`. Keep it — it works with both enveloped and raw responses (see §3).

---

## 2. Authentication

The backend signs a JWT. The frontend stores it exactly as before:

| Storage | Key | Value |
|---|---|---|
| `localStorage` | `fos_access_token` | bearer token |
| Cookie | `fos_access_token` | same token (set client-side from login response for Next.js route guarding) |
| `localStorage` | `fos_user` | user object from the login/register response |

**Roles:** `USER`, `SUPER_ADMIN`, `Admin`, `Owner`, `Manager`, `Staff`, `Customer`, `Agent`. The FOS app runs as **`SUPER_ADMIN`** (or `Admin`). All FOS endpoints accept `Admin` or `SUPER_ADMIN`.

On a `401` response the frontend must:
1. clear `fos_access_token` and `fos_user` from `localStorage`,
2. redirect to `/login`.

---

## 3. Response envelope & errors

### 3.1 Envelope

Most FOS endpoints wrap responses as:

```json
{ "success": true, "data": <payload> }
```

Your interceptor already unwraps this and returns `<payload>` to the caller:

```ts
res => {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
}
```

**Important:** a few shared endpoints return **raw** payloads (no envelope) — the interceptor passes them through untouched, so you don't need to change anything:

- `auth/*` (login/register/change-password/profile)
- `businesses/*` (shared with the VemTap control-tower)
- `affiliates/agents/*`
- `notifications/*`

See [§7 Envelope coverage summary](#7-envelope-coverage-summary) for the exact list.

### 3.2 Error body

Errors always come back as (regardless of endpoint):

```json
{
  "success": false,
  "statusCode": 401,
  "timestamp": "2026-08-06T12:00:00.000Z",
  "path": "/api/v1/dashboard/stats",
  "method": "GET",
  "error": "Unauthorized",
  "message": "Unauthorized"
}
```

**Read `error.data.message` for the human-readable message** (login/register banners, form errors, etc.). `errors` is not currently emitted by the global filter.

---

## 4. Global conventions

| Thing | Rule |
|---|---|
| Money | All amounts are **numbers** (NGN, no kobo). Never strings. Frontend formats. |
| Percentages | Plain numbers (`50.0` = 50%). |
| Dates | ISO `YYYY-MM-DD` (e.g. `"2026-07-18"`). |
| Timestamps | ISO-8601 UTC (`"2026-07-01T00:00:00.000Z"`). |
| Pagination | `page` (1-based) + `perPage` (or `limit` on `/businesses/admin`). Responses include `total`. |
| Enums | Exact uppercase strings — see each endpoint. |

---

## 5. Endpoint reference

Legend: 🔒 authenticated · 🔓 public.

---

### 5.1 Auth

#### `POST /api/v1/auth/login` — 🔓

**Request**

```json
{ "identifier": "admin@vemtap.com", "password": "password123" }
```

**Response (raw, no envelope)** — `200`

```json
{
  "access_token": "eyJhbGciOi...",
  "sessionId": "7a5c4c7f-c22a-4c93-9706-f7f54a07c5bb",
  "user": {
    "id": "usr_001",
    "email": "admin@vemtap.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN"
  },
  "isNewUser": false
}
```

**TypeScript**

```ts
interface LoginPayload { identifier: string; password: string; }
interface AuthResponse {
  access_token: string;
  sessionId?: string;
  user: { id: string; email: string; firstName: string; lastName: string; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | string };
  isNewUser?: boolean;
}
```

**2FA note:** if the account has 2FA enabled and `twoFactorCode` is omitted, the response is `{ "requiresTwoFactor": true }` (HTTP 200). Retry with `twoFactorCode` included.

**Errors:** `401` invalid credentials, `400` missing fields.

#### `POST /api/v1/auth/register/admin` — 🔓 (platform admin, recommended for FOS)

**Request** — `name` is split into `firstName`/`lastName` automatically.

```json
{
  "name": "Jane Doe",
  "email": "jane@vemtap.com",
  "password": "Secret123!",
  "adminAccountCode": "admin_secret_123"
}
```

**Response** — same `AuthResponse` shape as login, with `role: "SUPER_ADMIN"`. **Errors:** `401` bad code, `400` server not configured, `409` email exists.

> If your FOS register page calls the spec-documented `POST /auth/register` instead, the backend also accepts `{ name, email, password }` there — but that creates a **generic user**, not an admin. For the FOS admin platform, use `/auth/register/admin` (secret-gated).

#### `POST /api/v1/auth/change-password` — 🔒

**Request**

```json
{ "currentPassword": "old", "newPassword": "new-secret" }
```

**Response (raw)** — `200`

```json
{ "message": "Password updated successfully" }
```

#### `GET /api/v1/auth/profile` — 🔒

Returns the full user entity (raw). Fields include `id, email, firstName, lastName, role, phone, status, branchId, businessId, emailVerified, twoFactorEnabled`.

---

### 5.2 Dashboard

All three routes are 🔒 `Admin`/`SUPER_ADMIN` and **enveloped**.

#### `GET /api/v1/dashboard/stats`

**Response `data`**

```json
{
  "totalRevenue": 2847500,
  "netProfit": 1423750,
  "totalBusinesses": 342,
  "activeAgents": 28,
  "churnRate": 2.3,
  "conversionRate": 18.7,
  "smsSent": 1245800,
  "vemtapRevenue": 1993250,
  "qrthriveRevenue": 854250,
  "commissionsPaid": 425600,
  "cashBalance": 892300
}
```

```ts
interface DashboardStats {
  totalRevenue: number; netProfit: number; totalBusinesses: number;
  activeAgents: number; churnRate: number; conversionRate: number;
  smsSent: number; vemtapRevenue: number; qrthriveRevenue: number;
  commissionsPaid: number; cashBalance: number;
}
```

#### `GET /api/v1/dashboard/snapshots`

**Response `data`** — array (one per day, ascending).

```json
[
  { "date": "2026-06-18", "totalRevenue": 85000, "totalProfit": 42000, "totalBusinesses": 330, "churnRate": 1.5, "conversionRate": 15.0 }
]
```

#### `GET /api/v1/dashboard/insights`

**Response `data`** — **array** of insights.

```json
[
  { "type": "HIGH_PERFORMANCE", "title": "Top Performer", "message": "Agent X drove N... in MRR", "severity": "SUCCESS" }
]
```

`severity` ∈ `INFO | SUCCESS | WARNING | DANGER`; `type` is free-form (used as an icon key).

---

### 5.3 Revenue

All routes 🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `GET /api/v1/revenue/transactions`

**Query params:** `page` (default 1), `perPage` (default 10), `type`, `platform`, `businessId`, `agentId`, `startDate`, `endDate` (all optional).

**Response `data`**

```json
{
  "transactions": [
    {
      "id": "txn_001",
      "type": "SUBSCRIPTION",
      "platform": "VEMTAP",
      "paymentMethod": "CARD",
      "amount": 45000,
      "cost": 0,
      "profit": 45000,
      "referenceId": "ref_001",
      "date": "2026-07-06",
      "businessId": "biz_001",
      "businessName": "Lagos Pizza Co.",
      "agentId": "agt_001",
      "agentName": "Chidinma Eze"
    }
  ],
  "total": 247
}
```

`type` ∈ `SUBSCRIPTION | SMS | COMMISSION | EXPENSE | REFUND | POS_SALE | POS_REFUND`; `platform` ∈ `VEMTAP | QRTHRIVE`. `businessName`/`agentName` may be `null`.

#### `GET /api/v1/revenue/aggregates`

**Response `data`**

```json
{
  "totalRevenue": 2847500,
  "subscriptionRevenue": 1890000,
  "smsRevenue": 957500,
  "totalProfit": 1423750,
  "agentPayouts": 425600,
  "totalTransactions": 2847
}
```

#### `GET /api/v1/revenue/trends`

Query: `startDate`, `endDate` (optional). **Response `data`**:

```json
[ { "date": "2026-01", "revenue": 180000, "profit": 90000 } ]
```

#### `GET /api/v1/revenue/chart-data`

Query: `startDate`, `endDate`, `platform`, `type` (optional). **Response `data`**:

```json
{
  "monthlyPlatformRevenue": [ { "month": "2026-02", "total": 195000, "vemtap": 130000, "qrthrive": 65000 } ],
  "revenueByType": [ { "name": "SUBSCRIPTION", "value": 1890000 } ]
}
```

#### `GET /api/v1/revenue/business/:businessId/history`

**Response `data`**

```json
{ "transactions": [ { "id": "txn_001", "date": "2026-07-06", "amount": 45000, "profit": 45000, "type": "SUBSCRIPTION" } ] }
```

---

### 5.4 Expenses

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `GET /api/v1/expenses`

Query: `page` (default 1), `perPage` (default 20), `category` (optional). **Response `data`**:

```json
{
  "expenses": [
    { "id": "exp_001", "category": "Server & Hosting", "amount": 85000, "frequency": "RECURRING", "date": "2026-07-01", "createdAt": "2026-07-01T00:00:00.000Z" }
  ],
  "total": 8,
  "page": 1,
  "perPage": 20,
  "hasNextPage": false
}
```

#### `POST /api/v1/expenses`

**Request**

```json
{ "category": "Marketing", "amount": 50000, "frequency": "ONE_TIME", "date": "2026-07-18" }
```

`date` optional (defaults today); `frequency` ∈ `ONE_TIME | RECURRING`. **Response `data`** — the created expense (same object shape as the list item). Creating an expense also writes a matching OUTFLOW cash-flow row.

#### `PATCH /api/v1/expenses/:id`

**Request** — partial: any of `{ category, amount, frequency }`. **Response `data`** — updated expense.

#### `DELETE /api/v1/expenses/:id`

**Response `data`** — `{ "message": "Expense deleted successfully" }`. Also removes the paired cash-flow row.

---

### 5.5 P&L & Cash Flow

🔒 `Admin`/`SUPER_ADMIN`, **enveloped** (services already return `{ success, data }`, interceptor passes through).

#### `GET /api/v1/pnl/statement`

**Response `data`**

```json
{
  "grossRevenue": 2847500,
  "gatewayCost": 85425,
  "commissionPaid": 425600,
  "opexPaid": 2310000,
  "netProfit": 1423750,
  "profitMarginPercentage": 50.0
}
```

#### `GET /api/v1/pnl/cashflows`

Query: `page`, `perPage`, `type` (`INFLOW | OUTFLOW`). **Response `data`**:

```json
{
  "cashflows": [
    { "id": "cf_001", "type": "INFLOW", "category": "Subscriptions", "amount": 1890000, "date": "2026-07-01", "createdAt": "2026-07-01T00:00:00.000Z" }
  ],
  "total": 7
}
```

#### `POST /api/v1/pnl/cashflows`

**Request**

```json
{ "type": "INFLOW", "category": "Sales Revenue", "amount": 100000, "date": "2026-07-18" }
```

`date` optional. **Response `data`** — created entry.

#### `GET /api/v1/pnl/cashflow-runway`

**Response `data`**

```json
{
  "openingCashBalance": 650000,
  "closingCashBalance": 892300,
  "monthlyNetCashFlow": 242300,
  "monthlyBurnRate": 2230000,
  "runwayMonths": 12
}
```

#### `GET /api/v1/pnl/cost-break-even`

**Response `data`**

```json
{
  "totalMonthlyCosts": 2310000,
  "monthlyFixedCosts": 1635000,
  "grossRevenue": 2847500,
  "activeBusinesses": 342,
  "arpu": 8324,
  "breakEvenBusinesses": 196,
  "breakEvenRevenue": 1635000,
  "progressPercent": 210,
  "remainingGap": 0,
  "isProfitable": true
}
```

#### `GET /api/v1/pnl/revenue-trends`

⚠️ Field names differ from `/revenue/trends` — this one uses **`month` + `costs`** (three series).

```json
[ { "month": "2026-01", "revenue": 180000, "costs": 140000, "profit": 40000 } ]
```

#### (Legacy, still available) `GET /api/v1/pnl/break-even`, `GET /api/v1/pnl/runway`

---

### 5.6 Budgets & Forecasts

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `GET /api/v1/budgets`

**Response `data`** — array:

```json
[
  {
    "id": "bud_001",
    "periodType": "MONTHLY",
    "targetRevenue": 3000000,
    "targetBusinesses": 350,
    "targetSmsUsage": 1500000,
    "targetProfit": 1500000,
    "startDate": "2026-06-18",
    "endDate": "2026-07-18",
    "achievedRevenuePercentage": 94.9,
    "achievedProfitPercentage": 94.9,
    "createdAt": "2026-06-18T00:00:00.000Z"
  }
]
```

`periodType` ∈ `DAILY | WEEKLY | MONTHLY | YEARLY`. Achieved percentages are computed server-side.

#### `POST /api/v1/budgets`

**Request**

```json
{
  "periodType": "MONTHLY",
  "targetRevenue": 3000000,
  "targetBusinesses": 350,
  "targetSmsUsage": 1500000,
  "targetProfit": 1500000,
  "startDate": "2026-06-18",
  "endDate": "2026-07-18"
}
```

**Response `data`** — the created budget (same shape above).

#### `GET /api/v1/budgets/forecasts`

Query: `scenario` (optional, currently ignored). **Response `data`** — array read from saved forecast scenarios:

```json
[
  {
    "id": "fc_001",
    "forecastType": "REVENUE",
    "projectedValue": 3200000,
    "growthRate": 12.3,
    "churnRate": 2.1,
    "conversionRate": 18.5,
    "period": "12",
    "scenario": "EXPECTED",
    "createdAt": "2026-07-01T00:00:00.000Z"
  }
]
```

---

### 5.7 Goals

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `GET /api/v1/goals`

**Response `data`**

```json
{
  "goals": [
    { "id": "goal_001", "name": "Reach 400 Businesses", "target": 400, "current": 342, "deadline": "2026-10-18", "category": "Growth" }
  ],
  "projects": [
    { "id": "proj_001", "name": "QRThrive V2 Launch", "budget": 500000, "spent": 320000, "revenue": 850000, "status": "IN_PROGRESS", "deadline": "2026-08-18" }
  ]
}
```

---

### 5.8 Receivables

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**. Computed on the fly from active subscriptions.

#### `GET /api/v1/receivables`

**Response `data`**

```json
{
  "invoices": [
    { "customer": "Lagos Pizza Co.", "amount": 45000, "dueDate": "2026-07-13", "status": "OVERDUE" }
  ],
  "totalOutstanding": 395000,
  "totalOverdue": 250000,
  "collectedThisMonth": 450000
}
```

`status` ∈ `OVERDUE | PENDING` (computed from due date).

---

### 5.9 Payables

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**. Computed from the expenses table.

#### `GET /api/v1/payables`

**Response `data`**

```json
{
  "monthlySalary": 1200000,
  "totalBills": 2310000,
  "totalPayables": 890000,
  "dueThisWeek": 420000,
  "dueThisMonth": 890000,
  "overdue": 85000,
  "bills": [
    { "description": "Termii SMS Gateway", "amount": 420000, "dueDate": "2026-07-15", "status": "PENDING", "category": "Gateway" }
  ],
  "paymentSchedule": [
    { "description": "Staff Salaries", "amount": 1200000, "dueDate": "2026-06-20", "status": "PENDING", "category": "Payroll" }
  ]
}
```

`status` ∈ `PENDING | OVERDUE`; `category` is a display string mapped from the expense (`Gateway`, `Infrastructure`, `Payroll`, `Office`, `Software`, `Operating`).

---

### 5.10 Businesses

⚠️ **Raw responses — no envelope** (shared with the VemTap control-tower). Your interceptor passes these through unchanged. Routes are 🔒 `Admin`/`SUPER_ADMIN`.

> **Field note:** the FOS spec typed `owner` as a string, but VemTap reads `owner` as an object. The backend keeps `owner` as an object and adds **`ownerName`** (string) and `plan/mrr/renewalDate/smsUsed/emailUsed`. **Read `ownerName`, not `owner`, on the business list and detail.**

#### `GET /api/v1/businesses/admin`

Query: `page`, `limit` (alias of perPage), `plan`, `status`, `agentId`, `search`, `isVerified` (all optional).

**Response (raw)** — `{ data, meta, stats }`:

```json
{
  "data": [
    {
      "id": "biz_001",
      "name": "Lagos Pizza Co.",
      "owner": { "firstName": "Chukwuemeka", "lastName": "Obi", "email": "owner@example.com" },
      "ownerName": "Chukwuemeka Obi",
      "plan": "PRO",
      "mrr": 45000,
      "status": "ACTIVE",
      "joinDate": "2026-01-18",
      "renewalDate": "2026-06-18",
      "lastPaymentDate": null,
      "agentId": null,
      "agentName": null,
      "smsUsed": 12500,
      "emailUsed": 3200
    }
  ],
  "meta": { "total": 342, "page": 1, "lastPage": 43 },
  "stats": { "total": 342, "active": 298, "pending": 28, "suspended": 16, "approvedToday": 3, "avgWaitTime": "2h 15m" }
}
```

`status` is **uppercase** (`ACTIVE | PENDING | SUSPENDED`). `plan`/`mrr`/`renewalDate` come from the active subscription; `smsUsed`/`emailUsed` from message logs; `agentId`/`agentName` are `null` until affiliate mapping is wired.

#### `GET /api/v1/businesses/stats`

**Response (raw)**

```json
{
  "activeBusinesses": 298,
  "totalMrr": 14250000,
  "churnRate": 2.3,
  "churnedCount": 8,
  "totalBusinesses": 342,
  "bestSellingPlan": { "plan": "PRO", "totalMrr": 5400000, "businessCount": 120 },
  "planDistribution": [ { "plan": "PRO", "count": 120, "totalMrr": 5400000 } ],
  "statusDistribution": [ { "status": "ACTIVE", "count": 298 } ]
}
```

#### `GET /api/v1/businesses/:id`

**Response (raw)** — enriched detail + transaction history:

```json
{
  "id": "biz_001",
  "name": "Lagos Pizza Co.",
  "owner": "Chukwuemeka Obi",
  "plan": "PRO",
  "mrr": 45000,
  "status": "ACTIVE",
  "joinDate": "2026-01-18",
  "renewalDate": "2026-06-18",
  "lastPaymentDate": null,
  "agentId": null,
  "agentName": null,
  "smsUsed": 12500,
  "emailUsed": 3200,
  "transactions": [
    { "id": "txn_001", "type": "SUBSCRIPTION", "amount": 45000, "profit": 45000, "date": "2026-07-06" }
  ]
}
```

#### `POST /api/v1/businesses`

**Request** — required: `name`, `ownerFirstName`, `ownerLastName`, `ownerEmail`, `ownerPassword`. Optional: `ownerPhone`, `status`, `categoryId`, `subcategoryId`, `address`, `state`, `city`, `website`, `isRegistered`, `registrationNumber`, etc.

```json
{
  "name": "Lagos Pizza Co.",
  "ownerFirstName": "Chukwuemeka",
  "ownerLastName": "Obi",
  "ownerEmail": "owner@example.com",
  "ownerPassword": "SecurePass123!",
  "status": "active"
}
```

> **Note:** this differs from the original FOS spec body (`{ name, owner, plan, mrr }`). The backend admin-create DTO requires the owner identity fields above and creates/finds the owner user. Adjust your form payload accordingly.

**Response (raw)** — the created `Business` entity.

#### `PATCH /api/v1/businesses/:id`

Partial of `{ name, owner, plan, mrr, status, agentId, ... }`. **Response (raw)** — the updated `Business` entity.

#### `DELETE /api/v1/businesses/:id`

**Response:** `200` with an empty body.

---

### 5.11 Affiliate Agents

⚠️ **Raw responses — no envelope.** Routes 🔒 `Admin`/`SUPER_ADMIN`. These proxy to the external affiliate backend, so shapes come from that system — verify against its contract, not this doc.

| Route | Method | Notes |
|---|---|---|
| `/api/v1/affiliates/agents` | GET | list (query: `page`, `perPage`, `search`, `status`) |
| `/api/v1/affiliates/agents/:id` | GET | detail |
| `/api/v1/affiliates/agents/:id/revenue` | GET | monthly revenue trend |
| `/api/v1/affiliates/agents` | POST | create (`name`, `email`, `phone?`, `password?`, `status?`, `managerId?`) |
| `/api/v1/affiliates/agents/:id` | PATCH | update |
| `/api/v1/affiliates/agents/:id` | DELETE | deactivate |

`status` ∈ `ACTIVE | SUSPENDED | DEACTIVATED`.

---

### 5.12 Messaging (SMS / Email)

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**. Derived from `message_logs` + platform pricing settings.

#### `GET /api/v1/messaging/sms`

Query: `page` (default 1), `perPage` (default 50), `businessId` (optional). **Response `data`**:

```json
{
  "logs": [
    {
      "id": "sms_0",
      "businessId": "biz_001",
      "businessName": "Lagos Pizza Co.",
      "smsCount": 1250,
      "costPerSms": 2.5,
      "sellingPricePerSms": 4.0,
      "totalCost": 3125,
      "totalRevenue": 5000,
      "totalProfit": 1875,
      "date": "2026-07-06"
    }
  ],
  "total": 5,
  "page": 1,
  "perPage": 50
}
```

#### `GET /api/v1/messaging/email`

Same shape as SMS with `emailCount`, `costPerEmail`, `sellingPricePerEmail`.

#### `GET /api/v1/messaging/aggregates`

**Response `data`**

```json
{
  "totalSmsSent": 1245800,
  "totalEmailsSent": 89400,
  "totalMessagingCost": 3114500,
  "totalMessagingRevenue": 4983200,
  "totalMessagingProfit": 1868700
}
```

---

### 5.13 QRThrive Funnel

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `GET /api/v1/funnel/stats`

**Response `data`** — an **array** of snapshots (currently a single computed snapshot):

```json
[
  {
    "id": "latest",
    "qrScans": 15200,
    "leadsCaptured": 8400,
    "qrUsers": 6200,
    "convertedToVemtap": 342,
    "conversionRate": 4.1,
    "date": "2026-07-18"
  }
]
```

---

### 5.14 Notifications

⚠️ **Raw responses — no envelope.** All authenticated roles.

#### `GET /api/v1/notifications`

**Response (raw)** — array. Each item includes both `isRead` (legacy) and `read`:

```json
[
  {
    "id": "notif_001",
    "userId": "usr_001",
    "type": "info",
    "title": "New Subscription",
    "message": "Lagos Pizza Co. upgraded to PRO plan",
    "isRead": false,
    "read": false,
    "createdAt": "2026-07-18T00:00:00.000Z"
  }
]
```

#### `PATCH /api/v1/notifications/:id/read`

No body. **Response (raw)** — the updated notification (`read: true`).

#### `PATCH /api/v1/notifications/read-all`

No body. **Response (raw)** — `{ "success": true }`. (Legacy aliases `POST/PATCH /mark-all-read` still exist.)

#### Also available: `GET /unread-count`, `POST|PATCH /mark-all-read`

---

### 5.15 Settings & Team

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `GET /api/v1/settings`

**Response `data`** — secrets are masked on read:

```json
{
  "settings": {
    "currency": "NGN",
    "timezone": "Africa/Lagos",
    "dateFormat": "DD/MM/YYYY",
    "theme": "light",
    "paystackSecretKey": "sk_test_****",
    "termiiApiKey": "TL_****"
  }
}
```

#### `PUT /api/v1/settings`

**Request** — full object (any subset updates those fields):

```json
{
  "currency": "NGN",
  "timezone": "Africa/Lagos",
  "dateFormat": "DD/MM/YYYY",
  "theme": "light",
  "paystackSecretKey": "sk_test_xxxxxxxx",
  "termiiApiKey": "TL_xxxxxxxx"
}
```

**Response `data`** — `{ settings: {...} }` (masked again).

#### `GET /api/v1/settings/team`

**Response `data`**

```json
{
  "members": [
    { "id": "usr_001", "name": "Admin User", "email": "admin@vemtap.com", "role": "SUPER_ADMIN", "status": "Active", "type": "INTERNAL" }
  ]
}
```

`role` ∈ `Admin | SUPER_ADMIN`; `type` is always `INTERNAL`.

#### `POST /api/v1/settings/team/invite`

**Request** — `role` is `Admin` or `SUPER_ADMIN` (exact enum values).

```json
{ "email": "colleague@vemtap.com", "name": "Jane Doe", "role": "Admin" }
```

**Response `data`** — created member, **including the one-time `password`** (returned only once; share it with the invitee):

```json
{
  "id": "usr_002",
  "name": "Jane Doe",
  "email": "colleague@vemtap.com",
  "role": "Admin",
  "status": "Active",
  "type": "INTERNAL",
  "password": "aB3k9xQ2pL4m"
}
```

#### `DELETE /api/v1/settings/team/:id`

**Response `data`** — `{ "message": "Team member removed successfully" }`. Deleting the last `SUPER_ADMIN` is blocked (`409`).

---

### 5.16 Reports

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**. Values are **pre-formatted display strings** (backend formats; UI renders as-is).

#### `GET /api/v1/reports`

**Response `data`**

```json
{
  "reportSections": [
    { "label": "Total Revenue (YTD)", "value": "N28,475,000", "change": "+24.5%" },
    { "label": "Net Profit", "value": "N14,237,500", "change": "+31.2%" }
  ],
  "investorMetrics": [
    { "label": "Monthly Recurring Revenue", "value": "N14,250,000" },
    { "label": "Annual Run Rate", "value": "N171,000,000" }
  ]
}
```

---

### 5.17 AI Assistant

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**. Rule-based engine over live financial data.

#### `GET /api/v1/ai-assistant/insights`

**Response `data`**

```json
{
  "insights": [
    { "icon": "trending-up", "text": "Revenue is growing at 18.0% month-over-month.", "type": "positive" }
  ],
  "predefinedQuestions": [
    "How much did we spend on marketing last month?",
    "Can we afford to hire a developer?",
    "What is our break-even point?",
    "Which product is most profitable?",
    "Why did expenses increase?"
  ]
}
```

`icon` ∈ `trending-up | trending-down | alert-triangle | check-circle`; `type` ∈ `positive | warning`.

#### `POST /api/v1/ai-assistant/chat`

**Request**

```json
{ "query": "Can we afford to hire a developer?" }
```

**Response `data`**

```json
{
  "answer": "A new developer at ₦300,000/month would increase monthly burn by 12.0% and reduce runway to about 8.5 months based on current net profit.",
  "data": [
    { "label": "Monthly Cost", "value": "₦300,000" },
    { "label": "Burn Impact", "value": "12.0%" },
    { "label": "Runway After", "value": "8.5 months" }
  ]
}
```

`data[].value` is a pre-formatted display string. Keywords handled: hire/afford, spend/marketing/expense, break-even, profit/margin/product, runway/cash; unknown queries fall back to a summary answer.

---

### 5.18 Forecasting

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `POST /api/v1/forecasting/project`

**Request** — note `variableCostMargin` is a **percentage** (`50` = 50%). Legacy 0–1 values are also accepted.

```json
{
  "baseBusinesses": 342,
  "arpu": 8324,
  "fixedCosts": 1635000,
  "grossRevenue": 2847500,
  "variableCostMargin": 50,
  "cashBalance": 892300,
  "qrThriveLeadsPerMonth": 200,
  "period": 6,
  "growthRate": 15,
  "churnRate": 5,
  "conversionRate": 12
}
```

**Response `data`**

```json
{
  "summary": {
    "projectedMrr": 18500000,
    "mrrGrowthPercent": 29.8,
    "totalProjectedProfit": 52000000,
    "isDeclining": false,
    "healthAlert": "HEALTHY"
  },
  "monthlyData": [
    {
      "month": "2026-08",
      "businesses": 350,
      "mrr": 14585000,
      "profit": 1508750,
      "inflow": 2967500,
      "outflow": 2345000,
      "cashBalance": 1132300
    }
  ]
}
```

`healthAlert` ∈ `HEALTHY | HIGH_RISK`; `month` is an ISO `YYYY-MM` string.

#### Also available: `POST /api/v1/forecasting/persist` (save a scenario), `GET /api/v1/forecasting/history`

---

### 5.19 Financial Planning

🔒 `Admin`/`SUPER_ADMIN`, **enveloped**.

#### `POST /api/v1/financial-planning/targets`

**Request**

```json
{
  "periodType": "monthly",
  "targetRevenue": 3000000,
  "targetBusinesses": 350,
  "targetSmsUsage": 1500000,
  "targetEmailUsage": 80000,
  "profitMargin": 50,
  "startDate": "2026-07-01",
  "endDate": "2026-07-31"
}
```

`periodType` ∈ `daily | weekly | monthly | yearly` (lowercase here). **Response `data`** — created target with computed achievement:

```json
{
  "id": "ft_001",
  "periodType": "monthly",
  "targetRevenue": 3000000,
  "targetBusinesses": 350,
  "targetSmsUsage": 1500000,
  "targetEmailUsage": 80000,
  "profitMargin": 50,
  "achievedRevenuePercentage": 94.9,
  "achievedProfitPercentage": 94.9,
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "createdAt": "2026-07-01T00:00:00.000Z"
}
```

#### `GET /api/v1/financial-planning/targets`

Query: `periodType` (optional). **Response `data`** — array of `FinancialTarget` (same shape above).

#### `POST /api/v1/financial-planning/scenarios`

**Request**

```json
{
  "currentBusinesses": 342,
  "growthRate": 15,
  "churnRate": 5,
  "pricing": 5000,
  "agentFactor": 1.0,
  "projectionMonths": 12,
  "profitMargin": 50
}
```

**Response `data`**

```json
{
  "best":   { "totalProfit": 52000000, "monthlyBreakdown": [ { "month": 1, "businesses": 350, "profit": 1508750 } ] },
  "expected": { "totalProfit": 45000000, "monthlyBreakdown": [ { "month": 1, "businesses": 342, "profit": 1423750 } ] },
  "worst":  { "totalProfit": 38000000, "monthlyBreakdown": [ { "month": 1, "businesses": 320, "profit": 1300000 } ] }
}
```

---

## 6. HTTP status codes

| Code | Meaning | Frontend action |
|---|---|---|
| 200 | OK | — |
| 201 | Created | — |
| 204 | No content | — |
| 400 | Validation error | surface `data.message` |
| 401 | Unauthenticated / token expired | clear tokens + redirect to `/login` |
| 403 | Authenticated, wrong role | surface `data.message` |
| 404 | Not found | surface `data.message` |
| 409 | Conflict (duplicate email, last SUPER_ADMIN) | surface `data.message` |
| 500 | Server error | generic error UI |

---

## 7. Envelope coverage summary

| Group | Enveloped (`{success,data}`)? |
|---|---|
| auth, businesses, affiliates/agents, notifications | **No** (raw) |
| dashboard, revenue, pnl, expenses, budgets, goals, receivables, payables, messaging, funnel, settings/team, reports, ai-assistant, forecasting, financial-planning | **Yes** |

Your interceptor handles both — **no changes needed**.

---

## 8. Integration checklist

- [ ] Store `access_token` in `localStorage["fos_access_token"]` **and** the `fos_access_token` cookie after login/register.
- [ ] Send `Authorization: Bearer <token>` on every call.
- [ ] Read errors from `err.response.data.message`.
- [ ] Treat all money fields as numbers and dates as ISO strings.
- [ ] Use `ownerName` (not `owner`) on the business list/detail.
- [ ] FOS admin registration uses `/auth/register/admin` with `adminAccountCode`.
- [ ] `businesses/*` responses are raw; everything else FOS is enveloped — the interceptor already unwraps both.
- [ ] Delete responses return `{ message }` (expenses, team) or an empty body (businesses).
- [ ] `/settings` returns masked keys; send real keys on `PUT`.

---

## 9. Backend integration v2 (writes + computed metrics)

Added to close the "writes are mocked / metrics are fabricated" gaps. All endpoints below are 🔒 `Admin`/`SUPER_ADMIN` and **enveloped** unless noted. Field names below are dictated by the frontend and must be honored exactly.

### 9.1 Goals & Projects — full CRUD

| Method | Path | Body | Returns |
|---|---|---|---|
| `POST` | `/goals` | `{ name, target, deadline?, category? }` | `Goal` |
| `PATCH` | `/goals/:id` | partial `{ name?, target?, current?, deadline?, category? }` | `Goal` |
| `DELETE` | `/goals/:id` | — | `{ success: true }` |
| `POST` | `/goals/projects` | `{ name, budget?, spent?, revenue?, status?, deadline? }` | `Project` |
| `PATCH` | `/goals/projects/:id` | partial of the above | `Project` |
| `DELETE` | `/goals/projects/:id` | — | `{ success: true }` |

`GET /goals` still returns `{ goals, projects }`. Money fields are numeric; dates ISO `YYYY-MM-DD`. Project `status` is a passthrough string (UI renders `Completed`/`In Progress` directly).

### 9.2 Receivables — persisted invoices

`GET /receivables` now **merges** subscription-derived invoices (computed) with manual invoices you create. `POST/PATCH/DELETE /receivables/invoices` and `POST/PATCH/DELETE /receivables/invoices/:id` persist manual invoices.

```json
{ "customer": "Zenith Logistics", "amount": 250000, "dueDate": "2026-07-23", "status": "PENDING" }
```

`status` ∈ `OVERDUE | PENDING | PAID`. Totals (`totalOutstanding`, `totalOverdue`, `collectedThisMonth`) are recomputed server-side and returned by the GET.

### 9.3 Payables — persisted bills

`GET /payables` merges expense-derived bills with manual bills. `POST/PATCH/DELETE /payables/bills` and `/:id` persist manual bills. GET also returns `payrollPaid` (sum of PAID payroll bills) so the UI can stop fabricating the salary "Paid" figure.

```json
{ "description": "Termii SMS Gateway", "amount": 420000, "dueDate": "2026-07-15", "status": "PENDING", "category": "Gateway" }
```

`status` ∈ `PENDING | PAID | OVERDUE`.

### 9.4 Affiliate commission lifecycle

| Method | Path | Returns |
|---|---|---|
| `GET` | `/affiliates/agents/:id/commission` | `{ status, commissionEarned, revenueAttributed, period }` |
| `POST` | `/affiliates/agents/:id/commission/approve` | `{ status: "approved" }` |
| `POST` | `/affiliates/agents/:id/commission/mark-paid` | `{ status: "paid" }` |
| `GET` | `/affiliates/commission/summary` | `{ pendingCount, approvedCount, paidCount, pendingTotal, approvedTotal, paidTotal }` |

`status` ∈ `pending | approved | paid` (lowercase). `GET /affiliates/agents` is also enriched per agent with `commissionStatus`, `commissionEarned`, `revenueAttributed`. Commission state is tracked in a local table keyed by `agentId` (computed from `fos_transactions`); the external affiliate backend shape is passed through defensively.

### 9.5 Records (manual ledger entries)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/records?month=&year=&type=&page=&perPage=` | `{ records, total }` |
| `POST` | `/records` | `{ date, type, category, description, amount }` |
| `DELETE` | `/records/:id` | `{ success: true }` |

`type` ∈ `Income | Expense`. Returns manual entries only; the frontend merges with `/revenue/transactions` and `/expenses`.

### 9.6 Transfers

| Method | Path | Notes |
|---|---|---|
| `GET` | `/transfers?page=&perPage=` | `{ transfers, total }` |
| `POST` | `/transfers` | `{ date, category?, description, amount, reference? }` |
| `DELETE` | `/transfers/:id` | `{ success: true }` |

Transfer objects carry `type: "Transfer"` (literal). This replaces the hardcoded `XFR-001..003` array in the frontend.

### 9.7 Planning

- `/budget-items` — GET `{ items, categories, totalPlanned, totalActual }`, POST, PATCH `/:id`, DELETE `/:id`. Each item includes `variance` (`actual - planned`).
- `/budget-categories` — POST `{ name }`, DELETE `/:name`. Defaults seeded on first GET.
- `/forecast-aspects` — GET `{ aspects }`, POST `{ label, baseValue, growthRate }`, PATCH `/:id`, DELETE `/:id`.
- Planning goals reuse `/goals` (§9.1).

### 9.8 Settings config tabs

All under `/settings`, 🔒 `Admin`/`SUPER_ADMIN`, **enveloped**:

| Resource | Methods | Shape |
|---|---|---|
| `categories` | GET, POST, PATCH `/:id`, DELETE `/:id` | `{ id, name, type: Income\|Expense, description }` |
| `accounts` | GET, POST, PATCH `/:id`, DELETE `/:id` | `{ id, code, name, type, normalBalance: Debit\|Credit }` |
| `periods` | GET, POST, PATCH `/:id`, DELETE `/:id` | `{ id, name, startDate, endDate, status: Open\|Closed }` |
| `currencies` | GET, POST, PATCH `/:id`, DELETE `/:id` | `{ id, code, name, symbol, rate, isDefault }` |
| `permissions` | GET, PUT | array `{ role, permissions: {...} }`; PUT replaces the whole map |
| `approval-rules` | GET, POST, PATCH `/:id`, DELETE `/:id` | `{ id, name, trigger, approver, threshold, status: Active\|Inactive }` |
| `notification-rules` | GET, POST, PATCH `/:id`, DELETE `/:id` | `{ id, event, channel: Email\|In-App, enabled }` |
| `audit-logs` | GET | `{ entries: [{ id, timestamp, user, action, details }] }` |

`audit-logs` is **read-only** — entries are generated server-side from real admin actions (never client-supplied).

### 9.9 Reports

- `GET /reports/management` → `{ revenue, expenses, profit, cash, runwayMonths, customers, growth, riskLevel }` — all computed server-side from real data; `riskLevel` ∈ `Low | Medium | High`.
- `POST /reports/custom` with `{ dateRange?: "30days"|"90days"|"12months", category?, department? }` → `{ reportSections, filters, trend }`.

### 9.10 Profile

| Method | Path | Notes |
|---|---|---|
| `GET` | `/profile` | current user `{ id, firstName, lastName, email, avatar, role, status }` |
| `PATCH` | `/profile` | `{ firstName?, lastName?, email?, avatar? }`; `409` on email conflict |
| `GET` | `/profile/activity?limit=` | `{ entries }` server-generated from real account actions |

### 9.11 Role coverage

The affiliate agent/admin routes (`/affiliates/agents*`, `/affiliates/admin/*`) and business admin routes previously restricted to `Admin` are now open to `Admin` **and** `SUPER_ADMIN`, since the FOS app authenticates as `SUPER_ADMIN`.
