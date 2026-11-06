# Admin Deals Management & Auto-Featured Deals API Guide

This documentation specifies the API endpoints, query parameters, payload structures, response schemas, and TypeScript interfaces for the frontend team to integrate the **Admin Deals Management** page and **Dynamic Auto-Featured Plan Configurations**.

---

## 1. Overview & Business Rules

1. **Deals Listing (`GET /admin/deals`)**:
   - Lists every deal across the platform with full details: pricing, active date window, claims count, views count, featured state, business name, branch name, and the business's current subscription plan.
   - Supports multi-criteria filtering, search, sorting, and pagination.
2. **Deal Statistics (`GET /admin/deals/stats`)**:
   - Returns counts for `totalDeals`, `activeDeals`, `featuredDeals`, and `expiredDeals`.
3. **Featured Toggle (`PATCH /admin/deals/:id/featured`)**:
   - Single-click action to toggle a deal's featured status on or off.
4. **Businesses List (`GET /admin/deals/businesses`)**:
   - Lightweight list of businesses (`id`, `name`) for the merchant filter dropdown.
5. **Dynamic Auto-Featured Plans (`autoFeatureDeals`)**:
   - Controlled via the plan management permissions (`autoFeatureDeals: boolean`).
   - When enabled on a plan (e.g. Platinum), deals created by merchants on that plan are automatically flagged with `isFeatured: true` by default. Admins can toggle this flag off at any time.

---

## 2. Endpoints Specification

All endpoints require an `ADMIN` role JWT (`Authorization: Bearer <admin_token>`).

---

### 2.1 Get All Deals (With Filters, Sorting & Pagination)
- **Method**: `GET`
- **Path**: `/admin/deals`
- **Description**: Retrieves a paginated table of deals with multi-field filtering and sorting.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | `number` | No | `1` | Page number (min: `1`). |
| `limit` | `number` | No | `10` | Number of items per page (min: `1`, max: `100`). |
| `search` | `string` | No | — | Case-insensitive search on deal name **or** business name. |
| `businessId` | `string (UUID)` | No | — | Filter deals by a specific business ID. |
| `plan` | `string` | No | — | Filter by subscription plan name or tier (`platinum`, `gold`, `silver`, `free`). |
| `status` | `string` | No | — | Filter by status: `active`, `inactive`, or `expired`. |
| `isFeatured` | `boolean` | No | — | Filter by featured flag (`true` or `false`). |
| `minPrice` | `number` | No | — | Minimum deal price (`calculatedPrice >= minPrice`). |
| `maxPrice` | `number` | No | — | Maximum deal price (`calculatedPrice <= maxPrice`). |
| `startDate` | `string (ISO)` | No | — | Start date filter (deals active on or after date). |
| `endDate` | `string (ISO)` | No | — | End date filter (deals ending on or before date). |
| `sortBy` | `string` | No | `newest` | Sort order: `newest`, `most_popular`, `featured_first`, `price_low_high`, `price_high_low`, `ending_soon`. |

#### Response Schema (`200 OK`)
```json
{
  "data": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Super Combo Burger Meal",
      "description": "Get 2 double cheeseburgers and large fries.",
      "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
      "mainImage": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
      "galleryImages": [
        "https://images.unsplash.com/photo-1550547660-d9450f859349"
      ],
      "status": "active",
      "pricing": {
        "pricingType": "percentage_discount",
        "originalPrice": 12000,
        "dealPrice": 9600,
        "discount": 20,
        "discountValue": 20,
        "fixedPrice": null
      },
      "dates": {
        "startDate": "2026-06-01T00:00:00.000Z",
        "endDate": "2026-12-31T23:59:59.000Z",
        "createdAt": "2026-06-01T10:00:00.000Z"
      },
      "claimsCount": 38,
      "viewsCount": 450,
      "isFeatured": true,
      "business": {
        "id": "e4b6a9e1-2c5d-4f8a-9b3e-1f7c8d9e0a1b",
        "name": "The Azure Bistro"
      },
      "branch": {
        "id": "f8a9e1b2-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
        "name": "Victoria Island Branch"
      },
      "subscriptionPlan": {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Platinum Plan",
        "isFree": false
      }
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### 2.2 Get Deals Stats
- **Method**: `GET`
- **Path**: `/admin/deals/stats`
- **Description**: Returns total counts of deals grouped by state.

#### Response Schema (`200 OK`)
```json
{
  "totalDeals": 42,
  "activeDeals": 28,
  "featuredDeals": 12,
  "expiredDeals": 14
}
```

---

### 2.3 Toggle Featured Status
- **Method**: `PATCH`
- **Path**: `/admin/deals/:id/featured`
- **Description**: Flips `isFeatured` from `true` to `false` or `false` to `true`.
- **Request Body**: None.

#### Response Schema (`200 OK`)
```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "isFeatured": true,
  "message": "Deal marked as featured successfully"
}
```

---

### 2.4 Get Businesses List (Dropdown Options)
- **Method**: `GET`
- **Path**: `/admin/deals/businesses`
- **Description**: Lightweight list of businesses for filter dropdowns.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `search` | `string` | No | Optional case-insensitive search by business name. |

#### Response Schema (`200 OK`)
```json
[
  {
    "id": "e4b6a9e1-2c5d-4f8a-9b3e-1f7c8d9e0a1b",
    "name": "The Azure Bistro"
  },
  {
    "id": "c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
    "name": "Urban Cafe"
  }
]
```

---

## 3. Dynamic Plan Permissions (`autoFeatureDeals`)

Admins can configure whether deals created by members of a specific plan are automatically featured:
- **Field**: `autoFeatureDeals` (`boolean`, default: `false`).
- **Used in**:
  - `POST /plans/admin`: Create new plan with `autoFeatureDeals` toggle.
  - `PATCH /plans/admin/:id`: Update existing plan.
  - `PUT /plans/admin/:id/permissions`: Update plan permission toggles.
  - `GET /plans/admin/:id/permissions`: Inspect current plan permission toggles.

---

## 4. TypeScript Interfaces & API Client

Add these types and API methods to `apps/VemTap/lib/api/admin.ts`:

```typescript
import { api } from '@/lib/api';

// =====================
// DEALS MANAGEMENT (Admin)
// =====================

export interface AdminDealPricing {
  pricingType: 'sum' | 'percentage_discount' | 'fixed_discount_price';
  originalPrice: number;
  dealPrice: number;
  discount: number;
  discountValue: number | null;
  fixedPrice: number | null;
}

export interface AdminDealDates {
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface AdminDealBusiness {
  id: string;
  name: string;
}

export interface AdminDealBranch {
  id: string;
  name: string;
}

export interface AdminDealPlan {
  id: string;
  name: string;
  isFree: boolean;
}

export interface AdminDealItem {
  id: string;
  name: string;
  description: string;
  image: string | null;
  mainImage: string | null;
  galleryImages: string[];
  status: 'active' | 'inactive' | 'expired';
  pricing: AdminDealPricing;
  dates: AdminDealDates;
  claimsCount: number;
  viewsCount: number;
  isFeatured: boolean;
  business: AdminDealBusiness;
  branch: AdminDealBranch;
  subscriptionPlan: AdminDealPlan;
}

export interface AdminDealsResponse {
  data: AdminDealItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdminDealsStatsResponse {
  totalDeals: number;
  activeDeals: number;
  featuredDeals: number;
  expiredDeals: number;
}

export interface AdminBusinessOption {
  id: string;
  name: string;
}

export interface AdminDealsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  businessId?: string;
  plan?: string;
  status?: 'active' | 'inactive' | 'expired';
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?:
    | 'newest'
    | 'most_popular'
    | 'featured_first'
    | 'price_low_high'
    | 'price_high_low'
    | 'ending_soon';
}

export const adminDealsApi = {
  /**
   * Get all deals with filters, sorting, and pagination
   */
  getDeals: (params?: AdminDealsQueryParams): Promise<AdminDealsResponse> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.businessId) q.set('businessId', params.businessId);
    if (params?.plan) q.set('plan', params.plan);
    if (params?.status) q.set('status', params.status);
    if (params?.isFeatured !== undefined) q.set('isFeatured', String(params.isFeatured));
    if (params?.minPrice !== undefined) q.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) q.set('maxPrice', String(params.maxPrice));
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    if (params?.sortBy) q.set('sortBy', params.sortBy);

    const queryStr = q.toString();
    return api.get(`/admin/deals${queryStr ? `?${queryStr}` : ''}`);
  },

  /**
   * Get deal statistics summary (total, active, featured, expired)
   */
  getStats: (): Promise<AdminDealsStatsResponse> => {
    return api.get('/admin/deals/stats');
  },

  /**
   * Toggle the featured status of a deal
   */
  toggleFeatured: (id: string): Promise<{ id: string; isFeatured: boolean; message: string }> => {
    return api.patch(`/admin/deals/${id}/featured`, {});
  },

  /**
   * Get list of businesses for filter dropdowns
   */
  getBusinessesList: (search?: string): Promise<AdminBusinessOption[]> => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    const queryStr = q.toString();
    return api.get(`/admin/deals/businesses${queryStr ? `?${queryStr}` : ''}`);
  },
};
```
