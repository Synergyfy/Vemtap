# VemTap Backend Handoff — Full Audit (Frontend vs Backend)

Audited: Customer app, Business dashboard, Admin, Front-facing/public.
Date: 2026-08-04. Categorized as **Backend_Needed** (build new endpoint) or **Need_Integration** (wire existing endpoint / fix contract).

---

## PRIORITY 1 — Blocks core product flows (loyalty, points, redemption)

| # | Where | File | Issue | Type |
|---|---|---|---|---|
| C1 | Customer: /dashboard, /rewards, /loyalty | `backend loyalty.controller.ts:85-91` vs `lib/api/customer.ts:20` | `/loyalty/points/balance` returns scalar `150`; frontend reads `profile.currentPointsBalance` → points always 0 | Need_Integration |
| C2 | Customer: /dashboard, /rewards, /loyalty | `loyalty/entities/reward.entity.ts:26` vs `types/loyalty.ts:60` | Backend field `pointsRequired`; frontend uses `pointCost` → costs undefined, guards broken | Need_Integration |
| C3 | Customer: /dashboard, /rewards, /loyalty | `customer.ts:24` vs `loyalty/dto/redeem-reward.dto.ts` | Redeem sends `{code}`, backend requires `{rewardId}` → 400 every redeem | Need_Integration |
| C4 | Customer: /dashboard, /loyalty, /history | `customer.ts:22` vs `loyalty.controller.ts:101-105` | `/loyalty/points/logs` requires `businessId`; customer never sends it → 400 | Need_Integration |
| D1 | Business: /dashboard/loyalty/award | `lib/api/loyalty.ts:23` | `POST /loyalty/earn` → 404; backend has `POST /loyalty/points/give` | Need_Integration |
| D2 | Business: /dashboard/loyalty | `lib/api/loyalty.ts:39` | `POST /loyalty/redeem` → 404; backend has `/loyalty/redemption/redeem` | Need_Integration |
| D3 | Business: /dashboard/loyalty/redemptions | `services/loyalty/hooks.ts:255` | `POST /loyalty/verify-redemption` → NO backend route | Backend_Needed |
| D4 | Business: /dashboard/loyalty/redemptions | `services/loyalty/hooks.ts:285` | `POST /loyalty/generate-code` → 404; backend has `/loyalty/points/generate-code` + `/loyalty/redemption/generate-code` | Need_Integration |
| D5 | Business: /dashboard/loyalty/rewards | `services/loyalty/hooks.ts:366` | `POST /loyalty/reward-templates/:id/apply` → NO such route | Backend_Needed |
| D6 | Business: loyalty hooks | `lib/api/loyalty.ts` exports | `/loyalty/profiles`, `/profile/:userId`, `/history`, `/transactions/:profileId`, `/claim-code` — none exist. Implement or remove | Backend_Needed |

**Backend actions:** make `/loyalty/points/logs` businessId-optional for CUSTOMER; add `/loyalty/verify-redemption`; add reward-template `PATCH/:id`, `DELETE/:id`, `:id/apply`; align earn/redeem/generate-code route names; standardize `pointsRequired`.

---

## PRIORITY 2 — Customer app

| # | Page | File | Issue | Type |
|---|---|---|---|---|
| N5 | /customer/dashboard | `dashboard/page.tsx:55` | Rewards query disabled without branch context; no fallback to `/loyalty/rewards?businessId=` → empty rewards section | Need_Integration |
| N6 | /customer/loyalty, /customer/loyalty/history | `loyalty/page.tsx:55,71` | `transactionType === 'REDEEMED'` vs backend enum `'redeem'` → wrong counts/icons | Need_Integration |
| N8 | /customer/support | `support/page.tsx:70-74` | `ticket.status === 'Open'` vs backend enum `'Pending'` → always gray | Need_Integration |
| N9 | /customer/support | `customer.ts:28-29` | Priority collected but never sent; backend CreateTicketDto has no priority; enum is Low/Normal/High/Urgent (Medium invalid) | Need_Integration |
| N10 | /customer/dashboard/orders | `orders/page.tsx:22-30` | StatusBadge missing `refunded`/`partial_refund` statuses | Need_Integration |
| N11 | /customer/cart + /checkout | `cart/page.tsx:73`, `checkout/page.tsx:60` | Post-order redirect to `/customer/orders` (404). Should be `/customer/dashboard/orders` | Need_Integration |
| N12 | /customer/checkout | `checkout/page.tsx:29-30` | buyNow only handles catalogue items; offers → "Item not found" | Need_Integration |
| N13 | /customer/settings | `useAuthStore.ts:234-239` | updateUser silently falls back to optimistic local update on API failure | Need_Integration |
| N14 | /customer/settings | `settings/page.tsx:94-98` | Push enable requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; verify env + web-push config | Need_Integration |
| B1 | /customer/support | `support/page.tsx:29-33` | Hardcoded `faqs` array → add `GET /support/faqs` | Backend_Needed |
| B2 | /customer/support | `support/page.tsx:113-118` | "Visit Help Center" → coming-soon toast; needs Help Center route/content | Backend_Needed |
| B3 | /customer/analytics | `analytics/page.tsx:49,57,66` | Trends hardcoded (+0%, 0, +₦0); backend only returns totalVisits/rewardPoints → add real trends + netSavings | Backend_Needed |
| B4 | /customer/analytics | `analytics/page.tsx:122-127` | Period select not wired to `days` query param (backend supports it) | Need_Integration |
| B5 | /customer/settings | `settings/page.tsx:385-387` | "Request Account Termination" button no onClick; `DELETE /users/profile` exists but never called | Need_Integration |
| B6 | /customer/settings | `settings/page.tsx:481-483` | 2FA toggle "Coming Soon" — no endpoint | Backend_Needed |
| B7 | /customer/settings | `settings/page.tsx:490-500` | Notifications / Linked Devices tabs "Coming Soon" | Backend_Needed |
| B8 | /customer/settings | `settings/page.tsx:334-349` | Alert matrix toggles disabled + hardcoded checked → no notification-preferences API | Backend_Needed |
| B9 | /customer/notifications | `notifications/page.tsx:155-156` | "Customize Settings" button dead | Backend_Needed |
| B10 | /customer/history | `history/page.tsx:115-117` | Row MoreVertical button dead | Backend_Needed |
| B11 | /customer/dashboard | `dashboard/page.tsx:469-472` | QR scan no-op — wire decoded code to tapDevice/flow store | Need_Integration |
| B12 | /customer/dashboard/orders | `orders/page.tsx:96` | Image fallback `/placeholder.png` doesn't exist → broken thumbnails | Backend_Needed |
| C7 | lib/api/notifications.ts | whole file | `sendVerificationEmail` is a mock (setTimeout+console.log) — don't adopt | Backend_Needed |

---

## PRIORITY 3 — Business dashboard

| # | Page | File | Issue | Type |
|---|---|---|---|---|
| D7 | /dashboard/intelligence | `intelligence/page.tsx:17-24`, `IntelligenceComponents.tsx` | "KPI OVERVIEW MOCK" + hardcoded insights; no backend module → build intelligence/insights API | Backend_Needed |
| D8 | /dashboard/customer-capture/setup | `setup/page.tsx` + `components/dashboard/capture/**` | Entire wizard local-only (store + seeded defaults); zero API calls; no backend module | Backend_Needed |
| D9 | /dashboard/catalogue/menus | `menus/page.tsx:15-20` | Hardcoded categories; save local. Backend menus API needed (or wire to catalogue categories) | Backend_Needed |
| D10 | /dashboard/automations/welcome, /birthday, /reactivation, /custom | e.g. `welcome/page.tsx:19-22` | Local useState only — backend CRUD exists (`automations.controller.ts`), NOT wired | Need_Integration |
| D11 | /dashboard/support/agents | `agents/page.tsx:17-22` | Hardcoded agents array → needs staff/user endpoint | Backend_Needed |
| D12 | /dashboard/support/automations | `automations/page.tsx` | Local welcome/offHours/faq state; no API | Backend_Needed |
| D13 | /dashboard/business-partnership/settings | `settings/page.tsx` | `toggles` local-only, not persisted | Backend_Needed |
| D14 | /dashboard/inventory/receiving + /adjustments | pages + `useInventoryStore.ts` | Movement log local-only (stock writes are real); need stock-movement-log endpoint | Backend_Needed |
| D15 | /dashboard/business-partnership/analytics | `analytics/page.tsx:43-45` | Charts fabricated (referrals=earnings/8000, growth=index, renewal=zeros) → need real referral/renewal analytics | Backend_Needed |
| D16 | /dashboard/pos/register | `register/page.tsx:167-174` | "Cash Drop" / "Print Z-Report" no onClick → need cash-drop + z-report endpoints | Backend_Needed |
| D17 | /dashboard/feedback/requests | `requests/page.tsx:14-20` | Send review request toast-only; backend feedback has only GET stats/reviews → build send endpoint | Backend_Needed |

---

## PRIORITY 4 — Admin

| # | Page | File | Issue | Type |
|---|---|---|---|---|
| A1 | /admin/messaging | `lib/api/admin.ts:174,185,186` | `GET /messaging/admin/templates` + `POST .../status` + `DELETE .../:id/delete` all wrong → align to `/messaging/templates` (GET/POST/PATCH/DELETE/:id); add template status endpoint | Need_Integration |
| A2 | /admin/loyalty/templates | `services/loyalty/hooks.ts:333,347` | reward-templates PATCH/DELETE/:apply → backend has only POST+GET | Backend_Needed |
| A3-A10 | /admin/discovery/partnerships/* (9 pages) | `partnerships/[id]`, `applications`, `disputes`, `earnings`, `compliance`, `notifications`, `analytics`, `businesses`, `businesses/[id]` | All static — only list endpoint exists (`GET /discovery/admin/partnerships`) | Backend_Needed |
| A11 | /admin/discovery | `page.tsx:248,326,399,564,613` | Static dashboard, actions toast-only → needs real discovery overview/action endpoints | Backend_Needed |
| A12 | /admin/loyalty/businesses | `page.tsx:23-29,62` | No backend loyalty admin-businesses listing | Backend_Needed |
| A13 | /admin/loyalty/monitoring | `page.tsx:9-14,39` | No backend loyalty monitoring | Backend_Needed |
| A14 | /admin/nfc-grants | `page.tsx:28-46` | Persists to localStorage (`quoteStore`); backend `/products/quotes/*` exists but ignored → wire it | Need_Integration |
| A15 | /admin/business-partnership | `page.tsx:33-40,132-138` | Tier config local-only (TIER_DEFS, saveTierEdit toast) → need tier persist endpoint | Backend_Needed |
| A16 | /admin/agent-hub | `page.tsx:18,121-141` | Conversations static; assign/status local-only → need conversation API | Backend_Needed |
| A17 | /admin/discovery/partnerships | `partnerships/page.tsx:29,66` | MOCK_PARTNERSHIPS → use `GET /discovery/admin/partnerships` | Need_Integration |
| A18 | /admin/discovery/sponsored | `sponsored/page.tsx:13,121` | MOCK_CAMPAIGNS → use `GET /discovery/admin/sponsored` | Need_Integration |
| A19 | /admin/discovery/locations | `locations/page.tsx:11,69` | MOCK_LOCATIONS → use `GET /discovery/admin/locations` | Need_Integration |
| A20 | /admin/discovery/notifications | `notifications/page.tsx:13,110` | MOCK_LOGS → use `GET /discovery/admin/notifications` | Need_Integration |
| A21 | /admin/settings | `settings/page.tsx:242-244` | POSTs fake `mockToken` to `/notifications/push-token` → use real FCM registration | Need_Integration |
| A22 | lib/api/admin.ts:16 | getStats → `GET /users/admin/stats` | No such route; dead code | Backend_Needed |

---

## PRIORITY 5 — Front-facing / public

| # | Page | File | Issue | Type |
|---|---|---|---|---|
| F1 | /b/[code]/ordering | `ordering/page.tsx:41-50,128-140,208-209,250` | Fake order (confetti + `VMP-88241`); menu uses owner-gated hooks on public page; use `POST /catalogue/orders` + `/public/catalogue/items/branch/:branchId` | Need_Integration |
| F2 | /forgot-password | `forgot-password/page.tsx:51-57` | Send link is no-op → wire `POST /auth/password-reset/request` (exists, @Public) | Need_Integration |
| F3 | /promotions + /promotions/[id] | `page.tsx:9,31-69`, `[id]/page.tsx:53-55` | MOCK_PROMOTIONS overrides real API; claim breaks (IsUUID) → use `/catalogue/offers/public` flow | Need_Integration |
| F4 | /marketplace | `page.tsx:120-141,328-355`, `ProductClient.tsx:62-65,565-584`, `lib/api/marketplace.ts:12-17` | Dead OTP/account flow; quote endpoint OWNER-only (403 for customers); fake reviews; fake pagination → add public reviews endpoints, fix role gate, wire/remove OTP | Backend_Needed |
| F5 | /user-step | `user-step/page.tsx:255-258`, `useCustomerFlowStore.ts:457-460` | Reward points + redemption fake (toast/local state) → wire to real loyalty endpoints | Need_Integration |
| F6 | /support-chat/[conversationId] | `page.tsx:119,218` | File upload + call button "coming soon" → add attachment upload + voice/video | Backend_Needed |
| F7 | /support | `page.tsx:147-152` | Live Chat / Email buttons link to `#` → wire real channels | Need_Integration |
| F8 | services/public/hooks.ts:32 | `usePublicRewards` → `/public/loyalty/rewards` | No such route (backend is `/loyalty/rewards` @Public) | Need_Integration |
| F9 | /onboarding | `onboarding/page.tsx:1735-1754` | Mock `paymentReference: 'mock-ref-...'` when Paystack key placeholder → backend treats as paid. Remove | Backend_Needed |
| F10 | [slug]/[code]/* checkout | `cart:117`, `catalogue:241`, `offers:141`, `products:211`, `offers/[id]:90`, `services/[id]:88` | Hardcoded visitor `password: '123456'` after signup — fragile contract | Need_Integration |
| F11 | /status | `status/page.tsx:6-18` | System status + incidents hardcoded while UI claims "live/60s refresh" | Backend_Needed |

---

## Verified working (no action)
Customer: cart/checkout orders, my-orders, discover, notifications, settings auth. Business: catalogue (full), POS (20 routes), inventory counting, sales/products-stock/staff/devices, compliance, engagement/forms, partnership main/wallet, discovery + qr-thrive, automations list/performance, segments, support tickets, AI. Admin: dashboard, analytics, businesses, users, devices, products/orders/quotes, subscriptions, pricing, categories, forms, support/chat-desk, notifications, credits, flow-engine, control-tower, observability, health, business-profiling, discovery sub-pages. Public: /deals, /[slug]/[code] catalogue, /tap, /forms/[key], /s/[id], /b/[code] + POS, /chat/[code], /login, /get-started, /profile-my-business, /pricing.
