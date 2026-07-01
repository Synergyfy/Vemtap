# POS Offline Sync & Idempotency System Documentation

This document explains the syncing of offline transactions from the POS client to the backend API. It details the payload interfaces, response formats, samples, and the client-side guidelines for handling offline sales.

---

## 1. Core Mechanics

To support reliable offline operations and prevent duplicate records due to network retries, the backend implements two key features:

1. **Idempotency with `clientRef`:**
   * Every sale generated on the client (whether online or offline) should be assigned a client-side generated **UUIDv4** called `clientRef`.
   * The database maintains a unique constraint on the combination of `(businessId, clientRef)`.
   * If the backend receives a transaction with a `clientRef` that has already been successfully recorded for the business, it will return the existing sale details immediately without deducting stock again or creating a duplicate sale.

2. **Accurate Timestamps with `orderedAt`:**
   * When a sale is completed offline, the client records the actual date/time of the sale and sends it in the `orderedAt` field (ISO-8601 string).
   * The backend will record the sale using the client's `orderedAt` date rather than the server's insertion timestamp (`createdAt`), keeping register session histories and dashboard analytics accurate.
   * **Future Date Protection:** If `orderedAt` is more than 10 minutes in the future (e.g. client device clock is incorrect), the backend overrides it to the current server time.

---

## 2. API Endpoints

### Endpoint A: Batch Sync Offline Sales (`POST /pos/sales/batch-sync`)
Used to sync a queue of unsynced offline transactions once the POS terminal detects an internet connection.

#### Request Payload Interface (TypeScript)
```typescript
export interface CreatePosSaleItemDto {
  productId: string;        // UUID of the product
  quantity: number;         // Quantity purchased
  discount?: number;        // Fixed discount amount applied to this line item (default 0)
}

export interface SplitPaymentDto {
  method: 'cash' | 'transfer' | 'card';
  amount: number;
}

export interface PaymentDetailsDto {
  method: 'cash' | 'transfer' | 'card' | 'split';
  amountPaid: number;       // The total amount given by the customer
  change?: number;          // Cash change returned to the customer (default 0)
  splitDetails?: SplitPaymentDto[]; // Required if method is 'split'
}

export interface CreatePosSaleDto {
  branchId: string;         // UUID of the current branch
  items: CreatePosSaleItemDto[];
  payment: PaymentDetailsDto;
  cartDiscountAmount?: number; // Discount applied to the entire cart (default 0)
  customerId?: string;      // Optional UUID of a registered loyalty customer
  hideCustomerInfoOnReceipt?: boolean; // Default false
  notes?: string;           // Cashier notes
  clientRef?: string;       // REQUIRED for offline syncing (Client-generated UUIDv4)
  orderedAt?: string;       // REQUIRED for offline syncing (ISO-8601 string of actual sale time)
}

// Request is an array of CreatePosSaleDto
export type BatchSyncRequest = CreatePosSaleDto[];
```

#### Request Payload Sample
```json
[
  {
    "branchId": "e3b8a36c-9411-4770-b1ff-92135c345388",
    "clientRef": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "orderedAt": "2026-06-29T15:30:00.000Z",
    "items": [
      {
        "productId": "8f8303f2-1279-450f-a496-c67b84db96c4",
        "quantity": 2,
        "discount": 500
      }
    ],
    "payment": {
      "method": "cash",
      "amountPaid": 10000,
      "change": 1000
    },
    "cartDiscountAmount": 0,
    "notes": "Offline sale synced later"
  },
  {
    "branchId": "e3b8a36c-9411-4770-b1ff-92135c345388",
    "clientRef": "8c2578ef-d130-4e59-a292-a1f945d8b8fc",
    "orderedAt": "2026-06-29T16:00:00.000Z",
    "items": [
      {
        "productId": "invalid-product-uuid",
        "quantity": 1
      }
    ],
    "payment": {
      "method": "card",
      "amountPaid": 5000
    }
  }
]
```

#### Response Interface (TypeScript)
The batch sync endpoint processes sales individually so that a single corrupted or invalid sale doesn't cause the entire sync to fail. The response returns an array showing the status of each synced item.

```typescript
export interface BatchSyncResult {
  clientRef: string | null; // The clientRef sent in the request
  success: boolean;         // True if the sale was created or already existed
  saleId?: string;          // UUID of the completed sale (if successful)
  error?: string;           // Error message (if failed)
}

export type BatchSyncResponse = BatchSyncResult[];
```

#### Response Sample
```json
[
  {
    "clientRef": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "saleId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "success": true
  },
  {
    "clientRef": "8c2578ef-d130-4e59-a292-a1f945d8b8fc",
    "success": false,
    "error": "Product invalid-product-uuid not found"
  }
]
```

---

### Endpoint B: Single Sale completion (`POST /pos/sales`)
This endpoint is used for completing a single sale in real-time, but also supports the offline headers `clientRef` and `orderedAt` if the client needs to retry a single failed query.

#### Request Payload Interface & Sample
Same as a single item of the batch query (`CreatePosSaleDto`).

#### Response Interface
Returns the full [PosSaleResponse](file:///c:/Users/Azeem/Documents/github/Mcom/vemtap-workspace/apps/VemTap/services/pos/types.ts#L32) representing the completed sale details.

---

## 3. Client Implementation Checklist

The frontend POS team should implement the following flow to handle offline sales:

1. **Detect Offline State:**
   * Monitor internet status (`window.navigator.onLine` and API call timeouts).
2. **Generate and Save Unsynced Sales Locally:**
   * When completing a sale offline, generate a unique `clientRef` using `crypto.randomUUID()` (or a fallback UUID generator).
   * Record the current timestamp in `orderedAt`.
   * Store the request payload into an offline queue (e.g. inside **IndexedDB** or **localStorage** under an `unsynced_sales` key).
   * Present a success receipt to the user with the offline transaction status.
3. **Trigger Background Sync:**
   * When internet connectivity is restored, read all unsynced items from local storage.
   * Send the items in a batch to `POST /pos/sales/batch-sync`.
   * Parse the response:
     * For items returned with `"success": true`, delete them from local storage.
     * For items returned with `"success": false` and an error, mark them as "Sync Failed" with the specific reason (e.g. insufficient stock) for the manager to review or override manually.
