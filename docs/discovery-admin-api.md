# Discovery Admin API Documentation

## Overview

The **Discovery Admin** module provides platform-wide oversight and management of the Discovery Network. These endpoints are restricted to users with the `ADMIN` role and expose aggregated KPIs, business/offer/referral management, fraud monitoring, notification delivery logs, audit trails, and global system configuration.

**Base URL:** `http://localhost:3002/api/v1` (local development)  
**Auth:** Bearer JWT token in the `Authorization` header  
**Role Required:** `ADMIN` (all endpoints in this document)  
**Swagger Docs:** `http://localhost:3002/api-docs`  
**Error Envelope:** `{ statusCode, timestamp, path, method, error, message }`

---

## Pagination Pattern

All paginated admin endpoints accept `page` and `limit` query parameters (defaults: `page=1`, `limit=10`) and return:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;    // Total matching records across all pages
    page: number;     // Current page number
    limit: number;    // Items per page
  };
}
```

---

## Endpoints

### 1. GET /discovery/admin/stats

Returns aggregated platform-wide Discovery Network KPI statistics.

**Method:** `GET`  
**Path:** `/discovery/admin/stats`  
**Query Parameters:** None  

**Response Shape (200 OK):**
```typescript
interface DiscoveryAdminStatsResponseDto {
  totalBusinesses: number;       // Total businesses on the platform
  activeOffers: number;          // Currently active catalogue offers
  scheduledOffers: number;       // Offers scheduled for future activation
  expiredOffers: number;         // Offers past their end date
  totalOfferViews: number;       // Aggregate views across all offers
  totalOfferClicks: number;      // Aggregate clicks across all offers
  referralsGenerated: number;    // Total referral visits created
  referralsCompleted: number;    // Referral visits with a purchase
  couponsRedeemed: number;       // Total coupon redemptions
  attributedSales: number;       // Sales attributed to the discovery network
  attributedRevenue: number;     // Revenue attributed to referrals
  sponsoredRevenue: number;      // Revenue from sponsored campaigns
  activePartnerships: number;    // Currently active B2B partnerships
  notificationsSent: number;     // Total notification deliveries
  avgConversionRate: number;     // Average referral-to-purchase conversion rate
}
```

**Example Response:**
```json
{
  "totalBusinesses": 245,
  "activeOffers": 89,
  "scheduledOffers": 12,
  "expiredOffers": 34,
  "totalOfferViews": 15800,
  "totalOfferClicks": 3200,
  "referralsGenerated": 1200,
  "referralsCompleted": 480,
  "couponsRedeemed": 215,
  "attributedSales": 680,
  "attributedRevenue": 2450000,
  "sponsoredRevenue": 890000,
  "activePartnerships": 67,
  "notificationsSent": 8900,
  "avgConversionRate": 14.5
}
```

---

### 2. GET /discovery/admin/businesses

Lists all businesses with their discovery metrics. Supports pagination and search.

**Method:** `GET`  
**Path:** `/discovery/admin/businesses`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Filters by business name/email

**Response Shape (200 OK):**
```typescript
interface DiscoveryAdminBusinessesResponseDto {
  data: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    category: string;
    city: string;
    activeOffers: number;
    referralsSent: number;
    referralsReceived: number;
    revenueGenerated: number;
    dateJoined: string;
    branches: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
    }>;
  }>;
  meta: { total: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "biz-uuid-1",
      "name": "Pulse Fitness",
      "email": "info@pulsefitness.com",
      "status": "active",
      "category": "Fitness",
      "city": "Abuja",
      "activeOffers": 3,
      "referralsSent": 45,
      "referralsReceived": 28,
      "revenueGenerated": 1250000,
      "dateJoined": "2025-01-15T00:00:00.000Z",
      "branches": [
        { "id": "br-uuid-1", "name": "Main Branch", "city": "Abuja", "state": "FCT" }
      ]
    }
  ],
  "meta": { "total": 1 }
}
```

---

### 3. GET /discovery/admin/businesses/:id

Returns detailed information about a single business, including its discovery metrics and branch list.

**Method:** `GET`  
**Path:** `/discovery/admin/businesses/:id`  
**Path Parameters:**
- `id` (string, required): Business UUID

**Response Shape (200 OK):**
```typescript
interface AdminBusinessDetailResponse {
  id: string;
  name: string;
  category: string;
  status: string;
  location: string;
  activeOffers: number;
  referralsSent: number;
  referralsReceived: number;
  revenueGenerated: number;     // Real sum of order amounts from referred visits
  dateJoined: Date;
  branches: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
  }>;
}
```

**Example Response:**
```json
{
  "id": "biz-uuid-1",
  "name": "Pulse Fitness",
  "category": "Fitness",
  "status": "active",
  "location": "Abuja",
  "activeOffers": 3,
  "referralsSent": 45,
  "referralsReceived": 28,
  "revenueGenerated": 1250000,
  "dateJoined": "2025-01-15T00:00:00.000Z",
  "branches": [
    { "id": "br-uuid-1", "name": "Main Branch", "city": "Abuja", "state": "FCT" }
  ]
}
```

---

### 4. GET /discovery/admin/offers

Lists all catalogue offers with pagination and optional filters.

**Method:** `GET`  
**Path:** `/discovery/admin/offers`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Filters by offer name or business name
- `status` (string, optional): Filter by offer status (e.g., `active`, `expired`)
- `category` (string, optional): Filter by offer type/category

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminOfferResponseDto> {
  data: Array<{
    id: string;
    name: string;
    business: string;
    businessId: string;
    category: string;
    status: string;
    startDate: string;
    endDate: string;
    views: number;
    clicks: number;
    visits: number;
    revenue: number;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "offer-uuid-1",
      "name": "Summer Discount 20%",
      "business": "Pulse Fitness",
      "businessId": "biz-uuid-1",
      "category": "discount",
      "status": "active",
      "startDate": "2026-06-01",
      "endDate": "2026-08-31",
      "views": 450,
      "clicks": 162,
      "visits": 55,
      "revenue": 275000
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 5. GET /discovery/admin/offers/:id

Returns a single offer with computed conversion funnel metrics and the top referral sources.

**Method:** `GET`  
**Path:** `/discovery/admin/offers/:id`  
**Path Parameters:**
- `id` (string, required): Offer UUID

**Response Shape (200 OK):**
```typescript
interface AdminOfferDetailResponseDto {
  id: string;
  name: string;
  business: string;
  businessId: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;           // Computed as Math.round(views * 0.36)
  visits: number;
  revenue: number;
  radius: string;
  minSpend: number;
  ctr: string;              // Click-through rate (clicks / views) as percentage
  conversion: string;       // Conversion rate (visits / clicks) as percentage
  topReferralSources: Array<{
    name: string;           // Referring branch/business name
    count: number;          // Number of referred visits
    growth: string;         // Growth indicator
  }>;
}
```

**Example Response:**
```json
{
  "id": "offer-uuid-1",
  "name": "Summer Discount 20%",
  "business": "Pulse Fitness",
  "businessId": "biz-uuid-1",
  "category": "discount",
  "status": "active",
  "startDate": "2026-06-01",
  "endDate": "2026-08-31",
  "views": 450,
  "clicks": 162,
  "visits": 55,
  "revenue": 275000,
  "radius": "500m",
  "minSpend": 0,
  "ctr": "36.0%",
  "conversion": "34.0%",
  "topReferralSources": [
    { "name": "Fashion Hub", "count": 185, "growth": "+12%" }
  ]
}
```

---

### 6. GET /discovery/admin/referrals

Lists all referral visits (visits with a non-null `referredByBranchId`) with pagination and filters.

**Method:** `GET`  
**Path:** `/discovery/admin/referrals`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Searches by customer, source, or target name
- `status` (string, optional): Filter by visit type (e.g., `patronage`)

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminReferralResponseDto> {
  data: Array<{
    id: string;
    customer: string;
    source: string;
    target: string;
    offer: string;
    status: string;
    revenue: number;
    date: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "visit-uuid-1",
      "customer": "Jane Doe",
      "source": "Pulse Fitness",
      "target": "The Grill House",
      "offer": "Summer Discount 20%",
      "status": "patronage",
      "revenue": 15000,
      "date": "2026-06-24 18:30"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 7. GET /discovery/admin/referrals/:id/investigate

Returns fraud investigation details for a specific referral, including evidence items and confidence scoring.

**Method:** `GET`  
**Path:** `/discovery/admin/referrals/:id/investigate`  
**Path Parameters:**
- `id` (string, required): Referral (Visit) UUID

**Response Shape (200 OK):**
```typescript
interface AdminReferralInvestigationResponseDto {
  id: string;
  status: string;          // e.g., "Flagged"
  confidence: string;      // e.g., "94%"
  reason: string;          // Reason for flagging
  customer: {
    name: string;
    id: string;
    history: string;
  };
  referral: {
    id: string;
    source: string;
    target: string;
    timestamp: string;
    offer: string;
  };
  evidence: Array<{
    label: string;
    val: string;
    conflict: boolean;
    note: string;
  }>;
}
```

**Example Response:**
```json
{
  "id": "visit-uuid-1",
  "status": "Flagged",
  "confidence": "94%",
  "reason": "Suspicious referral pattern detected",
  "customer": {
    "name": "Jane Doe",
    "id": "user-uuid-1",
    "history": "3 referrals in last 24 hours"
  },
  "referral": {
    "id": "visit-uuid-1",
    "source": "Pulse Fitness",
    "target": "The Grill House",
    "timestamp": "2026-06-24 18:30:00",
    "offer": "Summer Discount 20%"
  },
  "evidence": [
    { "label": "Device fingerprint", "val": "DV-9921-X", "conflict": true, "note": "Matches source business owner device" },
    { "label": "IP Address", "val": "192.168.1.45", "conflict": false, "note": "Local Abuja residential" },
    { "label": "Time to Redeem", "val": "12 seconds", "conflict": true, "note": "Humanly impossible travel time" }
  ]
}
```

---

### 8. GET /discovery/admin/partnerships

Lists all B2B partnerships with pagination and status filter.

**Method:** `GET`  
**Path:** `/discovery/admin/partnerships`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `status` (string, optional): Filter by partnership status

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminPartnershipResponseDto> {
  data: Array<{
    id: string;
    businessA: string;
    businessB: string;
    status: string;
    customersShared: number;
    revenueGenerated: number;
    dateCreated: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "partnership-uuid-1",
      "businessA": "Pulse Fitness",
      "businessB": "The Grill House",
      "status": "accepted",
      "customersShared": 45,
      "revenueGenerated": 675000,
      "dateCreated": "2026-01-15"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 9. GET /discovery/admin/sponsored

Lists all sponsored ad campaigns with pagination and status filter.

**Method:** `GET`  
**Path:** `/discovery/admin/sponsored`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `status` (string, optional): Filter by campaign status

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminSponsoredCampaignResponseDto> {
  data: Array<{
    id: string;
    business: string;
    name: string;
    radius: string;
    budget: number;
    spent: number;
    duration: string;
    status: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "campaign-uuid-1",
      "business": "Pulse Fitness",
      "name": "Grand Opening Ad",
      "radius": "5km",
      "budget": 100000,
      "spent": 45000,
      "duration": "30 Days",
      "status": "active",
      "impressions": 2500,
      "clicks": 380,
      "conversions": 45
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 10. GET /discovery/admin/sponsored/:id

Returns a single sponsored campaign with computed performance metrics (CTR, CPC), transaction history, and audit trail.

**Method:** `GET`  
**Path:** `/discovery/admin/sponsored/:id`  
**Path Parameters:**
- `id` (string, required): Campaign UUID

**Response Shape (200 OK):**
```typescript
interface AdminSponsoredCampaignDetailResponseDto {
  id: string;
  business: string;
  name: string;
  radius: string;
  budget: number;
  spent: number;
  duration: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: string;
  endDate: string;
  ctr: string;              // Click-through rate (clicks / impressions)
  cpc: string;              // Cost per click (spent / clicks) in NGN
  transactions: Array<{
    invoiceNo: string;
    date: string;
    type: string;
    amount: number;
    status: string;
  }>;
  auditLog: Array<{
    action: string;
    admin: string;
    time: string;
    detail: string;
  }>;
}
```

**Example Response:**
```json
{
  "id": "campaign-uuid-1",
  "business": "Pulse Fitness",
  "name": "Grand Opening Ad",
  "radius": "5km",
  "budget": 100000,
  "spent": 45000,
  "duration": "30 Days",
  "status": "active",
  "impressions": 2500,
  "clicks": 380,
  "conversions": 45,
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "ctr": "15.2%",
  "cpc": "₦118.42",
  "transactions": [
    { "invoiceNo": "INV-C-001", "date": "2026-06-01", "type": "Budget Allocation", "amount": 100000, "status": "completed" }
  ],
  "auditLog": [
    { "action": "Campaign Approved", "admin": "Admin", "time": "2026-06-01T00:00:00.000Z", "detail": "Initial activation" }
  ]
}
```

---

### 11. GET /discovery/admin/billing

Lists invoices and payment transactions with pagination and optional status/type filters.

**Method:** `GET`  
**Path:** `/discovery/admin/billing`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `status` (string, optional): Filter by invoice status
- `type` (string, optional): Filter by transaction type

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminBillingResponseDto> {
  data: Array<{
    id: string;
    business: string;
    amount: number;
    type: string;
    method: string;
    status: string;
    date: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "invoice-uuid-1",
      "business": "Pulse Fitness",
      "amount": 50000,
      "type": "subscription",
      "method": "card",
      "status": "paid",
      "date": "2026-06-01"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 12. GET /discovery/admin/billing/:id

Returns an invoice detail with line items.

**Method:** `GET`  
**Path:** `/discovery/admin/billing/:id`  
**Path Parameters:**
- `id` (string, required): Invoice UUID

**Response Shape (200 OK):**
```typescript
interface AdminBillingDetailResponseDto {
  id: string;
  business: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  date: string;
  description: string;
  items: Array<{
    desc: string;
    qty: number;
    price: number;
  }>;
  tax: number;
  total: number;
}
```

**Example Response:**
```json
{
  "id": "invoice-uuid-1",
  "business": "Pulse Fitness",
  "amount": 50000,
  "type": "subscription",
  "method": "card",
  "status": "paid",
  "date": "2026-06-01",
  "description": "Monthly Premium Plan",
  "items": [
    { "desc": "Premium Subscription", "qty": 1, "price": 45000 },
    { "desc": "Sponsored Campaign Fee", "qty": 1, "price": 5000 }
  ],
  "tax": 0,
  "total": 50000
}
```

---

### 13. GET /discovery/admin/attribution

Returns attribution paths (top flows from source to target branches), the attribution window setting, and aggregate metrics.

**Method:** `GET`  
**Path:** `/discovery/admin/attribution`  
**Query Parameters:** None

**Response Shape (200 OK):**
```typescript
interface AdminAttributionResponseDto {
  paths: Array<{
    from: string;
    to: string;
    flow: number;        // Number of referred visits on this path
    conversion: string;
    revenue: string;
  }>;
  window: number;        // Attribution window in hours
  metrics: {
    attributedVisits: number;
    attributedPurchases: number;
    attributedRevenue: string;
    avgAttributionTime: string;
  };
}
```

**Example Response:**
```json
{
  "paths": [
    { "from": "Pulse Fitness", "to": "The Grill House", "flow": 45, "conversion": "12%", "revenue": "₦650k" }
  ],
  "window": 24,
  "metrics": {
    "attributedVisits": 1200,
    "attributedPurchases": 480,
    "attributedRevenue": "₦2,450,000",
    "avgAttributionTime": "18m"
  }
}
```

---

### 14. GET /discovery/admin/customers

Lists all customers across the platform with pagination, search, and status filter.

**Method:** `GET`  
**Path:** `/discovery/admin/customers`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Filters by first name, last name, or email
- `status` (string, optional): Filter by user status

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminCustomerResponseDto> {
  data: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    totalReferrals: number;
    redeemedOffers: number;
    lastActive: string;
    preferences: string[];
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "name": "Jane Doe",
      "location": "Abuja, Nigeria",
      "status": "Active",
      "totalReferrals": 0,
      "redeemedOffers": 0,
      "lastActive": "2026-06-24 18:30",
      "preferences": []
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 15. GET /discovery/admin/customers/:id

Returns a customer profile with detailed stats and an activity timeline of recent visits.

**Method:** `GET`  
**Path:** `/discovery/admin/customers/:id`  
**Path Parameters:**
- `id` (string, required): Customer (User) UUID

**Response Shape (200 OK):**
```typescript
interface AdminCustomerDetailResponseDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  optInDate: string;
  status: string;
  totalReferrals: number;
  redeemedOffers: number;
  lastActive: string;
  preferences: string[];
  stats: {
    totalVisits: number;
    offersReceived: number;
    offersRedeemed: number;
    totalReferrals: number;
    totalSpend: number;
  };
  activityTimeline: Array<{
    action: string;
    via: string;
    time: string;
    val: string | null;
  }>;
}
```

**Example Response:**
```json
{
  "id": "user-uuid-1",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+234 800 000 0000",
  "location": "Abuja, Nigeria",
  "optInDate": "2025-06-01",
  "status": "Active",
  "totalReferrals": 0,
  "redeemedOffers": 0,
  "lastActive": "2026-06-24 18:30",
  "preferences": [],
  "stats": {
    "totalVisits": 5,
    "offersReceived": 0,
    "offersRedeemed": 0,
    "totalReferrals": 0,
    "totalSpend": 0
  },
  "activityTimeline": [
    { "action": "Purchased at", "via": "The Grill House", "time": "2026-06-24 18:30", "val": null }
  ]
}
```

---

### 16. GET /discovery/admin/locations

Lists all districts/cities with performance metrics. Data is aggregated from branches grouped by city.

**Method:** `GET`  
**Path:** `/discovery/admin/locations`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Filters by city name

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminLocationResponseDto> {
  data: Array<{
    id: string;
    name: string;
    businesses: number;
    offers: number;
    referrals: number;
    revenue: number;       // Real sum of order amounts from referred visits in this city
    growth: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Abuja",
      "businesses": 45,
      "offers": 120,
      "referrals": 380,
      "revenue": 4850000,
      "growth": "0%"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 17. GET /discovery/admin/locations/:id

Returns a specific location's detail with density and conversion rate information.

**Method:** `GET`  
**Path:** `/discovery/admin/locations/:id`  
**Path Parameters:**
- `id` (string, required): Location ID (1-based index from the list)

**Response Shape (200 OK):**
```typescript
interface AdminLocationDetailResponseDto {
  id: string;
  name: string;
  businesses: number;
  offers: number;
  referrals: number;
  revenue: number;
  growth: string;
  city: string;
  density: string;
  conversionRate: string;
}
```

**Example Response:**
```json
{
  "id": "1",
  "name": "Abuja",
  "businesses": 45,
  "offers": 120,
  "referrals": 380,
  "revenue": 4850000,
  "growth": "0%",
  "city": "Abuja",
  "density": "12.4 biz/km²",
  "conversionRate": "14.2%"
}
```

---

### 18. GET /discovery/admin/categories

Lists all offer categories (grouped by `business.categoryId`) with aggregate conversion data.

**Method:** `GET`  
**Path:** `/discovery/admin/categories`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Filters by category ID

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminCategoryResponseDto> {
  data: Array<{
    id: string;
    name: string;
    referrals: number;       // Actual referral count for this category
    conversion: string;      // Referrals per business ratio as percentage
    revenue: number;         // Actual revenue from referred visits in this category
    topOffer: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "fitness",
      "name": "fitness",
      "referrals": 85,
      "conversion": "8.5%",
      "revenue": 1250000,
      "topOffer": "Featured Promotion"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 10 }
}
```

---

### 19. GET /discovery/admin/categories/:id

Returns a single category detail with additional metrics: total businesses, active offers, average ticket size, and penetration rate.

**Method:** `GET`  
**Path:** `/discovery/admin/categories/:id`  
**Path Parameters:**
- `id` (string, required): Category ID (e.g., `fitness`, `restaurant`)

**Response Shape (200 OK):**
```typescript
interface AdminCategoryDetailResponseDto {
  id: string;
  name: string;
  referrals: number;
  conversion: string;
  revenue: number;
  topOffer: string;
  totalBusinesses: number;
  activeOffers: number;
  avgTicketSize: string;     // Revenue per referral
  penetration: string;       // Offers per business ratio
}
```

**Example Response:**
```json
{
  "id": "fitness",
  "name": "fitness",
  "referrals": 85,
  "conversion": "8.5%",
  "revenue": 1250000,
  "topOffer": "Featured Promotion",
  "totalBusinesses": 12,
  "activeOffers": 35,
  "avgTicketSize": "₦14,706",
  "penetration": "291.7%"
}
```

---

### 20. GET /discovery/admin/category-types

Lists offer category types (predefined offer classifications like "Discounts", "Free Items").

**Method:** `GET`  
**Path:** `/discovery/admin/category-types`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminCategoryType> {
  data: Array<{
    id: string;
    name: string;
    desc: string;
    count: number;
    status: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "ct-uuid-1",
      "name": "Discounts",
      "desc": "Percentage or flat amount off purchase.",
      "count": 45,
      "status": "active"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 21. POST /discovery/admin/category-types

Creates a new offer category type.

**Method:** `POST`  
**Path:** `/discovery/admin/category-types`  
**Request Body:**
```json
{
  "name": "Bundle Deals",
  "description": "Combined offers with multiple items/services.",
  "status": "active"
}
```
- `name` (string, required): Unique name for the category type
- `description` (string, optional): Description of what this category type represents
- `status` (enum, optional, default: `active`): `active` or `inactive`

**Response Shape (201 Created):** Returns the created entity.

---

### 22. PATCH /discovery/admin/category-types/:id

Updates an existing offer category type.

**Method:** `PATCH`  
**Path:** `/discovery/admin/category-types/:id`  
**Path Parameters:**
- `id` (string, required): Category Type UUID

**Request Body:** All fields are optional.
```json
{
  "name": "Seasonal Deals",
  "status": "inactive"
}
```

**Response Shape (200 OK):** Returns the updated entity.

---

### 23. DELETE /discovery/admin/category-types/:id

Soft-deletes an offer category type.

**Method:** `DELETE`  
**Path:** `/discovery/admin/category-types/:id`  
**Path Parameters:**
- `id` (string, required): Category Type UUID

**Response Shape (200 OK):**
```json
{ "success": true }
```

---

### 24. GET /discovery/admin/fraud

Returns the fraud dashboard with a security score, active alerts, fraud prevented value, and paginated alert list.

**Method:** `GET`  
**Path:** `/discovery/admin/fraud`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `status` (string, optional): Filter by alert status
- `severity` (string, optional): Filter by severity level

**Response Shape (200 OK):**
```typescript
interface AdminFraudDashboardDto {
  securityScore: string;           // Overall security rating (e.g., "98.2")
  activeAlerts: number;            // Count of FLAGGED alerts
  fraudPrevented: string;          // Estimated fraud prevented in NGN
  suspiciousUsers: number;         // Count of suspicious users under review
  alerts: Array<{
    id: string;
    type: string;
    business: string;
    customer: string;
    severity: string;              // e.g., "high", "medium", "low"
    confidence: string;            // Confidence percentage
    status: string;
    date: string;
    reason: string;
  }>;
}
```

**Example Response:**
```json
{
  "securityScore": "98.2",
  "activeAlerts": 3,
  "fraudPrevented": "₦45,000",
  "suspiciousUsers": 3,
  "alerts": [
    {
      "id": "alert-uuid-1",
      "type": "duplicate_referral",
      "business": "Pulse Fitness",
      "customer": "Jane Doe",
      "severity": "high",
      "confidence": "94%",
      "status": "flagged",
      "date": "2026-06-24 18:30",
      "reason": "Suspicious activity detected"
    }
  ]
}
```

---

### 25. GET /discovery/admin/notifications

Lists the notification delivery log with pagination and optional channel filter.

**Method:** `GET`  
**Path:** `/discovery/admin/notifications`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `channel` (string, optional): Filter by notification channel

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminNotificationResponseDto> {
  data: Array<{
    id: string;
    recipient: string;
    business: string;
    channel: string;          // e.g., "push", "sms", "email"
    status: string;           // Delivery status
    openStatus: string;       // Read/open status (e.g., "Opened", "Unopened", "N/A")
    date: string;
    content: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "log-uuid-1",
      "recipient": "Jane Doe",
      "business": "Pulse Fitness",
      "channel": "push",
      "status": "delivered",
      "openStatus": "Opened",
      "date": "2026-06-24 18:30",
      "content": "Your offer from Pulse Fitness is now active!"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 26. GET /discovery/admin/reports

Lists previously generated reports with their status and metadata.

**Method:** `GET`  
**Path:** `/discovery/admin/reports`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminReportResponseDto> {
  data: Array<{
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;          // e.g., "processing", "completed", "failed"
    size: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "rpt-uuid-1",
      "name": "Monthly Network Performance",
      "type": "Full Summary",
      "date": "2026-06-01",
      "status": "completed",
      "size": "2.4 MB"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 27. POST /discovery/admin/reports/generate

Generates a new report. The report is created with `PROCESSING` status and linked to the requesting admin.

**Method:** `POST`  
**Path:** `/discovery/admin/reports/generate`  
**Request Body:**
```json
{
  "name": "Monthly Network Performance",
  "type": "Full Summary",
  "dateRange": "Last 30 Days"
}
```
- `name` (string, required): Report name
- `type` (string, required): Report type (e.g., `"Full Summary"`, `"Referral Analysis"`)
- `dateRange` (string, optional): Date range description

**Response Shape (201 Created):** Returns the created report entity with `generatedBy` set to the requesting admin.

---

### 28. GET /discovery/admin/audit-logs

Returns the immutable audit trail with pagination, search, and date filter.

**Method:** `GET`  
**Path:** `/discovery/admin/audit-logs`  
**Query Parameters:**
- `page` (number, optional, default: `1`)
- `limit` (number, optional, default: `10`)
- `search` (string, optional): Searches by admin name, endpoint, or module
- `date` (string, optional, format: YYYY-MM-DD): Filters logs created on this date

**Response Shape (200 OK):**
```typescript
interface PaginatedResponse<AdminAuditLogResponseDto> {
  data: Array<{
    id: string;
    admin: string;
    action: string;           // HTTP method
    target: string;           // Endpoint path
    business: string;
    status: string;           // "Success" or "Warning"
    date: string;
    ip: string;
  }>;
  meta: { total: number; page: number; limit: number };
}
```

**Example Response:**
```json
{
  "data": [
    {
      "id": "log-a1b2c3d4",
      "admin": "Admin User",
      "action": "PATCH",
      "target": "/admin/settings",
      "business": "biz-uuid-1",
      "status": "Success",
      "date": "2026-06-24 18:30",
      "ip": "192.168.1.100"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

### 29. GET /discovery/admin/audit-logs/:id

Returns a single audit log entry with before/after change comparison.

**Method:** `GET`  
**Path:** `/discovery/admin/audit-logs/:id`  
**Path Parameters:**
- `id` (string, required): Audit Log UUID

**Response Shape (200 OK):**
```typescript
interface AdminAuditLogDetailResponseDto {
  id: string;
  admin: string;
  action: string;
  target: string;
  business: string;
  status: string;
  date: string;
  ip: string;
  module: string;
  device: string;
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}
```

**Example Response:**
```json
{
  "id": "log-a1b2c3d4",
  "admin": "Admin User",
  "action": "PATCH",
  "target": "/admin/settings",
  "business": "biz-uuid-1",
  "status": "Success",
  "date": "2026-06-24 18:30",
  "ip": "192.168.1.100",
  "module": "Settings",
  "device": "Mozilla/5.0...",
  "changes": {
    "before": { "enableNetwork": false },
    "after": { "status": "Updated" }
  }
}
```

---

### 30. GET /discovery/admin/settings

Returns the global Discovery Network system configuration.

**Method:** `GET`  
**Path:** `/discovery/admin/settings`  
**Query Parameters:** None

**Response Shape (200 OK):**
```typescript
interface AdminSettingResponseDto {
  enableNetwork: boolean;         // Enable discovery network globally
  enableSponsored: boolean;       // Enable sponsored campaigns
  enablePartnerships: boolean;    // Enable B2B partnerships
  maxOffersPerVisit: number;      // Max offers shown per visit
  maxOffersPerDay: number;        // Max offers shown per day per user
  defaultRadius: number;          // Default discovery radius in meters
  maxRadius: number;              // Maximum allowed radius in meters
  attributionWindow: number;      // Attribution window in hours
  pushEnabled: boolean;           // Enable push notifications for discovery
  smsEnabled: boolean;            // Enable SMS for discovery
  emailEnabled: boolean;          // Enable email for discovery
  approvalRequired: boolean;      // Require admin approval for changes
}
```

**Example Response:**
```json
{
  "enableNetwork": true,
  "enableSponsored": true,
  "enablePartnerships": true,
  "maxOffersPerVisit": 3,
  "maxOffersPerDay": 5,
  "defaultRadius": 500,
  "maxRadius": 2000,
  "attributionWindow": 24,
  "pushEnabled": true,
  "smsEnabled": false,
  "emailEnabled": true,
  "approvalRequired": true
}
```

---

### 31. PATCH /discovery/admin/settings

Updates the global Discovery Network system configuration. Only provided fields are updated; omitted fields retain their existing values.

**Method:** `PATCH`  
**Path:** `/discovery/admin/settings`  
**Request Body (UpdateDiscoveryAdminSettingsDto):** All fields are optional.
```json
{
  "enableNetwork": true,
  "pushEnabled": true,
  "maxOffersPerVisit": 5
}
```

**Response Shape (200 OK):**
```json
{
  "success": true,
  ...dto   // Echoes back the fields that were sent
}
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
Returned when the user does not have the `ADMIN` role.
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Business with ID invalid-id not found",
  "error": "Not Found"
}
```

### Validation Error (400 Bad Request)
```json
{
  "statusCode": 400,
  "message": [
    "enableNetwork must be a boolean value",
    "maxOffersPerVisit must not be less than 0"
  ],
  "error": "Bad Request"
}
```
