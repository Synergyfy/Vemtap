# FOS Revenue Analytics API

## Overview

The FOS (Financial Operations System) Revenue Analytics module provides REST endpoints for querying financial transactions, aggregated revenue metrics, trend data, chart data, and business-level revenue history. All endpoints are ADMIN-only and follow the existing NestJS API conventions.

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
| 400 | Bad Request | Validation failed (invalid query params, malformed UUID, invalid enum value, date range mismatch) |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks ADMIN role |
| 404 | Not Found | Resource (business, transaction) does not exist |
| 422 | Unprocessable Entity | startDate > endDate |
| 500 | Internal Server Error | Unexpected server failure |

---

## Endpoints

### 1. GET /revenue/transactions

Returns paginated, filtered revenue transactions. Powers the Transaction History table.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (min 1) |
| perPage | number | No | 10 | Items per page (min 1, max 100) |
| type | string | No | — | Filter by transaction type: `SUBSCRIPTION`, `SMS`, `COMMISSION`, `EXPENSE`, `REFUND` |
| platform | string | No | — | Filter by platform: `VEMTAP`, `QRTHRIVE` |
| businessId | string | No | — | Filter by business UUID |
| agentId | string | No | — | Filter by agent ID |
| startDate | string | No | — | Start date (ISO 8601 or `YYYY-MM-DD`) |
| endDate | string | No | — | End date (ISO 8601 or `YYYY-MM-DD`) |

#### Response

```typescript
// 200 OK
interface TransactionsListResponse {
  transactions: TransactionDto[];
  total: number;
}

interface TransactionDto {
  id: string;               // UUID
  type: string;             // "SUBSCRIPTION" | "SMS" | "COMMISSION" | "EXPENSE" | "REFUND"
  platform: string;         // "VEMTAP" | "QRTHRIVE"
  paymentMethod: string | null;
  amount: number;
  cost: number;
  profit: number;
  referenceId: string | null;
  date: string;             // "2026-01-15"
  businessId: string | null;
  businessName: string | null;
  agentId: string | null;
  agentName: string | null;
}
```

#### Edge Cases

- **Empty results:** Returns `{ transactions: [], total: 0 }`
- **Invalid UUID for businessId:** Returns 400 with validation error
- **Invalid enum value for type/platform:** Returns 400 with validation error
- **Page beyond available data:** Returns `{ transactions: [], total: <actual_total> }`
- **startDate > endDate:** Both are optional; if both provided, validated server-side, returns 422
- **Null relations:** `businessName` and `agentName` will be `null` if `businessId`/`agentId` is null or the related entity doesn't exist

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/revenue/transactions?page=1&perPage=10&type=SUBSCRIPTION&platform=VEMTAP"
```

```json
{
  "transactions": [
    {
      "id": "a1b2c3d4-...",
      "type": "SUBSCRIPTION",
      "platform": "VEMTAP",
      "paymentMethod": "card",
      "amount": 50000,
      "cost": 0,
      "profit": 50000,
      "referenceId": "pay_ref_123",
      "date": "2026-01-15",
      "businessId": "biz-uuid-1",
      "businessName": "The Azure Bistro",
      "agentId": "agent-uuid-1",
      "agentName": "John Agent"
    }
  ],
  "total": 42
}
```

---

### 2. GET /revenue/aggregates

Returns summary financial aggregates for dashboard cards.

#### Query Parameters

None. (Can be extended with date range in future.)

#### Response

```typescript
// 200 OK
interface RevenueAggregatesResponse {
  totalRevenue: number;          // SUM of all transaction amounts
  subscriptionRevenue: number;   // SUM of SUBSCRIPTION type amounts
  smsRevenue: number;            // SUM of SMS type amounts
  totalProfit: number;           // SUM of all profit values
  agentPayouts: number;          // SUM of COMMISSION type amounts
  totalTransactions: number;     // Total count of all transactions
}
```

#### Edge Cases

- **No transactions exist:** Returns all values as 0, `totalTransactions` as 0
- **Decimal precision:** All monetary values are returned as plain numbers (TypeORM decimal values are converted from string)

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/revenue/aggregates"
```

```json
{
  "totalRevenue": 1250000,
  "subscriptionRevenue": 850000,
  "smsRevenue": 400000,
  "totalProfit": 450000,
  "agentPayouts": 175000,
  "totalTransactions": 340
}
```

---

### 3. GET /revenue/trends

Returns daily revenue and profit time series for the Revenue Growth area chart.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (ISO 8601 or `YYYY-MM-DD`) |
| endDate | string | No | End date (ISO 8601 or `YYYY-MM-DD`) |

#### Response

```typescript
// 200 OK
type RevenueTrendsResponse = RevenueTrendDto[];

interface RevenueTrendDto {
  date: string;     // "YYYY-MM-DD"
  revenue: number;  // Sum of transaction amounts for that day
  profit: number;   // Sum of profits for that day
}
```

#### Data Source Strategy

1. **Primary:** Queries the `fos_metrics_snapshots` table (pre-computed daily snapshots)
2. **Fallback:** If fewer than 2 snapshots exist, queries the `fos_transactions` table directly with `GROUP BY date`
3. Results are always sorted ascending by date

#### Edge Cases

- **No snapshots and no transactions:** Returns empty array `[]`
- **Single snapshot:** Falls back to transaction table (snapshots < 2 triggers fallback)
- **No date range provided:** Returns ALL trends (no date filtering)
- **Date range with no data:** Returns empty array `[]`

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/revenue/trends?startDate=2026-01-01&endDate=2026-01-31"
```

```json
[
  { "date": "2026-01-01", "revenue": 45000, "profit": 15000 },
  { "date": "2026-01-02", "revenue": 32000, "profit": 10000 },
  { "date": "2026-01-03", "revenue": 0, "profit": 0 }
]
```

---

### 4. GET /revenue/chart-data

Returns server-computed chart data for the Vemtap vs QRThrive bar chart and the Revenue by Type pie chart. Moves aggregation from client to server to eliminate over-fetching.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date filter (ISO 8601 or `YYYY-MM-DD`) |
| endDate | string | No | End date filter (ISO 8601 or `YYYY-MM-DD`) |
| platform | string | No | Filter by platform: `VEMTAP`, `QRTHRIVE` |
| type | string | No | Filter by transaction type |

#### Response

```typescript
// 200 OK
interface RevenueChartDataResponse {
  monthlyPlatformRevenue: MonthlyPlatformRevenueDto[];
  revenueByType: RevenueByTypeDto[];
}

interface MonthlyPlatformRevenueDto {
  month: string;    // "Jan 26", "Feb 26", etc.
  total: number;    // Sum of all revenue that month
  vemtap: number;   // Sum of VEMTAP platform revenue
  qrthrive: number; // Sum of QRTHRIVE platform revenue
}

interface RevenueByTypeDto {
  name: string;     // "SUBSCRIPTION" | "SMS" | "COMMISSION" | "EXPENSE" | "REFUND"
  value: number;    // Sum of amounts for this type
}
```

#### Edge Cases

- **No data matching filters:** Returns `{ monthlyPlatformRevenue: [], revenueByType: [] }`
- **Single type transactions:** `monthlyPlatformRevenue` shows 0 for the missing platform split
- **All platforms same:** Both `vemtap` and `qrthrive` may have values or one may be 0
- **Date range with no matching months:** Empty arrays
- **startDate > endDate:** Returns 422 Unprocessable Entity

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/revenue/chart-data?startDate=2026-01-01&endDate=2026-06-30"
```

```json
{
  "monthlyPlatformRevenue": [
    { "month": "Jan 26", "total": 180000, "vemtap": 120000, "qrthrive": 60000 },
    { "month": "Feb 26", "total": 195000, "vemtap": 130000, "qrthrive": 65000 }
  ],
  "revenueByType": [
    { "name": "SUBSCRIPTION", "value": 850000 },
    { "name": "SMS", "value": 400000 },
    { "name": "COMMISSION", "value": 175000 }
  ]
}
```

---

### 5. GET /revenue/business/:businessId/history

Returns the full transaction history for a specific business (no pagination). Used by the business side panel revenue chart.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| businessId | string | Yes | Business UUID |

#### Response

```typescript
// 200 OK
interface BusinessRevenueHistoryResponse {
  transactions: BusinessTransactionItemDto[];
}

interface BusinessTransactionItemDto {
  id: string;       // Transaction UUID
  date: string;     // "YYYY-MM-DD"
  amount: number;
  profit: number;
  type: string;     // Transaction type
}
```

#### Edge Cases

- **Business with no transactions:** Returns `{ transactions: [] }` — does NOT throw 404
- **Invalid UUID format:** Returns 400 with validation error
- **Non-existent business ID:** This endpoint queries by `businessId` on the transaction table, not the business table. If no transactions exist for the given ID, returns empty array. If you need to validate the business exists first, the service will check by querying a single transaction with that `businessId`.

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/revenue/business/a1b2c3d4-1234-5678-9abc-def012345678/history"
```

```json
{
  "transactions": [
    { "id": "tx-uuid-1", "date": "2026-01-15", "amount": 50000, "profit": 50000, "type": "SUBSCRIPTION" },
    { "id": "tx-uuid-2", "date": "2026-02-15", "amount": 50000, "profit": 50000, "type": "SUBSCRIPTION" }
  ]
}
```

---

### 6. GET /businesses/stats

Returns aggregate statistics for the Businesses page summary cards.

#### Query Parameters

None.

#### Response

```typescript
// 200 OK
interface BusinessStatsResponse {
  activeBusinesses: number;
  totalMrr: number;
  churnRate: number;         // Percentage (e.g. 12.5)
  churnedCount: number;      // Raw count of suspended businesses
  totalBusinesses: number;   // Total count for rate calculation
  bestSellingPlan: {
    plan: string;             // Plan name, e.g. "GOLD"
    totalMrr: number;
    businessCount: number;
  } | null;
  planDistribution: {
    plan: string;
    count: number;
    totalMrr: number;
  }[];
  statusDistribution: {
    status: string;   // "active" | "pending" | "suspended"
    count: number;
  }[];
}
```

#### Edge Cases

- **No businesses registered:** Returns `activeBusinesses: 0, totalMrr: 0, churnRate: 0, totalBusinesses: 0, bestSellingPlan: null, planDistribution: [], statusDistribution: []`
- **No subscriptions:** `totalMrr` = 0, `bestSellingPlan` = null, `planDistribution` = empty
- **All businesses churned:** `churnRate` = 100
- **Multiple plans tied for best:** Returns the first one alphabetically/by query order
- **churnRate precision:** Rounded to 1 decimal place

#### Example

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3002/api/v1/businesses/stats"
```

```json
{
  "activeBusinesses": 45,
  "totalMrr": 2250000,
  "churnRate": 10.0,
  "churnedCount": 5,
  "totalBusinesses": 50,
  "bestSellingPlan": {
    "plan": "GOLD",
    "totalMrr": 1200000,
    "businessCount": 24
  },
  "planDistribution": [
    { "plan": "GOLD", "count": 24, "totalMrr": 1200000 },
    { "plan": "SILVER", "count": 16, "totalMrr": 800000 },
    { "plan": "FREE", "count": 5, "totalMrr": 0 }
  ],
  "statusDistribution": [
    { "status": "active", "count": 45 },
    { "status": "pending", "count": 3 },
    { "status": "suspended", "count": 5 }
  ]
}
```

---

## TypeScript Interfaces Summary

```typescript
// === Query DTOs ===

interface RevenueTransactionsQuery {
  page?: number;        // default: 1
  perPage?: number;     // default: 10
  type?: 'SUBSCRIPTION' | 'SMS' | 'COMMISSION' | 'EXPENSE' | 'REFUND';
  platform?: 'VEMTAP' | 'QRTHRIVE';
  businessId?: string;
  agentId?: string;
  startDate?: string;
  endDate?: string;
}

interface ChartDataQuery {
  startDate?: string;
  endDate?: string;
  platform?: 'VEMTAP' | 'QRTHRIVE';
  type?: 'SUBSCRIPTION' | 'SMS' | 'COMMISSION' | 'EXPENSE' | 'REFUND';
}

// === Response DTOs ===

interface TransactionDto {
  id: string;
  type: string;
  platform: string;
  paymentMethod: string | null;
  amount: number;
  cost: number;
  profit: number;
  referenceId: string | null;
  date: string;
  businessId: string | null;
  businessName: string | null;
  agentId: string | null;
  agentName: string | null;
}

interface TransactionsListResponse {
  transactions: TransactionDto[];
  total: number;
}

interface RevenueAggregatesResponse {
  totalRevenue: number;
  subscriptionRevenue: number;
  smsRevenue: number;
  totalProfit: number;
  agentPayouts: number;
  totalTransactions: number;
}

interface RevenueTrendDto {
  date: string;
  revenue: number;
  profit: number;
}

interface MonthlyPlatformRevenueDto {
  month: string;
  total: number;
  vemtap: number;
  qrthrive: number;
}

interface RevenueByTypeDto {
  name: string;
  value: number;
}

interface RevenueChartDataResponse {
  monthlyPlatformRevenue: MonthlyPlatformRevenueDto[];
  revenueByType: RevenueByTypeDto[];
}

interface BusinessTransactionItemDto {
  id: string;
  date: string;
  amount: number;
  profit: number;
  type: string;
}

interface BusinessRevenueHistoryResponse {
  transactions: BusinessTransactionItemDto[];
}

interface BusinessStatsResponse {
  activeBusinesses: number;
  totalMrr: number;
  churnRate: number;
  churnedCount: number;
  totalBusinesses: number;
  bestSellingPlan: {
    plan: string;
    totalMrr: number;
    businessCount: number;
  } | null;
  planDistribution: {
    plan: string;
    count: number;
    totalMrr: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
  }[];
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
| type | `@IsEnum(FosTransactionType)` | Must be valid enum value |
| platform | `@IsEnum(FosPlatform)` | Must be valid enum value |
| businessId | `@IsUUID()` `@IsNotEmpty()` | Valid UUID v4 |
| agentId | `@IsString()` `@IsOptional()` | Free string |
| startDate | `@IsDateString()` | ISO 8601 date |
| endDate | `@IsDateString()` | ISO 8601 date |

---

## Rate Limiting

The API applies global rate limiting via `@nestjs/throttler`. Default: 10 requests per 60 seconds per IP. Configured via `THROTTLE_TTL` and `THROTTLE_LIMIT` environment variables.
