# Vemtap FOS — Backend Integration v2 (Writes + Computed Metrics)

> **Audience:** Vemtap Front Office System (FOS) frontend team.
> **Backend base URL:** `/api/v1` (proxied through the FOS Next.js app, or hit directly).
> **Status:** Implemented on the Vemtap backend. Complements (does not replace) [`fos-frontend-integration-guide.md`](./fos-frontend-integration-guide.md).
> **Read §1–§2 first** (conventions your interceptor already depends on), then jump to the section you need.

This document describes the **backend integration v2** work: every endpoint that was added to give the FOS frontend real, server-side persistence for writes and real computed figures for metrics that were previously mocked or fabricated in the UI.

---

## Table of contents

1. [Request & response conventions](#1-request--response-conventions)
2. [Auth & roles](#2-auth--roles)
3. [Goals & Projects (full CRUD)](#3-goals--projects-full-crud)
4. [Receivables — persisted invoices](#4-receivables--persisted-invoices)
5. [Payables — persisted bills](#5-payables--persisted-bills)
6. [Affiliate commission lifecycle](#6-affiliate-commission-lifecycle)
7. [Records (manual ledger entries)](#7-records-manual-ledger-entries)
8. [Transfers](#8-transfers)
9. [Planning — budget items, categories, forecast aspects](#9-planning--budget-items-categories-forecast-aspects)
10. [Settings — 8 config tabs](#10-settings--8-config-tabs)
11. [Reports — management & custom](#11-reports--management--custom)
12. [Profile](#12-profile)
13. [Computed metrics (no more fabricated numbers)](#13-computed-metrics-no-more-fabricated-numbers)
14. [Role coverage changes](#14-role-coverage-changes)
15. [Database tables added](#15-database-tables-added)
16. [Integration checklist](#16-integration-checklist)

---

## 1. Request & response conventions

- **Base:** `/api/v1`, content type `application/json`.
- **Auth:** `Authorization: Bearer <access_token>` on every call.
- **IDs:** opaque stable strings (UUIDs). Round-trip exactly; treat as opaque, never parse.
- **Query params:** unknown/unsupported params are ignored (never 400).

### 1.1 Response envelope

All endpoints in this document are **enveloped**:

```json
{ "success": true, "data": <payload> }
```

Your interceptor already unwraps `{ success, data }` and returns `data` to the caller. Errors:

```json
{ "success": false, "statusCode": 400, "timestamp": "...", "path": "...", "method": "...", "error": "Bad Request", "message": "Human readable reason" }
```

Read `error.response.data.message` for the human-readable message.

### 1.2 Field conventions

| Concern | Rule |
|---|---|
| Money | Numeric NGN, minor-unit free (`4_500_000` = ₦4.5M). Never strings. |
| Dates | ISO `YYYY-MM-DD` (e.g. `"2026-07-18"`). |
| Timestamps | ISO-8601 UTC `YYYY-MM-DDTHH:mm:ss.sssZ`. |
| Pagination | `page` (1-based) + `perPage`; list responses include `total`. |
| Enums | Values must match the exact strings in each section (they are rendered directly in the UI). |

---

## 2. Auth & roles

- The FOS app authenticates as **`SUPER_ADMIN`** (or `Admin`).
- Every endpoint in this document requires `Admin` **or** `SUPER_ADMIN`.
- On `401`, clear `fos_access_token` + `fos_user` and redirect to `/login`.
- Login/register/change-password are unchanged (see the v1 guide §5.1).

---

## 3. Goals & Projects (full CRUD)

Consumed by the **Goals** page. Adds server-side persistence to the previously state-only adds/edits/deletes.

### `GET /goals` — list goals and projects

Response `data`:

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

### `POST /goals` — create a goal

Request body:

```json
{ "name": "Reach 500 Businesses", "target": 500, "current": 342, "deadline": "2026-10-18", "category": "Growth" }
```

Response `data` — the created `Goal`:

```json
{ "id": "goal_002", "name": "Reach 500 Businesses", "target": 500, "current": 342, "deadline": "2026-10-18", "category": "Growth" }
```

### `PATCH /goals/:id` — update a goal

Partial request body (any subset):

```json
{ "name": "Reach 600 Businesses", "current": 400 }
```

Response `data` — the updated `Goal`.

### `DELETE /goals/:id` — delete a goal

Response `data`:

```json
{ "success": true }
```

### `POST /goals/projects` — create a project

Request body:

```json
{ "name": "QRThrive V2 Launch", "budget": 500000, "spent": 320000, "revenue": 850000, "status": "IN_PROGRESS", "deadline": "2026-08-18" }
```

Response `data` — the created `Project` (same shape as above, with `id`).

### `PATCH /goals/projects/:id` — update a project

Partial body: any of `{ name?, budget?, spent?, revenue?, status?, deadline? }`. Response `data` — the updated `Project`.

### `DELETE /goals/projects/:id` — delete a project

Response `data`:

```json
{ "success": true }
```

**TypeScript interfaces:**

```ts
interface Goal { id: string; name: string; target: number; current: number; deadline: string | null; category: string | null; }
interface Project { id: string; name: string; budget: number; spent: number; revenue: number; status: string; deadline: string | null; }
```

**Notes:**
- `category` is a display string (examples seen in UI: `Revenue`, `Reserve`, `Margin`, `Runway`, `Growth`, `Completed`).
- `status` is a passthrough string — the UI renders project status directly (`Completed`, `In Progress`, etc.).
- `current` is persisted as provided; where possible the backend can derive it, but the write endpoints accept an explicit value.

---

## 4. Receivables — persisted invoices

Consumed by the **Receivables** page. Previously invoices were computed only from active subscriptions and writes were lost on refresh. Now manual invoices persist, and the GET **merges** subscription-derived invoices with manual ones.

### `GET /receivables` — receivables summary (merged)

Response `data`:

```json
{
  "invoices": [
    { "id": "inv_001", "customer": "Zenith Logistics", "amount": 250000, "dueDate": "2026-07-23", "status": "OVERDUE" },
    { "id": "sub_abc...", "customer": "Lagos Pizza Co.", "amount": 45000, "dueDate": "2026-07-13", "status": "OVERDUE" }
  ],
  "totalOutstanding": 395000,
  "totalOverdue": 250000,
  "collectedThisMonth": 450000
}
```

- `totalOutstanding` = sum of `PENDING` + `OVERDUE` invoices.
- `totalOverdue` = sum of `OVERDUE` invoices.
- `collectedThisMonth` = `PAID` manual invoices collected this month + subscription transactions this month.
- All totals are recomputed server-side.

### `POST /receivables/invoices` — create an invoice

Request body:

```json
{ "customer": "Zenith Logistics", "amount": 250000, "dueDate": "2026-07-23", "status": "PENDING", "collectedAt": "2026-07-01" }
```

- `status` ∈ `OVERDUE | PENDING | PAID` (optional; defaults `PENDING`).
- `collectedAt` optional (ISO date) — set when marked `PAID`.

Response `data` — the created invoice (without internal `source` field):

```json
{ "id": "inv_002", "customer": "Zenith Logistics", "amount": 250000, "dueDate": "2026-07-23", "status": "PENDING" }
```

### `PATCH /receivables/invoices/:id` — update an invoice

Partial body: any of `{ customer?, amount?, dueDate?, status?, collectedAt? }`. Marking `status: "PAID"` without a `collectedAt` sets `collectedAt` to today automatically.

Response `data` — the updated invoice.

### `DELETE /receivables/invoices/:id` — delete an invoice

Response `data`:

```json
{ "success": true }
```

**TypeScript interfaces:**

```ts
type InvoiceStatus = 'OVERDUE' | 'PENDING' | 'PAID';
interface Invoice { id: string; customer: string; amount: number; dueDate: string; status: InvoiceStatus; }
interface ReceivablesSummary { invoices: Invoice[]; totalOutstanding: number; totalOverdue: number; collectedThisMonth: number; }
```

---

## 5. Payables — persisted bills

Consumed by the **Payables** page. Manual bills now persist; GET **merges** expense-derived bills with manual bills.

### `GET /payables` — payables summary (merged)

Response `data`:

```json
{
  "monthlySalary": 1200000,
  "payrollPaid": 500000,
  "totalBills": 2310000,
  "totalPayables": 890000,
  "dueThisWeek": 420000,
  "dueThisMonth": 890000,
  "overdue": 85000,
  "bills": [
    { "id": "bill_001", "description": "Termii SMS Gateway", "amount": 420000, "dueDate": "2026-07-15", "status": "PENDING", "category": "Gateway" }
  ],
  "paymentSchedule": [
    { "id": "bill_002", "description": "Staff Salaries", "amount": 1200000, "dueDate": "2026-06-20", "status": "PENDING", "category": "Payroll" }
  ]
}
```

- `monthlySalary` = total of `Payroll` bills.
- **`payrollPaid` (new)** = sum of `PAID` payroll bills — use this to render the payroll "Paid" figure (no more fabrication from `monthlySalary`).
- `totalPayables`/`dueThisWeek`/`dueThisMonth` only count open bills (`PENDING` + `OVERDUE`).
- `paymentSchedule` = `Payroll` bills only.

### `POST /payables/bills` — create a bill

Request body:

```json
{ "description": "Termii SMS Gateway", "amount": 420000, "dueDate": "2026-07-15", "status": "PENDING", "category": "Gateway" }
```

- `status` ∈ `PENDING | PAID | OVERDUE` (optional; defaults `PENDING`).
- `category` is a display string (examples: `Gateway`, `Infrastructure`, `Office`, `Utilities`, `Software`, `Payroll`, `Commissions`).

Response `data` — the created bill:

```json
{ "id": "bill_003", "description": "Termii SMS Gateway", "amount": 420000, "dueDate": "2026-07-15", "status": "PENDING", "category": "Gateway" }
```

### `PATCH /payables/bills/:id` — update a bill

Partial body: any of `{ description?, amount?, dueDate?, category?, status? }`. Marking `status: "PAID"` sets `paidAt` to today automatically.

Response `data` — the updated bill.

### `DELETE /payables/bills/:id` — delete a bill

Response `data`:

```json
{ "success": true }
```

**TypeScript interfaces:**

```ts
type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE';
interface Bill { id: string; description: string; amount: number; dueDate: string; status: BillStatus; category: string | null; }
interface PayablesSummary {
  monthlySalary: number; payrollPaid: number; totalBills: number; totalPayables: number;
  dueThisWeek: number; dueThisMonth: number; overdue: number;
  bills: Bill[]; paymentSchedule: Bill[];
}
```

---

## 6. Affiliate commission lifecycle

Consumed by the **Commission Planning** page. Previously each agent's status was invented (`i % 3`) and status changes were local-only. Commission state is now tracked server-side in a local table keyed by `agentId`, computed from `fos_transactions`:
- `revenueAttributed` = sum of `SUBSCRIPTION` + `SMS` transactions for the agent.
- `commissionEarned` = sum of `COMMISSION` transactions for the agent.

### `GET /affiliates/agents` — list agents (enriched)

The existing proxy list is **enriched per agent** with commission fields. Handles both array and `{ data: [...] }` payloads from the external affiliate backend.

Response (per agent, additive):

```json
{
  "id": "agt_001",
  "name": "Chidinma Eze",
  "email": "chidinma@example.com",
  "commissionStatus": "pending",
  "commissionEarned": 150000,
  "revenueAttributed": 750000
}
```

`commissionStatus` ∈ `pending | approved | paid` (lowercase).

### `GET /affiliates/agents/:id/commission` — agent commission status

Response `data`:

```json
{ "status": "pending", "commissionEarned": 150000, "revenueAttributed": 750000, "period": "2026-08" }
```

### `POST /affiliates/agents/:id/commission/approve` — approve a commission

Response `data`:

```json
{ "status": "approved" }
```

### `POST /affiliates/agents/:id/commission/mark-paid` — mark a commission paid

Response `data`:

```json
{ "status": "paid" }
```

### `GET /affiliates/commission/summary` — commission summary

Response `data`:

```json
{ "pendingCount": 5, "approvedCount": 3, "paidCount": 10, "pendingTotal": 425000, "approvedTotal": 350000, "paidTotal": 1200000 }
```

**TypeScript interfaces:**

```ts
type CommissionStatus = 'pending' | 'approved' | 'paid';
interface AgentCommission { status: CommissionStatus; commissionEarned: number; revenueAttributed: number; period: string; }
interface CommissionSummary { pendingCount: number; approvedCount: number; paidCount: number; pendingTotal: number; approvedTotal: number; paidTotal: number; }
```

**Notes:**
- The agent list is fetched from an external affiliate backend (proxy); the commission fields are added by the Vemtap backend and reflect real `fos_transactions`.
- Mutations (approve / mark-paid) update the local commission table for the current month's period.

---

## 7. Records (manual ledger entries)

Consumed by the **Records** page (calendar + ledger). Custom entries previously lived in `useState` and were lost on refresh.

### `GET /records` — list manual ledger entries

Query params: `year?`, `month?` (1–12), `type?` (`Income|Expense`), `page?` (default 1), `perPage?` (default 20).

Response `data`:

```json
{
  "records": [
    { "id": "rec_001", "date": "2026-07-18", "type": "Income", "category": "Service Revenue", "description": "Consulting", "amount": 250000 }
  ],
  "total": 1
}
```

### `POST /records` — create a manual ledger entry

Request body:

```json
{ "date": "2026-07-18", "type": "Income", "category": "Service Revenue", "description": "Consulting", "amount": 250000 }
```

`type` ∈ `Income | Expense`. Response `data` — the created `RecordEntry`.

### `DELETE /records/:id` — delete a manual ledger entry

Response `data`:

```json
{ "success": true }
```

**TypeScript interfaces:**

```ts
type RecordType = 'Income' | 'Expense';
interface RecordEntry { id: string; date: string; type: RecordType; category: string; description: string; amount: number; }
```

**Notes:** returns manual entries only. The page merges `/records` with `/revenue/transactions` and `/expenses` into one calendar client-side.

---

## 8. Transfers

Consumed by the **Transactions** page. Replaces the hardcoded `XFR-001..003` fake transfers.

### `GET /transfers` — list internal transfers

Query params: `page?` (default 1), `perPage?` (default 20).

Response `data`:

```json
{
  "transfers": [
    { "id": "xfr_001", "date": "2026-07-15", "type": "Transfer", "category": "Internal Transfer", "description": "Operating → Reserve", "amount": 500000, "reference": "XFR-2026-001" }
  ],
  "total": 1
}
```

### `POST /transfers` — create an internal transfer

Request body:

```json
{ "date": "2026-07-15", "category": "Internal Transfer", "description": "Operating → Reserve", "amount": 500000, "reference": "XFR-2026-001" }
```

Response `data` — the created `Transfer`. `type` is always the literal string `"Transfer"`.

### `DELETE /transfers/:id` — delete an internal transfer

Response `data`:

```json
{ "success": true }
```

**TypeScript interfaces:**

```ts
interface Transfer { id: string; date: string; type: 'Transfer'; category: string | null; description: string; amount: number; reference: string | null; }
```

**Notes:** the frontend unifies income + expenses + transfers into one sorted list; the `type` field lets you distinguish transfers from ledger entries.

---

## 9. Planning — budget items, categories, forecast aspects

Consumed by the **Planning** page. This page was 100% `localStorage` before — none of it had ever touched the backend.

### 9.1 Budget items

#### `GET /budget-items`

Response `data`:

```json
{
  "items": [
    { "id": "bi_001", "category": "Revenue", "item": "Subscription Revenue", "planned": 2800000, "actual": 0, "variance": -2800000, "notes": "" }
  ],
  "categories": ["Revenue", "Salaries & Wages", "Commissions", "Marketing", "Operations", "Technology", "Office & Admin", "Other"],
  "totalPlanned": 2800000,
  "totalActual": 0
}
```

- `variance` = `actual - planned` (server-computed per row).
- `totalPlanned` / `totalActual` are server-computed.
- `categories` are free-form strings; the built-in defaults are seeded automatically on first GET.

#### `POST /budget-items`

Request body:

```json
{ "category": "Revenue", "item": "Subscription Revenue", "planned": 2800000, "actual": 0, "notes": "" }
```

Response `data` — the created `BudgetItem`.

#### `PATCH /budget-items/:id`

Partial body: any of `{ category?, item?, planned?, actual?, notes? }`. Response `data` — the updated `BudgetItem`.

#### `DELETE /budget-items/:id`

Response `data`:

```json
{ "success": true }
```

### 9.2 Budget categories

#### `POST /budget-categories`

Request body: `{ "name": "Marketing" }`. Response `data`: `{ "name": "Marketing" }` (idempotent — returns existing if already present).

#### `DELETE /budget-categories/:name`

Response `data`:

```json
{ "success": true }
```

### 9.3 Forecast aspects

#### `GET /forecast-aspects`

Response `data`:

```json
{ "aspects": [ { "id": "fac_001", "label": "Sales Revenue", "baseValue": 2847500, "growthRate": 12 } ] }
```

#### `POST /forecast-aspects`

Request body:

```json
{ "label": "Sales Revenue", "baseValue": 2847500, "growthRate": 12 }
```

Response `data` — the created `AspectForecast`.

#### `PATCH /forecast-aspects/:id`

Partial body: any of `{ label?, baseValue?, growthRate? }`. Response `data` — the updated `AspectForecast`.

#### `DELETE /forecast-aspects/:id`

Response `data`:

```json
{ "success": true }
```

**TypeScript interfaces:**

```ts
interface BudgetItem { id: string; category: string; item: string; planned: number; actual: number; variance: number; notes: string | null; }
interface BudgetItemsPayload { items: BudgetItem[]; categories: string[]; totalPlanned: number; totalActual: number; }
interface AspectForecast { id: string; label: string; baseValue: number; growthRate: number; }
```

**Notes:**
- The UI renders a monthly compounding projection (`baseValue × (1 + growthRate/100)^month`) for a chosen period (3/6/12 months). Prefer calling the existing `POST /forecasting/project` with these aspects over computing client-side.
- Planning goals reuse the `/goals` endpoints (§3).

---

## 10. Settings — 8 config tabs

Consumed by the **Settings** page. Previously these tabs persisted to `localStorage` (and four reset on every reload). All resources below live under `/settings`, are `Admin`/`SUPER_ADMIN`, and are **enveloped**.

### 10.1 Categories — `GET/POST/PATCH/DELETE /settings/categories`

Resource shape:

```json
{ "id": "1", "name": "Software & Subscriptions", "type": "Expense", "description": "SaaS tools and recurring software" }
```

- `POST` body: `{ name, type, description? }` — `type` ∈ `Income | Expense`.
- `PATCH /:id` partial: any of `{ name?, type?, description? }`.
- `DELETE /:id` → `{ "success": true }`.

### 10.2 Chart of Accounts — `GET/POST/PATCH/DELETE /settings/accounts`

Resource shape:

```json
{ "id": "1", "code": "1000", "name": "Cash & Bank", "type": "Current Asset", "normalBalance": "Debit" }
```

- `type` display strings seen: `Current Asset`, `Current Liability`, `Equity`, `Income`, `Expense`.
- `normalBalance` ∈ `Debit | Credit`.
- `code` is unique.

### 10.3 Fiscal Periods — `GET/POST/PATCH/DELETE /settings/periods`

Resource shape:

```json
{ "id": "1", "name": "FY 2026", "startDate": "2026-01-01", "endDate": "2026-12-31", "status": "Open" }
```

- `status` ∈ `Open | Closed`.

### 10.4 Currencies — `GET/POST/PATCH/DELETE /settings/currencies`

Resource shape:

```json
{ "id": "1", "code": "NGN", "name": "Nigerian Naira", "symbol": "₦", "rate": 1, "isDefault": true }
```

- `rate` numeric (conversion factor). Setting a currency `isDefault: true` clears the flag on all other currencies.

### 10.5 Permissions — `GET/PUT /settings/permissions`

`GET` response `data` — array (seeded with defaults if empty):

```json
[
  { "role": "Super Admin", "permissions": { "view": true, "create": true, "edit": true, "delete": true, "approve": true, "manageTeam": true, "manageSettings": true } }
]
```

`PUT` **replaces the whole role→permissions map**. Request body:

```json
{
  "permissions": {
    "Super Admin": { "view": true, "create": true, "edit": true, "delete": true, "approve": true, "manageTeam": true, "manageSettings": true },
    "Admin": { "view": true, "create": true, "edit": true, "delete": false, "approve": true, "manageTeam": false, "manageSettings": false }
  }
}
```

Response `data` — the new array.

### 10.6 Approval Rules — `GET/POST/PATCH/DELETE /settings/approval-rules`

Resource shape:

```json
{ "id": "1", "name": "Large Expense Approval", "trigger": "Expense > ₦500,000", "approver": "Super Admin", "threshold": "₦500,000", "status": "Active" }
```

- `status` ∈ `Active | Inactive`.

### 10.7 Notification Rules — `GET/POST/PATCH/DELETE /settings/notification-rules`

Resource shape:

```json
{ "id": "1", "event": "Large Transaction", "channel": "Email", "enabled": true }
```

- `channel` ∈ `Email | In-App`.

### 10.8 Audit Logs — `GET /settings/audit-logs` (read-only)

Query: `limit?` (default 50, max 200). Response `data`:

```json
{
  "entries": [
    { "id": "log_001", "timestamp": "2026-07-17T09:23:12.000Z", "user": "Admin User", "action": "Settings Updated", "details": "Changed base currency to NGN" }
  ]
}
```

**`audit-logs` is read-only.** Entries are generated server-side from real admin actions (settings changes, profile updates, team changes, etc.). The backend never accepts client-supplied audit entries. This replaces the six hardcoded fake log entries in the frontend.

**TypeScript interfaces:**

```ts
interface SettingsCategory { id: string; name: string; type: 'Income' | 'Expense'; description: string | null; }
interface Account { id: string; code: string; name: string; type: string; normalBalance: 'Debit' | 'Credit'; }
interface FiscalPeriod { id: string; name: string; startDate: string; endDate: string; status: 'Open' | 'Closed'; }
interface Currency { id: string; code: string; name: string; symbol: string; rate: number; isDefault: boolean; }
interface RolePermissions { role: string; permissions: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean; manageTeam: boolean; manageSettings: boolean; }; }
interface ApprovalRule { id: string; name: string; trigger: string; approver: string; threshold: string; status: 'Active' | 'Inactive'; }
interface NotificationRule { id: string; event: string; channel: 'Email' | 'In-App'; enabled: boolean; }
interface AuditLogEntry { id: string; timestamp: string; user: string; action: string; details: string | null; }
```

**Security:** existing rule preserved — `paystackSecretKey` / `termiiApiKey` on `GET /settings` are masked.

---

## 11. Reports — management & custom

Consumed by the **Reports** page. The **Management** tab previously showed a hardcoded fake "Executive Summary"; the **Custom** tab's "Generate Report" button was dead.

### `GET /reports/management` — executive management summary

Response `data` — **all figures computed server-side from real data**:

```json
{ "revenue": 12500000, "expenses": 4800000, "profit": 7700000, "cash": 8200000, "runwayMonths": 12, "customers": 340, "growth": 22.0, "riskLevel": "Low" }
```

- `revenue` = real `SUBSCRIPTION` + `SMS` transactions.
- `expenses` = expenses + commissions (transactions + expenses table).
- `profit` = revenue − expenses.
- `cash` = cash-flow inflow − outflow.
- `runwayMonths` = cash ÷ monthly burn (99 when not burning).
- `customers` = active businesses (from real business/subscription data).
- `growth` = month-over-month revenue growth %.
- `riskLevel` ∈ `Low | Medium | High`, derived from runway + margin.

### `POST /reports/custom` — generate a custom report

Request body (all optional):

```json
{ "dateRange": "90days", "category": "SaaS", "department": "Engineering" }
```

- `dateRange` ∈ `30days | 90days | 12months`.

Response `data`:

```json
{
  "reportSections": [
    { "label": "Revenue", "value": "N6,500,000" },
    { "label": "Expenses", "value": "N2,300,000" },
    { "label": "Net Profit", "value": "N4,200,000" }
  ],
  "filters": { "dateRange": "90days", "category": "SaaS", "department": "Engineering" },
  "trend": [
    { "month": "2026-05", "revenue": 2100000, "expenses": 750000, "profit": 1350000 }
  ]
}
```

**TypeScript interfaces:**

```ts
type RiskLevel = 'Low' | 'Medium' | 'High';
interface ManagementSummary { revenue: number; expenses: number; profit: number; cash: number; runwayMonths: number; customers: number; growth: number; riskLevel: RiskLevel; }
interface ReportSection { label: string; value: string; }
interface CustomReport { reportSections: ReportSection[]; filters: { dateRange: string; category: string; department: string; }; trend: { month: string; revenue: number; expenses: number; profit: number; }[]; }
```

**Notes:** the frontend renders these values and can delete the hardcoded executive summary. Report section values are pre-formatted display strings (`N6,500,000`).

---

## 12. Profile

Consumed by the **Profile** page. Previously read the user from `localStorage` (`fos_user`) and showed a single hardcoded activity entry.

### `GET /profile` — current user profile

Response `data`:

```json
{ "id": "usr_001", "firstName": "Admin", "lastName": "User", "email": "admin@vemtap.com", "avatar": null, "role": "SUPER_ADMIN", "status": "Active" }
```

### `PATCH /profile` — update the current user profile

Request body (any subset):

```json
{ "firstName": "New", "lastName": "Name", "email": "admin@vemtap.com", "avatar": "https://example.com/avatar.png" }
```

Response `data` — the updated profile. **`409`** if the email already belongs to another user. Profile updates write a server-generated activity entry.

### `GET /profile/activity` — server-generated profile activity

Query: `limit?` (default 20, max 100). Response `data`:

```json
{
  "entries": [
    { "id": "act_001", "timestamp": "2026-07-17T09:23:12.000Z", "user": "Admin User", "action": "Profile Updated", "details": "Changed first name" }
  ]
}
```

**TypeScript interfaces:**

```ts
interface Profile { id: string; firstName: string; lastName: string; email: string; avatar: string | null; role: string; status: string; }
interface ActivityEntry { id: string; timestamp: string; user: string; action: string; details: string | null; }
```

**Notes:** activity entries are generated server-side from real account actions — never client-supplied.

---

## 13. Computed metrics (no more fabricated numbers)

The following figures were previously fabricated in frontend code (magic-constant multiplications, hardcoded fallbacks). They are now computed server-side and returned in the endpoints below:

| Metric | Previously faked as | Now returned by |
|---|---|---|
| Available / committed / reserved cash | `totalCash × 0.6`, `× 0.25/0.15` | `/dashboard/stats` (`availableCash`, `committedCash`, `reservedCash`) and `/pnl/cashflow-runway` (same fields) |
| P&L revenue category split | `grossRevenue × 0.7 / 0.3` | `/pnl/statement` → `revenueByCategory[]` |
| Product profitability | `grossRevenue × 0.7/0.2/0.05/...` | `/pnl/statement` → `productProfitability[]` |
| Commission statuses | `i % 3 → pending/approved/paid` | `/affiliates/agents` (`commissionStatus`) + `/affiliates/commission/summary` |
| Commission summary split | `totalCommission × 0.3/0.5/0.2` | `/affiliates/commission/summary` |
| Agent revenue column | `commissionEarned × 5` | `/affiliates/agents` (`revenueAttributed`) |
| Executive summary | hardcoded ₦12.5M etc. | `/reports/management` |
| Budget variance | `actual - planned` | `/budget-items` (`variance`, `totalPlanned`, `totalActual`) |
| Forecasting inputs | hardcoded `cashBalance: 0`, `qrThriveLeadsPerMonth: 0` | `GET /forecasting/defaults` |
| Payroll "Paid" figure | fabricated from `monthlySalary` | `/payables` → `payrollPaid` |

### `GET /forecasting/defaults` — real forecast default inputs

Response `data` (all derived from real data):

```json
{
  "baseBusinesses": 342,
  "arpu": 8324,
  "fixedCosts": 1635000,
  "grossRevenue": 2847500,
  "variableCostMargin": 50,
  "cashBalance": 892300,
  "qrThriveLeadsPerMonth": 200,
  "growthRate": 10,
  "churnRate": 5,
  "conversionRate": 15
}
```

Feed these into `POST /forecasting/project` instead of sending `0` defaults.

### `/dashboard/stats` and `/pnl/statement` — new fields

`/dashboard/stats` response `data` now includes (in addition to the v1 fields):

```json
{
  "cashBalance": 892300,
  "availableCash": 535380,
  "committedCash": 223075,
  "reservedCash": 133845
}
```

`/pnl/statement` response `data` now includes:

```json
{
  "revenueByCategory": [ { "name": "Subscription", "value": 3500000 }, { "name": "SMS", "value": 900000 }, { "name": "QRThrive", "value": 850000 } ],
  "productProfitability": [ { "name": "QRThrive", "revenue": 850000, "profit": 720000, "margin": 84.7 } ]
}
```

`/pnl/cashflow-runway` response `data` now includes `availableCash`, `committedCash`, `reservedCash`.

---

## 14. Role coverage changes

Routes that previously required `Admin` only are now open to `Admin` **and** `SUPER_ADMIN` (the FOS app authenticates as `SUPER_ADMIN`):

- All `/affiliates/agents*` routes (list, detail, revenue, commission, approve, mark-paid, create, update, deactivate).
- All `/affiliates/admin/*` routes (stats, withdrawals, profiles, referrals, commissions, fraud, settings, KYC, flag).
- All `/businesses/admin*` routes and `GET /businesses/stats`, `GET /businesses/admin/:id/stats`.
- `POST /notifications/broadcast` and `GET /notifications/admin/history/broadcasts`.

---

## 15. Database tables added

New tables (migration `1786096533198-AddFosIntegrationTables`):

| Table | Purpose |
|---|---|
| `fos_invoices` | Manual receivables invoices |
| `fos_bills` | Manual payables bills |
| `fos_agent_commissions` | Per-agent commission lifecycle state |
| `fos_records` | Manual ledger entries |
| `fos_transfers` | Internal transfers |
| `fos_budget_items` | Planning budget items |
| `fos_budget_categories` | Planning budget categories (defaults seeded) |
| `fos_forecast_aspects` | Planning forecast aspects |
| `fos_settings_categories` | Settings → income/expense categories |
| `fos_accounts` | Settings → chart of accounts |
| `fos_periods` | Settings → fiscal periods |
| `fos_currencies` | Settings → currencies |
| `fos_permissions` | Settings → role permissions |
| `fos_approval_rules` | Settings → approval rules |
| `fos_notification_rules` | Settings → notification rules |
| `fos_audit_logs` | Server-generated audit log entries |

All money columns use the numeric transformer (read as numbers, NGN, minor-unit free).

---

## 16. Integration checklist

- [ ] All §3–§12 endpoints implemented with exact paths, methods, and field names.
- [ ] Response envelope `{ success, data }` everywhere; errors `{ success: false, message }`.
- [ ] `401` returned for expired/invalid tokens (forces re-login).
- [ ] Money as numeric NGN; dates ISO `YYYY-MM-DD`; timestamps UTC ISO-8601.
- [ ] Enum values match the exact strings in each section (§3–§12).
- [ ] §13 metrics are computed server-side — no frontend fabrication.
- [ ] Pagination (`page`/`perPage`/`total`) on list endpoints.
- [ ] `GET /settings` masks `paystackSecretKey` / `termiiApiKey`.
- [ ] `GET /settings/audit-logs` and `/profile/activity` are server-generated only.
- [ ] Affiliate/business admin routes accessible to both `Admin` and `SUPER_ADMIN`.
