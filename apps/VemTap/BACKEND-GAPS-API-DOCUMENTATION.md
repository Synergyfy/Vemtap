# VemTap Backend Gaps — API Reference Documentation

This document describes the endpoints added, modified, or extended during this session to close the reported gaps in business auto-creation, product loyalty/details, POS settings, and returns/refunds.

---

## 1. Business Onboarding & Settings

### `PATCH /businesses/my-business`
*   **Description:** Updates the current user's business. If the user does not currently have a business associated with their account, this endpoint will automatically create one, link it to the user, set their status to active, and configure a main branch and auto-subscription to the free plan.
*   **Access Level:** Owner role only (`UserRole.OWNER`).
*   **Method & Endpoint:** `PATCH /api/v1/businesses/my-business`

#### Request Payload (`UpdateBusinessDto`)
All fields are optional:

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Name of the business. Defaults to "My Business" if creating. |
| `categoryId` | `string` (UUID) | Category identifier. |
| `subcategoryId` | `string` (UUID) | Subcategory identifier. |
| `otherSubcategoryName` | `string` | Name of subcategory if "Other" is chosen. |
| `state` | `string` | State location of the business. |
| `city` | `string` | City location of the business. |
| `address` | `string` | Street address. |
| `logoUrl` | `string` | Logo URL. |
| `posSettings` | `object` | Settings related to the Point of Sale. |
| `posSettings.loyaltyEnabled` | `boolean` | Enable or disable loyalty rewards on the store. |
| `posSettings.loyaltyRedeemThreshold` | `number` | Minimum points required to redeem a reward. |

#### Sample Request
```json
{
  "name": "The Gourmet Hub",
  "categoryId": "2c92e76f-239c-499c-b102-1f7df2b89a01",
  "state": "Lagos",
  "city": "Ikeja",
  "posSettings": {
    "loyaltyEnabled": true,
    "loyaltyRedeemThreshold": 150
  }
}
```

#### Sample Response (200 OK / 201 Created)
```json
{
  "id": "e44d32cf-0895-4c6c-94cc-1abcd56f8901",
  "name": "The Gourmet Hub",
  "uniqueCode": "BIZ983XYZ",
  "status": "active",
  "ownerId": "u89d342f-0985-4a6c-94cc-1abcd56f8901",
  "state": "Lagos",
  "city": "Ikeja",
  "posSettings": {
    "loyaltyEnabled": true,
    "loyaltyRedeemThreshold": 150
  },
  "createdAt": "2026-06-28T10:15:30.000Z",
  "updatedAt": "2026-06-28T10:15:30.000Z"
}
```

#### Error Scenarios
*   **401 Unauthorized:** Missing or invalid authorization token.
*   **403 Forbidden:** The user is authenticated but does not hold the `OWNER` role.
*   **409 Conflict:** Occurs if a phone number is provided that is already registered with another business.

---

## 2. Product Catalogue

### `POST /catalogue/items` & `PATCH /catalogue/items/:id`
*   **Description:** Extended to accept shipping/product details (weight, dimensions) and custom loyalty rules matching the frontend specifications.
*   **Access Level:** Owner, Manager, Staff, or Admin.
*   **Method & Endpoint:**
    *   `POST /api/v1/catalogue/items`
    *   `PATCH /api/v1/catalogue/items/:id`

#### Extended Fields in Payload & Entities
| Field | Type | Description | Sample Value |
| :--- | :--- | :--- | :--- |
| `weight` | `string` | Nullable string representing weight. | `"500 g"` |
| `dimensions` | `string` | Nullable string representing dimensions. | `"10x15x5 cm"` |
| `enableLoyaltyPoints` | `boolean` | Flag to enable or disable point earning on this product. | `true` |
| `loyaltyPointsValue` | `number` | The points awarded to the customer on purchasing. | `15` |
| `loyaltyPoints` | `number` | Legacy loyalty point count. Saved for backward compatibility. | `15` |

#### Sample Request (Create Catalogue Item)
```json
{
  "name": "Double Patty Beef Burger",
  "price": 4500,
  "shortDescription": "Savory double patty burger",
  "description": "Premium double patty beef burger with cheddar cheese and caramelized onions",
  "branchId": "b5b2d63d-a233-4123-8478-438acb679b32",
  "weight": "350 g",
  "dimensions": "12x12x8 cm",
  "enableLoyaltyPoints": true,
  "loyaltyPointsValue": 15
}
```

#### Sample Response (200 OK / 201 Created)
```json
{
  "id": "item-901e76f-239c-499c-b102-1f7df2b89a01",
  "name": "Double Patty Beef Burger",
  "price": 4500,
  "weight": "350 g",
  "dimensions": "12x12x8 cm",
  "enableLoyaltyPoints": true,
  "loyaltyPointsValue": 15,
  "loyaltyPoints": null,
  "status": "active",
  "createdAt": "2026-06-28T10:20:00.000Z"
}
```

---

## 3. POS Returns & Refunds

### `PATCH /pos/sales/:id/status`
*   **Description:** Processes a return and refund for a POS sale. Supports full refund or partial (item-level) refund, records a dedicated refund trail, automatically restores items to stock, and tracks the initiating staff member.
*   **Access Level:** Owner, Manager, or Admin.
*   **Method & Endpoint:** `PATCH /api/v1/pos/sales/:id/status`

#### Request Payload (`UpdatePosSaleStatusDto`)
| Field | Type | Required? | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | **Yes** | Must be `refunded` or `partial_refund`. |
| `reason` | `string` | No | Reason explaining the refund. |
| `refundItems` | `array` | No | List of items to refund. If omitted, a **Full Refund** is processed. |
| `refundItems[].saleItemId` | `string` (UUID) | **Yes** | Identifier of the specific `PosSaleItem` line to refund. |
| `refundItems[].quantity` | `number` | **Yes** | Number of units to refund. Must be $\ge 1$. |

#### Sample Request (Partial Refund)
```json
{
  "status": "partial_refund",
  "reason": "Customer wanted small size instead of large",
  "refundItems": [
    {
      "saleItemId": "5f9e5407-e777-c078-a82a-b08ffa209210",
      "quantity": 1
    }
  ]
}
```

#### Sample Response (200 OK)
```json
{
  "id": "sale-1abcd56f8901",
  "status": "partial_refund",
  "receiptNumber": "RCT-20260628-005",
  "total": 9000.00,
  "refundReason": "Customer wanted small size instead of large",
  "refundedById": "u89d342f-0985-4a6c-94cc-1abcd56f8901",
  "refundedAt": "2026-06-28T10:30:00.000Z",
  "items": [
    {
      "id": "5f9e5407-e777-c078-a82a-b08ffa209210",
      "productName": "Double Patty Beef Burger",
      "quantity": 2,
      "refundedQuantity": 1,
      "totalPrice": 9000.00
    }
  ],
  "refunds": [
    {
      "id": "ref-0c16f14d-6616-53c3-0c17-4a8fe2f00999",
      "reason": "Customer wanted small size instead of large",
      "type": "partial",
      "refundAmount": 4500.00,
      "refundedById": "u89d342f-0985-4a6c-94cc-1abcd56f8901",
      "createdAt": "2026-06-28T10:30:00.000Z"
    }
  ]
}
```

#### Error Scenarios
*   **400 Bad Request:**
    *   Initiated on a sale that is not `completed` or `partial_refund`.
    *   No `refundItems` provided when status is set to `partial_refund`.
    *   The quantity to refund exceeds the remaining unrefunded quantity for the line item.
*   **404 Not Found:**
    *   The sale does not exist for the current business.
    *   Specified `saleItemId` does not match any item on this sale.

---

## 4. Catalogue Order Returns & Refunds

### `PATCH /catalogue/orders/:id/status`
*   **Description:** Processes cancellations, full refunds, or partial (item-level) refunds for catalogue orders. Reverts stock deductions and logs refund metadata.
*   **Access Level:** Owner, Manager, Staff, or Admin.
*   **Method & Endpoint:** `PATCH /api/v1/catalogue/orders/:id/status`

#### Request Payload (`UpdateCatalogueOrderStatusDto`)
| Field | Type | Required? | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | **Yes** | `cancelled`, `rejected`, `refunded`, or `partial_refund`. |
| `reason` | `string` | No | Reason explaining the cancellation/refund. |
| `refundItems` | `array` | No | List of items to refund (for `partial_refund`). |
| `refundItems[].itemId` | `string` (UUID) | No | Target product item ID. |
| `refundItems[].offerId` | `string` (UUID) | No | Target offer ID. |
| `refundItems[].quantity` | `number` | **Yes** | Number of units to refund. Must be $\ge 1$. |

#### Sample Request (Full Refund)
```json
{
  "status": "refunded",
  "reason": "Out of stock or unavailable ingredients"
}
```

#### Sample Response (200 OK)
```json
{
  "id": "order-e44d32cf-0895-4c6c-94cc-1abcd56f8901",
  "status": "refunded",
  "totalAmount": 15000.00,
  "refundReason": "Out of stock or unavailable ingredients",
  "refundedById": "staff-u89d342f-0985",
  "refundedAt": "2026-06-28T10:35:00.000Z",
  "items": [
    {
      "id": "oi-5f9e5407-e777-c078-a82a-b08ffa209210",
      "quantity": 2,
      "refundedQuantity": 2,
      "priceAtOrder": 7500.00
    }
  ]
}
```

#### Error Scenarios
*   **400 Bad Request:**
    *   No `refundItems` provided when status is set to `partial_refund`.
    *   Requested refund quantity exceeds remaining item quantity.
*   **404 Not Found:** Order or requested line item does not exist.

---

## 5. Loyalty — Manual Points Award

### `POST /loyalty/earn/manual`

*   **Description:** Allows business owners and managers to manually award a specific number of loyalty points to one or more customers. The existing `POST /loyalty/earn` endpoint only supports visit-based earning (computes points from rules/spending). This new endpoint lets staff directly credit a chosen point amount — used for promotions, compensation, or one-off rewards.
*   **Access Level:** Owner or Manager role.
*   **Method & Endpoint:** `POST /api/v1/loyalty/earn/manual?branchId={branchId}`

#### Request Payload

| Field | Type | Required? | Description |
| :--- | :--- | :--- | :--- |
| `userId` | `string` (UUID) | **Yes** | The loyalty user ID (profile) to credit. |
| `points` | `number` | **Yes** | Number of points to award. Must be > 0. |
| `source` | `string` | No | Reason/origin: `"manual_award"`, `"promotion"`, `"compensation"`, etc. |
| `rewardId` | `string` (UUID) | No | ID of the reward program this award relates to (if any). |
| `awardedBy` | `string` (UUID) | No | Staff member performing the award (from auth token). |
| `notes` | `string` | No | Free-text note for audit trail. |

#### Sample Request
```json
{
  "userId": "usr-7bff4c44-e613-49ec-b4aa-ce2baaca1cf3",
  "points": 500,
  "source": "manual_award",
  "rewardId": "rwd-a1b2c3d4-e5f6-4g7h-8i9j-klmnopqrstuv",
  "notes": "Birthday bonus from manager"
}
```

#### Sample Response (201 Created)
```json
{
  "success": true,
  "pointsEarned": 500,
  "newBalance": 1500,
  "message": "500 points awarded successfully",
  "transactionId": "txn-9f8e7d6c-5b4a-3c2d-1e0f-fedcba987654"
}
```

#### Error Scenarios
*   **400 Bad Request:**
    *   `points` is missing, zero, or negative.
    *   `userId` does not exist or is not linked to this branch/business.
*   **401 Unauthorized:** Missing or invalid token.
*   **403 Forbidden:** User is not Owner or Manager.
*   **404 Not Found:** Loyalty profile not found for the given `userId` in this branch.
