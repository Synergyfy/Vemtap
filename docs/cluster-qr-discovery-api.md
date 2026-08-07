# Market Clusters & Cluster QR Discovery — API & Frontend Guide

This document explains the **Market Clusters** feature end-to-end for the frontend team:

- What clusters and cluster QR codes are, and how the "discovery gateway" works.
- How to build the customer-facing `/c/[uniqueCode]` page and the admin cluster UI.
- Every endpoint (public + admin): how to call it, request shape, response interface, and sample payloads.

---

## 1. Concept Overview

A **market cluster** is a geographic area (e.g. *Banex*, *Apo Zone E*, *Garki Area 11*) created by a VemTap admin. Each cluster has:

- A **center point** (`latitude` / `longitude`) and a **radius** used to auto-assign branches.
- A **unique code** (`CL-XXXXXXXXX`) that **is** the QR code identifier.

> **No QR image is ever stored or returned by the backend.** The backend only stores the `uniqueCode`. The frontend renders the QR by encoding the URL `https://vemtap.com/c/{uniqueCode}` (or via the `qrUrl` field).

### How scanning works (customer flow)

1. A customer scans a **cluster QR** → lands on `/c/{uniqueCode}`.
2. The page calls `GET /clusters/context/:uniqueCode` to validate the code, read cluster info + member branches, and learn whether the QR is active.
3. The page calls `GET /clusters/:uniqueCode/deals` to render the deals feed (with filters/sorting).
4. If the QR was deactivated by an admin, both endpoints still return `200`, but with `qrActive: false` / `active: false` so the UI can show a friendly "This QR code has been deactivated" state instead of a dead page.

### Branch QRs are also gateways

The existing branch tap context (`GET /tap/context/:code`) now returns an additive `cluster` object when the branch belongs to a cluster, so a branch QR can link its customers into the wider market deals.

### "Fair" deal rotation

The default sort (`sortBy=fair`) rotates **which branch leads the feed every 15 minutes**. Every member branch's deals get a turn at the top of the list. This is deterministic within a 15-minute window (so it is cache-friendly and consistent on repeat visits).

---

## 2. Base URL, Auth, Errors

```
Base URL (local):    http://localhost:3002/api/v1
Base URL (prod):     https://<api-host>/api/v1
Swagger:             http://localhost:3002/api-docs
```

| Endpoint group | Auth |
| --- | --- |
| Public (`/clusters/*`, `/tap/context/*`) | **None** (`@Public()`) |
| Admin (`/admin/clusters/*`) | `Authorization: Bearer <jwt>` where `user.role === 'Admin'` |

Global error envelope (from `AllExceptionsFilter`):

```json
{
  "statusCode": 404,
  "timestamp": "2026-08-05T12:00:00.000Z",
  "path": "/api/v1/clusters/context/CL-NOPE00000",
  "method": "GET",
  "error": "Not Found",
  "message": "Cluster with uniqueCode \"CL-NOPE00000\" not found"
}
```

---

## 3. Public Endpoints

### 3.1 `GET /clusters/context/:uniqueCode`

Resolves a scanned cluster QR code.

**Path params**

| Param | Type | Notes |
| --- | --- | --- |
| `uniqueCode` | string | The cluster QR identifier (e.g. `CL-9XZ7KL2PQ`). URL-safe. |

**Behavior**

- 404 if the code does not exist.
- On every successful scan of an **active** QR, `scanCount` is incremented server-side (including cached responses).
- Returns `qrActive: false` when the cluster is inactive **or** its QR was deactivated — with a normal `200`.

**Response interface**

```ts
interface ClusterContextResponse {
  qrActive: boolean;                       // false = show "deactivated" state
  cluster: {
    id: string;
    name: string;
    uniqueCode: string;                    // the QR identifier
    description: string | null;
    qrUrl: string;                         // "https://vemtap.com/c/{uniqueCode}"
    branchCount: number;                   // number of ACTIVE member branches
    radiusMeters: number;
  };
  branches: ClusterContextBranch[];
}

interface ClusterContextBranch {
  id: string;
  name: string;
  slug: string;                            // branch.username || branch.uniqueCode
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
}
```

**Sample response**

```json
{
  "qrActive": true,
  "cluster": {
    "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
    "name": "Banex Market",
    "uniqueCode": "CL-9XZ7KL2PQ",
    "description": "Deals from businesses around Banex Plaza",
    "qrUrl": "https://vemtap.com/c/CL-9XZ7KL2PQ",
    "branchCount": 12,
    "radiusMeters": 500
  },
  "branches": [
    {
      "id": "1f1fad5b-d9cb-469f-a165-70867728950e",
      "name": "The Grill House - Banex",
      "slug": "the-grill-house-banex",
      "logoUrl": "https://cdn.vemtap.com/grill.png",
      "address": "Plot 12, Banex Plaza",
      "city": "Abuja",
      "state": "FCT",
      "latitude": 9.0489,
      "longitude": 7.4894
    }
  ]
}
```

**Deactivated example**

```json
{
  "qrActive": false,
  "cluster": { "id": "0f8fad5b-...", "name": "Banex Market", "uniqueCode": "CL-9XZ7KL2PQ", "description": null, "qrUrl": "https://vemtap.com/c/CL-9XZ7KL2PQ", "branchCount": 0, "radiusMeters": 500 },
  "branches": []
}
```

---

### 3.2 `GET /clusters/:uniqueCode/deals`

Returns active deals from **all member branches** of the cluster, with filters and sorting.

**Path params**

| Param | Type | Notes |
| --- | --- | --- |
| `uniqueCode` | string | Cluster QR identifier. |

**Query params (all optional)**

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | int ≥ 1 | `1` | Page number. |
| `limit` | int 1–50 | `10` | Page size. |
| `search` | string | — | Case-insensitive match on offer name, offer description, or business name. |
| `categoryId` | uuid | — | Only offers whose **business** category matches. |
| `sortBy` | enum | `fair` | `fair` · `newest` · `price_asc` · `price_desc` · `distance_asc` · `distance_desc` |
| `lat` | number | — | Customer latitude — used as the distance reference point for `distance_*` sorts. |
| `lng` | number | — | Customer longitude — used for `distance_*` sorts. |

**Sorting rules**

- `fair` (default): time-based rotation — the leading branch changes every 15 min.
- `newest`: `createdAt` desc.
- `price_asc` / `price_desc`: by `calculatedPrice`.
- `distance_asc` / `distance_desc`: distance from **customer `lat`/`lng`** when provided, otherwise from the **cluster center**. The response includes `reference` describing which was used.
- Any explicit `sortBy` **overrides** fair rotation; filters always narrow the set first.

**Response interface**

```ts
interface ClusterDealsResponse {
  active: boolean;                                  // false when QR deactivated / cluster inactive
  reason?: 'qr_deactivated' | 'cluster_inactive';   // present only when active === false
  data: ClusterDeal[];
  total: number;        // total matching offers (before paging)
  page: number;
  limit: number;
  sortBy: ClusterDealsSortBy;
  seed: number | null;  // rotation seed (fair sort only)
  bucket: number | null; // 15-min rotation bucket id (fair sort only)
  reference: {
    lat: number;
    lng: number;
    source: 'customer' | 'cluster_center';
  };
}

type ClusterDealsSortBy =
  | 'fair' | 'newest' | 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc';

interface ClusterDeal {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  terms: string[];
  pricingType: 'sum' | 'percentage_discount' | 'fixed_discount_price';
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
  maxClaims: number;
  remainingLimit: number | null;
  status: 'active' | 'inactive';
  views: number;
  offerType: string | null;
  audience: string | null;
  audienceTarget: string | null;
  maxClaimsPerCustomer: number | null;
  claimCodePrefix: string | null;
  branchId: string;
  businessId: string;
  distanceMeters: number | null;   // populated only for distance_* sorts
  branch: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
  business: {
    id: string;
    name: string;
    logoUrl: string | null;
  } | null;
}
```

**Sample request**

```
GET /api/v1/clusters/CL-9XZ7KL2PQ/deals?page=1&limit=10&sortBy=price_asc&categoryId=<uuid>&lat=9.05&lng=7.49
```

**Sample response**

```json
{
  "active": true,
  "data": [
    {
      "id": "4f1a3c2b-0000-0000-0000-000000000001",
      "name": "Jollof Combo",
      "description": "Jollof rice, chicken & drink",
      "longDescription": "Get a full jollof combo at a discounted price",
      "terms": ["Valid during business hours"],
      "pricingType": "percentage_discount",
      "discountValue": 15,
      "fixedPrice": null,
      "calculatedPrice": 2125,
      "originalPrice": 2500,
      "dealPrice": 2125,
      "discountPercent": 15,
      "mainImage": "https://cdn.vemtap.com/jollof.jpg",
      "galleryImages": [],
      "startDate": "2026-08-01T00:00:00.000Z",
      "endDate": "2026-09-30T23:59:59.000Z",
      "isExpired": false,
      "isTrending": true,
      "claimedCount": 42,
      "maxClaims": 100,
      "remainingLimit": 58,
      "status": "active",
      "views": 320,
      "offerType": "discount",
      "audience": "everyone_nearby",
      "audienceTarget": "all",
      "maxClaimsPerCustomer": 1,
      "claimCodePrefix": "VEM",
      "branchId": "1f1fad5b-d9cb-469f-a165-70867728950e",
      "businessId": "2f1fad5b-d9cb-469f-a165-70867728950e",
      "distanceMeters": 145.2,
      "branch": {
        "id": "1f1fad5b-d9cb-469f-a165-70867728950e",
        "name": "The Grill House - Banex",
        "slug": "the-grill-house-banex",
        "logoUrl": "https://cdn.vemtap.com/grill.png",
        "address": "Plot 12, Banex Plaza",
        "city": "Abuja",
        "state": "FCT"
      },
      "business": {
        "id": "2f1fad5b-d9cb-469f-a165-70867728950e",
        "name": "The Grill House",
        "logoUrl": "https://cdn.vemtap.com/grill.png"
      }
    }
  ],
  "total": 34,
  "page": 1,
  "limit": 10,
  "sortBy": "price_asc",
  "seed": null,
  "bucket": null,
  "reference": { "lat": 9.05, "lng": 7.49, "source": "customer" }
}
```

**Deactivated / inactive example** (HTTP 200, empty feed):

```json
{
  "active": false,
  "reason": "qr_deactivated",
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "sortBy": "fair",
  "seed": null,
  "bucket": null,
  "reference": { "lat": 9.0489, "lng": 7.4894, "source": "cluster_center" }
}
```

---

### 3.3 `GET /tap/context/:code` — augmented (discovery gateway)

Existing endpoint; response now includes an additive `cluster` field when the branch belongs to a cluster.

```ts
// Added to the existing response object:
cluster: {
  id: string;
  name: string;
  uniqueCode: string;
} | null;
```

```json
{
  "device": { "id": "...", "name": "Main Entrance", "code": "LT-8829-X", "location": "Entrance" },
  "branch": { "id": "...", "name": "The Grill House - Banex", "offerCount": 5, "...": "..." },
  "qrThriveCodes": [],
  "cluster": {
    "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
    "name": "Banex Market",
    "uniqueCode": "CL-9XZ7KL2PQ"
  },
  "business": { "id": "...", "name": "The Grill House", "logoUrl": null }
}
```

---

## 4. Admin Endpoints

All admin endpoints:

- Require `Authorization: Bearer <jwt>` and role **`Admin`** (guards: `JwtAuthGuard` + `RolesGuard`).
- Return `403` for non-admin tokens.
- Write operations are recorded in the platform `audit_logs` table automatically.

### 4.1 `GET /admin/clusters` — list clusters

**Query params (all optional)**

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | int ≥ 1 | `1` | Page number. |
| `limit` | int 1–100 | `20` | Page size. |
| `search` | string | — | Case-insensitive match on cluster `name`. |

**Response interface**

```ts
interface AdminClusterListResponse {
  data: AdminClusterListItem[];
  meta: { total: number; page: number; limit: number };
}

interface AdminClusterListItem {
  id: string;
  name: string;
  uniqueCode: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  isActive: boolean;
  qrIsActive: boolean;      // QR currently scannable?
  branchCount: number;      // member branches (all, not just active)
  activeOfferCount: number; // live offers across member branches
  scanCount: number;        // lifetime QR scans
  createdAt: string;
}
```

**Sample response**

```json
{
  "data": [
    {
      "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
      "name": "Banex Market",
      "uniqueCode": "CL-9XZ7KL2PQ",
      "description": "Deals around Banex Plaza",
      "latitude": 9.0489,
      "longitude": 7.4894,
      "radiusMeters": 500,
      "isActive": true,
      "qrIsActive": true,
      "branchCount": 12,
      "activeOfferCount": 34,
      "scanCount": 1284,
      "createdAt": "2026-08-05T09:00:00.000Z"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20 }
}
```

---

### 4.2 `GET /admin/clusters/:id` — cluster detail

**Response interface**

```ts
interface AdminClusterDetailResponse {
  id: string;
  name: string;
  uniqueCode: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  isActive: boolean;
  qrIsActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
  qrUrl: string;             // ready-to-render QR target URL
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

**Sample response**

```json
{
  "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
  "name": "Banex Market",
  "uniqueCode": "CL-9XZ7KL2PQ",
  "description": "Deals around Banex Plaza",
  "latitude": 9.0489,
  "longitude": 7.4894,
  "radiusMeters": 500,
  "isActive": true,
  "qrIsActive": true,
  "scanCount": 1284,
  "createdAt": "2026-08-05T09:00:00.000Z",
  "updatedAt": "2026-08-05T09:00:00.000Z",
  "qrUrl": "https://vemtap.com/c/CL-9XZ7KL2PQ",
  "branches": [
    {
      "id": "1f1fad5b-d9cb-469f-a165-70867728950e",
      "name": "The Grill House - Banex",
      "uniqueCode": "BR123XYZ9",
      "username": "the-grill-house-banex",
      "logoUrl": "https://cdn.vemtap.com/grill.png",
      "address": "Plot 12, Banex Plaza",
      "city": "Abuja",
      "state": "FCT",
      "isActive": true
    }
  ]
}
```

---

### 4.3 `POST /admin/clusters` — create a cluster

**Request body (`CreateClusterDto`)**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string ≤ 120 | ✅ | Cluster display name. |
| `description` | string ≤ 1000 | — | |
| `latitude` | number ∈ [-90, 90] | ✅ | Cluster center. |
| `longitude` | number ∈ [-180, 180] | ✅ | Cluster center. |
| `radiusMeters` | int ≥ 1 | — | Default `500`. Boundary used by auto-assign. |
| `isActive` | boolean | — | Default `true`. |
| `qrIsActive` | boolean | — | Default `true`. |

The `uniqueCode` is auto-generated (`CL-` + 9 random alphanumerics). You cannot set it.

**Request sample**

```json
{
  "name": "Apo Zone E",
  "description": "Businesses around Apo Resettlement",
  "latitude": 9.0419,
  "longitude": 7.5057,
  "radiusMeters": 500,
  "isActive": true,
  "qrIsActive": true
}
```

**Response:** `200`/`201` with the **admin cluster detail shape** (section 4.2), including the generated `uniqueCode` and `qrUrl`.

---

### 4.4 `PATCH /admin/clusters/:id` — update a cluster (incl. QR toggle)

All fields optional. Only provided fields are updated.

**Request body (`UpdateClusterDto`)**

```json
{
  "name": "Banex Market 2.0",
  "radiusMeters": 750,
  "qrIsActive": false
}
```

> **Deactivating / reactivating a QR:** set `qrIsActive: false` (or `true`) and `PATCH`. Once deactivated, scanning the QR returns `qrActive: false` / `active: false` and stops incrementing `scanCount`.

**Response:** admin cluster detail shape (section 4.2).

---

### 4.5 `DELETE /admin/clusters/:id` — soft-delete a cluster

Releases all member branches (sets `branch.clusterId = null`) and soft-deletes the cluster.

**Response**

```json
{ "success": true }
```

---

### 4.6 `POST /admin/clusters/auto-assign` — bulk-assign branches

Assigns branches to the nearest cluster whose radius covers them. Only active clusters with coordinates are considered.

**Request body**

```json
{ "dryRun": true, "scope": "unassigned" }
```

Options:
- `dryRun: true` → returns a preview and persists nothing. `false` or omitted → commits.
- `scope: "unassigned"` (default) → considers only branches **without** a cluster.
- `scope: "all"` → considers **every** branch with coordinates and reassigns it to a different, closer covering cluster when one exists. Branches are **never** unassigned: a branch with no covering cluster keeps its current one.
- `async: true` → (only valid with `dryRun: false`/omitted) enqueues the run on the background worker and returns `{ enqueued: true, jobId }` immediately instead of running inline.

**Response — dry run**

```ts
interface AutoAssignDryRunResponse {
  dryRun: true;
  scope: 'unassigned' | 'all';
  totalCandidates: number;      // branches considered
  assigned: number;             // branches that would be (re)assigned
  reassigned: number;           // branches moving from an existing cluster
  assignments: Array<{
    branchId: string;
    clusterId: string | null;
    previousClusterId?: string | null;  // present when reassigning an assigned branch
    distanceMeters?: number | null;
  }>;
}
```

**Response — commit**

```ts
interface AutoAssignCommitResponse {
  dryRun: false;
  scope: 'unassigned' | 'all';
  totalCandidates: number;
  assigned: number;
  reassigned: number;
}
```

**Background worker**

The endpoint is also driven by an automatic background worker (`cluster-auto-assign` BullMQ queue, processed by `ClusterAutoAssignProcessor`):

- Every 15 minutes a cron enqueues a `scope: "unassigned"` run (cheap backfill).
- Every hour a cron enqueues a `scope: "all"` run so branches are reassigned to newly created / closer clusters as accuracy improves.
- All runs (cron, admin `async: true`, and manual commits) share one assignment algorithm. The worker uses a single fixed `jobId` so overlapping runs are deduplicated by BullMQ.
- Each run invalidates the Redis cache for every affected cluster (both the new and, on reassignment, the previous cluster).

---

### 4.7 `POST /admin/clusters/:id/branches` — add a branch to a cluster

**Request body**

```json
{ "branchId": "1f1fad5b-d9cb-469f-a165-70867728950e" }
```

Moves the branch into this cluster (it is removed from any previous cluster). Both old and new cluster caches are invalidated.

**Response**

```json
{ "success": true }
```

---

### 4.8 `DELETE /admin/clusters/:id/branches/:branchId` — remove a branch from a cluster

**Response**

```json
{ "success": true }
```

---

## 5. Frontend Implementation & Design Guide

### 5.1 The customer `/c/[uniqueCode]` page

This is the **QR scan target**. A public (no-auth) page.

**Flow**

1. On mount, call `GET /clusters/context/:uniqueCode`.
   - `404` → show "QR code not found" state.
   - `qrActive: false` → show a friendly **"This QR code has been deactivated"** screen (do not fetch deals, do not render the feed).
2. Otherwise, call `GET /clusters/:uniqueCode/deals` with the current filters and show the feed.
3. Render the cluster name + description as a header, member `branches` count, and the deals grid.

**Recommended state management (React Query)**

```ts
const useClusterContext = (uniqueCode: string) =>
  useQuery({
    queryKey: ['cluster', 'context', uniqueCode],
    queryFn: () => api.get(`/clusters/context/${uniqueCode}`),
    enabled: !!uniqueCode,
    staleTime: 5 * 60_000,
  });

const useClusterDeals = (uniqueCode: string, params: DealsQueryParams) =>
  useQuery({
    queryKey: ['cluster', 'deals', uniqueCode, params],
    queryFn: () => api.get(`/clusters/${uniqueCode}/deals`, { params }),
    enabled: !!uniqueCode,
  });
```

**Design guidance**

- Mobile-first, card grid like the existing `/deals` page.
- Reuse the existing deal card components (`PromotionCard`, `TrendingSection`) and the `toPromotionBusiness` / `toPromotion` mappers in `apps/VemTap/services/deals` — the cluster `deals.data[i]` shape is compatible (it includes `branch` + `business`).
- Header: cluster name, description, and a "N businesses · M live deals" summary.
- **Filters bar:** category dropdown, search input.
- **Sort control:** Fair (default) / Newest / Price ↑ / Price ↓ / Distance ↑ / Distance ↓.
  - Pass `lat` & `lng` from the user's saved location (`localStorage['vemtap_user_location']`, as the `/deals` page does) so `distance_*` sorts and the distance badge work.
  - `distanceMeters` on each deal is present only for `distance_*` sorts; hide the distance badge otherwise.
- When `active: false`, hide filters and show the deactivated illustration + "Go Home".
- Honor `sortBy`/`seed`/`bucket` from the response if you want to show a "rotating picks" badge; otherwise ignore them.

### 5.2 Rendering the QR code (admin)

The QR encodes the URL `cluster.qrUrl` (`https://vemtap.com/c/{uniqueCode}`).

- Reuse the existing `apps/VemTap/components/shared/DynamicQRCode` with `customUrl={cluster.qrUrl}` and `label={cluster.name}`.
- Or render directly with `qrcode.react`:

```tsx
import { QRCodeCanvas } from 'qrcode.react';

<QRCodeCanvas value={cluster.qrUrl} size={240} level="H" />;
```

- Download/share features already exist in `DynamicQRCode` (PDF export + copy link).

### 5.3 The admin cluster UI (Control Tower)

Suggested routes under the platform admin section:

- `/admin/clusters` — list + create.
- `/admin/clusters/:id` — detail + manage members + QR toggle.

**List view**

- Table/cards from `GET /admin/clusters` columns: name, `uniqueCode`, `branchCount`, `activeOfferCount`, `scanCount`, QR status badge (`qrIsActive`), `isActive`, created date.
- Actions: View, Edit, **Deactivate QR / Activate QR** (calls `PATCH /admin/clusters/:id` with `{ qrIsActive: !current }`), Delete (confirm).
- "New Cluster" modal: name, description, latitude, longitude (or a map picker), radius.
- "Auto-assign" button: calls `POST /admin/clusters/auto-assign` with `dryRun: true`, shows the preview (`assigned / totalCandidates` + assignment list), then re-runs with `dryRun: false` to commit.

**Detail view**

- Header: cluster info + QR preview (`DynamicQRCode` with `qrUrl`) + QR active toggle.
- Member branches list (from `GET /admin/clusters/:id`): name, city/state, `isActive`, with an "Add branch" picker (`POST /admin/clusters/:id/branches` `{ branchId }`) and "Remove" (`DELETE /admin/clusters/:id/branches/:branchId`).

### 5.4 Design tokens / empty & loading states

- Use the app's existing primary/secondary tokens and the standard card style used on `/deals` and discovery pages.
- Loading: skeleton cards matching the deal-card height.
- Empty feed: "No deals in this area right now — check back soon".
- Deactivated QR: illustration + "This QR code is no longer active".
- 404 code: "QR code not found" (reuse `/s/[id]` error style).

---

## 6. Caching & Performance Notes (what the frontend can rely on)

- The deals feed is cached server-side for **15 minutes per filter/sort/location combo**, matching the fair-rotation bucket. A customer re-visiting within the same window gets the same ordering instantly.
- The context response is cached for **1 hour** and invalidated when cluster details, membership, or the QR toggle change.
- Offer edits/claims invalidate the affected cluster's feed automatically (so `claimedCount`/`remainingLimit` stay fresh).
- There is **no** QR image to cache or invalidate — the QR is just a URL rendered client-side.

---

## 7. Quick Reference

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/clusters/context/:uniqueCode` | none | Resolve scanned cluster QR |
| GET | `/api/v1/clusters/:uniqueCode/deals` | none | Cluster deals feed (filters + sorts) |
| GET | `/api/v1/tap/context/:code` | none | Branch tap context (+ `cluster` gateway block) |
| GET | `/api/v1/admin/clusters` | Admin | List clusters + stats |
| GET | `/api/v1/admin/clusters/:id` | Admin | Cluster detail + members + QR URL |
| POST | `/api/v1/admin/clusters` | Admin | Create cluster |
| PATCH | `/api/v1/admin/clusters/:id` | Admin | Update cluster / toggle QR |
| DELETE | `/api/v1/admin/clusters/:id` | Admin | Soft-delete cluster |
| POST | `/api/v1/admin/clusters/auto-assign` | Admin | Bulk auto-assign branches |
| POST | `/api/v1/admin/clusters/:id/branches` | Admin | Add branch to cluster |
| DELETE | `/api/v1/admin/clusters/:id/branches/:branchId` | Admin | Remove branch from cluster |
