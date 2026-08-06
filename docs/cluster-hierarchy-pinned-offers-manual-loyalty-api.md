# Backend Updates — Cluster Hierarchy, Pinned Cluster Deals & Manual Points Award

> **Audience:** Frontend team. This document covers the backend additions made to close the
> cluster-hierarchy / QR-deals and manual loyalty-award gaps. It describes each new/changed
> endpoint, request/response shapes (with TypeScript interfaces), and behavior notes so the
> frontend can wire up against the real API.

Related docs:
- [`cluster-qr-discovery-api.md`](./cluster-qr-discovery-api.md) — the existing cluster QR discovery feature (public endpoints, admin CRUD, fair rotation).

---

## 0. What changed at a glance

| # | Feature | Endpoints |
| --- | --- | --- |
| 1 | **Cluster hierarchy & type** | `GET /admin/clusters`, `GET /admin/clusters/:id` (return new fields); `POST /admin/clusters`, `PATCH /admin/clusters/:id` (accept new fields) |
| 2 | **Cluster deals: auto-match + pin/unpin** | `GET /admin/clusters/:id/offers`, `PATCH /admin/clusters/:id/offers/:offerId` |
| 3 | **Manual points award** | `POST /loyalty/earn/manual` |

---

## 1. Base URL, Auth, Errors

```
Base URL (local):    http://localhost:3002/api/v1
Base URL (prod):     https://<api-host>/api/v1
Swagger:             http://localhost:3002/api-docs
```

| Endpoint group | Auth |
| --- | --- |
| `/admin/clusters/*` | `Authorization: Bearer <jwt>` where `user.role === 'Admin'` |
| `/loyalty/earn/manual` | `Authorization: Bearer <jwt>` where `user.role === 'Owner' \|\| 'Manager'` |

Global error envelope (from `AllExceptionsFilter`):

```json
{
  "statusCode": 404,
  "timestamp": "2026-08-06T12:00:00.000Z",
  "path": "/api/v1/admin/clusters/cl-123/offers",
  "method": "GET",
  "error": "Not Found",
  "message": "Cluster not found"
}
```

---

## 2. Cluster hierarchy & type

### 2.1 Concept

A cluster now belongs to a **hierarchy level** and can optionally point at a **parent cluster**,
forming a tree the admin UI can render (e.g. *Nigeria (country) → FCT (state) → Abuja (city) →
Banex Market (market)*).

Two mechanisms are available:

1. **Structural hierarchy** — `type` + `parentId` build the tree itself (a `country` cluster is the
   parent of a `state` cluster, etc.).
2. **Location metadata** — every cluster also carries free-text `country` / `state` / `city` /
   `area` strings for display/filtering.

> This is **metadata-only**: hierarchy fields do **not** change deal computation or auto-assignment.

### 2.2 The `ClusterType` enum

```
'country' | 'state' | 'market' | 'building' | 'custom'
```

`market` is the default when a cluster is created without an explicit `type`.

### 2.3 TypeScript interfaces

```ts
export type ClusterType =
  | 'country'
  | 'state'
  | 'market'
  | 'building'
  | 'custom';

// Summary object returned inside GET /admin/clusters/:id
export interface ClusterParentSummary {
  id: string;
  name: string;
  type: ClusterType;
}

// Item shape returned by GET /admin/clusters
export interface AdminClusterListItem {
  id: string;
  name: string;
  type: ClusterType;
  parentId: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
  uniqueCode: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  isActive: boolean;
  qrIsActive: boolean;
  branchCount: number;
  activeOfferCount: number;
  scanCount: number;
  createdAt: string;
}

// Shape returned by GET /admin/clusters/:id
export interface AdminClusterDetail extends AdminClusterListItem {
  updatedAt: string;
  qrUrl: string;
  parent: ClusterParentSummary | null;
  branches: Array<{
    id: string;
    name: string;
    uniqueCode: string;
    username: string | null;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    isActive: boolean;
  }>;
}
```

### 2.4 Endpoints

#### `GET /api/v1/admin/clusters`

Returns a **flat** list (build the tree client-side by grouping on `parentId` / `type`).

**Query params** (all optional):

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | number | 1 | |
| `limit` | number | 20 | max 100 |
| `search` | string | — | name `ILIKE` filter |

**Response `200`**

```json
{
  "data": [
    {
      "id": "3f9a...",
      "name": "Banex Market",
      "type": "market",
      "parentId": "ab12...",
      "country": "Nigeria",
      "state": "FCT",
      "city": "Abuja",
      "area": "Banex",
      "uniqueCode": "CL-9XZ7KL2PQ",
      "description": "Market deals around Banex Plaza",
      "latitude": 9.0489,
      "longitude": 7.4894,
      "radiusMeters": 500,
      "isActive": true,
      "qrIsActive": true,
      "branchCount": 3,
      "activeOfferCount": 12,
      "scanCount": 1042,
      "createdAt": "2026-08-06T10:00:00.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20 }
}
```

#### `GET /api/v1/admin/clusters/:id`

Cluster detail + member branches + parent summary.

**Response `200`** — see `AdminClusterDetail` above; example:

```json
{
  "id": "3f9a...",
  "name": "Banex Market",
  "type": "market",
  "parentId": "ab12...",
  "parent": { "id": "ab12...", "name": "Abuja", "type": "city" },
  "country": "Nigeria",
  "state": "FCT",
  "city": "Abuja",
  "area": "Banex",
  "uniqueCode": "CL-9XZ7KL2PQ",
  "description": null,
  "latitude": 9.0489,
  "longitude": 7.4894,
  "radiusMeters": 500,
  "isActive": true,
  "qrIsActive": true,
  "scanCount": 1042,
  "createdAt": "2026-08-06T10:00:00.000Z",
  "updatedAt": "2026-08-06T10:05:00.000Z",
  "qrUrl": "https://vemtap.com/c/CL-9XZ7KL2PQ",
  "branches": [
    {
      "id": "b5b2...",
      "name": "Banex Plaza Branch",
      "uniqueCode": "BR123XYZ",
      "username": "banex-plaza",
      "logoUrl": "https://cdn.example.com/logo.png",
      "address": "Plot 12, Banex Plaza",
      "city": "Abuja",
      "state": "FCT",
      "isActive": true
    }
  ]
}
```

**Errors:** `404` — cluster not found.

#### `POST /api/v1/admin/clusters` — create

All previous fields plus the new optional hierarchy fields. `latitude` and `longitude` remain **required**.

```json
{
  "name": "Banex Market",
  "type": "market",
  "parentId": "ab12-...-abuja-city",
  "country": "Nigeria",
  "state": "FCT",
  "city": "Abuja",
  "area": "Banex",
  "description": "Market deals around Banex Plaza",
  "latitude": 9.0489,
  "longitude": 7.4894,
  "radiusMeters": 500,
  "isActive": true,
  "qrIsActive": true
}
```

- `type` defaults to `'market'` when omitted.
- If `parentId` is provided, it **must** reference an existing cluster, otherwise `404 Parent cluster not found`.

**Response `201`** — same shape as `GET /admin/clusters/:id`.

#### `PATCH /api/v1/admin/clusters/:id` — update

Partial update; all fields optional. New optional fields:

| Field | Type | Notes |
| --- | --- | --- |
| `type` | `ClusterType` | Change hierarchy level |
| `parentId` | string (UUID) \| null | Reparent. `400` if set to the cluster's own `id`; `404` if the parent doesn't exist |
| `country` / `state` / `city` / `area` | string \| null | Free-text location metadata |

Existing update behavior is unchanged (`qrIsActive` toggle, etc.).

**Response `200`** — same shape as `GET /admin/clusters/:id`.

---

## 3. Cluster deals — auto-match + pin/unpin

### 3.1 Concept

The public deals feed (`GET /clusters/:uniqueCode/deals`) is fed by offers that **auto-match** a
cluster — active offers from its member branches that have opted into the discovery network.

Admins can now **pin** offers to a cluster. Pinned offers:

- always appear in the public deals feed, and
- are **ranked first** (oldest pin first), regardless of the active sort (`fair`, `newest`,
  `price_asc`, `distance_asc`, …).

Pinning is stored per cluster+offer (`cluster_offers` table). Unpinning removes the pin; the offer
then behaves like any other auto-matched offer again.

### 3.2 TypeScript interfaces

```ts
export interface ClusterDeal {
  id: string;
  name: string;
  description: string | null;
  longDescription: string | null;
  terms: string[];
  pricingType: string;
  discountValue: number | null;
  fixedPrice: number | null;
  calculatedPrice: number;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  mainImage: string | null;
  galleryImages: string[];
  startDate: string | null;
  endDate: string | null;
  isExpired: boolean;
  isTrending: boolean;
  claimedCount: number;
  maxClaims: number | null;
  remainingLimit: number | null;
  status: string;
  views: number;
  offerType: string | null;
  audience: string | null;
  audienceTarget: string | null;
  maxClaimsPerCustomer: number | null;
  claimCodePrefix: string | null;
  branchId: string;
  businessId: string;
  distanceMeters: number | null;
  branch: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
  business: { id: string; name: string; logoUrl: string | null } | null;
}

// Pinned entries include when they were pinned
export interface PinnedClusterDeal extends ClusterDeal {
  pinnedAt: string | null;
}

export interface ClusterOffersResponse {
  autoMatched: ClusterDeal[];
  pinned: PinnedClusterDeal[];
  total: number; // length of autoMatched
}
```

### 3.3 Endpoints

#### `GET /api/v1/admin/clusters/:id/offers`

Lists the offers available to this cluster.

**Query params** (all optional — mirror the public feed filters):

| Param | Type | Notes |
| --- | --- | --- |
| `search` | string | Filters by offer/business name (case-insensitive) |
| `categoryId` | string (UUID) | Filters by the business category |

**Behavior**

- `autoMatched` — every currently qualifying offer (active, not expired, from an active member
  branch with discovery opt-in), matching optional filters.
- `pinned` — offers explicitly pinned to this cluster (shown even if they no longer qualify as
  "active", e.g. a pinned offer whose branch left the cluster), each with `pinnedAt`.
- `total` — `autoMatched.length`.

**Response `200`**

```json
{
  "autoMatched": [
    {
      "id": "off-1",
      "name": "2-for-1 Jollof",
      "calculatedPrice": 1500,
      "originalPrice": 3000,
      "discountPercent": 50,
      "branch": { "id": "b1", "name": "Banex Plaza Branch", "slug": "banex-plaza" },
      "business": { "id": "biz-1", "name": "The Gourmet Hub" }
    }
  ],
  "pinned": [
    {
      "id": "off-9",
      "name": "Weekend Brunch Deal",
      "calculatedPrice": 4500,
      "originalPrice": 6000,
      "discountPercent": 25,
      "branch": { "id": "b2", "name": "Area 11 Branch", "slug": "area-11" },
      "business": { "id": "biz-2", "name": "Cafe Nova" },
      "pinnedAt": "2026-08-06T09:30:00.000Z"
    }
  ],
  "total": 1
}
```

**Errors:** `404` — cluster not found.

#### `PATCH /api/v1/admin/clusters/:id/offers/:offerId`

Pins or unpins an offer for the cluster.

**Body**

```json
{ "pinned": true }
```

`pinned` is required and must be a boolean.

**Behavior**

- `pinned: true` → creates/updates the pin (records `pinnedBy` = acting admin and `pinnedAt`).
- `pinned: false` → removes the pin entirely.
- Invalidates the cluster's public deal cache so the change is reflected immediately.

**Response `200`**

```json
{
  "pinned": true,
  "offerId": "off-9",
  "clusterId": "3f9a-...-banex"
}
```

**Errors:**

- `404` — cluster not found / offer not found.
- `400` — `pinned` missing or not a boolean.

> **Frontend tip:** to render the Deals modal, call `GET /admin/clusters/:id/offers` and let the
> user pin/unpin from either the `autoMatched` or `pinned` list. Pinning an offer that isn't in
> `autoMatched` (e.g. already inactive) is allowed — it will show under `pinned`.

---

## 4. Manual points award — `POST /loyalty/earn/manual`

### 4.1 Concept

The existing public `POST /loyalty/earn` flow only supports **visit-based** earning and rejects
manual grants (`The public earn flow only supports visit-based earning`). The "Give Points" page
(`/dashboard/loyalty/award`) needs to award a **specific point amount** to selected customers.
This new endpoint provides that, scoped to a branch and restricted to Owners/Managers.

- A "loyalty profile" is the customer **user** record — pass the customer's `userId` (same id used
  by `CustomerSelector`).
- The award **bypasses** the branch's loyalty rule (it is an explicit owner/manager grant).
- `awardedBy` defaults to the authenticated caller when omitted.

### 4.2 Endpoint

```
POST /api/v1/loyalty/earn/manual?branchId={branchId}
```

**Auth:** `Bearer` token, `user.role` ∈ `Owner | Manager`.

**Request body**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `userId` | string (UUID) | **Yes** | Loyalty profile (customer user) to credit |
| `points` | number | **Yes** | Points to award — must be > 0 |
| `source` | `'manual_award' \| 'promotion' \| 'compensation'` | No | Defaults to `manual_award` |
| `rewardId` | string (UUID) | No | Related reward program ID (stored as audit reference) |
| `awardedBy` | string (UUID) | No | Staff member performing the award (defaults to caller) |
| `notes` | string | No | Audit trail note |

**Example request**

```json
{
  "userId": "9b1d2c5e-...",
  "points": 500,
  "source": "promotion",
  "rewardId": "rwd-...",
  "notes": "Store anniversary reward"
}
```

**Response `201`**

```json
{
  "success": true,
  "pointsEarned": 500,
  "newBalance": 1500,
  "message": "500 points awarded successfully",
  "transactionId": "txn-8c3f..."
}
```

**Errors**

| Status | When |
| --- | --- |
| `400` | Invalid `points` (missing / ≤ 0 / not a number) or invalid `userId` |
| `401` | Missing/invalid token |
| `403` | Authenticated but not `Owner`/`Manager`, **or** caller has no access to the branch |
| `404` | Branch not found, or customer loyalty profile not found |

**TypeScript interface**

```ts
export interface ManualEarnPointsRequest {
  userId: string;
  points: number;
  source?: 'manual_award' | 'promotion' | 'compensation';
  rewardId?: string;
  awardedBy?: string;
  notes?: string;
}

export interface ManualEarnPointsResponse {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  message: string;
  transactionId: string;
}
```

> **Frontend tip:** the "Give Points" page loops over selected customer ids — call this endpoint
> once per customer. `branchId` comes from the active branch context
> (`useActiveBranch` → `activeBranchId`).
