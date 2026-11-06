# Vemtap API — Integration Guide & Complete Endpoint Reference

Compiled from the NestJS backend source (`apps/backend`). **131 controllers · 1,000 registered HTTP endpoints (986 distinct routes) · 470 DTO classes.**

**Contents**

1. [Base URL & environments](#1-base-url--environments)
2. [Authentication](#2-authentication)
3. [Request rules](#3-request-rules)
4. [Response conventions](#4-response-conventions)
5. [Pagination](#5-pagination)
6. [File uploads](#6-file-uploads)
7. [Real-time: SSE & WebSockets](#7-real-time-sse--websockets)
8. [Inbound webhooks](#8-inbound-webhooks)
9. [Client integration patterns](#9-client-integration-patterns)
10. [Common flow recipes](#10-common-flow-recipes)
11. [Endpoint map — full reference](#11-endpoint-map--full-reference)
12. [Special & non-CRUD endpoints](#12-special--non-crud-endpoints)
13. [DTO field reference](#13-dto-field-reference)

---

## 1. Base URL & environments

Every route lives behind the global prefix **`/api/v1`** (`main.ts:53`). Local default port **3002**.

| Environment | Base URL | Source |
|---|---|---|
| Local | `http://localhost:3002/api/v1` | `apps/backend/.env` (`PORT=3002`) |
| Test | `https://testapi.vemtap.com/api/v1` | web default `apps/VemTap/lib/api.ts:2`, mobile live tests |
| Dev | `https://api.dev.vemtap.com` | `vemtap-app/.env.example` |
| Staging | `https://api.staging.vemtap.com` | `vemtap-app/.env.staging` |
| Production | `https://api.vemtap.com` | `backend/docs/verification-and-trial-integration.md` |

- **Interactive docs:** Swagger UI at **`/api-docs`** (Bearer auth, `persistAuthorization: true`).
- **CORS:** `origin: true, credentials: true` (any origin reflected, cookies allowed). `helmet()` + `compression()` enabled.
- **Body limits:** JSON/urlencoded **25 MB**; the raw body is retained for webhook HMAC verification.
- **TLS:** none in-process — terminated upstream (Vercel/ALB). Health: `GET /api/v1/health` (⚠ requires a JWT — not `@Public`).

## 2. Authentication

### Mechanism
JWT Bearer tokens via `passport-jwt`. Send either:

```
Authorization: Bearer <access_token>
```

or `?token=<access_token>` query param (used where headers are impossible — e.g. `EventSource`). Extractor: `modules/auth/strategies/jwt.strategy.ts`.

- **Expiry:** `JWT_EXPIRATION` = **7 days** (dev/test env uses `1h`).
- **No refresh endpoint.** A `401` is terminal for the session — re-login. (Official clients treat 401 as session-expired.)
- Every login creates a server-side session; its id is embedded in the token as `sid`, enabling revocation via the users/sessions endpoints.

**Token payload:**
```json
{
  "email": "owner@biz.ng",
  "sub": "<userId>",
  "role": "Owner",
  "branchId": null,
  "businessId": null,
  "referralCode": null,
  "sid": "<sessionId>"
}
```
- `businessId: null` explicitly = customer-scoped token for a dual-role owner (set server-side on registration/upgrade).

### Roles
`SUPER_ADMIN` · `ADMIN` · `OWNER` · `MANAGER` · `STAFF` · `AGENT` · `CUSTOMER` · `USER`
User status: `Active | Inactive | Invited | Pending | Suspended` — suspended users get **403** ("Your account has been suspended…") from the global `UserStatusGuard`.

### Global guard chain (runs in order, every request)
1. `ThrottlerGuard` (rate limit)
2. `JwtAuthGuard` — bypassed only by `@Public()` routes
3. `ImpersonationGuard` — activates when `x-impersonation-token` header present
4. `CustomerImpersonationGuard` — activates when `x-customer-impersonation-token` present
5. `UserStatusGuard`
6. `RolesGuard` (`@Roles(...)`, method decorator overrides class)
7. `SubscriptionGuard` — skipped on `@SkipSubscriptionCheck()` routes
8. `CapabilityGuard`

Optional per-controller guards: `PermissionsGuard` (`@Permissions(...)`; OWNER/ADMIN bypass, ANY-match), `BusinessVerifiedGuard`, `TrialRestrictionGuard`, `AnalyticsLevelGuard`, `IntegrationApiKeyGuard` (header `x-vemtap-api-key` vs env `VEMTAP_INTEGRATION_KEY`, fails closed).

### Password / OTP rules
- Registration passwords: `@IsStrongPassword` — min 8, upper, lower, number, symbol.
- `POST /auth/change-password`: `newPassword` only needs **≥ 6** (weaker than registration — known inconsistency).
- Email OTP: **4 digits** (`VerifyOtpDto` length 4–6 in email-verify); customer OTP/PIN: **6 digits**; 2FA codes: 6 digits. OTP expiry: **10 minutes**.
- Role strings are case-normalized (`'owner'` → `Owner`); customer emails are trimmed + lowercased.

## 3. Request rules

- **Content-Type:** `application/json` for all bodies (multipart only for the 2 upload routes). GET params go in the query string.
- **Validation (global `ValidationPipe`):** `whitelist: true`, `transform: true`, **`forbidNonWhitelisted: true`**, implicit conversion enabled.
  - ⚠ **Unknown fields are rejected with 400**, not silently stripped.
  - Query strings coerce to numbers/booleans (`?limit=20`, `?allBranches=true`).
  - Several booleans accept the string `'true'` via `@Transform`.
  - Array fields such as subscription `addonIds` also accept a CSV string (`"a,b,c"`).
  - `@ValidateIf` makes some fields conditionally required (e.g. cart `itemId` **xor** `offerId`).
- **Idempotency:** the mobile client sends an optional `Idempotency-Key: <uuid>` header on mutations (no server-side enforcement — safe client practice).
- **Rate limits:** global **60 requests / 60 s**. Overrides: `POST /ai/analyze` = **10/min**, `POST /sponsored/events` = 60/min. Exceeding → `429`.

## 4. Response conventions

### Success
There is **no global success wrapper** — handlers return their payload directly (typically `{ ...fields }` or `{ data, total, page, limit }`). The `{ success: true, data }` envelope exists but is **opt-in** per route via `@FosEnvelope()` (used by the `fos-*` platform back-office controllers — those routes return `{ success: true, data: ... }`).

### Errors — global `AllExceptionsFilter`
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-10-16T12:00:00.000Z",
  "path": "/api/v1/bookings",
  "method": "POST",
  "error": "Bad Request",
  "message": "date must be in the future"
}
```
`message` is a **string** for runtime errors and a **string[]** for validation failures — clients should handle both.

PostgreSQL driver errors are mapped:

| PG code | HTTP | Message |
|---|---|---|
| `22P02` invalid uuid/format | 400 | "Invalid format or data type for identifier or parameter" |
| `23505` unique violation | 409 | driver `detail` or "A record with this identifier or unique value already exists" |
| `23503` FK violation | 400 | driver `detail` or "Referenced record does not exist…" |
| `22001` value too long | 400 | "Value provided is too long for the field length" |
| other | 500 | "Internal server error" |

**Request id:** every response carries an **`x-request-id`** header (from `request-id.middleware`) — log it for support.

## 5. Pagination

**Request** (most list endpoints): `?page=1&limit=10` (`page ≥ 1`, `limit ≥ 1`; module caps are usually 50/100/200). Some modules use `perPage` instead of `limit`. Cursor-paginated feeds accept `cursor` / `nextCursor`.

**Response shapes differ by endpoint** — always check the DTO in §13:

| Shape | Example |
|---|---|
| `{ data, total, page, limit }` | bookings, visits, savings (`+ totalSavedAmount`) |
| `{ data, total, page, limit, cursor, nextCursor, hasNextPage }` | public offer feed (`GET /catalogue/offers/public`) |
| `{ items, meta: { total, page, limit, totalPages } }` | categories |
| `{ data, total, page, limit, totalPages, hasNextPage, hasPrevPage }` | products |
| **Bare array** | several legacy/customer lists — omitting `page`+`limit` on `GET /me/claims` and `GET /me/gifts` returns a bare array |

## 6. File uploads

| Route | Auth | Limit | Accepts |
|---|---|---|---|
| `POST /api/v1/uploads` | JWT (OWNER/MANAGER/ADMIN/CUSTOMER, `@SkipSubscriptionCheck`) | **4 MB** | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` — field name **`file`**, `multipart/form-data` |
| `POST /api/v1/customer/messaging/media` | JWT CUSTOMER | **10 MB** | JPG/PNG/WebP → returns `{ url }` for use as `mediaUrl` |

Storage: Cloudinary (`upload_stream`), folders `vemtap/{avatars,users,messaging,businesses,verification}/`. Both return hosted URLs to reference in later payloads.

Ticket attachments differ: `POST /support/tickets/:id/attachments` takes **JSON** `TicketAttachmentDto[]` (`url` = public URL *or* base64 data URL, plus `name`, `mimeType`, `size` bytes).

## 7. Real-time: SSE & WebSockets

**SSE** — `GET /api/v1/observability/stream` (admin only; 1 total SSE route).
EventSource cannot set headers → use the query token:

```ts
const es = new EventSource(`${BASE_URL}/observability/stream?token=${jwt}`);
es.onmessage = e => console.log(JSON.parse(e.data)); // ObservabilityRequestLog
```
Payload fields: `id, traceId, timestamp, method, url, route, statusCode, responseTime, ip, userAgent, userId, userEmail, queryParams, requestBody (≤512 chars), error?`. Only `data:` frames — no named events.

**WebSockets** (Socket.IO, **outside** `/api/v1`, CORS `origin:'*'`): namespaces `/` (events), `/messaging`, `/support`, `/notifications`. Authenticate with `{ auth: { token, Authorization: 'Bearer <jwt>' } }`.

## 8. Inbound webhooks

All are external → Vemtap; configure these URLs in the provider dashboards.

| Provider | Route | Verification | Response |
|---|---|---|---|
| **Paystack** | `POST /api/v1/payments/webhook` | Header `x-paystack-signature` = **HMAC-SHA512 hex of the raw body** with `PAYSTACK_SECRET_KEY`; missing/bad → 400 | Always `200 { status: "success" }` after verification (so Paystack stops retrying even on processing errors). Handles `charge.success`, `bank.transfer.rejected`; activation is idempotent per `reference` |
| **bytID** (KYC) | `POST /api/v1/verification/webhooks/bytid` | Header `Bytid-Signature: t=<unix>,v1=<hex>` = **HMAC-SHA256 of `"<t>.<raw body>"`** with `BYTID_WEBHOOK_SECRET`, 300 s replay tolerance, timing-safe compare; bad → 401 | `200 { received: true }` |
| **Twilio** (WhatsApp) | `POST /api/v1/messaging/webhook/twilio` | Header `x-twilio-signature` via Twilio's URL+params scheme with `TWILIO_AUTH_TOKEN` — **enforced only when `NODE_ENV === 'production'`** | `200 { status: "success" \| "ignored" }` |
| **QR-Thrive** | `POST /api/v1/integration/qr-thrive/callback` | Header **`x-vemtap-api-key`** = `VEMTAP_INTEGRATION_KEY` (401 if missing/wrong; fails closed if unset) | `200 { status: "success", message: "Callback received" }` — events `user.synced`, `scan.milestone`, `branding.update` (log-only) |

Notes: raw-body capture is wired in `main.ts` (`json({ verify: (req) => req.rawBody = buf })`) precisely for these HMACs. There is **no** Termii or Meta/WhatsApp-Cloud webhook implemented (`TERMII_API_KEY` exists in `.env` but is unused in code).

**Outbound payment verification:** clients poll `GET /api/v1/payments/verify/:reference` (OWNER/ADMIN) after a checkout redirect.

## 9. Client integration patterns

Two official clients show the canonical patterns.

### Mobile (axios + zod) — `vemtap-app/src/api/client.ts`
```ts
export const apiClient = axios.create({
  baseURL: API_BASE_URL,            // `${EXPO_PUBLIC_API_BASE_URL}/v1`
  timeout: 15000,                   // EXPO_PUBLIC_API_TIMEOUT_MS
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use(async config => {
  const headers = AxiosHeaders.from(config.headers);
  const accessToken = await getSecureItem('accessToken');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (config._idempotencyKey) headers.set('Idempotency-Key', config._idempotencyKey);
  return { ...config, headers };
});
```
- Base URL has **no guessed default** — missing `EXPO_PUBLIC_API_BASE_URL` fails loudly (`API_NOT_CONFIGURED`).
- Errors are normalized against the envelope into `ApiError { code, status, details, requestId }`; `requestId` falls back to the `x-request-id` header; 401 → session-expired bridge.
- Responses validated at the boundary with zod (`requestValidated`) → `SCHEMA_MISMATCH` on shape drift.

```ts
// canonical call site
async login(input: LoginInput): Promise<Session> {
  return requestValidated({ method: 'POST', url: '/auth/login', data: input,
                            idempotencyKey: createIdempotencyKey() }, sessionSchema);
}
```

### Web (fetch) — `apps/VemTap/lib/api.ts`
```ts
export const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
// default when unset → 'https://testapi.vemtap.com/api/v1'
```
Token from `localStorage['auth-storage-v2']` → `Authorization: Bearer`. 401 clears storage + redirects to `/login`; 403 `"subscription expired"` / `"feature is not enabled for your plan"` map to dedicated UI stores. Impersonation headers when acting as a user: `x-customer-impersonation-token`, `x-impersonation-token`, `X-VemTap-Sudo-Ticket`.

### Minimal integration checklist
1. Point the client at `<origin>/v1` (never append `/api/v1` twice).
2. Attach `Authorization: Bearer <jwt>` on every non-`@Public` call; handle **401 by re-login** (no refresh).
3. Send `Accept: application/json`; handle `message` as string **or** string[].
4. Log `x-request-id` on failures.
5. Respect the 60 req/min limit; back off on 429.
6. Omit unknown body fields — they cause 400 (`forbidNonWhitelisted`).
7. Send `Idempotency-Key` on POSTs that create resources.
8. Validate response shapes (zod/TS types) per endpoint — envelopes differ.

## 10. Common flow recipes

All paths are relative to `/api/v1`. `⏎` = response is the JSON body.

**Owner registration (2-step OTP)**
```
POST /auth/register/owner/request-otp   { firstName, lastName, email, phone?, role: "Owner" }   → { message }
POST /auth/register/owner               { email, password, businessName, categoryId, ... }      → AuthResponseDto
```
`AuthResponseDto` = `{ access_token, sessionId, user: { id, role, businessId, branchId, referralCode, ... }, isNewUser? }`. Registering an owner with no plan auto-subscribes the business to the free plan.

**Customer signup with PIN**
```
POST /auth/customer/register/request-otp   { firstName?, lastName?, email, phone?, branchId? }   → { message }
POST /auth/customer/register/verify-and-set-pin  { email, code, pin: "123456", firstName?, lastName?, branchId? }  → AuthResponseDto
```

**Login / role switching**
```
POST /auth/login         { identifier, password, twoFactorCode? }   → AuthResponseDto
POST /auth/switch-role   { role: "Customer" | "Owner" | ... }       → AuthResponseDto (fresh token)
GET  /auth/profile                                                  → current user
```
Dual-role users hold two scopes; switching issues a new token whose `businessId` is `null` for the customer scope.

**Browse catalogue (public, no token)**
```
GET /public/catalogue/items/branch/:branchId?page&limit   → items with branch prices applied
GET /public/catalogue/items/:id                            → single item
GET /catalogue/offers/public?search&lat&lng&radius&page&cursor   → deal feed (cursor paginated)
```

**Booking a service**
```
GET  /bookings/availability?branchId=<uuid>&date=YYYY-MM-DD[&itemId=<uuid>]   → slots   [PUB]
POST /bookings  { branchId, itemId?, date: "YYYY-MM-DD", time: "HH:mm", notes? }  → BookingResponseDto  [CUSTOMER]
       time must sit on the 30-minute grid, date cannot be in the past
GET  /me/bookings?page&limit&status                                          → customer's bookings
PATCH /bookings/:id/cancel  { cancellationReason? ≤300 }                     → [CUSTOMER]
PATCH /bookings/:id/status  { status }                                       → [business staff]
```

**Claim a deal (OTP flow)**
```
POST /catalogue/offers/claim/request  { offerId, firstName, lastName?, email, phone }   [PUB]  → OTP sent
POST /catalogue/offers/claim/verify   { ... }                                            → claim + code
POST /catalogue/offers/claim/redeem/:code                                               → staff at POS
```

**Cart → checkout**
```
POST /catalogue/cart/items   { branchId, itemId? | offerId?, quantity? }   [CUSTOMER]
GET  /catalogue/cart/summary
POST /catalogue/cart/checkout { branchId, notes?, tableNumber?, deviceId? }
```
Guest carts merge with `POST /catalogue/cart/merge { branchId, items[] }` after login.

**Files**
```
POST /uploads   multipart field "file" (≤4 MB)  → hosted URL
```

## 11. Endpoint map — full reference

Format (used throughout the two tables below):

```
### <controller file>
## <ClassName> — /<prefix>          ← full path = /api/v1 + prefix + row path
   auth: <class-level tag>          ← rows without {…} inherit this
VERB /path {override} [Dtos] → service.method()
```
- **PUB** = `@Public()` (global JWT guard skipped; explicit guards may still apply) · **JWT** = authenticated.
- Roles: `ADM` ADMIN · `SADM` SUPER_ADMIN · `OWN` OWNER · `MGR` MANAGER · `STF` STAFF · `AGT` AGENT · `CUS` CUSTOMER.
- Modifiers: `+perm(x)` `@Permissions`+PermissionsGuard · `+SkipSub` `@SkipSubscriptionCheck()` · `+AllowPending` · `+BizVer` BusinessVerifiedGuard · `+Trial` TrialRestrictionGuard · `+Lvl` AnalyticsLevelGuard · `+ApiKey` IntegrationApiKeyGuard · `+Env` response wrapped `{success,data}` · `+File` multipart upload · `+SSE` Server-Sent Events.
- `[A,B]` = DTO-typed values in the handler signature (request DTOs are validated by the global pipe; response DTOs are marked by name, `…ResponseDto` / `…PageDto`). Field-level detail for each is in [§13](#13-dto-field-reference).
- `→ a.b()` = service methods called; no arrow = handler returns `req.user` / a constant / a redirect.

### 11.1 Endpoint table — app.controller → fos-messaging


### src/app.controller.ts
## AppController — /
   auth: JWT
GET /public-test {PUB}
GET / {PUB} → appService.getHello()

### src/modules/ad-wallet/ad-wallet.controller.ts
## AdWalletController — /ad-wallet
   auth: JWT:OWN,MGR
GET / → walletService.getSummary()
GET /transactions [AdWalletTransactionsQueryDto] → walletService.listTransactions()
GET /invoices [AdWalletInvoicesQueryDto] → invoicesService.list()
GET /invoices/:id → invoicesService.get()
GET /prepacks → walletService.getPrepacks()
POST /top-up [AdWalletTopUpDto] → walletService.startTopUp()
POST /top-up/saved-card [AdWalletSavedCardTopUpDto] → walletService.topUpWithSavedCard()
PUT /auto-reload [AdWalletAutoReloadDto] → walletService.setAutoReload()
DELETE /card → walletService.removeCard()
POST /top-up/:reference/confirm → walletService.confirmTopUp()

### src/modules/administration/administration.controller.ts
## AdministrationController — /administration
   auth: JWT
GET /agents {JWT:ADM} [PaginationQueryDto] → adminService.listAgents()
POST /agents {JWT:ADM} [AdminCreateAgentDto] → adminService.createAgent()
POST /impersonation/token {JWT:ADM} [GenerateImpersonationTokenDto] → adminService.generateToken()
POST /impersonation/customer-token {JWT:ADM,AGT} [GenerateCustomerImpersonationTokenDto] → adminService.generateCustomerToken()
GET /me/permissions {JWT:ADM,AGT +SkipSub} → adminService.getActorPermissions()
GET /impersonation/tokens {JWT:ADM,AGT} → adminService.listActorTokens()
DELETE /impersonation/token/:id {JWT:ADM} → adminService.revokeToken()
GET /audit-logs {JWT:ADM} [AuditLogFilterDto] → adminService.getAuditLogs()
POST /nfc-grants {JWT:ADM} [AdminNfcGrantDto] → adminService.grantNfcQuota()

### src/modules/affiliates/affiliates.controller.ts
## AffiliatesController — /affiliates
   auth: JWT +BizVer
GET /stats {JWT:AGT,OWN,MGR +BizVer} [AffiliateStatsDto] → affiliatesService.getStats()
GET /activity {JWT:AGT,OWN,MGR +BizVer} [AffiliateActivityDto] → affiliatesService.getActivity()
GET /performance {JWT:AGT,OWN,MGR +BizVer} [AffiliatePerformanceDto] → affiliatesService.getPerformance()
GET /leaderboard {JWT:AGT,OWN,MGR +BizVer} [LeaderboardEntryDto] → affiliatesService.getLeaderboard()
GET /referrals {JWT:AGT,OWN,MGR +BizVer} → affiliatesService.getReferrals()
GET /profile {JWT:AGT,OWN,MGR +BizVer} → affiliatesService.getProfile()
POST /profile {JWT:AGT,OWN,MGR +BizVer} → affiliatesService.createProfile()
POST /profile/update {JWT:AGT,OWN,MGR +BizVer} [UpdateAffiliateProfileDto] → affiliatesService.updateProfile()
POST /withdraw {JWT:AGT,OWN,MGR +BizVer} [WithdrawRequestDto] → affiliatesService.requestWithdrawal()
POST /track-visit {PUB +BizVer} → affiliatesService.trackVisit()
GET /referrer-info {PUB +BizVer} → affiliatesService.getReferrerInfo()
GET /admin/stats {JWT:ADM,SADM +BizVer} → affiliatesService.getGlobalAdminStats()
GET /admin/withdrawals {JWT:ADM,SADM +BizVer} → affiliatesService.getAllWithdrawals()
POST /admin/withdrawals/:id/process {JWT:ADM,SADM +BizVer} → affiliatesService.processWithdrawal()
GET /admin/profiles {JWT:ADM,SADM +BizVer} → affiliatesService.getAllProfilesAdmin()
GET /admin/referrals {JWT:ADM,SADM +BizVer} → affiliatesService.getAllReferralsAdmin()
GET /admin/commissions {JWT:ADM,SADM +BizVer} → affiliatesService.getAllCommissionsAdmin()
GET /admin/fraud {JWT:ADM,SADM +BizVer} → affiliatesService.getFraudAlerts()
PATCH /admin/settings {JWT:ADM,SADM +BizVer} → affiliatesService.updateCommissionSettings()
POST /admin/profiles/:id/verify-kyc {JWT:ADM,SADM +BizVer} → affiliatesService.updateKycStatus()
POST /admin/profiles/:id/flag {JWT:ADM,SADM +BizVer} → affiliatesService.toggleAffiliateFlag()
GET /agents {JWT:ADM,SADM +BizVer} [ListAgentsQueryDto] → agentsService.listAgents(..),commissionService.enrichAgentsPayload()
GET /commission/summary {JWT:ADM,SADM +BizVer} → commissionService.getSummary()
GET /agents/:id {JWT:ADM,SADM +BizVer} → agentsService.getAgentDetail()
GET /agents/:id/revenue {JWT:ADM,SADM +BizVer} → agentsService.getAgentRevenue()
GET /agents/:id/commission {JWT:ADM,SADM +BizVer} → commissionService.getCommission()
POST /agents/:id/commission/approve {JWT:ADM,SADM +BizVer} → commissionService.approve()
POST /agents/:id/commission/mark-paid {JWT:ADM,SADM +BizVer} → commissionService.markPaid()
POST /agents {JWT:ADM,SADM +BizVer} [CreateAgentDto] → agentsService.createAgent()
PATCH /agents/:id {JWT:ADM,SADM +BizVer} [UpdateAgentDto] → agentsService.updateAgent()
DELETE /agents/:id {JWT:ADM,SADM +BizVer} → agentsService.deleteAgent()

### src/modules/ai-copilot/ai-copilot.controller.ts
## AiCopilotController — /ai
   auth: JWT:OWN,MGR,ADM,STF
POST /analyze @Throttle(10/60s) [AnalyzeRequestDto] → aiCopilotService.analyze()
GET /credits → aiCopilotService.getCredits()

### src/modules/analytics/analytics.controller.ts
## AnalyticsController — /analytics
   auth: JWT +Lvl
GET /dashboard {JWT:OWN,MGR,ADM,STF+perm(analytics,dashboard) +Lvl} [BranchFilterDto] → analyticsService.getDashboardAnalytics()
GET /footfall {JWT:OWN,MGR,ADM+perm(analytics) +Lvl} [BranchFilterDto] → analyticsService.getFootfallAnalytics()
GET /peak-times {JWT:OWN,MGR,ADM+perm(analytics) +Lvl} [BranchFilterDto] → analyticsService.getPeakTimesAnalytics()
GET /admin/summary {JWT:ADM +Lvl} → analyticsService.getAdminSummary()
GET /admin/business-summary {JWT:ADM +Lvl} → analyticsService.getBusinessSummary()

### src/modules/auth/auth.controller.ts
## AuthController — /auth        (class: @UseGuards(JwtAuthGuard, RolesGuard), no class roles)
   auth: JWT
POST /otp/send {PUB} [SendOtpDto] → authService.sendOtp()
POST /otp/verify {PUB} [VerifyOtpDto] → authService.verifyOtp()
POST /login {PUB} [LoginDto] → authService.login()
POST /email-verification/send {JWT:ADM,SADM,OWN,MGR,STF,AGT,CUS} → authService.sendVerificationEmail()
POST /email-verification/verify {PUB} [VerifyEmailDto] → authService.verifyEmail()
POST /2fa/setup {JWT:ADM,SADM,OWN,MGR,STF,AGT,CUS} → authService.setupTwoFactor()
POST /2fa/confirm {JWT:ADM,SADM,OWN,MGR,STF,AGT,CUS} [TwoFactorCodeDto] → authService.confirmTwoFactor()
POST /2fa/disable {JWT:ADM,SADM,OWN,MGR,STF,AGT,CUS} [TwoFactorCodeDto] → authService.disableTwoFactor()
POST /google {PUB} [GoogleLoginDto] → authService.googleLogin()
POST /register {PUB} [RegisterDto] → authService.register()
POST /register/owner/request-otp {PUB} [RequestOtpDto] → authService.requestOwnerOtp()
POST /register/owner {PUB} [RegisterOwnerDto] → authService.registerOwner()
POST /upgrade-to-owner {JWT:CUS} [UpgradeToOwnerDto] → authService.upgradeToOwner()
POST /customer/register/request-otp {PUB} [RequestCustomerSignupOtpDto] → authService.requestCustomerRegistrationOtp()
POST /customer/otp/resend {PUB} [ResendCustomerOtpDto] → authService.resendCustomerOtp()
POST /customer/register/verify-and-set-pin {PUB} [VerifyAndSetCustomerPinDto] → authService.verifyOtpAndSetCustomerPin()
POST /customer/pin/forgot {PUB} [RequestCustomerPinResetDto] → authService.requestCustomerPinReset()
POST /customer/pin/reset {PUB} [ResetCustomerPinDto] → authService.resetCustomerPin()
POST /register/admin {PUB} [RegisterAdminDto] → authService.registerAdmin()
GET /profile → returns req.user (no service call)
POST /password-reset/request {PUB} [PasswordResetOtpDto] → authService.requestPasswordReset()
POST /password-reset/reset {PUB} [ResetPasswordDto] → authService.resetPassword()
POST /switch-role [SwitchRoleDto] → authService.switchRole()
POST /change-password {JWT +AllowPending} [ChangePasswordDto] → authService.changePassword()
POST /check-status {PUB} [CheckStatusDto] → authService.checkUserStatus()
POST /customer/complete-setup {PUB} [UpdateEmailDto] → authService.completeCustomerSetup()
POST /resend-default-password {PUB} → authService.resendDefaultPassword()

### src/modules/banners/banners.controller.ts
## BannersController — /banners
   auth: JWT
GET / → bannersService.findActive()
## AdminBannersController — /admin/banners
   auth: JWT
GET / {JWT:ADM} → bannersService.findAll()
GET /:id {JWT:ADM} → bannersService.findOne()
POST / {JWT:ADM} [CreateBannerDto] → bannersService.create()
PATCH /reorder {JWT:ADM} [ReorderBannersDto] → bannersService.reorder()
PATCH /:id {JWT:ADM} [UpdateBannerDto] → bannersService.update()
DELETE /:id {JWT:ADM} → bannersService.remove()

### src/modules/bookings/bookings.controller.ts
## BookingsController — /bookings
   auth: JWT
GET /availability {PUB} [AvailabilityQueryDto,BookingAvailabilityDto] → bookingsService.getAvailability()
POST / {JWT:CUS} [BookingResponseDto,CreateBookingDto] → bookingsService.createBooking()
GET / {JWT:OWN,MGR,STF,ADM} [BookingPageDto,BusinessBookingsQueryDto] → bookingsService.findAllForBusiness()
GET /:id {JWT:CUS,OWN,MGR,STF,ADM} [BookingResponseDto] → bookingsService.getBooking()
PATCH /:id/cancel {JWT:CUS} [BookingResponseDto,CancelBookingDto] → bookingsService.cancelBooking()
PATCH /:id/status {JWT:OWN,MGR,STF,ADM} [BookingResponseDto,UpdateBookingStatusDto] → bookingsService.updateStatusForBusiness()

### src/modules/bookings/controllers/me-bookings.controller.ts
## MeBookingsController — /me/bookings
   auth: JWT
GET / {JWT:CUS} [BookingPageDto,MyBookingsQueryDto] → bookingsService.getMyBookings()

### src/modules/branches/branches.controller.ts
## BranchesController — /branches
   auth: JWT
POST / {JWT:OWN} [CreateBranchDto] → branchesService.create()
GET / {JWT:OWN,MGR,STF,ADM} → branchesService.findAll()
GET /:id {JWT:OWN,MGR,STF,ADM} → branchesService.findOne()
PATCH /:id {JWT:OWN} [UpdateBranchDto] → branchesService.update()
GET /:id/customer-capture {JWT:OWN} → branchesService.findOne()
PATCH /:id/customer-capture {JWT:OWN} [UpdateCustomerCaptureDto] → branchesService.findOne(..),branchesService.updateCustomerCapture()
POST /:id/request-delete-otp {JWT:OWN} → branchesService.requestDeleteOtp()
DELETE /:id {JWT:OWN} → branchesService.remove()
GET /check-username/:username {PUB} → branchesService.validateUsername()
GET /:id/last-top-recent-customer {JWT:OWN,MGR,STF} → branchesService.checkBranchAccess(..),branchesService.getLastTopRecentCustomer()

### src/modules/business-dashboard/business-dashboard.controller.ts
## BusinessDashboardController — /business-dashboard
   auth: JWT
GET / {JWT:OWN,MGR,STF,ADM} [BusinessDashboardResponseDto] → dashboardService.getDashboard()

### src/modules/business-profiling/business-profiling.controller.ts
## BusinessProfilingController — /business-profiling
   auth: JWT
POST / {JWT:AGT,ADM} [CreateBusinessProfileDto] → profilingService.create()
GET /stats {JWT:AGT,ADM} → profilingService.getStats()
POST /public {PUB} [CreateBusinessProfileDto] → profilingService.create()
GET / {JWT:AGT,ADM} → profilingService.findAll()
GET /:id {JWT:AGT,ADM} → profilingService.findOne()
PATCH /:id {JWT:AGT,ADM} [UpdateBusinessProfileDto] → profilingService.update()
DELETE /:id {JWT:ADM} → profilingService.remove()

### src/modules/businesses/businesses.controller.ts
## BusinessesController — /businesses
   auth: JWT
GET /my-business {JWT:OWN,MGR,STF +SkipSub} → businessesService.findById()
GET /my-business/customers-summary {JWT:OWN,MGR,STF +SkipSub} → businessesService.getCustomersSummary()
PATCH /my-business {JWT:OWN} [UpdateBusinessDto] → businessesService.findByOwner(..),businessesService.update()
POST /my-business/enqueue-geocode {JWT:OWN} → businessesService.findByOwner(..),businessesService.enqueueGeocode()
POST /import-customers {JWT:OWN,MGR} [ImportCustomersDto] → businessesService.importCustomers()
PATCH /:id {JWT:OWN,ADM,SADM} [UpdateBusinessDto] → businessesService.update()
GET /admin {JWT:ADM,SADM} [FindBusinessesAdminDto] → businessesService.findAllAdmin()
GET /admin/suspended {JWT:ADM,SADM} [FindBusinessesAdminDto] → businessesService.findSuspendedAdmin()
GET /admin/pending-verification {JWT:ADM,SADM} [FindBusinessesAdminDto] → businessesService.findPendingVerificationAdmin()
POST /admin/backfill-geocodes {JWT:ADM,SADM} → businessesService.backfillMissingGeocodes()
POST /admin {JWT:ADM,SADM} [AdminCreateBusinessDto] → businessesService.adminCreate()
DELETE /admin/:id {JWT:ADM,SADM} → businessesService.adminDelete()
PATCH /admin/:id/approve {JWT:ADM,SADM} → businessesService.approve()
PATCH /admin/:id/reject {JWT:ADM,SADM} → businessesService.reject()
PATCH /admin/:id/suspend {JWT:ADM,SADM} [SuspendBusinessDto] → businessesService.suspend()
PATCH /admin/:id/reactivate {JWT:ADM,SADM} → businessesService.reactivate()
PATCH /admin/:id/verify {JWT:ADM,SADM} → businessesService.verify()
PATCH /admin/:id/unverify {JWT:ADM,SADM} → businessesService.unverify()
GET /stats {JWT:ADM,SADM} → businessesService.getStats()
GET /admin/:id/stats {JWT:ADM,SADM} → businessesService.getBusinessStatsForAdmin()
GET /:id {JWT:ADM,SADM} → businessesService.getAdminDetail()
POST / {JWT:ADM,SADM} [AdminCreateBusinessDto] → businessesService.adminCreate()
DELETE /:id {JWT:ADM,SADM} → businessesService.adminDelete()

### src/modules/businesses/public-businesses.controller.ts
## PublicBusinessesController — /public
   auth: JWT
GET /businesses/code/:code {PUB} → businessesService.findByCode()
GET /branches/code/:code {PUB} → branchesService.findByCode()
GET /branches/nearby {PUB} [NearbyBranchesQueryDto] → branchesService.findNearbyBranches()

### src/modules/campaigns/campaigns.controller.ts
## CampaignsController — /campaigns
   auth: JWT
POST / {JWT:OWN,MGR+perm(engagement)} [CreateCampaignDto] → campaignsService.create()
GET / {JWT:OWN,MGR,ADM+perm(engagement)} [FindCampaignsDto] → campaignsService.findAll()
GET /featured → bannersService.findActive()
GET /:id {JWT:OWN,MGR+perm(engagement)} → campaignsService.findOne()
PATCH /:id {JWT:OWN,MGR+perm(engagement)} [UpdateCampaignDto] → campaignsService.update()
DELETE /:id {JWT:OWN,MGR+perm(engagement)} → campaignsService.remove()
POST /templates {JWT:ADM} [CreateCampaignTemplateDto] → campaignsService.createTemplate()
GET /templates → campaignsService.findAllTemplates()

### src/modules/catalogue-cart/catalogue-cart.controller.ts
## CatalogueCartController — /catalogue/cart
   auth: JWT:CUS
GET / → catalogueCartService.getCart()
GET /summary → catalogueCartService.getCartSummary()
POST /items [AddToCartDto] → catalogueCartService.addItemToCart()
PATCH /items/:cartItemId [UpdateCartItemDto] → catalogueCartService.updateCartItem()
DELETE /items/:cartItemId → catalogueCartService.removeCartItem()
DELETE / → catalogueCartService.clearCart()
POST /merge [MergeGuestCartDto] → catalogueCartService.mergeGuestCart()
POST /checkout [CheckoutCartDto] → catalogueCartService.checkoutCart()

### src/modules/catalogue-orders/catalogue-orders.controller.ts
## CatalogueOrdersController — /catalogue/orders
   auth: JWT
POST / {PUB} [CreateCatalogueOrderDto] → orderService.createOrder()
POST /bulk-checkout {JWT:CUS} [BulkCheckoutDto] → orderService.bulkCheckout()
GET /my-orders {JWT:CUS} [MyOrdersQueryDto] → orderService.findAllByCustomer()
GET / {JWT:OWN,MGR,ADM,STF+perm(pos)} [CatalogueOrderQueryDto] → orderService.findAllOrders()
GET /:id {JWT:OWN,MGR,ADM,STF+perm(pos)} → orderService.findOneOrder()
PATCH /:id/status {JWT:OWN,MGR,ADM,STF+perm(pos)} [UpdateCatalogueOrderStatusDto] → orderService.updateStatus()

### src/modules/catalogue/admin-catalogue.controller.ts
## AdminCatalogueController — /catalogue
   auth: JWT
POST /categories {JWT:OWN,MGR,ADM+perm(inventory)} [CreateCatalogueCategoryDto] → catalogueService.createCategory()
GET /categories {JWT:OWN,MGR,ADM,STF+perm(inventory)} → catalogueService.findAllCategories()
PATCH /categories/reorder {JWT:OWN,MGR,ADM+perm(inventory)} [ReorderCatalogueCategoryDto] → catalogueService.reorderCategories()
PATCH /categories/:id {JWT:OWN,MGR,ADM+perm(inventory)} [UpdateCatalogueCategoryDto] → catalogueService.updateCategory()
DELETE /categories/:id {JWT:OWN,ADM+perm(inventory)} → catalogueService.deleteCategory()
POST /items {JWT:OWN,MGR,ADM+perm(inventory)} [CreateCatalogueItemDto] → catalogueService.createItem()
POST /items/bulk {JWT:OWN,MGR,ADM+perm(catalogue,inventory)} [BulkImportItemsDto] → catalogueService.bulkImportItems()
GET /items {JWT:OWN,MGR,ADM,STF+perm(inventory)} → catalogueService.findAllItemsAdmin()
PATCH /items/:id {JWT:OWN,MGR,ADM+perm(inventory)} [UpdateCatalogueItemDto] → catalogueService.updateItem()
DELETE /items/:id {JWT:OWN,ADM+perm(inventory)} → catalogueService.deleteItem()
POST /items/:id/import {JWT:OWN,MGR,ADM+perm(inventory)} → catalogueService.importItem()
POST /items/:id/suspend {JWT:ADM} [SuspendItemDto] → catalogueService.suspendItem()
POST /items/:id/unsuspend {JWT:ADM} → catalogueService.unsuspendItem()

### src/modules/catalogue/admin-deals.controller.ts
## AdminDealsController — /admin/deals
   auth: JWT:ADM
GET / [AdminDealsQueryDto] → offerService.getAdminDeals()
GET /stats → offerService.getAdminDealsStats()
GET /businesses [AdminBusinessesQueryDto] → offerService.getAdminBusinessesList()
PATCH /:id/featured → offerService.toggleDealFeatured()

### src/modules/catalogue/catalogue-branch-pricing.controller.ts
## CatalogueBranchPricingController — /catalogue/items
   auth: JWT
GET /:id/branch-pricing {JWT:OWN,MGR,ADM,STF+perm(inventory)} → pricingService.getItemBranchPricing()
PUT /:id/branch-pricing {JWT:OWN,MGR,ADM+perm(inventory)} [SetItemBranchPricingDto] → pricingService.setItemBranchPricing()

### src/modules/catalogue/catalogue-offer-stats.controller.ts
## CatalogueOfferStatsController — /catalogue/offers
   auth: JWT:OWN,MGR,ADM,STF+perm(inventory)
GET /summary → statsService.getSummary()
GET /ledger {JWT:OWN,MGR+perm(inventory)} [OfferLedgerQueryDto] → statsService.getLedger()
GET /groups/:dealGroupId/stats → statsService.getGroupStats()
GET /:id/stats → statsService.getOfferStats()

### src/modules/catalogue/catalogue-offer.controller.ts
## CatalogueOfferController — /catalogue/offers
   auth: JWT
POST /generate-terms {JWT:OWN,MGR+perm(inventory)} [GenerateOfferTermsDto] → offerService.generateTerms()
POST / {JWT:OWN,MGR+perm(inventory)} [CreateCatalogueOfferDto] → offerService.createOffer()
PATCH /:id {JWT:OWN,MGR+perm(inventory)} [UpdateCatalogueOfferDto] → offerService.updateOffer()
DELETE /:id {JWT:OWN,MGR+perm(inventory)} → offerService.deleteOffer()
GET /admin {JWT:OWN,MGR,ADM,STF+perm(inventory)} [OwnerOffersQueryDto] → offerService.findAllOffersAdmin()
PATCH /groups/:dealGroupId {JWT:OWN,MGR+perm(inventory)} [UpdateOfferGroupDto] → offerService.updateOfferGroup()
GET /groups/:dealGroupId/branch-pricing {JWT:OWN,MGR,ADM,STF+perm(inventory)} → offerService.getOfferGroupBranchPricing()
PUT /groups/:dealGroupId/branch-pricing {JWT:OWN,MGR+perm(inventory)} [SetOfferBranchPricingDto] → offerService.setOfferGroupBranchPricing()
PATCH /groups/:dealGroupId/status {JWT:OWN,MGR+perm(inventory)} [UpdateOfferGroupStatusDto] → offerService.updateOfferGroupStatus()
GET /public {PUB} [PublicCatalogueOffersQueryDto] → offerService.findAllOffersPublicGlobal()
GET /public/:branchId {PUB} [CatalogueOfferQueryDto] → offerService.findAllOffersPublic()
GET /public/details/:id {PUB} → offerService.findOneOffer()
POST /claim/request {PUB} [RequestClaimOtpDto] → offerService.requestClaimOtp()
POST /claim/verify {PUB} [VerifyClaimDto] → offerService.verifyClaim()
POST /claim/gift [SendDealGiftDto] → offerService.sendDealGift()
GET /gift/:token {PUB} → offerService.getGiftByToken()
POST /gift/:token/reject {PUB} [RejectDealGiftDto] → offerService.rejectDealGift()
GET /gifts/branch/:branchId {JWT:OWN,MGR,ADM,STF+perm(inventory)} → offerService.getBranchGiftedDeals()
POST /claim/redeem/:code {JWT:OWN,MGR,STF+perm(pos)} → offerService.redeemClaim()
GET /claims {JWT:OWN,MGR+perm(inventory)} [BusinessClaimsQueryDto] → offerService.getBusinessClaims()

### src/modules/catalogue/me-claims.controller.ts
## MeClaimsController — /me/claims
   auth: JWT
GET / {JWT:CUS} [MyClaimDto,MyClaimsPageDto,MyClaimsQueryDto] → offerService.findMyClaims()

### src/modules/catalogue/me-gifts.controller.ts
## MeGiftsController — /me/gifts
   auth: JWT
GET / {JWT:CUS} [MyGiftDto,MyGiftsPageDto,MyGiftsQueryDto] → offerService.findMyGifts()

### src/modules/catalogue/me-savings.controller.ts
## MeSavingsController — /me/savings
   auth: JWT
GET / {JWT:CUS} [MySavingsPageDto,MySavingsQueryDto] → savingsService.getMySavings()
GET /categories {JWT:CUS} [SavingsBreakdownDto,SavingsCategoriesQueryDto] → savingsService.getMySavingsCategories()
GET /export {JWT:CUS} [SavingsExportQueryDto] → savingsService.exportMySavingsCsv()

### src/modules/catalogue/public-catalogue.controller.ts
## PublicCatalogueController — /public/catalogue
   auth: JWT
GET /items/branch/:branchId {PUB} [CatalogueQueryDto] → catalogueService.findAllItemsPublic(..),pricingService.applyBranchPrices()
GET /items/:id {PUB} → catalogueService.findOneItem(..),pricingService.applyBranchPrices()
GET /categories/business/:businessId {PUB} → catalogueService.findAllCategories()
GET /categories/branch/:branchId {PUB} → catalogueService.findAllCategoriesByBranch()

### src/modules/catalogue/recommendations.controller.ts
## RecommendationsController — /recommendations
   auth: JWT
GET / {JWT:CUS} [RecommendationsQueryDto] → offerService.findRecommendedOffers()

### src/modules/categories/categories.controller.ts
## AdminCategoriesController — /admin/categories
   auth: JWT:ADM
POST / [CreateCategoryDto] → categoriesService.createCategory()
PATCH /:id [UpdateCategoryDto] → categoriesService.updateCategory()
DELETE /:id → categoriesService.deleteCategory()
POST /subcategories [CreateSubcategoryDto] → categoriesService.createSubcategory()
PATCH /subcategories/:id [UpdateSubcategoryDto] → categoriesService.updateSubcategory()
DELETE /subcategories/:id → categoriesService.deleteSubcategory()
## PublicCategoriesController — /categories
   auth: JWT
GET / {PUB} [CategoryPaginationDto] → categoriesService.findAllCategories()
GET /:id {PUB} → categoriesService.findCategoryById()
GET /:id/subcategories {PUB} [SubcategoryPaginationDto] → categoriesService.findAllSubcategories()
GET /subcategories/search {PUB} [SubcategoryPaginationDto] → categoriesService.findAllSubcategories()

### src/modules/clusters/clusters.controller.ts
## ClustersPublicController — /clusters
   auth: JWT
GET /context/:uniqueCode {PUB} → clustersService.getContext()
GET /:uniqueCode/deals {PUB} [ClusterDealsQueryDto] → clustersService.getClusterDeals()
## ClustersAdminController — /admin/clusters
   auth: JWT
GET / {JWT:ADM} [AdminClusterQueryDto] → clustersService.list()
GET /:id {JWT:ADM} → clustersService.getDetail()
POST / {JWT:ADM} [CreateClusterDto] → clustersService.create()
POST /auto-assign {JWT:ADM} [AutoAssignClustersDto] → clustersService.autoAssign()
PATCH /:id {JWT:ADM} [UpdateClusterDto] → clustersService.update()
GET /:id/offers {JWT:ADM} [ClusterOffersQueryDto] → clustersService.getClusterOffers()
PATCH /:id/offers/:offerId {JWT:ADM} [SetClusterOfferPinnedDto] → clustersService.setOfferPinned()
DELETE /:id {JWT:ADM} → clustersService.remove()
POST /:id/branches {JWT:ADM} [AddBranchDto] → clustersService.addBranch()
DELETE /:id/branches/:branchId {JWT:ADM} → clustersService.removeBranch()

### src/modules/contacts/controllers/segments.controller.ts
## SegmentsController — /segments
   auth: JWT
POST / {JWT:OWN,MGR} [CreateSegmentDto] → segmentsService.createSegment()
GET / {JWT:OWN,MGR,STF} [BranchFilterDto] → segmentsService.getSegments()
POST /preview {JWT:OWN,MGR} [SegmentPreviewDto] → segmentsService.preview()
GET /criteria-options {JWT:OWN,MGR,STF} → segmentsService.criteriaOptions()
GET /:id/insights {JWT:OWN,MGR,STF} [BranchFilterDto] → segmentsService.insights()
GET /:id {JWT:OWN,MGR,STF} [BranchFilterDto] → segmentsService.getSegmentWithMembers()
PATCH /:id {JWT:OWN,MGR} [BranchFilterDto,UpdateSegmentDto] → segmentsService.updateSegment()
DELETE /:id {JWT:OWN,MGR} [BranchFilterDto] → segmentsService.deleteSegment()
POST /:id/members {JWT:OWN,MGR} [BranchFilterDto,SegmentMemberDto] → segmentsService.addMembers()
DELETE /:id/members {JWT:OWN,MGR} [BranchFilterDto,SegmentMemberDto] → segmentsService.removeMembers()

### src/modules/coupons/controllers/admin-coupons.controller.ts
## AdminCouponsController — /admin/coupons
   auth: JWT:ADM
POST / [CreateCouponDto] → couponsService.create()
GET / → couponsService.findAll()
GET /:id → couponsService.findOne()
PATCH /:id [UpdateCouponDto] → couponsService.update()
PATCH /:id/toggle [ToggleStatusDto] → couponsService.toggleActive()
DELETE /:id → couponsService.remove()
POST /:couponId/promo-codes [CreatePromoCodeDto] → promotionCodesService.create()
GET /promo-codes/all [QueryPromoCodesDto] → promotionCodesService.findAll()
GET /promo-codes/:id → promotionCodesService.findOne()
PATCH /promo-codes/:id [UpdatePromoCodeDto] → promotionCodesService.update()
PATCH /promo-codes/:id/toggle [ToggleStatusDto] → promotionCodesService.toggleActive()
GET /analytics/stats → promotionCodesService.getStats()
GET /analytics/redemptions [QueryRedemptionsDto] → promotionCodesService.findRedemptions()

### src/modules/coupons/controllers/coupons.controller.ts
## CouponsController — /coupons
   auth: JWT
POST /validate {PUB} [ValidatePromoCodeDto] → couponEngineService.validatePromotion()

### src/modules/deal-engagement/deal-engagement-admin.controller.ts
## DealReviewAdminController — /admin/reviews
   auth: JWT:ADM
GET / [ReviewsAdminQueryDto] → engagementService.findReviewsAdmin()
POST /:id/approve → engagementService.approveReview()
POST /:id/reject → engagementService.rejectReview()
DELETE /:id → engagementService.removeReview()

### src/modules/deal-engagement/deal-engagement.controller.ts
## DealEngagementController — /deals
   auth: JWT
GET /business/reviews {JWT:OWN,MGR} [BusinessReviewsQueryDto] → engagementService.findReviewsForBusiness()
GET /business/reviews/summary {JWT:OWN,MGR} → engagementService.getReviewsSummaryForBusiness()
POST /business/reviews/:id/approve {JWT:OWN,MGR} → engagementService.approveReviewByBusiness()
POST /business/reviews/:id/reject {JWT:OWN,MGR} → engagementService.rejectReviewByBusiness()
DELETE /business/reviews/:id {JWT:OWN,MGR} → engagementService.removeReviewByBusiness()
POST /:offerId/reviews {PUB} [CreateDealReviewDto] → engagementService.createReview()
GET /:offerId/reviews {PUB} [ListReviewsQueryDto] → engagementService.listReviews()
GET /:offerId/reviews/preview {PUB} → engagementService.previewReviews()
GET /:offerId/reviews/:reviewId {PUB} → engagementService.findReviewById()
PATCH /:offerId/reviews/:reviewId → engagementService.updateOwnReview()      [UpdateDealReviewDto]
DELETE /:offerId/reviews/:reviewId → engagementService.deleteOwnReview()
POST /:offerId/reviews/:reviewId/like → engagementService.toggleReviewLike()
POST /:offerId/reactions [DealReactionDto] → engagementService.setReaction()
GET /:offerId/reaction-status → engagementService.getReactionStatus()
POST /:offerId/save → engagementService.toggleSave()
GET /:offerId/save-status → engagementService.getSaveStatus()
GET /:offerId/engagement {PUB} → engagementService.getEngagement()

### src/modules/devices/device-tap.controller.ts
## DeviceTapController — /tap
   auth: JWT
GET /context/:code {PUB +AllowPending} → controller.getDeviceContext(code) (private helper)
GET /context-by-username/:username {PUB +AllowPending} → branchesService.findByUsername(..),branchesService.findByCode()

### src/modules/devices/devices.controller.ts
## DevicesController — /devices
   auth: JWT:ADM,OWN,MGR
GET /admin {JWT:ADM} [AdminDeviceQueryDto] → devicesService.findAllAdmin()
GET /admin/stats {JWT:ADM} → devicesService.getAdminStats()
POST /admin {JWT:ADM} [AdminCreateDeviceDto] → devicesService.adminCreate()
PATCH /admin/:id {JWT:ADM} [AdminUpdateDeviceDto] → devicesService.adminUpdate()
DELETE /admin/:id {JWT:ADM} → devicesService.adminDelete()
GET / {JWT:ADM,OWN,MGR+perm(settings)} [BranchFilterDto] → devicesService.findAllByContext()
GET /stats {JWT:ADM,OWN,MGR+perm(settings)} [BranchFilterDto] → devicesService.getStats()
PATCH /names {JWT:ADM,OWN,MGR+perm(settings)} [UpdateAssetNamesDto] → devicesService.updateAssetNames()
POST /generate {JWT:ADM,OWN,MGR+perm(settings)} [GenerateDevicesDto] → devicesService.generateDevicesForReadyOrders()
PATCH /:id {JWT:ADM,OWN,MGR+perm(settings)} [UpdateDeviceDto] → devicesService.update()
DELETE /:id {JWT:ADM,OWN,MGR+perm(settings)} [DeviceQueryDto] → devicesService.remove()

### src/modules/discovery/discovery.controller.ts
## DiscoveryController — /discovery
   auth: JWT
GET /overview/:branchId {JWT:OWN,MGR} → discoveryService.getOverview()
GET /results/:branchId {JWT:OWN,MGR} → discoveryService.getResults()
GET /settings/:branchId {JWT:OWN,MGR} → discoveryService.getSettings()
PATCH /settings/:branchId {JWT:OWN} [UpdateDiscoverySettingsDto] → discoveryService.updateSettings()
GET /partners/:branchId {JWT:OWN,MGR} → discoveryService.getPartners()
GET /customers/:branchId {JWT:OWN,MGR} [DiscoveryQueryDto] → discoveryService.getCustomers()
POST /recommend/:branchId {JWT:OWN,MGR} [RecommendBusinessDto] → discoveryService.submitRecommendation()
GET /admin/stats {JWT:ADM} → discoveryService.getAdminStats()
GET /admin/businesses {JWT:ADM} → discoveryService.getAdminBusinesses()
GET /admin/businesses/:id {JWT:ADM} → discoveryService.getAdminBusinessDetail()
GET /admin/offers {JWT:ADM} [AdminOfferQueryDto] → discoveryService.getAdminOffers()
GET /admin/offers/:id {JWT:ADM} → discoveryService.getAdminOfferDetail()
GET /admin/referrals {JWT:ADM} [AdminReferralQueryDto] → discoveryService.getAdminReferrals()
GET /admin/referrals/:id/investigate {JWT:ADM} → discoveryService.getAdminReferralInvestigation()
GET /admin/partnerships {JWT:ADM} [AdminPartnershipQueryDto] → discoveryService.getAdminPartnerships()
GET /admin/sponsored {JWT:ADM} [AdminSponsoredQueryDto] → discoveryService.getAdminSponsoredCampaigns()
GET /admin/sponsored/:id {JWT:ADM} → discoveryService.getAdminSponsoredCampaignDetail()
GET /admin/billing {JWT:ADM} [AdminBillingQueryDto] → discoveryService.getAdminBilling()
GET /admin/billing/:id {JWT:ADM} → discoveryService.getAdminBillingDetail()
GET /admin/attribution {JWT:ADM} → discoveryService.getAdminAttribution()
GET /admin/customers {JWT:ADM} [AdminCustomerQueryDto] → discoveryService.getAdminCustomers()
GET /admin/customers/:id {JWT:ADM} → discoveryService.getAdminCustomerDetail()
GET /admin/locations {JWT:ADM} [AdminLocationQueryDto] → discoveryService.getAdminLocations()
GET /admin/locations/:id {JWT:ADM} → discoveryService.getAdminLocationDetail()
GET /admin/categories {JWT:ADM} [AdminCategoryQueryDto] → discoveryService.getAdminCategories()
GET /admin/categories/:id {JWT:ADM} → discoveryService.getAdminCategoryDetail()
GET /admin/category-types {JWT:ADM} → discoveryService.getAdminCategoryTypes()
POST /admin/category-types {JWT:ADM} [CreateCategoryTypeDto] → discoveryService.createAdminCategoryType()
PATCH /admin/category-types/:id {JWT:ADM} [UpdateCategoryTypeDto] → discoveryService.updateAdminCategoryType()
DELETE /admin/category-types/:id {JWT:ADM} → discoveryService.deleteAdminCategoryType()
GET /admin/fraud {JWT:ADM} [AdminFraudQueryDto] → discoveryService.getAdminFraudAlerts()
GET /admin/notifications {JWT:ADM} [AdminNotificationQueryDto] → discoveryService.getAdminNotifications()
GET /admin/reports {JWT:ADM} → discoveryService.getAdminReports()
POST /admin/reports/generate {JWT:ADM} [GenerateReportDto] → discoveryService.generateAdminReport()
GET /admin/audit-logs {JWT:ADM} [AdminAuditLogQueryDto] → discoveryService.getAdminAuditLogs()
GET /admin/audit-logs/:id {JWT:ADM} → discoveryService.getAdminAuditLogDetail()
GET /admin/settings {JWT:ADM} → discoveryService.getAdminDiscoverySettings()
PATCH /admin/settings {JWT:ADM} [UpdateDiscoveryAdminSettingsDto] → discoveryService.updateAdminDiscoverySettings()
GET /admin/partnerships/rewards {JWT:ADM} → discoveryService.getPartnershipRewardTiers()
PUT /admin/partnerships/rewards {JWT:ADM} → discoveryService.updatePartnershipRewardTiers()
PATCH /admin/partnerships/rewards {JWT:ADM} → discoveryService.updatePartnershipRewardTiers()

### src/modules/feedback/feedback.controller.ts
## FeedbackController — /feedback
   auth: JWT
POST / {JWT:CUS} [CreateFeedbackDto] → feedbackService.create()
GET /stats {JWT:OWN,MGR,ADM,STF} → feedbackService.getStats()
GET /reviews {JWT:OWN,MGR,ADM,STF} → feedbackService.getReviews()

### src/modules/forms/admin-forms.controller.ts
## AdminFormsController — /admin-forms
   auth: JWT:ADM
GET / [AdminFormQueryDto] → formsService.findAllForAdmin()
PATCH /:id/disable [DisableFormDto] → formsService.setAdminDisabledStatus()
PATCH /:id/enable → formsService.setAdminDisabledStatus()

### src/modules/forms/form-templates.controller.ts
## FormTemplatesController — /form-templates
   auth: JWT
POST / {JWT:ADM} [CreateFormTemplateDto] → formsService.createTemplate()
GET / {JWT:ADM,OWN} [FormTemplateQueryDto] → formsService.findAllTemplates()
GET /stats {JWT:ADM} → formsService.getAllTemplatesStats()
GET /:id/stats {JWT:ADM} → formsService.getTemplateStats()
GET /:id {JWT:ADM,OWN} → formsService.findTemplateById()
PATCH /:id {JWT:ADM} [UpdateFormTemplateDto] → formsService.updateTemplate()
DELETE /:id {JWT:ADM} → formsService.deleteTemplate()
POST /:id/use {JWT:OWN} → formsService.useTemplate()

### src/modules/forms/forms.controller.ts
## FormsController — /business-forms
   auth: JWT
POST / {JWT:OWN,MGR+perm(engagement)} [CreateFormDto] → formsService.createForm()
GET / {JWT:OWN,MGR,STF+perm(engagement)} [BranchFilterDto] → formsService.getFormsByBranch()
GET /:id {JWT:OWN,MGR,STF+perm(engagement)} [BranchFilterDto] → formsService.getFormById()
PATCH /:id {JWT:OWN,MGR+perm(engagement)} [BranchFilterDto,UpdateFormDto] → formsService.updateForm()
DELETE /:id {JWT:OWN,MGR+perm(engagement)} [BranchFilterDto] → formsService.deleteForm()
GET /:id/responses {JWT:OWN,MGR,STF+perm(engagement)} [BranchFilterDto] → formsService.getFormResponses()
PATCH /branch-settings/:branchId {JWT:OWN,MGR+perm(engagement)} [BranchIdParamDto,UpdateBranchFormSettingsDto] → formsService.updateBranchSettings()

### src/modules/forms/visitor-forms.controller.ts
## VisitorFormsController — /visitor-forms
   auth: JWT
GET /branch/:branchId {PUB} → formsService.getFormsForVisitor()
GET /code/:code {PUB} → formsService.getFormByUniqueCode()
GET /device/:code {PUB} → formsService.getFormsByDeviceCode()
POST /:code/responses {PUB} [SubmitFormResponseDto] → formsService.submitResponse()

### src/modules/fos-ai-assistant/fos-ai-assistant.controller.ts
## FosAiAssistantController — /ai-assistant
   auth: JWT +Env
GET /insights {JWT:ADM,SADM +Env} → aiService.getInsights()
POST /chat {JWT:ADM,SADM +Env} [ChatQueryDto] → aiService.chat()

### src/modules/fos-budgets/fos-budgets.controller.ts
## FosBudgetsController — /budgets
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → budgetsService.findAll()
POST / {JWT:ADM,SADM +Env} [CreateBudgetDto] → budgetsService.create()
GET /forecasts {JWT:ADM,SADM +Env} → budgetsService.getForecasts()

### src/modules/fos-dashboard/fos-dashboard.controller.ts
## FosDashboardController — /dashboard
   auth: JWT +Env
GET /stats {JWT:ADM,SADM +Env} → dashboardService.getStats()
GET /snapshots {JWT:ADM,SADM +Env} → dashboardService.getSnapshots()
GET /insights {JWT:ADM,SADM +Env} → dashboardService.getInsights()

### src/modules/fos-financial-planning/fos-financial-planning.controller.ts
## FosFinancialPlanningController — /financial-planning
   auth: JWT +Env
POST /targets {JWT:ADM,SADM +Env} [CreateTargetDto] → planningService.createTarget()
GET /targets {JWT:ADM,SADM +Env} [TargetFilterDto] → planningService.getTargets()
POST /scenarios {JWT:ADM,SADM +Env} [ScenarioSimulationRequestDto] → planningService.simulateScenario()

### src/modules/fos-forecasting/fos-forecasting.controller.ts
## FosForecastingController — /forecasting
   auth: JWT +Env
POST /project {JWT:ADM,SADM +Env} [ForecastProjectionRequestDto] → forecastingService.project()
GET /defaults {JWT:ADM,SADM +Env} → forecastingService.getDefaults()
POST /persist {JWT:ADM,SADM +Env} [SaveForecastRequestDto] → forecastingService.persist()
GET /history {JWT:ADM,SADM +Env} → forecastingService.getHistory()

### src/modules/fos-funnel/fos-funnel.controller.ts
## FosFunnelController — /funnel
   auth: JWT +Env
GET /stats {JWT:ADM,SADM +Env} → funnelService.getFunnelStats()

### src/modules/fos-goals/fos-goals.controller.ts
## FosGoalsController — /goals
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → goalsService.getGoals()
POST / {JWT:ADM,SADM +Env} [CreateGoalDto] → goalsService.createGoal()
PATCH /:id {JWT:ADM,SADM +Env} [UpdateGoalDto] → goalsService.updateGoal()
DELETE /:id {JWT:ADM,SADM +Env} → goalsService.removeGoal()
POST /projects {JWT:ADM,SADM +Env} [CreateProjectDto] → goalsService.createProject()
PATCH /projects/:id {JWT:ADM,SADM +Env} [UpdateProjectDto] → goalsService.updateProject()
DELETE /projects/:id {JWT:ADM,SADM +Env} → goalsService.removeProject()

### src/modules/fos-ledger/payables.controller.ts
## FosPayablesController — /payables
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → ledgerService.getPayables()
POST /bills {JWT:ADM,SADM +Env} [CreateBillDto] → ledgerService.createBill()
PATCH /bills/:id {JWT:ADM,SADM +Env} [UpdateBillDto] → ledgerService.updateBill()
DELETE /bills/:id {JWT:ADM,SADM +Env} → ledgerService.removeBill()

### src/modules/fos-ledger/receivables.controller.ts
## FosReceivablesController — /receivables
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → ledgerService.getReceivables()
POST /invoices {JWT:ADM,SADM +Env} [CreateInvoiceDto] → ledgerService.createInvoice()
PATCH /invoices/:id {JWT:ADM,SADM +Env} [UpdateInvoiceDto] → ledgerService.updateInvoice()
DELETE /invoices/:id {JWT:ADM,SADM +Env} → ledgerService.removeInvoice()

### src/modules/fos-messaging/fos-messaging.controller.ts
## FosMessagingController — /messaging
   auth: JWT +Env
GET /sms {JWT:ADM,SADM +Env} [MessagingLogsQueryDto] → messagingService.getSmsLogs()
GET /email {JWT:ADM,SADM +Env} [MessagingLogsQueryDto] → messagingService.getEmailLogs()
GET /aggregates {JWT:ADM,SADM +Env} → messagingService.getAggregates()


### 11.2 Endpoint table — fos-planning → observability

**Scope:** remainder of Section B — `fos-planning` through the last controller (`observability`).
**Includes the promotions factory double-registration:** `promotions.controller.ts` builds its controller class via `campaignController(path, tag)` and registers it twice (`BoostsController` at `/boosts`, `PromotionsController` at `/promotions`) — the same 14 routes are served under both prefixes (28 endpoints).
**Row format:** identical to §11.1 — see the Legend at the start of §11.
Full paths = `/api/v1` + controller prefix + row path.


### src/modules/fos-planning/fos-planning.controller.ts
## FosPlanningController — /
   auth: JWT +Env
GET /budget-items {JWT:ADM,SADM +Env} → planningService.getBudgetItems()
POST /budget-items {JWT:ADM,SADM +Env} [CreateBudgetItemDto] → planningService.createBudgetItem()
PATCH /budget-items/:id {JWT:ADM,SADM +Env} [UpdateBudgetItemDto] → planningService.updateBudgetItem()
DELETE /budget-items/:id {JWT:ADM,SADM +Env} → planningService.removeBudgetItem()
POST /budget-categories {JWT:ADM,SADM +Env} [CreateBudgetCategoryDto] → planningService.createCategory()
DELETE /budget-categories/:name {JWT:ADM,SADM +Env} → planningService.removeCategory()
GET /forecast-aspects {JWT:ADM,SADM +Env} → planningService.getAspects()
POST /forecast-aspects {JWT:ADM,SADM +Env} [CreateAspectDto] → planningService.createAspect()
PATCH /forecast-aspects/:id {JWT:ADM,SADM +Env} [UpdateAspectDto] → planningService.updateAspect()
DELETE /forecast-aspects/:id {JWT:ADM,SADM +Env} → planningService.removeAspect()

### src/modules/fos-pnl/expenses.controller.ts
## ExpensesController — /expenses
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} [ListExpensesQueryDto] → pnlService.listExpenses()
POST / {JWT:ADM,SADM +Env} [CreateExpenseDto] → pnlService.createExpense()
PATCH /:id {JWT:ADM,SADM +Env} [UpdateExpenseDto] → pnlService.updateExpense()
DELETE /:id {JWT:ADM,SADM +Env} → pnlService.deleteExpense()

### src/modules/fos-pnl/fos-pnl.controller.ts
## FosPnlController — /pnl
   auth: JWT +Env
GET /break-even {JWT:ADM,SADM +Env} → pnlService.getBreakEven()
GET /runway {JWT:ADM,SADM +Env} → pnlService.getRunway()
GET /statement {JWT:ADM,SADM +Env} → pnlService.getPnlStatement()
GET /revenue-trends {JWT:ADM,SADM +Env} → pnlService.getRevenueTrends()
GET /cashflows {JWT:ADM,SADM +Env} [ListCashFlowsQueryDto] → pnlService.listCashflows()
POST /cashflows {JWT:ADM,SADM +Env} [CreateCashFlowDto] → pnlService.createCashflow()
GET /cashflow-runway {JWT:ADM,SADM +Env} → pnlService.getCashFlowRunway()
GET /cost-break-even {JWT:ADM,SADM +Env} → pnlService.getCostBreakEven()

### src/modules/fos-profile/fos-profile.controller.ts
## FosProfileController — /profile
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → profileService.getProfile()
PATCH / {JWT:ADM,SADM +Env} [UpdateProfileDto] → profileService.updateProfile()
GET /activity {JWT:ADM,SADM +Env} [ProfileActivityQueryDto] → profileService.getActivity()

### src/modules/fos-records/fos-records.controller.ts
## FosRecordsController — /records
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} [ListRecordsQueryDto] → recordsService.list()
POST / {JWT:ADM,SADM +Env} [CreateRecordDto] → recordsService.create()
DELETE /:id {JWT:ADM,SADM +Env} → recordsService.remove()

### src/modules/fos-reports/fos-reports.controller.ts
## FosReportsController — /reports
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → reportsService.getReports()
GET /management {JWT:ADM,SADM +Env} → reportsService.getManagementSummary()
POST /custom {JWT:ADM,SADM +Env} [CustomReportDto] → reportsService.getCustomReport()

### src/modules/fos-revenue-analytics/fos-revenue-analytics.controller.ts
## FosRevenueAnalyticsController — /revenue
   auth: JWT +Env
GET /transactions {JWT:ADM,SADM +Env} [RevenueTransactionsQueryDto,TransactionsListResponseDto] → revenueService.getTransactions()
GET /aggregates {JWT:ADM,SADM +Env} [RevenueAggregatesResponseDto] → revenueService.getAggregates()
GET /trends {JWT:ADM,SADM +Env} [DateRangeQueryDto,RevenueTrendDto] → revenueService.getTrends()
GET /chart-data {JWT:ADM,SADM +Env} [ChartDataQueryDto,RevenueChartDataResponseDto] → revenueService.getChartData()
GET /business/:businessId/history {JWT:ADM,SADM +Env} [BusinessIdParamDto,BusinessRevenueHistoryResponseDto] → revenueService.getBusinessHistory()

### src/modules/fos-settings/fos-config.controller.ts
## FosConfigController — /settings
   auth: JWT +Env
GET /categories {JWT:ADM,SADM +Env} → configService.listCategories()
POST /categories {JWT:ADM,SADM +Env} [CreateCategoryDto] → configService.createCategory(..),configService.log()
PATCH /categories/:id {JWT:ADM,SADM +Env} [UpdateCategoryDto] → configService.updateCategory(..),configService.log()
DELETE /categories/:id {JWT:ADM,SADM +Env} → configService.removeCategory(..),configService.log()
GET /accounts {JWT:ADM,SADM +Env} → configService.listAccounts()
POST /accounts {JWT:ADM,SADM +Env} [CreateAccountDto] → configService.createAccount(..),configService.log()
PATCH /accounts/:id {JWT:ADM,SADM +Env} [UpdateAccountDto] → configService.updateAccount(..),configService.log()
DELETE /accounts/:id {JWT:ADM,SADM +Env} → configService.removeAccount(..),configService.log()
GET /periods {JWT:ADM,SADM +Env} → configService.listPeriods()
POST /periods {JWT:ADM,SADM +Env} [CreatePeriodDto] → configService.createPeriod(..),configService.log()
PATCH /periods/:id {JWT:ADM,SADM +Env} [UpdatePeriodDto] → configService.updatePeriod(..),configService.log()
DELETE /periods/:id {JWT:ADM,SADM +Env} → configService.removePeriod(..),configService.log()
GET /currencies {JWT:ADM,SADM +Env} → configService.listCurrencies()
POST /currencies {JWT:ADM,SADM +Env} [CreateCurrencyDto] → configService.createCurrency(..),configService.log()
PATCH /currencies/:id {JWT:ADM,SADM +Env} [UpdateCurrencyDto] → configService.updateCurrency(..),configService.log()
DELETE /currencies/:id {JWT:ADM,SADM +Env} → configService.removeCurrency(..),configService.log()
GET /permissions {JWT:ADM,SADM +Env} → configService.getPermissions()
PUT /permissions {JWT:ADM,SADM +Env} [UpdatePermissionsDto] → configService.updatePermissions(..),configService.log()
GET /approval-rules {JWT:ADM,SADM +Env} → configService.listApprovalRules()
POST /approval-rules {JWT:ADM,SADM +Env} [CreateApprovalRuleDto] → configService.createApprovalRule(..),configService.log()
PATCH /approval-rules/:id {JWT:ADM,SADM +Env} [UpdateApprovalRuleDto] → configService.updateApprovalRule(..),configService.log()
DELETE /approval-rules/:id {JWT:ADM,SADM +Env} → configService.removeApprovalRule(..),configService.log()
GET /notification-rules {JWT:ADM,SADM +Env} → configService.listNotificationRules()
POST /notification-rules {JWT:ADM,SADM +Env} [CreateNotificationRuleDto] → configService.createNotificationRule(..),configService.log()
PATCH /notification-rules/:id {JWT:ADM,SADM +Env} [UpdateNotificationRuleDto] → configService.updateNotificationRule(..),configService.log()
DELETE /notification-rules/:id {JWT:ADM,SADM +Env} → configService.removeNotificationRule(..),configService.log()
GET /audit-logs {JWT:ADM,SADM +Env} [ListAuditLogsQueryDto] → configService.listAuditLogs()

### src/modules/fos-settings/fos-settings.controller.ts
## FosSettingsController — /settings
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} → settingsService.getSettings()
PUT / {JWT:ADM,SADM +Env} [UpdateFosSettingsDto] → settingsService.updateSettings()
GET /team {JWT:ADM,SADM +Env} → settingsService.getTeam()
POST /team/invite {JWT:ADM,SADM +Env} [InviteTeamMemberDto] → settingsService.inviteMember()
DELETE /team/:id {JWT:ADM,SADM +Env} → settingsService.removeMember()

### src/modules/fos-transfers/fos-transfers.controller.ts
## FosTransfersController — /transfers
   auth: JWT +Env
GET / {JWT:ADM,SADM +Env} [ListTransfersQueryDto] → transfersService.list()
POST / {JWT:ADM,SADM +Env} [CreateTransferDto] → transfersService.create()
DELETE /:id {JWT:ADM,SADM +Env} → transfersService.remove()

### src/modules/inventory-counting/inventory-counting.controller.ts
## InventoryCountingController — /inventory/counting
   auth: JWT
GET /movements {JWT:OWN,MGR,STF} → stockMovementService.list()
POST /sessions {JWT:OWN,MGR,STF} [CreateCountSessionDto] → countingService.createSession()
GET /sessions {JWT:OWN,MGR,STF} [CountSessionQueryDto] → countingService.listSessions()
GET /sessions/:id {JWT:OWN,MGR,STF} → countingService.getSession()
POST /sessions/:id/start {JWT:OWN,MGR,STF} → countingService.startSession()
POST /sessions/:id/items {JWT:OWN,MGR,STF} [AddCountItemsDto] → countingService.addItems()
PATCH /sessions/:id/items/:itemId {JWT:OWN,MGR,STF} [UpdateCountItemDto] → countingService.updateItem()
POST /sessions/:id/complete {JWT:OWN,MGR,STF} [CompleteCountDto] → countingService.completeSession()
GET /sessions/:id/reconciliation {JWT:OWN,MGR,STF} → countingService.getReconciliationReport()
POST /sessions/:id/approve {JWT:OWN,MGR} [ApproveVarianceDto] → countingService.approveSession()
POST /sessions/:id/reject {JWT:OWN,MGR} [RejectVarianceDto] → countingService.rejectSession()

### src/modules/knowledge-base/admin-knowledge-base.controller.ts
## AdminKnowledgeBaseController — /knowledge-base
   auth: JWT:ADM
POST /categories [CreateKbCategoryDto] → kbService.createCategory()
PATCH /categories/:id [UpdateKbCategoryDto] → kbService.updateCategory()
DELETE /categories/:id → kbService.deleteCategory()
POST /sections [CreateKbSectionDto] → kbService.createSection()
PATCH /sections/:id [UpdateKbSectionDto] → kbService.updateSection()
DELETE /sections/:id → kbService.deleteSection()
POST /pages [CreateKbPageDto] → kbService.createPage()
PATCH /pages/:id [UpdateKbPageDto] → kbService.updatePage()
DELETE /pages/:id → kbService.deletePage()

### src/modules/knowledge-base/public-knowledge-base.controller.ts
## PublicKnowledgeBaseController — /knowledge-base
   auth: JWT
GET / {PUB} → kbService.getPublicTree()
GET /pages/by-path {PUB} → kbService.getPageByPath()
GET /pages/:id {PUB} → kbService.getPageById()

### src/modules/legal-compliance/legal-compliance.controller.ts
## LegalComplianceController — /legal-agreements
   auth: JWT
GET / {JWT:OWN,MGR,ADM,STF} [AgreementResponseDto] → legalComplianceService.findAll()
GET /:slug {JWT:OWN,MGR,ADM,STF} → legalComplianceService.findBySlug()
GET /:slug/acceptance {JWT:OWN,MGR,ADM,STF} → legalComplianceService.getAcceptance()
GET /:slug/history {JWT:OWN,ADM} [PaginatedAgreementHistoryDto] → legalComplianceService.getHistory()
POST /:slug/accept {JWT:OWN,MGR,ADM,STF} [AcceptAgreementDto] → legalComplianceService.accept()
POST / {JWT:ADM} [CreateAgreementDto] → legalComplianceService.create()
GET /admin/all {JWT:ADM} → legalComplianceService.findAllAdmin()
PATCH /:id {JWT:ADM} [UpdateAgreementDto] → legalComplianceService.update()
DELETE /:id {JWT:ADM} → legalComplianceService.remove()

### src/modules/loyalty/loyalty.controller.ts
## LoyaltyController — /loyalty
   auth: JWT
GET /item-details/:id {PUB} → loyaltyService.findOne()
POST /visitor/points/earn {PUB} [VisitorPointsEarnDto] → loyaltyService.earnForVisitor()
POST /earn {PUB} [LegacyVisitorPointsEarnDto] → loyaltyService.earnForVisitor()
POST /earn/manual {JWT:OWN,MGR} [ManualEarnPointsDto] → loyaltyService.earnManualPoints()
GET /points/balance {JWT:CUS} → loyaltyService.getCustomerPoints()
GET /points/tier {JWT:CUS} → loyaltyService.getCustomerTier()
GET /points/logs {JWT:CUS} [CustomerPointLogsQueryDto] → loyaltyService.getPointLogs()
GET /points/business-logs {JWT:OWN,ADM} [PointLogsQueryDto] → loyaltyService.getBusinessPointLogs()
GET /business-stats {JWT:OWN,MGR,STF,ADM} → loyaltyService.getBusinessLoyaltyStats()
GET /rules {JWT:OWN,ADM,MGR} → loyaltyService.getRules()
PATCH /rules {JWT:OWN,ADM} [UpdateLoyaltyRuleDto] → loyaltyService.upsertRules()
POST /points/give {JWT:OWN,MGR,STF+perm(pos)} [GivePointsDto] → loyaltyService.givePoints()
POST /points/generate-code {JWT:OWN,MGR,STF+perm(pos)} [GeneratePointCodeDto] → loyaltyService.generatePointCode()
POST /points/use-code {JWT:CUS} [UsePointCodeDto] → loyaltyService.usePointCode()
POST /reward-templates {JWT:ADM} [CreateRewardTemplateDto] → loyaltyService.createTemplate()
GET /reward-templates {JWT:OWN,ADM} → loyaltyService.getTemplates()
PATCH /reward-templates/:id {JWT:ADM} [UpdateRewardTemplateDto] → loyaltyService.updateTemplate()
DELETE /reward-templates/:id {JWT:ADM} → loyaltyService.deleteTemplate()
POST /reward-templates/:id/apply {JWT:OWN,MGR+perm(marketing)} [ApplyRewardTemplateDto] → loyaltyService.applyTemplate()
POST /rewards {JWT:OWN,ADM,MGR,STF+perm(marketing)} [CreateRewardDto] → loyaltyService.createReward()
GET /rewards/branch/:branchId {PUB} [BranchIdParamDto,PaginationQueryDto] → loyaltyService.getBranchRewards()
GET /rewards {PUB} [RewardQueryDto] → loyaltyService.getPublicRewards()
PATCH /rewards/:id {JWT:OWN,ADM,MGR,STF+perm(marketing)} [CreateRewardDto] → loyaltyService.updateReward()
DELETE /rewards/:id {JWT:OWN,ADM,MGR,STF+perm(marketing)} → loyaltyService.deleteReward()
GET /rewards/:id/redemptions {JWT:OWN,MGR,STF+perm(marketing)} [PaginationQueryDto] → loyaltyService.getRewardRedemptions()
POST /redemption/generate-code {JWT:OWN,MGR,STF+perm(pos)} [GenerateRedemptionCodeDto] → loyaltyService.generateRedemptionCode()
POST /redemption/redeem {JWT:CUS} [RedeemRewardDto] → loyaltyService.redeemReward()
POST /redemption/redeem-reward {JWT:CUS} [RedeemRewardByIdDto] → loyaltyService.redeemRewardById()
POST /verify-redemption {JWT:OWN,MGR,STF+perm(pos)} [VerifyRedemptionDto] → loyaltyService.verifyRedemption()
GET /analytics {JWT:CUS} [CustomerAnalyticsQueryDto] → loyaltyService.getCustomerAnalytics()

### src/modules/loyalty/public-loyalty.controller.ts
## PublicLoyaltyController — /public/loyalty
   auth: JWT
GET /rewards {PUB} [RewardQueryDto] → loyaltyService.getPublicRewards()

### src/modules/marketing-assets/controllers/ai-prompts.controller.ts
## AIPromptsController — /marketing-ai-prompts
   auth: JWT
POST / {JWT:ADM} [CreateAIPromptDto] → aiPromptsService.create()
GET / → aiPromptsService.findAll()
POST /generate [GenerateAIContentDto] → aiPromptsService.generateContent()
GET /:id → aiPromptsService.findOne()
PATCH /:id {JWT:ADM} [CreateAIPromptDto] → aiPromptsService.update()
DELETE /:id {JWT:ADM} → aiPromptsService.remove()

### src/modules/marketing-assets/controllers/analytics.controller.ts
## AnalyticsController — /marketing-analytics
   auth: JWT
POST /track/:assetId {PUB} → analyticsService.trackEvent()
GET /overview {JWT:OWN,MGR,STF,ADM} → analyticsService.getBusinessOverview()
GET /asset/:id {JWT:OWN,MGR,STF,ADM} → analyticsService.getAssetPerformance()

### src/modules/marketing-assets/controllers/audit-logs.controller.ts
## AuditLogsController — /marketing-audit-logs
   auth: JWT
GET / {JWT:ADM} → auditLogService.findAll()

### src/modules/marketing-assets/controllers/brand-profile.controller.ts
## BrandProfileController — /marketing-brand-profile
   auth: JWT
GET / → brandProfileService.getBrandProfile()
POST / [SaveBrandOverrideDto] → brandProfileService.saveBrandOverride()
DELETE / → brandProfileService.deleteBrandOverride()

### src/modules/marketing-assets/controllers/brand-rules.controller.ts
## BrandRulesController — /marketing-brand-rules
   auth: JWT
GET / → brandRulesService.getRules()
POST / [SaveBrandRuleDto] → brandRulesService.saveRules()

### src/modules/marketing-assets/controllers/categories.controller.ts
## CategoriesController — /marketing-categories
   auth: JWT
POST / {JWT:ADM} [CreateMarketingCategoryDto] → categoriesService.create()
GET / → categoriesService.findAll()
GET /:id → categoriesService.findOne()
PATCH /:id {JWT:ADM} [UpdateMarketingCategoryDto] → categoriesService.update()
DELETE /:id {JWT:ADM} → categoriesService.remove()

### src/modules/marketing-assets/controllers/downloads.controller.ts
## DownloadsController — /marketing-downloads
   auth: JWT
POST /:assetId [RecordDownloadDto] → downloadsService.recordDownload()
GET / [FindDownloadsQueryDto] → downloadsService.getDownloads()

### src/modules/marketing-assets/controllers/marketing-assets.controller.ts
## MarketingAssetsController — /marketing-assets
   auth: JWT
POST / {JWT:OWN,MGR,STF,ADM} [CreateAssetDto] → assetsService.create()
GET / {JWT:OWN,MGR,STF,ADM} [FindMarketingAssetsQueryDto] → assetsService.findAll()
GET /:id {JWT:OWN,MGR,STF,ADM} → assetsService.findOne()
PATCH /:id {JWT:OWN,MGR,STF,ADM} [UpdateAssetDto] → assetsService.update()
DELETE /:id {JWT:OWN,MGR,STF,ADM} → assetsService.remove()
GET /:id/versions {JWT:OWN,MGR,STF,ADM} → assetsService.getVersions()
POST /:id/restore/:versionId {JWT:OWN,MGR,STF,ADM} → assetsService.restoreVersion()

### src/modules/marketing-assets/controllers/marketing-templates.controller.ts
## MarketingTemplatesController — /marketing-templates
   auth: JWT
POST / {JWT:ADM} [CreateMarketingTemplateDto] → templatesService.create()
GET / {JWT:ADM,OWN,MGR} → templatesService.findAll()
GET /categories {JWT:ADM,OWN,MGR} → templatesService.getCategories()
GET /:id {JWT:ADM,OWN,MGR} → templatesService.findOne()
PATCH /:id {JWT:ADM} [UpdateMarketingTemplateDto] → templatesService.update()
DELETE /:id {JWT:ADM} → templatesService.remove()

### src/modules/marketing-assets/controllers/mockups.controller.ts
## MockupsController — /marketing-mockups
   auth: JWT
POST / {JWT:ADM} [CreateMockupDto] → mockupsService.create()
GET / → mockupsService.findAll()
GET /:id → mockupsService.findOne()
PATCH /:id {JWT:ADM} [CreateMockupDto] → mockupsService.update()
DELETE /:id {JWT:ADM} → mockupsService.remove()

### src/modules/marketing-assets/controllers/settings.controller.ts
## SettingsController — /marketing-settings
   auth: JWT
GET / {JWT:ADM} → settingsService.findAll()
GET /:key → settingsService.findByKey()
POST / {JWT:ADM} [SaveSettingDto] → settingsService.upsert()
DELETE /:key {JWT:ADM} → settingsService.remove()

### src/modules/marketing-assets/controllers/template-formats.controller.ts
## TemplateFormatsController — /marketing-template-formats
   auth: JWT
POST / {JWT:ADM} [CreateTemplateFormatDto] → formatsService.create()
GET / → formatsService.findAll()
GET /:id → formatsService.findOne()
PATCH /:id {JWT:ADM} [UpdateTemplateFormatDto] → formatsService.update()
DELETE /:id {JWT:ADM} → formatsService.remove()

### src/modules/marketing-assets/controllers/template-styles.controller.ts
## TemplateStylesController — /marketing-template-styles
   auth: JWT
POST / {JWT:ADM} [CreateTemplateStyleDto] → stylesService.create()
GET / → stylesService.findAll()
GET /:id → stylesService.findOne()
PATCH /:id {JWT:ADM} [UpdateTemplateStyleDto] → stylesService.update()
DELETE /:id {JWT:ADM} → stylesService.remove()

### src/modules/messaging/controllers/admin-flow-engine.controller.ts
## AdminFlowEngineController — /admin/flow-engine
   auth: JWT:ADM
GET /templates → adminFlowService.getTemplates()
POST /templates [CreateFlowTemplateDto] → adminFlowService.createTemplate()
PUT /templates/:id [IdDto,UpdateFlowTemplateDto] → adminFlowService.updateTemplate()
DELETE /templates/:id [IdDto] → adminFlowService.deleteTemplate()
GET /triggers → adminFlowService.getTriggers()
PUT /triggers/:key [UpdateFlowTriggerConfigDto] → adminFlowService.updateTrigger()
GET /sessions [FlowFilterDto] → adminFlowService.getSessions()
GET /logs [FlowFilterDto] → adminFlowService.getLogs()
GET /analytics [FlowFilterDto] → adminFlowService.getAnalytics()
GET /settings → adminFlowService.getSettings()
PUT /settings [UpdateSettingDto] → adminFlowService.updateSettings()

### src/modules/messaging/controllers/automations.controller.ts
## AutomationsController — /messaging/automations
   auth: JWT+perm(messages) +Trial
POST / {JWT:OWN,MGR+perm(messages) +Trial} [CreateAutomationRuleDto] → automationService.create()
GET / [BranchFilterDto] → automationService.findAll()
GET /logs [BranchFilterDto] → automationService.findLogs()
GET /logs/:sessionId [SessionIdDto] → automationService.findLogDetails()
GET /connection-status [BranchFilterDto] → automationService.getConnectionStatus()
GET /performance [BranchFilterDto] → automationService.getPerformanceAnalytics()
GET /:id [IdDto] → automationService.findOne()
PATCH /:id {JWT:OWN,MGR+perm(messages) +Trial} [IdDto,UpdateAutomationRuleDto] → automationService.findOne(..),automationService.update()
DELETE /:id {JWT:OWN,MGR+perm(messages) +Trial} [IdDto] → automationService.findOne(..),automationService.remove()
PATCH /:id/toggle {JWT:OWN,MGR+perm(messages) +Trial} [IdDto,UpdateAutomationToggleDto] → automationService.findOne(..),automationService.toggleAutomation()
PATCH /:id/configure {JWT:OWN,MGR+perm(messages) +Trial} [IdDto,UpdateAutomationConfigDto] → automationService.findOne(..),automationService.configureAutomation()

### src/modules/messaging/controllers/channel-settings.controller.ts
## ChannelSettingsController — /messaging/channel-settings
   auth: JWT:OWN,MGR,ADM
GET / [BranchFilterDto] → messagingHelperService.resolveBranchId(..),channelSettingsService.getChannelSettings()
PATCH / [UpdateChannelSettingsDto] → messagingHelperService.resolveBranchId(..),channelSettingsService.updateChannelSettings()
POST /generate-dns-records → channelSettingsService.updateChannelSettings()

### src/modules/messaging/controllers/chat-settings.controller.ts
## ChatSettingsController — /messaging/chat/settings
   auth: JWT:OWN,MGR,ADM
GET /automation [BranchFilterDto] → chatSettingsService.getAutomatedReplies()
PATCH /automation [BranchFilterDto,UpdateChatAutomationDto] → chatSettingsService.updateAutomatedReplies()
POST /automation/faq [AddFaqKeywordDto,BranchFilterDto] → chatSettingsService.addFaqKeyword()
PATCH /automation/faq/:id [BranchFilterDto,IdDto,UpdateFaqKeywordDto] → chatSettingsService.updateFaqKeyword()
DELETE /automation/faq/:id [BranchFilterDto,IdDto] → chatSettingsService.deleteFaqKeyword()
GET /categories [BranchFilterDto] → chatSettingsService.getCategories()
POST /categories [BranchFilterDto,CreateChatCategoryDto] → chatSettingsService.createCategory()
PATCH /categories/:id [BranchFilterDto,IdDto,UpdateChatCategoryDto] → chatSettingsService.updateCategory()
DELETE /categories/:id [BranchFilterDto,IdDto] → chatSettingsService.deleteCategory()

### src/modules/messaging/controllers/credit-plan.controller.ts
## CreditPlanController — /credit-plans
   auth: JWT
POST / {JWT:ADM} [CreateCreditPlanDto] → creditPlanService.create()
GET / {JWT:OWN,MGR,STF,ADM} → creditPlanService.findAll()
GET /my-credits {JWT:OWN,MGR,ADM} → creditPlanService.getMyCredits()
GET /rates {JWT:OWN,MGR,STF,ADM} → creditPlanService.getRates()
GET /:id {JWT:OWN,MGR,STF,ADM} [IdDto] → creditPlanService.findOne()
POST /custom/purchase {JWT:OWN,MGR,ADM} [PurchaseCustomCreditsDto] → creditPlanService.purchaseCustom()
POST /:id/purchase {JWT:OWN,MGR,ADM} [IdDto,PurchaseCreditPlanDto] → creditPlanService.purchase()
PATCH /:id {JWT:ADM} [IdDto,UpdateCreditPlanDto] → creditPlanService.update()
DELETE /:id {JWT:ADM} [IdDto] → creditPlanService.remove()

### src/modules/messaging/controllers/credit.controller.ts
## CreditController — /credits
   auth: JWT
GET /balance → creditService.getOrCreateWallet()
GET /business/:businessId {JWT:ADM} [BusinessIdDto] → creditService.getOrCreateWallet()
POST /adjust {JWT:ADM} [AdjustCreditsDto] → creditService.addCredits(..),creditService.deductCredits()

### src/modules/messaging/controllers/customer-messaging-media.controller.ts
## CustomerMessagingMediaController — /customer/messaging
   auth: JWT:CUS
POST /media {JWT:CUS +SkipSub +File} → uploadsService.uploadImage()

### src/modules/messaging/controllers/customer-messaging.controller.ts
## CustomerMessagingController — /customer/messaging
   auth: JWT
GET /threads {JWT:CUS} [BranchFilterDto] → inboxService.findOrCreateCustomerThread(..),inboxService.getCustomerThreads()
POST /threads/start {JWT:CUS} [StartConversationDto] → inboxService.startCustomerConversation()
GET /threads/:threadId {JWT:CUS} [ThreadIdDto] → inboxService.getCustomerThreadMessages()
POST /threads/:threadId/reply {JWT:CUS} [ReplyDto,ThreadIdDto] → inboxService.sendCustomerReply()
POST /threads/:threadId/read {JWT:CUS} [ThreadIdDto] → inboxService.markAsRead()
DELETE /threads/:threadId {JWT:CUS} [ThreadIdDto] → inboxService.deleteThread()
PATCH /messages/:id {JWT:CUS} [UpdateMessageDto] → inboxService.editMessage()
DELETE /messages/:id {JWT:CUS} → inboxService.deleteMessage()

### src/modules/messaging/controllers/flow.controller.ts
## FlowController — /messaging/flows
   auth: JWT
POST / {JWT:OWN,MGR,ADM +Trial} [CreateFlowDto] → flowsService.create()
GET / {JWT +Trial} [GetFlowsDto] → flowsService.findAll()
POST /:id/status {JWT:OWN,MGR,ADM +Trial} [IdDto,UpdateFlowStatusDto] → flowsService.updateStatus()

### src/modules/messaging/controllers/messaging.controller.ts
## MessagingController — /messaging
   auth: JWT
POST /send {JWT:OWN,MGR,STF+perm(messages) +Trial} [SendMessageDto] → messagingEngine.sendMessage()
GET /templates {JWT:OWN,MGR,STF,ADM+perm(messages) +Trial} [BranchFilterDto] → templateService.getAvailableTemplates()
POST /templates {JWT:OWN,MGR,ADM+perm(messages) +Trial} [CreateMessagingTemplateDto] → templateService.createTemplate()
PATCH /templates/:id {JWT:OWN,MGR,ADM+perm(messages) +Trial} [CreateMessagingTemplateDto,IdDto] → templateService.updateTemplate()
GET /admin/templates {JWT:ADM} → templateService.findAllAdmin()
POST /admin/templates/:id/status {JWT:ADM} [IdDto,UpdateTemplateStatusDto] → templateService.updateStatus()
GET /campaigns {JWT+perm(messages) +Trial} [BranchFilterDto] → campaignService.getCampaigns()
GET /analytics {JWT+perm(messages) +Trial} [MessagingAnalyticsFilterDto] → analyticsService.getDashboardMetrics()
GET /inbox/:channel {JWT:OWN,MGR,STF,ADM+perm(messages) +Trial} [MessagingThreadFilterDto] → inboxService.getThreads()
GET /inbox/threads/:threadId {JWT:OWN,MGR,STF,ADM+perm(messages) +Trial} [BranchFilterDto,ThreadIdDto] → inboxService.getThreadMessages()
POST /inbox/threads/:threadId/reply {JWT:OWN,MGR,STF+perm(messages) +Trial} [BranchFilterDto,ReplyDto,ThreadIdDto] → inboxService.sendReply()
POST /inbox/threads/:threadId/read {JWT:OWN,MGR,STF,ADM+perm(messages) +Trial} [BranchFilterDto,ThreadIdDto] → inboxService.markAsRead()
POST /inbox/threads/init {JWT:OWN,MGR,STF+perm(messages) +Trial} → inboxService.initBranchConversation()
DELETE /inbox/threads/:threadId {JWT:OWN,MGR,STF,ADM+perm(messages) +Trial} [BranchFilterDto,ThreadIdDto] → inboxService.deleteThread()
DELETE /templates/:id {JWT:OWN,MGR,ADM+perm(messages) +Trial} [IdDto] → templateService.deleteTemplate()
PATCH /messages/:id {JWT:OWN,MGR,STF+perm(messages) +Trial} [BranchFilterDto,UpdateMessageDto] → inboxService.editMessage()
DELETE /messages/:id {JWT:OWN,MGR,STF+perm(messages) +Trial} [BranchFilterDto] → inboxService.deleteMessage()

### src/modules/messaging/controllers/twilio.controller.ts
## TwilioWebhookController — /messaging/webhook/twilio
   auth: JWT
POST / → twilioProvider.validateRequest(..),logger.warn()

### src/modules/notifications/notifications.controller.ts
## NotificationsController — /notifications
   auth: JWT
POST /push-token [RegisterPushTokenDto] → pushNotificationService.registerToken()
DELETE /push-token → pushNotificationService.clearToken()
GET /preferences {JWT:ADM,OWN,MGR,STF,AGT,CUS} → notificationsService.getPreferences()
PATCH /preferences {JWT:ADM,OWN,MGR,STF,AGT,CUS} [UpdateNotificationPreferencesDto] → notificationsService.updatePreferences()
GET / [ListNotificationsDto] → notificationsService.findByUser()
GET /unread-count → notificationsService.getUnreadCount()
GET /business {JWT:OWN,MGR,ADM,STF} [ListNotificationsDto] → notificationsService.findByBusiness()
POST /mark-all-read → notificationsService.markAllAsRead()
PATCH /mark-all-read → notificationsService.markAllAsRead()
PATCH /read-all → notificationsService.markAllAsRead()
PATCH /:id/read → notificationsService.markAsRead()
POST /admin/broadcast {JWT:ADM,SADM} [AdminBroadcastDto] → notificationsService.sendAdminBroadcast()
POST /broadcast {JWT:ADM,SADM} [AdminBroadcastDto] → notificationsService.sendAdminBroadcast()
GET /admin/broadcasts {JWT:ADM,SADM} [BroadcastQueryDto] → notificationsService.getBroadcastHistory()
GET /admin/history/broadcasts {JWT:ADM,SADM} [BroadcastQueryDto] → notificationsService.getBroadcastHistory()
GET /admin/broadcasts/:id {JWT:ADM,SADM} → notificationsService.getBroadcastById()

### src/modules/partnerships/partnerships.controller.ts
## PartnershipsController — /partnerships
   auth: JWT +BizVer
GET /nearby-branches {JWT:OWN,MGR +BizVer} [NearbyPartnersQueryDto] → partnershipsService.findNearbyPartnerableBranches()
POST /invite {JWT:OWN,MGR +BizVer} [InvitePartnershipDto] → partnershipsService.invitePartnership()
PATCH /:id/respond {JWT:OWN,MGR +BizVer} [RespondPartnershipDto] → partnershipsService.respondToInvitation()
GET /invitations {JWT:OWN,MGR +BizVer} [PartnershipQueryDto] → partnershipsService.getInvitations()

### src/modules/payments/payments.controller.ts
## PaymentsController — /payments
   auth: JWT
GET /verify/:reference {JWT:OWN,ADM +SkipSub} → paymentsService.verifyTransaction()
POST /webhook {PUB +SkipSub} → paymentsService.verifyWebhookSignature()

### src/modules/pos/pos.controller.ts
## PosController — /pos
   auth: JWT
POST /sales {JWT:OWN,MGR,ADM,STF} [CreatePosSaleDto] → posService.completeSale()
POST /sales/batch-sync {JWT:OWN,MGR,ADM,STF} [CreatePosSaleDto] → posService.batchSyncSales()
GET /sales {JWT:OWN,MGR,ADM,STF} [PosSaleQueryDto] → posService.findAllSales()
GET /sales/held {JWT:OWN,MGR,ADM,STF} [BranchFilterDto] → posService.findAllHeldSales()
GET /sales/held/:id {JWT:OWN,MGR,ADM,STF} → posService.resumeHeldSale()
DELETE /sales/held/:id {JWT:OWN,MGR,ADM,STF} → posService.deleteHeldSale()
GET /sales/:id {JWT:OWN,MGR,ADM,STF} → posService.findOneSale()
PATCH /sales/:id/status {JWT:OWN,MGR,ADM} [UpdatePosSaleStatusDto] → posService.updateSaleStatus()
POST /sales/hold {JWT:OWN,MGR,ADM,STF} [HoldPosSaleDto] → posService.holdSale()
POST /register/open {JWT:OWN,MGR,ADM,STF} [OpenRegisterDto] → posService.openRegister()
POST /register/close {JWT:OWN,MGR,ADM,STF} [CloseRegisterDto] → posService.closeRegister()
GET /register/status {JWT:OWN,MGR,ADM,STF} → posService.getRegisterStatus()
POST /register/cash-drop {JWT:OWN,MGR,ADM,STF} [CashDropDto] → posService.cashDrop()
GET /register/z-report {JWT:OWN,MGR,ADM,STF} → posService.getZReport()
GET /register/history {JWT:OWN,MGR,ADM} [RegisterHistoryQueryDto] → posService.getRegisterHistory()
GET /dashboard {JWT:OWN,MGR,ADM,STF} [BranchFilterDto] → posService.getDashboard()
GET /dashboard/top-products {JWT:OWN,MGR,ADM,STF} [BranchFilterDto] → posService.getTopProducts()
GET /customers {JWT:OWN,MGR,ADM,STF} [PosCustomerQueryDto] → posService.findCustomers()
GET /customers/:id {JWT:OWN,MGR,ADM,STF} → posService.findCustomerById()
PATCH /products/:id/stock {JWT:OWN,MGR,ADM,STF} → posService.adjustStock()
POST /orders {PUB} [CreatePosOrderDto] → posService.placeOrder()
POST /orders/:id/process-payment {JWT:OWN,MGR,ADM,STF} [ProcessPosOrderPaymentDto] → posService.processOrderPayment()

### src/modules/products/products.controller.ts
## ProductsController — /products
   auth: JWT
POST / {JWT:ADM} [CreateProductDto] → productsService.create()
GET / {PUB} [PublicProductsQueryDto] → catalogueService.findPublishedItemsPublic()
POST /types {JWT:ADM} [CreateProductTypeDto] → productsService.createProductType()
GET /types {PUB} → productsService.findAllProductTypes()
PATCH /types/:id {JWT:ADM} [UpdateProductTypeDto] → productsService.updateProductType()
DELETE /types/:id {JWT:ADM} → productsService.removeProductType()
GET /admin {JWT:ADM} [AdminProductQueryDto] → productsService.findAllAdmin()
GET /admin/stats {JWT:ADM} → productsService.getAdminStats()
GET /admin/count-by-type/:id {JWT:ADM} → productsService.countByProductType()
GET /reviews/pending {JWT:ADM} [ProductReviewsAdminQueryDto] → productsService.findReviewsAdmin()
PATCH /reviews/:id/approve {JWT:ADM} → productsService.updateReviewStatus()
PATCH /reviews/:id/reject {JWT:ADM} → productsService.updateReviewStatus()
PATCH /reviews/:id/status {JWT:ADM} [UpdateProductReviewStatusDto] → productsService.updateReviewStatus()
GET /:id/reviews {PUB} → productsService.findApprovedReviews()
POST /:id/reviews {PUB} [CreateProductReviewDto] → productsService.createReview()
GET /:id {PUB} → productsService.findOne()
PATCH /:id {JWT:ADM} [UpdateProductDto] → productsService.update()
POST /orders {JWT:OWN} [CreateOrderDto] → productsService.createDirectOrder()
DELETE /:id {JWT:ADM} → productsService.remove()
POST /:id/quote {JWT:CUS,OWN,ADM} [RequestQuoteDto] → productsService.requestQuote()
GET /quotes/all {JWT:ADM} → productsService.getAllQuotesAdmin()
GET /quotes/my {JWT:CUS,OWN,ADM} → productsService.getMyQuotes()
POST /quotes/:id/negotiate {JWT:ADM,OWN} [NegotiateQuoteDto] → productsService.negotiateQuote()
POST /quotes/:id/accept {JWT:CUS,OWN} → productsService.acceptQuote()
POST /quotes/:id/reject {JWT:CUS,OWN} → productsService.rejectQuote()
GET /orders/all {JWT:ADM} → productsService.getAllOrdersAdmin()
GET /orders/my {JWT:OWN} → productsService.getMyOrders()
PATCH /orders/:id/ready {JWT:ADM} → productsService.markOrderReady()
PATCH /orders/:id/complete {JWT:ADM} → productsService.markOrderCompleted()
PATCH /orders/:id/status {JWT:ADM} → productsService.updateOrderStatus()

### src/modules/promotions/promotions.controller.ts
## BoostsController — /boosts    (factory campaignController('boosts','Boosts'))
   auth: JWT:OWN,MGR
GET / [ListCampaignsQueryDto] → service.list()
GET /summary → service.summary()
GET /options → service.options()
GET /eligible-assets → service.eligibleAssets()
POST /forecast [ForecastDto] → service.forecast()
POST / [SaveCampaignDto] → service.create()
GET /:id → service.get()
PATCH /:id [SaveCampaignDto] → service.update()
DELETE /:id → service.remove()
POST /:id/launch [LaunchCampaignDto] → service.launch()
POST /:id/pause → service.pause()
POST /:id/resume → service.resume()
POST /:id/end → service.end()
GET /:id/stats → service.stats()

### src/modules/promotions/promotions.controller.ts
## PromotionsController — /promotions    (factory campaignController('promotions','Promotions'))
   auth: JWT:OWN,MGR
GET / [ListCampaignsQueryDto] → service.list()
GET /summary → service.summary()
GET /options → service.options()
GET /eligible-assets → service.eligibleAssets()
POST /forecast [ForecastDto] → service.forecast()
POST / [SaveCampaignDto] → service.create()
GET /:id → service.get()
PATCH /:id [SaveCampaignDto] → service.update()
DELETE /:id → service.remove()
POST /:id/launch [LaunchCampaignDto] → service.launch()
POST /:id/pause → service.pause()
POST /:id/resume → service.resume()
POST /:id/end → service.end()
GET /:id/stats → service.stats()

### src/modules/promotions/sponsored.controller.ts
## SponsoredController — /sponsored
   auth: PUB
GET / [SponsoredQueryDto] → sponsored.serve()
POST /events [RecordSponsoredEventsDto] → sponsored.recordEvents()

### src/modules/public-discovery/public-discovery.controller.ts
## PublicDiscoveryController — /public
   auth: JWT
GET /businesses {PUB} [PublicBusinessesQueryDto] → discoveryService.findBusinesses()
GET /search {PUB} [PublicSearchQueryDto] → discoveryService.search()
GET /stats {PUB} → discoveryService.getStats()

### src/modules/qr-thrive/qr-thrive-callback.controller.ts
## QrThriveCallbackController — /integration/qr-thrive
   auth: PUB +ApiKey
POST /callback → logger.log(..),logger.log()

### src/modules/qr-thrive/qr-thrive.controller.ts
## QrThriveController — /qr-thrive
   auth: JWT
POST /sync {JWT:OWN,MGR} → qrThriveService.syncUser()
POST /branches/:branchId/qr-codes {JWT:OWN,MGR} [CreateQRCodeDto] → qrThriveService.createQRCode()
GET /branches/:branchId/qr-codes {JWT:OWN,MGR} → qrThriveService.getQRCodes()
GET /branches/:branchId/qr-codes/:qrCodeId {JWT:OWN,MGR} → qrThriveService.getQRCode()
PATCH /branches/:branchId/qr-codes/:qrCodeId {JWT:OWN,MGR} [UpdateQRCodeDto] → qrThriveService.updateQRCode()
DELETE /branches/:branchId/qr-codes/:qrCodeId {JWT:OWN,MGR} → qrThriveService.deleteQRCode()
POST /branches/:branchId/qr-codes/:qrCodeId/duplicate {JWT:OWN,MGR} → qrThriveService.duplicateQRCode()
PATCH /branches/:branchId/qr-codes/:qrCodeId {JWT:OWN,MGR} → qrThriveService.updateQRCode()
GET /branches/:branchId/main-qr {JWT:OWN,MGR} → qrThriveService.getMainQRCode()
PATCH /branches/:branchId/main-qr/:qrCodeId {JWT:OWN,MGR} [UpdateQRCodeDto] → qrThriveService.updateMainQRCode()
POST /branches/:branchId/main-qr/recreate {JWT:OWN,MGR} → qrThriveService.recreateMainQRCode()
POST /branches/:branchId/qr-codes/:qrCodeId/set-as-main {JWT:OWN,MGR} → qrThriveService.setAsMainQRCode()
GET /branches/:branchId/stats {JWT:OWN,MGR} → qrThriveService.getStats()
GET /branches/:branchId/folders {JWT:OWN,MGR} → qrThriveService.getFolders()
POST /branches/:branchId/folders {JWT:OWN,MGR} [CreateFolderDto] → qrThriveService.createFolder()
DELETE /branches/:branchId/folders/:folderId {JWT:OWN,MGR} → qrThriveService.deleteFolder()
PUT /branches/:branchId/folders/:folderId {JWT:OWN,MGR} [UpdateFolderDto] → qrThriveService.updateFolder()
GET /branches/:branchId/qr-codes/:qrCodeId/scans {JWT:OWN,MGR} → qrThriveService.getScans()
GET /branches/:branchId/qr-codes/:qrCodeId/responses {JWT:OWN,MGR} → qrThriveService.getResponses()
GET /branches/:branchId/leads {JWT:OWN,MGR} → qrThriveService.getLeads()
GET /branches/:branchId/specialized-leads {JWT:OWN,MGR} [SpecializedLeadsQueryDto] → qrThriveService.getSpecializedLeads()
PATCH /branches/:branchId/specialized-leads/:leadId/status {JWT:OWN,MGR} [UpdateLeadStatusDto] → qrThriveService.updateLeadStatus()
GET /sso {JWT:OWN,MGR} → qrThriveService.getMagicLink()
GET /plans {JWT:ADM,OWN,MGR} → qrThriveService.getPlans()
DELETE /me/mapping {JWT:OWN,MGR} → qrThriveService.resetMapping()
GET /subscription-token → qrThriveService.generateSubscriptionToken()
GET /public/:shortId {PUB} → qrThriveService.getPublicQRCode()
GET /scan/:shortId {PUB} → qrThriveService.recordPublicScan()
POST /public/scan/:shortId {PUB} → qrThriveService.recordPublicScan(..),qrThriveService.getPublicQRCode()
POST /public/forms/:shortId/submit {PUB} → qrThriveService.submitPublicForm()
GET /public/forms/:shortId {PUB} → qrThriveService.getPublicForm()

### src/modules/rotator/rotator.controller.ts
## RotatorPublicController — /clusters
   auth: JWT
POST /:uniqueCode/events {PUB} [RecordClusterEventDto] → rotator.recordClusterEvent()
## GlobalRotatorController — /admin/rotator
   auth: JWT
GET /config {JWT:ADM} → rotator.getGlobalConfig()
PUT /config {JWT:ADM} [UpdateRotatorGlobalConfigDto] → rotator.updateGlobalConfig()
POST /config/reset {JWT:ADM} → rotator.resetGlobalConfig()
## ClusterRotatorController — /admin/clusters/:id/rotator
   auth: JWT
GET / {JWT:ADM} → rotator.getClusterConfig()
PUT / {JWT:ADM} [UpdateRotatorClusterConfigDto] → rotator.updateClusterConfig()
POST /reset {JWT:ADM} → rotator.resetClusterConfig()
GET /eligibility {JWT:ADM} → rotator.eligibilitySummary()
PUT /offers/:offerId {JWT:ADM} [SetClusterOfferIncludedDto] → rotator.setClusterOffer()
PUT /offers/:offerId/delivery {JWT:ADM} [SetClusterOfferDeliveryDto] → rotator.setOfferDelivery()
GET /offers/:offerId/why {JWT:ADM} → rotator.explain()
GET /preview {JWT:ADM} [PreviewRotationDto] → rotator.preview()
GET /schedules/:offerId {JWT:ADM} → rotator.listSchedules()
PUT /schedules/:offerId {JWT:ADM} [UpsertDealScheduleDto] → rotator.upsertSchedule()
DELETE /schedules/:scheduleId {JWT:ADM} → rotator.deleteSchedule()
GET /analytics/summary {JWT:ADM} [RotatorAnalyticsQueryDto] → analytics.getClusterSummary()
GET /analytics/offers {JWT:ADM} [RotatorAnalyticsQueryDto] → analytics.getOfferAnalytics()
GET /analytics/windows {JWT:ADM} [RotatorWindowHistoryQueryDto] → analytics.getWindowHistory()

### src/modules/saved/controllers/businesses-save.controller.ts
## BusinessesSaveController — /businesses
   auth: JWT
POST /:id/save {JWT:CUS} [SaveToggleResponseDto] → savedService.toggleBusinessSave()
GET /:id/save-status {JWT:CUS} [SaveStatusResponseDto] → savedService.getBusinessSaveStatus()

### src/modules/saved/controllers/me-saved.controller.ts
## MeSavedController — /me/saved
   auth: JWT
GET / {JWT:CUS} [SavedQueryDto,SavedUnifiedPageDto] → savedService.getUnifiedSaved()
GET /deals {JWT:CUS} [SavedPageDto,SavedQueryDto] → savedService.getSavedDeals()
GET /businesses {JWT:CUS} [SavedPageDto,SavedQueryDto] → savedService.getSavedBusinesses()
GET /services {JWT:CUS} [SavedPageDto,SavedQueryDto] → savedService.getSavedServices()

### src/modules/saved/controllers/services-save.controller.ts
## ServicesSaveController — /services
   auth: JWT
POST /:id/save {JWT:CUS} [SaveToggleResponseDto] → savedService.toggleServiceSave()
GET /:id/save-status {JWT:CUS} [SaveStatusResponseDto] → savedService.getServiceSaveStatus()

### src/modules/settings/settings.controller.ts
## SettingsController — /admin/settings
   auth: JWT
GET / {JWT:ADM} → settingsService.getGlobalSettings()
PATCH / {JWT:ADM} [UpdateSettingDto] → settingsService.updateSettings()

### src/modules/status/admin-status.controller.ts
## AdminStatusController — /admin/status
   auth: JWT:ADM
POST /components [CreateSystemComponentDto] → statusService.createComponent()
GET /components → statusService.findAllComponents()
PATCH /components/:id [UpdateSystemComponentDto] → statusService.updateComponent()
DELETE /components/:id → statusService.removeComponent()
POST /incidents [CreateIncidentDto] → statusService.createIncident()
GET /incidents → statusService.findAllIncidents()
PATCH /incidents/:id [UpdateIncidentDto] → statusService.updateIncident()
DELETE /incidents/:id → statusService.removeIncident()

### src/modules/status/status.controller.ts
## StatusController — /status
   auth: JWT
GET / {PUB} → statusService.getPublicStatus()

### src/modules/subscription-reminders/subscription-reminders.controller.ts
## SubscriptionRemindersController — /subscription-reminders
   auth: JWT
GET /admin/placeholders {JWT:ADM,SADM} → remindersService.getPlaceholders()
GET /admin/templates {JWT:ADM,SADM} → remindersService.getTemplates()
GET /admin/templates/:id {JWT:ADM,SADM} → remindersService.getTemplateById()
POST /admin/templates {JWT:ADM,SADM} [CreateReminderTemplateDto] → remindersService.createTemplate()
PATCH /admin/templates/:id {JWT:ADM,SADM} [UpdateReminderTemplateDto] → remindersService.updateTemplate()
POST /admin/templates/:id/reset {JWT:ADM,SADM} → remindersService.resetTemplate()
POST /admin/templates/preview {JWT:ADM,SADM} [PreviewReminderTemplateDto] → remindersService.previewTemplate()
POST /admin/run-now {JWT:ADM,SADM} → remindersService.runRenewalReminders()

### src/modules/subscriptions/addons.controller.ts
## AddonsController — /addons
   auth: JWT
GET /admin/stats {JWT:ADM} → addonsService.getAdminStats()
GET /admin {JWT:ADM} → addonsService.findAllAdmin()
POST /admin {JWT:ADM} [CreateAddonDto] → addonsService.create()
GET /my {JWT:OWN,ADM,MGR,STF +SkipSub} → addonsService.getBusinessAddons()
GET /my/active {JWT:OWN,ADM,MGR,STF +SkipSub} → addonsService.getActiveBusinessAddons()
POST /purchase {JWT:OWN,ADM +SkipSub} [PurchaseAddonDto] → addonsService.purchaseAddons()
GET / {PUB} → addonsService.findAll()
GET /bundle-discounts {PUB} → addonsService.findAllDiscounts()
GET /admin/:id {JWT:ADM} → addonsService.findOne()
PATCH /admin/:id {JWT:ADM} [UpdateAddonDto] → addonsService.update()
DELETE /admin/:id {JWT:ADM} → addonsService.remove()
GET /:id {PUB} → addonsService.findOne()
DELETE /:businessAddonId/cancel {JWT:OWN,ADM +SkipSub} → addonsService.cancelAddon()

### src/modules/subscriptions/controllers/bundle-discounts.controller.ts
## BundleDiscountsController — /admin/bundle-discounts
   auth: JWT
GET / {JWT:ADM} → bundleDiscountsService.findAll()
POST / {JWT:ADM} [CreateBundleDiscountDto] → bundleDiscountsService.create()
PATCH /:id {JWT:ADM} [UpdateBundleDiscountDto] → bundleDiscountsService.update()
DELETE /:id {JWT:ADM} → bundleDiscountsService.remove()

### src/modules/subscriptions/plans.controller.ts
## PlansController — /plans
   auth: JWT
POST /admin {JWT:ADM} [CreatePlanDto] → plansService.create()
GET / {PUB} [FindPlansQueryDto] → plansService.findAll()
GET /:id {PUB} → plansService.findOne()
PATCH /admin/:id {JWT:ADM} [UpdatePlanDto] → plansService.update()
GET /admin/:id/permissions {JWT:ADM} → plansService.getPermissions()
PUT /admin/:id/permissions {JWT:ADM} [SavePlanPermissionsDto] → plansService.updatePermissions()
DELETE /admin/:id {JWT:ADM} → plansService.remove()

### src/modules/subscriptions/subscriptions.controller.ts
## SubscriptionsController — /subscriptions
   auth: JWT
POST /subscribe {JWT:OWN,ADM +SkipSub} [SubscribeWithAddonsDto] → subscriptionsService.subscribe()
POST /initialize-payment {JWT:OWN,ADM +SkipSub} [SubscribeWithAddonsDto] → subscriptionsService.initializePayment()
GET /active {JWT:OWN,ADM,MGR,STF +SkipSub} → subscriptionsService.activeSubscription(..),trialService.eligibility()
POST /trial {JWT:OWN,MGR +SkipSub} [StartTrialDto] → trialService.startTrial()
GET /trial/eligibility {JWT:OWN,MGR,STF +SkipSub} → trialService.eligibility()
GET /billing-history {JWT:OWN,MGR +SkipSub} → trialService.billingHistory()
GET /payment-method {JWT:OWN,MGR +SkipSub} → trialService.paymentMethod()
POST /cancel/:businessId {JWT:OWN,ADM} → subscriptionsService.cancelSubscription()
POST /cancel {JWT:OWN,ADM} → subscriptionsService.cancelSubscription()
GET /capabilities {JWT:OWN,ADM,MGR,STF +SkipSub} → subscriptionsService.getCapabilities()
GET /tax-config {PUB} → subscriptionTaxService.getActiveConfig()
GET /price-preview {PUB} [PricePreviewDto] → subscriptionsService.previewPrice()
GET /admin/tax-config/history {JWT:ADM} → subscriptionTaxService.getHistory()
PUT /admin/tax-config {JWT:ADM} [UpdateSubscriptionTaxDto] → subscriptionTaxService.updateTaxConfig()
PATCH /admin/tax-config/toggle {JWT:ADM} [ToggleSubscriptionTaxDto] → subscriptionTaxService.toggleTax()
GET /admin {JWT:ADM} → subscriptionsService.findAllAdmin()
GET /admin/stats {JWT:ADM} → subscriptionsService.getAdminStats()

### src/modules/support/agent-support.controller.ts
## AgentSupportController — /agent
   auth: JWT:AGT,ADM
GET /all [PaginationQueryDto] → supportService.findAllAgents()
GET /stats [AgentStatsDto] → supportService.getAgentStats()
GET /chats [PaginationQueryDto] → supportService.findAssigned()
GET /tickets [PaginationQueryDto] → supportService.findAssigned()
GET /tickets/:id → supportService.findOneAgent()
PATCH /tickets/:id/status [UpdateTicketStatusDto] → supportService.updateStatusAgent()
POST /tickets/:id/message [TicketReplyDto] → supportService.addAgentMessage()
GET /profile → supportService.findOneAgentUser()
PATCH /profile [UpdateAgentProfileDto] → supportService.updateAgentProfile()

### src/modules/support/support-faq.controller.ts
## SupportFaqController — /support
   auth: JWT
GET /faqs {PUB} [SearchFaqQueryDto] → knowledgeBaseService.getPublicTree()

### src/modules/support/support.controller.ts
## SupportController — /support
   auth: JWT
POST /bot/query {PUB} [BotQueryDto] → botService.handleQuery()
POST /escalate {PUB} → supportService.escalateChat()
PATCH /bot/interaction/:id {JWT:CUS,STF,MGR,OWN,AGT,ADM} → botService.updateInteraction()
GET /bot/context {JWT:CUS,STF,MGR,OWN,AGT,ADM} [SupportSessionQueryDto] → conversationContextService.getContext()
DELETE /bot/context {JWT:CUS,STF,MGR,OWN,AGT,ADM} [SupportSessionQueryDto] → conversationContextService.clearContext()
POST /tickets {JWT:CUS,STF,MGR,OWN} [CreateTicketDto] → supportService.create()
GET /tickets {JWT:CUS,STF,MGR,OWN} [PaginationQueryDto] → supportService.findAll()
GET /tickets/:id {JWT:CUS,STF,MGR,OWN} → supportService.findOne()
POST /tickets/:id/message {JWT:CUS,STF,MGR,OWN} [AdminTicketMessageDto] → supportService.addMessage()
POST /tickets/:id/attachments {JWT:CUS,STF,MGR,OWN} [AddTicketAttachmentsDto] → supportService.addAttachments()
GET /admin/tickets {JWT:ADM} [FindTicketsAdminDto] → supportService.findAllAdmin()
GET /admin/tickets/:id {JWT:ADM} → supportService.findOneAdmin()
POST /admin/tickets/:id/status {JWT:ADM} [UpdateTicketStatusAdminDto] → supportService.updateStatus()
POST /admin/tickets/:id/assign {JWT:ADM} [AssignTicketDto] → supportService.assignTicket()
POST /admin/tickets/:id/message {JWT:ADM} [AdminTicketMessageDto] → supportService.addAdminMessage()
GET /admin/bot/knowledge {JWT:ADM} → botService.getKnowledgeStats()
GET /admin/bot/missed {JWT:ADM} → botService.getMissedQuestions()
POST /admin/bot/knowledge {JWT:ADM} [CreateKnowledgeDto] → botService.addKnowledge()
PATCH /admin/bot/knowledge/:id {JWT:ADM} [CreateKnowledgeDto]
DELETE /admin/bot/knowledge/:id {JWT:ADM} → botService.getKnowledgeStats()

### src/modules/surveys/surveys.controller.ts
## SurveysController — /surveys
   auth: JWT
GET / {JWT:OWN,MGR} → surveysService.findByBranch()
POST / {JWT:OWN,MGR} [CreateSurveyDto] → surveysService.createOrUpdate()
PATCH / {JWT:OWN,MGR} [UpdateSurveyDto] → surveysService.createOrUpdate()

### src/modules/system/controllers/control-tower.controller.ts
## ControlTowerController — /admin/control-tower
   auth: JWT:ADM,AGT
GET /businesses [BusinessSearchFilterDto] → controlTowerService.searchBusinesses()
POST /businesses/sudo [BusinessSudoActionDto] → controlTowerService.executeBusinessSudoAction()
GET /customers [CustomerSearchFilterDto] → controlTowerService.searchCustomers()
POST /customers/sudo [CustomerSudoActionDto] → controlTowerService.executeCustomerSudoAction()

### src/modules/system/health.controller.ts
## HealthController — /health
   auth: JWT
GET / → health.check(..),db.pingCheck()

### src/modules/system/system.controller.ts
## SystemController — /admin/system
   auth: JWT:ADM
GET /health → systemService.getSystemHealth()

### src/modules/training/training.controller.ts
## TrainingController — /training
   auth: JWT
GET / {JWT:AGT,ADM} → trainingService.findAllCourses()
GET /:id {JWT:AGT,ADM} → trainingService.findCourseById()
POST /lessons/:id/complete {JWT:AGT} → trainingService.markLessonAsComplete()
POST / {JWT:ADM} → trainingService.createCourse()
PATCH /:id {JWT:ADM} → trainingService.updateCourse()
DELETE /:id {JWT:ADM} → trainingService.deleteCourse()
POST /:id/lessons {JWT:ADM} → trainingService.createLesson()
PATCH /lessons/:lessonId {JWT:ADM} → trainingService.updateLesson()
DELETE /lessons/:lessonId {JWT:ADM} → trainingService.deleteLesson()

### src/modules/uploads/uploads.controller.ts
## UploadsController — /uploads
   auth: JWT
POST / {JWT:OWN,MGR,ADM,CUS +SkipSub +File} → uploadsService.uploadImage()

### src/modules/users/integration-users.controller.ts
## IntegrationUsersController — /users
   auth: JWT +ApiKey
POST /provision {PUB +ApiKey} → logger.log(..),usersService.findByEmail()

### src/modules/users/users.controller.ts
## UsersController — /users
   auth: JWT
GET /public/check-phone {PUB} [CheckPhoneQueryDto] → usersService.existsByPhone()
GET /profile → usersService.findOne()
PATCH /profile [UpdateUserProfileDto] → usersService.updateProfile()
GET /linked-devices {JWT:ADM,OWN,MGR,STF,AGT,CUS} → usersService.listSessions()
PATCH /linked-devices/:id {JWT:ADM,OWN,MGR,STF,AGT,CUS} [RenameSessionDto] → usersService.renameSession()
DELETE /linked-devices/:id {JWT:ADM,OWN,MGR,STF,AGT,CUS} → usersService.revokeSession()
GET /me/qr-thrive → usersService.findOne(..),qrThriveService.getMappingByUserId()
POST /me/qr-thrive/provision → usersService.findOne(..),qrThriveService.syncUser()
POST /team/invite {JWT:OWN,MGR,STF+perm(staff)} [BranchFilterDto,InviteStaffDto] → usersService.inviteStaff()
GET /team {JWT:OWN,MGR,ADM,STF+perm(staff)} [BranchFilterDto] → usersService.findTeamMembers(..),usersService.findTeamMembers()
PATCH /team/:id {JWT:OWN,MGR,STF+perm(staff)} [BranchFilterDto,UpdateStaffDto] → usersService.updateStaff()
DELETE /team/:id {JWT:OWN,MGR,STF+perm(staff)} [BranchFilterDto] → usersService.remove()
GET /admin {JWT:ADM} [FindUsersAdminDto] → usersService.findAllAdmin()
POST /admin/create-agent {JWT:ADM} [UserAdminCreateAgentDto] → usersService.adminCreateAgent()
POST /admin {JWT:ADM} [AdminCreateUserDto] → usersService.adminCreateUser()
PATCH /admin/:id {JWT:ADM} [AdminUpdateUserDto] → usersService.adminUpdateUser()
DELETE /admin/:id {JWT:ADM} → usersService.adminDeleteUser()
POST /admin/:id/suspend {JWT:ADM} → usersService.suspendUser()
POST /admin/:id/activate {JWT:ADM} → usersService.activateUser()
POST /admin/reset-password-link/:email {JWT:ADM} → usersService.adminResetPasswordLink()

### src/modules/verification/verification.controller.ts
## VerificationController — /verification
   auth: JWT +SkipSub
GET /status {JWT:OWN,MGR,STF +SkipSub} → verificationService.status()
POST /liveness-sessions {JWT:OWN,MGR+perm(verification) +SkipSub} [StartLivenessDto] → verificationService.startLiveness()
GET /liveness-sessions/:id {JWT:OWN,MGR+perm(verification) +SkipSub} → verificationService.livenessStatus()
GET /liveness/return {PUB +SkipSub}
POST /identity {JWT:OWN,MGR+perm(verification) +SkipSub} [VerifyIdentityDto] → verificationService.verifyIdentity()
POST /business {JWT:OWN,MGR+perm(verification) +SkipSub} [VerifyBusinessDto] → verificationService.verifyBusiness()
POST /business/unregistered {JWT:OWN,MGR+perm(verification) +SkipSub} [UnregisteredBusinessDto] → verificationService.submitUnregistered()
POST /manual-review {JWT:OWN,MGR+perm(verification) +SkipSub} [ManualReviewDto] → verificationService.requestManualReview()
GET /admin/:businessId {JWT:ADM +SkipSub} → verificationService.adminDetail()
POST /admin/:businessId/approve {JWT:ADM +SkipSub} [AdminVerificationDecisionDto] → verificationService.adminDecide()
POST /admin/:businessId/reject {JWT:ADM +SkipSub} [AdminVerificationDecisionDto] → verificationService.adminDecide()
## VerificationWebhookController — /verification/webhooks
   auth: JWT
POST /bytid {PUB +SkipSub} → logger.error()

### src/modules/visitors/tap.controller.ts
## TapController — /tap
   auth: JWT
POST /record/:code {JWT:CUS} → visitorsService.recordPortalVisit()

### src/modules/visitors/visitors.controller.ts
## VisitorsController — /visitors
   auth: JWT
GET /visited-branches {JWT:CUS} [PaginatedVisitedBranchResponseDto,VisitedBranchesQueryDto] → visitorsService.getVisitedBranches()
GET /stats {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto,VisitorStatsResponseDto] → visitorsService.getStats()
GET /growth-chart {JWT:OWN,MGR,ADM,STF+perm(visitors)} [VisitorGrowthQueryDto,VisitorGrowthResponseDto] → visitorsService.getGrowthChartData()
GET /new/stats {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto,VisitorStatsResponseDto] → visitorsService.getNewStats()
GET /returning/stats {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto,VisitorStatsResponseDto] → visitorsService.getReturningStats()
GET /new {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto,NewVisitorResponseDto,VisitorQueryDto] → visitorsService.findNew()
GET /returning {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto,ReturningVisitorResponseDto,VisitorQueryDto] → visitorsService.findReturning()
GET / {JWT:OWN,MGR,ADM,STF+perm(visitors)} [PaginatedVisitorResponseDto,VisitorQueryDto] → visitorsService.findAll()
GET /admin/activities {JWT:ADM} [AdminVisitorActivitiesQueryDto,PaginatedVisitResponseDto] → visitorsService.findAdminVisitorActivities()
GET /activity-feed {JWT:OWN,MGR,ADM,STF+perm(visitors)} [ActivityFeedQueryDto,BranchFilterDto,PaginatedActivityFeedResponseDto] → visitorsService.getActivityFeed()
GET /:id {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto] → visitorsService.findOne()
POST /export {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto] → visitorsService.export()
POST /campaign {JWT:OWN,MGR,STF+perm(messages)} [BranchFilterDto,SendCampaignDto] → visitorsService.sendCampaign()
POST /welcome-campaign {JWT:OWN,MGR,STF+perm(messages)} [BranchFilterDto] → visitorsService.sendWelcomeCampaign()
DELETE /reset {JWT:OWN+perm(settings)} [BranchFilterDto] → visitorsService.resetBusinessData()
POST /rewards {JWT:OWN,MGR,STF+perm(dashboard)} [BranchFilterDto,CreateVisitorRewardDto] → loyaltyService.createReward()
POST /signup {PUB} [VisitorResponseDto,VisitorSignupDto] → visitorsService.create()
POST /portal-visit {JWT:CUS} → visitorsService.recordPortalVisit()
POST / {JWT:OWN,MGR,ADM,STF+perm(visitors)} [BranchFilterDto,CreateVisitorDto,VisitorResponseDto] → visitorsService.create()
PATCH /:id {JWT:OWN,MGR,ADM,STF+perm(visitors)} [CreateVisitorDto] → visitorsService.update()
DELETE /:id {JWT:OWN,ADM+perm(visitors)} → visitorsService.remove()
POST /:id/message {JWT:OWN,MGR,STF+perm(messages)} [AdminSendMessageDto,BranchFilterDto] → visitorsService.sendMessage()
POST /:id/welcome {JWT:OWN,MGR,STF+perm(messages)} [BranchFilterDto] → visitorsService.sendWelcome()
POST /:id/reward {JWT:OWN,MGR,STF+perm(dashboard)} [AdminSendRewardDto,BranchFilterDto] → visitorsService.sendReward()

### src/observability/metrics.controller.ts
## MetricsController — /metrics
   auth: PUB
GET /

### src/observability/observability.controller.ts
## ObservabilityController — /observability
   auth: JWT:ADM
GET /logs → storeService.getLogs()
GET /stats → storeService.getStats()
GET /stream {JWT:ADM +SSE} → storeService.stream()  [SSE: text/event-stream, MessageEvent]
DELETE /logs




## 12. Special & non-CRUD endpoints

**Scope:** Section C — everything that is not a plain JSON CRUD route: webhooks, SSE, Prometheus scrape, file uploads, deep-link redirects, WebSocket gateways, factory double-registration, duplicate/shadowed routes, and stubbed or trivial handlers.
Full paths = `/api/v1` + path. Row/auth format matches §11 (Legend at the start of §11).


### C.1 Inbound webhooks (external systems → Vemtap; all signature/key verified, all `@Public`)

| # | Route | Auth | Verification | Behavior |
|---|---|---|---|---|
| 1 | `POST /api/v1/payments/webhook` | `{PUB +SkipSub}` | Header **`x-paystack-signature`** = HMAC-**SHA512** hex of the **raw body** with `PAYSTACK_SECRET_KEY` (`paymentsService.verifyWebhookSignature`); missing sig → 400, bad sig → 400 `Invalid signature` | Raw body kept by `json({ verify: req.rawBody })`. Events processed via `handleWebhookEvent(payload)`; always returns `200 { status:'success' }` so Paystack does not retry on processing errors. |
| 2 | `POST /api/v1/messaging/webhook/twilio` | **no `@Public()`** → global `JwtAuthGuard` applies (401 for Twilio's token-less POST — see Gap G3b) | Header **`x-twilio-signature`** via `twilioProvider.validateRequest(signature, url, payload)` — **enforced only when `NODE_ENV==='production'`** (dev logs a warning and continues) | Empty payload → `200 { status:'ignored' }`; otherwise logs `SmsSid/MessageSid` and continues processing. |
| 3 | `POST /api/v1/verification/webhooks/bytid` | `{PUB +SkipSub}` (`VerificationWebhookController — /verification/webhooks`) | Header **`bytID-Signature`** = HMAC over `req.rawBody` with `BYTID_WEBHOOK_SECRET` (`verifyBytidSignature`); invalid/missing → 401 | Always `2xx` after a valid signature (bytID retries otherwise); `verificationService.handleWebhook(event).catch(log)` then `200 { received:true }`. |
| 4 | `POST /api/v1/integration/qr-thrive/callback` | `{PUB +ApiKey}` — `@Public()` + explicit `IntegrationApiKeyGuard` | Header **`x-vemtap-api-key`** must equal env `VEMTAP_INTEGRATION_KEY` (401 if missing/wrong; **fails closed** if env unset) | Inline event switch (`user.synced`, `scan.milestone`, `branding.update`, `default` → `logger.warn`); **logging only, no persistence**; returns `200 { status:'success', message:'Callback received' }`. |

Also API-key gated (not a webhook, but key-authenticated): `POST /api/v1/users/provision` — `{PUB +ApiKey}` (same `x-vemtap-api-key` guard), inline creates/links an OWNER user (bcrypt default password `IntegratedUser123!`).

### C.2 Server-Sent Events (1 total)

```
GET /api/v1/observability/stream {JWT:ADM +SSE} → storeService.stream()
   @Sse('stream') → Observable<MessageEvent>, Content-Type: text/event-stream
```
The only `@Sse` in the codebase (both decorator extractors initially mislabeled it onto the adjacent `DELETE /logs` row; corrected — this file's Section B shows `GET /stream` + plain `DELETE /logs`).

### C.3 Prometheus metrics scrape (unauthenticated)

```
GET /api/v1/metrics {PUB}
   @Header('Content-Type', registry.contentType) → registry.metrics()   // prom-client default registry
```

### C.4 File uploads (`multipart/form-data`, field name `file`, `FileInterceptor`)

| Route | Auth | Limit | Notes |
|---|---|---|---|
| `POST /api/v1/uploads` | `{JWT:OWN,MGR,ADM,CUS +SkipSub +File}` | **4 MB** (`MAX_UPLOAD_BYTES`, comment: "under the Vercel body cap") | → `uploadsService.uploadImage()` |
| `POST /api/v1/customer/messaging/media` | `{JWT:CUS +SkipSub +File}` | **10 MB** (JPG/PNG/WebP) | → hosted URL to pass as `mediaUrl` when replying; → `uploadsService.uploadImage()` |

Global body-parser ceiling for non-multipart payloads: **25 MB** (JSON/urlencoded).

### C.5 Redirect / non-JSON responses

```
GET /api/v1/verification/liveness/return {PUB +SkipSub}
   @Redirect('vemtap://verification/liveness', HttpStatus.FOUND)  → 302 deep link into the mobile app; handler returns undefined
GET /api/v1/health {JWT} → health.check([db.pingCheck('database')])   // terminus health check — NOT @Public, so it requires a JWT (see Gap G3a)
```

### C.6 WebSocket gateways (Socket.IO, not HTTP — outside `/api/v1`)

| Gateway | File | Namespace | CORS |
|---|---|---|---|
| `EventsGateway` | `src/common/gateways/events.gateway.ts` | default `/` | `origin:'*'` |
| `SupportGateway` | `src/modules/support/support.gateway.ts` | `/support` | `origin:'*'` |
| `MessagingGateway` | `src/modules/messaging/messaging.gateway.ts` | `/messaging` | `origin:'*'` |
| `NotificationsGateway` | `src/modules/notifications/notifications.gateway.ts` | `/notifications` | `origin:'*'` |

### C.7 Controller-factory double registration (adds 14 endpoints)

`src/modules/promotions/promotions.controller.ts` defines `campaignController(path, tag)` → class named `'BoostsController'`/`'PromotionsController'`; `promotions.module.ts` registers **both** (`controllers: [BoostsController, PromotionsController, SponsoredController]`). Identical 14-route surface under two prefixes — Section B Part 2 lists both blocks:

- `## BoostsController — /boosts` → `/api/v1/boosts…` (6 GET, 6 POST, 1 PATCH, 1 DELETE)
- `## PromotionsController — /promotions` → `/api/v1/promotions…` (same 14)

### C.8 Duplicate / overlapping registrations (same VERB+PATH twice — one shadows the other)

| Duplicates | Handler | Note |
|---|---|---|
| `PATCH /api/v1/qr-thrive/branches/:branchId/qr-codes/:qrCodeId` **×2** (declared back-to-back in `qr-thrive.controller.ts`) | both → `qrThriveService.updateQRCode()` | second registration is unreachable (identical effect) |
| `POST /api/v1/notifications/mark-all-read` + `PATCH /api/v1/notifications/mark-all-read` + `PATCH /api/v1/notifications/read-all` | all → `notificationsService.markAllAsRead()` | 3 aliases for one action |
| `POST /api/v1/notifications/broadcast` + `POST /api/v1/notifications/admin/broadcast` | both → `notificationsService.sendAdminBroadcast()` | alias pair |
| `GET /api/v1/notifications/admin/broadcasts` + `GET /api/v1/notifications/admin/history/broadcasts` | both → `notificationsService.getBroadcastHistory()` | alias pair |
| `POST /api/v1/subscriptions/cancel` + `POST /api/v1/subscriptions/cancel/:businessId` | both → `subscriptionsService.cancelSubscription()` | alias pair |

### C.9 Stubbed, trivial, or surprising handlers (integrate carefully)

| Route | Actual behavior |
|---|---|
| `PATCH /api/v1/support/admin/bot/knowledge/:id {JWT:ADM} [CreateKnowledgeDto]` | **STUB** — inline `require(...)`s and returns `{ success:true, message:'Update endpoint - implement repository injection' }`; **no DB write** |
| `DELETE /api/v1/support/admin/bot/knowledge/:id {JWT:ADM}` | calls `botService.getKnowledgeStats()` — **does not delete** (source bug) |
| `GET /api/v1/auth/profile {JWT}` | returns `req.user` directly (no service call) |
| `GET /api/v1/users/profile {JWT}` | → `usersService.findOne()` |
| `GET /api/v1/tap/context/:code {PUB +AllowPending}` | → controller-private `getDeviceContext(code)` |
| `POST /api/v1/integration/qr-thrive/callback {PUB +ApiKey}` | log-only switch (see C.1 #4) |
| `GET /api/v1/metrics {PUB}` | raw Prometheus text (`registry.metrics()`) |
| `GET /api/v1/campaigns/featured` | cross-module reuse → `bannersService.findActive()` |
| `GET /api/v1/products {PUB} [PublicProductsQueryDto]` | → `catalogueService.findPublishedItemsPublic()` (products module delegates to catalogue) |
| `POST /api/v1/messaging/webhook/twilio` | signature check skipped outside production (C.1 #2) |
| `GET /api/v1/verification/liveness/return {PUB +SkipSub}` | returns `undefined` after 302 `@Redirect` |

### C.10 Verb inventory & rate-limit overrides

- **Registered endpoints: 1000** — GET 459 (1 of them SSE) · POST 297 · PATCH 130 · DELETE 97 · PUT 17.
- **Distinct handler routes: 986** — GET 453 (1 SSE) · POST 291 · PATCH 129 · DELETE 96 · PUT 17.
- No `@All`, `@Connect`, `@Head`, or `@Options` routes anywhere; no `@SkipThrottle` usages.
- `@Throttle` overrides (2): `POST /api/v1/ai/analyze` → 10 req/60 s; `POST /api/v1/sponsored/events` → 60 req/60 s. Global default: 60 req/60 s.

---


## 13. DTO field reference

**Scope:** Section D — complete field definitions for **every DTO class referenced in controller signatures** (the `[Dtos]` columns of Sections B): **470 unique class names**, **474 class entries** (4 names are declared in two DTO files each: `CreateCategoryDto`, `BranchIdParamDto`, `UpdateCategoryDto`, `RevenueTrendDto`), plus the **enum value tables** used by those fields.

**Format (raw extractor output — names, optionality, types, defaults and class-validator decorators preserved):**
```
##### <dto file>            ← module path, e.g. src/modules/<module>/dto/<file>.ts
  CLASS <ClassName>        ← export class …
    fieldName?: type = default [@ApiProperty… @Is… @Min… @Matches… ]
  ENUM <Name>: A='a', B='b'  ← enum value table (only enums used by the kept classes)
```
`?` after a field name = optional (`@IsOptional()`). DTO classes with no printed block are the 17 `PartialType(...)` update DTOs + 1 status DTO — full declarations are in **D.7**.

## D.1–D.6 DTO field definitions (grouped by DTO file → module)

##### src/common/dto/branch-filter.dto.ts
  CLASS BranchFilterDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value, ) @IsUUID('4', { message: 'branchId must be a valid UUID v4' })]
    allBranches?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === true)]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value, ) @IsUUID('4', { message: 'businessId must be a valid UUID v4' })]
##### src/common/dto/pagination.dto.ts
  CLASS PaginationQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    cursor?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    nextCursor?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/ad-wallet/dto/ad-wallet.dto.ts
  CLASS AdWalletTopUpDto
    prepackId?: string [@ApiPropertyOptional({ enum: AD_WALLET_PREPACKS.map((pack) => pack.id)) @IsOptional() @IsIn(AD_WALLET_PREPACKS.map((pack) => pack.id))]
    amount?: number [@ApiPropertyOptional({ example: 15000, description: `Custom amount in naira (${AD_WALLET_MIN_TOPUP}–${AD_WALLET_MAX_TOPUP}); no bonus`) @IsOptional() @IsNumber() @Min(AD_WALLET_MIN_TOPUP) @Max(AD_WALLET_MAX_TOPUP)]
    callbackUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsUrl({ require_tld: false, require_protocol: true })]
    saveCard?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
  CLASS AdWalletSavedCardTopUpDto
    prepackId?: string [@ApiPropertyOptional({ enum: AD_WALLET_PREPACKS.map((pack) => pack.id)) @IsOptional() @IsIn(AD_WALLET_PREPACKS.map((pack) => pack.id))]
    amount?: number [@ApiPropertyOptional({ example: 15000, description: `Custom amount in naira (${AD_WALLET_MIN_TOPUP}–${AD_WALLET_MAX_TOPUP}); no bonus`) @IsOptional() @IsNumber() @Min(AD_WALLET_MIN_TOPUP) @Max(AD_WALLET_MAX_TOPUP)]
  CLASS AdWalletAutoReloadDto
    enabled: boolean [@ApiProperty({ example: true }) @IsBoolean()]
    threshold: number [@ApiProperty({ example: 2000) @IsNumber() @Min(0) @Max(AD_WALLET_MAX_TOPUP)]
    amount: number [@ApiProperty({ example: 10000, description: `How much to top up each time (₦${AD_WALLET_MIN_TOPUP}–${AD_WALLET_MAX_TOPUP})`) @IsNumber() @Min(AD_WALLET_MIN_TOPUP) @Max(AD_WALLET_MAX_TOPUP)]
  CLASS AdWalletInvoicesQueryDto
    page?: number [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
  CLASS AdWalletTransactionsQueryDto
    type?: AdWalletTransactionType [@ApiPropertyOptional({ enum: AdWalletTransactionType }) @IsOptional() @IsEnum(AdWalletTransactionType)]
    page?: number [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100)]
##### src/modules/administration/dto/administration.dto.ts
  CLASS AdminCreateAgentDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    password: string [@ApiProperty() @IsString() @MinLength(8)]
    phone: string [@ApiProperty() @IsString() @IsNotEmpty()]
    permissions: BackendModule[] [@ApiProperty({ enum: BackendModule, isArray: true, example: [BackendModule.LOYALTY, BackendModule.TICKETS]) @IsArray() @IsEnum(BackendModule, { each: true }) @IsNotEmpty()]
  CLASS GenerateImpersonationTokenDto
    actorId?: string [@ApiProperty() @IsUUID() @IsOptional()]
    targetBranchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    expiresAt: string [@ApiProperty() @IsDateString() @IsNotEmpty()]
  CLASS GenerateCustomerImpersonationTokenDto
    targetCustomerId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    targetBranchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    expiresAt: string [@ApiProperty() @IsDateString() @IsNotEmpty()]
  CLASS AuditLogFilterDto
    actorId?: string [@ApiProperty() @IsOptional() @IsString()]
    businessId?: string [@ApiProperty() @IsOptional() @IsString()]
    branchId?: string [@ApiProperty() @IsOptional() @IsString()]
    module?: BackendModule [@ApiProperty({ enum: BackendModule }) @IsOptional() @IsEnum(BackendModule)]
##### src/modules/administration/dto/nfc-grant.dto.ts
  CLASS AdminNfcGrantDto
    businessId: string [@ApiProperty() @IsUUID()]
    quantity: number [@ApiProperty({ example: 50) @IsNumber() @Min(1)]
    grantType?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/affiliates/dto/affiliate-activity.dto.ts
  CLASS AffiliateActivityDto
    type: string [@ApiProperty({ enum: ['referral', 'commission', 'withdrawal'])]
    title: string [@ApiProperty()]
    desc: string [@ApiProperty()]
    time: Date [@ApiProperty()]
##### src/modules/affiliates/dto/affiliate-performance.dto.ts
  CLASS AffiliatePerformanceDto
    name: string [@ApiProperty()]
    earnings: number [@ApiProperty({ example: 50000)]
##### src/modules/affiliates/dto/affiliate-stats.dto.ts
  CLASS AffiliateStatsDto
    totalEarnings: number [@ApiProperty({ example: 125000 })]
    availableBalance: number [@ApiProperty({ example: 45000)]
    totalReferrals: number [@ApiProperty({ example: 24)]
    activeReferrals: number [@ApiProperty({ example: 18)]
    referralCode: string [@ApiProperty()]
    tier: string [@ApiProperty()]
##### src/modules/affiliates/dto/create-agent.dto.ts
  CLASS CreateAgentDto
    name: string [@ApiProperty() @IsString()]
    email: string [@ApiProperty() @IsEmail()]
    phone: string [@ApiProperty() @IsString()]
    password?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: AgentStatus [@ApiPropertyOptional({ enum: AgentStatus, default: 'ACTIVE') @IsOptional() @IsEnum(AgentStatus)]
    managerId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
##### src/modules/affiliates/dto/leaderboard-entry.dto.ts
  CLASS LeaderboardEntryDto
    name: string [@ApiProperty()]
    earnings: number [@ApiProperty({ example: 15000 })]
    rank: number [@ApiProperty({ example: 1 })]
    avatar: string | null [@ApiPropertyOptional({ nullable: true)]
    referred?: number [@ApiPropertyOptional({ example: 3)]
    points?: number [@ApiPropertyOptional({ example: 300)]
##### src/modules/affiliates/dto/list-agents-query.dto.ts
  ENUM AgentStatus: ACTIVE='ACTIVE', SUSPENDED='SUSPENDED', DEACTIVATED='DEACTIVATED'
  CLASS ListAgentsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: AgentStatus [@ApiPropertyOptional({ enum: AgentStatus }) @IsOptional() @IsEnum(AgentStatus)]
##### src/modules/affiliates/dto/update-agent.dto.ts
  CLASS UpdateAgentDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    email?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: AgentStatus [@ApiPropertyOptional({ enum: AgentStatus }) @IsOptional() @IsEnum(AgentStatus)]
    managerId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
##### src/modules/affiliates/dto/update-profile.dto.ts
  CLASS UpdateAffiliateProfileDto
    idType?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    idNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    idImageUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    bankAccountDetails?: Record<string, any> [@ApiPropertyOptional({ example: { bankName: 'GTBank', accountNumber: '0123456789', accountName: 'John Doe') @IsOptional() @IsObject()]
##### src/modules/affiliates/dto/withdraw-request.dto.ts
  CLASS WithdrawRequestDto
    amount: number [@ApiProperty({ example: 5000, minimum: 0) @IsNumber() @Min(0)]
##### src/modules/ai-copilot/dto/analyze-request.dto.ts
  CLASS AnalyzeRequestDto
    page: string [@IsString() @MaxLength(100) @Matches(/^[a-z0-9-]+$/)]
    context?: Record<string, unknown> [@IsOptional() @IsObject()]
##### src/modules/auth/dto/change-password.dto.ts
  CLASS ChangePasswordDto
    currentPassword: string [@ApiProperty() @IsString()]
    newPassword: string [@ApiProperty() @IsString() @MinLength(6)]
##### src/modules/auth/dto/check-status.dto.ts
  CLASS CheckStatusDto
    identifier: string [@ApiProperty() @IsNotEmpty() @IsString()]
##### src/modules/auth/dto/customer-auth.dto.ts
  CLASS RequestCustomerSignupOtpDto
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty() @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value, )]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID('4', { message: 'branchId must be a valid UUID v4' }) @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
  CLASS ResendCustomerOtpDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty() @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value, )]
    purpose?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS VerifyAndSetCustomerPinDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty() @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value, )]
    code: string [@ApiProperty() @IsString() @IsNotEmpty() @Transform(({ value, obj }) => { const raw = value ?? obj?.otp; return typeof raw === 'string' ? raw.trim() : raw; })]
    otp?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    pin: string [@ApiProperty() @IsString() @IsNotEmpty() @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })]
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID('4', { message: 'branchId must be a valid UUID v4' }) @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
  CLASS RequestCustomerPinResetDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty() @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value, )]
  CLASS ResetCustomerPinDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty() @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value, )]
    otp: string [@ApiProperty() @IsString() @IsNotEmpty() @Transform(({ value, obj }) => { const raw = value ?? obj?.code; return typeof raw === 'string' ? raw.trim() : raw; })]
    code?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    newPin: string [@ApiProperty() @IsString() @IsNotEmpty() @Matches(/^\d{6}$/, { message: 'New PIN must be exactly 6 digits' }) @Transform(({ value, obj }) => { const raw = value ?? obj?.pin; return typeof raw === 'string' ? raw.trim() : raw; })]
    pin?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/auth/dto/google-login.dto.ts
  CLASS GoogleLoginDto
    token: string [@ApiProperty() @IsNotEmpty() @IsString()]
    role?: UserRole [@ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER) @IsOptional() @Transform(({ value }) => { if (typeof value !== 'string') return value; // Map 'owner' -> 'Owner', 'customer' -> 'Customer', etc. const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(); return normalized; }) @IsEnum(UserRole)]
    twoFactorCode?: string [@ApiProperty() @IsOptional() @IsString() @Length(6, 6)]
##### src/modules/auth/dto/login.dto.ts
  CLASS LoginDto
    identifier: string [@ApiProperty() @IsString() @IsNotEmpty()]
    password: string [@ApiProperty() @IsString() @IsNotEmpty()]
    twoFactorCode?: string [@ApiProperty() @IsOptional() @IsString() @Length(6, 6)]
##### src/modules/auth/dto/otp.dto.ts
  CLASS SendOtpDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS VerifyOtpDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    code: string [@ApiProperty() @IsString() @IsNotEmpty() @Length(4, 4)]
##### src/modules/auth/dto/password-reset-otp.dto.ts
  CLASS PasswordResetOtpDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
##### src/modules/auth/dto/register-admin.dto.ts
  CLASS RegisterAdminDto
    adminAccountCode: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/auth/dto/register-owner.dto.ts
  CLASS RegisterOwnerDto
    email: string [@ApiProperty() @IsEmail()]
    password?: string [@ApiPropertyOptional() @IsOptional() @ValidateIf((o) => !!o.password) @IsString() @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1)]
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    businessName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    businessLogo?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsNotEmpty() @IsUUID()]
    subcategoryId?: string [@ApiPropertyOptional() @IsOptional() @IsNotEmpty() @IsUUID()]
    otherSubcategoryName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    visitors?: string; // Mapped from frontend 'visitors' [@ApiPropertyOptional() @IsOptional() @IsString()]
    goals?: string[]; // Mapped from frontend 'goals' (array) [@ApiPropertyOptional({ example: ['Capture Leads', 'Digital Loyalty']) @IsOptional() @IsArray()]
    whatsappNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    officialEmail?: string [@ApiPropertyOptional() @IsOptional() @IsEmail() @IsNotEmpty()]
    businessNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    businessAddress?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    state?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    city?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    latitude?: number [@ApiPropertyOptional({ example: 6.5244) @IsOptional() @IsNumber() @Min(-90) @Max(90)]
    longitude?: number [@ApiPropertyOptional({ example: 3.3792) @IsOptional() @IsNumber() @Min(-180) @Max(180)]
    businessWebsite?: string [@ApiPropertyOptional() @IsOptional() @IsUrl()]
    isRegistered?: boolean [@ApiPropertyOptional({ example: true) @IsOptional()]
    engagement?: Record<string, any> [@ApiPropertyOptional({ example: { instagram: 'https://instagram.com/johndoe', linkedin: 'https://linkedin.com/company/johndoe', reviewUrl: 'https://g.page/r/...') @IsOptional()]
    referralCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/auth/dto/register.dto.ts
  CLASS RegisterDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    firstName: string [@ApiProperty() @ValidateIf((o) => !o.name) @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @ValidateIf((o) => !o.name) @IsString() @IsNotEmpty()]
    email: string [@ApiProperty() @IsEmail()]
    password?: string [@ApiProperty() @IsOptional() @ValidateIf((o) => !!o.password) @IsString() @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1)]
    role?: UserRole [@ApiPropertyOptional({ enum: UserRole, example: UserRole.OWNER) @IsOptional() @IsEnum(UserRole)]
    referralCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    businessName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    monthlyVisitors?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    goal?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/auth/dto/request-otp.dto.ts
  CLASS RequestOtpDto
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    role: UserRole [@ApiProperty({ enum: UserRole, example: UserRole.OWNER }) @Transform(({ value }) => { if (typeof value !== 'string') return value; const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(); return normalized as UserRole; }) @IsEnum(UserRole) @IsNotEmpty()]
##### src/modules/auth/dto/reset-password.dto.ts
  CLASS ResetPasswordDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    otp: string [@ApiProperty() @IsString() @IsNotEmpty()]
    newPassword: string [@ApiProperty() @IsString() @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1)]
##### src/modules/auth/dto/switch-role.dto.ts
  CLASS SwitchRoleDto
    role: UserRole [@ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER }) @IsEnum(UserRole)]
##### src/modules/auth/dto/two-factor.dto.ts
  CLASS TwoFactorCodeDto
    code: string [@ApiProperty() @IsString() @IsNotEmpty() @Length(6, 6)]
##### src/modules/auth/dto/update-email.dto.ts
  CLASS UpdateEmailDto
    identifier: string [@ApiProperty() @IsNotEmpty() @IsString()]
    email: string [@ApiProperty() @IsNotEmpty() @IsEmail()]
##### src/modules/auth/dto/upgrade-to-owner.dto.ts
  CLASS UpgradeToOwnerDto
    password?: string [@ApiProperty() @IsOptional() @IsString()]
    businessName?: string [@ApiPropertyOptional({ + 'PATCH /businesses/my-business (as with register/owner).') @IsOptional() @IsString() @IsNotEmpty()]
    businessLogo?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsNotEmpty() @IsUUID()]
    subcategoryId?: string [@ApiPropertyOptional() @IsOptional() @IsNotEmpty() @IsUUID()]
    otherSubcategoryName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    visitors?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    goals?: string[] [@ApiPropertyOptional({ example: ['Capture Leads', 'Digital Loyalty'] }) @IsOptional() @IsArray()]
    whatsappNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    officialEmail?: string [@ApiPropertyOptional() @IsOptional() @IsEmail() @IsNotEmpty()]
    businessNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty()]
    businessAddress?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    state?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    city?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    latitude?: number [@ApiPropertyOptional({ example: 6.5244 }) @IsOptional() @IsNumber() @Min(-90) @Max(90)]
    longitude?: number [@ApiPropertyOptional({ example: 3.3792 }) @IsOptional() @IsNumber() @Min(-180) @Max(180)]
    businessWebsite?: string [@ApiPropertyOptional() @IsOptional() @IsUrl()]
    isRegistered?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional()]
    engagement?: Record<string, any> [@ApiPropertyOptional({ example: { instagram: 'https://instagram.com/johndoe', reviewUrl: 'https://g.page/r/...') @IsOptional()]
    referralCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/auth/dto/verify-email.dto.ts
  CLASS VerifyEmailDto
    email: string [@ApiProperty() @IsEmail()]
    code: string [@ApiProperty() @IsString() @IsNotEmpty() @Length(4, 6)]
##### src/modules/banners/dto/create-banner.dto.ts
  CLASS CreateBannerDto
    title: string [@ApiProperty() @IsString()]
    description: string [@ApiProperty() @IsString()]
    iconName: string [@ApiProperty({ enum: ICON_NAMES }) @IsString() @IsIn(ICON_NAMES)]
    actionLabel?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    actionUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    color: string [@ApiProperty() @IsString()]
    sortOrder?: number [@ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber()]
    isActive?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
    placement?: 'business' | 'customer' [@ApiPropertyOptional({ enum: ['business', 'customer'] }) @IsOptional() @IsIn(['business', 'customer'])]
    targetType?: 'custom' | 'deals-page' | 'deal' [@ApiPropertyOptional({ enum: ['custom', 'deals-page', 'deal']) @IsOptional() @IsIn(['custom', 'deals-page', 'deal'])]
    targetId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/banners/dto/reorder-banners.dto.ts
  CLASS ReorderBannersDto
    orderedIds: string[] [@ApiProperty({ example: ['uuid-1', 'uuid-2', 'uuid-3']) @IsArray() @ArrayNotEmpty() @IsString({ each: true })]
##### src/modules/bookings/dto/booking.dto.ts
  CLASS AvailabilityQueryDto
    branchId: string [@ApiProperty() @IsUUID()]
    itemId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    date: string [@ApiProperty() @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })]
  CLASS CreateBookingDto
    branchId: string [@ApiProperty() @IsUUID()]
    itemId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    date: string [@ApiProperty() @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })]
    time: string [@ApiProperty() @Matches(TIME_RE, { message: 'time must be HH:mm' })]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)]
  CLASS CancelBookingDto
    cancellationReason?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)]
  CLASS MyBookingsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
    status?: BookingStatus [@ApiPropertyOptional({ enum: BookingStatus }) @IsOptional() @IsEnum(BookingStatus)]
  CLASS BusinessBookingsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 50 [@ApiPropertyOptional({ example: 50, default: 50, minimum: 1, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    status?: BookingStatus [@ApiPropertyOptional({ enum: BookingStatus }) @IsOptional() @IsEnum(BookingStatus)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    date?: string [@ApiPropertyOptional() @IsOptional() @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })]
    from?: string [@ApiPropertyOptional() @IsOptional() @Matches(DATE_RE, { message: 'from must be YYYY-MM-DD' })]
    to?: string [@ApiPropertyOptional() @IsOptional() @Matches(DATE_RE, { message: 'to must be YYYY-MM-DD' })]
  CLASS UpdateBookingStatusDto
    status: BookingStatus [@ApiProperty({ enum: BookingStatus, example: BookingStatus.CONFIRMED }) @IsEnum(BookingStatus)]
    cancellationReason?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)]
  CLASS BookingAvailabilityDto
    date: string [@ApiProperty()]
    branchId: string [@ApiProperty()]
    itemId: string | null [@ApiProperty({ nullable: true })]
    slotMinutes: number [@ApiProperty({ example: 30)]
    durationMinutes: number [@ApiProperty({ example: 60)]
    isClosed: boolean [@ApiProperty({ example: false)]
    slots: BookingSlotDto[] [@ApiProperty({ type: [BookingSlotDto] })]
  CLASS BookingResponseDto
    id: string [@ApiProperty()]
    reference: string [@ApiProperty()]
    status: BookingStatus [@ApiProperty({ enum: BookingStatus, example: BookingStatus.BOOKED })]
    date: string [@ApiProperty()]
    time: string [@ApiProperty()]
    durationMinutes: number [@ApiProperty({ example: 60 })]
    branchId: string [@ApiProperty()]
    branchName: string | null [@ApiProperty({ nullable: true })]
    businessName: string | null [@ApiProperty({ nullable: true })]
    customer?: { [@ApiPropertyOptional({ example: { id: 'uuid-of-customer', firstName: 'Amina', lastName: 'Bello', phone: '+2348032198831')]
    itemId: string | null [@ApiProperty({ nullable: true })]
    itemName: string [@ApiProperty()]
    notes: string | null [@ApiProperty({ nullable: true })]
    cancelledAt: Date | null [@ApiProperty({ nullable: true })]
    cancellationReason: string | null [@ApiProperty({ nullable: true })]
    createdAt: Date [@ApiProperty()]
  CLASS BookingPageDto
    data: BookingResponseDto[] [@ApiProperty({ type: [BookingResponseDto] })]
    total: number [@ApiProperty({ example: 2 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
##### src/modules/branches/dto/branch.dto.ts
  CLASS CreateBranchDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    username?: string [@ApiProperty() @IsString() @IsOptional()]
    address?: string [@ApiProperty() @IsString() @IsOptional()]
    state?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    city?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    phone?: string [@ApiProperty() @IsString() @IsOptional()]
    officialEmail?: string [@ApiProperty() @IsEmail() @IsOptional()]
    engagement?: Record<string, any> [@ApiPropertyOptional({ example: { instagram: 'https://instagram.com/branch') @IsOptional()]
  CLASS UpdateBranchDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    username?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    address?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    state?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    city?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    latitude?: number [@ApiPropertyOptional({ example: 6.5244) @IsNumber() @Min(-90) @Max(90) @IsOptional()]
    longitude?: number [@ApiPropertyOptional({ example: 3.3792) @IsNumber() @Min(-180) @Max(180) @IsOptional()]
    phone?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    welcomeMessage?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    successMessage?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    privacyMessage?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    rewardMessage?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    about?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    businessHours?: BusinessHoursDto [@ApiPropertyOptional({ type: BusinessHoursDto }) @ValidateNested() @Type(() => BusinessHoursDto) @IsOptional()]
    rewardEnabled?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    rewardVisitThreshold?: number [@ApiPropertyOptional({ example: 5 }) @IsNumber() @IsOptional()]
    logoUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    website?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    whatsappNumber?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    officialEmail?: string [@ApiPropertyOptional() @IsEmail() @IsOptional()]
    linkedinUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    reviewUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    showReview?: boolean [@ApiPropertyOptional() @IsBoolean() @IsOptional()]
    showSocial?: boolean [@ApiPropertyOptional() @IsBoolean() @IsOptional()]
    showFeedback?: boolean [@ApiPropertyOptional() @IsBoolean() @IsOptional()]
    joinDiscoveryNetwork?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    receivePartnerRequests?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    allowPromotions?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    pushNotifications?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    smsAlerts?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    emailSummary?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    isMainBranch?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    isActive?: boolean [@ApiPropertyOptional({ example: true, + 'branch from consumer discovery while preserving its ledger.') @IsBoolean() @IsOptional()]
    engagement?: Record<string, any> [@ApiPropertyOptional({ example: { instagram: 'https://instagram.com/branch') @IsOptional()]
##### src/modules/branches/dto/customer-capture.dto.ts
  CLASS UpdateCustomerCaptureDto
    qrData?: Record<string, unknown> [@ApiPropertyOptional() @IsOptional() @IsObject()]
    formConfig?: Record<string, unknown> [@ApiPropertyOptional() @IsOptional() @IsObject()]
    shortLink?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsUrl({ require_tld: false })]
##### src/modules/branches/dto/nearby-branches-query.dto.ts
  CLASS NearbyBranchesQueryDto
    distance?: number [@ApiPropertyOptional({ default: 500, example: 500, type: Number) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    withPromotions?: boolean [@ApiPropertyOptional({ default: false, type: Boolean) @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    limit?: number [@ApiPropertyOptional({ default: 20, example: 20, type: Number) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
##### src/modules/business-dashboard/dto/business-dashboard.dto.ts
  CLASS BusinessDashboardResponseDto
    generatedAt: string [@ApiProperty()]
    stats: DashboardStatsDto [@ApiProperty({ type: DashboardStatsDto })]
    weekly: DashboardWeeklyDto [@ApiProperty({ type: DashboardWeeklyDto })]
    insights: DashboardInsightDto[] [@ApiProperty({ type: [DashboardInsightDto] })]
    recentVisitors: DashboardVisitorDto[] [@ApiProperty({ type: [DashboardVisitorDto] })]
    activityData: DashboardActivityPointDto[] [@ApiProperty({ type: [DashboardActivityPointDto] })]
    rewards: DashboardRewardDto[] [@ApiProperty({ type: [DashboardRewardDto] })]
    notifications: DashboardNotificationDto[] [@ApiProperty({ type: [DashboardNotificationDto] })]
    messages: DashboardMessageDto[] [@ApiProperty({ type: [DashboardMessageDto] })]
    unreadMessages: number [@ApiProperty({ example: 3)]
    staffMembers: DashboardStaffDto[] [@ApiProperty({ type: [DashboardStaffDto] })]
    devices: DashboardDeviceDto[] [@ApiProperty({ type: [DashboardDeviceDto] })]
    businessName: string [@ApiProperty()]
    businessLogo: string [@ApiProperty()]
##### src/modules/business-profiling/dto/business-profile.dto.ts
  CLASS CreateBusinessProfileDto
    businessName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    location?: string [@ApiProperty() @IsString() @IsOptional()]
    contactEmail: string [@ApiProperty({ required: true }) @IsString() @IsNotEmpty() @IsEmail()]
    contactPhone?: string [@ApiProperty() @IsString() @IsOptional()]
    businessType?: string [@ApiProperty() @IsString() @IsOptional()]
    responses?: Record<string, any> [@ApiProperty({ example: { doYouHaveMenu: true, footTraffic: 'high' }) @IsObject() @IsOptional()]
    physicalSetup?: Record<string, any> [@ApiProperty({ example: { hasTableService: true, highFootTraffic: true }) @IsObject() @IsOptional()]
    qrPlacement?: Record<string, any> [@ApiProperty({ example: { strategy: 'Table QR' }) @IsObject() @IsOptional()]
    notes?: string [@ApiProperty() @IsString() @IsOptional() @IsOptional()]
    status?: ProfileStatus [@ApiProperty({ enum: ProfileStatus) @IsEnum(ProfileStatus) @IsOptional()]
    xpEarned?: number [@ApiProperty({ example: 45) @IsOptional()]
    achievements?: string[] [@ApiProperty({ example: ['first_step']) @IsOptional()]
  CLASS UpdateBusinessProfileDto
    businessName?: string [@ApiProperty() @IsString() @IsOptional()]
    location?: string [@ApiProperty() @IsString() @IsOptional()]
    businessType?: string [@ApiProperty() @IsString() @IsOptional()]
    responses?: Record<string, any> [@ApiProperty() @IsObject() @IsOptional()]
    contactEmail?: string [@ApiProperty() @IsString() @IsOptional()]
    contactPhone?: string [@ApiProperty() @IsString() @IsOptional()]
    physicalSetup?: Record<string, any> [@ApiProperty() @IsObject() @IsOptional()]
    qrPlacement?: Record<string, any> [@ApiProperty() @IsObject() @IsOptional()]
    notes?: string [@ApiProperty() @IsString() @IsOptional()]
    status?: ProfileStatus [@ApiProperty({ enum: ProfileStatus) @IsEnum(ProfileStatus) @IsOptional()]
    xpEarned?: number [@ApiProperty() @IsOptional()]
    achievements?: string[] [@ApiProperty() @IsOptional()]
##### src/modules/businesses/dto/admin-business-action.dto.ts
  CLASS SuspendBusinessDto
    reason: string [@ApiProperty() @IsString() @IsNotEmpty() @MinLength(5)]
##### src/modules/businesses/dto/admin-create-business.dto.ts
  CLASS AdminCreateBusinessDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    ownerFirstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    ownerLastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    ownerEmail: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    ownerPassword: string [@ApiProperty() @IsString() @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1)]
    ownerPhone?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    status?: BusinessStatus [@ApiPropertyOptional({ enum: BusinessStatus, example: BusinessStatus.ACTIVE }) @IsEnum(BusinessStatus) @IsOptional()]
    logoUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsNotEmpty() @IsUUID()]
    subcategoryId?: string [@ApiPropertyOptional() @IsOptional() @IsNotEmpty() @IsUUID()]
    otherSubcategoryName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    visitors?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    goals?: string[] [@ApiPropertyOptional({ example: ['Capture Leads', 'Digital Loyalty']) @IsOptional() @IsArray()]
    whatsappNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    officialEmail?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    businessNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    address?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    state?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    city?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    website?: string [@ApiPropertyOptional() @IsOptional() @IsUrl()]
    isRegistered?: boolean [@ApiPropertyOptional({ example: true) @IsOptional()]
    registrationNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    documents?: string[] [@ApiPropertyOptional({ example: ['https://example.com/doc.pdf']) @IsOptional() @IsString({ each: true })]
    engagement?: Record<string, any> [@ApiPropertyOptional({ example: { instagram: 'https://instagram.com/johndoe', linkedin: 'https://linkedin.com/company/johndoe', reviewUrl: 'https://g.page/r/...') @IsOptional()]
##### src/modules/businesses/dto/find-businesses-admin.dto.ts
  CLASS FindBusinessesAdminDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: BusinessStatus [@ApiPropertyOptional({ enum: BusinessStatus) @IsOptional() @IsEnum(BusinessStatus)]
    isVerified?: boolean [@ApiPropertyOptional() @IsOptional() @Type(() => Boolean)]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/businesses/dto/import-customers.dto.ts
  CLASS ImportCustomersDto
    customers: CustomerImportDataDto[] [@ApiProperty({ type: [CustomerImportDataDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CustomerImportDataDto)]
##### src/modules/businesses/dto/update-business.dto.ts
  CLASS UpdateBusinessDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    subcategoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    otherSubcategoryName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    state?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    city?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isRegistered?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional()]
    registrationNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    documents?: string[] [@ApiPropertyOptional({ example: ['https://example.com/doc.pdf'] }) @IsOptional() @IsString({ each: true })]
    logoUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    coverImage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    gallery?: string[] [@ApiPropertyOptional({ example: ['https://example.com/shop-1.png']) @IsOptional() @IsString({ each: true })]
    address?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    latitude?: number [@ApiPropertyOptional({ example: 6.5244) @IsOptional() @IsNumber() @Min(-90) @Max(90)]
    longitude?: number [@ApiPropertyOptional({ example: 3.3792) @IsOptional() @IsNumber() @Min(-180) @Max(180)]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    about?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    businessHours?: Record<string, any> [@ApiPropertyOptional({ example: { Monday: { open: '09:00', close: '18:00' } }) @IsOptional() @IsObject()]
    website?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsUrl()]
    socials?: Record<string, string> [@ApiPropertyOptional({ example: { instagram: '...', facebook: '...' } }) @IsOptional() @IsObject()]
    amenities?: string[] [@ApiPropertyOptional({ example: ['Outdoor Seating', 'Free Wi-Fi', 'POS Ready']) @IsOptional() @IsString({ each: true })]
    facebookUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    instagramUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    tiktokUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    xUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    linkedinUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    officialEmail?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    whatsappNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    openingHours?: Record<string, any> [@ApiPropertyOptional({ example: { Monday: { open: '09:00', close: '18:00' } }) @IsOptional() @IsObject()]
    timezone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isVisible?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional()]
    posSettings?: { [@ApiPropertyOptional({ example: { loyaltyEnabled: true, loyaltyRedeemThreshold: 100 }) @IsOptional() @IsObject()]
    referralCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    requireReviewApproval?: boolean [@ApiPropertyOptional({ example: false) @IsOptional() @IsBoolean()]
##### src/modules/campaigns/dto/campaign-template.dto.ts
  CLASS CreateCampaignTemplateDto
    title: string [@ApiProperty() @IsString() @IsNotEmpty()]
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type: string [@ApiProperty() @IsString() @IsNotEmpty()]
    content: string [@ApiProperty() @IsString() @IsNotEmpty()]
    textColor?: string [@ApiProperty() @IsOptional() @IsString()]
    branchId?: string | null [@ApiProperty() @IsOptional() @IsString()]
##### src/modules/campaigns/dto/create-campaign.dto.ts
  ENUM CampaignType: WHATSAPP='WhatsApp', SMS='SMS', EMAIL='Email'
  ENUM CampaignStatus: ACTIVE='Active', SCHEDULED='Scheduled', RECURRING='Recurring', DRAFT='Draft', COMPLETED='Completed'
  CLASS CreateCampaignDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type: CampaignType [@ApiProperty({ enum: CampaignType) @IsEnum(CampaignType)]
    audience: string [@ApiProperty() @IsString() @IsNotEmpty()]
    message: string [@ApiProperty() @IsString() @IsNotEmpty()]
    scheduledFor?: string [@ApiProperty() @IsOptional() @IsDateString()]
    status?: CampaignStatus = CampaignStatus.DRAFT [@ApiProperty({ enum: CampaignStatus) @IsOptional() @IsEnum(CampaignStatus)]
    branchId?: string [@ApiProperty() @IsOptional() @IsString()]
##### src/modules/campaigns/dto/find-campaigns.dto.ts
  CLASS FindCampaignsDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    status?: CampaignStatus [@ApiPropertyOptional({ enum: CampaignStatus) @IsOptional() @IsEnum(CampaignStatus)]
##### src/modules/catalogue-cart/dto/catalogue-cart.dto.ts
  CLASS AddToCartDto
    branchId: string [@IsUUID()]
    itemId?: string [@ValidateIf((o) => !o.offerId) @IsUUID()]
    offerId?: string [@ValidateIf((o) => !o.itemId) @IsUUID()]
    quantity?: number = 1 [@IsInt() @Min(1) @IsOptional()]
  CLASS MergeGuestCartDto
    branchId: string [@IsUUID()]
    items: GuestCartItemDto[] [@IsArray() @ValidateNested({ each: true }) @Type(() => GuestCartItemDto)]
  CLASS UpdateCartItemDto
    quantity: number [@IsInt() @Min(0)]
  CLASS CheckoutCartDto
    branchId: string [@IsUUID()]
    notes?: string [@IsString() @IsOptional()]
    tableNumber?: string [@IsString() @IsOptional()]
    deviceId?: string [@IsUUID() @IsOptional()]
##### src/modules/catalogue-orders/dto/catalogue-order.dto.ts
  CLASS MyOrdersQueryDto
    page?: number [@ApiPropertyOptional({ example: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
  CLASS CreateCatalogueOrderDto
    firstName: string [@ApiProperty() @IsNotEmpty() @IsString()]
    lastName: string [@ApiProperty() @IsNotEmpty() @IsString()]
    phone: string [@ApiProperty() @IsNotEmpty() @IsString()]
    email?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    tableNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    items: OrderItemDto[] [@ApiProperty({ type: [OrderItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)]
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    deviceId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    sessionToken?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    bookingDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    bookingTime?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    giftToken?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS BulkCheckoutDto
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    email?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    orders: BulkOrderDto[] [@ApiProperty({ type: [BulkOrderDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => BulkOrderDto)]
    deviceId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
  CLASS UpdateCatalogueOrderStatusDto
    status: CatalogueOrderStatus [@ApiProperty({ enum: CatalogueOrderStatus }) @IsNotEmpty() @IsEnum(CatalogueOrderStatus)]
    reason?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    refundItems?: OrderItemDto[] [@ApiPropertyOptional({ type: [OrderItemDto], // Or we can define a simpler one, or just reuse OrderItemDto where itemId is passed }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)]
  CLASS CatalogueOrderQueryDto
    page?: number = 1 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    status?: CatalogueOrderStatus [@ApiPropertyOptional({ enum: CatalogueOrderStatus }) @IsOptional() @IsEnum(CatalogueOrderStatus)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    type?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/catalogue/dto/branch-pricing.dto.ts
  CLASS SetItemBranchPricingDto
    pricingMode: CatalogueItemPricingMode [@ApiProperty({ enum: CatalogueItemPricingMode) @IsEnum(CatalogueItemPricingMode)]
    branches: ItemBranchPricingEntryDto[] [@ApiProperty({ type: [ItemBranchPricingEntryDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ItemBranchPricingEntryDto)]
  CLASS SetOfferBranchPricingDto
    branches: OfferBranchPricingEntryDto[] [@ApiProperty({ type: [OfferBranchPricingEntryDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OfferBranchPricingEntryDto)]
##### src/modules/catalogue/dto/category.dto.ts
  CLASS CreateCatalogueCategoryDto
    name: string [@ApiProperty() @IsNotEmpty() @IsString()]
  CLASS UpdateCatalogueCategoryDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS ReorderCatalogueCategoryDto
    orderedIds: string[] [@ApiProperty({ type: [String], example: ['3f1d2a1e-0000-4000-8000-000000000001']) @IsArray() @ArrayNotEmpty() @IsUUID(undefined, { each: true })]
##### src/modules/catalogue/dto/claim.dto.ts
  CLASS RequestClaimOtpDto
    offerId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    firstName: string [@ApiProperty() @IsNotEmpty() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    email: string [@ApiProperty() @IsNotEmpty() @IsEmail()]
    phone: string [@ApiProperty() @IsNotEmpty() @IsString()]
  CLASS VerifyClaimDto
    email: string [@ApiProperty() @IsNotEmpty() @IsEmail()]
    offerId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    code: string [@ApiProperty() @IsNotEmpty() @IsString() @Length(4, 6)]
    giftToken?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/catalogue/dto/item.dto.ts
  CLASS CreateCatalogueItemDto
    name: string [@ApiProperty() @IsNotEmpty() @IsString()]
    price?: number = 0 [@ApiPropertyOptional({ example: 15.99, default: 0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    shortDescription?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    description: string [@ApiProperty() @IsNotEmpty() @IsString()]
    mainImage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    galleryImages?: string[] [@ApiPropertyOptional({ example: ['https://image.com/1.jpg'] }) @IsOptional() @IsArray() @IsString({ each: true })]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    sku?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    itemType?: CatalogueItemType = CatalogueItemType.PRODUCT [@ApiPropertyOptional({ enum: CatalogueItemType, default: CatalogueItemType.PRODUCT) @IsOptional() @IsEnum(CatalogueItemType)]
    discountType?: DiscountType = DiscountType.NONE [@ApiPropertyOptional({ enum: DiscountType, default: DiscountType.NONE }) @IsOptional() @IsEnum(DiscountType)]
    discountValue?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    stockQuantity?: number [@ApiPropertyOptional({ example: 50 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    barcode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    costPrice?: number [@ApiPropertyOptional({ example: 500 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    minStock?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    brand?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    weight?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    dimensions?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    variants?: Record<string, unknown>[] [@ApiPropertyOptional({ + 'The legacy `{ type, value }` shape is still accepted and converted.', example: [{ name: 'Large', price: 4500, stockQuantity: 12 }]) @IsOptional() @IsArray()]
    compareAtPrice?: number | null [@ApiPropertyOptional({ example: 18000) @IsOptional() @IsNumber() @Min(0)]
    condition?: CatalogueItemCondition | null [@ApiPropertyOptional({ enum: CatalogueItemCondition }) @IsOptional() @IsEnum(CatalogueItemCondition)]
    fulfillmentModes?: CatalogueFulfillmentMode[] [@ApiPropertyOptional({ enum: CatalogueFulfillmentMode, isArray: true }) @IsOptional() @IsArray() @IsEnum(CatalogueFulfillmentMode, { each: true })]
    pricingMode?: CatalogueItemPricingMode [@ApiPropertyOptional({ enum: CatalogueItemPricingMode, default: 'uniform' }) @IsOptional() @IsEnum(CatalogueItemPricingMode)]
    bookingRules?: BookingRulesDto [@ApiPropertyOptional({ type: BookingRulesDto) @IsOptional() @ValidateNested() @Type(() => BookingRulesDto)]
    audience?: string | null [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)]
    tags?: string[] [@ApiPropertyOptional({ example: ['burger', 'beef'] }) @IsOptional() @IsArray() @IsString({ each: true })]
    allowBackOrder?: boolean = true [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
    loyaltyPoints?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    enableLoyaltyPoints?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
    loyaltyPointsValue?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    priceType?: ServicePriceType = ServicePriceType.FIXED [@ApiPropertyOptional({ enum: ServicePriceType, default: ServicePriceType.FIXED) @IsOptional() @IsEnum(ServicePriceType)]
    priceRangeMin?: number [@ApiPropertyOptional({ example: 5000 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    priceRangeMax?: number [@ApiPropertyOptional({ example: 15000 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    duration?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    serviceMode?: ServiceMode = ServiceMode.LOCATION [@ApiPropertyOptional({ enum: ServiceMode, default: ServiceMode.LOCATION) @IsOptional() @IsEnum(ServiceMode)]
    isBookable?: boolean = false [@ApiPropertyOptional({ example: false, default: false }) @IsOptional() @IsBoolean()]
    bookingMethod?: ServiceBookingMethod [@ApiPropertyOptional({ enum: ServiceBookingMethod }) @IsOptional() @IsEnum(ServiceBookingMethod)]
    externalBookingLink?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
  CLASS UpdateCatalogueItemDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    price?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    shortDescription?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    mainImage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    galleryImages?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true })]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    status?: CatalogueItemStatus [@ApiPropertyOptional({ enum: CatalogueItemStatus }) @IsOptional() @IsEnum(CatalogueItemStatus)]
    sku?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    itemType?: CatalogueItemType [@ApiPropertyOptional({ enum: CatalogueItemType }) @IsOptional() @IsEnum(CatalogueItemType)]
    discountType?: DiscountType [@ApiPropertyOptional({ enum: DiscountType }) @IsOptional() @IsEnum(DiscountType)]
    discountValue?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    stockQuantity?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    barcode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    costPrice?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    minStock?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    brand?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    weight?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    dimensions?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    variants?: Record<string, unknown>[] [@ApiPropertyOptional({ + 'The legacy `{ type, value }` shape is still accepted and converted.', example: [{ name: 'Large', price: 4500, stockQuantity: 12 }]) @IsOptional() @IsArray()]
    compareAtPrice?: number | null [@ApiPropertyOptional({ example: 18000) @IsOptional() @IsNumber() @Min(0)]
    condition?: CatalogueItemCondition | null [@ApiPropertyOptional({ enum: CatalogueItemCondition }) @IsOptional() @IsEnum(CatalogueItemCondition)]
    fulfillmentModes?: CatalogueFulfillmentMode[] [@ApiPropertyOptional({ enum: CatalogueFulfillmentMode, isArray: true }) @IsOptional() @IsArray() @IsEnum(CatalogueFulfillmentMode, { each: true })]
    pricingMode?: CatalogueItemPricingMode [@ApiPropertyOptional({ enum: CatalogueItemPricingMode, default: 'uniform' }) @IsOptional() @IsEnum(CatalogueItemPricingMode)]
    bookingRules?: BookingRulesDto [@ApiPropertyOptional({ type: BookingRulesDto) @IsOptional() @ValidateNested() @Type(() => BookingRulesDto)]
    audience?: string | null [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40)]
    tags?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true })]
    allowBackOrder?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    loyaltyPoints?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    enableLoyaltyPoints?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
    loyaltyPointsValue?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    priceType?: ServicePriceType [@ApiPropertyOptional({ enum: ServicePriceType }) @IsOptional() @IsEnum(ServicePriceType)]
    priceRangeMin?: number [@ApiPropertyOptional({ example: 5000 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    priceRangeMax?: number [@ApiPropertyOptional({ example: 15000 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    duration?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    serviceMode?: ServiceMode [@ApiPropertyOptional({ enum: ServiceMode }) @IsOptional() @IsEnum(ServiceMode)]
    isBookable?: boolean [@ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean()]
    bookingMethod?: ServiceBookingMethod [@ApiPropertyOptional({ enum: ServiceBookingMethod }) @IsOptional() @IsEnum(ServiceBookingMethod)]
    externalBookingLink?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    applyGlobally?: boolean = false [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
  CLASS SuspendItemDto
    reason: string [@ApiProperty() @IsNotEmpty() @IsString()]
  CLASS CatalogueQueryDto
    page?: number = 1 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    itemType?: CatalogueItemType [@ApiPropertyOptional({ enum: CatalogueItemType }) @IsOptional() @IsEnum(CatalogueItemType)]
    minPrice?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    maxPrice?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    sortBy?: string = 'newest' [@ApiPropertyOptional({ enum: ['newest', 'oldest', 'most_popular', 'price_asc', 'price_desc']) @IsOptional() @IsEnum(['newest', 'oldest', 'most_popular', 'price_asc', 'price_desc'])]
  CLASS BulkImportItemsDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    items: BulkImportItemRowDto[] [@ApiProperty({ type: [BulkImportItemRowDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => BulkImportItemRowDto)]
  ENUM PublicProductSortOrder: ASC='ASC', DESC='DESC'
  CLASS PublicProductsQueryDto
    sortOrder?: PublicProductSortOrder = PublicProductSortOrder.DESC [@ApiPropertyOptional({ enum: PublicProductSortOrder, default: PublicProductSortOrder.DESC) @IsOptional() @IsEnum(PublicProductSortOrder)]
##### src/modules/catalogue/dto/my-claims.dto.ts
  ENUM MyClaimStatus: ACTIVE='ACTIVE', REDEEMED='REDEEMED', EXPIRED='EXPIRED'
  CLASS MyClaimsQueryDto
    page?: number [@ApiPropertyOptional({ example: 1, minimum: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
    status?: MyClaimStatus [@ApiPropertyOptional({ enum: MyClaimStatus) @IsOptional() @IsEnum(MyClaimStatus)]
    q?: string [@ApiPropertyOptional({ maxLength: 100, + 'name or claim code. Combined with `status` and pagination, and it also ' + 'narrows `total` so the two never disagree.') @IsOptional() @IsString() @MaxLength(100)]
  CLASS MyClaimDto
    id: string [@ApiProperty()]
    claimCode: string [@ApiProperty()]
    status: MyClaimStatus [@ApiProperty({ enum: MyClaimStatus, example: MyClaimStatus.ACTIVE })]
    expiresAt: Date [@ApiProperty()]
    claimedAt: Date [@ApiProperty()]
    redeemedAt: Date | null [@ApiProperty({ nullable: true)]
    offer: MyClaimOfferDto [@ApiProperty({ type: MyClaimOfferDto })]
  CLASS MyClaimsPageDto
    data: MyClaimDto[] [@ApiProperty({ type: [MyClaimDto] })]
    total: number [@ApiProperty({ example: 3 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
  CLASS BusinessClaimsQueryDto
    page?: number [@ApiPropertyOptional({ example: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
##### src/modules/catalogue/dto/my-gifts.dto.ts
  CLASS MyGiftsQueryDto
    page?: number [@ApiPropertyOptional({ example: 1, minimum: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ example: 10, minimum: 1, maximum: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
    status?: DealGiftStatus [@ApiPropertyOptional({ enum: DealGiftStatus, + 'rows are soft-removed when declined, so they are only visible here and ' + 'not in the branch dashboard.') @IsOptional() @IsEnum(DealGiftStatus)]
    q?: string [@ApiPropertyOptional({ maxLength: 100, + 'sender name or offer name.') @IsOptional() @IsString() @MaxLength(100)]
  CLASS MyGiftDto
    id: string [@ApiProperty()]
    recipientEmail: string [@ApiProperty()]
    recipientName: string | null [@ApiProperty({ nullable: true })]
    note: string | null [@ApiProperty({ nullable: true })]
    status: DealGiftStatus [@ApiProperty({ enum: DealGiftStatus, example: DealGiftStatus.PENDING, + 'with `status: rejected`, so it is hidden from every other gift query.')]
    createdAt: Date [@ApiProperty()]
    acceptedAt: Date | null [@ApiProperty({ nullable: true })]
    rejectedAt: Date | null [@ApiProperty({ nullable: true })]
    rejectionReason: string | null [@ApiProperty({ nullable: true })]
    offer: MyGiftOfferDto [@ApiProperty({ type: MyGiftOfferDto })]
    businessName: string | null [@ApiProperty({ nullable: true })]
    branchName: string | null [@ApiProperty({ nullable: true })]
  CLASS MyGiftsPageDto
    data: MyGiftDto[] [@ApiProperty({ type: [MyGiftDto] })]
    total: number [@ApiProperty({ example: 3 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
##### src/modules/catalogue/dto/offer-ledger.dto.ts
  ENUM OfferLedgerStatus: CLAIMED='claimed', REDEEMED='redeemed', EXPIRED='expired'
  CLASS OfferLedgerQueryDto
    status?: OfferLedgerStatus [@ApiPropertyOptional({ enum: OfferLedgerStatus }) @IsOptional() @IsEnum(OfferLedgerStatus)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    dealGroupId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    from?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    to?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    page?: number [@ApiPropertyOptional({ example: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
##### src/modules/catalogue/dto/offer.dto.ts
  ENUM PublicOffersSortBy: NEWEST='newest', OLDEST='oldest', PRICE_ASC='price_asc', PRICE_DESC='price_desc', TRENDING='trending', POPULAR='popular', FEATURED='featured'
  ENUM BranchOffersSortBy: NEWEST='newest', OLDEST='oldest', PRICE_ASC='price_asc', PRICE_DESC='price_desc'
  ENUM OfferAudience: EVERYONE_NEARBY='everyone_nearby', ALL='all', NEW_CUSTOMERS='new_customers', RETURNING_CUSTOMERS='returning_customers'
  CLASS CreateCatalogueOfferDto
    name: string [@ApiProperty() @IsNotEmpty() @IsString()]
    description?: string = '' [@ApiPropertyOptional({ default: '') @IsOptional() @IsString() @Transform(({ value }) => (typeof value === 'string' ? value : ''))]
    sourceProductId?: string [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), ) @IsUUID('4', { message: 'sourceProductId must be a valid UUID v4' })]
    mainImage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    galleryImages?: string[] [@ApiPropertyOptional({ example: ['https://image.com/offer1.jpg'] }) @IsOptional() @IsArray() @IsString({ each: true })]
    quantity?: number [@ApiPropertyOptional({ example: 100 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    pricingType: CatalogueOfferPricingType [@ApiProperty({ enum: CatalogueOfferPricingType, default: CatalogueOfferPricingType.SUM) @IsNotEmpty() @IsEnum(CatalogueOfferPricingType)]
    discountValue?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    fixedPrice?: number [@ApiPropertyOptional({ example: 25.0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    loyaltyPoints?: number [@ApiPropertyOptional({ example: 50 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    rewardId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    itemIds?: string[] [@ApiPropertyOptional({ example: ['uuid-of-item-1', 'uuid-of-item-2'] }) @IsOptional() @IsArray() @IsUUID(undefined, { each: true })]
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    offerType?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    audience?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    terms?: string[] [@ApiPropertyOptional({ example: [ 'Valid during business hours', 'Cannot be combined with other offers') @IsOptional() @IsArray() @IsString({ each: true })]
    claimCodePrefix?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    maxClaimsPerCustomer?: number [@ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    audienceTarget?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deliveryScope?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deliveryRadius?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    deliveryUnit?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deliveryRegion?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    minOrderAmount?: number [@ApiPropertyOptional({ example: 50.0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    longDescription?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isFeatured?: boolean [@ApiPropertyOptional({ example: false) @IsOptional() @IsBoolean()]
    autoPauseWhenSoldOut?: boolean [@ApiPropertyOptional({ example: true, default: true) @IsOptional() @IsBoolean()]
    claimLimitPeriod?: OfferClaimLimitPeriod [@ApiPropertyOptional({ enum: OfferClaimLimitPeriod, default: 'lifetime') @IsOptional() @IsEnum(OfferClaimLimitPeriod)]
    allowGifting?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean()]
    requireGiftRecipientVerification?: boolean [@ApiPropertyOptional({ example: false, default: false }) @IsOptional() @IsBoolean()]
    socialSharingBonus?: boolean [@ApiPropertyOptional({ example: false, default: false }) @IsOptional() @IsBoolean()]
    redemptionChannels?: OfferRedemptionChannel[] [@ApiPropertyOptional({ enum: OfferRedemptionChannel, isArray: true }) @IsOptional() @IsArray() @IsEnum(OfferRedemptionChannel, { each: true })]
    claimSteps?: string[] [@ApiPropertyOptional({ example: ['Show the pass at the counter'] }) @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(10)]
    redemptionWindows?: OfferRedemptionWindowDto[] [@ApiPropertyOptional({ type: [OfferRedemptionWindowDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferRedemptionWindowDto)]
    tiers?: OfferPricingTierDto[] [@ApiPropertyOptional({ type: [OfferPricingTierDto]) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferPricingTierDto)]
    branchIds?: string[] [@ApiPropertyOptional({ example: ['uuid-branch-1', 'uuid-branch-2'], + '`branchId` is used when this is omitted.') @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true })]
    branchOverrides?: OfferBranchOverrideDto[] [@ApiPropertyOptional({ type: [OfferBranchOverrideDto]) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferBranchOverrideDto)]
  CLASS UpdateCatalogueOfferDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isFeatured?: boolean [@ApiPropertyOptional({ example: false) @IsOptional() @IsBoolean()]
    sourceProductId?: string [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), ) @IsUUID('4', { message: 'sourceProductId must be a valid UUID v4' })]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    mainImage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    galleryImages?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true })]
    quantity?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    pricingType?: CatalogueOfferPricingType [@ApiPropertyOptional({ enum: CatalogueOfferPricingType }) @IsOptional() @IsEnum(CatalogueOfferPricingType)]
    discountValue?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    fixedPrice?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    loyaltyPoints?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    rewardId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    status?: CatalogueOfferStatus [@ApiPropertyOptional({ enum: CatalogueOfferStatus }) @IsOptional() @IsEnum(CatalogueOfferStatus)]
    itemIds?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsUUID(undefined, { each: true })]
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    offerType?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    audience?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    terms?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true })]
    claimCodePrefix?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    maxClaimsPerCustomer?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    audienceTarget?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deliveryScope?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deliveryRadius?: number [@ApiPropertyOptional({ example: 10 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    deliveryUnit?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deliveryRegion?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    minOrderAmount?: number [@ApiPropertyOptional({ example: 50.0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
    longDescription?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    autoPauseWhenSoldOut?: boolean [@ApiPropertyOptional({ example: true, default: true) @IsOptional() @IsBoolean()]
    claimLimitPeriod?: OfferClaimLimitPeriod [@ApiPropertyOptional({ enum: OfferClaimLimitPeriod, default: 'lifetime') @IsOptional() @IsEnum(OfferClaimLimitPeriod)]
    allowGifting?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean()]
    requireGiftRecipientVerification?: boolean [@ApiPropertyOptional({ example: false, default: false }) @IsOptional() @IsBoolean()]
    socialSharingBonus?: boolean [@ApiPropertyOptional({ example: false, default: false }) @IsOptional() @IsBoolean()]
    redemptionChannels?: OfferRedemptionChannel[] [@ApiPropertyOptional({ enum: OfferRedemptionChannel, isArray: true }) @IsOptional() @IsArray() @IsEnum(OfferRedemptionChannel, { each: true })]
    claimSteps?: string[] [@ApiPropertyOptional({ example: ['Show the pass at the counter'] }) @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(10)]
    redemptionWindows?: OfferRedemptionWindowDto[] [@ApiPropertyOptional({ type: [OfferRedemptionWindowDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferRedemptionWindowDto)]
    tiers?: OfferPricingTierDto[] [@ApiPropertyOptional({ type: [OfferPricingTierDto]) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferPricingTierDto)]
  CLASS GenerateOfferTermsDto
    title?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS CatalogueOfferQueryDto
    page?: number = 1 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    sortBy?: BranchOffersSortBy = BranchOffersSortBy.NEWEST [@ApiPropertyOptional({ enum: BranchOffersSortBy, default: BranchOffersSortBy.NEWEST) @IsOptional() @IsEnum(BranchOffersSortBy)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    cursor?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    nextCursor?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS PublicCatalogueOffersQueryDto
    page?: number = 1 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    sortBy?: PublicOffersSortBy = PublicOffersSortBy.NEWEST [@ApiPropertyOptional({ enum: PublicOffersSortBy, default: PublicOffersSortBy.NEWEST) @IsOptional() @IsEnum(PublicOffersSortBy)]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    minPrice?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    maxPrice?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    minDiscount?: number [@ApiPropertyOptional({ minimum: 0, maximum: 100) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100)]
    lat?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()]
    lng?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()]
    radius?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    audience?: OfferAudience [@ApiPropertyOptional({ enum: OfferAudience) @IsOptional() @IsEnum(OfferAudience)]
    cursor?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    nextCursor?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  ENUM AdminDealsSortBy: NEWEST='newest', MOST_POPULAR='most_popular', FEATURED_FIRST='featured_first', PRICE_LOW_HIGH='price_low_high', PRICE_HIGH_LOW='price_high_low', ENDING_SOON='ending_soon'
  ENUM AdminDealsStatusFilter: ACTIVE='active', INACTIVE='inactive', EXPIRED='expired'
  CLASS AdminDealsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    plan?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: AdminDealsStatusFilter [@ApiPropertyOptional({ enum: AdminDealsStatusFilter) @IsOptional() @IsEnum(AdminDealsStatusFilter)]
    isFeatured?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => { if (value === 'true' || value === true) return true; if (value === 'false' || value === false) return false; return undefined; }) @IsBoolean()]
    minPrice?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    maxPrice?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    sortBy?: AdminDealsSortBy = AdminDealsSortBy.NEWEST [@ApiPropertyOptional({ enum: AdminDealsSortBy, default: AdminDealsSortBy.NEWEST) @IsOptional() @IsEnum(AdminDealsSortBy)]
  CLASS AdminBusinessesQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  ENUM OwnerOffersSortBy: NEWEST='newest', OLDEST='oldest', MOST_CLAIMED='most_claimed', ENDING_SOON='ending_soon'
  CLASS OwnerOffersQueryDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    status?: CatalogueOfferStatus [@ApiPropertyOptional({ enum: CatalogueOfferStatus }) @IsOptional() @IsEnum(CatalogueOfferStatus)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    sortBy?: OwnerOffersSortBy [@ApiPropertyOptional({ enum: OwnerOffersSortBy, default: OwnerOffersSortBy.NEWEST) @IsOptional() @IsEnum(OwnerOffersSortBy)]
    groupBy?: 'deal' [@ApiPropertyOptional({ enum: ['deal']) @IsOptional() @IsEnum(['deal'])]
    page?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100)]
  CLASS UpdateOfferGroupDto
    status: CatalogueOfferStatus [@ApiProperty({ enum: CatalogueOfferStatus }) @IsEnum(CatalogueOfferStatus)]
##### src/modules/catalogue/dto/recommendations.dto.ts
  CLASS RecommendationsQueryDto
    lat?: number [@ApiPropertyOptional({ example: 9.0133) @IsOptional() @Type(() => Number) @IsNumber()]
    lng?: number [@ApiPropertyOptional({ example: 7.4911) @IsOptional() @Type(() => Number) @IsNumber()]
    radius?: number [@ApiPropertyOptional({ example: 5, minimum: 0) @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20)]
##### src/modules/catalogue/dto/reject-deal-gift.dto.ts
  CLASS RejectDealGiftDto
    reason: string [@ApiProperty() @IsNotEmpty() @IsString() @MaxLength(500)]
##### src/modules/catalogue/dto/savings.dto.ts
  CLASS MySavingsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
    days?: number [@ApiPropertyOptional({ example: 90, minimum: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
  CLASS MySavingsPageDto
    data: MySavingsEntryDto[] [@ApiProperty({ type: [MySavingsEntryDto] })]
    total: number [@ApiProperty({ example: 3 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
    totalSavedAmount: number [@ApiProperty({ example: 8500)]
  CLASS SavingsBreakdownDto
    data: SavingsCategoryDto[] [@ApiProperty({ type: [SavingsCategoryDto] })]
    totalSavedAmount: number [@ApiProperty({ example: 8500 })]
    totalRedemptions: number [@ApiProperty({ example: 6 })]
  CLASS SavingsCategoriesQueryDto
    days?: number [@ApiPropertyOptional({ example: 90, minimum: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
  ENUM SavingsExportFormat: CSV='csv'
  CLASS SavingsExportQueryDto
    format?: SavingsExportFormat = SavingsExportFormat.CSV [@ApiPropertyOptional({ enum: SavingsExportFormat, default: SavingsExportFormat.CSV) @IsOptional() @IsIn([SavingsExportFormat.CSV])]
    days?: number [@ApiPropertyOptional({ example: 90, minimum: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/catalogue/dto/send-deal-gift.dto.ts
  CLASS SendDealGiftDto
    offerId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    recipientEmail: string [@ApiProperty() @IsNotEmpty() @IsEmail()]
    senderName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)]
    senderEmail?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    note?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    frontendBaseUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/categories/dto/category.dto.ts
  CLASS CreateCategoryDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description: string [@ApiProperty() @IsString() @IsNotEmpty()]
  CLASS UpdateCategoryDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS CreateSubcategoryDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    categoryId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
  CLASS UpdateSubcategoryDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS CategoryPaginationDto
    page?: number = 1 [@ApiPropertyOptional({ minimum: 1, default: 1 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional()]
    limit?: number = 10 [@ApiPropertyOptional({ minimum: 1, default: 10 }) @Type(() => Number) @IsInt() @Min(1) @IsOptional()]
    search?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS SubcategoryPaginationDto
    categoryId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
##### src/modules/clusters/dto/cluster-deals-query.dto.ts
  ENUM ClusterDealsSortBy: FAIR='fair', NEWEST='newest', PRICE_ASC='price_asc', PRICE_DESC='price_desc', DISTANCE_ASC='distance_asc', DISTANCE_DESC='distance_desc'
  CLASS ClusterDealsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    sortBy?: ClusterDealsSortBy [@ApiPropertyOptional({ enum: ClusterDealsSortBy, default: ClusterDealsSortBy.FAIR) @IsOptional() @IsEnum(ClusterDealsSortBy)]
    lat?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()]
    lng?: number [@ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber()]
##### src/modules/clusters/dto/cluster-offer.dto.ts
  CLASS ClusterOffersQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
  CLASS SetClusterOfferPinnedDto
    pinned: boolean [@ApiProperty({ example: true) @IsBoolean()]
##### src/modules/clusters/dto/cluster.dto.ts
  CLASS AddBranchDto
    branchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
  CLASS CreateClusterDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120)]
    type?: ClusterType [@ApiPropertyOptional({ enum: ClusterType, example: ClusterType.MARKET, default: ClusterType.MARKET) @IsOptional() @IsEnum(ClusterType)]
    parentId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    country?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    state?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    city?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    area?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)]
    latitude: number [@ApiProperty({ example: 9.0489 }) @IsNumber() @Min(-90) @Max(90)]
    longitude: number [@ApiProperty({ example: 7.4894 }) @IsNumber() @Min(-180) @Max(180)]
    radiusMeters?: number [@ApiPropertyOptional({ example: 500, default: 500 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    isActive?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean()]
    qrIsActive?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean()]
  CLASS UpdateClusterDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)]
    type?: ClusterType [@ApiPropertyOptional({ enum: ClusterType, example: ClusterType.MARKET) @IsOptional() @IsEnum(ClusterType)]
    parentId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    country?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    state?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    city?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    area?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120)]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)]
    latitude?: number [@ApiPropertyOptional({ example: 9.0489 }) @IsOptional() @IsNumber() @Min(-90) @Max(90)]
    longitude?: number [@ApiPropertyOptional({ example: 7.4894 }) @IsOptional() @IsNumber() @Min(-180) @Max(180)]
    radiusMeters?: number [@ApiPropertyOptional({ example: 500 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    isActive?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
    qrIsActive?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
  CLASS AdminClusterQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 20 [@ApiPropertyOptional({ example: 20, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  ENUM AutoAssignScope: UNASSIGNED='unassigned', ALL='all'
  CLASS AutoAssignClustersDto
    dryRun?: boolean [@ApiPropertyOptional({ example: true, default: false) @IsOptional() @IsBoolean()]
    scope?: AutoAssignScope = AutoAssignScope.UNASSIGNED [@ApiPropertyOptional({ enum: AutoAssignScope, example: AutoAssignScope.UNASSIGNED, default: AutoAssignScope.UNASSIGNED, + "'all' considers every branch and reassigns it to a different, closer covering cluster when one exists.") @IsOptional() @IsEnum(AutoAssignScope)]
    async?: boolean [@ApiPropertyOptional({ example: false, default: false) @IsOptional() @IsBoolean()]
##### src/modules/contacts/dto/segment-criteria.dto.ts
  CLASS SegmentPreviewDto
    criteria: SegmentCriteriaDto [@ApiPropertyOptional({ type: SegmentCriteriaDto }) @ValidateNested() @Type(() => SegmentCriteriaDto)]
##### src/modules/contacts/dto/segment.dto.ts
  CLASS CreateSegmentDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    branchId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
    type?: SegmentType [@ApiPropertyOptional({ enum: SegmentType, default: SegmentType.STATIC }) @IsOptional() @IsEnum(SegmentType)]
    criteria?: SegmentCriteriaDto [@ApiPropertyOptional({ type: SegmentCriteriaDto) @IsOptional() @ValidateNested() @Type(() => SegmentCriteriaDto)]
  CLASS UpdateSegmentDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type?: SegmentType [@ApiPropertyOptional({ enum: SegmentType, default: SegmentType.STATIC }) @IsOptional() @IsEnum(SegmentType)]
    criteria?: SegmentCriteriaDto [@ApiPropertyOptional({ type: SegmentCriteriaDto) @IsOptional() @ValidateNested() @Type(() => SegmentCriteriaDto)]
  CLASS SegmentMemberDto
    userIds: string[] [@ApiProperty({ example: ['uuid-user-1', 'uuid-user-2'] }) @IsArray() @IsUUID('4', { each: true })]
##### src/modules/coupons/dto/create-coupon.dto.ts
  CLASS CreateCouponDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    discountType: DiscountType [@ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE) @IsEnum(DiscountType)]
    amount: number [@ApiProperty({ example: 20) @IsNumber() @IsPositive()]
    currency?: string [@ApiPropertyOptional({ default: 'NGN') @IsString() @IsOptional()]
    maxDiscountAmount?: number [@ApiPropertyOptional({ example: 10000) @IsNumber() @IsPositive() @IsOptional()]
    minSubtotal?: number [@ApiPropertyOptional({ example: 5000) @IsNumber() @Min(0) @IsOptional()]
    duration?: CouponDuration [@ApiPropertyOptional({ enum: CouponDuration, default: CouponDuration.ONCE) @IsEnum(CouponDuration) @IsOptional()]
    durationInMonths?: number [@ApiPropertyOptional({ example: 3) @ValidateIf((o) => o.duration === CouponDuration.REPEATING) @IsNumber() @Min(1) @IsOptional()]
    applicablePlanIds?: string[] [@ApiPropertyOptional({ example: ['uuid-plan-1', 'uuid-plan-2']) @IsArray() @IsString({ each: true }) @IsOptional()]
    applicableBillingPeriods?: string[] [@ApiPropertyOptional({ example: ['monthly', 'quarterly', 'yearly']) @IsArray() @IsString({ each: true }) @IsOptional()]
    isActive?: boolean [@ApiPropertyOptional({ default: true) @IsBoolean() @IsOptional()]
##### src/modules/coupons/dto/create-promo-code.dto.ts
  CLASS CreatePromoCodeDto
    code: string [@ApiProperty() @IsString() @IsNotEmpty()]
    isActive?: boolean [@ApiPropertyOptional({ default: true) @IsBoolean() @IsOptional()]
    startsAt?: string [@ApiPropertyOptional() @IsDateString() @IsOptional()]
    expiresAt?: string [@ApiPropertyOptional() @IsDateString() @IsOptional()]
    maxRedemptions?: number [@ApiPropertyOptional({ example: 10) @IsInt() @IsPositive() @IsOptional()]
    maxRedemptionsPerUser?: number [@ApiPropertyOptional({ example: 1, default: 1) @IsInt() @Min(1) @IsOptional()]
    firstTimeOnly?: boolean [@ApiPropertyOptional({ default: false) @IsBoolean() @IsOptional()]
    allowedBusinessIds?: string[] [@ApiPropertyOptional({ example: ['uuid-biz-1']) @IsArray() @IsString({ each: true }) @IsOptional()]
##### src/modules/coupons/dto/query-promo-codes.dto.ts
  CLASS QueryPromoCodesDto
    couponId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isActive?: string [@ApiPropertyOptional() @IsBooleanString() @IsOptional()]
    search?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/coupons/dto/query-redemptions.dto.ts
  CLASS QueryRedemptionsDto
    couponId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    promotionCodeId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    businessId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    planId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    search?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/coupons/dto/toggle-status.dto.ts
  CLASS ToggleStatusDto
    isActive?: boolean [@ApiPropertyOptional() @IsBoolean() @IsOptional()]
##### src/modules/coupons/dto/validate-promo-code.dto.ts
  CLASS ValidatePromoCodeDto
    code: string [@ApiProperty() @IsString() @IsNotEmpty()]
    planId: string [@ApiProperty() @IsString() @IsNotEmpty()]
    billingPeriod: BillingPeriod [@ApiProperty({ enum: BillingPeriod, example: BillingPeriod.MONTHLY) @IsEnum(BillingPeriod)]
    businessId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/deal-engagement/dto/deal-reaction.dto.ts
  CLASS DealReactionDto
    type: DealReactionType [@ApiProperty({ enum: DealReactionType, example: DealReactionType.LIKE }) @IsEnum(DealReactionType)]
##### src/modules/deal-engagement/dto/deal-review.dto.ts
  CLASS CreateDealReviewDto
    comment: string [@ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(1000) @Transform(({ value }: { value: unknown }): unknown => typeof value === 'string' ? value.trim() : value, )]
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MinLength(2) @MaxLength(60)]
    rating?: number [@ApiPropertyOptional({ example: 5, minimum: 1, maximum: 5) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)]
  CLASS ListReviewsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
  CLASS UpdateDealReviewDto
    comment?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(1000) @Transform(({ value }: { value: unknown }): unknown => typeof value === 'string' ? value.trim() : value, )]
    rating?: number [@ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5)]
  CLASS ReviewsAdminQueryDto
    status?: DealReviewStatus [@ApiPropertyOptional({ enum: DealReviewStatus }) @IsOptional() @IsEnum(DealReviewStatus)]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 20 [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
  CLASS BusinessReviewsQueryDto
    status?: DealReviewStatus [@ApiPropertyOptional({ enum: DealReviewStatus) @IsOptional() @IsEnum(DealReviewStatus)]
    offerId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 20 [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
##### src/modules/devices/dto/admin-create-device.dto.ts
  CLASS AdminCreateDeviceDto
    name?: string [@ApiProperty() @IsString() @IsOptional()]
    code: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type?: string [@ApiProperty() @IsString() @IsOptional()]
    businessId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
    branchId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
    location?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/devices/dto/admin-device-query.dto.ts
  CLASS AdminDeviceQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(1)]
##### src/modules/devices/dto/admin-update-device.dto.ts
  CLASS AdminUpdateDeviceDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    code?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    businessId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
    status?: DeviceStatus [@ApiPropertyOptional({ enum: DeviceStatus, example: DeviceStatus.ACTIVE }) @IsEnum(DeviceStatus) @IsOptional()]
    location?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    branchId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
    productTypeId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
##### src/modules/devices/dto/device-action.dto.ts
  CLASS GenerateDevicesDto
    branchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
  CLASS DeviceQueryDto
    branchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
##### src/modules/devices/dto/update-asset-names.dto.ts
  CLASS UpdateAssetNamesDto
    assets: { id: string; name: string }[] [@ApiProperty({ example: [{ id: 'uuid', name: 'Front door' }] }) @IsNotEmpty()]
    branchId: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/devices/dto/update-device.dto.ts
  CLASS UpdateDeviceDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    location?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    branchId?: string | null [@ApiPropertyOptional() @IsOptional() @ValidateIf((o, v) => v !== '' && v !== null) @IsUUID()]
    status?: DeviceStatus [@ApiPropertyOptional({ enum: DeviceStatus, example: DeviceStatus.INACTIVE }) @IsEnum(DeviceStatus) @IsOptional()]
    isMain?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
##### src/modules/discovery/dto/discovery-admin-category-types.dto.ts
  CLASS CreateCategoryTypeDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty() @MinLength(1)]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: CategoryTypeStatus [@ApiPropertyOptional({ enum: CategoryTypeStatus, default: CategoryTypeStatus.ACTIVE) @IsOptional() @IsEnum(CategoryTypeStatus)]
  CLASS UpdateCategoryTypeDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: CategoryTypeStatus [@ApiPropertyOptional({ enum: CategoryTypeStatus }) @IsOptional() @IsEnum(CategoryTypeStatus)]
  CLASS GenerateReportDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type: string [@ApiProperty() @IsString() @IsNotEmpty()]
    dateRange?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS UpdateDiscoveryAdminSettingsDto
    enableNetwork?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    enableSponsored?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    enablePartnerships?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    maxOffersPerVisit?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    maxOffersPerDay?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    defaultRadius?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    maxRadius?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    attributionWindow?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    pushEnabled?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    smsEnabled?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    emailEnabled?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    approvalRequired?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
##### src/modules/discovery/dto/discovery-admin-query.dto.ts
  CLASS AdminOfferQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminReferralQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminPartnershipQueryDto
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminSponsoredQueryDto
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminBillingQueryDto
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    type?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminCustomerQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminLocationQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminCategoryQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminFraudQueryDto
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    severity?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminNotificationQueryDto
    channel?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS AdminAuditLogQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    date?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/discovery/dto/discovery.dto.ts
  CLASS UpdateDiscoverySettingsDto
    joinDiscoveryNetwork?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
    receivePartnerRequests?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
    allowPromotions?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
    pushNotifications?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
    smsAlerts?: boolean [@ApiPropertyOptional({ example: false) @IsOptional() @IsBoolean()]
    emailSummary?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
  CLASS RecommendBusinessDto
    businessName: string [@ApiProperty() @IsNotEmpty() @IsString()]
    ownerName: string [@ApiProperty() @IsNotEmpty() @IsString()]
    phone: string [@ApiProperty() @IsNotEmpty() @IsString()]
    email: string [@ApiProperty() @IsNotEmpty() @IsEmail()]
    address?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    reason?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS DiscoveryQueryDto
    page?: number [@ApiPropertyOptional({ example: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ example: 10) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    filter?: 'all' | 'from_partners' | 'sent_to_partners' | 'direct' [@ApiPropertyOptional() @IsOptional() @IsString() @IsIn(['all', 'from_partners', 'sent_to_partners', 'direct'])]
##### src/modules/feedback/dto/create-feedback.dto.ts
  CLASS CreateFeedbackDto
    branchId: string [@ApiProperty() @IsUUID()]
    rating: number [@ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5)]
    comment: string [@ApiProperty() @IsString()]
    orderId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
##### src/modules/forms/dto/admin-form.dto.ts
  CLASS AdminFormQueryDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1 }) @IsOptional() @IsInt() @Type(() => Number) @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @IsInt() @Type(() => Number) @Min(1)]
##### src/modules/forms/dto/branch-id-param.dto.ts
  CLASS BranchIdParamDto
    branchId: string [@ApiProperty() @IsUUID('4', { message: 'branchId must be a valid UUID v4' })]
##### src/modules/forms/dto/create-form-template.dto.ts
  CLASS CreateFormTemplateDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiProperty() @IsOptional() @IsString()]
    fields: CreateFormFieldTemplateDto[] [@ApiProperty({ type: [CreateFormFieldTemplateDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CreateFormFieldTemplateDto)]
##### src/modules/forms/dto/create-form.dto.ts
  CLASS CreateFormDto
    title: string [@ApiProperty() @IsString()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isActive?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    isPublished?: boolean [@ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()]
    showAfterLeadCapture?: boolean [@ApiPropertyOptional({ default: false) @IsOptional() @IsBoolean()]
    requiresAuth?: boolean [@ApiPropertyOptional({ default: true) @IsOptional() @IsBoolean()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    successTitle?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    successMessage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    fields: CreateFormFieldDto[] [@ApiProperty({ type: [CreateFormFieldDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CreateFormFieldDto)]
##### src/modules/forms/dto/disable-form.dto.ts
  CLASS DisableFormDto
    adminDisabledNote: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/forms/dto/form-template-query.dto.ts
  CLASS FormTemplateQueryDto
    search?: string [@ApiProperty() @IsOptional() @IsString()]
    page?: number = 1 [@ApiProperty({ example: 1, default: 1 }) @IsOptional() @IsInt() @Type(() => Number) @Min(1)]
    limit?: number = 10 [@ApiProperty({ example: 10, default: 10 }) @IsOptional() @IsInt() @Type(() => Number) @Min(1)]
##### src/modules/forms/dto/submit-form-response.dto.ts
  CLASS SubmitFormResponseDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    answers: FormAnswerDto[] [@ApiProperty({ type: [FormAnswerDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => FormAnswerDto)]
##### src/modules/forms/dto/update-branch-form-settings.dto.ts
  CLASS UpdateBranchFormSettingsDto
    formAppearanceColor?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    welcomeTag?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    welcomeTitle?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    welcomeMessage?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    successTitle?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    successDescription?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/fos-ai-assistant/dto/chat-query.dto.ts
  CLASS ChatQueryDto
    query: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/fos-budgets/dto/budget.dto.ts
  CLASS CreateBudgetDto
    periodType: BudgetPeriodType [@ApiProperty({ enum: BudgetPeriodType, example: BudgetPeriodType.MONTHLY }) @IsEnum(BudgetPeriodType) @IsNotEmpty()]
    targetRevenue: number [@ApiProperty({ example: 3000000 }) @IsNumber() @Min(0)]
    targetBusinesses: number [@ApiProperty({ example: 350 }) @IsNumber() @Min(0)]
    targetSmsUsage: number [@ApiProperty({ example: 1500000 }) @IsNumber() @Min(0)]
    targetProfit: number [@ApiProperty({ example: 1500000 }) @IsNumber() @Min(0)]
    startDate: string [@ApiProperty() @IsDateString()]
    endDate: string [@ApiProperty() @IsDateString()]
##### src/modules/fos-core/dto/create-financial-transaction.dto.ts
  CLASS DateRangeQueryDto
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/fos-financial-planning/dto/financial-planning.dto.ts
  CLASS CreateTargetDto
    periodType: TargetPeriodType [@ApiProperty({ enum: TargetPeriodType, example: TargetPeriodType.MONTHLY }) @IsEnum(TargetPeriodType) @IsNotEmpty()]
    targetRevenue: number [@ApiProperty({ example: 5000000 }) @IsNumber() @Min(0)]
    targetBusinesses: number [@ApiProperty({ example: 500 }) @IsNumber() @Min(0)]
    targetSmsUsage: number [@ApiProperty({ example: 10000 }) @IsNumber() @Min(0)]
    targetEmailUsage: number [@ApiProperty({ example: 5000 }) @IsNumber() @Min(0)]
    profitMargin: number [@ApiProperty({ example: 30 }) @IsNumber() @Min(0) @Max(100)]
    startDate: string [@ApiProperty() @IsDateString() @IsNotEmpty()]
    endDate: string [@ApiProperty() @IsDateString() @IsNotEmpty()]
  CLASS TargetFilterDto
    periodType?: TargetPeriodType [@ApiPropertyOptional({ enum: TargetPeriodType }) @IsOptional() @IsEnum(TargetPeriodType)]
  CLASS ScenarioSimulationRequestDto
    currentBusinesses: number [@ApiProperty({ example: 340 }) @IsNumber() @Min(0)]
    growthRate: number [@ApiProperty({ example: 10 }) @IsNumber() @Min(0) @Max(100)]
    churnRate: number [@ApiProperty({ example: 5 }) @IsNumber() @Min(0) @Max(20)]
    pricing: number [@ApiProperty({ example: 5000 }) @IsNumber() @Min(0)]
    agentFactor: number [@ApiProperty({ example: 1.5 }) @IsNumber() @Min(0.5) @Max(5)]
    projectionMonths: number [@ApiProperty({ example: 12 }) @IsNumber() @Min(1) @Max(24)]
    profitMargin: number [@ApiProperty({ example: 30 }) @IsNumber() @Min(0) @Max(100)]
##### src/modules/fos-forecasting/dto/forecasting.dto.ts
  CLASS ForecastProjectionRequestDto
    baseBusinesses: number [@ApiProperty({ example: 340 }) @IsNumber() @Min(0)]
    arpu: number [@ApiProperty({ example: 3676.47 }) @IsNumber() @Min(0)]
    fixedCosts: number [@ApiProperty({ example: 250000 }) @IsNumber() @Min(0)]
    grossRevenue: number [@ApiProperty({ example: 1250000 }) @IsNumber() @Min(0)]
    variableCostMargin: number [@ApiProperty({ example: 50 }) @IsNumber() @Min(0) @Max(100)]
    cashBalance: number [@ApiProperty({ example: 2500000 }) @IsNumber() @Min(0)]
    qrThriveLeadsPerMonth: number [@ApiProperty({ example: 0 }) @IsNumber() @Min(0)]
    period: number [@ApiProperty({ example: 12 }) @IsNumber() @Min(1) @Max(36)]
    growthRate: number [@ApiProperty({ example: 10 }) @IsNumber() @Min(0) @Max(50)]
    churnRate: number [@ApiProperty({ example: 5 }) @IsNumber() @Min(0) @Max(30)]
    conversionRate: number [@ApiProperty({ example: 15 }) @IsNumber() @Min(0) @Max(100)]
  CLASS SaveForecastRequestDto
    scenarioName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    parameters: { [@ApiProperty() @IsNotEmpty()]
    result: ForecastProjectionResponseDto [@ApiProperty() @IsNotEmpty()]
##### src/modules/fos-goals/dto/goal.dto.ts
  CLASS CreateGoalDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    target: number [@ApiProperty({ example: 400 }) @IsNumber() @Min(0)]
    current?: number [@ApiPropertyOptional({ example: 342 }) @IsOptional() @IsNumber() @Min(0)]
    deadline?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS UpdateGoalDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    target?: number [@ApiPropertyOptional({ example: 400 }) @IsOptional() @IsNumber() @Min(0)]
    current?: number [@ApiPropertyOptional({ example: 342 }) @IsOptional() @IsNumber() @Min(0)]
    deadline?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS CreateProjectDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    budget?: number [@ApiPropertyOptional({ example: 500000 }) @IsOptional() @IsNumber() @Min(0)]
    spent?: number [@ApiPropertyOptional({ example: 320000 }) @IsOptional() @IsNumber() @Min(0)]
    revenue?: number [@ApiPropertyOptional({ example: 850000 }) @IsOptional() @IsNumber() @Min(0)]
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deadline?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
  CLASS UpdateProjectDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    budget?: number [@ApiPropertyOptional({ example: 500000 }) @IsOptional() @IsNumber() @Min(0)]
    spent?: number [@ApiPropertyOptional({ example: 320000 }) @IsOptional() @IsNumber() @Min(0)]
    revenue?: number [@ApiPropertyOptional({ example: 850000 }) @IsOptional() @IsNumber() @Min(0)]
    status?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    deadline?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/fos-ledger/dto/ledger.dto.ts
  CLASS CreateInvoiceDto
    customer: string [@ApiProperty() @IsString() @IsNotEmpty()]
    amount: number [@ApiProperty({ example: 250000 }) @IsNumber() @Min(0)]
    dueDate: string [@ApiProperty() @IsDateString()]
    status?: FosInvoiceStatus [@ApiPropertyOptional({ enum: FosInvoiceStatus }) @IsOptional() @IsEnum(FosInvoiceStatus)]
    collectedAt?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
  CLASS UpdateInvoiceDto
    customer?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    amount?: number [@ApiPropertyOptional({ example: 250000 }) @IsOptional() @IsNumber() @Min(0)]
    dueDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    status?: FosInvoiceStatus [@ApiPropertyOptional({ enum: FosInvoiceStatus }) @IsOptional() @IsEnum(FosInvoiceStatus)]
    collectedAt?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
  CLASS CreateBillDto
    description: string [@ApiProperty() @IsString() @IsNotEmpty()]
    amount: number [@ApiProperty({ example: 420000 }) @IsNumber() @Min(0)]
    dueDate: string [@ApiProperty() @IsDateString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: FosBillStatus [@ApiPropertyOptional({ enum: FosBillStatus }) @IsOptional() @IsEnum(FosBillStatus)]
  CLASS UpdateBillDto
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    amount?: number [@ApiPropertyOptional({ example: 420000 }) @IsOptional() @IsNumber() @Min(0)]
    dueDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: FosBillStatus [@ApiPropertyOptional({ enum: FosBillStatus }) @IsOptional() @IsEnum(FosBillStatus)]
##### src/modules/fos-messaging/dto/messaging-logs-query.dto.ts
  CLASS MessagingLogsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 50 [@ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/fos-planning/dto/planning.dto.ts
  CLASS CreateBudgetItemDto
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    item: string [@ApiProperty() @IsString() @IsNotEmpty()]
    planned: number [@ApiProperty({ example: 2800000 }) @IsNumber() @Min(0)]
    actual?: number [@ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() @Min(0)]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS UpdateBudgetItemDto
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    item?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    planned?: number [@ApiPropertyOptional({ example: 2800000 }) @IsOptional() @IsNumber() @Min(0)]
    actual?: number [@ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() @Min(0)]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS CreateBudgetCategoryDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
  CLASS CreateAspectDto
    label: string [@ApiProperty() @IsString() @IsNotEmpty()]
    baseValue: number [@ApiProperty({ example: 2847500 }) @IsNumber() @Min(0)]
    growthRate?: number [@ApiPropertyOptional({ example: 12 }) @IsOptional() @IsNumber()]
  CLASS UpdateAspectDto
    label?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    baseValue?: number [@ApiPropertyOptional({ example: 2847500 }) @IsOptional() @IsNumber() @Min(0)]
    growthRate?: number [@ApiPropertyOptional({ example: 12 }) @IsOptional() @IsNumber()]
##### src/modules/fos-pnl/dto/create-cashflow.dto.ts
  CLASS CreateCashFlowDto
    type: CashFlowType [@ApiProperty({ enum: CashFlowType }) @IsEnum(CashFlowType)]
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    amount: number [@ApiProperty({ example: 500000 }) @IsNumber() @Min(0)]
    date?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/fos-pnl/dto/create-expense.dto.ts
  CLASS CreateExpenseDto
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    amount: number [@ApiProperty({ example: 500000 }) @IsNumber() @Min(0)]
    frequency: ExpenseFrequency [@ApiProperty({ enum: ExpenseFrequency }) @IsEnum(ExpenseFrequency)]
    date?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/fos-pnl/dto/list-cashflows-query.dto.ts
  CLASS ListCashFlowsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 20 [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    type?: CashFlowType [@ApiPropertyOptional({ enum: CashFlowType }) @IsOptional() @IsEnum(CashFlowType)]
##### src/modules/fos-pnl/dto/list-expenses-query.dto.ts
  CLASS ListExpensesQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 20 [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/fos-pnl/dto/pnl-response.dto.ts
  CLASS RevenueTrendDto
    month: string [@ApiProperty()]
    revenue: number [@ApiProperty({ example: 450000 })]
    costs: number [@ApiProperty({ example: 400000 })]
    profit: number [@ApiProperty({ example: 50000 })]
##### src/modules/fos-pnl/dto/update-expense.dto.ts
  CLASS UpdateExpenseDto
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    amount?: number [@ApiPropertyOptional({ example: 500000 }) @IsOptional() @IsNumber() @Min(0)]
    frequency?: ExpenseFrequency [@ApiPropertyOptional({ enum: ExpenseFrequency }) @IsOptional() @IsEnum(ExpenseFrequency)]
##### src/modules/fos-profile/dto/profile.dto.ts
  CLASS UpdateProfileDto
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    email?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    avatar?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(512)]
  CLASS ProfileActivityQueryDto
    limit?: number [@ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/fos-records/dto/record.dto.ts
  CLASS CreateRecordDto
    date: string [@ApiProperty() @IsDateString()]
    type: FosRecordType [@ApiProperty({ enum: FosRecordType }) @IsEnum(FosRecordType)]
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description: string [@ApiProperty() @IsString() @IsNotEmpty()]
    amount: number [@ApiProperty({ example: 250000 }) @IsNumber() @Min(0)]
  CLASS ListRecordsQueryDto
    year?: number [@ApiPropertyOptional({ example: 2026 }) @IsOptional() @Type(() => Number) @IsInt()]
    month?: number [@ApiPropertyOptional({ example: 7 }) @IsOptional() @Type(() => Number) @IsInt()]
    type?: FosRecordType [@ApiPropertyOptional({ enum: FosRecordType }) @IsOptional() @IsEnum(FosRecordType)]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 20 [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/fos-reports/dto/custom-report.dto.ts
  CLASS CustomReportDto
    dateRange?: '30days' | '90days' | '12months' [@ApiPropertyOptional({ enum: ['30days', '90days', '12months'] }) @IsOptional() @IsIn(['30days', '90days', '12months'])]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    department?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/fos-revenue-analytics/dto/revenue-analytics.dto.ts
  CLASS RevenueTransactionsQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    type?: FosTransactionType [@ApiPropertyOptional({ enum: FosTransactionType }) @IsOptional() @IsEnum(FosTransactionType)]
    platform?: FosPlatform [@ApiPropertyOptional({ enum: FosPlatform }) @IsOptional() @IsEnum(FosPlatform)]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    agentId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
  CLASS ChartDataQueryDto
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    platform?: FosPlatform [@ApiPropertyOptional({ enum: FosPlatform }) @IsOptional() @IsEnum(FosPlatform)]
    type?: FosTransactionType [@ApiPropertyOptional({ enum: FosTransactionType }) @IsOptional() @IsEnum(FosTransactionType)]
  CLASS BusinessIdParamDto
    businessId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
  CLASS TransactionsListResponseDto
    transactions: TransactionDto[] [@ApiProperty({ type: [TransactionDto] })]
    total: number [@ApiProperty({ example: 42 })]
  CLASS RevenueAggregatesResponseDto
    totalRevenue: number [@ApiProperty({ example: 1250000 })]
    subscriptionRevenue: number [@ApiProperty({ example: 850000 })]
    smsRevenue: number [@ApiProperty({ example: 400000 })]
    totalProfit: number [@ApiProperty({ example: 450000 })]
    agentPayouts: number [@ApiProperty({ example: 175000 })]
    totalTransactions: number [@ApiProperty({ example: 340 })]
  CLASS RevenueTrendDto
    date: string [@ApiProperty()]
    revenue: number [@ApiProperty({ example: 1250000 })]
    profit: number [@ApiProperty({ example: 450000 })]
  CLASS RevenueChartDataResponseDto
    monthlyPlatformRevenue: MonthlyPlatformRevenueDto[] [@ApiProperty({ type: [MonthlyPlatformRevenueDto] })]
    revenueByType: RevenueByTypeDto[] [@ApiProperty({ type: [RevenueByTypeDto] })]
  CLASS BusinessRevenueHistoryResponseDto
    transactions: BusinessTransactionItemDto[] [@ApiProperty({ type: [BusinessTransactionItemDto] })]
##### src/modules/fos-settings/dto/fos-config.dto.ts
  CLASS CreateCategoryDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type: FosCategoryType [@ApiProperty({ enum: FosCategoryType }) @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS UpdateCategoryDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    type?: FosCategoryType [@ApiPropertyOptional({ enum: FosCategoryType }) @IsOptional() @IsString()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS CreateAccountDto
    code: string [@ApiProperty() @IsString() @IsNotEmpty()]
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type: string [@ApiProperty() @IsString() @IsNotEmpty()]
    normalBalance: NormalBalance [@ApiProperty({ enum: NormalBalance }) @IsString() @IsNotEmpty()]
  CLASS UpdateAccountDto
    code?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    type?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    normalBalance?: NormalBalance [@ApiPropertyOptional({ enum: NormalBalance }) @IsOptional() @IsString()]
  CLASS CreatePeriodDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    startDate: string [@ApiProperty() @IsDateString()]
    endDate: string [@ApiProperty() @IsDateString()]
    status?: FosPeriodStatus [@ApiPropertyOptional({ enum: FosPeriodStatus }) @IsOptional() @IsString()]
  CLASS UpdatePeriodDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    status?: FosPeriodStatus [@ApiPropertyOptional({ enum: FosPeriodStatus }) @IsOptional() @IsString()]
  CLASS CreateCurrencyDto
    code: string [@ApiProperty() @IsString() @IsNotEmpty()]
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    symbol: string [@ApiProperty() @IsString() @IsNotEmpty()]
    rate?: number [@ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Min(0)]
    isDefault?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
  CLASS UpdateCurrencyDto
    code?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    symbol?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    rate?: number [@ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Min(0)]
    isDefault?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
  CLASS UpdatePermissionsDto
    permissions: Record<string, Record<string, boolean>> [@ApiProperty({ example: { 'Super Admin': { view: true, create: true, edit: true, delete: true, approve: true, manageTeam: true, manageSettings: true) @IsNotEmpty()]
  CLASS CreateApprovalRuleDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    trigger: string [@ApiProperty() @IsString() @IsNotEmpty()]
    approver: string [@ApiProperty() @IsString() @IsNotEmpty()]
    threshold: string [@ApiProperty() @IsString() @IsNotEmpty()]
    status?: FosApprovalRuleStatus [@ApiPropertyOptional({ enum: FosApprovalRuleStatus }) @IsOptional() @IsString()]
  CLASS UpdateApprovalRuleDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    trigger?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    approver?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    threshold?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: FosApprovalRuleStatus [@ApiPropertyOptional({ enum: FosApprovalRuleStatus }) @IsOptional() @IsString()]
  CLASS CreateNotificationRuleDto
    event: string [@ApiProperty() @IsString() @IsNotEmpty()]
    channel: FosNotificationChannel [@ApiProperty({ enum: FosNotificationChannel }) @IsString() @IsNotEmpty()]
    enabled?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
  CLASS UpdateNotificationRuleDto
    event?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    channel?: FosNotificationChannel [@ApiPropertyOptional({ enum: FosNotificationChannel }) @IsOptional() @IsString()]
    enabled?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
  CLASS ListAuditLogsQueryDto
    limit?: number [@ApiPropertyOptional({ example: 50 }) @IsOptional() @IsNumber()]
##### src/modules/fos-settings/dto/fos-settings.dto.ts
  CLASS UpdateFosSettingsDto
    currency?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    timezone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    dateFormat?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    theme?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    paystackSecretKey?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    termiiApiKey?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS InviteTeamMemberDto
    email: string [@ApiProperty() @IsEmail()]
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    role?: UserRole [@ApiPropertyOptional({ enum: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }) @IsOptional() @IsEnum([UserRole.ADMIN, UserRole.SUPER_ADMIN])]
##### src/modules/fos-transfers/dto/transfer.dto.ts
  CLASS CreateTransferDto
    date: string [@ApiProperty() @IsDateString()]
    category?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    description: string [@ApiProperty() @IsString() @IsNotEmpty()]
    amount: number [@ApiProperty({ example: 500000 }) @IsNumber() @Min(0)]
    reference?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS ListTransfersQueryDto
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    perPage?: number = 20 [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/inventory-counting/dto/add-count-item.dto.ts
  CLASS AddCountItemsDto
    items: CountItemEntryDto[] [@ApiProperty({ type: [CountItemEntryDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => CountItemEntryDto)]
  CLASS UpdateCountItemDto
    countedQuantity: number [@ApiProperty({ example: 48 }) @IsNotEmpty() @IsNumber() @Min(0)]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/inventory-counting/dto/approve-variance.dto.ts
  CLASS ApproveVarianceDto
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS RejectVarianceDto
    reason: string [@ApiProperty() @IsNotEmpty() @IsString()]
##### src/modules/inventory-counting/dto/complete-count.dto.ts
  CLASS CompleteCountDto
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/inventory-counting/dto/count-session-query.dto.ts
  CLASS CountSessionQueryDto
    status?: CountSessionStatus [@ApiPropertyOptional({ enum: CountSessionStatus }) @IsOptional() @IsEnum(CountSessionStatus)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    page?: number = 1 [@ApiPropertyOptional() @IsOptional() @Type(() => Number)]
    limit?: number = 10 [@ApiPropertyOptional() @IsOptional() @Type(() => Number)]
##### src/modules/inventory-counting/dto/create-count-session.dto.ts
  CLASS CreateCountSessionDto
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    isBlind?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsOptional() @IsBoolean()]
    zone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    itemIds?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsUUID('4', { each: true })]
##### src/modules/knowledge-base/dto/category.dto.ts
  CLASS CreateKbCategoryDto
    title: string [@ApiProperty() @IsNotEmpty() @IsString()]
    order?: number = 0 [@ApiPropertyOptional({ example: 0, default: 0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
  CLASS UpdateKbCategoryDto
    title?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    order?: number [@ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
##### src/modules/knowledge-base/dto/page.dto.ts
  CLASS CreateKbPageDto
    title: string [@ApiProperty() @IsNotEmpty() @IsString()]
    path: string [@ApiProperty() @IsNotEmpty() @IsString()]
    summary: string [@ApiProperty() @IsNotEmpty() @IsString()]
    thumbnail?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    blocks: Record<string, any>[] [@ApiProperty({ example: [ { type: 'heading', text: 'Step 1' }, { type: 'text', text: 'Turn on device' }, { type: 'steps', items: ['Connect power', 'Press button'] }, { type: 'image', url: 'https://example.com/img.png', caption: 'Button' }) @IsArray()]
    tips?: string[] [@ApiPropertyOptional({ example: ['Ensure power source is grounded'] }) @IsOptional() @IsArray() @IsString({ each: true })]
    categoryId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    sectionId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    order?: number = 0 [@ApiPropertyOptional({ example: 0, default: 0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
  CLASS UpdateKbPageDto
    title?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    path?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    summary?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    thumbnail?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    blocks?: Record<string, any>[] [@ApiPropertyOptional({ example: [] }) @IsOptional() @IsArray()]
    tips?: string[] [@ApiPropertyOptional({ example: ['Ensure power source is grounded'] }) @IsOptional() @IsArray() @IsString({ each: true })]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    sectionId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    order?: number [@ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
##### src/modules/knowledge-base/dto/section.dto.ts
  CLASS CreateKbSectionDto
    title: string [@ApiProperty() @IsNotEmpty() @IsString()]
    categoryId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    order?: number = 0 [@ApiPropertyOptional({ example: 0, default: 0 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
  CLASS UpdateKbSectionDto
    title?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    order?: number [@ApiPropertyOptional({ example: 1 }) @IsOptional() @IsNumber() @Type(() => Number) @Min(0)]
##### src/modules/legal-compliance/dto/accept-agreement.dto.ts
  CLASS AcceptAgreementDto
    signatureHash?: string [@ApiProperty() @IsOptional() @IsString()]
##### src/modules/legal-compliance/dto/agreement-response.dto.ts
  CLASS AgreementResponseDto
    id: string [@ApiProperty()]
    name: string [@ApiProperty()]
    slug: string [@ApiProperty()]
    version: string [@ApiProperty()]
    contentUrl: string [@ApiProperty()]
    effectiveDate: Date [@ApiProperty()]
    isActive: boolean [@ApiProperty({ example: true })]
    acceptance: AcceptanceInfoDto | null [@ApiProperty({ type: AcceptanceInfoDto, nullable: true })]
  CLASS PaginatedAgreementHistoryDto
    data: AgreementHistoryResponseDto[] [@ApiProperty({ type: [AgreementHistoryResponseDto] })]
    total: number [@ApiProperty({ example: 100 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
##### src/modules/legal-compliance/dto/create-agreement.dto.ts
  CLASS CreateAgreementDto
    name: string [@ApiProperty() @IsString()]
    slug: string [@ApiProperty() @IsString()]
    version: string [@ApiProperty() @IsString()]
    contentUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    effectiveDate: string [@ApiProperty() @IsDateString()]
    isActive?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
  CLASS UpdateAgreementDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    version?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    contentUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    effectiveDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    isActive?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
##### src/modules/loyalty/dto/loyalty-query.dto.ts
  CLASS RewardQueryDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    branchCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    global?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true || value === '1') @IsBoolean()]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    newest?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    oldest?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    lowestQuantity?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    highestQuantity?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    aboutToExpire?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    highestPoints?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    lowestPoints?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true) @IsBoolean()]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
  CLASS CustomerAnalyticsQueryDto
    days?: number = 30 [@ApiPropertyOptional({ default: 30) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    allTime?: boolean [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true' || value === true || value === '1') @IsBoolean()]
  CLASS PointLogsQueryDto
    businessId: string [@ApiPropertyOptional() @IsUUID()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
  CLASS CustomerPointLogsQueryDto
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/loyalty/dto/loyalty-rule.dto.ts
  CLASS UpdateLoyaltyRuleDto
    ruleType?: RuleType [@ApiPropertyOptional({ enum: RuleType }) @IsOptional() @IsEnum(RuleType)]
    isActive?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    spendingBaseAmount?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)]
    spendingBasePoints?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)]
    visitPoints?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)]
    visitCooldownHours?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)]
    firstVisitBonus?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)]
    birthdayBonus?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)]
    referralBonus?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)]
##### src/modules/loyalty/dto/loyalty.dto.ts
  ENUM ManualEarnSource: MANUAL_AWARD='manual_award', PROMOTION='promotion', COMPENSATION='compensation'
  CLASS CreateRewardTemplateDto
    name: string [@ApiProperty() @IsString()]
    description: string [@ApiProperty() @IsString()]
    pointsRequired: number [@ApiProperty() @IsNumber() @Min(0)]
    category: RewardCategory [@ApiProperty({ enum: RewardCategory }) @IsEnum(RewardCategory)]
    coverImage?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    galleryImages?: string[] [@ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true })]
  CLASS CreateRewardDto
    branchId: string [@ApiProperty() @IsUUID()]
    totalQuantity: number [@ApiProperty() @IsNumber() @Min(-1) @NotEquals(0)]
    expiryDate: string [@ApiProperty() @IsDateString()]
    templateId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    audienceType?: RewardAudienceType [@ApiPropertyOptional({ enum: RewardAudienceType, default: RewardAudienceType.ALL) @IsOptional() @IsEnum(RewardAudienceType)]
  CLASS GivePointsDto
    customerId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    userId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    customerCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    points?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1)]
    spendingAmount?: number [@ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)]
    reason?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    branchId: string [@ApiProperty() @IsUUID()]
  CLASS GeneratePointCodeDto
    points: number [@ApiProperty() @IsNumber() @Min(1)]
    businessId: string [@ApiProperty() @IsUUID()]
  CLASS UsePointCodeDto
    code: string [@ApiProperty() @IsString()]
  CLASS GenerateRedemptionCodeDto
    rewardId: string [@ApiProperty() @IsUUID()]
    branchId: string [@ApiProperty() @IsUUID()]
  CLASS RedeemRewardDto
    code: string [@ApiProperty() @IsString()]
  CLASS RedeemRewardByIdDto
    rewardId: string [@ApiProperty() @IsUUID()]
  CLASS VerifyRedemptionDto
    code: string [@ApiProperty() @IsString()]
  CLASS ApplyRewardTemplateDto
    branchId: string [@ApiProperty() @IsUUID()]
    totalQuantity: number [@ApiProperty() @IsNumber() @Min(-1) @NotEquals(0)]
    expiryDate: string [@ApiProperty() @IsDateString()]
    audienceType?: RewardAudienceType [@ApiPropertyOptional({ enum: RewardAudienceType }) @IsOptional() @IsEnum(RewardAudienceType)]
  CLASS BranchIdParamDto
    branchId: string [@ApiProperty() @IsUUID()]
  CLASS ManualEarnPointsDto
    userId: string [@ApiProperty() @IsUUID()]
    points: number [@ApiProperty({ example: 500) @IsNumber() @Min(1)]
    source?: ManualEarnSource [@ApiPropertyOptional({ enum: ManualEarnSource, default: ManualEarnSource.MANUAL_AWARD) @IsOptional() @IsEnum(ManualEarnSource)]
    rewardId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    awardedBy?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/loyalty/dto/visitor-loyalty.dto.ts
  CLASS VisitorPointsEarnDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    branchCode?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isVisit?: boolean [@ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean()]
  CLASS LegacyVisitorPointsEarnDto
    userId: string [@ApiPropertyOptional() @IsString()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isVisit?: boolean [@ApiPropertyOptional() @IsOptional() @Type(() => Boolean) @IsBoolean()]
##### src/modules/marketing-assets/dto/brand-override.dto.ts
  CLASS SaveBrandOverrideDto
    logoUrl?: string [@ApiProperty() @IsString() @IsOptional()]
    primaryColor?: string [@ApiProperty() @IsString() @IsOptional()]
    secondaryColor?: string [@ApiProperty() @IsString() @IsOptional()]
    accentColor?: string [@ApiProperty() @IsString() @IsOptional()]
    tagline?: string [@ApiProperty() @IsString() @IsOptional()]
    fontFamily?: string [@ApiProperty() @IsString() @IsOptional()]
    website?: string [@ApiProperty() @IsString() @IsOptional()]
    phone?: string [@ApiProperty() @IsString() @IsOptional()]
    email?: string [@ApiProperty() @IsString() @IsOptional()]
    socialLinks?: any [@ApiProperty() @IsObject() @IsOptional()]
##### src/modules/marketing-assets/dto/create-ai-prompt.dto.ts
  CLASS CreateAIPromptDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    promptTemplate: string [@ApiProperty() @IsString() @IsNotEmpty()]
    isActive?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
##### src/modules/marketing-assets/dto/create-asset.dto.ts
  CLASS CreateAssetDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    templateId?: string [@ApiProperty() @IsUUID() @IsOptional()]
    branchId?: string [@ApiProperty() @IsUUID() @IsOptional()]
    type: string [@ApiProperty() @IsString() @IsNotEmpty()]
    customConfig: any [@ApiProperty() @IsObject() @IsNotEmpty()]
    qrCodeContent: string [@ApiProperty() @IsString() @IsNotEmpty()]
    qrCodeConfig?: any [@ApiProperty() @IsObject() @IsOptional()]
    thumbnailUrl?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/marketing-assets/dto/create-category.dto.ts
  CLASS CreateMarketingCategoryDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    slug?: string [@ApiProperty() @IsString() @IsOptional()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    icon?: string [@ApiProperty() @IsString() @IsOptional()]
    color?: string [@ApiProperty() @IsString() @IsOptional()]
    sortOrder?: number [@ApiProperty({ example: 0) @IsNumber() @IsOptional()]
    isActive?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
##### src/modules/marketing-assets/dto/create-mockup.dto.ts
  CLASS CreateMockupDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type: string [@ApiProperty() @IsString() @IsNotEmpty()]
    imageUrl: string [@ApiProperty() @IsString() @IsNotEmpty()]
    overlayConfig: any [@ApiProperty() @IsObject() @IsNotEmpty()]
    isActive?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
##### src/modules/marketing-assets/dto/create-template-format.dto.ts
  CLASS CreateTemplateFormatDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    slug?: string [@ApiProperty() @IsString() @IsOptional()]
    widthMm: number [@ApiProperty({ example: 210 }) @IsNumber() @IsNotEmpty()]
    heightMm: number [@ApiProperty({ example: 297 }) @IsNumber() @IsNotEmpty()]
    bleedMm?: number [@ApiProperty({ example: 3) @IsNumber() @IsOptional()]
    printMarginMm?: number [@ApiProperty({ example: 5) @IsNumber() @IsOptional()]
    resolution?: number [@ApiProperty({ example: 300) @IsNumber() @IsOptional()]
    isActive?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
##### src/modules/marketing-assets/dto/create-template-style.dto.ts
  CLASS CreateTemplateStyleDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    slug?: string [@ApiProperty() @IsString() @IsOptional()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    bgColor: string [@ApiProperty() @IsString() @IsNotEmpty()]
    accentColor: string [@ApiProperty() @IsString() @IsNotEmpty()]
    borderColor: string [@ApiProperty() @IsString() @IsNotEmpty()]
    qrFgColor: string [@ApiProperty() @IsString() @IsNotEmpty()]
    qrBgColor: string [@ApiProperty() @IsString() @IsNotEmpty()]
    textColor: string [@ApiProperty() @IsString() @IsNotEmpty()]
    fontConfig?: Record<string, any> [@ApiProperty({ example: { fontFamily: 'Inter', headingSize: 32 }) @IsObject() @IsOptional()]
    layoutConfig?: Record<string, any> [@ApiProperty({ example: { padding: 16 }) @IsObject() @IsOptional()]
    ctaConfig?: Record<string, any> [@ApiProperty({ example: { borderRadius: 8 }) @IsObject() @IsOptional()]
    qrConfig?: Record<string, any> [@ApiProperty({ example: { cornerStyle: 'rounded' }) @IsObject() @IsOptional()]
    isActive?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
##### src/modules/marketing-assets/dto/create-template.dto.ts
  CLASS CreateMarketingTemplateDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    category: string [@ApiProperty() @IsString() @IsNotEmpty()]
    categoryIds?: string[] [@ApiProperty({ example: ['uuid']) @IsArray() @IsOptional() @IsString({ each: true })]
    type: string [@ApiProperty() @IsString() @IsNotEmpty()]
    layoutConfig: any [@ApiProperty() @IsObject() @IsNotEmpty()]
    isActive?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
    thumbnailUrl?: string [@ApiProperty() @IsString() @IsOptional()]
    qrCodeConfig?: any [@ApiProperty() @IsObject() @IsOptional()]
##### src/modules/marketing-assets/dto/download.dto.ts
  ENUM DownloadFormat: PDF='pdf', PNG='png', SVG='svg', JPEG='jpeg'
  CLASS RecordDownloadDto
    format: DownloadFormat [@ApiProperty({ example: DownloadFormat.PDF, enum: DownloadFormat) @IsEnum(DownloadFormat) @IsNotEmpty()]
  CLASS FindDownloadsQueryDto
    assetId?: string [@ApiPropertyOptional() @IsOptional() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), ) @IsUUID('4', { message: 'assetId must be a valid UUID v4' })]
##### src/modules/marketing-assets/dto/find-assets-query.dto.ts
  CLASS FindMarketingAssetsQueryDto
    type?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
##### src/modules/marketing-assets/dto/generate-ai-content.dto.ts
  CLASS GenerateAIContentDto
    promptId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    businessType?: string [@ApiProperty() @IsString() @IsOptional()]
    businessName?: string [@ApiProperty() @IsString() @IsOptional()]
    subject?: string [@ApiProperty() @IsString() @IsOptional()]
    tone?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/marketing-assets/dto/save-brand-rule.dto.ts
  CLASS SaveBrandRuleDto
    logoRequired?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
    primaryColorRequired?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
    secondaryColorRequired?: boolean [@ApiProperty({ example: false) @IsBoolean() @IsOptional()]
    fontFamilyRequired?: boolean [@ApiProperty({ example: false) @IsBoolean() @IsOptional()]
    website?: string [@ApiProperty() @IsString() @IsOptional()]
    phone?: string [@ApiProperty() @IsString() @IsOptional()]
    email?: string [@ApiProperty() @IsString() @IsOptional()]
    socialLinks?: any [@ApiProperty() @IsObject() @IsOptional()]
##### src/modules/marketing-assets/dto/save-setting.dto.ts
  CLASS SaveSettingDto
    key: string [@ApiProperty() @IsString() @IsNotEmpty()]
    value: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type?: string [@ApiProperty() @IsString() @IsOptional()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/messaging/dto/adjust-credits.dto.ts
  CLASS AdjustCreditsDto
    businessId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    channel: Channel [@ApiProperty({ enum: Channel, example: Channel.SMS }) @IsEnum(Channel)]
    amount: number [@ApiProperty({ example: 100 }) @IsNumber() @Min(1)]
    action: 'add' | 'remove' [@ApiProperty({ enum: ['add', 'remove']) @IsEnum(['add', 'remove'])]
##### src/modules/messaging/dto/automation-rule.dto.ts
  CLASS CreateAutomationRuleDto
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    name: string [@ApiProperty() @IsNotEmpty() @IsString()]
    triggerType: TriggerType [@ApiProperty({ enum: TriggerType, example: TriggerType.FIRST_MESSAGE }) @IsEnum(TriggerType)]
    targetType?: TargetType [@ApiPropertyOptional({ enum: TargetType, example: TargetType.NEW_VISITORS }) @IsOptional() @IsEnum(TargetType)]
    delaySeconds?: number [@ApiPropertyOptional({ example: 3600) @IsOptional() @IsNumber()]
    actionType: ActionType [@ApiProperty({ enum: ActionType, example: ActionType.SEND_WHATSAPP }) @IsEnum(ActionType)]
    actionConfig?: Record<string, any> [@ApiPropertyOptional({ example: { content: 'Hi {{visitor_name}}!', loyaltyPoints: 10 }) @IsOptional() @IsObject()]
    isActive?: boolean [@ApiPropertyOptional({ example: true }) @IsOptional() @IsBoolean()]
  CLASS UpdateAutomationRuleDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    triggerType?: TriggerType [@ApiPropertyOptional({ enum: TriggerType, example: TriggerType.FIRST_MESSAGE) @IsOptional() @IsEnum(TriggerType)]
    targetType?: TargetType [@ApiPropertyOptional({ enum: TargetType, example: TargetType.NEW_VISITORS }) @IsOptional() @IsEnum(TargetType)]
    delaySeconds?: number [@ApiPropertyOptional({ example: 7200 }) @IsOptional() @IsNumber()]
    actionType?: ActionType [@ApiPropertyOptional({ enum: ActionType, example: ActionType.SEND_WHATSAPP }) @IsOptional() @IsEnum(ActionType)]
    actionConfig?: Record<string, any> [@ApiPropertyOptional({ example: { content: 'New message content' } }) @IsOptional() @IsObject()]
    isActive?: boolean [@ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean()]
  CLASS UpdateAutomationToggleDto
    isActive: boolean [@ApiProperty({ example: true }) @IsNotEmpty() @IsBoolean()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
  CLASS UpdateAutomationConfigDto
    content?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    loyaltyPoints?: number [@ApiPropertyOptional({ example: 20 }) @IsOptional() @IsNumber()]
    delayDays?: number [@ApiPropertyOptional({ example: 1) @IsOptional() @IsNumber()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    segmentId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
##### src/modules/messaging/dto/business-id.dto.ts
  CLASS BusinessIdDto
    businessId: string [@ApiProperty() @IsUUID('4', { message: 'The business ID must be a valid UUID v4' }) @IsNotEmpty()]
##### src/modules/messaging/dto/chat-automation.dto.ts
  CLASS UpdateChatAutomationDto
    welcomeEnabled?: boolean [@ApiProperty() @IsBoolean() @IsOptional()]
    welcomeMessage?: string [@ApiProperty() @IsString() @IsOptional()]
    offHoursEnabled?: boolean [@ApiProperty() @IsBoolean() @IsOptional()]
    offHoursMessage?: string [@ApiProperty() @IsString() @IsOptional()]
    offHoursSchedule?: string; // 'Outside Business Hours' | 'Always On (Away Mode)' | 'Custom Schedule' [@ApiProperty() @IsString() @IsOptional()]
    customSchedule?: CustomScheduleDto [@ApiProperty({ type: CustomScheduleDto }) @IsObject() @IsOptional() @ValidateNested() @Type(() => CustomScheduleDto)]
    branchId?: string [@IsUUID() @IsOptional()]
  CLASS AddFaqKeywordDto
    keywords: string[] [@ApiProperty() @IsArray() @IsString({ each: true }) @MinLength(1, { each: true })]
    response: string [@ApiProperty() @IsString() @MinLength(1, { message: 'Response message cannot be empty' })]
    branchId?: string [@IsUUID() @IsOptional()]
  CLASS UpdateFaqKeywordDto
    keywords?: string[] [@ApiProperty() @IsArray() @IsString({ each: true }) @IsOptional()]
    response?: string [@ApiProperty() @IsString() @IsOptional() @MinLength(1, { message: 'Response message cannot be empty' })]
    enabled?: boolean [@ApiProperty() @IsBoolean() @IsOptional()]
##### src/modules/messaging/dto/chat-category.dto.ts
  CLASS CreateChatCategoryDto
    name: string [@ApiProperty() @IsString() @MinLength(1, { message: 'Category name is required' })]
    routeTo?: string [@ApiProperty() @IsString() @IsOptional()]
    urgency?: 'Low' | 'Medium' | 'High' [@ApiProperty({ enum: ['Low', 'Medium', 'High'], default: 'Medium' }) @IsEnum(['Low', 'Medium', 'High']) @IsOptional()]
    icon?: string [@ApiProperty() @IsString() @IsOptional()]
    branchId?: string [@IsUUID() @IsOptional()]
  CLASS UpdateChatCategoryDto
    name?: string [@ApiProperty() @IsString() @IsOptional() @MinLength(1, { message: 'Category name cannot be empty' })]
    routeTo?: string [@ApiProperty() @IsString() @IsOptional()]
    urgency?: 'Low' | 'Medium' | 'High' [@ApiProperty({ enum: ['Low', 'Medium', 'High']) @IsEnum(['Low', 'Medium', 'High']) @IsOptional()]
    icon?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/messaging/dto/create-credit-plan.dto.ts
  CLASS CreateCreditPlanDto
    name: string [@ApiProperty() @IsString()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    price: number [@ApiProperty({ example: 5000 }) @IsNumber() @Min(0)]
    currency?: string [@ApiProperty({ default: 'NGN') @IsString() @IsOptional()]
    smsAmount: number [@ApiProperty({ example: 500 }) @IsNumber() @Min(0)]
    emailAmount: number [@ApiProperty({ example: 1000 }) @IsNumber() @Min(0)]
    whatsappAmount: number [@ApiProperty({ example: 200 }) @IsNumber() @Min(0)]
    aiAmount?: number [@ApiProperty({ example: 50 }) @IsNumber() @IsOptional() @Min(0)]
    isActive?: boolean [@ApiProperty({ default: true, example: true }) @IsBoolean() @IsOptional()]
##### src/modules/messaging/dto/create-flow.dto.ts
  CLASS CreateFlowDto
    name: string [@ApiProperty() @IsString()]
    triggerType: FlowTriggerType [@ApiProperty({ enum: FlowTriggerType, example: FlowTriggerType.NEW_VISITOR) @IsEnum(FlowTriggerType)]
    branchId?: string [@ApiProperty() @IsUUID() @IsOptional()]
    businessId?: string [@ApiProperty() @IsUUID() @IsOptional()]
    structure: FlowStructure [@ApiProperty({ example: { nodes: [], edges: [] }, required: true) @IsDefined() @IsObject() @ValidateNested() @Type(() => FlowStructure)]
  CLASS UpdateFlowStatusDto
    status: FlowStatus [@ApiProperty({ enum: FlowStatus, example: FlowStatus.ACTIVE) @IsEnum(FlowStatus)]
  CLASS GetFlowsDto
    branchId?: string [@ApiProperty() @IsUUID() @IsOptional()]
    businessId?: string [@ApiProperty() @IsUUID() @IsOptional()]
##### src/modules/messaging/dto/flow-engine.dto.ts
  CLASS CreateFlowTemplateDto
    name: string [@ApiProperty() @IsString()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    triggerType: string [@ApiProperty() @IsString()]
    version?: string [@ApiProperty() @IsString() @IsOptional()]
    status?: string [@ApiProperty({ enum: ['active', 'inactive']) @IsString() @IsOptional()]
    structure: FlowStructure [@ApiProperty({ example: { nodes: [], edges: [] }) @IsObject()]
  CLASS UpdateFlowTemplateDto
    name?: string [@ApiProperty() @IsString() @IsOptional()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    triggerType?: string [@ApiProperty() @IsString() @IsOptional()]
    version?: string [@ApiProperty() @IsString() @IsOptional()]
    status?: string [@ApiProperty({ enum: ['active', 'inactive'] }) @IsString() @IsOptional()]
    structure?: FlowStructure [@ApiProperty() @IsObject() @IsOptional()]
  CLASS UpdateFlowTriggerConfigDto
    label?: string [@ApiProperty() @IsString() @IsOptional()]
    enabled?: boolean [@ApiProperty() @IsBoolean() @IsOptional()]
    inactivityDays?: number [@ApiProperty() @IsNumber() @IsOptional()]
##### src/modules/messaging/dto/flow-filter.dto.ts
  CLASS FlowFilterDto
    businessId?: string [@ApiProperty() @IsOptional() @IsUUID()]
    branchId?: string [@ApiProperty() @IsOptional() @IsUUID()]
    from?: string [@ApiProperty() @IsOptional() @IsDateString()]
    to?: string [@ApiProperty() @IsOptional() @IsDateString()]
    limit?: number [@ApiProperty() @IsOptional() @IsNumber()]
##### src/modules/messaging/dto/id.dto.ts
  CLASS IdDto
    id: string [@ApiProperty() @IsUUID('4', { message: 'The ID must be a valid UUID v4' }) @IsNotEmpty()]
##### src/modules/messaging/dto/messaging-analytics-filter.dto.ts
  CLASS MessagingAnalyticsFilterDto
    channel?: Channel [@ApiPropertyOptional({ enum: Channel, example: Channel.SMS) @IsOptional() @IsEnum(Channel)]
##### src/modules/messaging/dto/purchase-credit-plan.dto.ts
  CLASS PurchaseCreditPlanDto
    reference: string [@ApiProperty() @IsString() @IsNotEmpty()]
    branchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
##### src/modules/messaging/dto/purchase-custom-credits.dto.ts
  CLASS PurchaseCustomCreditsDto
    reference: string [@ApiProperty() @IsString() @IsNotEmpty()]
    branchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    smsAmount: number [@ApiProperty({ example: 100) @IsNumber() @Min(0)]
    whatsappAmount: number [@ApiProperty({ example: 50) @IsNumber() @Min(0)]
    emailAmount: number [@ApiProperty({ example: 200) @IsNumber() @Min(0)]
    aiAmount?: number [@ApiProperty({ example: 50) @IsNumber() @IsOptional() @Min(0)]
##### src/modules/messaging/dto/reply.dto.ts
  CLASS ReplyDto
    content: string [@ApiProperty() @ValidateIf((dto: ReplyDto) => !dto.mediaUrl) @IsString() @IsNotEmpty()]
    replyToId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    metadata?: any [@ApiPropertyOptional({ example: { rewardId: 'uuid' } }) @IsOptional() @IsObject()]
    mediaUrl?: string [@ApiPropertyOptional({ + 'in which case `content` may be an empty string.') @IsOptional() @IsString()]
    mediaMimeType?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/messaging/dto/send-message.dto.ts
  CLASS SendMessageDto
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    channel: Channel [@ApiProperty({ enum: Channel }) @IsEnum(Channel)]
    audienceType?: AudienceType [@ApiPropertyOptional({ enum: AudienceType }) @IsOptional() @IsEnum(AudienceType)]
    templateId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    segmentId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    content?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    from?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    customerIds?: string[] [@ApiPropertyOptional({ type: [String]) @IsOptional() @IsArray() @IsUUID('all', { each: true })]
    metadata?: any [@ApiPropertyOptional() @IsOptional()]
##### src/modules/messaging/dto/session-id.dto.ts
  CLASS SessionIdDto
    sessionId: string [@ApiProperty() @IsUUID('4', { message: 'The session ID must be a valid UUID v4' }) @IsNotEmpty()]
##### src/modules/messaging/dto/start-conversation.dto.ts
  CLASS StartConversationDto
    branchId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
    content: string [@ApiProperty() @IsString() @IsNotEmpty()]
    subjectType?: ThreadSubjectType [@ApiPropertyOptional({ enum: ThreadSubjectType) @IsOptional() @IsEnum(ThreadSubjectType)]
    claimId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    orderId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
##### src/modules/messaging/dto/template/create-template.dto.ts
  CLASS CreateMessagingTemplateDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    channel: Channel [@ApiProperty({ enum: Channel, example: Channel.SMS }) @IsEnum(Channel)]
    content: string [@ApiProperty() @IsString() @IsNotEmpty()]
    category?: TemplateCategory [@ApiProperty({ enum: TemplateCategory, example: TemplateCategory.MARKETING }) @IsEnum(TemplateCategory) @IsOptional()]
    language?: string [@ApiProperty() @IsString() @IsOptional()]
    isSystem?: boolean [@ApiProperty({ example: false) @IsBoolean() @IsOptional()]
    branchId?: string [@ApiProperty() @IsUUID() @IsOptional()]
##### src/modules/messaging/dto/template/update-template-status.dto.ts
  CLASS UpdateTemplateStatusDto
    status: TemplateStatus [@ApiProperty({ enum: TemplateStatus, example: TemplateStatus.APPROVED) @IsEnum(TemplateStatus)]
##### src/modules/messaging/dto/thread-filter.dto.ts
  CLASS MessagingThreadFilterDto
    segmentId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
##### src/modules/messaging/dto/thread-id.dto.ts
  CLASS ThreadIdDto
    threadId: string [@ApiProperty() @IsUUID('4', { message: 'The thread ID must be a valid UUID v4' }) @IsNotEmpty()]
##### src/modules/messaging/dto/update-channel-settings.dto.ts
  CLASS UpdateChannelSettingsDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    smsSenderId?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(11)]
    smsRouting?: SmsRoutingMode [@ApiPropertyOptional({ enum: SmsRoutingMode, example: SmsRoutingMode.AFRICA_OPTIMIZED) @IsOptional() @IsEnum(SmsRoutingMode)]
    whatsappPhoneNumberId?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)]
    whatsappWabaAccountId?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)]
    whatsappSystemUserToken?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)]
    whatsappRequireDoubleOptIn?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    whatsappEnableStopAutoReply?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    emailFromName?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)]
    emailFromEmail?: string [@ApiPropertyOptional() @IsOptional() @IsEmail() @MaxLength(255)]
    emailCustomDomain?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)]
    generateDnsRecords?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    emailDomainStatus?: EmailDomainStatus [@ApiPropertyOptional({ enum: EmailDomainStatus) @IsOptional() @IsEnum(EmailDomainStatus)]
##### src/modules/messaging/dto/update-message.dto.ts
  CLASS UpdateMessageDto
    content: string [@ApiProperty() @IsString() @IsNotEmpty() @MaxLength(5000)]
##### src/modules/notifications/dto/admin-broadcast.dto.ts
  CLASS AdminBroadcastDto
    title: string [@ApiProperty({ maxLength: 255) @IsString() @IsNotEmpty() @MaxLength(255)]
    message: string [@ApiProperty() @IsString() @IsNotEmpty()]
    targetAudience: TargetAudience [@ApiProperty({ enum: TargetAudience, example: TargetAudience.ALL) @IsEnum(TargetAudience) @IsNotEmpty()]
    type?: string [@ApiPropertyOptional({ default: 'announcement') @IsString() @IsOptional()]
    actionUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    sendPush?: boolean [@ApiPropertyOptional({ example: true, default: true) @IsBoolean() @IsOptional()]
    sendInApp?: boolean [@ApiPropertyOptional({ example: true, default: true) @IsBoolean() @IsOptional()]
  CLASS BroadcastQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 20 [@ApiPropertyOptional({ example: 20, default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
    targetAudience?: TargetAudience [@ApiPropertyOptional({ enum: TargetAudience) @IsOptional() @IsEnum(TargetAudience)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/notifications/dto/list-notifications.dto.ts
  CLASS ListNotificationsDto
    page?: number [@ApiPropertyOptional({ minimum: 1, default: 1) @IsOptional() @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50) @IsOptional() @IsInt() @Min(1) @Max(200)]
    before?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/notifications/dto/register-push-token.dto.ts
  CLASS RegisterPushTokenDto
    token: string [@ApiProperty() @IsString() @IsNotEmpty() @MinLength(8)]
    transport?: PushTransport [@ApiPropertyOptional({ enum: [PushTransport.EXPO, PushTransport.WEB], default: PushTransport.EXPO) @IsOptional() @IsIn([PushTransport.EXPO, PushTransport.WEB])]
    platform?: string [@ApiPropertyOptional({ enum: ['ios', 'android', 'web']) @IsOptional() @IsString()]
##### src/modules/notifications/dto/update-notification-preferences.dto.ts
  CLASS UpdateNotificationPreferencesDto
    push?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    email?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    sms?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    marketing?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    orderUpdates?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    loyalty?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    support?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    rewardAlerts?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    activityDigest?: boolean [@ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean()]
    smsSecurity?: boolean [@ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean()]
##### src/modules/partnerships/dto/invite-partnership.dto.ts
  CLASS InvitePartnershipDto
    initiatorBranchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    recipientBranchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
##### src/modules/partnerships/dto/nearby-partners-query.dto.ts
  CLASS NearbyPartnersQueryDto
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    distance?: number = 10000 [@ApiPropertyOptional({ default: 10000, example: 10000) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 20 [@ApiPropertyOptional({ default: 20, example: 20) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/partnerships/dto/partnership-query.dto.ts
  ENUM InvitationQueryType: SENT='sent', RECEIVED='received', ALL='all'
  CLASS PartnershipQueryDto
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    type?: InvitationQueryType = InvitationQueryType.ALL [@ApiPropertyOptional({ enum: InvitationQueryType, default: InvitationQueryType.ALL) @IsOptional() @IsEnum(InvitationQueryType)]
    status?: PartnershipStatus [@ApiPropertyOptional({ enum: PartnershipStatus) @IsOptional() @IsEnum(PartnershipStatus)]
    page?: number = 1 [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/partnerships/dto/respond-partnership.dto.ts
  CLASS RespondPartnershipDto
    status: PartnershipStatus.ACCEPTED | PartnershipStatus.DECLINED [@ApiProperty({ enum: [PartnershipStatus.ACCEPTED, PartnershipStatus.DECLINED], example: PartnershipStatus.ACCEPTED) @IsNotEmpty() @IsEnum([PartnershipStatus.ACCEPTED, PartnershipStatus.DECLINED], { message: 'Status must be Accepted or Declined')]
##### src/modules/pos/dto/cash-drop.dto.ts
  CLASS CashDropDto
    amount: number [@ApiProperty({ minimum: 0.01 }) @IsNumber() @Min(0.01)]
    reason: string [@ApiProperty() @IsString()]
##### src/modules/pos/dto/create-pos-order.dto.ts
  CLASS CreatePosOrderDto
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    items: PosOrderItemDto[] [@ApiProperty({ type: [PosOrderItemDto], example: [{ itemId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 }]) @IsArray() @ValidateNested({ each: true }) @Type(() => PosOrderItemDto)]
    customerId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    email?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    tableNumber?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/pos/dto/create-pos-sale.dto.ts
  CLASS CreatePosSaleDto
    items: PosSaleItemDto[] [@ApiProperty({ type: [PosSaleItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => PosSaleItemDto)]
    payment: PaymentDetailsDto [@ApiProperty({ type: PaymentDetailsDto }) @IsNotEmpty() @IsObject() @ValidateNested() @Type(() => PaymentDetailsDto)]
    cartDiscountAmount?: number [@ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber() @Min(0)]
    customerId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    hideCustomerInfoOnReceipt?: boolean [@ApiPropertyOptional({ example: false }) @IsOptional() @IsBoolean()]
    notes?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    clientRef?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    orderedAt?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
##### src/modules/pos/dto/hold-pos-sale.dto.ts
  CLASS HoldPosSaleDto
    items: HoldSaleItemDto[] [@ApiProperty({ type: [HoldSaleItemDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => HoldSaleItemDto)]
    branchId: string [@ApiProperty() @IsNotEmpty() @IsUUID()]
    customerId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    note?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    subtotal?: number [@ApiPropertyOptional({ example: 15000 }) @IsOptional() @IsNumber()]
    discountAmount?: number [@ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber()]
    tax?: number [@ApiPropertyOptional({ example: 0 }) @IsOptional() @IsNumber()]
    total?: number [@ApiPropertyOptional({ example: 15000 }) @IsOptional() @IsNumber()]
##### src/modules/pos/dto/pos-customer-query.dto.ts
  CLASS PosCustomerQueryDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/pos/dto/pos-sale-query.dto.ts
  CLASS PosSaleQueryDto
    status?: SaleStatus [@ApiPropertyOptional({ enum: SaleStatus }) @IsOptional() @IsEnum(SaleStatus)]
    paymentMethod?: PaymentMethod [@ApiPropertyOptional({ enum: PaymentMethod }) @IsOptional() @IsEnum(PaymentMethod)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    cashierId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    dateFrom?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    dateTo?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/pos/dto/process-pos-order-payment.dto.ts
  CLASS ProcessPosOrderPaymentDto
    paymentMethod: PaymentMethod [@ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH) @IsNotEmpty() @IsEnum(PaymentMethod)]
    amountPaid: number [@ApiProperty({ example: 20000) @IsNotEmpty() @IsNumber() @Min(0)]
    change?: number [@ApiPropertyOptional({ example: 5000) @IsOptional() @IsNumber() @Min(0)]
    splitDetails?: SplitPaymentDto[] [@ApiPropertyOptional({ type: [SplitPaymentDto], example: [ { method: PaymentMethod.CASH, amount: 10000 }, { method: PaymentMethod.TRANSFER, amount: 10000 }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SplitPaymentDto)]
    hideCustomerInfoOnReceipt?: boolean [@ApiPropertyOptional({ example: false) @IsOptional() @IsBoolean()]
##### src/modules/pos/dto/register.dto.ts
  CLASS OpenRegisterDto
    openingCash: number [@ApiProperty({ example: 50000 }) @IsNotEmpty() @IsNumber() @Min(0)]
  CLASS CloseRegisterDto
    countedCash?: number [@ApiPropertyOptional({ example: 342850) @IsOptional() @IsNumber() @Min(0) @Type(() => Number)]
  CLASS RegisterHistoryQueryDto
    dateFrom?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    dateTo?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/pos/dto/update-pos-sale-status.dto.ts
  CLASS UpdatePosSaleStatusDto
    status: SaleStatus [@ApiProperty({ enum: SaleStatus, example: SaleStatus.REFUNDED }) @IsNotEmpty() @IsEnum(SaleStatus)]
    reason?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    refundItems?: RefundItemDto[] [@ApiPropertyOptional({ type: [RefundItemDto]) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RefundItemDto)]
##### src/modules/products/dto/create-order.dto.ts
  CLASS CreateOrderDto
    productId: string [@ApiProperty() @IsString() @IsNotEmpty()]
    quantity: number [@ApiProperty({ example: 50 }) @IsNumber() @Min(1)]
    paymentReference?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/products/dto/create-product-type.dto.ts
  CLASS CreateProductTypeDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiProperty() @IsString() @IsOptional()]
    slug: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/products/dto/create-product.dto.ts
  CLASS CreateProductDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    sku?: string [@ApiProperty() @IsString() @IsOptional()]
    description: string [@ApiProperty() @IsString() @IsNotEmpty()]
    price: number [@ApiProperty({ example: 1000 }) @IsNumber() @Min(0)]
    originalPrice?: number [@ApiProperty({ example: 1200) @IsNumber() @Min(0) @IsOptional()]
    costPrice?: number [@ApiProperty({ example: 500) @IsNumber() @Min(0) @IsOptional()]
    customizationFee?: number [@ApiProperty({ example: 50) @IsNumber() @Min(0) @IsOptional()]
    nfcType?: string [@ApiProperty() @IsString() @IsOptional()]
    images: string[] [@ApiProperty({ example: ['https://example.com/image.png'], type: [String] }) @IsArray() @IsString({ each: true }) @IsNotEmpty()]
    videos?: string[] [@ApiProperty({ example: ['https://example.com/video.mp4'], type: [String]) @IsArray() @IsString({ each: true }) @IsOptional()]
    technicalSpecifications?: Record<string, string> [@ApiProperty({ example: { weight: '20g', material: 'Plastic' }) @IsObject() @IsOptional()]
    customBrandedCards?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
    tag: string [@ApiProperty() @IsString() @IsNotEmpty()]
    tagColor?: string [@ApiProperty() @IsString() @IsOptional()]
    howToUse?: HowToUseDto[] [@ApiProperty({ type: [HowToUseDto], example: [{ title: 'Step 1']) @IsArray() @IsOptional() @ValidateNested({ each: true }) @Type(() => HowToUseDto)]
    rating?: number [@ApiProperty({ example: 4.5) @IsNumber() @IsOptional() @Min(0)]
    moq?: number [@ApiProperty({ example: 50) @IsNumber() @IsOptional() @Min(1)]
    priceTiers?: { min: number; max: number | null; price: number }[] [@ApiProperty() @IsOptional()]
    requestQuoteThreshold?: number [@ApiProperty({ example: 300) @IsNumber() @IsOptional() @Min(0)]
    status?: ProductStatus [@ApiProperty({ enum: ProductStatus, default: ProductStatus.PUBLISHED) @IsEnum(ProductStatus) @IsOptional()]
    productTypeId?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/products/dto/negotiate-quote.dto.ts
  CLASS NegotiateQuoteDto
    priceOffered: number [@ApiProperty({ example: 900 }) @IsNumber() @Min(0)]
    message?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    isNegotiable?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
##### src/modules/products/dto/product-query.dto.ts
  ENUM ProductSortOrder: ASC='ASC', DESC='DESC'
  CLASS AdminProductQueryDto
    status?: ProductStatus [@ApiPropertyOptional({ enum: ProductStatus }) @IsOptional() @IsEnum(ProductStatus)]
##### src/modules/products/dto/product-review.dto.ts
  CLASS CreateProductReviewDto
    rating: number [@ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5)]
    comment: string [@ApiProperty() @IsString() @IsNotEmpty()]
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS UpdateProductReviewStatusDto
    status: ProductReviewStatus [@ApiProperty({ enum: ProductReviewStatus }) @IsEnum(ProductReviewStatus)]
  CLASS ProductReviewsAdminQueryDto
    status?: ProductReviewStatus [@ApiPropertyOptional({ enum: ProductReviewStatus }) @IsOptional() @IsEnum(ProductReviewStatus)]
    page?: number [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/products/dto/request-quote.dto.ts
  CLASS RequestQuoteDto
    quantity: number [@ApiProperty({ example: 100 }) @IsNumber() @Min(1)]
    location: string [@ApiProperty() @IsString() @IsNotEmpty()]
    businessName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    notes: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/promotions/dto/promotion.dto.ts
  CLASS SaveCampaignDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)]
    objective?: string [@ApiPropertyOptional({ enum: ids(PROMOTION_OBJECTIVES)) @IsOptional() @IsIn(ids(PROMOTION_OBJECTIVES))]
    goalId?: string [@ApiPropertyOptional({ enum: ids(BOOST_GOALS)) @IsOptional() @IsIn(ids(BOOST_GOALS))]
    assets?: CampaignAssetDto[] [@ApiPropertyOptional({ type: [CampaignAssetDto]) @IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => CampaignAssetDto)]
    audience?: CampaignAudienceDto [@ApiPropertyOptional({ type: CampaignAudienceDto }) @IsOptional() @ValidateNested() @Type(() => CampaignAudienceDto)]
    placements?: string[] [@ApiPropertyOptional({ enum: ids(PLACEMENTS), isArray: true }) @IsOptional() @IsArray() @IsIn(ids(PLACEMENTS), { each: true })]
    schedule?: CampaignScheduleDto [@ApiPropertyOptional({ type: CampaignScheduleDto }) @IsOptional() @ValidateNested() @Type(() => CampaignScheduleDto)]
    budgetMode?: 'total' | 'daily' [@ApiPropertyOptional({ enum: ['total', 'daily'], default: 'total' }) @IsOptional() @IsIn(['total', 'daily'])]
    budget?: number [@ApiPropertyOptional({ example: 20000) @IsOptional() @IsNumber() @Min(0)]
    dailyBudget?: number [@ApiPropertyOptional({ example: 4000) @IsOptional() @IsNumber() @Min(0)]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
  CLASS LaunchCampaignDto
    fundingSource?: 'wallet' | 'card' [@ApiPropertyOptional({ enum: ['wallet', 'card'], default: 'wallet') @IsOptional() @IsIn(['wallet', 'card'])]
    callbackUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString() @IsUrl({ require_tld: false, require_protocol: true })]
    useSavedCard?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
    saveCard?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
  CLASS ListCampaignsQueryDto
    status?: SponsoredCampaignStatus [@ApiPropertyOptional({ enum: SponsoredCampaignStatus }) @IsOptional() @IsEnum(SponsoredCampaignStatus)]
    page?: number [@ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number [@ApiPropertyOptional({ default: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)]
  CLASS ForecastDto
    budget?: number [@ApiPropertyOptional({ example: 20000) @IsOptional() @IsNumber() @Min(0)]
    dailyBudget?: number [@ApiPropertyOptional({ example: 4000) @IsOptional() @IsNumber() @Min(0)]
    durationDays?: number [@ApiPropertyOptional({ example: 7, default: 7 }) @IsOptional() @IsInt() @Min(1) @Max(90)]
    radiusKm?: number [@ApiPropertyOptional({ example: 3, default: 3 }) @IsOptional() @IsNumber() @Min(0.5) @Max(50)]
##### src/modules/promotions/dto/sponsored.dto.ts
  CLASS SponsoredQueryDto
    placement: 'home' | 'feed' [@ApiProperty({ enum: ['home', 'feed']) @IsIn(['home', 'feed'])]
    lat?: number [@ApiPropertyOptional({ example: 9.0765 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90)]
    lng?: number [@ApiPropertyOptional({ example: 7.3986 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)]
    limit?: number [@ApiPropertyOptional({ default: 3 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10)]
  CLASS RecordSponsoredEventsDto
    viewerKey: string [@ApiProperty() @Matches(/^[A-Za-z0-9_-]{8,64}$/)]
    events: SponsoredEventDto[] [@ApiProperty({ type: [SponsoredEventDto] }) @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => SponsoredEventDto)]
##### src/modules/public-discovery/dto/public-discovery.dto.ts
  ENUM PublicBusinessSortBy: NEWEST='newest', NAME_ASC='name_asc'
  CLASS PublicBusinessesQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)]
    categoryId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    sortBy?: PublicBusinessSortBy = PublicBusinessSortBy.NEWEST [@ApiPropertyOptional({ enum: PublicBusinessSortBy, default: PublicBusinessSortBy.NEWEST) @IsOptional() @IsEnum(PublicBusinessSortBy)]
    lat?: number [@ApiPropertyOptional({ example: 9.0718) @IsOptional() @Type(() => Number) @IsNumber()]
    lng?: number [@ApiPropertyOptional({ example: 7.4843) @IsOptional() @Type(() => Number) @IsNumber()]
    radius?: number [@ApiPropertyOptional({ example: 5, minimum: 0) @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
    limit?: number = 8 [@ApiPropertyOptional({ default: 8 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
  CLASS PublicSearchQueryDto
    q?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)]
    limit?: number = 8 [@ApiPropertyOptional({ default: 8) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20)]
    lat?: number [@ApiPropertyOptional({ example: 9.0133) @IsOptional() @Type(() => Number) @IsNumber()]
    lng?: number [@ApiPropertyOptional({ example: 7.4911) @IsOptional() @Type(() => Number) @IsNumber()]
    radius?: number [@ApiPropertyOptional({ example: 5, minimum: 0) @IsOptional() @Type(() => Number) @IsNumber() @Min(0)]
##### src/modules/qr-thrive/dto/qr-thrive.dto.ts
  CLASS UpdateLeadStatusDto
    status: ExternalLeadStatus [@ApiProperty({ enum: ExternalLeadStatus, example: ExternalLeadStatus.PROCESSING) @IsEnum(ExternalLeadStatus) @IsNotEmpty()]
    notes?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS CreateQRCodeDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    folderId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type: QRType [@ApiProperty({ enum: QRType, example: QRType.url }) @IsEnum(QRType) @IsNotEmpty()]
    isDynamic?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    data: any [@ApiProperty({ example: { url: 'https://example.com' } }) @IsObject() @IsNotEmpty()]
    design?: any [@ApiPropertyOptional({ example: }) @IsObject() @IsOptional()]
    frame?: any [@ApiPropertyOptional({ example: }) @IsObject() @IsOptional()]
    logo?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS UpdateQRCodeDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    folderId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type?: QRType [@ApiPropertyOptional({ enum: QRType, example: QRType.url }) @IsEnum(QRType) @IsOptional()]
    data?: any [@ApiPropertyOptional({ example: { url: 'https://new-example.com' } }) @IsObject() @IsOptional()]
    design?: any [@ApiPropertyOptional({ example: }) @IsObject() @IsOptional()]
    frame?: any [@ApiPropertyOptional({ example: }) @IsObject() @IsOptional()]
    logo?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    status?: 'active' | 'archived' [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS CreateFolderDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    color?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS UpdateFolderDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    color?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS SpecializedLeadsQueryDto
    types?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    qrCodeId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    search?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    page?: number [@ApiPropertyOptional({ example: 1) @IsOptional()]
    limit?: number [@ApiPropertyOptional({ example: 10) @IsOptional()]
##### src/modules/rotator/dto/rotator.dto.ts
  CLASS UpdateRotatorGlobalConfigDto
    rotationMode?: RotatorMode [@ApiPropertyOptional({ enum: RotatorMode, example: RotatorMode.AUTOMATIC }) @IsOptional() @IsEnum(RotatorMode)]
    distribution?: RotatorDistribution [@ApiPropertyOptional({ enum: RotatorDistribution, example: RotatorDistribution.BALANCED) @IsOptional() @IsEnum(RotatorDistribution)]
    featuredSlotsMode?: FeaturedSlotsMode [@ApiPropertyOptional({ enum: FeaturedSlotsMode, example: FeaturedSlotsMode.AUTOMATIC) @IsOptional() @IsEnum(FeaturedSlotsMode)]
    featuredSlotCount?: number [@ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)]
    windowSeconds?: number [@ApiPropertyOptional({ example: 60) @IsOptional() @Type(() => Number) @IsInt() @Min(10) @Max(3600)]
    frequencyWindowHours?: number [@ApiPropertyOptional({ example: 24 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
  CLASS UpdateRotatorClusterConfigDto
    rotationMode?: RotatorMode [@ApiPropertyOptional({ enum: RotatorMode }) @IsOptional() @IsEnum(RotatorMode)]
    distribution?: RotatorDistribution [@ApiPropertyOptional({ enum: RotatorDistribution }) @IsOptional() @IsEnum(RotatorDistribution)]
    featuredSlotsMode?: FeaturedSlotsMode [@ApiPropertyOptional({ enum: FeaturedSlotsMode }) @IsOptional() @IsEnum(FeaturedSlotsMode)]
    featuredSlotCount?: number [@ApiPropertyOptional({ example: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12)]
    reset?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean()]
  CLASS SetClusterOfferIncludedDto
    included: boolean [@ApiProperty({ example: true) @IsBoolean()]
  CLASS SetClusterOfferDeliveryDto
    deliveryOverride: DeliveryOverride [@ApiProperty({ enum: DeliveryOverride, example: DeliveryOverride.MANUAL }) @IsEnum(DeliveryOverride)]
    weight?: number [@ApiPropertyOptional({ example: 3) @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(5)]
  CLASS PreviewRotationDto
    windows?: number [@ApiPropertyOptional({ example: 3, default: 3) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10)]
  CLASS RotatorAnalyticsQueryDto
    days?: number [@ApiPropertyOptional({ example: 30, default: 30) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365)]
  CLASS RotatorWindowHistoryQueryDto
    limit?: number [@ApiPropertyOptional({ example: 50, default: 50) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)]
  ENUM ClusterEventType: VIEW='view', CLICK='click'
  CLASS RecordClusterEventDto
    type: ClusterEventType [@ApiProperty({ enum: ClusterEventType, example: ClusterEventType.VIEW) @IsEnum(ClusterEventType)]
    offerId: string [@ApiProperty() @IsUUID()]
    windowId?: number [@ApiPropertyOptional({ example: 1786724369) @IsOptional() @Type(() => Number) @IsInt()]
  CLASS UpsertDealScheduleDto
    id?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    dayOfWeek?: number [@ApiPropertyOptional({ example: 1) @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(6)]
    startTime?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be HH:mm (24h)')]
    endTime?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be HH:mm (24h)')]
    startDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    endDate?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
##### src/modules/saved/dto/saved.dto.ts
  ENUM SavedItemType: DEAL='DEAL', BUSINESS='BUSINESS', SERVICE='SERVICE'
  CLASS SavedQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1, minimum: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ example: 10, default: 10, minimum: 1, maximum: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)]
    type?: SavedItemType [@ApiPropertyOptional({ enum: SavedItemType) @IsOptional() @IsEnum(SavedItemType)]
  CLASS SaveToggleResponseDto
    saved: boolean [@ApiProperty({ example: true)]
  CLASS SaveStatusResponseDto
    isSaved: boolean [@ApiProperty({ example: true })]
  CLASS SavedPageDto
    data: SavedItemDto[] [@ApiProperty({ type: [SavedItemDto] })]
    total: number [@ApiProperty({ example: 4 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
  CLASS SavedUnifiedPageDto
    totals?: SavedTotalsDto [@ApiPropertyOptional({ type: SavedTotalsDto, + 'because a filtered read skips the other stores and cannot count them.')]
##### src/modules/settings/dto/update-setting.dto.ts
  CLASS UpdateSettingDto
    platformName?: string [@ApiProperty() @IsString() @IsOptional()]
    supportEmail?: string [@ApiProperty() @IsEmail() @IsOptional()]
    defaultCurrency?: string [@ApiProperty() @IsString() @IsOptional()]
    timezone?: string [@ApiProperty() @IsString() @IsOptional()]
    enforce2FA?: boolean [@ApiProperty({ example: true) @IsBoolean() @IsOptional()]
    passwordExpiry?: boolean [@ApiProperty({ example: false) @IsBoolean() @IsOptional()]
    messagingCostSms?: number [@ApiProperty({ example: 0.05) @IsNumber() @IsOptional()]
    messagingCostWhatsapp?: number [@ApiProperty({ example: 0.08) @IsNumber() @IsOptional()]
    messagingCostEmail?: number [@ApiProperty({ example: 0.01) @IsNumber() @IsOptional()]
    creditPriceSms?: number [@ApiProperty({ example: 15.0) @IsNumber() @IsOptional()]
    creditPriceWhatsapp?: number [@ApiProperty({ example: 25.0) @IsNumber() @IsOptional()]
    creditPriceEmail?: number [@ApiProperty({ example: 2.0) @IsNumber() @IsOptional()]
    creditPriceAi?: number [@ApiProperty({ example: 50.0) @IsNumber() @IsOptional()]
    whatsappApiToken?: string [@ApiProperty() @IsOptional() @IsString()]
    whatsappWebhookVerifyToken?: string [@ApiProperty() @IsOptional() @IsString()]
    whatsappBusinessId?: string [@ApiProperty() @IsOptional() @IsString()]
    whatsappApiBaseUrl?: string [@ApiProperty() @IsOptional() @IsString()]
    affiliateDirectCommission?: number [@ApiProperty({ example: 20) @IsNumber() @IsOptional()]
    affiliateIndirectCommission?: number [@ApiProperty({ example: 5) @IsNumber() @IsOptional()]
    affiliateCommissionDurationMonths?: number [@ApiProperty({ example: 3) @IsNumber() @IsOptional()]
    affiliateMinimumWithdrawal?: number [@ApiProperty({ example: 5000) @IsNumber() @IsOptional()]
    affiliateFirstPaymentCommission?: number [@ApiProperty({ example: 30) @IsNumber() @IsOptional()]
    affiliateRecurringCommission?: number [@ApiProperty({ example: 10) @IsNumber() @IsOptional()]
##### src/modules/status/dto/status.dto.ts
  CLASS CreateSystemComponentDto
    slug: string [@ApiProperty() @IsString() @IsNotEmpty()]
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    status?: SystemComponentStatus [@ApiPropertyOptional({ enum: SystemComponentStatus }) @IsOptional() @IsEnum(SystemComponentStatus)]
    latencyMs?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    uptime90d?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    sortOrder?: number [@ApiPropertyOptional() @IsOptional() @IsInt()]
    isActive?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
  CLASS UpdateSystemComponentDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    status?: SystemComponentStatus [@ApiPropertyOptional({ enum: SystemComponentStatus }) @IsOptional() @IsEnum(SystemComponentStatus)]
    latencyMs?: number [@ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)]
    uptime90d?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    sortOrder?: number [@ApiPropertyOptional() @IsOptional() @IsInt()]
    isActive?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean()]
  CLASS CreateIncidentDto
    title: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description: string [@ApiProperty() @IsString() @IsNotEmpty()]
    componentSlug?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    severity?: IncidentSeverity [@ApiPropertyOptional({ enum: IncidentSeverity }) @IsOptional() @IsEnum(IncidentSeverity)]
    status?: IncidentStatus [@ApiPropertyOptional({ enum: IncidentStatus }) @IsOptional() @IsEnum(IncidentStatus)]
    occurredAt?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    resolvedAt?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
  CLASS UpdateIncidentDto
    title?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    description?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    componentSlug?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    severity?: IncidentSeverity [@ApiPropertyOptional({ enum: IncidentSeverity }) @IsOptional() @IsEnum(IncidentSeverity)]
    status?: IncidentStatus [@ApiPropertyOptional({ enum: IncidentStatus }) @IsOptional() @IsEnum(IncidentStatus)]
    occurredAt?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    resolvedAt?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/subscription-reminders/dto/subscription-reminder-template.dto.ts
  CLASS CreateReminderTemplateDto
    stage: number [@ApiProperty({ example: 14) @IsInt() @Min(0)]
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    titleTemplate: string [@ApiProperty() @IsString() @IsNotEmpty()]
    messageTemplate: string [@ApiProperty() @IsString() @IsNotEmpty()]
    type?: string [@ApiPropertyOptional({ default: 'warning') @IsString() @IsOptional()]
    actionUrl?: string [@ApiPropertyOptional({ default: '/dashboard/settings/subscription') @IsString() @IsOptional()]
    isEnabled?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsBoolean() @IsOptional()]
    sendPush?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsBoolean() @IsOptional()]
    sendInApp?: boolean [@ApiPropertyOptional({ example: true, default: true }) @IsBoolean() @IsOptional()]
    sendEmail?: boolean [@ApiPropertyOptional({ example: false, default: false }) @IsBoolean() @IsOptional()]
    emailSubjectTemplate?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS UpdateReminderTemplateDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    titleTemplate?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    messageTemplate?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    actionUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isEnabled?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    sendPush?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    sendInApp?: boolean [@ApiPropertyOptional({ example: true }) @IsBoolean() @IsOptional()]
    sendEmail?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    emailSubjectTemplate?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
  CLASS PreviewReminderTemplateDto
    titleTemplate: string [@ApiProperty() @IsString() @IsNotEmpty()]
    messageTemplate: string [@ApiProperty() @IsString() @IsNotEmpty()]
    variables?: Record<string, any> [@ApiPropertyOptional({ example: { businessName: 'Apex Supermarket', ownerName: 'Jane Doe', planName: 'Discovery Pro', daysLeft: 14, daysText: '14 days', clusterName: 'Ikeja Mall Cluster', people: '1,450', businesses: '38', renewalUrl: '/dashboard/settings/subscription') @IsOptional()]
##### src/modules/subscriptions/dto/addons/create-addon.dto.ts
  CLASS CreateAddonDto
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type: AddOnType [@ApiProperty({ enum: AddOnType, example: AddOnType.RESOURCE) @IsEnum(AddOnType)]
    price: number [@ApiProperty({ example: 15000) @IsNumber() @Min(1)]
    durationDays?: number [@ApiPropertyOptional({ example: 30) @IsNumber() @IsOptional() @Min(1)]
    currency?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isActive?: boolean [@ApiPropertyOptional({ example: true) @IsBoolean() @IsOptional()]
    targetCapability?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    additionalLimit?: number [@ApiPropertyOptional({ example: 3) @IsNumber() @IsOptional() @Min(1)]
    serviceDetails?: ServiceDetailsDto [@ApiPropertyOptional({ type: ServiceDetailsDto) @IsObject() @IsOptional() @ValidateNested() @Type(() => ServiceDetailsDto)]
    isOneTime?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    isRecurring?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    imageUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/subscriptions/dto/addons/purchase-addon.dto.ts
  CLASS PurchaseAddonDto
    addonIds: string[] [@ApiProperty({ example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'], type: [String]) @IsArray() @IsString({ each: true }) @IsNotEmpty() @Transform(({ value }) => { if (!value) return []; if (typeof value === 'string') { return value .split(',') .map((s) => s.trim()) .filter((s) => s.length > 0); } if (Array.isArray(value)) { return value .filter((v) => typeof v === 'string' && v.trim().length > 0) .map((v) => v.trim()); } return value; })]
    quantities?: number[] [@ApiPropertyOptional({ example: [1, 2], type: [Number]) @IsArray() @IsNumber(, { each: true }) @Min(1, { each: true }) @IsOptional() @Transform(({ value }) => { if (!value) return undefined; if (typeof value === 'string') { const parts = value .split(',') .map((s) => parseInt(s.trim(), 10)) .filter((n) => !isNaN(n)); return parts.length > 0 ? parts : undefined; } if (Array.isArray(value)) { const mapped = value .map((v) => typeof v === 'number' ? v : parseInt(String(v).trim(), 10), ) .filter((n) => !isNaN(n)); return mapped.length > 0 ? mapped : undefined; } return undefined; })]
    paymentReference?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    quantity?: number [@ApiPropertyOptional({ example: 1) @IsNumber() @IsOptional() @Min(1)]
##### src/modules/subscriptions/dto/addons/subscribe-with-addons.dto.ts
  CLASS SubscribeWithAddonsDto
    addonIds?: string[] [@ApiPropertyOptional({ example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'], type: [String]) @IsOptional() @IsArray() @IsString({ each: true }) @Transform(({ value }) => { if (!value) return undefined; if (typeof value === 'string') { const parts = value .split(',') .map((s) => s.trim()) .filter((s) => s.length > 0); return parts.length > 0 ? parts : undefined; } if (Array.isArray(value)) { const filtered = value .filter((v) => typeof v === 'string' && v.trim().length > 0) .map((v) => v.trim()); return filtered.length > 0 ? filtered : undefined; } return undefined; })]
    addonQuantities?: number[] [@ApiPropertyOptional({ example: [1, 2], type: [Number]) @IsOptional() @IsArray() @IsNumber(, { each: true }) @Transform(({ value }) => { if (!value) return undefined; if (typeof value === 'string') { const parts = value .split(',') .map((s) => parseInt(s.trim(), 10)) .filter((n) => !isNaN(n)); return parts.length > 0 ? parts : undefined; } if (Array.isArray(value)) { const mapped = value .map((v) => typeof v === 'number' ? v : parseInt(String(v).trim(), 10), ) .filter((n) => !isNaN(n)); return mapped.length > 0 ? mapped : undefined; } return undefined; })]
    callbackUrl?: string [@ApiPropertyOptional() @IsOptional() @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https', 'vemtap'])]
##### src/modules/subscriptions/dto/addons/update-addon.dto.ts
  CLASS UpdateAddonDto
    name?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    type?: AddOnType [@ApiPropertyOptional({ enum: AddOnType, example: AddOnType.RESOURCE) @IsEnum(AddOnType) @IsOptional()]
    price?: number [@ApiPropertyOptional({ example: 25000) @IsNumber() @IsOptional() @Min(1)]
    durationDays?: number [@ApiPropertyOptional({ example: 30) @IsNumber() @IsOptional() @Min(1)]
    currency?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isActive?: boolean [@ApiPropertyOptional({ example: true) @IsBoolean() @IsOptional()]
    targetCapability?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    additionalLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional() @Min(1)]
    serviceDetails?: any [@ApiPropertyOptional() @IsObject() @IsOptional() @ValidateNested() @Type(() => Object)]
    isOneTime?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    isRecurring?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    imageUrl?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/subscriptions/dto/bundle-discount.dto.ts
  CLASS CreateBundleDiscountDto
    label: string [@ApiProperty() @IsString()]
    minQuantity: number [@ApiProperty({ example: 3 }) @IsInt() @Min(1)]
    maxQuantity?: number [@ApiPropertyOptional({ example: 6 }) @IsInt() @IsOptional()]
    discountPercent: number [@ApiProperty({ example: 5 }) @IsInt() @Min(0)]
    isActive?: boolean [@ApiPropertyOptional({ default: true }) @IsBoolean() @IsOptional()]
  CLASS UpdateBundleDiscountDto
    label?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    minQuantity?: number [@ApiPropertyOptional() @IsInt() @Min(1) @IsOptional()]
    maxQuantity?: number [@ApiPropertyOptional() @IsInt() @IsOptional()]
    discountPercent?: number [@ApiPropertyOptional() @IsInt() @Min(0) @IsOptional()]
    isActive?: boolean [@ApiPropertyOptional() @IsBoolean() @IsOptional()]
##### src/modules/subscriptions/dto/create-plan.dto.ts
  CLASS CreatePlanDto
    name: string [@ApiProperty() @IsString()]
    monthlyPrice?: number [@ApiPropertyOptional({ example: 50000 }) @IsNumber() @IsOptional() @Min(0)]
    features: string[] [@ApiProperty({ example: ['Analytics', 'Unlimited Messages']) @IsArray() @ArrayNotEmpty() @IsString({ each: true })]
    currency?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isFree?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    trialDurationDays?: number [@ApiPropertyOptional({ example: 30) @IsNumber() @IsOptional()]
    messagingEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    smsCredits?: number [@ApiPropertyOptional({ example: 100 }) @IsNumber() @IsOptional()]
    whatsappCredits?: number [@ApiPropertyOptional({ example: 50 }) @IsNumber() @IsOptional()]
    emailCredits?: number [@ApiPropertyOptional({ example: 1000 }) @IsNumber() @IsOptional()]
    teamMembersEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    teamMembersLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    loyaltyLimit?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    loyaltyEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    branchesEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    branchLimit?: number [@ApiPropertyOptional({ example: 3) @IsNumber() @IsOptional()]
    analyticsEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    analyticsLevel?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    catalogueEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    maxCatalogueItems?: number [@ApiPropertyOptional({ example: 50) @IsNumber() @IsOptional()]
    maxCatalogueCategories?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    maxCatalogueOffers?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    automationsEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    maxAutomations?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    isActive?: boolean [@ApiPropertyOptional({ example: true) @IsBoolean() @IsOptional()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    qrThrivePlanId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    isPopular?: boolean [@ApiPropertyOptional({ example: true) @IsBoolean() @IsOptional()]
    inventoryEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    inventoryLimit?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    posEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    posTerminalLimit?: number [@ApiPropertyOptional({ example: 1) @IsNumber() @IsOptional()]
    visitorsEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    inAppChatEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    formsEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    formsLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    businessQrEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    marketingKitEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    marketingKitLimit?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    discoveryEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    staffRolesEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    staffRolesLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    activityLogEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    qrCodesEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    qrCodesLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    aiCopilotEnabled?: boolean [@ApiPropertyOptional({ example: true) @IsBoolean() @IsOptional()]
    aiCredits?: number [@ApiPropertyOptional({ example: 50) @IsNumber() @IsOptional()]
    autoFeatureDeals?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
##### src/modules/subscriptions/dto/find-plans-query.dto.ts
  CLASS FindPlansQueryDto
    onlyActive?: boolean [@ApiPropertyOptional({ example: true) @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === true)]
##### src/modules/subscriptions/dto/save-plan-permissions.dto.ts
  CLASS SavePlanPermissionsDto
    messagingEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    smsCredits?: number [@ApiPropertyOptional({ example: 100 }) @IsNumber() @IsOptional()]
    whatsappCredits?: number [@ApiPropertyOptional({ example: 50 }) @IsNumber() @IsOptional()]
    emailCredits?: number [@ApiPropertyOptional({ example: 1000 }) @IsNumber() @IsOptional()]
    teamMembersEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    teamMembersLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    loyaltyEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    loyaltyLimit?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    branchesEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    branchLimit?: number [@ApiPropertyOptional({ example: 3) @IsNumber() @IsOptional()]
    analyticsEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    analyticsLevel?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    catalogueEnabled?: boolean [@ApiPropertyOptional({ example: false }) @IsBoolean() @IsOptional()]
    maxCatalogueItems?: number [@ApiPropertyOptional({ example: 50) @IsNumber() @IsOptional()]
    maxCatalogueCategories?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    maxCatalogueOffers?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    automationsEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    maxAutomations?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    inventoryEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    inventoryLimit?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    posEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    posTerminalLimit?: number [@ApiPropertyOptional({ example: 1) @IsNumber() @IsOptional()]
    visitorsEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    inAppChatEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    formsEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    formsLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    businessQrEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    marketingKitEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    marketingKitLimit?: number [@ApiPropertyOptional({ example: 10) @IsNumber() @IsOptional()]
    discoveryEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    staffRolesEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    staffRolesLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    activityLogEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    qrCodesEnabled?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
    qrCodesLimit?: number [@ApiPropertyOptional({ example: 5) @IsNumber() @IsOptional()]
    aiCopilotEnabled?: boolean [@ApiPropertyOptional({ example: true) @IsBoolean() @IsOptional()]
    aiCredits?: number [@ApiPropertyOptional({ example: 50) @IsNumber() @IsOptional()]
    autoFeatureDeals?: boolean [@ApiPropertyOptional({ example: false) @IsBoolean() @IsOptional()]
##### src/modules/subscriptions/dto/start-trial.dto.ts
  CLASS StartTrialDto
    planId: string [@ApiProperty() @IsUUID()]
    billingPeriod?: BillingPeriod [@ApiPropertyOptional({ enum: BillingPeriod, default: BillingPeriod.MONTHLY) @IsOptional() @IsEnum(BillingPeriod)]
##### src/modules/subscriptions/dto/tax/price-preview.dto.ts
  CLASS PricePreviewDto
    planId: string [@ApiProperty() @IsUUID()]
    billingPeriod: BillingPeriod [@ApiProperty({ enum: BillingPeriod, example: BillingPeriod.MONTHLY) @IsEnum(BillingPeriod)]
    addonIds?: string[] [@ApiPropertyOptional({ type: [String]) @IsOptional() @IsArray() @Transform(({ value }) => { if (!value) return undefined; if (typeof value === 'string') { const parts = value .split(',') .map((s) => s.trim()) .filter((s) => s.length > 0); return parts.length > 0 ? parts : undefined; } if (Array.isArray(value)) { const filtered = value .filter((v) => typeof v === 'string' && v.trim().length > 0) .map((v) => v.trim()); return filtered.length > 0 ? filtered : undefined; } return undefined; })]
    addonQuantities?: number[] [@ApiPropertyOptional({ type: [Number]) @IsOptional() @IsArray() @Transform(({ value }) => { if (!value) return undefined; if (typeof value === 'string') { const parts = value .split(',') .map((s) => parseInt(s.trim(), 10)) .filter((n) => !isNaN(n)); return parts.length > 0 ? parts : undefined; } if (Array.isArray(value)) { const mapped = value .map((v) => typeof v === 'number' ? v : parseInt(String(v).trim(), 10), ) .filter((n) => !isNaN(n)); return mapped.length > 0 ? mapped : undefined; } return undefined; })]
    promoCode?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => { if (typeof value === 'string') { const trimmed = value.trim(); return trimmed.length > 0 ? trimmed : undefined; } return undefined; })]
##### src/modules/subscriptions/dto/tax/toggle-subscription-tax.dto.ts
  CLASS ToggleSubscriptionTaxDto
    isEnabled: boolean [@ApiProperty({ example: false) @IsBoolean()]
    changeReason?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/subscriptions/dto/tax/update-subscription-tax.dto.ts
  CLASS UpdateSubscriptionTaxDto
    name?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    taxType: TaxType [@ApiProperty({ enum: TaxType, example: TaxType.PERCENTAGE) @IsEnum(TaxType)]
    rate: number [@ApiProperty({ example: 7.5) @IsNumber() @Min(0)]
    isEnabled: boolean [@ApiProperty({ example: true) @IsBoolean()]
    changeReason?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/support/dto/agent-stats.dto.ts
  CLASS AgentStatsDto
    assignedChats: number [@ApiProperty({ example: 5 })]
    openTickets: number [@ApiProperty({ example: 12 })]
    resolvedToday: number [@ApiProperty({ example: 8 })]
    avgResponseTime: string [@ApiProperty()]
##### src/modules/support/dto/create-ticket.dto.ts
  CLASS CreateTicketDto
    subject: string [@ApiProperty() @IsNotEmpty() @IsString()]
    category: string [@ApiProperty() @IsNotEmpty() @IsString()]
    message: string [@ApiProperty() @IsNotEmpty() @IsString()]
    priority?: TicketPriority = TicketPriority.NORMAL [@ApiProperty({ enum: TicketPriority, example: TicketPriority.NORMAL) @IsOptional() @IsEnum(TicketPriority)]
##### src/modules/support/dto/find-tickets-admin.dto.ts
  CLASS FindTicketsAdminDto
    type?: TicketType [@ApiPropertyOptional({ enum: TicketType) @IsOptional() @IsEnum(TicketType)]
    isAssigned?: boolean [@ApiPropertyOptional() @IsOptional() @IsBoolean() @Type(() => Boolean)]
##### src/modules/support/dto/search-faq-query.dto.ts
  CLASS SearchFaqQueryDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
##### src/modules/support/dto/support-bot.dto.ts
  CLASS BotQueryDto
    query: string [@ApiProperty() @IsString() @IsNotEmpty()]
    context?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    sessionId?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    guestName?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    guestEmail?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    history?: { role: string; content: string }[] [@ApiPropertyOptional({ example: [] }) @IsArray() @IsOptional()]
  CLASS CreateKnowledgeDto
    question: string [@IsString() @IsNotEmpty()]
    answer: string [@IsString() @IsNotEmpty()]
    keywords?: string[] [@IsArray() @IsOptional()]
    category?: string [@IsString() @IsOptional()]
    buttons?: ChatButton[] [@IsOptional() @IsArray()]
##### src/modules/support/dto/support-session-query.dto.ts
  CLASS SupportSessionQueryDto
    sessionId?: string [@ApiPropertyOptional() @IsOptional() @IsString() @Transform(({ value }) => typeof value === 'string' && value.trim() === '' ? undefined : value?.trim(), )]
##### src/modules/support/dto/ticket-attachment.dto.ts
  CLASS AddTicketAttachmentsDto
    message?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    attachments: TicketAttachmentDto[] [@ApiProperty({ type: [TicketAttachmentDto]) @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => TicketAttachmentDto)]
##### src/modules/support/dto/ticket-reply.dto.ts
  CLASS TicketReplyDto
    message: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/support/dto/update-agent-profile.dto.ts
  CLASS UpdateAgentProfileDto
    firstName?: string [@ApiProperty() @IsString() @IsOptional()]
    lastName?: string [@ApiProperty() @IsString() @IsOptional()]
    email?: string [@ApiProperty() @IsEmail() @IsOptional()]
    phone?: string [@ApiProperty() @IsString() @IsOptional()]
##### src/modules/support/dto/update-ticket-admin.dto.ts
  CLASS UpdateTicketStatusAdminDto
    status: TicketStatus [@ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED }) @IsEnum(TicketStatus) @IsNotEmpty()]
  CLASS AssignTicketDto
    agentId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
  CLASS AdminTicketMessageDto
    message: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/support/dto/update-ticket-status.dto.ts
  CLASS UpdateTicketStatusDto
    status: TicketStatus [@ApiProperty({ enum: TicketStatus, example: TicketStatus.IN_PROGRESS }) @IsEnum(TicketStatus)]
##### src/modules/surveys/dto/create-survey.dto.ts
  CLASS CreateSurveyDto
    questions: SurveyQuestionDto[] [@ApiProperty({ type: [SurveyQuestionDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => SurveyQuestionDto)]
    triggerType: SurveyTriggerType [@ApiProperty({ enum: SurveyTriggerType, example: SurveyTriggerType.INSTANT }) @IsEnum(SurveyTriggerType)]
    triggerDelay?: number [@ApiProperty({ example: 0) @IsNumber() @IsOptional()]
    targetAudience: TargetAudienceDto [@ApiProperty({ type: TargetAudienceDto }) @IsObject() @ValidateNested() @Type(() => TargetAudienceDto)]
    isActive: boolean [@ApiProperty({ example: true }) @IsBoolean()]
##### src/modules/system/dto/control-tower.dto.ts
  CLASS BusinessSudoActionDto
    businessUid: string [@ApiProperty() @IsString()]
    ticketRef?: string [@ApiProperty() @IsOptional() @IsString()]
    actionKey: string [@ApiProperty({ enum: [ 'add_user', 'send_message', 'add_device', 'adjust_loyalty', 'resolve_ticket', 'assume_session', 'reset_access', 'pause') @IsEnum([ 'add_user', 'send_message', 'add_device', 'adjust_loyalty', 'resolve_ticket', 'assume_session', 'reset_access', 'pause')]
    payload?: Record<string, any> [@ApiProperty({ example: { full_name: 'Jane Doe', email: 'jane@business.com', role: 'Manager') @IsOptional() @IsObject()]
  CLASS CustomerSudoActionDto
    customerUid: string [@ApiProperty() @IsString()]
    businessUid: string [@ApiProperty() @IsString()]
    ticketRef?: string [@ApiProperty() @IsOptional() @IsString()]
    actionKey: string [@ApiProperty({ enum: [ 'add_profile', 'award_points', 'redeem_fix', 'update_contact', 'close_issue', 'assume_session') @IsEnum([ 'add_profile', 'award_points', 'redeem_fix', 'update_contact', 'close_issue', 'assume_session')]
    payload?: Record<string, any> [@ApiProperty({ example: { points: 100, reason: 'Compensation' }) @IsOptional() @IsObject()]
  CLASS BusinessSearchFilterDto
    query?: string [@ApiProperty() @IsOptional() @IsString()]
    limit?: number [@ApiProperty({ default: 10 }) @IsOptional() @Type(() => Number) @IsNumber()]
  CLASS CustomerSearchFilterDto
    query?: string [@ApiProperty() @IsOptional() @IsString()]
    limit?: number [@ApiProperty({ default: 10 }) @IsOptional() @Type(() => Number) @IsNumber()]
##### src/modules/users/dto/admin-create-agent.dto.ts
  CLASS UserAdminCreateAgentDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    password: string [@ApiProperty() @IsString() @MinLength(8)]
    phone?: string [@ApiProperty() @IsString()]
##### src/modules/users/dto/admin-user-management.dto.ts
  CLASS AdminCreateUserDto
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    password: string [@ApiProperty() @IsString() @MinLength(8)]
    phone?: string [@ApiProperty() @IsOptional() @IsString()]
    role: UserRole [@ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER }) @IsEnum(UserRole)]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
  CLASS AdminUpdateUserDto
    email?: string [@ApiPropertyOptional() @IsOptional() @IsEmail()]
    firstName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    lastName?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    phone?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    role?: UserRole [@ApiPropertyOptional({ enum: UserRole }) @IsOptional() @IsEnum(UserRole)]
    businessId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
##### src/modules/users/dto/check-phone-query.dto.ts
  CLASS CheckPhoneQueryDto
    phone: string [@ApiProperty() @IsString() @IsNotEmpty({ message: 'Phone number is required' }) @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))]
##### src/modules/users/dto/find-users-admin.dto.ts
  CLASS FindUsersAdminDto
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
    role?: UserRole [@ApiPropertyOptional({ enum: UserRole) @IsOptional() @IsEnum(UserRole)]
    status?: UserStatus [@ApiPropertyOptional({ enum: UserStatus) @IsOptional() @IsEnum(UserStatus)]
##### src/modules/users/dto/invite-staff.dto.ts
  ENUM StaffPermission: DASHBOARD='dashboard', INVENTORY='inventory', POS='pos', VISITORS='visitors', MESSAGES='messages', ENGAGEMENT='engagement', CUSTOMER_EXPERIENCE='customer-experience', MARKETING='marketing', DISCOVERY='discovery', ANALYTICS='analytics', STAFF='staff', SETTINGS='settings', QRTHRIVE='qrthrive', POS_SALES_DASHBOARD='pos:sales-dashboard', POS_HOME='pos:pos-home', POS_ORDERS='pos:orders', POS_SETTINGS='pos:settings', POS_HELP='pos:help', INVENTORY_OVERVIEW='inventory:overview', INVENTORY_CATALOGUE='inventory:catalogue', INVENTORY_INVENTORY='inventory:inventory', VISITORS_OVERVIEW='visitors:overview', VISITORS_CUSTOMER_LIST='visitors:customer-list', VISITORS_LOYALTY='visitors:loyalty', VISITORS_VISITORS='visitors:visitors', DISCOVERY_GET_CUSTOMERS='discovery:get-customers', DISCOVERY_BUSINESS_PARTNERSHIP='discovery:business-partnership', ANALYTICS_OVERVIEW='analytics:overview', ANALYTICS_AI_REPORTS='analytics:ai-reports', ANALYTICS_SALES_REPORTS='analytics:sales-reports', ANALYTICS_INVENTORY_REPORTS='analytics:inventory-reports', ANALYTICS_CUSTOMERS='analytics:customers', ANALYTICS_DISCOVERY='analytics:discovery', ANALYTICS_FOOTFALL='analytics:footfall', ANALYTICS_MARKETING='analytics:marketing', ANALYTICS_PEAK_TIMES='analytics:peak-times', SETTINGS_PROFILE='settings:profile', SETTINGS_SUBSCRIPTION='settings:subscription', SETTINGS_SUPPORT='settings:support', SETTINGS_COMPLIANCE='settings:compliance'
  CLASS InviteStaffDto
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    phone?: string [@ApiProperty() @IsString() @IsOptional()]
    role: string [@ApiProperty() @IsString() @IsNotEmpty()]
    jobTitle?: string [@ApiProperty() @IsString() @IsOptional()]
    permissions?: StaffPermission[] [@ApiProperty({ enum: StaffPermission, isArray: true, example: [StaffPermission.DASHBOARD, StaffPermission.VISITORS]) @IsArray() @IsEnum(StaffPermission, { each: true }) @IsOptional()]
    branchId?: string [@ApiProperty() @IsUUID() @IsOptional()]
##### src/modules/users/dto/rename-session.dto.ts
  CLASS RenameSessionDto
    deviceName: string [@ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)]
##### src/modules/users/dto/update-profile.dto.ts
  CLASS UpdateUserProfileDto
    firstName?: string [@ApiProperty() @IsOptional() @IsString()]
    lastName?: string [@ApiProperty() @IsOptional() @IsString()]
    phone?: string [@ApiProperty() @IsOptional() @IsString()]
    gender?: string [@ApiProperty() @IsOptional() @IsString() @MaxLength(32)]
    avatar?: string [@ApiProperty() @IsOptional() @IsString() @MaxLength(512)]
##### src/modules/users/dto/update-staff.dto.ts
  CLASS UpdateStaffDto
    name?: string [@ApiProperty() @IsString() @IsOptional()]
    email?: string [@ApiProperty() @IsEmail() @IsOptional()]
    role?: string [@ApiProperty() @IsString() @IsOptional()]
    jobTitle?: string [@ApiProperty() @IsString() @IsOptional()]
    permissions?: StaffPermission[] [@ApiProperty({ enum: StaffPermission, isArray: true, example: [StaffPermission.DASHBOARD, StaffPermission.VISITORS]) @IsArray() @IsEnum(StaffPermission, { each: true }) @IsOptional()]
    status?: UserStatus [@ApiProperty({ enum: UserStatus) @IsEnum(UserStatus) @IsOptional()]
##### src/modules/verification/dto/verify.dto.ts
  CLASS StartLivenessDto
    redirectUrl?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300)]
  CLASS VerifyIdentityDto
    idType: IdentityIdType [@ApiProperty({ enum: IDENTITY_ID_TYPES }) @IsIn(IDENTITY_ID_TYPES)]
    idNumber?: string [@ApiPropertyOptional() @ValidateIf((dto: VerifyIdentityDto) => dto.idType !== 'passport') @IsString() @IsNotEmpty() @MaxLength(30) @Matches(/^[A-Za-z0-9\s-]+$/, { message: 'idNumber may only contain letters and numbers')]
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)]
    dob?: string [@ApiPropertyOptional() @IsOptional() @IsDateString()]
    livenessSessionId: string [@ApiProperty() @IsString() @IsNotEmpty() @MaxLength(80)]
    documentUrl?: string [@ApiPropertyOptional() @ValidateIf((dto: VerifyIdentityDto) => dto.idType === 'passport') @IsUrl({ require_protocol: true, protocols: ['https'] })]
  CLASS VerifyBusinessDto
    registrationNumber: string [@ApiProperty() @IsString() @Matches(/^\s*(RC|BN|IT)[\s-]*\d{1,10}\s*$/i, { message: 'registrationNumber must start with RC, BN or IT followed by digits')]
  CLASS UnregisteredBusinessDto
    note?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)]
    documentUrls?: string[] [@ApiPropertyOptional({ type: [String]) @IsOptional() @IsArray() @ArrayMaxSize(5) @IsUrl({ require_protocol: true, protocols: ['https'] }, { each: true })]
  CLASS ManualReviewDto
    checkId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    note?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)]
  CLASS AdminVerificationDecisionDto
    note?: string [@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000)]
##### src/modules/visitors/dto/activity-feed-query.dto.ts
  CLASS ActivityFeedQueryDto
    branchId?: string [@ApiPropertyOptional() @IsOptional() @IsUUID()]
    page?: number = 1 [@ApiPropertyOptional({ example: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 20 [@ApiPropertyOptional({ example: 20 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/visitors/dto/activity-feed-response.dto.ts
  CLASS PaginatedActivityFeedResponseDto
    data: ActivityFeedItemDto[] [@ApiProperty({ type: [ActivityFeedItemDto] })]
    total: number [@ApiProperty({ example: 100 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 20 })]
##### src/modules/visitors/dto/admin-visitor-action.dto.ts
  CLASS AdminSendMessageDto
    message: string [@ApiProperty() @IsString() @IsNotEmpty()]
    channel: Channel [@ApiProperty({ enum: Channel) @IsEnum(Channel) @IsNotEmpty()]
  CLASS AdminSendRewardDto
    rewardId: string [@ApiProperty() @IsUUID() @IsNotEmpty()]
  CLASS SendCampaignDto
    channel: Channel [@ApiProperty({ enum: Channel) @IsEnum(Channel) @IsNotEmpty()]
    message: string [@ApiProperty() @IsString() @IsNotEmpty()]
##### src/modules/visitors/dto/admin-visitor-activities-query.dto.ts
  CLASS AdminVisitorActivitiesQueryDto
    search?: string [@ApiProperty() @IsOptional() @IsString()]
    branchId?: string [@ApiProperty() @IsOptional() @IsUUID()]
    businessId?: string [@ApiProperty() @IsOptional() @IsUUID()]
    page?: number = 1 [@ApiProperty({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiProperty({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/visitors/dto/create-visitor-reward.dto.ts
  CLASS CreateVisitorRewardDto
    branchId?: string [@ApiPropertyOptional() @IsUUID() @IsOptional()]
    name: string [@ApiProperty() @IsString() @IsNotEmpty()]
    description?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    pointCost: number [@ApiProperty({ example: 500 }) @IsNumber()]
    rewardType?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    value?: number [@ApiPropertyOptional({ example: 5.0 }) @IsNumber() @IsOptional()]
    validityDays?: number [@ApiPropertyOptional({ example: 30) @IsNumber() @IsOptional()]
    usageLimitPerUser?: number [@ApiPropertyOptional({ example: 1) @IsNumber() @IsOptional()]
    imageUrls?: string[] [@ApiPropertyOptional({ example: ['https://...'], type: [String]) @IsArray() @IsUrl(, { each: true }) @IsOptional()]
##### src/modules/visitors/dto/create-visitor.dto.ts
  CLASS CreateVisitorDto
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    phone?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
##### src/modules/visitors/dto/visit-response.dto.ts
  CLASS PaginatedVisitResponseDto
    data: VisitResponseDto[] [@ApiProperty({ type: [VisitResponseDto] })]
    total: number [@ApiProperty({ example: 100 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
##### src/modules/visitors/dto/visited-branch-response.dto.ts
  CLASS PaginatedVisitedBranchResponseDto
    data: VisitedBranchDto[] [@ApiProperty({ type: [VisitedBranchDto] })]
    total: number [@ApiProperty({ example: 100 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
##### src/modules/visitors/dto/visited-branches-query.dto.ts
  CLASS VisitedBranchesQueryDto
    page?: number = 1 [@ApiPropertyOptional({ example: 1, default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiPropertyOptional({ example: 10, default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    search?: string [@ApiPropertyOptional() @IsOptional() @IsString()]
##### src/modules/visitors/dto/visitor-growth.dto.ts
  CLASS VisitorGrowthQueryDto
    range?: string [@ApiProperty({ enum: ['7D', '30D', '90D', '12M']) @IsOptional() @IsString() @IsIn(['7D', '30D', '90D', '12M'])]
    branchId?: string [@ApiProperty() @IsOptional() @IsString()]
    allBranches?: boolean [@ApiProperty() @IsOptional() @IsBoolean() @Transform(({ value }) => value === 'true' || value === true)]
  CLASS VisitorGrowthResponseDto
    range: string [@ApiProperty()]
    data: VisitorGrowthPointDto[] [@ApiProperty({ type: [VisitorGrowthPointDto] })]
##### src/modules/visitors/dto/visitor-query.dto.ts
  ENUM VisitorStatus: NEW='new', RETURNING='returning', VIP='vip', INACTIVE='inactive', ALL='all'
  CLASS VisitorQueryDto
    search?: string [@ApiProperty() @IsOptional() @IsString()]
    status?: string [@ApiProperty({ enum: VisitorStatus, default: VisitorStatus.ALL) @IsOptional() @IsEnum(VisitorStatus)]
    page?: number = 1 [@ApiProperty({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
    limit?: number = 10 [@ApiProperty({ default: 10 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1)]
##### src/modules/visitors/dto/visitor-response.dto.ts
  CLASS VisitorResponseDto
    id: string [@ApiProperty()]
    firstName: string [@ApiProperty()]
    lastName: string [@ApiProperty()]
    name: string [@ApiProperty()]
    email: string [@ApiProperty()]
    phone: string [@ApiProperty()]
    visits: number [@ApiProperty({ example: 5 })]
    lastVisit: Date [@ApiProperty()]
    status: string [@ApiProperty({ enum: ['New', 'Active', 'Returning', 'VIP', 'Inactive'])]
    totalSpent: string [@ApiProperty()]
  CLASS NewVisitorResponseDto
    id: string [@ApiProperty()]
    firstName: string [@ApiProperty()]
    lastName: string [@ApiProperty()]
    name: string [@ApiProperty()]
    email: string [@ApiProperty()]
    phone: string [@ApiProperty()]
    joined: Date [@ApiProperty()]
    source: string [@ApiProperty()]
    status: string [@ApiProperty()]
  CLASS ReturningVisitorResponseDto
    id: string [@ApiProperty()]
    firstName: string [@ApiProperty()]
    lastName: string [@ApiProperty()]
    name: string [@ApiProperty()]
    email: string [@ApiProperty()]
    phone: string [@ApiProperty()]
    totalVisits: number [@ApiProperty({ example: 24 })]
    frequency: string [@ApiProperty()]
    lastVisit: Date [@ApiProperty()]
    status: string [@ApiProperty()]
  CLASS PaginatedVisitorResponseDto
    data: VisitorResponseDto[] [@ApiProperty({ type: [VisitorResponseDto] })]
    total: number [@ApiProperty({ example: 100 })]
    page: number [@ApiProperty({ example: 1 })]
    limit: number [@ApiProperty({ example: 10 })]
##### src/modules/visitors/dto/visitor-signup.dto.ts
  CLASS VisitorSignupDto
    firstName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    lastName: string [@ApiProperty() @IsString() @IsNotEmpty()]
    email: string [@ApiProperty() @IsEmail() @IsNotEmpty()]
    phone?: string [@ApiPropertyOptional() @IsString() @IsOptional()]
    pin?: string [@ApiPropertyOptional() @IsString() @IsOptional() @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })]
##### src/modules/visitors/dto/visitor-stats.dto.ts
  CLASS VisitorStatsResponseDto
    stats: StatCardDto[] [@ApiProperty({ type: [StatCardDto] })]

## D.7 Alias appendix — `PartialType` update DTOs + status DTO (exact source declarations)

18 referenced classes are declared as `extends PartialType(Source)` one-liners/multi-line statements (or, for `UpdateOfferGroupStatusDto`, with a single field), so they were not machine-extractable from the bulk dump. Each `PartialType` class has **all fields of its source class, all optional**. Every source class is printed in full in D.1–D.6 above.

##### src/modules/marketing-assets/dto/update-asset.dto.ts
  CLASS UpdateAssetDto  = PartialType(CreateAssetDto)   // every field of CreateAssetDto, all optional  [UpdateAssetDto extends @nestjs/swagger PartialType]
##### src/modules/banners/dto/update-banner.dto.ts
  CLASS UpdateBannerDto  = PartialType(CreateBannerDto)   // every field of CreateBannerDto, all optional  [UpdateBannerDto extends @nestjs/swagger PartialType]
##### src/modules/campaigns/dto/update-campaign.dto.ts
  CLASS UpdateCampaignDto  = PartialType(CreateCampaignDto)   // every field of CreateCampaignDto, all optional  [UpdateCampaignDto extends @nestjs/swagger PartialType]
##### src/modules/coupons/dto/update-coupon.dto.ts
  CLASS UpdateCouponDto  = PartialType(CreateCouponDto)   // every field of CreateCouponDto, all optional  [UpdateCouponDto extends @nestjs/swagger PartialType]
##### src/modules/messaging/dto/update-credit-plan.dto.ts
  CLASS UpdateCreditPlanDto  = PartialType(CreateCreditPlanDto)   // every field of CreateCreditPlanDto, all optional  [UpdateCreditPlanDto extends @nestjs/swagger PartialType]
##### src/modules/forms/dto/update-form.dto.ts
  CLASS UpdateFormDto  = PartialType(CreateFormDto)   // every field of CreateFormDto, all optional  [UpdateFormDto extends @nestjs/swagger PartialType]
##### src/modules/forms/dto/update-form-template.dto.ts
  CLASS UpdateFormTemplateDto  = PartialType(CreateFormTemplateDto)   // every field of CreateFormTemplateDto, all optional  [UpdateFormTemplateDto extends @nestjs/swagger PartialType]
##### src/modules/marketing-assets/dto/update-category.dto.ts
  CLASS UpdateMarketingCategoryDto  = PartialType(CreateMarketingCategoryDto)   // every field of CreateMarketingCategoryDto, all optional  [UpdateMarketingCategoryDto extends @nestjs/swagger PartialType]
##### src/modules/marketing-assets/dto/update-template.dto.ts
  CLASS UpdateMarketingTemplateDto  = PartialType(CreateMarketingTemplateDto)   // every field of CreateMarketingTemplateDto, all optional  [UpdateMarketingTemplateDto extends @nestjs/swagger PartialType]
##### src/modules/subscriptions/dto/update-plan.dto.ts
  CLASS UpdatePlanDto  = PartialType(CreatePlanDto)   // every field of CreatePlanDto, all optional  [UpdatePlanDto extends @nestjs/swagger PartialType]
##### src/modules/products/dto/update-product.dto.ts
  CLASS UpdateProductDto  = PartialType(CreateProductDto)   // every field of CreateProductDto, all optional  [UpdateProductDto extends @nestjs/swagger PartialType]
##### src/modules/products/dto/update-product-type.dto.ts
  CLASS UpdateProductTypeDto  = PartialType(CreateProductTypeDto)   // every field of CreateProductTypeDto, all optional  [UpdateProductTypeDto extends @nestjs/swagger PartialType]
##### src/modules/coupons/dto/update-promo-code.dto.ts
  CLASS UpdatePromoCodeDto  = PartialType(CreatePromoCodeDto)   // every field of CreatePromoCodeDto, all optional  [UpdatePromoCodeDto extends @nestjs/swagger PartialType]
##### src/modules/loyalty/dto/loyalty.dto.ts
  CLASS UpdateRewardTemplateDto  = PartialType(CreateRewardTemplateDto)   // every field of CreateRewardTemplateDto, all optional  [UpdateRewardTemplateDto extends @nestjs/swagger PartialType]
##### src/modules/surveys/dto/update-survey.dto.ts
  CLASS UpdateSurveyDto  = PartialType(CreateSurveyDto)   // every field of CreateSurveyDto, all optional  [UpdateSurveyDto extends @nestjs/swagger PartialType]
##### src/modules/marketing-assets/dto/update-template-format.dto.ts
  CLASS UpdateTemplateFormatDto  = PartialType(CreateTemplateFormatDto)   // every field of CreateTemplateFormatDto, all optional  [UpdateTemplateFormatDto extends @nestjs/swagger PartialType]
##### src/modules/marketing-assets/dto/update-template-style.dto.ts
  CLASS UpdateTemplateStyleDto  = PartialType(CreateTemplateStyleDto)   // every field of CreateTemplateStyleDto, all optional  [UpdateTemplateStyleDto extends @nestjs/swagger PartialType]
##### src/modules/catalogue/dto/offer.dto.ts
  CLASS UpdateOfferGroupStatusDto
    @ApiProperty({ enum: CatalogueOfferStatus })
    @IsEnum(CatalogueOfferStatus)
    status: CatalogueOfferStatus;
}

Special case:
- `UpdateAddonDto` (printed in D.1–D.6 from the bulk dump) = `export class UpdateAddonDto extends PartialType(CreateAddonDto) { …own optional overrides… }` — its own fields are printed; add `CreateAddonDto`'s fields (also in D.1–D.6), all optional.

---
**Counts:** 456 class entries (470 unique names) + 24 enum tables + 18 alias declarations · 267 DTO files.
