# Discovery Network API Documentation

## Overview

The **Discovery Network** module enables local branches to collaborate, refer customers, cross-promote, and view performance results. It provides detailed statistics on referrals sent/received, promotion conversion tracking (views, visits, revenue), and fine-grained business preferences.

All discovery endpoints require a valid JWT token representing a user with appropriate permissions and are scoped to the branch context.


---

## Authentication & Role Verification

Most endpoints are restricted to users with `OWNER` or `MANAGER` roles:
- **`OWNER`**: Can view all analytics, manage settings, and submit recommendations.
- **`MANAGER`**: Can view all analytics and submit recommendations. Cannot modify discovery network settings.
- **`CUSTOMER`**: Can submit portal visits (`POST /visitors/portal-visit`) with referral identifiers.

If a user tries to access stats or settings for a branch they do not have access to, a `403 ForbiddenException` is thrown:
```json
{
  "statusCode": 403,
  "timestamp": "2026-06-24T20:00:00.000Z",
  "path": "/api/v1/discovery/overview/branch-uuid",
  "method": "GET",
  "error": "Forbidden",
  "message": "You do not have access to this branch"
}
```

---

## Database Schema Changes

The discovery system introduces the following schema modifications:

### 1. `branches` Table
Added configuration toggles (all `NOT NULL` columns):
- `joinDiscoveryNetwork` (boolean, default: `true`): Determines whether the branch is visible to other local branches and customers on the network.
- `receivePartnerRequests` (boolean, default: `true`): Determines whether the branch allows other businesses to request partnerships.
- `allowPromotions` (boolean, default: `true`): Allows active promotions to be published to the network.
- `pushNotifications` (boolean, default: `true`): Toggles push alerts for discovery network updates.
- `smsAlerts` (boolean, default: `false`): Toggles SMS alerts.
- `emailSummary` (boolean, default: `true`): Toggles scheduled email summaries.

### 2. `catalogue_offers` Table
Added fields for promotion scheduling, categorization, and analytics tracking:
- `startDate` (timestamp, nullable): Start time of the promotion.
- `endDate` (timestamp, nullable): End time of the promotion.
- `offerType` (varchar, nullable): Type of offer (e.g., `'discount'`, `'free_item'`, `'special_deal'`, `'free_delivery'`, `'custom'`).
- `audience` (varchar, nullable): Target audience (e.g., `'nearby_customers'`, `'nearby_businesses'`, `'everyone_nearby'`).
- `views` (integer, default: `0`): Aggregate views (incremented when a customer opens the portal view via a referral link).
- `visits` (integer, default: `0`): Aggregate successful visits (redeemed check-ins/patronages).
- `revenue` (decimal(12,2), default: `0.00`): Direct revenue generated from the promotion.

### 3. `visits` Table
Added foreign keys to attribute customer acquisition sources:
- `referredByBranchId` (uuid, nullable, FK → `branches.id` ON DELETE `SET NULL`): The branch that referred the customer.
- `catalogueOfferId` (uuid, nullable, FK → `catalogue_offers.id` ON DELETE `SET NULL`): The specific promotion catalogue offer that drove the visit.

---

## Discovery Endpoints

### 1. GET /discovery/overview/:branchId
Returns high-level KPI cards, partner highlights, and recent customer visits driven by the Discovery Network.

- **Method:** `GET`
- **Path:** `/discovery/overview/:branchId`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Response Shape (200 OK):**
```typescript
interface DiscoveryOverviewResponse {
  stats: {
    peopleReached: number;      // Total views across all catalogue offers for this branch
    customersVisited: number;   // Total patronage visits referred by partner branches
    offersRedeemed: number;     // Total patronage visits with a valid catalogueOfferId
    revenueGenerated: number;   // Cumulative revenue from patronage visits referred by partners
  };
  highlights: {
    bestPromotion: {
      name: string;             // Name of the offer with the highest visits count
      visits: number;           // Total visits/redemptions for this offer
    };
    topPartner: {
      name: string;             // Business name of the top referring branch
      visits: number;           // Total visits referred by this partner
    };
  };
  recentVisits: Array<{
    name: string;               // Customer full name (or "Guest User" if anonymous/null)
    time: string;               // ISO Timestamp of the visit
    promo: string;              // Name of the promotion code applied (or "None")
  }>;
}
```
- **Example Response:**
```json
{
  "stats": {
    "peopleReached": 1250,
    "customersVisited": 84,
    "offersRedeemed": 45,
    "revenueGenerated": 6250.5
  },
  "highlights": {
    "bestPromotion": {
      "name": "2-for-1 Taco Tuesday",
      "visits": 35
    },
    "topPartner": {
      "name": "Lola's Fitness Studio",
      "visits": 18
    }
  },
  "recentVisits": [
    {
      "name": "Jane Doe",
      "time": "2026-06-24T18:30:00.000Z",
      "promo": "2-for-1 Taco Tuesday"
    },
    {
      "name": "John Smith",
      "time": "2026-06-24T17:15:00.000Z",
      "promo": "None"
    }
  ]
}
```

---

### 2. GET /discovery/results/:branchId
Returns chart-ready chronological timeline data (views vs. visits) and summary metrics within a specified date range.

- **Method:** `GET`
- **Path:** `/discovery/results/:branchId`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Query Parameters:**
  - `range` (string, optional, enum: `7days` | `month` | `year`, default: `7days`): Timeline aggregation interval.
    - `7days`: Aggregated daily for the last 7 days. Chart names returned as abbreviation day format (e.g. `'MON'`).
    - `month`: Aggregated daily for the last 30 days. Chart names returned as `'DD Mon'` format (e.g. `'24 Jun'`).
    - `year`: Aggregated monthly for the last 12 months. Chart names returned as `'Mon YYYY'` format (e.g. `'Jun 2026'`).
- **Response Shape (200 OK):**
```typescript
interface DiscoveryResultsResponse {
  stats: {
    peopleReached: number;      // Total views across all catalogue offers for this branch
    interested: number;         // Total clicks (portal/patronage visits with catalogueOfferId)
    visits: number;             // Total patronage visits referred by partners
    redeemed: number;           // Total patronage visits with a catalogueOfferId
    revenue: number;            // Total checkout amount referred by partners
  };
  timeline: Array<{
    name: string;               // Date label (e.g., "MON", "24 Jun", "Jun 2026")
    views: number;              // Total views (portal visits) in this period
    visits: number;             // Total visits (patronage visits) in this period
  }>;
}
```
- **Example Response:**
```json
{
  "stats": {
    "peopleReached": 550,
    "interested": 120,
    "visits": 48,
    "redeemed": 32,
    "revenue": 3400.0
  },
  "timeline": [
    { "name": "THU", "views": 12, "visits": 2 },
    { "name": "FRI", "views": 25, "visits": 8 },
    { "name": "SAT", "views": 40, "visits": 15 },
    { "name": "SUN", "views": 18, "visits": 6 }
  ]
}
```

---

### 3. GET /discovery/settings/:branchId
Fetches the current discovery, partner suggestions, and notification settings for a specific branch.

- **Method:** `GET`
- **Path:** `/discovery/settings/:branchId`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Response Shape (200 OK):**
```typescript
interface DiscoverySettingsResponse {
  id: string;                       // Branch UUID
  joinDiscoveryNetwork: boolean;    // Is branch active on the discovery map
  receivePartnerRequests: boolean;  // Accept incoming partner requests
  allowPromotions: boolean;         // Publish active deals
  pushNotifications: boolean;       // Enable push alerts
  smsAlerts: boolean;               // Enable SMS alerts
  emailSummary: boolean;            // Enable email summary reports
}
```
- **Example Response:**
```json
{
  "id": "b3fca219-5bb8-47fb-86ec-b172d7ee659b",
  "joinDiscoveryNetwork": true,
  "receivePartnerRequests": true,
  "allowPromotions": true,
  "pushNotifications": true,
  "smsAlerts": false,
  "emailSummary": true
}
```

---

### 4. PATCH /discovery/settings/:branchId
Updates discovery options, partner preferences, or notification templates.

- **Method:** `PATCH`
- **Path:** `/discovery/settings/:branchId`
- **Allowed Roles:** `OWNER` *(Only branch owners can modify these configurations)*
- **Request Body (UpdateDiscoverySettingsDto):**
  - All fields are optional.
```json
{
  "joinDiscoveryNetwork": true,
  "receivePartnerRequests": false,
  "allowPromotions": true,
  "pushNotifications": true,
  "smsAlerts": true,
  "emailSummary": false
}
```
- **Response Shape (200 OK):** Returns the fully updated branch object.
```json
{
  "id": "b3fca219-5bb8-47fb-86ec-b172d7ee659b",
  "name": "Main City Branch",
  "joinDiscoveryNetwork": true,
  "receivePartnerRequests": false,
  "allowPromotions": true,
  "pushNotifications": true,
  "smsAlerts": true,
  "emailSummary": false
}
```

---

### 5. GET /discovery/partners/:branchId
Lists the active partner branches (where partnership status is `'ACCEPTED'`) and shows the referral conversion statistics.

- **Method:** `GET`
- **Path:** `/discovery/partners/:branchId`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Response Shape (200 OK):**
```typescript
interface ActivePartnerResponse {
  id: string;               // Partnership record UUID
  partnerBranchId: string;  // Partner branch UUID
  name: string;             // Partner branch name
  businessName: string;     // Partner business name
  type: string;             // Category/Industry ID of the partner business (e.g. "Gym")
  sent: number;             // Total patronage referrals sent from us to this partner
  received: number;         // Total patronage referrals received from this partner to us
}
type ActivePartnersListResponse = ActivePartnerResponse[];
```
- **Example Response:**
```json
[
  {
    "id": "a9018c1b-12bc-34de-56fg-78hijklmnopq",
    "partnerBranchId": "87654321-4321-4321-4321-210987654321",
    "name": "Southside Gym",
    "businessName": "Pulse Fitness",
    "type": "Fitness",
    "sent": 12,
    "received": 25
  }
]
```

---

### 6. GET /discovery/customers/:branchId
Lists paginated, filtered customer visits that have a referral origin (sent to partners, received from partners, or direct).

- **Method:** `GET`
- **Path:** `/discovery/customers/:branchId`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Query Parameters (DiscoveryQueryDto):**
  - `page` (number, optional, default: `1`): The page index.
  - `limit` (number, optional, default: `10`): The page size.
  - `filter` (string, optional, enum: `all` | `from_partners` | `sent_to_partners` | `direct`, default: `all`):
    - `all`: Visits where the current branch is either the recipient branch or the referrer.
    - `from_partners`: Visits to our branch referred by other branches (`referredByBranchId` is NOT NULL and is not our ID).
    - `sent_to_partners`: Visits to other branches referred by our branch (`referredByBranchId` equals our ID).
    - `direct`: Visits to our branch that had no referral code/branch.
- **Response Shape (200 OK):**
```typescript
interface PaginatedDiscoveryCustomersResponse {
  data: Array<{
    id: string;                 // Visit UUID
    name: string;               // Customer full name (or "Guest User")
    phone: string;              // Customer phone number
    email: string;              // Customer email address
    origin: string;             // Label e.g., "From Partner: Barbershop", "Sent To: Southside Gym", "Direct Customer"
    date: string;               // ISO Date string
    promo: string;              // Applied Catalogue Offer Name (or "None")
    status: 'Purchased' | 'Visited'; // "Purchased" if visitType is 'patronage', otherwise "Visited"
  }>;
  total: number;
  page: number;
  limit: number;
}
```
- **Example Response:**
```json
{
  "data": [
    {
      "id": "e0e85a66-1c23-4567-89ab-cdef01234567",
      "name": "Jane Doe",
      "phone": "+2348012345678",
      "email": "jane@example.com",
      "origin": "From Partner: Pulse Fitness",
      "date": "2026-06-24T18:30:00.000Z",
      "promo": "10% Gym Referral Discount",
      "status": "Purchased"
    },
    {
      "id": "d0d85a66-1c23-4567-89ab-cdef01234567",
      "name": "Bob Vance",
      "phone": "+2348087654321",
      "email": "bob@vance.com",
      "origin": "Sent To: Southside Gym",
      "date": "2026-06-24T15:20:00.000Z",
      "promo": "None",
      "status": "Visited"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
```

---

### 7. POST /discovery/recommend/:branchId
Submits a recommendation for a complementary local business to join the VemTap platform.

- **Method:** `POST`
- **Path:** `/discovery/recommend/:branchId`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Request Body (RecommendBusinessDto):**
```typescript
interface RecommendBusinessDto {
  businessName: string;     // Required, Name of the business
  ownerName: string;        // Required, Owner name
  phone: string;            // Required, Owner phone number
  email: string;            // Required, Owner email address
  address?: string;         // Optional, Business address
  reason?: string;          // Optional, Explanation for recommendation
}
```
- **Response Shape (200 OK):**
```json
{
  "success": true,
  "message": "Recommendation submitted successfully",
  "data": {
    "businessName": "Joe's Barbershop",
    "ownerName": "Joe Smith",
    "phone": "+234 800 000 0000",
    "email": "joe@example.com",
    "address": "123 Main Street, Lagos",
    "reason": "Great local traffic, highly complementary to our gym."
  }
}
```

---

## Modified Endpoints & API Behaviors

### 1. POST /visitors/portal-visit
Records a new menu/portal visit for an authenticated customer. Modified to support referral attribution.

- **Method:** `POST`
- **Path:** `/visitors/portal-visit`
- **Allowed Roles:** `CUSTOMER`
- **Request Body:**
```typescript
interface RecordPortalVisitDto {
  deviceCode: string;               // Required
  sessionToken?: string;            // Optional (uuid-v4)
  referredByBranchId?: string;      // Optional (uuid-v4) - Attributing partner
  catalogueOfferId?: string;        // Optional (uuid-v4) - Triggering offer
}
```
- **Attribution Logic:**
  1. If `catalogueOfferId` is provided, the database retrieves the offer and atomically increments its `views` counter.
  2. If the user visits again within the **4-hour cooldown** window on the same device, the system returns the existing visit token and does NOT double-count views.
- **Response Shape (201 Created):**
```json
{
  "visitId": "2c9497e0-264d-45db-9c3f-eeea11342674",
  "sessionToken": "a823b2c1-2f3b-419b-a621-e0c29415df2e",
  "isNewVisit": true
}
```

---

### 2. PATCH /branches/:id
Updates branch information, including discovery preference toggles.

- **Method:** `PATCH`
- **Path:** `/branches/:id`
- **Allowed Roles:** `OWNER`
- **Request Body Fields Added:**
```json
{
  "joinDiscoveryNetwork": true,
  "receivePartnerRequests": true,
  "allowPromotions": true,
  "pushNotifications": true,
  "smsAlerts": false,
  "emailSummary": true
}
```

---

### 3. POST /catalogue/offers & PATCH /catalogue/offers/:id
Creates or updates catalogue offers. Allows managers to set scheduling parameters, offer types, and target audiences.

- **Method:** `POST` / `PATCH`
- **Path:** `/catalogue/offers` / `/catalogue/offers/:id`
- **Allowed Roles:** `OWNER`, `MANAGER`
- **Request Body Fields Added:**
```typescript
interface CreateCatalogueOfferDto {
  // ... existing fields ...
  startDate?: string;               // ISO date (e.g. "2026-06-01T00:00:00.000Z")
  endDate?: string;                 // ISO date (e.g. "2026-06-30T23:59:59.000Z")
  offerType?: string;               // Type (e.g. "discount", "free_item", "special_deal")
  audience?: string;                // Target (e.g. "nearby_customers", "everyone_nearby")
}
```

---

## Automatic Conversion and Referral Analytics

When a visit is converted to a purchase (patronage visit) using the checkout endpoint, the following logic occurs in the backend:
1. **Visit Attribution:** The patronage visit record gets populated with `referredByBranchId` and `catalogueOfferId` linked to the preceding portal-visit session.
2. **Atomic Counter Updates:**
   - Increments the offer's `visits` counter by 1.
   - Atomically increments the offer's `revenue` counter by the checkout's order `totalAmount`.

---

## Geo-Filtering Behavior Updates

1. **Nearby Branches Query (`GET /branches/nearby/:branchId`):**
   - Branches that have opted-out by setting `joinDiscoveryNetwork = false` are automatically excluded from the geo-search results.
2. **Partnership Suggestions Query (`GET /partnerships/nearby`):**
   - Branches that have set `joinDiscoveryNetwork = false` OR `receivePartnerRequests = false` are excluded from partner recommendation lists.
