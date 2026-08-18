# Subscription Coupon & Discount API Integration Guide

This guide details the complete **Subscription Coupon & Discount Code System** for frontend and mobile engineers. It covers:
1. Validating promo codes during checkout.
2. Real-time price breakdown preview with discount + VAT calculations.
3. Completing checkout with Paystack and applying the promo code.
4. Admin Dashboard management (Creating coupons, generating promo codes, instant suspension toggles, viewing redemption audit logs, and performance analytics).

---

## 1. Architecture & Core Concepts

- **Dual-Entity Model**:
  - **`Coupon`**: The underlying discount math (e.g. `20%` off, `₦5,000` fixed discount, recurring duration `ONCE` / `REPEATING` / `FOREVER`, plan restrictions).
  - **`Promotion Code`**: The customer-facing string (e.g. `SAVE50`, `TWITTER20`) with capacity rules (expiry date, max 10 redemptions, first-time only, per-user limits).
- **Tax Integration**: The system computes the discount on the base plan first, then calculates VAT (7.5%) on the net discounted subtotal.
- **Atomic Concurrency**: High-concurrency checkouts (e.g. "first 10 users") are guarded at the database level against overselling.
- **Paystack Verification**: The backend re-validates the promo code server-side and confirms the exact discounted amount was paid before activating the subscription and recording the redemption.

---

## 2. TypeScript Interfaces (Copy into Frontend Types)

```typescript
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponDuration {
  ONCE = 'ONCE',
  REPEATING = 'REPEATING',
  FOREVER = 'FOREVER',
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// Discount Breakdown Object returned in Price Preview & Validation
export interface DiscountBreakdown {
  code: string;
  couponName: string;
  discountType: DiscountType;
  amount: number;
  duration: CouponDuration;
  discountAmount: number;
  originalPlanPrice: number;
  discountedPlanPrice: number;
}

// Complete Checkout Price Breakdown Response
export interface PricePreviewResponse {
  subtotal: number; // Net subtotal (discounted plan + addons)
  taxAmount: number; // VAT on net subtotal
  total: number; // Final amount to charge via Paystack
  taxRule: {
    name: string;
    taxType: string;
    rate: number;
    isEnabled: boolean;
  };
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
    currency: string;
  };
  addons: any[];
  discount?: DiscountBreakdown | null;
}

// Promotion Code Validation Response
export interface ValidatePromoCodeResponse {
  isValid: boolean;
  originalPlanPrice: number;
  discountAmount: number;
  discountedPlanPrice: number;
  addonsSubtotal: number;
  netSubtotal: number;
  taxAmount: number;
  total: number;
  taxRule: {
    name: string;
    taxType: string;
    rate: number;
    isEnabled: boolean;
  };
  coupon: {
    id: string;
    name: string;
    discountType: DiscountType;
    amount: number;
    duration: CouponDuration;
  };
  promotionCode: {
    id: string;
    code: string;
    timesRedeemed: number;
    maxRedemptions?: number | null;
  };
}

// Admin Coupon Object
export interface CouponItem {
  id: string;
  name: string;
  discountType: DiscountType;
  amount: number;
  currency: string;
  maxDiscountAmount?: number | null;
  minSubtotal?: number | null;
  duration: CouponDuration;
  durationInMonths?: number | null;
  applicablePlanIds: string[];
  applicableBillingPeriods: string[];
  isActive: boolean;
  createdAt: string;
  promotionCodes?: PromoCodeItem[];
}

// Admin Promo Code Object
export interface PromoCodeItem {
  id: string;
  couponId: string;
  code: string;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxRedemptions?: number | null;
  timesRedeemed: number;
  maxRedemptionsPerUser: number;
  firstTimeOnly: boolean;
  allowedBusinessIds: string[];
  createdAt: string;
  coupon?: CouponItem;
}

// Admin Redemption Log Item
export interface CouponRedemptionItem {
  id: string;
  promotionCodeId: string;
  couponId: string;
  businessId: string;
  userId: string;
  subscriptionId?: string;
  paymentReference: string;
  planId: string;
  billingPeriod: BillingPeriod;
  originalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  currency: string;
  createdAt: string;
  coupon?: CouponItem;
  promotionCode?: PromoCodeItem;
  business?: { id: string; name: string };
  user?: { id: string; firstName: string; lastName: string; email: string };
}
```

---

## 3. Customer & Checkout APIs

### A. Live Price Preview (With Optional Promo Code)
`GET /api/v1/subscriptions/price-preview`

Call this endpoint whenever the user selects a plan, changes billing cycles (`monthly`, `quarterly`, `yearly`), selects add-ons, or applies a promo code.

#### Query Parameters:
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `planId` | `UUID` | **Yes** | Target subscription plan ID |
| `billingPeriod` | `enum` | **Yes** | `monthly`, `quarterly`, or `yearly` |
| `promoCode` | `string` | No | Optional promo code entered by user (e.g. `SAVE20`) |
| `addonIds` | `string[]` | No | Optional array of add-on IDs |
| `addonQuantities` | `number[]` | No | Optional quantities for add-ons |

#### Example Request:
```http
GET /api/v1/subscriptions/price-preview?planId=7b2d5a3e-4b61-4567-89ab-cdef01234567&billingPeriod=monthly&promoCode=SAVE20
```

#### Example Response (`200 OK`):
```json
{
  "subtotal": 8000,
  "taxAmount": 600,
  "total": 8600,
  "taxRule": {
    "name": "VAT",
    "taxType": "percentage",
    "rate": 7.5,
    "isEnabled": true
  },
  "plan": {
    "id": "7b2d5a3e-4b61-4567-89ab-cdef01234567",
    "name": "Growth Plan",
    "monthlyPrice": 10000,
    "quarterlyPrice": 27000,
    "yearlyPrice": 100000,
    "currency": "NGN"
  },
  "addons": [],
  "discount": {
    "code": "SAVE20",
    "couponName": "20% Off Launch Special",
    "discountType": "PERCENTAGE",
    "amount": 20,
    "duration": "ONCE",
    "discountAmount": 2000,
    "originalPlanPrice": 10000,
    "discountedPlanPrice": 8000
  }
}
```

---

### B. Standalone Promo Code Validation
`POST /api/v1/coupons/validate`

Use this if you want an explicit "Apply Code" button on the UI that validates the code and returns specific error messages if invalid.

#### Request Body:
```json
{
  "code": "SAVE50",
  "planId": "7b2d5a3e-4b61-4567-89ab-cdef01234567",
  "billingPeriod": "monthly",
  "businessId": "optional-biz-uuid"
}
```

#### Response (`200 OK`):
```json
{
  "isValid": true,
  "originalPlanPrice": 10000,
  "discountAmount": 5000,
  "discountedPlanPrice": 5000,
  "addonsSubtotal": 0,
  "netSubtotal": 5000,
  "taxAmount": 375,
  "total": 5375,
  "taxRule": {
    "name": "VAT",
    "taxType": "percentage",
    "rate": 7.5,
    "isEnabled": true
  },
  "coupon": {
    "id": "coupon-uuid",
    "name": "50% Off Early Adopter",
    "discountType": "PERCENTAGE",
    "amount": 50,
    "duration": "ONCE"
  },
  "promotionCode": {
    "id": "promo-uuid",
    "code": "SAVE50",
    "timesRedeemed": 4,
    "maxRedemptions": 10
  }
}
```

---

### C. Subscribe / Checkout with Discount
`POST /api/v1/subscriptions/subscribe`

#### Request Body:
```json
{
  "planId": "7b2d5a3e-4b61-4567-89ab-cdef01234567",
  "billingPeriod": "monthly",
  "paymentReference": "T_123456789_PAYSTACK_REF",
  "promoCode": "SAVE50"
}
```

#### Response (`201 Created`):
```json
{
  "subscription": {
    "id": "sub-uuid",
    "businessId": "biz-uuid",
    "planId": "7b2d5a3e-4b61-4567-89ab-cdef01234567",
    "billingPeriod": "monthly",
    "startDate": "2026-08-18T12:00:00.000Z",
    "endDate": "2026-09-18T12:00:00.000Z",
    "status": "active",
    "paystackReference": "T_123456789_PAYSTACK_REF"
  },
  "addOns": []
}
```

---

## 4. Admin Management Endpoints

All admin endpoints require an `Authorization: Bearer <token>` header with an `ADMIN` role.

### A. Coupons (The Discount Math & Rules)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/admin/coupons` | Create a new Coupon |
| `GET` | `/api/v1/admin/coupons` | List all Coupons with attached promo codes |
| `GET` | `/api/v1/admin/coupons/:id` | Get single Coupon details |
| `PATCH` | `/api/v1/admin/coupons/:id` | Update Coupon settings |
| `PATCH` | `/api/v1/admin/coupons/:id/toggle` | Suspend or reactivate a Coupon |
| `DELETE` | `/api/v1/admin/coupons/:id` | Delete a Coupon |

#### Create Coupon Payload:
```json
{
  "name": "Q3 Growth Promo",
  "discountType": "PERCENTAGE", // "PERCENTAGE" or "FIXED_AMOUNT"
  "amount": 20, // 20% or 5000 NGN
  "currency": "NGN",
  "maxDiscountAmount": 10000, // Optional cap for % discount
  "minSubtotal": 5000, // Optional minimum spend
  "duration": "ONCE", // "ONCE", "REPEATING", or "FOREVER"
  "durationInMonths": null, // Required if duration is REPEATING (e.g. 3)
  "applicablePlanIds": [], // Empty array = applies to all plans
  "applicableBillingPeriods": ["monthly", "yearly"], // Empty array = all cycles
  "isActive": true
}
```

---

### B. Promotion Codes (Customer-Facing Tokens)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/admin/coupons/:couponId/promo-codes` | Generate a Promo Code under a Coupon |
| `GET` | `/api/v1/admin/coupons/promo-codes/all` | List Promo Codes (supports `?couponId=&isActive=&search=`) |
| `GET` | `/api/v1/admin/coupons/promo-codes/:id` | Get single Promo Code |
| `PATCH` | `/api/v1/admin/coupons/promo-codes/:id` | Update Promo Code boundaries |
| `PATCH` | `/api/v1/admin/coupons/promo-codes/:id/toggle` | Suspend or reactivate a single Promo Code |

#### Create Promo Code Payload:
```json
{
  "code": "GROWTH20",
  "isActive": true,
  "startsAt": "2026-08-01T00:00:00Z", // Optional start date
  "expiresAt": "2026-10-31T23:59:59Z", // Optional expiry (null for forever)
  "maxRedemptions": 100, // Total global usage cap (null for unlimited)
  "maxRedemptionsPerUser": 1, // Per-business usage cap (default: 1)
  "firstTimeOnly": false, // If true, only first-time subscribers can use it
  "allowedBusinessIds": [] // Empty = any business can use it
}
```

---

### C. Analytics & Audit Logs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/coupons/analytics/stats` | High-level metrics (total discounts granted, total revenue) |
| `GET` | `/api/v1/admin/coupons/analytics/redemptions` | Searchable & filterable redemption audit log |

#### Analytics Response Example:
```json
{
  "totalCoupons": 5,
  "activeCoupons": 4,
  "totalPromoCodes": 15,
  "activePromoCodes": 12,
  "totalRedemptions": 142,
  "totalDiscountAmountGiven": 355000,
  "totalRevenueFromDiscountedSales": 1420000
}
```

#### Query Redemptions Filter Options:
`GET /api/v1/admin/coupons/analytics/redemptions?couponId=...&promotionCodeId=...&businessId=...&search=SAVE`

---

## 5. React / Next.js Checkout Integration Example

```tsx
import React, { useState, useEffect } from 'react';

export function CheckoutSummary({
  planId,
  billingPeriod,
  userToken,
  onPaymentSuccess,
}) {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [preview, setPreview] = useState<PricePreviewResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Live Price Breakdown
  const fetchPriceBreakdown = async (codeToApply?: string | null) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({
        planId,
        billingPeriod,
        ...(codeToApply ? { promoCode: codeToApply } : {}),
      });

      const res = await fetch(`/api/v1/subscriptions/price-preview?${params}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to calculate price preview');
      }

      setPreview(data);
      if (codeToApply) setAppliedPromo(codeToApply);
    } catch (err: any) {
      setErrorMsg(err.message);
      // Fall back to clean preview if promo code was invalid
      if (codeToApply) fetchPriceBreakdown(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceBreakdown(appliedPromo);
  }, [planId, billingPeriod]);

  // Apply Promo Code Button Handler
  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) return;
    fetchPriceBreakdown(promoCodeInput.trim());
  };

  // Remove Promo Code Handler
  const handleRemovePromo = () => {
    setPromoCodeInput('');
    setAppliedPromo(null);
    fetchPriceBreakdown(null);
  };

  // Paystack Checkout
  const handlePaystackCheckout = () => {
    if (!preview) return;

    const paystack = new (window as any).PaystackPop();
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: 'user@business.com',
      amount: Math.round(preview.total * 100), // In Kobo
      currency: 'NGN',
      onSuccess: async (transaction: { reference: string }) => {
        // Send to Backend for Final Activation & Redemption Recording
        const subscribeRes = await fetch('/api/v1/subscriptions/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            planId,
            billingPeriod,
            paymentReference: transaction.reference,
            ...(appliedPromo ? { promoCode: appliedPromo } : {}),
          }),
        });

        const subData = await subscribeRes.json();
        if (subscribeRes.ok) {
          onPaymentSuccess(subData);
        } else {
          alert(`Subscription activation failed: ${subData.message}`);
        }
      },
    });
  };

  return (
    <div className="rounded-xl border p-6 bg-white shadow-sm space-y-4">
      <h3 className="text-lg font-semibold">Order Summary</h3>

      {/* Plan Price */}
      <div className="flex justify-between text-sm">
        <span>Plan ({preview?.plan?.name})</span>
        <span>₦{preview?.discount?.originalPlanPrice?.toLocaleString() || preview?.subtotal?.toLocaleString()}</span>
      </div>

      {/* Discount Badge if applied */}
      {preview?.discount && (
        <div className="flex justify-between items-center text-sm text-green-600 bg-green-50 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase">{preview.discount.code}</span>
            <span className="text-xs text-green-700">(-{preview.discount.amount}{preview.discount.discountType === 'PERCENTAGE' ? '%' : ' NGN'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span>-₦{preview.discount.discountAmount.toLocaleString()}</span>
            <button onClick={handleRemovePromo} className="text-red-500 text-xs hover:underline">Remove</button>
          </div>
        </div>
      )}

      {/* VAT Amount */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>{preview?.taxRule?.name || 'VAT'} ({preview?.taxRule?.rate || 7.5}%)</span>
        <span>₦{preview?.taxAmount?.toLocaleString()}</span>
      </div>

      <hr />

      {/* Final Total */}
      <div className="flex justify-between text-lg font-bold">
        <span>Total Payable</span>
        <span>₦{preview?.total?.toLocaleString()}</span>
      </div>

      {/* Promo Code Input Box */}
      {!appliedPromo && (
        <div className="space-y-2 pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Promo Code"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase"
            />
            <button
              onClick={handleApplyPromo}
              disabled={loading || !promoCodeInput}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Apply
            </button>
          </div>
          {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
        </div>
      )}

      {/* Checkout Button */}
      <button
        onClick={handlePaystackCheckout}
        disabled={loading || !preview}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
      >
        Proceed to Pay ₦{preview?.total?.toLocaleString()}
      </button>
    </div>
  );
}
```

---

## 6. Error Codes & User-Facing Messages

When a promo code fails validation, the API returns a `400 Bad Request` with a descriptive `message`. Use this table to map or display toast alerts:

| API Error Message | Explanation | Recommended Frontend Display |
| :--- | :--- | :--- |
| `"Promotion code '<CODE>' not found"` | Code does not exist | *"Invalid promo code. Please check and try again."* |
| `"This promotion code is currently suspended"` | Admin toggled code off | *"This promo code has been suspended."* |
| `"The promotion campaign for this code is currently inactive"` | Admin toggled parent coupon off | *"This promotion campaign is currently inactive."* |
| `"This promotion code has expired"` | Past `expiresAt` date | *"This promo code has expired."* |
| `"This promotion code is not active yet. Starts at <Date>"` | Before `startsAt` date | *"This promo code is not active yet."* |
| `"This promotion code has reached its maximum redemptions limit"` | Capacity reached (e.g. 10/10 used) | *"This promo code has reached its maximum usage limit."* |
| `"You have already reached the maximum usage limit (<N> time(s))"` | Per-business cap exceeded | *"You have already redeemed this code the maximum allowed number of times."* |
| `"This promotion code is exclusively for first-time subscribers"` | Business already has past paid sub | *"This promo code is only valid for new subscribers."* |
| `"This coupon cannot be used for the <Plan> plan"` | Restricted to other plans | *"This promo code cannot be applied to the selected plan."* |
| `"This coupon is not valid for <period> subscriptions"` | Restricted to specific cycles | *"This promo code is only valid for monthly/yearly plans."* |
| `"A minimum subscription amount of ₦<X> is required"` | Plan price below `minSubtotal` | *"A minimum subscription value of ₦X is required to use this code."* |
