# Technical Architecture - Vemtap

The Vemtap project is built as a TypeScript monorepo using **Turbo** and **PNPM**.

## Tech Stack

-   **Backend**: NestJS 11+, Node 22+
-   **Frontend**: Next.js (Turbo)
-   **Database**: PostgreSQL
-   **ORM**: TypeORM 0.3+
-   **Cache**: Redis (via BullMQ and Cache Manager). The global cache store is configured in `app.module.ts` (`CacheModule.registerAsync`): it uses `redisStore` from `cache-manager-redis-yet` pointing at `REDIS_URL`, but if Redis is unreachable at boot the `useFactory` catches the `ECONNREFUSED` and falls back to the in-memory store so the API still boots (caches are non-authoritative; BullMQ/queue retries continue independently). Cache invalidation already tolerates a non-Redis store via the `keys()` fallback.
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
-   **Hierarchy & type**: clusters carry a `type` (`country|state|market|building|custom`, default `market`), an optional self-referencing `parentId` (tree for the admin UI), and `country`/`state`/`city`/`area` metadata. These are metadata-only — they don't change deals/auto-assign logic. All fields are accepted in `CreateClusterDto`/`UpdateClusterDto` and returned by `GET /admin/clusters` and `GET /admin/clusters/:id` (detail also returns a `parent` summary). Creating/updating a cluster validates that the parent exists and is not itself.
-   **Branches** have a nullable `clusterId` (one cluster per branch, indexed `idx_branches_cluster`); a PostGIS trigger keeps `clusters.location` in sync with lat/lng (same pattern as branches).
-   **Pinned offers** (`cluster_offers` table): admin-curated deals via `GET /admin/clusters/:id/offers` → `{ autoMatched[], pinned[], total }` and `PATCH /admin/clusters/:id/offers/:offerId` `{ pinned }`. `autoMatched` = active offers from member branches with `business.status = ACTIVE` (same candidate query as the public feed, so suspended businesses drop out of both); `pinned` rows force those offers to always appear in the public deals feed and rank first (oldest pin first), regardless of the active sort. Pin/unpin invalidates the cluster's deal cache. Unpinning toggles the row's `isPinned` flag (the row is kept, not soft-deleted) so re-pinning the same offer never collides with the unique `(clusterId, offerId)` constraint.
-   **Public endpoints** (`@Public()`):
    - `GET /clusters/context/:uniqueCode` — scan resolver; returns cluster + member branches; increments `scanCount`; returns `qrActive:false` when the QR is deactivated.
    - `GET /clusters/:uniqueCode/deals` — active deals from all member branches with filters (`categoryId`, `search`) and sorts (`fair` default rotation, `newest`, `price_asc/desc`, `distance_asc/desc`). Distance reference is the customer's `lat`/`lng` when provided, else the cluster center. Only offers from `ACTIVE` businesses are returned. `total` is the true eligible count (computed via a join-free count query), not the fetched page size — it is never capped by the internal 1000-offer fetch limit. A non-UUID `x-visit-session-token` header is rejected with 400 (same convention as the rotator events endpoint).
-   **Fair rotation**: default ordering rotates which branch leads every 15-minute bucket via `stableHash(clusterId + bucket) % memberCount`; deterministic within a bucket so it stays cache-friendly.
-   **Admin endpoints** (`@Roles(UserRole.ADMIN)` under `admin/clusters`): CRUD, branch add/remove, `auto-assign` (nearest `ST_DWithin` match, `dryRun` preview, `scope: unassigned|all` to also reassign already-assigned branches to closer covering clusters, `async: true` to run on the worker), `qrIsActive` toggle via `PATCH` (deactivate/activate a cluster QR), and the offers pin/unpin routes above.
-   **Auto-assign background worker**: a `cluster-auto-assign` BullMQ queue + `ClusterAutoAssignProcessor` (`concurrency: 1`) runs the same assignment algorithm off the request path. `@Cron` jobs in `ClustersService` enqueue a `scope: unassigned` run every 15 minutes and a `scope: all` (reassign) run every hour. A single fixed `jobId` dedups overlapping runs regardless of trigger (cron, admin `async: true`, restart). Reassignments never unassign a branch, and both the old and new cluster caches are invalidated after a run.
-   **Tap context** (`GET /tap/context/:code`) now includes an additive `cluster` block when the branch belongs to one.
-   **Cache keys** (Redis): `cluster:context:{uniqueCode}` (1h), `cluster:deals:{uniqueCode}:{bucket}:{hash}:{page}` (15min). Offer mutations invalidate the relevant cluster via `ClustersService.invalidateForBranch(branchId)` (hooked into `CatalogueOfferService.clearCache`).

### 7. Loyalty — Manual Points Award
-   `POST /api/v1/loyalty/earn/manual?branchId={branchId}` — Owner/Manager manually credits a customer (`userId`) with a specific point amount. Body: `userId`, `points` (> 0), optional `source` (`manual_award|promotion|compensation`), `rewardId`, `awardedBy` (falls back to the authenticated caller), `notes`. It bypasses the active-loyalty-rule requirement (explicit grant). Returns `{ success, pointsEarned, newBalance, message, transactionId: "txn-…" }` (201), 400/401/403/404 on failure. This complements the visit-only public `POST /loyalty/earn` flow.

### 8. Smart Deal Rotator
-   **Purpose**: Admin-controlled, cache-backed, cluster-level deal rotation. When a customer scans a cluster QR, the Rotator (not the QR) decides which deals fill the featured positions. Default is **automatic**; admin may override per cluster (`AUTOMATIC = DEFAULT, MANUAL = OVERRIDE`). No per-customer selection in V1 — everyone in the same **rotation window** (60s default, `windowSeconds`) sees the same result.
-   **Module**: `apps/backend/src/modules/rotator` (`RotatorService`, `RotatorEligibilityService`, `RotatorEngineService`, `RotatorAnalyticsService`, `RotatorCacheService`, `RotatorInvalidationService`, `RotatorRefreshProcessor`, entities, DTOs). `ClustersModule` imports `RotatorModule`.
-   **Entities** (migration `AddSmartDealRotator`): `rotator_configs` (global defaults singleton — mode, distribution, slots mode/count, internal `windowSeconds`, `frequencyWindowHours`), `rotator_cluster_configs` (per-cluster override, unique `clusterId`, `isOverridden`, `resetAt`), `rotator_cluster_offers` (manual-mode membership `included` + deal-level `deliveryOverride`/`weight`), `rotator_deal_schedules` (recurring `dayOfWeek` + `startTime`/`endTime` windows, optional date bounds), `rotator_rotation_records` (window history: `windowId`, `offerIds` jsonb, `slotCount`; unique per `(clusterId, windowId)` — concurrent duplicate writes are silently ignored), `rotator_impressions` (event analytics: `eventType` impression/view/click, `customerId`, `sessionToken`). The global-config singleton is DB-enforced (migration `AddRotatorConfigSingleton`: unique index on a constant + dedupe of pre-existing duplicates) — concurrent replicas racing to create the row are safe: `getGlobalConfig`/`onModuleInit` catch the 23505 unique violation and adopt the winner's row instead of failing.
-   **Hierarchy**: Global default → Cluster override → (QR later) → Deal override. Most specific non-null wins. `Reset to Automatic` clears the cluster override + manual memberships.
-   **Config precedence & validation**: global DTOs (`UpdateRotatorGlobalConfigDto`) accept `rotationMode` (automatic|manual), `distribution` (balanced|weighted|scheduled|`smart` reserved), `featuredSlotsMode` (automatic|manual), `featuredSlotCount` (1–12), `windowSeconds` (10–3600), `frequencyWindowHours`. Cluster DTO allows the same minus windowSeconds (inherited). `SetClusterOfferIncludedDto` (`included`), `SetClusterOfferDeliveryDto` (`deliveryOverride` + `weight` 1–5), `UpsertDealScheduleDto` (HH:mm times + dayOfWeek + dates), `PreviewRotationDto` (`windows` 1–10).
-   **Rotation engine**: builds the eligible pool (active business + active offer + cluster match + not expired beyond current window + schedule active + `joinDiscoveryNetwork`/`allowPromotions` + manual-mode membership) → orders by distribution (balanced lead-rotation via `stableHash(clusterId + windowId) % memberCount`, weighted, scheduled) → computes slots automatically from eligible count (2–6) or manual count → never pads with duplicates. `rotator_rotation_records` persists each window's selection. The admin `why`/explain path uses the same `windowEnd = now + windowSeconds*1000` as the live pool (not a fixed 60s buffer), so "expired" verdicts match the feed exactly.
-   **Caching**: Layer 1 `rotator:pool:{clusterId}` (60s TTL) = eligible deal pool; Layer 2 `rotator:result:{clusterId}:{windowId}` = current window selection. `getCurrentResult` resolves the windowId from the (TTL-cached) global config first and returns the cached result without any DB reads on a hit — the cluster row is only loaded when the window result must be (re)generated. The global config singleton is itself cached in-memory for 30s (`getGlobalConfig`, invalidated on admin update/reset) so the deals hot path does zero DB reads for rotation on cache hits. Cache invalidation enumerates keys via the Redis SCAN cursor iterator (falling back to `keys()` only for stores without one), so it never blocks the keyspace. Event-driven invalidation via `RotatorInvalidationService` on: offer create/pause/expire (hooked through `ClustersService.invalidateForBranch`, already wired to `CatalogueOfferService.clearCache`), cluster update/membership change, auto-assign, rotator config changes, and business suspend/reactivate (`BusinessesService.suspend/reactivate` → `invalidateForBusiness`).
-   **Public surface**: `GET /clusters/:uniqueCode/deals` returns an additive `featured: Deal[]` array (current window selection, rotator order leads the `fair` sort) plus `rotationWindowId`. The deals cache is keyed by the rotator `windowId` **plus the request `limit`** (plus category/search/sort/location), so a cached page never serves a stale window's featured set nor a different page size, and it honours the `x-visit-session-token` header (same convention as the tap flow, UUID-validated with a 400 on malformed values) so impression rows dedupe per `(sessionToken, windowId, offerId)` and unique-reach analytics work. Impression **enqueues** are additionally deduped in `recordImpressions` per `(cluster, window, visitor)` (tokenless guests collapse to an `anon` bucket, TTL = one rotation window) so repeat page views in the same window don't fan out a job per request. `POST /clusters/:uniqueCode/events` (public, no auth) records a customer `view`/`click` against a deal via `RotatorService.recordClusterEvent` (validates the deal belongs to the cluster AND is `ACTIVE`, not expired, not yet-started, has an `ACTIVE` business, and is branch-discoverable — `isActive` + `joinDiscoveryNetwork` + `allowPromotions`; rejects non-UUID `x-visit-session-token` headers, forwards the session token; a client-supplied `windowId` is only trusted within ±1 of the server-computed current window, otherwise it falls back to server resolution) and returns only `{ success, offerId }` — the internal `clusterId` is never exposed to anonymous clients. Both impressions and `view`/`click` events persist asynchronously via the `rotator-refresh` BullMQ queue (`RotatorRefreshProcessor`, concurrency 5) — the request path only validates and enqueues (window id resolved at enqueue time), never writes. Worker-side `view`/`click` writes are idempotent per `(sessionToken, windowId, offerId)` when a session token is present; `persistImpressions` dedupes and inserts the whole batch in a single `find` + `save` pair (no per-offer N+1). Queue jobs keep **failed jobs** (`removeOnFail: false`, 5 attempts with exponential backoff) instead of silently dropping them, so stuck events are visible in the BullMQ UI. The Layer 1 `rotator:pool` cache is read on the live generate path (only admin preview forces a fresh pool). Full-cluster cache invalidation after a global config change paginates deterministically (`order: { id: 'ASC' }`), so no cluster is skipped across batches.
-   **Admin endpoints** (`@Roles(UserRole.ADMIN)`): `GET|PUT /admin/rotator/config`, `POST /admin/rotator/config/reset`; cluster scoped `GET|PUT /admin/clusters/:id/rotator`, `POST /admin/clusters/:id/rotator/reset`, `GET /admin/clusters/:id/rotator/eligibility`, `PUT /admin/clusters/:id/rotator/offers/:offerId` (include/exclude), `PUT /admin/clusters/:id/rotator/offers/:offerId/delivery` (weight), `GET /admin/clusters/:id/rotator/offers/:offerId/why` (per-condition eligibility), `GET /admin/clusters/:id/rotator/preview?windows=N`, `GET|PUT|DELETE /admin/clusters/:id/rotator/schedules/:offerId` (+ `/:scheduleId`), and analytics `GET /admin/clusters/:id/rotator/analytics/{summary|offers|windows}`. Every `:id`, `:offerId` and `:scheduleId` path param is validated with `@ParseUUIDPipe`, so malformed ids fail fast with a 400 instead of a Postgres 500.
-   **Deliberately deferred**: per-customer frequency suppression (analytics only), QR-level override (no QR entity yet), Boost Deal (weights are the extension point), AI `smart` mode.
-   **Analytics semantics**: the cluster summary endpoint's scan figure is `lifetimeScans` (the lifetime `scanCount` counter — no per-scan history is stored, so it is intentionally NOT scoped to the `days` window), while impressions/views/clicks/redemptions/unique-people are all `days`-scoped.
