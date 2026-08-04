# Frontend API Integration Guide: Uncommitted Backend Changes

This guide provides the complete, authoritative specification for all new and updated backend API endpoints included in the latest uncommitted changes. It details endpoint paths, HTTP methods, access permissions, request headers, TypeScript payload/response interfaces, field validation rules, and error conditions for the frontend team.

---

## Table of Contents
1. [Loyalty & Visitor APIs](#1-loyalty--visitor-apis)
   - [1.1 Earn Visitor Points (Public)](#11-earn-visitor-points-public)
   - [1.2 Legacy Earn Visitor Points (Public Alias)](#12-legacy-earn-visitor-points-public-alias)
   - [1.3 Get Public Redeemable Rewards](#13-get-public-redeemable-rewards)
   - [1.4 Get Single Reward Details](#14-get-single-reward-details)
   - [1.5 Visitor Signup with Auto-Login Auth Token](#15-visitor-signup-with-auto-login-auth-token)
2. [Marketplace Products, Quotes & Reviews APIs](#2-marketplace-products-quotes--reviews-apis)
   - [2.1 Query Published Products (Public, Filtered & Paginated)](#21-query-published-products-public-filtered--paginated)
   - [2.2 Query All Products (Admin)](#22-query-all-products-admin)
   - [2.3 Marketplace Product Quotes & Price Negotiations](#23-marketplace-product-quotes--price-negotiations)
   - [2.4 Product Reviews & Moderation](#24-product-reviews--moderation)
3. [Support Ticket File Attachments & Bot Escalation](#3-support-ticket-file-attachments--bot-escalation)
   - [3.1 Add Attachments to Support Ticket](#31-add-attachments-to-support-ticket)
   - [3.2 Support Bot Escalation to Human Agent](#32-support-bot-escalation-to-human-agent)
4. [System Status & Incident Management APIs](#4-system-status--incident-management-apis)
   - [4.1 Public System Status Dashboard](#41-public-system-status-dashboard)
   - [4.2 Admin Status Components Management](#42-admin-status-components-management)
   - [4.3 Admin System Incidents Management](#43-admin-system-incidents-management)

---

## 1. Loyalty & Visitor APIs

### 1.1 Earn Visitor Points (Public)
Allows public/unauthenticated visitor tap interfaces or forms to resolve or register a customer using an email or phone number and immediately award loyalty points for a branch visit or spend.

- **Endpoint:** `POST /loyalty/visitor/points/earn`
- **Access:** Public (No Bearer Token Required)
- **Content-Type:** `application/json`

#### Request Payload Interface (`VisitorPointsEarnDto`)
```typescript
export interface VisitorPointsEarnDto {
  email?: string;       // Customer email address
  phone?: string;       // Customer phone number
  firstName?: string;   // Optional first name (used if creating a new customer account)
  lastName?: string;    // Optional last name (used if creating a new customer account)
  branchId?: string;    // UUID of the branch
  branchCode?: string;  // Unique code of the branch (alternative to branchId)
  isVisit?: boolean;    // true if points are being awarded for a venue visit
}
```

#### Response Interface
```typescript
export interface VisitorPointsEarnResponse {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  message: string;
  customer: {
    id: string;
    uniqueCode: string;
  };
}
```

#### Example Response (`201 Created`)
```json
{
  "success": true,
  "pointsEarned": 50,
  "newBalance": 50,
  "message": "You earned 50 points!",
  "customer": {
    "id": "c6a2d63d-a233-4123-8478-438acb679b32",
    "uniqueCode": "CUST-948201"
  }
}
```

---

### 1.2 Legacy Earn Visitor Points (Public Alias)
Legacy compatibility endpoint for older public kiosks or QR scan pages.

- **Endpoint:** `POST /loyalty/earn?branchId={branchId}`
- **Access:** Public
- **Query Parameter:** `branchId` (string, required)

#### Request Payload Interface (`LegacyVisitorPointsEarnDto`)
```typescript
export interface LegacyVisitorPointsEarnDto {
  userId: string;       // Visitor email or phone number identifier
  businessId?: string; // Legacy identifier (ignored by backend)
  isVisit?: boolean;   // Whether points are awarded for a visit
}
```

#### Response Interface
Same as `VisitorPointsEarnResponse` above.

---

### 1.3 Get Public Redeemable Rewards
Retrieves a paginated list of active redeemable rewards for a business or branch, with support for searching, category filtering, and sorting.

- **Endpoints:** `GET /public/loyalty/rewards` or `GET /loyalty/rewards`
- **Access:** Public

#### Query Parameters (`RewardQueryDto`)
```typescript
export interface RewardQueryDto {
  branchId?: string;     // Filter by branch UUID
  businessId?: string;   // Filter by business UUID
  category?: string;     // Filter by category (e.g. FOOD_AND_BEVERAGE, DISCOUNT)
  search?: string;       // Search keyword in reward name/description
  sortBy?: 'createdAt' | 'pointsRequired' | 'name';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;         // Default: 1
  limit?: number;        // Default: 10
}
```

#### Response Interface
```typescript
export interface PublicRewardItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  pointsRequired: number;
  category?: string;
  coverImage?: string;
  galleryImages?: string[];
  totalQuantity?: number;
  remainingQuantity?: number;
  isActive: boolean;
  expiryDate?: string;
  businessId: string;
  branchId?: string;
  templateId?: string | null;
}

export interface PublicRewardsPaginatedResponse {
  data: PublicRewardItem[];
  total: number;
  page: number;
  limit: number;
}
```

---

### 1.4 Get Single Reward Details
Fetch details for a specific reward item by ID.

- **Endpoint:** `GET /loyalty/item-details/:id`
- **Access:** Public
- **URL Parameter:** `id` (string, UUID)

#### Response Interface
Returns a `PublicRewardItem` object.

---

### 1.5 Visitor Signup with Auto-Login Auth Token
Updated visitor registration endpoint. When a new customer registers via a public tap page or web signup form, the backend now automatically issues a JWT `access_token` and `sessionId` directly in the response payload.

- **Endpoints:** `POST /visitors` or `POST /visitors/signup`
- **Access:** Public

#### Request Payload Interface (`VisitorSignupDto`)
```typescript
export interface VisitorSignupDto {
  email: string;        // Customer email address (required)
  name?: string;        // Full name
  phone?: string;       // Phone number
  branchId?: string;    // Branch UUID where visitor signed up
  deviceId?: string;    // Device/NFC Tag UUID (optional)
}
```

#### Response Interface
```typescript
export interface VisitorSignupResponse {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  uniqueCode: string;
  branchId?: string;
  createdAt: string;
  // Automatically populated for newly created customers:
  access_token?: string; // JWT access token for immediate auto-login
  sessionId?: string;    // Active user session ID
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  isNewUser?: boolean;   // true if this call created a new customer account
}
```

> **Integration Note for Frontend:**
> When `access_token` is present in the response, the frontend can save the JWT to local storage/cookies and set the user as logged in immediately without prompting for credentials.

---

## 2. Marketplace Products, Quotes & Reviews APIs

### 2.1 Query Published Products (Public, Filtered & Paginated)
Public catalog endpoint supporting multi-field searching, category filtering (by ID, slug, or category name), min/max price range filtering, and flexible sorting.

- **Endpoint:** `GET /products`
- **Access:** Public

#### Query Parameters Interface (`ProductQueryDto`)
```typescript
export interface ProductQueryDto {
  search?: string;       // Searches product name and description
  category?: string;     // Product type ID, category name, or slug
  productTypeId?: string;// Legacy alias for category
  minPrice?: number;     // Minimum price filter
  maxPrice?: number;     // Maximum price filter
  sortBy?: 'createdAt' | 'price' | 'name' | 'rating' | 'moq'; // Default: 'createdAt'
  sortOrder?: 'ASC' | 'DESC'; // Default: 'DESC'
  page?: number;         // Page number (Default: 1)
  limit?: number;        // Items per page (Default: 10)
}
```

#### Response Interface
```typescript
export interface ProductTypeSummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  moq: number;           // Minimum Order Quantity
  status: 'published' | 'draft' | 'archived';
  rating: number;        // Average rating calculated from approved reviews
  reviewCount: number;   // Number of approved reviews
  images: string[];
  productType?: ProductTypeSummary;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProductsResponse {
  data: ProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

### 2.2 Query All Products (Admin)
Admin catalog query returning all products regardless of publication status.

- **Endpoint:** `GET /products/admin`
- **Access:** Admin (`UserRole.ADMIN`)
- **Headers:** `Authorization: Bearer <token>`

#### Query Parameters Interface (`AdminProductQueryDto`)
Inherits all fields from `ProductQueryDto`, plus:
```typescript
export interface AdminProductQueryDto extends ProductQueryDto {
  status?: 'published' | 'draft' | 'archived';
}
```

#### Response Interface
Returns `PaginatedProductsResponse`.

---

### 2.3 Marketplace Product Quotes & Price Negotiations

Marketplace quote endpoints allow customers, venue owners, and admins to request custom bulk price quotes, negotiate terms, and accept quotes into formal orders.

#### Permissions Matrix:
- `POST /products/:id/quote`: **CUSTOMER**, **OWNER**, **ADMIN**
- `GET /products/quotes/my`: **CUSTOMER**, **OWNER**, **ADMIN**
- `POST /products/quotes/:id/negotiate`: **ADMIN**, **OWNER**
- `POST /products/quotes/:id/accept`: **CUSTOMER**, **OWNER**
- `POST /products/quotes/:id/reject`: **CUSTOMER**, **OWNER**

#### Interfaces

```typescript
export interface RequestQuoteDto {
  quantity: number;     // Minimum order quantity requested
  location: string;     // Shipping / delivery destination
  businessName: string; // Business or company name
  notes?: string;       // Additional notes or requirements
}

export interface NegotiateQuoteDto {
  priceOffered: number; // Proposed price unit or total offer
  message?: string;     // Message attached to counter-offer
}

export interface QuoteNegotiationItem {
  id: string;
  priceOffered: number;
  message?: string;
  offeredBy: string;    // 'Admin' | 'Owner' | 'Customer'
  createdAt: string;
}

export interface QuoteDto {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  location: string;
  businessName: string;
  notes?: string;
  status: 'Pending' | 'Admin_Offered' | 'Owner_Offered' | 'Accepted' | 'Rejected';
  currentPrice: number | null;
  isNegotiable: boolean;
  negotiations?: QuoteNegotiationItem[];
  createdAt: string;
  updatedAt: string;
}
```

#### Endpoints Summary Table

| Method | Endpoint | Access Roles | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/products/:id/quote` | CUSTOMER, OWNER, ADMIN | `RequestQuoteDto` | `QuoteDto` |
| `GET` | `/products/quotes/my` | CUSTOMER, OWNER, ADMIN | None | `QuoteDto[]` |
| `GET` | `/products/quotes/all` | ADMIN | None | `QuoteDto[]` |
| `POST` | `/products/quotes/:id/negotiate` | ADMIN, OWNER | `NegotiateQuoteDto` | `QuoteDto` |
| `POST` | `/products/quotes/:id/accept` | CUSTOMER, OWNER | None | `OrderDto` (Creates pending order) |
| `POST` | `/products/quotes/:id/reject` | CUSTOMER, OWNER | None | `QuoteDto` (status: 'Rejected') |

---

### 2.4 Product Reviews & Moderation

#### 2.4.1 Submit Product Review (Public)
Public endpoint for submitting ratings and reviews for a product. Submissions enter a moderation queue (`pending`) for admin review.

- **Endpoint:** `POST /products/:id/reviews`
- **Access:** Public (Auth optional)
- **Headers:** Optional `Authorization: Bearer <token>`

#### Anti-Spam & Moderation Rules:
1. **Authenticated Users:** Limited to 1 review per product per account.
2. **Guest Users:** Limited to 1 review per product per IP address per 24 hours.
3. **Status:** All submitted reviews default to `pending` until approved by an admin.

#### Request Payload Interface (`CreateProductReviewDto`)
```typescript
export interface CreateProductReviewDto {
  rating: number; // Integer between 1 and 5
  comment: string;// Non-empty review text
  name?: string;  // Reviewer display name (defaults to User name or 'Anonymous')
}
```

#### Response Interface
```typescript
export interface ProductReviewSubmissionResponse {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}
```

---

#### 2.4.2 Fetch Approved Product Reviews (Public)
Retrieves paginated approved reviews for a specific product.

- **Endpoint:** `GET /products/:id/reviews`
- **Access:** Public
- **Query Parameters:** `page` (number, default: 1), `limit` (number, default: 10)

#### Response Interface
```typescript
export interface ApprovedProductReviewItem {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ApprovedProductReviewsResponse {
  data: ApprovedProductReviewItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

#### 2.4.3 Moderate Product Reviews (Admin)

Admin endpoints to list pending/approved/rejected reviews and update their status.

- **List Reviews:** `GET /products/reviews/pending?status={APPROVED|REJECTED|PENDING}&page=1&limit=10`
- **Approve Review:** `PATCH /products/reviews/:id/approve`
- **Reject Review:** `PATCH /products/reviews/:id/reject`
- **Set Status Explicitly:** `PATCH /products/reviews/:id/status` (Body: `{ status: 'APPROVED' | 'REJECTED' | 'PENDING' }`)

---

## 3. Support Ticket File Attachments & Bot Escalation

### 3.1 Add Attachments to Support Ticket
Allows customers and staff to upload images or document attachments to an existing support ticket. Sending an attachment creates a message containing the files and automatically re-opens tickets that were in `RESOLVED` or `CANCELLED` status.

- **Endpoint:** `POST /support/tickets/:id/attachments`
- **Access:** Ticket Owner (`CUSTOMER`, `STAFF`, `MANAGER`, `OWNER`)
- **Headers:** `Authorization: Bearer <token>`

#### Payload Validation Rules:
1. **Per-file Max Size:** `10 MB` (10,485,760 bytes). For base64 data URLs, backend calculates actual binary decoded length.
2. **Total Request Payload Max Size:** `25 MB` (26,214,400 bytes).
3. **Max Files Count:** Maximum `10` attachments per request.
4. **Data URIs & URLs:** Supports both hosted HTTP(S) file URLs and `data:` base64 strings.

#### Request Payload Interface (`AddTicketAttachmentsDto`)
```typescript
export interface TicketAttachmentDto {
  url: string;      // Public HTTP URL or base64 data URI (e.g. "data:image/png;base64,...")
  name: string;     // Original file name (e.g. "invoice.pdf")
  mimeType: string; // File MIME type (e.g. "image/png", "application/pdf")
  size: number;     // File size in bytes
}

export interface AddTicketAttachmentsDto {
  message?: string; // Optional caption message (defaults to "<attachment>")
  attachments: TicketAttachmentDto[]; // Array of 1 to 10 attachments
}
```

#### Response Interface (`TicketMessage`)
```typescript
export interface TicketMessageResponse {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
  message: string;
  attachments: TicketAttachmentDto[];
  createdAt: string;
}
```

---

### 3.2 Support Bot Escalation to Human Agent
Escalates an automated support bot chat session into an open support ticket assigned to live human agents.

- **Endpoint:** `POST /support/escalate`
- **Access:** Public or Authenticated

#### Request Payload Interface
```typescript
export interface EscalateChatDto {
  initialMessage?: string; // Initial user message or context summary
  guestName?: string;      // Required for guest users
  guestEmail?: string;     // Required for guest users
  sessionId?: string;      // Active bot session ID
}
```

#### Response Interface
```typescript
export interface EscalationResponse {
  id: string;
  ticketNumber: string;
  status: 'OPEN' | 'IN_PROGRESS';
  createdAt: string;
  message: string;
}
```

---

## 4. System Status & Incident Management APIs

### 4.1 Public System Status Dashboard
Serves real-time system component metrics, recent active or resolved incidents, and 90-day overall uptime calculations to populate the public status page (`/status`).

- **Endpoint:** `GET /status`
- **Access:** Public

#### Response Interface
```typescript
export type ComponentStatus = 
  | 'Operational' 
  | 'Degraded Performance' 
  | 'Partial Outage' 
  | 'Major Outage' 
  | 'Under Maintenance';

export interface SystemComponentPayload {
  name: string;
  status: ComponentStatus;
  uptime: string; // e.g. "99.99%"
  load: string;   // e.g. "12ms" latency indicator
}

export interface SystemIncidentPayload {
  id: string;
  title: string;
  description: string;
  componentSlug?: string;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  occurredAt: string;
  resolvedAt?: string | null;
}

export interface PublicStatusResponse {
  overall: 'operational' | 'degraded' | 'outage';
  systems: SystemComponentPayload[];
  incidents: SystemIncidentPayload[];
  uptime90d: string;   // e.g. "99.98%"
  lastUpdated: string; // ISO 8601 string
}
```

#### Example Response (`200 OK`)
```json
{
  "overall": "operational",
  "systems": [
    {
      "name": "NFC Response API",
      "status": "Operational",
      "uptime": "99.99%",
      "load": "12ms"
    },
    {
      "name": "Loyalty Engine",
      "status": "Operational",
      "uptime": "100.00%",
      "load": "18ms"
    }
  ],
  "incidents": [],
  "uptime90d": "99.98%",
  "lastUpdated": "2026-08-04T22:00:00.000Z"
}
```

---

### 4.2 Admin Status Components Management
CRUD endpoints for configuring system components on the status dashboard.

- **Base Path:** `/admin/status/components`
- **Access:** Admin (`UserRole.ADMIN`)
- **Headers:** `Authorization: Bearer <token>`

#### Request Interfaces
```typescript
export interface CreateSystemComponentDto {
  slug: string;        // Unique slug (e.g. "nfc-response-api")
  name: string;        // Display name
  status?: ComponentStatus;
  latencyMs?: number;  // Current response latency in ms
  uptime90d?: string;  // 90-day uptime string (e.g. "99.95%")
  sortOrder?: number;  // Ascending sort order index
  isActive?: boolean;  // Default: true
}

export interface UpdateSystemComponentDto {
  name?: string;
  status?: ComponentStatus;
  latencyMs?: number;
  uptime90d?: string;
  sortOrder?: number;
  isActive?: boolean;
}
```

#### Endpoints Summary
- `POST /admin/status/components`: Create or upsert status component.
- `GET /admin/status/components`: List all system components.
- `PATCH /admin/status/components/:id`: Update component by ID.
- `DELETE /admin/status/components/:id`: Remove component by ID.

---

### 4.3 Admin System Incidents Management
CRUD endpoints for tracking active and past outages or degraded performance incidents.

- **Base Path:** `/admin/status/incidents`
- **Access:** Admin (`UserRole.ADMIN`)
- **Headers:** `Authorization: Bearer <token>`

#### Request Interfaces
```typescript
export interface CreateIncidentDto {
  title: string;
  description: string;
  componentSlug?: string;
  severity?: 'minor' | 'major' | 'critical';
  status?: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  occurredAt?: string; // Defaults to current ISO timestamp
  resolvedAt?: string; // ISO timestamp when resolved
}

export interface UpdateIncidentDto {
  title?: string;
  description?: string;
  componentSlug?: string;
  severity?: 'minor' | 'major' | 'critical';
  status?: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  occurredAt?: string;
  resolvedAt?: string;
}
```

#### Endpoints Summary
- `POST /admin/status/incidents`: Create new incident record.
- `GET /admin/status/incidents`: List all incidents.
- `PATCH /admin/status/incidents/:id`: Update incident status/details.
- `DELETE /admin/status/incidents/:id`: Delete incident record.

---

## 5. Summary of Frontend Integration Action Items

1. **Auto-Login on Visitor Signup:** Check response of `POST /visitors` and `POST /visitors/signup` for `access_token` and auto-authenticate new users.
2. **Product Filtering & Sorting UI:** Update product catalog components to consume `GET /products` query params (`search`, `category`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`).
3. **Marketplace Quotes:** Enable Quote Requests and Negotiation UI for `CUSTOMER`, `OWNER`, and `ADMIN` roles across `/products/:id/quote`, `/products/quotes/my`, and counter-offer negotiation endpoints.
4. **Product Reviews:** Update product detail page to display review statistics (`rating`, `reviewCount`), list approved reviews from `GET /products/:id/reviews`, and handle review submissions via `POST /products/:id/reviews`.
5. **Support Attachments:** Add file attachment support to support chat ticket UI using `POST /support/tickets/:id/attachments` with client-side checks for 10 MB per-file and 25 MB total request limits.
6. **System Status Page:** Connect `/status` page to `GET /status` endpoint and implement admin management views for components and incidents.
