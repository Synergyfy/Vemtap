# Technical Architecture - Vemtap

The Vemtap project is built as a TypeScript monorepo using **Turbo** and **PNPM**.

## Tech Stack

-   **Backend**: NestJS 11+, Node 22+
-   **Frontend**: Next.js (Turbo)
-   **Database**: PostgreSQL
-   **ORM**: TypeORM 0.3+
-   **Cache**: Redis (via BullMQ and Cache Manager)
-   **Auth**: Passport JWT + Social (Google)
-   **Messaging**: Twilio, WhatsApp API, Socket.io
-   **Observability**: OpenTelemetry, Pino Logging

## Project Structure

-   **`apps/backend`**: The core NestJS API service.
    -   `src/modules`: Feature-based modular architecture (Loyalty, Catalogue, Businesses, Affiliates, etc.).
    -   `src/common`: Shared guards, filters, interceptors, and decorators.
    -   `src/database`: TypeORM migrations and data source configuration.
-   **`apps/VemTap`**: The primary Next.js dashboard/frontend.
    -   `components/admin`: Platform-level management components.
    -   `components/business`: Business-specific operational components.

## Key Technical Patterns

### 1. Request Lifecycle (Backend)
1.  **Global Middleware**: Helmet, Compression, CORS.
2.  **Guards** (Ordered): 
    - `ThrottlerGuard`: Rate limiting.
    - `JwtAuthGuard`: JWT validation.
    - `ImpersonationGuard`: SUDO / Admin Viewer context injection.
    - `CustomerImpersonationGuard`: Acting as a customer.
    - `UserStatusGuard`: Status verification (Active, Pending, Suspended).
    - `RolesGuard`: Role-based access control (RBAC).
    - `SubscriptionGuard`: Plan-based feature gating.
3.  **Interceptors**: `ClassSerializerInterceptor` (DTO cleanup), `ObservabilityLoggingInterceptor`.
4.  **Filters**: `AllExceptionsFilter` for unified error responses.

### 2. Impersonation System (AMIS / SUDO Mode)
-   Uses the `x-impersonation-token` header and `AdminViewerBanner` component.
-   The `ImpersonationGuard` resolves the actor and target branch context.
-   Actions performed under SUDO mode are strictly audited for security.

### 3. Messaging & Jobs
-   Asynchronous tasks (Email, SMS, WhatsApp) are handled via **BullMQ** with Redis.
-   Real-time updates are pushed via **Socket.io**.
-   **Twilio** and **WhatsApp API** are the primary external communication providers.

### 4. Account Security & Sessions
-   Authenticated logins create persisted `UserSession` records for linked-device management.
-   JWTs include a session identifier; revoked sessions are rejected by `JwtStrategy`.
-   TOTP secrets are encrypted at rest and 2FA is confirmed before enablement.
-   Notification and Alert Matrix preferences are persisted on the user record.

### 5. Branch Username System
-   Branches can have a unique `username` field (3-30 chars, lowercase, alphanumeric + hyphens).
-   Access branch UBL page via `/b/[username]` instead of `/[slug]/[deviceCode]`.
-   New endpoint: `GET /tap/context-by-username/:username` returns the same context as `/tap/context/:code`.
-   Username validation includes reserved word checking and uniqueness enforcement.
-   Auto-generation from branch name if not provided during creation.

### 6. Market Clusters & Cluster QR Codes
-   **`Cluster` entity** (`clusters` table): a geographic market area (e.g., Banex, Apo Zone E) with center `latitude`/`longitude`, PostGIS `location` (GIST index), `radiusMeters`, and a unique `uniqueCode` (`CL-` + 9 chars) that **is** the cluster QR identifier — no QR image is stored, the frontend renders it.
-   **Branches** have a nullable `clusterId` (one cluster per branch, indexed `idx_branches_cluster`); a PostGIS trigger keeps `clusters.location` in sync with lat/lng (same pattern as branches).
-   **Public endpoints** (`@Public()`):
    - `GET /clusters/context/:uniqueCode` — scan resolver; returns cluster + member branches; increments `scanCount`; returns `qrActive:false` when the QR is deactivated.
    - `GET /clusters/:uniqueCode/deals` — active deals from all member branches with filters (`categoryId`, `search`) and sorts (`fair` default rotation, `newest`, `price_asc/desc`, `distance_asc/desc`). Distance reference is the customer's `lat`/`lng` when provided, else the cluster center.
-   **Fair rotation**: default ordering rotates which branch leads every 15-minute bucket via `stableHash(clusterId + bucket) % memberCount`; deterministic within a bucket so it stays cache-friendly.
-   **Admin endpoints** (`@Roles(UserRole.ADMIN)` under `admin/clusters`): CRUD, branch add/remove, `auto-assign` (nearest `ST_DWithin` match, `dryRun` preview), and `qrIsActive` toggle via `PATCH` (deactivate/activate a cluster QR).
-   **Tap context** (`GET /tap/context/:code`) now includes an additive `cluster` block when the branch belongs to one.
-   **Cache keys** (Redis): `cluster:context:{uniqueCode}` (1h), `cluster:deals:{uniqueCode}:{bucket}:{hash}:{page}` (15min). Offer mutations invalidate the relevant cluster via `ClustersService.invalidateForBranch(branchId)` (hooked into `CatalogueOfferService.clearCache`).
