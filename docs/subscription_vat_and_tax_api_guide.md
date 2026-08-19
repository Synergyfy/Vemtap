# Subscription VAT & Tax API Integration Guide

This guide details the **Subscription VAT & Tax System** endpoints for frontend integration. It covers fetching plans with tax included, getting active tax settings, calculating checkout price breakdowns with add-ons, managing tax rules (admin), and viewing audit history.

---

## 1. Overview & Key Concepts

- **Dynamic Tax Calculation**: VAT can be configured as a **percentage** (e.g. `7.5%`, `10%`) or a **fixed fee** (e.g. `₦500.00`).
- **Global Enable / Disable**: When VAT is disabled by admin (`isEnabled: false`), tax is `0` and total price equals the base price.
- **Transparent Pricing**: The plans API (`GET /plans`) returns the base price, the calculated tax amount, and the tax-inclusive price for each billing cycle (`monthly`, `quarterly`, `yearly`).
- **Immutable Audit Trail**: Every change or toggle by an admin creates a new row in the database with timestamps and admin user info, enabling full audit history.

---

## 2. Public / Customer-Facing Endpoints

### A. Get All Plans (With Tax Breakdown)
`GET /api/v1/plans`  
`GET /api/v1/plans?onlyActive=true`

Returns all subscription plans. Every plan automatically includes base prices, tax amounts, prices with tax, and a structured `pricing` object.

#### Example Request:
```http
GET /api/v1/plans?onlyActive=true
```

#### Example Response (`200 OK`):
```json
[
  {
    "id": "7b2d5a3e-4b61-4567-89ab-cdef01234567",
    "name": "Standard Plan",
    "description": "Ideal for growing businesses",
    "isFree": false,
    "currency": "NGN",
    "monthlyPrice": 10000,
    "monthlyTax": 750,
    "monthlyPriceWithTax": 10750,
    "quarterlyPrice": 27000,
    "quarterlyTax": 2025,
    "quarterlyPriceWithTax": 29025,
    "yearlyPrice": 96000,
    "yearlyTax": 7200,
    "yearlyPriceWithTax": 103200,
    "tax": {
      "name": "VAT",
      "taxType": "percentage",
      "rate": 7.5,
      "isEnabled": true
    },
    "pricing": {
      "tax": {
        "name": "VAT",
        "taxType": "percentage",
        "rate": 7.5,
        "isEnabled": true
      },
      "monthly": {
        "basePrice": 10000,
        "taxAmount": 750,
        "totalPrice": 10750
      },
      "quarterly": {
        "basePrice": 27000,
        "taxAmount": 2025,
        "totalPrice": 29025
      },
      "yearly": {
        "basePrice": 96000,
        "taxAmount": 7200,
        "totalPrice": 103200
      }
    }
  }
]
```

> **Note**: For free plans (`isFree: true`), all tax amounts and totals are `0`.

---

### B. Get Single Plan Details
`GET /api/v1/plans/:id`

#### Example Request:
```http
GET /api/v1/plans/7b2d5a3e-4b61-4567-89ab-cdef01234567
```

#### Response (`200 OK`):
Returns the single plan object with the exact same tax breakdown structure as above.

---

### C. Get Current Active VAT Configuration
`GET /api/v1/subscriptions/tax-config`

Returns the platform's current active tax configuration.

#### Example Request:
```http
GET /api/v1/subscriptions/tax-config
```

#### Example Response (`200 OK`):
```json
{
  "id": "e3f1c2b4-5678-4321-9876-abcdef012345",
  "name": "VAT",
  "taxType": "percentage",
  "rate": 7.5,
  "isEnabled": true,
  "isActive": true,
  "changedById": "admin-uuid",
  "changeReason": "Updated VAT rate to 7.5%",
  "createdAt": "2026-08-15T12:00:00.000Z",
  "updatedAt": "2026-08-15T12:00:00.000Z"
}
```

---

### D. Preview Checkout Cost (With Add-ons & VAT)
`GET /api/v1/subscriptions/price-preview`

Use this endpoint in the checkout modal to dynamically calculate subtotal, VAT amount, and grand total when users select a plan and optional add-ons.

#### Query Parameters:
| Param | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `planId` | `string` (UUID) | Yes | Selected plan ID |
| `billingPeriod` | `'monthly'` \| `'quarterly'` \| `'yearly'` | Yes | Selected billing period |
| `addonIds` | `string[]` | No | Array of add-on UUIDs |
| `addonQuantities` | `number[]` | No | Quantities for the respective add-ons |

#### Example Request:
```http
GET /api/v1/subscriptions/price-preview?planId=7b2d5a3e-4b61-4567-89ab-cdef01234567&billingPeriod=monthly&addonIds=addon-uuid-1&addonQuantities=2
```

#### Example Response (`200 OK`):
```json
{
  "subtotal": 14000,
  "taxAmount": 1050,
  "total": 15050,
  "taxRule": {
    "id": "e3f1c2b4-5678-4321-9876-abcdef012345",
    "name": "VAT",
    "taxType": "percentage",
    "rate": 7.5,
    "isEnabled": true
  },
  "plan": {
    "id": "7b2d5a3e-4b61-4567-89ab-cdef01234567",
    "name": "Standard Plan",
    "monthlyPrice": 10000
  },
  "addons": [
    {
      "id": "addon-uuid-1",
      "name": "Extra Branch",
      "price": 2000
    }
  ]
}
```

---

## 3. Admin Endpoints (Settings & Audit History)

All admin endpoints require an `ADMIN` JWT bearer token:
`Authorization: Bearer <ADMIN_JWT_TOKEN>`

### A. Update VAT / Tax Rule
`PUT /api/v1/subscriptions/admin/tax-config`

Updates the tax rule. **Automatically deactivates previous active configuration and creates a new row in the DB to maintain history.**

#### Request Body (`UpdateSubscriptionTaxDto`):
```json
{
  "name": "VAT",
  "taxType": "percentage",
  "rate": 10,
  "isEnabled": true,
  "changeReason": "Statutory VAT rate adjustment"
}
```

*For fixed price VAT (e.g. ₦500 flat fee):*
```json
{
  "name": "Service Surcharge",
  "taxType": "fixed",
  "rate": 500,
  "isEnabled": true,
  "changeReason": "Switched to flat ₦500 platform fee"
}
```

#### Response (`200 OK`):
```json
{
  "id": "new-config-uuid",
  "name": "VAT",
  "taxType": "percentage",
  "rate": 10,
  "isEnabled": true,
  "isActive": true,
  "changedById": "admin-uuid",
  "changeReason": "Statutory VAT rate adjustment",
  "createdAt": "2026-08-15T14:30:00.000Z"
}
```

---

### B. Quick Toggle Enable / Disable VAT
`PATCH /api/v1/subscriptions/admin/tax-config/toggle`

Enables or disables VAT immediately without changing the configured rate. Creates a new history row with the updated status.

#### Request Body (`ToggleSubscriptionTaxDto`):
```json
{
  "isEnabled": false,
  "changeReason": "Disabled VAT during promotional launch"
}
```

#### Response (`200 OK`):
```json
{
  "id": "new-config-uuid",
  "name": "VAT",
  "taxType": "percentage",
  "rate": 10,
  "isEnabled": false,
  "isActive": true,
  "changedById": "admin-uuid",
  "changeReason": "Disabled VAT during promotional launch",
  "createdAt": "2026-08-15T14:35:00.000Z"
}
```

---

### C. Get Tax Audit History
`GET /api/v1/subscriptions/admin/tax-config/history`

Returns the full list of all previous tax configurations with the admin user who made each change, ordered by newest first (`createdAt DESC`).

#### Example Response (`200 OK`):
```json
[
  {
    "id": "config-3",
    "name": "VAT",
    "taxType": "percentage",
    "rate": 10,
    "isEnabled": false,
    "isActive": true,
    "changeReason": "Disabled VAT during promotional launch",
    "createdAt": "2026-08-15T14:35:00.000Z",
    "changedBy": {
      "id": "admin-1",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "admin@vemtap.com"
    }
  },
  {
    "id": "config-2",
    "name": "VAT",
    "taxType": "percentage",
    "rate": 10,
    "isEnabled": true,
    "isActive": false,
    "changeReason": "Statutory VAT rate adjustment",
    "createdAt": "2026-08-15T14:30:00.000Z",
    "changedBy": {
      "id": "admin-1",
      "firstName": "Super",
      "lastName": "Admin",
      "email": "admin@vemtap.com"
    }
  },
  {
    "id": "config-1",
    "name": "VAT",
    "taxType": "percentage",
    "rate": 7.5,
    "isEnabled": true,
    "isActive": false,
    "changeReason": "Initial default VAT configuration",
    "createdAt": "2026-08-15T12:00:00.000Z",
    "changedBy": null
  }
]
```

---

## 4. TypeScript Types for Frontend

```typescript
export type TaxType = 'percentage' | 'fixed';
export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface PlanTaxInfo {
  name: string;
  taxType: TaxType;
  rate: number;
  isEnabled: boolean;
}

export interface PlanPricingCycle {
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  currency: string;
  isFree: boolean;
  monthlyPrice: number;
  monthlyTax: number;
  monthlyPriceWithTax: number;
  quarterlyPrice: number;
  quarterlyTax: number;
  quarterlyPriceWithTax: number;
  yearlyPrice: number;
  yearlyTax: number;
  yearlyPriceWithTax: number;
  tax: PlanTaxInfo;
  pricing: {
    tax: PlanTaxInfo;
    monthly: PlanPricingCycle;
    quarterly: PlanPricingCycle;
    yearly: PlanPricingCycle;
  };
}

export interface SubscriptionTaxConfig {
  id: string;
  name: string;
  taxType: TaxType;
  rate: number;
  isEnabled: boolean;
  isActive: boolean;
  changedById?: string | null;
  changeReason?: string | null;
  createdAt: string;
  updatedAt: string;
  changedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface PricePreviewResponse {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRule: PlanTaxInfo & { id?: string };
  plan: Partial<Plan>;
  addons?: Array<{ id: string; name: string; price: number }>;
}

export interface UpdateSubscriptionTaxPayload {
  name?: string;
  taxType: TaxType;
  rate: number;
  isEnabled: boolean;
  changeReason?: string;
}

export interface ToggleSubscriptionTaxPayload {
  isEnabled: boolean;
  changeReason?: string;
}
```
