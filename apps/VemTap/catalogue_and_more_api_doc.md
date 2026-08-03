# Comprehensive Backend API Specification & Documentation — Pushed Changes (2026-08-01)

This document serves as an exhaustive, production-grade technical specification for all backend API endpoints, DTO schemas, data models, validation constraints, sample request payloads, query parameters, response structures, and error conditions developed and pushed on **August 1, 2026**.

---

## 📋 Table of Contents

1. [Overview & Commit Summary](#1-overview--commit-summary)
2. [Module 1: Bulk Catalogue Import (`POST /catalogue/items/bulk`)](#2-module-1-bulk-catalogue-import-post-catalogueitemsbulk)
3. [Module 2: Knowledge Base Module (`/knowledge-base`)](#3-module-2-knowledge-base-module-knowledge-base)
   * [Public Tree & Page Retrieval](#public-tree--page-retrieval)
   * [Admin CMS CRUD Operations](#admin-cms-crud-operations)
4. [Module 3: Affiliate & Line Manager Backend (`affiliate-vemtap`)](#4-module-3-affiliate--line-manager-backend-affiliate-vemtap)
   * [Platform Settings (`/settings`)](#platform-settings-settings)
   * [Market Mapping (`/market-mapping`)](#market-mapping-market-mapping)
   * [Line Manager & Network (`/network`)](#line-manager--network-network)
   * [Operations Command (`/operations`)](#operations-command-operations)
   * [User Profile & Onboarding (`/users`)](#user-profile--onboarding-users)
   * [Commissions & Withdrawals (`/commissions` & `/withdrawals`)](#commissions--withdrawals-commissions--withdrawals)
   * [Fraud Monitor (`/fraud`)](#fraud-monitor-fraud)
   * [Training Academy (`/training`)](#training-academy-training)
   * [Notifications (`/notifications`)](#notifications-notifications)
5. [Global Security, Guards & Error Code Standard](#5-global-security-guards--error-code-standard)

---

## 1. Overview & Commit Summary

### Main Application Repository (`vemtap-workspace`)
* **Branch**: `feat/bulk-import-and-knowledge-base`
* **Commit**: `0ff2dd72` — `feat(backend): implement bulk catalogue import and knowledge base module`
* **Key Features**:
  1. **Bulk Catalogue Import API**: Batch item ingestion with automated category resolution, batch & database duplicate SKU/barcode detection, and row-by-row error reporting up to 1000 items.
  2. **Knowledge Base Module**: Hierarchical entity model (`KbCategory`, `KbSection`, `KbPage`), public endpoints for nested tree rendering and slug/path resolution, and admin CRUD endpoints with path uniqueness enforcement and cascade deletions.
  3. **Database Migration**: `20260801160000-CreateKnowledgeBaseTables`.

### Affiliate Network Repository (`affiliate-vemtap`)
* **Branch**: `feat/agents-dashboard-api`
* **Commits**: `89bd407`, `6a0c405`, `bdd625d`
* **Key Features**:
  1. **Platform Settings**: Persistence for 5 recurring subscription commission settings.
  2. **Market Mapping**: Mission planning, territory stats, cluster notes, exportable CSV reports with injection protection, and admin cluster hierarchy CRUD.
  3. **Line Manager Network**: Team member detail, target adjustments with `$transaction` auditing (`TargetAdjustmentHistory`), and earnings aggregation.
  4. **Notifications & Training**: Practice results JSON storage, unread metrics, and bulk read operations.

---

## 2. Module 1: Bulk Catalogue Import (`POST /catalogue/items/bulk`)

* **Route**: `POST /catalogue/items/bulk`
* **Controller**: `AdminCatalogueController`
* **Guards**: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`
* **Roles Allowed**: `OWNER`, `MANAGER`, `ADMIN`
* **Permissions Required**: `'catalogue'`, `'inventory'`
* **Description**: Processes batch import of up to 1,000 catalogue items for a business branch. Automatically resolves or creates missing item categories per business, validates duplicate SKUs and barcodes (within payload and database), applies standard defaults (`status: ACTIVE`, `itemType: PRODUCT`, `discountType: NONE`), and resolves branch fallbacks.

### Request Body Schema (`BulkImportItemsDto`)

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `branchId` | `string` | No | Target branch UUID. Falls back to user's assigned branch if omitted. | UUID v4 |
| `items` | `BulkImportItemRowDto[]` | Yes | Array of item rows to import. | Min 1, Max 1000 items |

#### `BulkImportItemRowDto` Fields

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `name` | `string` | Yes | Item display name | Non-empty string |
| `price` | `number` | Yes | Item unit price | Number ≥ 0 |
| `shortDescription` | `string` | No | Brief item summary | Optional string |
| `description` | `string` | No | Detailed item description | Optional string |
| `category` | `string` | No | Category name (auto-created if non-existent) | Optional string |
| `stockQuantity` | `number` | No | Initial stock quantity | Number ≥ 0 |
| `sku` | `string` | No | Stock Keeping Unit | Business-scoped unique string |
| `barcode` | `string` | No | EAN/UPC barcode number | Business-scoped unique string |

### Sample Request Payload
```json
{
  "branchId": "e1f2a3b4-5678-90ab-cdef-1234567890ab",
  "items": [
    {
      "name": "Wireless Ergonomic Mouse",
      "price": 49.99,
      "shortDescription": "2.4GHz Ergonomic Mouse",
      "description": "High precision wireless optical mouse featuring 6 programmable buttons.",
      "category": "Electronics",
      "stockQuantity": 150,
      "sku": "WEM-2026-BLK",
      "barcode": "0793573192014"
    },
    {
      "name": "USB-C Fast Cable 2m",
      "price": 14.50,
      "shortDescription": "Braided Nylon 60W USB-C Cable",
      "description": "Durable cable supporting Power Delivery up to 60W.",
      "category": "Electronics",
      "stockQuantity": 300,
      "sku": "CBL-USBC-2M",
      "barcode": "0793573192021"
    }
  ]
}
```

### Sample Response (`201 Created`)
```json
{
  "createdCount": 2,
  "failedCount": 0,
  "totalProcessed": 2,
  "results": [
    {
      "row": 2,
      "success": true,
      "itemId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
    },
    {
      "row": 3,
      "success": true,
      "itemId": "b2c3d4e5-f6a7-8901-bcde-2345678901bc"
    }
  ]
}
```

### Sample Partial Error Response (`201 Created` with Row Failures)
```json
{
  "createdCount": 1,
  "failedCount": 1,
  "totalProcessed": 2,
  "results": [
    {
      "row": 2,
      "success": true,
      "itemId": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
    },
    {
      "row": 3,
      "success": false,
      "error": "Duplicate SKU: WEM-2026-BLK"
    }
  ]
}
```

### Error Scenarios & HTTP Statuses
* **`400 Bad Request`**:
  * Payload items array is empty or > 1000: `"Items array must contain between 1 and 1000 items"`.
  * Missing target branch ID: `"Branch ID is required"`.
  * Invalid/unauthorized branch ID: `"Branch not found or unauthorized"`.
* **Row-Level Errors** (contained inside `results[].error`):
  * `"Missing or invalid item name"`
  * `"Invalid price"`
  * `"Duplicate SKU in request: <sku>"`
  * `"Duplicate SKU: <sku>"`
  * `"Duplicate barcode in request: <barcode>"`
  * `"Duplicate barcode: <barcode>"`
* **`401 Unauthorized`**: JWT token missing or expired.
* **`403 Forbidden`**: Role or permission check failed.

---

## 3. Module 2: Knowledge Base Module (`/knowledge-base`)

The Knowledge Base system organizes documentation into a 3-tier hierarchy: **Categories ➔ Sections ➔ Pages**.

---

### Public Tree & Page Retrieval

Base Path: `/knowledge-base`  
Guards: `@Public()` (Unauthenticated)

#### 1. `GET /knowledge-base`
* **Description**: Returns the full structured category, section, and page hierarchy tree for rendering sidebars/menus. Sorted ascending by `order` then `title`.
* **Query Parameters**: None
* **Sample Response (`200 OK`)**:
```json
{
  "categories": [
    {
      "id": "c1a2b3c4-5678-90ab-cdef-1234567890ab",
      "title": "Getting Started",
      "order": 0,
      "sections": [
        {
          "id": "s1a2b3c4-5678-90ab-cdef-1234567890ab",
          "title": "POS Setup",
          "order": 0,
          "pages": [
            {
              "id": "p1a2b3c4-5678-90ab-cdef-1234567890ab",
              "title": "Initial Configuration",
              "path": "pos/initial-setup",
              "summary": "Quick setup guide for POS hardware.",
              "thumbnail": "https://cdn.vemtap.com/kb/thumb.jpg",
              "order": 0
            }
          ]
        }
      ]
    }
  ]
}
```

#### 2. `GET /knowledge-base/pages/by-path`
* **Description**: Retrieves full page content by unique route slug/path.
* **Query Parameters**: `path` (Required string, e.g., `?path=pos/initial-setup`)
* **Sample Response (`200 OK`)**:
```json
{
  "id": "p1a2b3c4-5678-90ab-cdef-1234567890ab",
  "title": "Initial Configuration",
  "path": "pos/initial-setup",
  "summary": "Quick setup guide for POS hardware.",
  "thumbnail": "https://cdn.vemtap.com/kb/thumb.jpg",
  "blocks": [
    { "type": "heading", "text": "Step 1: Power On" },
    { "type": "text", "text": "Connect power adapter..." },
    { "type": "steps", "items": ["Plug in cable", "Press power button"] }
  ],
  "tips": [
    "Ensure network connection is active for automatic updates."
  ],
  "categoryId": "c1a2b3c4-5678-90ab-cdef-1234567890ab",
  "sectionId": "s1a2b3c4-5678-90ab-cdef-1234567890ab",
  "order": 0
}
```
* **Error Responses**:
  * `400 Bad Request`: `"Path parameter is required"`
  * `404 Not Found`: `"Knowledge base page with path 'pos/initial-setup' not found"`

#### 3. `GET /knowledge-base/pages/:id`
* **Description**: Retrieves full page content by UUID primary key.
* **Path Parameter**: `id` (UUID format)
* **Sample Response (`200 OK`)**: Same payload as `by-path`.
* **Error Responses**: `404 Not Found`: `"Knowledge base page not found"`.

---

### Admin CMS CRUD Operations

Base Path: `/knowledge-base`  
Guards: `JwtAuthGuard`, `RolesGuard`  
Roles Allowed: `ADMIN`

#### Category Management

##### `POST /knowledge-base/categories`
* **Description**: Creates a new root category.
* **Payload (`CreateKbCategoryDto`)**:
  ```json
  {
    "title": "POS & Terminal Hardware",
    "order": 1
  }
  ```
* **Response (`201 Created`)**: Returns created `KbCategory` entity.

##### `PATCH /knowledge-base/categories/:id`
* **Payload (`UpdateKbCategoryDto`)**: `{ "title": "Hardware & Devices", "order": 2 }`
* **Response (`200 OK`)**: Updated entity.
* **Errors**: `404 Not Found`: `"Category not found"`.

##### `DELETE /knowledge-base/categories/:id`
* **Response (`200 OK`)**: Removed entity. Cascades deletion to child sections and pages.
* **Errors**: `404 Not Found`: `"Category not found"`.

---

#### Section Management

##### `POST /knowledge-base/sections`
* **Payload (`CreateKbSectionDto`)**:
  ```json
  {
    "title": "Receipt Printers",
    "categoryId": "c1a2b3c4-5678-90ab-cdef-1234567890ab",
    "order": 0
  }
  ```
* **Response (`201 Created`)**: Created `KbSection` entity.
* **Errors**: `400 Bad Request`: `"Specified category does not exist"`.

##### `PATCH /knowledge-base/sections/:id`
* **Payload (`UpdateKbSectionDto`)**: `{ "title": "Thermal & BT Printers", "order": 1 }`
* **Errors**: `404 Not Found`: `"Section not found"`, `400 Bad Request`: `"Specified category does not exist"`.

##### `DELETE /knowledge-base/sections/:id`
* **Response (`200 OK`)**: Removed entity. Cascades deletion to child pages.
* **Errors**: `404 Not Found`: `"Section not found"`.

---

#### Page Management

##### `POST /knowledge-base/pages`
* **Payload (`CreateKbPageDto`)**:
  ```json
  {
    "title": "Pairing Bluetooth Receipt Printers",
    "path": "hardware/bt-printers",
    "summary": "Setup instructions for wireless thermal printing.",
    "thumbnail": "https://cdn.vemtap.com/kb/bt.jpg",
    "blocks": [
      { "type": "heading", "text": "Pairing Process" },
      { "type": "text", "text": "Enable Bluetooth in POS Settings..." }
    ],
    "tips": ["Keep device within 5 meters during initial pairing."],
    "categoryId": "c1a2b3c4-5678-90ab-cdef-1234567890ab",
    "sectionId": "s1a2b3c4-5678-90ab-cdef-1234567890ab",
    "order": 0
  }
  ```
* **Response (`201 Created`)**: Created `KbPage` entity.
* **Errors**:
  * `409 Conflict`: `"Page with path 'hardware/bt-printers' already exists"`.
  * `400 Bad Request`: `"Specified category does not exist"` or `"Specified section does not exist"`.

##### `PATCH /knowledge-base/pages/:id`
* **Payload (`UpdateKbPageDto`)**: Partial properties of `CreateKbPageDto`.
* **Errors**: `404 Not Found`: `"Page not found"`, `409 Conflict`: `"Page with path '...' already exists"`.

##### `DELETE /knowledge-base/pages/:id`
* **Response (`200 OK`)**: Removed entity.
* **Errors**: `404 Not Found`: `"Page not found"`.

---

## 4. Module 3: Affiliate & Line Manager Backend (`affiliate-vemtap`)

---

### Platform Settings (`/settings`)

* **`GET /settings`**: Retrieves system settings including 5 recurring subscription commission fields (`recurringAgentCommission`, `recurringAffiliateCommission`, `recurringLineManagerCommission`, `recurringDurationMonths`, `recurringYear2Rate`).
* **`PATCH /settings`**: Updates platform commission parameters and invalidates global backend cache.
* **`GET /settings/agreement`** (`@Public()`): Returns terms HTML template and version.
* **`PATCH /settings/agreement`**: Updates agreement HTML template and increments version.

---

### Market Mapping (`/market-mapping`)

* **`GET /market-mapping/config`**: Returns user cluster assignment defaults.
* **`GET /market-mapping/territory`**: Aggregates mapped businesses, active leads, and penetration rate %.
* **`GET / POST / PATCH /market-mapping/plans`**: Mission planning CRUD.
* **`GET / POST /market-mapping/notes`**: Note attachments to business records.
* **`GET /market-mapping/reports` & `/reports/download`**: Generates report data and CSV download (`Content-Type: text/csv`) with double-quote escaping to prevent CSV injection.
* **Admin Hierarchy Endpoints** (`/market-mapping/admin/hierarchy`, `/assignments`, `/editor-config`): Manage 5-tier region/cluster tree, affiliate assignments, and custom pipeline stage configs.

---

### Line Manager & Network (`/network`)

* **`GET /network/recruits`**: Paginated list of downline recruits with commission totals.
* **`GET /network/stats`**: Aggregated downline earnings and milestone unlock status.
* **`GET /network/team-member/:id`**: Profile and target adjustment history. Enforces reporting hierarchy validation (IDOR security check).
* **`POST /network/update-targets`**: Updates downline targets. Runs atomic Prisma `$transaction` updating `User` and recording audit entry into `TargetAdjustmentHistory`.
  * **Payload**: `{ "memberId": "uuid", "dailyLeadTarget": 15, "monthlyConversionTarget": 30, "reason": "Q3 Realignment" }`
* **`GET /network/earnings-history` & `/team-reports`**: Historical performance analytics.

---

### Operations Command (`/operations`)

* **`GET /operations/reports/hierarchy`**: 5-tier location filter tree.
* **`GET /operations/reports/aggregates`**: Live compute of lead, conversion, and revenue metrics across database tables.
* **`GET /operations/reports/detail`**: Historical trend time series and audit logs.

---

### User Profile & Onboarding (`/users`)

* **`PATCH /users/profile`**: Profile details, bank details, and onboarding flags (`isTourCompleted`, `driversLicense`).
* **Admin Endpoints**: Territory assignment (`PATCH /users/:id/locations`), direct email/system notification dispatch (`POST /users/:id/send-email`), target override with audit logging (`PATCH /users/:id/targets`), and line manager re-assignment (`PATCH /users/:id/assign-manager`).

---

### Commissions & Withdrawals (`/commissions` & `/withdrawals`)

* **`GET /commissions/admin/stats` & `/export`**: Global commission breakdown and CSV export.
* **`GET /withdrawals/stats`**: Withdrawal payout status metrics.

---

### Fraud Monitor (`/fraud`)

* **`GET /fraud/stats`**: Fraud alert metrics and high-risk accounts.
* **`GET / PATCH /fraud/guard-status`**: Fraud score sensitivity threshold adjustment.

---

### Training Academy (`/training`)

* **`PATCH /training/modules/:id/progress`**: Updates module progress, accepts `practiceResults` JSON scenario scores, and automatically stamps completion date (`completedAt`).

---

### Notifications (`/notifications`)

* **`GET /notifications/unread-count`**: Unread count metric.
* **`PATCH /notifications/read-all`**: Bulk marks all notifications read.
* **Admin Draft Endpoints** (`GET / POST /notifications/drafts`, `DELETE /notifications/:id`): Broadcast draft management.

---

## 5. Global Security, Guards & Error Code Standard

All endpoints enforce standard NestJS HTTP exceptions:

| HTTP Status | Exception Class | Cause |
|---|---|---|
| `400 Bad Request` | `BadRequestException` | Validation failure, out-of-range DTO value, or invalid UUID format. |
| `401 Unauthorized` | `UnauthorizedException` | Missing, malformed, or expired JWT bearer token. |
| `403 Forbidden` | `ForbiddenException` | Insufficient user role/permission or IDOR hierarchy check failure. |
| `404 Not Found` | `NotFoundException` | Target entity ID or route path does not exist. |
| `409 Conflict` | `ConflictException` | Unique constraint violation (e.g. duplicate path, SKU, barcode, email). |
| `500 Internal Error` | `InternalServerErrorException` | Database query or unhandled exception. |

---
*Documentation compiled and published on 2026-08-01.*
