# FOS Expenses, P&L, and Cash Flow API

## Overview

The FOS (Financial Operations System) Expenses, P&L, and Cash Flow module provides REST endpoints for managing expenses, viewing profit & loss statements, tracking cash flows, and computing runway/break-even analysis. All endpoints are ADMIN-only.

**Base URL:** `http://localhost:3002/api/v1` (local)  
**Auth:** Bearer JWT token in `Authorization` header  
**Swagger Docs:** `http://localhost:3002/api-docs`  
**Error Envelope:** `{ statusCode, timestamp, path, method, error, message }`

---

## Authentication

All endpoints require a valid admin JWT token:

```http
Authorization: Bearer <token>
```

Returns `401 Unauthorized` if token is missing/invalid.  
Returns `403 Forbidden` if the user does not have the `Admin` role.

---

## Error Response Format

```typescript
interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string;
}
```

### Common Error Codes

| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Validation failed (invalid enum, missing required field, non-numeric amount) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks ADMIN role |
| 500 | Internal Server Error | Unexpected server failure |

---

## Endpoints

### 1. GET /expenses — List Expenses

Returns paginated expenses with optional category filter. Order by date descending.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (min 1) |
| perPage | number | No | 20 | Items per page (min 1, max 100) |
| category | string | No | — | Filter by category (case-insensitive partial match) |

#### Response

```typescript
// 200 OK
interface ListExpensesResponse {
  success: true;
  data: {
    expenses: ExpenseItem[];
    total: number;
  };
}

interface ExpenseItem {
  id: string;          // UUID
  category: string;    // e.g. "Salaries", "Rent", "Marketing"
  amount: number;      // Decimal
  frequency: 'ONE_TIME' | 'RECURRING';
  date: string;        // "YYYY-MM-DD"
  createdAt: string;   // ISO 8601
}
```

#### Edge Cases

- **Empty results:** Returns `{ success: true, data: { expenses: [], total: 0 } }`
- **No category filter:** Returns all expenses
- **Category partial match:** Search is case-insensitive ILIKE, e.g. `?category=sal` matches "Salaries"
- **Page beyond available data:** Returns `{ expenses: [], total: <actual> }`

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/expenses?page=1&perPage=20&category=Salaries"
```

```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "a1b2c3d4-...",
        "category": "Salaries",
        "amount": 500000,
        "frequency": "RECURRING",
        "date": "2026-06-01",
        "createdAt": "2026-06-01T10:00:00.000Z"
      }
    ],
    "total": 5
  }
}
```

---

### 2. POST /expenses — Create Expense

Creates a new expense record and automatically inserts a corresponding `CashFlow` entry with type `OUTFLOW` to keep the cash flow ledger in sync.

#### Request Body

```typescript
interface CreateExpenseRequest {
  category: string;                 // Required. Expense category
  amount: number;                   // Required. Must be >= 0
  frequency: 'ONE_TIME' | 'RECURRING';  // Required
  date?: string;                    // Optional. "YYYY-MM-DD". Defaults to today
}
```

#### Response

```typescript
// 201 Created
interface CreateExpenseResponse {
  success: true;
  data: ExpenseItem;  // Same shape as GET /expenses item
}
```

#### Side Effects

- Automatically creates a `CashFlow` record with:
  - `type: "OUTFLOW"`
  - `category`: same as expense
  - `amount`: same as expense
  - `date`: same as expense

#### Edge Cases

- **Missing required fields:** Returns 400
- **Invalid frequency enum:** Returns 400. Must be `ONE_TIME` or `RECURRING`
- **Negative amount:** Returns 400 (validation: `@Min(0)`)
- **No date provided:** Defaults to current date (`CURRENT_DATE`)

#### Example

```bash
curl -X POST "http://localhost:3002/api/v1/expenses" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Office Rent",
    "amount": 300000,
    "frequency": "RECURRING",
    "date": "2026-06-01"
  }'
```

```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-...",
    "category": "Office Rent",
    "amount": 300000,
    "frequency": "RECURRING",
    "date": "2026-06-01",
    "createdAt": "2026-06-01T12:00:00.000Z"
  }
}
```

---

### 3. GET /pnl/statement — Profit & Loss Statement

Returns a computed profit and loss statement aggregated from the `fos_transactions` table.

#### Query Parameters

None.

#### Response

```typescript
// 200 OK
interface PnlStatementResponse {
  success: true;
  data: {
    grossRevenue: number;           // Sum of SUBSCRIPTION + SMS + COMMISSION amounts
    gatewayCost: number;            // Sum of all transaction costs
    commissionPaid: number;         // Sum of COMMISSION type amounts
    opexPaid: number;               // Sum of EXPENSE type amounts
    netProfit: number;              // grossRevenue - gatewayCost - commissionPaid - opexPaid
    profitMarginPercentage: number; // (netProfit / grossRevenue) * 100, 0 if revenue <= 0
  };
}
```

#### Computation Logic

| Metric | Source |
|--------|--------|
| `grossRevenue` | `SUM(amount)` WHERE `type IN ('SUBSCRIPTION', 'SMS', 'COMMISSION')` |
| `gatewayCost` | `SUM(cost)` across ALL transactions |
| `commissionPaid` | `SUM(amount)` WHERE `type = 'COMMISSION'` |
| `opexPaid` | `SUM(amount)` WHERE `type = 'EXPENSE'` |
| `netProfit` | `grossRevenue - gatewayCost - commissionPaid - opexPaid` |
| `profitMarginPercentage` | Rounded to 1 decimal place. Returns `0` if `grossRevenue <= 0` |

#### Edge Cases

- **No transactions exist:** All values are 0, `profitMarginPercentage` is 0
- **Negative net profit:** `profitMarginPercentage` will be negative
- **High precision:** All monetary values are rounded to 2 decimal places

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/pnl/statement"
```

```json
{
  "success": true,
  "data": {
    "grossRevenue": 5000000,
    "gatewayCost": 250000,
    "commissionPaid": 750000,
    "opexPaid": 500000,
    "netProfit": 3500000,
    "profitMarginPercentage": 70.0
  }
}
```

---

### 4. GET /pnl/revenue-trends — Monthly Revenue Trends

Returns monthly revenue and profit time series from `fos_transactions`. Powers the revenue trend chart on the P&L page.

#### Query Parameters

None.

#### Response

```typescript
// 200 OK
interface RevenueTrendsResponse {
  success: true;
  data: RevenueTrend[];
}

interface RevenueTrend {
  date: string;     // "YYYY-MM" format, e.g. "2026-01"
  revenue: number;  // Sum of amounts for the month
  profit: number;   // Sum of (amount - cost) for the month
}
```

#### Computation Logic

- Filters transactions with type `SUBSCRIPTION` or `SMS`
- Groups by `YYYY-MM` (first 7 chars of the `date` field)
- For each month: `revenue = SUM(amount)`, `profit = SUM(amount - cost)`
- Results sorted ascending by date

#### Edge Cases

- **No transactions:** Returns `{ success: true, data: [] }`
- **Single month:** Returns one entry
- **Months with only revenue transactions:** `profit` equals `revenue` if `cost` is 0

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/pnl/revenue-trends"
```

```json
{
  "success": true,
  "data": [
    { "date": "2026-01", "revenue": 450000, "profit": 400000 },
    { "date": "2026-02", "revenue": 520000, "profit": 470000 },
    { "date": "2026-03", "revenue": 480000, "profit": 430000 }
  ]
}
```

---

### 5. GET /pnl/cashflows — List Cash Flows

Returns paginated cash flow entries with optional type filter. Order by date descending.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (min 1) |
| perPage | number | No | 20 | Items per page (min 1, max 100) |
| type | string | No | — | Filter by type: `INFLOW` or `OUTFLOW` |

#### Response

```typescript
// 200 OK
interface ListCashFlowsResponse {
  success: true;
  data: {
    cashflows: CashFlowEntry[];
    total: number;
  };
}

interface CashFlowEntry {
  id: string;          // UUID
  type: 'INFLOW' | 'OUTFLOW';
  category: string;    // e.g. "Revenue Payment", "Office Rent"
  amount: number;      // Decimal
  date: string;        // "YYYY-MM-DD"
  createdAt: string;   // ISO 8601
}
```

#### Edge Cases

- **Empty results:** Returns `{ success: true, data: { cashflows: [], total: 0 } }`
- **No type filter:** Returns all cash flows (both INFLOW and OUTFLOW)
- **Invalid type value:** Returns 400 validation error (must be `INFLOW` or `OUTFLOW`)

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/pnl/cashflows?page=1&perPage=10&type=OUTFLOW"
```

```json
{
  "success": true,
  "data": {
    "cashflows": [
      {
        "id": "c3d4e5f6-...",
        "type": "OUTFLOW",
        "category": "Office Rent",
        "amount": 300000,
        "date": "2026-06-01",
        "createdAt": "2026-06-01T12:00:00.000Z"
      }
    ],
    "total": 15
  }
}
```

---

### 6. POST /pnl/cashflows — Create Cash Flow Entry

Creates a new cash flow entry. Use this for manual cash flow adjustments that don't originate from expenses.

#### Request Body

```typescript
interface CreateCashFlowRequest {
  type: 'INFLOW' | 'OUTFLOW';    // Required
  category: string;               // Required. e.g. "Revenue Payment"
  amount: number;                 // Required. Must be >= 0
  date?: string;                  // Optional. "YYYY-MM-DD". Defaults to today
}
```

#### Response

```typescript
// 201 Created
interface CreateCashFlowResponse {
  success: true;
  data: CashFlowEntry;  // Same shape as GET /pnl/cashflows item
}
```

#### Edge Cases

- **Missing required fields:** Returns 400
- **Invalid type enum:** Returns 400. Must be `INFLOW` or `OUTFLOW`
- **Negative amount:** Returns 400

#### Example

```bash
curl -X POST "http://localhost:3002/api/v1/pnl/cashflows" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INFLOW",
    "category": "Investor Funding",
    "amount": 5000000,
    "date": "2026-06-15"
  }'
```

```json
{
  "success": true,
  "data": {
    "id": "d4e5f6a7-...",
    "type": "INFLOW",
    "category": "Investor Funding",
    "amount": 5000000,
    "date": "2026-06-15",
    "createdAt": "2026-06-15T09:00:00.000Z"
  }
}
```

---

### 7. GET /pnl/cashflow-runway — Cash Flow Runway

Computes cash runway analysis from the `cash_flows` table.

#### Query Parameters

None.

#### Response

```typescript
// 200 OK
interface CashFlowRunwayResponse {
  success: true;
  data: {
    openingCashBalance: number;   // Balance before current month
    closingCashBalance: number;   // totalInflow - totalOutflow
    monthlyNetCashFlow: number;   // (totalInflow - totalOutflow) / monthCount
    monthlyBurnRate: number;      // totalOutflow / monthCount
    runwayMonths: number;         // Months until cash runs out (max 99)
  };
}
```

#### Computation Logic

- `totalInflow` = SUM of all `CashFlow.amount` where `type = 'INFLOW'`
- `totalOutflow` = SUM of all `CashFlow.amount` where `type = 'OUTFLOW'`
- `monthCount` = Number of distinct `YYYY-MM` months across all cash flow records (minimum 1)
- `closingCashBalance` = `totalInflow - totalOutflow`
- `openingCashBalance` = Same formula restricted to records before the current calendar month
- `monthlyNetCashFlow` = `(totalInflow - totalOutflow) / monthCount`
- `monthlyBurnRate` = `totalOutflow / monthCount`
- `runwayMonths` = If `monthlyNetCashFlow >= 0`, returns `99`. Otherwise: `Math.min(99, Math.floor(closingCashBalance / |monthlyNetCashFlow|))`

#### Edge Cases

- **No cash flow records:** All values 0, `runwayMonths` = 0
- **Positive net cash flow:** `runwayMonths` caps at 99
- **Negative closing balance:** `runwayMonths` = 0 (already overspent)

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/pnl/cashflow-runway"
```

```json
{
  "success": true,
  "data": {
    "openingCashBalance": 2500000,
    "closingCashBalance": 2100000,
    "monthlyNetCashFlow": -400000,
    "monthlyBurnRate": 1200000,
    "runwayMonths": 5
  }
}
```

---

### 8. GET /pnl/cost-break-even — Cost Break-Even Analysis

Computes break-even analysis using the `expenses`, `cash_flows`, and `fos_transactions` tables.

#### Query Parameters

None.

#### Response

```typescript
// 200 OK
interface CostBreakEvenResponse {
  success: true;
  data: {
    totalMonthlyCosts: number;        // (commissionPaid + opexTotal) / monthCount
    monthlyFixedCosts: number;        // opexTotal / monthCount
    grossRevenue: number;             // Total from SUBSCRIPTION + SMS transactions
    activeBusinesses: number;         // Distinct businessIds with SUBSCRIPTION transactions
    arpu: number;                     // Average revenue per business per month
    breakEvenBusinesses: number;      // Businesses needed to break even
    breakEvenRevenue: number;         // totalMonthlyCosts (revenue needed)
    progressPercent: number;          // How close to break-even (0-100%)
    remainingGap: number;             // Revenue still needed to break even
    isProfitable: boolean;            // grossRevenue >= totalMonthlyCosts
  };
}
```

#### Computation Logic

| Metric | Formula |
|--------|---------|
| `opexTotal` | `SUM(expenses.amount)` from expenses table |
| `commissionPaid` | `SUM(amount)` WHERE `type = 'COMMISSION'` from transactions |
| `monthCount` | Distinct months across cash_flows + expenses (min 1) |
| `totalMonthlyCosts` | `(commissionPaid + opexTotal) / monthCount` |
| `monthlyFixedCosts` | `opexTotal / monthCount` |
| `grossRevenue` | `SUM(amount)` WHERE `type IN ('SUBSCRIPTION', 'SMS')` |
| `activeBusinesses` | Count of distinct `businessId` on SUBSCRIPTION transactions (min 1) |
| `arpu` | `grossRevenue / activeBusinesses / monthCount` (0 if no businesses) |
| `breakEvenBusinesses` | `Math.ceil(totalMonthlyCosts / arpu)` if `arpu > 0`, else 0 |
| `breakEvenRevenue` | `totalMonthlyCosts` |
| `progressPercent` | `Math.min(100, (grossRevenue / totalMonthlyCosts) * 100)` — 100 if costs ≤ 0 |
| `remainingGap` | `Math.max(0, totalMonthlyCosts - grossRevenue)` |
| `isProfitable` | `grossRevenue >= totalMonthlyCosts` |

#### Edge Cases

- **No expenses or cash flows:** `totalMonthlyCosts` = 0, `progressPercent` = 100, `isProfitable` = true
- **No transactions:** `grossRevenue` = 0, `activeBusinesses` = 1, `arpu` = 0, `breakEvenBusinesses` = 0
- **Single month of data:** `monthCount` = 1, all monthly values equal raw totals
- **Highly profitable:** `progressPercent` capped at 100, `remainingGap` = 0

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/pnl/cost-break-even"
```

```json
{
  "success": true,
  "data": {
    "totalMonthlyCosts": 1250000,
    "monthlyFixedCosts": 500000,
    "grossRevenue": 5000000,
    "activeBusinesses": 340,
    "arpu": 3676.47,
    "breakEvenBusinesses": 340,
    "breakEvenRevenue": 1250000,
    "progressPercent": 100,
    "remainingGap": 0,
    "isProfitable": true
  }
}
```

---

## TypeScript Interfaces Summary

```typescript
// === Expense DTOs ===

interface ListExpensesQuery {
  page?: number;         // default: 1
  perPage?: number;      // default: 20, max: 100
  category?: string;
}

interface CreateExpenseRequest {
  category: string;
  amount: number;
  frequency: 'ONE_TIME' | 'RECURRING';
  date?: string;
}

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  frequency: 'ONE_TIME' | 'RECURRING';
  date: string;
  createdAt: string;
}

interface ListExpensesResponse {
  success: true;
  data: {
    expenses: ExpenseItem[];
    total: number;
  };
}

// === Cash Flow DTOs ===

interface ListCashFlowsQuery {
  page?: number;         // default: 1
  perPage?: number;      // default: 20, max: 100
  type?: 'INFLOW' | 'OUTFLOW';
}

interface CreateCashFlowRequest {
  type: 'INFLOW' | 'OUTFLOW';
  category: string;
  amount: number;
  date?: string;
}

interface CashFlowEntry {
  id: string;
  type: 'INFLOW' | 'OUTFLOW';
  category: string;
  amount: number;
  date: string;
  createdAt: string;
}

interface ListCashFlowsResponse {
  success: true;
  data: {
    cashflows: CashFlowEntry[];
    total: number;
  };
}

// === P&L Statement ===

interface PnlStatementResponse {
  success: true;
  data: {
    grossRevenue: number;
    gatewayCost: number;
    commissionPaid: number;
    opexPaid: number;
    netProfit: number;
    profitMarginPercentage: number;
  };
}

// === Revenue Trends ===

interface RevenueTrend {
  date: string;       // "YYYY-MM"
  revenue: number;
  profit: number;
}

interface RevenueTrendsResponse {
  success: true;
  data: RevenueTrend[];
}

// === Cash Flow Runway ===

interface CashFlowRunwayResponse {
  success: true;
  data: {
    openingCashBalance: number;
    closingCashBalance: number;
    monthlyNetCashFlow: number;
    monthlyBurnRate: number;
    runwayMonths: number;
  };
}

// === Cost Break-Even ===

interface CostBreakEvenResponse {
  success: true;
  data: {
    totalMonthlyCosts: number;
    monthlyFixedCosts: number;
    grossRevenue: number;
    activeBusinesses: number;
    arpu: number;
    breakEvenBusinesses: number;
    breakEvenRevenue: number;
    progressPercent: number;
    remainingGap: number;
    isProfitable: boolean;
  };
}

// === Error ===

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

| Endpoint | Field | Validator | Rule |
|----------|-------|-----------|------|
| All paginated | page | `@IsInt()` `@Min(1)` | Integer, minimum 1 |
| All paginated | perPage | `@IsInt()` `@Min(1)` `@Max(100)` | Integer, 1–100 |
| GET /expenses | category | `@IsString()` `@IsOptional()` | Free string |
| POST /expenses | category | `@IsString()` `@IsNotEmpty()` | Required, non-empty |
| POST /expenses | amount | `@IsNumber()` `@Min(0)` | Required, >= 0 |
| POST /expenses | frequency | `@IsEnum(ExpenseFrequency)` | `ONE_TIME` or `RECURRING` |
| POST /expenses | date | `@IsDateString()` `@IsOptional()` | ISO date, defaults to today |
| GET /pnl/cashflows | type | `@IsEnum(CashFlowType)` | `INFLOW` or `OUTFOW` |
| POST /pnl/cashflows | type | `@IsEnum(CashFlowType)` | Required |
| POST /pnl/cashflows | category | `@IsString()` `@IsNotEmpty()` | Required, non-empty |
| POST /pnl/cashflows | amount | `@IsNumber()` `@Min(0)` | Required, >= 0 |

---

## Rate Limiting

The API applies global rate limiting via `@nestjs/throttler`. Default: 10 requests per 60 seconds per IP.

---

## Data Flow Summary

```
POST /expenses
  │
  ├─► Inserts into `expenses` table
  │
  └─► Auto-inserts into `cash_flows` table (type: OUTFLOW, same category/amount/date)

GET /pnl/statement
  └─► Aggregates from `fos_transactions` (SUBSCRIPTION, SMS, COMMISSION, EXPENSE types)

GET /pnl/revenue-trends
  └─► Groups `fos_transactions` by month (SUBSCRIPTION, SMS types only)

GET /pnl/cashflow-runway
  └─► Computes from `cash_flows` table

GET /pnl/cost-break-even
  ├─► Expenses from `expenses` table
  ├─► Commissions from `fos_transactions`
  └─► Revenue from `fos_transactions`
```

---

## Legacy Endpoints (unchanged, still available)

The following existing endpoints remain available at their original paths:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/pnl/break-even` | Original break-even (uses `fos_transactions` only) |
| GET | `/pnl/runway` | Original runway (uses `fos_transactions` only) |
| GET | `/revenue/trends` | Original daily revenue trends (uses snapshots) |
