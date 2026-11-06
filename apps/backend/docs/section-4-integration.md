# Section 4 integration guide — catalogue, deals, segments, wallet, boosts, promotions

How the mobile business screens in section 4 ("Business: catalogue, deals & campaigns") talk to the backend. Every endpoint below exists on `dev`. Each one lists its auth, parameters, request body, response and errors, plus the screen and draft fields it serves.

- Base URL: `{API}/api/v1` (local: `http://localhost:3002/api/v1`)
- Auth: `Authorization: Bearer <access token>` on everything here except the `public/*` routes.
- Content type: `application/json`

---

## 0. Conventions

| Topic | Rule |
|---|---|
| Money | Naira, not kobo. Paystack amounts are converted server-side. |
| Decimals on **offers** | `fixedPrice`, `discountValue` and `calculatedPrice` on offer rows come back as **strings** (`"9600.00"`), as the offer API always has. Parse with `Number()`. Everything else (stats, wallet, items, campaigns) returns numbers. |
| Dates | ISO 8601 strings. Send ISO for date params. |
| Local time | Redemption windows, claim-limit periods, daily series and "today" use **Africa/Lagos (WAT, UTC+1)**. The server is assumed to run in UTC, like the database defaults. |
| Errors | One envelope for every error. `message` is a string, or an array for validation errors (see below). |
| Roles | "Owner/Manager" means `Owner` or `Manager`. Staff can read where noted. |
| Business scope | Everything is limited to the caller's business (`businessId` from the token). An id from another business returns **404**. |

Error envelope (real response):

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-10-14T13:22:05.928Z",
  "path": "/api/v1/boosts/forecast",
  "method": "POST",
  "error": "Bad Request",
  "message": [
    "budget must not be less than 0",
    "budget must be a number conforming to the specified constraints"
  ]
}
```

Status codes used: `400` validation or rule broken · `401` no/invalid token · `403` wrong role, plan limit, or no business context · `404` not found / not yours · `409` wrong state for the action · `503` payment provider unavailable.

---

## 1. Catalogue items — new fields

`POST /catalogue/items` · `PATCH /catalogue/items/:id` (Owner/Manager/Admin, permission `inventory`). Existing fields are unchanged. New optional fields:

| Field | Type | Notes | Screen → draft field |
|---|---|---|---|
| `compareAtPrice` | number ≥ 0 \| null | Must be ≥ `price`, else 400 `compareAtPrice must be greater than or equal to price` | AddProductPricingVariants `compareAtPrice`, AddServiceDurationPricing `compareAtPrice` |
| `condition` | `new` \| `refurbished` \| `used` | Stop folding it into `tags` | AddProductBasicsCategory `condition` |
| `fulfillmentModes` | (`pickup` \| `delivery` \| `dine_in`)[] | | AddProductBranchAvailability `fulfillmentModes` |
| `pricingMode` | `uniform` \| `per_branch` | Default `uniform`. See §3. | AddProductLocationPricing `pricingMode` (`unified` → `uniform`, `custom`/`branch` → `per_branch`) |
| `audience` | string ≤ 40 | e.g. `women`, `men`, `kids`, `all` | AddServiceBasicsMedia `audience` |
| `variants` | `{ id?, name, price, compareAtPrice?, sku?, stockQuantity? }[]` | Replaces `{type,value}`; see below | AddProductPricingVariants `variants` |

**Variants.** Send `name` and `price` as numbers. Keep a variant's `id` when editing so it updates in place; ids are generated when missing. The old `{ type, value }` shape is still accepted for one release: a numeric `value` becomes the price (`{type:'Large', value:'₦4,500'}` → Large ₦4,500), otherwise `value` becomes the name at the item's price (`{type:'size', value:'Large'}`). Variants already stored in the old shape are returned in the new shape with ids `v1`, `v2`, …. The wizard's `inventory` is accepted as `stockQuantity`.

Mapper change (`catalogueDraftMappers.ts → productDraftToCreateInput`):

```ts
variants: draft.variants.map(v => ({ id: v.id, name: v.name, price: parseMoneyInput(v.price) ?? 0, stockQuantity: v.inventory })),
compareAtPrice: parseMoneyInput(draft.compareAtPrice),
condition: draft.condition || undefined,          // and drop it from tags
fulfillmentModes: draft.fulfillmentModes,
pricingMode: draft.pricingMode === 'branch' || draft.pricingMode === 'custom' ? 'per_branch' : 'uniform',
```

---

## 2. Deals (offers) — new fields and multi-branch publishing

### 2.1 Create — `POST /catalogue/offers` (Owner/Manager, `inventory`)

New body fields (all optional):

| Field | Type | Behaviour | Screen → draft field |
|---|---|---|---|
| `branchIds` | uuid[] | **Publishes to every branch.** One offer row per branch, sharing a `dealGroupId`, saved all-or-nothing. Every item must be stocked at every branch (else 400). The plan's offer limit counts one per branch. `branchId` is still required by validation; send the first branch. | CreateDealLocationAssignment / Step 3 `branchIds` (**send all of them, not `branchIds[0]`**) |
| `branchOverrides` | `{ branchId, fixedPrice?, discountValue?, quantity? }[]` | Per-branch price or voucher count | DealLocationAssignmentPricing matrix |
| `pricingType` | adds `combo`, `tiered` | `combo` needs `fixedPrice`; `tiered` needs `tiers`. Stop flattening them to percentage. | CreateDealStep1 `strategy` |
| `tiers` | `{ minQuantity ≥ 1, discountValue 0–100 }[]` | Listed price uses the lowest tier | CreateDealStep1 tiered |
| `claimLimitPeriod` | `lifetime` \| `day` \| `week` \| `month` | Window `maxClaimsPerCustomer` is counted over (Lagos calendar, weeks start Monday) | CreateDealStep2 `claimFrequency` + `maxClaimsPerMonth` → `maxClaimsPerCustomer: n, claimLimitPeriod: 'month'` |
| `allowGifting` | boolean (default true) | false → `POST /catalogue/offers/claim/gift` returns 403 `This deal cannot be gifted` | CreateDealStep2 `acceptGifting` |
| `requireGiftRecipientVerification` | boolean | Stored for the gift flow | Step2 `requireRecipientVerification` |
| `socialSharingBonus` | boolean | Stored | Step2 `allowSocialSharingBonus` |
| `autoPauseWhenSoldOut` | boolean (default true) | Deal switches to `inactive` when the last voucher is claimed | Step2 `autoPauseWhenSoldOut` |
| `redemptionChannels` | (`dine_in` \| `takeout` \| `reservation`)[] | Stored | Step2 dine-in / takeout / reservation toggles |
| `claimSteps` | string[] (≤ 10) | Stop merging them into `terms` | Step3 `claimSteps` |
| `redemptionWindows` | `{ weekdays: 0–6[], start: 'HH:mm', end: 'HH:mm' }[]` | Enforced at redeem (Lagos time, both ends inclusive, overnight windows allowed). Outside a window, redeem returns 400 `This deal can only be redeemed during: Mon, Tue, Wed, Thu, Fri 12:00–16:30 (WAT).` | DealTermsConditions redemption window |

Example request:

```json
{
  "name": "Lunch combo",
  "pricingType": "percentage_discount",
  "discountValue": 20,
  "branchId": "BRANCH-A",
  "branchIds": ["BRANCH-A", "BRANCH-B"],
  "itemIds": ["ITEM-1"],
  "maxClaimsPerCustomer": 2,
  "claimLimitPeriod": "week",
  "allowGifting": false,
  "redemptionWindows": [{ "weekdays": [1, 2, 3, 4, 5], "start": "12:00", "end": "16:30" }],
  "branchOverrides": [{ "branchId": "BRANCH-B", "discountValue": 30 }]
}
```

Response `201`: the first branch's offer (same shape as before) plus `dealGroupId` and `groupOffers` (every row created):

```json
{
  "id": "6f394163-…",
  "dealGroupId": "32ed56a4-…",
  "branchId": "BRANCH-A",
  "calculatedPrice": "9600.00",
  "allowGifting": false,
  "claimLimitPeriod": "week",
  "groupOffers": [
    { "id": "6f394163-…", "branchId": "BRANCH-A", "calculatedPrice": "9600.00" },
    { "id": "2d61f2ca-…", "branchId": "BRANCH-B", "discountValue": 30, "calculatedPrice": "8400.00" }
  ]
}
```

Store `dealGroupId`. It's the id for everything group-level below. Deals created before this change have `dealGroupId: null`; use their offer `id` wherever a `dealGroupId` is expected.

Errors: 400 `Item X is not available in branch Y` · 400 `A combo deal needs a fixedPrice` · 400 `A tiered deal needs at least one tier` · 403 plan limit (`Your plan allows N more offer(s); this deal needs one per branch (M).`).

`PATCH /catalogue/offers/:id` accepts the same new fields, for one branch row.

### 2.2 Owner's deal list — `GET /catalogue/offers/admin`

Owner/Manager/Admin/Staff. Despite the name this is the business's **own** list (not platform admin). Still a **bare array**, so existing callers keep working.

| Query | Type | Notes |
|---|---|---|
| `branchId` | uuid | One branch |
| `status` | `active` \| `inactive` | |
| `search` | string | Name contains (case-insensitive) |
| `sortBy` | `newest` (default) \| `oldest` \| `most_claimed` \| `ending_soon` | |
| `groupBy` | `deal` | One entry per multi-branch deal, with a `branches` list |
| `page`, `limit` | int (limit ≤ 100, default 20) | Omit `page` to get everything |

Each row now carries real `claimedCount` (was always 0) and `redeemedCount`, plus `views`, `likesCount`, `dealGroupId` and all the new fields. With `groupBy=deal`, counts are summed, `status` is `active` if any branch is active, and:

```json
"branches": [
  { "offerId": "…", "branchId": "…", "branchName": "Wuse", "status": "active", "calculatedPrice": "9600.00", "quantity": 10, "claimedCount": 5, "redeemedCount": 2 }
]
```

Screens: CentralDealsManagement (all three entry routes; wire Flash Radar and Campaigns to the same `useBusinessOffers` query), CentralCatalogue deal counts.

### 2.3 Group actions (Owner/Manager)

| Method & path | Body | Response |
|---|---|---|
| `PATCH /catalogue/offers/groups/:dealGroupId` | Any `PATCH /catalogue/offers/:id` field | `{ dealGroupId, offers: Offer[] }`. The same values are applied to every branch, so use §3.2 for per-branch prices. |
| `PATCH /catalogue/offers/groups/:dealGroupId/status` | `{ "status": "active" \| "inactive" }` | `{ dealGroupId, status, offerIds }` |

---

## 3. Per-branch pricing

### 3.1 Items — `GET` / `PUT /catalogue/items/:id/branch-pricing`

GET: Owner/Manager/Admin/Staff. PUT: Owner/Manager/Admin. Screens: BranchAvailabilityLocationPricing, AddProductLocationPricing, LocationAssignmentBranchPricing. **These screens' save callbacks currently pass no prices; they need to send this body.**

PUT body:

```json
{
  "pricingMode": "per_branch",
  "branches": [
    { "branchId": "BRANCH-A", "isAvailable": true },
    { "branchId": "BRANCH-B", "isAvailable": true, "price": 11000, "compareAtPrice": 13000, "stockQuantity": 9 },
    { "branchId": "BRANCH-C", "isAvailable": false }
  ]
}
```

- `isAvailable: false` removes the item from that branch. At least one branch must remain (400 `An item must stay available at one branch at least`).
- Leaving out `price`, `compareAtPrice` and `stockQuantity` means the branch uses the item's own values.
- Branches you don't list are left alone.
- In `uniform` mode, overrides are kept but not applied, so switching back restores them.
- Per-branch: compare-at price must be ≥ price (400 `Garki: compareAtPrice must be …`).

Response (GET and PUT), with every branch of the business:

```json
{
  "itemId": "…",
  "pricingMode": "per_branch",
  "basePrice": 12000,
  "baseCompareAtPrice": null,
  "branches": [
    { "branchId": "…", "branchName": "Main Branch", "isMainBranch": true, "isAvailable": true, "price": 12000, "compareAtPrice": null, "stockQuantity": null, "hasOverride": false },
    { "branchId": "…", "branchName": "Apo Branch", "isMainBranch": false, "isAvailable": true, "price": 11000, "compareAtPrice": 13000, "stockQuantity": 9, "hasOverride": true }
  ]
}
```

Customer side: `GET /public/catalogue/items/branch/:branchId` and `GET /public/catalogue/items/:id?branchId=` return the branch's price, compare-at price and stock for per-branch items. Price filters and sorting on the list still use the base price.

### 3.2 Deals — `GET` / `PUT /catalogue/offers/groups/:dealGroupId/branch-pricing`

GET: Owner/Manager/Admin/Staff. PUT: Owner/Manager. Screen: DealLocationAssignmentPricing.

```json
{
  "branches": [
    { "branchId": "BRANCH-A", "isActive": false },
    { "branchId": "BRANCH-B", "isActive": true, "discountValue": 25, "quantity": 50 },
    { "branchId": "BRANCH-C", "isActive": true, "fixedPrice": 9000 }
  ]
}
```

- `isActive: false` pauses that branch's row. Its claims are kept.
- `isActive: true` on a branch not yet in the deal **adds** it: a copy of the deal as it was before this request, with fresh view/like counters. Items must be stocked there, and the plan limit applies.
- Branches you don't list are left alone.

Response:

```json
{
  "dealGroupId": "…",
  "name": "Lunch combo",
  "pricingType": "percentage_discount",
  "branches": [
    { "offerId": "…", "branchId": "…", "branchName": "Main Branch", "isActive": true, "fixedPrice": null, "discountValue": "30.00", "calculatedPrice": 8400, "quantity": null, "claimedCount": 0, "redeemedCount": 0 }
  ]
}
```

---

## 4. Deal performance

Owner/Manager/Admin/Staff, permission `inventory`.

| Path | Use |
|---|---|
| `GET /catalogue/offers/:id/stats?from&to` | One branch row |
| `GET /catalogue/offers/groups/:dealGroupId/stats?from&to` | Whole deal, with `byBranch` |
| `GET /catalogue/offers/summary?branchId` | Deals hub header |

`from` / `to` are ISO dates. Defaults: the 30 days ending now. Longest range: 366 days.

Stats response (real):

```json
{
  "dealGroupId": null,
  "offerIds": ["5adb0dad-…"],
  "name": "Apo Family Grill Night",
  "status": "active",
  "views": 57, "likes": 7, "saves": 0,
  "claims": 0, "redeemed": 0, "expired": 0, "activeUnclaimed": 0,
  "redemptionRate": 0,
  "revenue": 0, "discountGiven": 0,
  "quantity": 40, "remaining": 40, "daysLeft": 16,
  "range": { "from": "2026-10-12T00:00:00.000Z", "to": "2026-10-14T00:00:00.000Z" },
  "series": [{ "date": "2026-10-12", "claims": 0, "redeemed": 0 }],
  "byBranch": [{ "offerId": "…", "branchId": "…", "branchName": "Apo Branch", "status": "active", "claims": 0, "redeemed": 0, "revenue": 0 }]
}
```

Field meanings:
- `claims` counts claims holding a voucher (status claimed or redeemed). That's the same rule as the voucher limit, so `remaining = quantity − claims`.
- `expired` includes claimed vouchers past their expiry.
- `redemptionRate` is a fraction from 0 to 1.
- `revenue` is the deal price × redemptions. `discountGiven` is (original item prices − deal price) × redemptions.
- `series` uses Lagos calendar days.
- Shares aren't tracked anywhere, so there is no shares figure.

Summary response:

```json
{ "branchId": null, "activeDeals": 5, "activeOffers": 5, "claimsToday": 0, "redeemedToday": 0, "netRevenue30d": 8500, "discountGiven30d": 1500 }
```

`activeDeals` counts a multi-branch deal once. `activeOffers` counts branch rows.

Screens: DealDetailsPerformance (stats), CentralDealsManagement pulse strip (summary).

---

## 5. Customer segments

`/segments`. Writes: Owner/Manager. Reads: Owner/Manager/Staff. All requests are now bounded by the caller's business. Owners without a branch see their business's segments; before this change that query returned every business's segments.

### 5.1 Types and criteria

A segment is `static` (hand-picked members, as before, via `POST/DELETE /segments/:id/members`) or `dynamic` (members computed from `criteria`). Groups are combined with AND; an empty `criteria` matches every customer the business has seen.

```json
{
  "deals":    { "offerIds": ["…"], "redeemedAtLeast": 1, "withinDays": 60 },
  "menu":     { "itemIds": ["…"], "orderedAtLeast": 2 },
  "location": { "branchIds": ["…"] },
  "recency":  { "visitedWithinDays": 30, "notVisitedForDays": 60, "minVisits": 3 },
  "spend":    { "minTotal": 50000, "minAverageTicket": 20000 }
}
```

| Group | Matches a customer who… |
|---|---|
| `deals` | claimed (or, with `redeemedAtLeast`, redeemed at least N times) any of `offerIds` — any branch of those deals — optionally within `withinDays`. Without `offerIds`, any of the business's deals. |
| `menu` | ordered at least `orderedAtLeast` (default 1) units of `itemIds`, across catalogue orders and POS sales |
| `location` | visited, bought, or claimed at one of the branches |
| `recency` | was last active within N days, inactive for N+ days, or had at least N visits/purchases |
| `spend` | spent at least `minTotal` in total, or averaged `minAverageTicket` per purchase |

"Activity" means POS sales, catalogue orders, visits, and deal claims by signed-in customers. Anonymous claims can't be targeted.

### 5.2 Endpoints

| Method & path | Body / query | Response |
|---|---|---|
| `POST /segments` | `{ name, description?, branchId?, type?: 'static'\|'dynamic', criteria? }`. `criteria` is required for dynamic. | Segment, with `size` computed |
| `PATCH /segments/:id` | Any of the above | Segment |
| `GET /segments?branchId` | | Segment[] with `type`, `criteria`, `size`, `lastComputedAt`. Dynamic sizes refresh when older than 10 minutes. |
| `POST /segments/preview` | `{ "criteria": { … } }` | `{ size, reachableByPush, reachableBySms, reachableByEmail }`. Nothing is saved; call it as the builder changes. |
| `GET /segments/criteria-options` | | Chips for the builder (below) |
| `GET /segments/:id/insights` | `branchId?` | Below |
| `POST/DELETE /segments/:id/members` | `{ userIds }` | Static only. On a dynamic segment: 400 `Members of a dynamic segment come from its criteria; edit the criteria instead`. |

`criteria-options` response:

```json
{
  "deals": [{ "id": "…", "name": "Apo Family Grill Night" }],
  "menuItems": [{ "id": "…", "name": "Margherita" }],
  "branches": [{ "id": "…", "name": "Main Branch" }],
  "recency": [{ "id": "active_30", "label": "Active in the last 30 days", "criteria": { "visitedWithinDays": 30 } }],
  "spend": [{ "id": "high_ticket", "label": "Average ticket ₦20,000+", "criteria": { "minAverageTicket": 20000 } }]
}
```

`insights` response:

```json
{
  "segmentId": "…", "name": "Weekend Dinner Patrons", "type": "dynamic",
  "size": 436, "reachableByPush": 310, "reachableBySms": 402, "reachableByEmail": 380,
  "totalSpend": 3280000, "avgOrderValue": 11200, "visitFrequency": 2.4,
  "spendDelta": 0.12, "aovDelta": -0.03,
  "branchSplit": [{ "branchId": "…", "name": "Apo Branch", "percent": 75 }],
  "favourites": [{ "itemId": "…", "name": "Dry-aged ribeye", "orders": 88 }],
  "samplePatrons": [{ "userId": "…", "name": "Ada Obi", "avatarUrl": null, "lastVisit": "2026-10-12T19:04:00.000Z", "spend": 142500 }]
}
```

`spendDelta` and `aovDelta` compare the last 30 days with the 30 before, as a fraction. They're `null` when there's nothing to compare against.

Screens: CustomerSegments, CreateCustomSegment (preview + options + create), SegmentAudienceDetails (insights), CampaignStep3Audience (segment list + preview).

---

## 6. Ad wallet

`/ad-wallet`, Owner/Manager. This is a prepaid **naira** balance for boosts and promotions, separate from messaging credits (`/credits`). `spendable = balance − reserved`, where `reserved` is held for running campaigns.

| Method & path | Body / query | Response |
|---|---|---|
| `GET /ad-wallet` | | `{ walletRef, balance, reserved, spendable, currency: 'NGN' }` |
| `GET /ad-wallet/transactions` | `type?` (`topup`\|`bonus`\|`reserve`\|`spend`\|`release`\|`adjustment`), `page`, `limit` | `{ data: [{ id, type, amount, direction: 'credit'\|'debit'\|'adjustment', description, reference, campaignId, balanceAfter, reservedAfter, createdAt }], total, page, limit, hasNextPage }` |
| `GET /ad-wallet/prepacks` | | `[{ id: '10k', amount: 10000, bonus: 500, label, tier }, { id: '25k', … bonus: 2000 }, { id: '50k', … bonus: 5000 }]` |
| `POST /ad-wallet/top-up` | `{ prepackId }` **or** `{ amount }` (₦2,000–₦5,000,000, no bonus), `callbackUrl?` | `{ reference, amount, bonus, accessCode, authorizationUrl }` |
| `POST /ad-wallet/top-up/:reference/confirm` | | `{ reference, status: 'completed'\|'pending', wallet }` |

Top-up flow:
1. `POST /ad-wallet/top-up` and keep `reference`.
2. Open Paystack with `accessCode` (in-app SDK) or `authorizationUrl` (web view).
3. When Paystack returns, call `POST /ad-wallet/top-up/:reference/confirm`. It's safe to call repeatedly; `pending` means not paid yet.
4. The Paystack webhook credits the wallet too, so a lost app session still gets credited. Each reference is credited only once; a bundle bonus arrives as a separate `bonus` row.

The account needs an email to pay by card (400 otherwise). If Paystack can't be reached, the response is 503.

Screen: BoostWallet (balance, prepacks, history, top-up). The funding step of CampaignStep5 and BoostPreviewPayment also uses it.

---

## 7. Boosts and promotion campaigns

`/boosts` (Boost wizard) and `/promotions` (Campaign wizard) have **the same routes and lifecycle**. They differ only in required fields. Owner/Manager.

### 7.1 Lifecycle

```
Draft ──launch──▶ Active ──pause──▶ Paused ──resume──▶ Active ──end/auto──▶ Ended
           │                                     ▲
           └──▶ Pending (future startAt, or card top-up not yet paid) ──▶ Active
```

- **Launch** reserves the whole budget from the wallet and writes a billing invoice (visible in the admin console).
- **Spend** is paced **evenly over the run** by an hourly job. Nothing yet charges per impression, so pacing is linear.
- **Pause** stops spending but keeps the reserve. **Resume** pushes the schedule back by the time spent paused, so the campaign is neither charged for nor shortened by the pause.
- **End**, manually or when the run finishes, returns the unspent budget to the wallet.
- **Auto-renew** (`schedule.autoRenew`) launches a fresh copy for the same duration if the wallet can fund it. The copy has `renewedFromId` set.

### 7.2 Routes

| Method & path | Body / query | Notes |
|---|---|---|
| `GET /` | `status?`, `page`, `limit` | `{ data: Campaign[], total, page, limit, hasNextPage }` |
| `GET /summary` | | `{ live, scheduled, paused, drafts, ended, totalBudget, totalSpent, audienceReached, claims, redemptions, revenue }` |
| `GET /options` | | Choices for the wizard (below) |
| `GET /eligible-assets` | | `[{ type: 'deal'\|'product'\|'service'\|'profile', id, title, image, price, wasPrice, priorClaims }]` |
| `POST /forecast` | `{ budget? \| dailyBudget?, durationDays?=7, radiusKm?=3 }` | Estimate (below) |
| `POST /` | Any draft fields | Creates a `Draft`. Call it on the first step. |
| `GET /:id` | | Campaign |
| `PATCH /:id` | Any draft fields | Save each wizard step. After launch only `name` and `placements` can change (409 otherwise). |
| `DELETE /:id` | | Drafts only (409 otherwise) |
| `POST /:id/launch` | `{ fundingSource?: 'wallet'\|'card', callbackUrl? }` | See §7.4 |
| `POST /:id/pause` · `/resume` · `/end` | | 409 when the state doesn't allow it |
| `GET /:id/stats` | | See §7.5 |

### 7.3 Draft fields (`POST /` and `PATCH /:id`)

| Field | Type | Boost wizard | Campaign wizard |
|---|---|---|---|
| `name` | string ≤ 120 | ✓ | ✓ |
| `goalId` | `claims`\|`views`\|`profile`\|`footfall` | **required** (BoostGoalAudience) | — |
| `objective` | `customers`\|`deal`\|`visibility`\|`products`\|`orders`\|`visits` | — | **required** (Step 1) |
| `assets` | `{ type: 'deal'\|'product'\|'service'\|'profile', id }[]` | **exactly 1** (BoostEngine "Change Deal") | **≥ 1** (Step 2) |
| `audience` | `{ strategy, segmentIds?, cohorts?, branchIds?, clusterIds?, radiusKm? }` | `strategy`: `nearby`\|`districts`\|`clusters` | `strategy`: `nearby`\|`segments`; `cohorts`: `vip`\|`regulars`\|`new`\|`dormant` (Step 3) |
| `placements` | (`feed`\|`home`\|`push`\|`search`)[] | ✓ | ✓ |
| `schedule` | `{ durationDays (1–90, required), instantLaunch?, startAt?, dayparting?, windows?: ('lunch'\|'dinner'\|'late')[], weekdays?: 0–6[], autoRenew? }` | BoostBudgetSchedule | Step 4 |
| `budgetMode` | `total`\|`daily` | ✓ | Step 5 mode |
| `budget` | number | total mode | total mode |
| `dailyBudget` | number | daily mode | daily mode |
| `branchId` | uuid | optional | optional |

Assets must be the business's own listings (400 `deal … is not one of your listings`). For `profile`, the id is the business id. The campaign's `budget` is always the total; in daily mode it's `dailyBudget × durationDays`. The minimum total budget is ₦2,000.

Campaign response:

```json
{
  "id": "…", "kind": "promotion", "name": "Smoke promo", "status": "Draft",
  "objective": "deal", "goalId": null,
  "assets": [], "audience": { "strategy": "nearby", "radiusKm": 3 }, "placements": ["feed", "push"],
  "schedule": { "durationDays": 7 }, "budgetMode": "total", "budget": 15000, "dailyBudget": null,
  "spent": 0, "remaining": 15000, "fundingSource": "wallet",
  "awaitingPayment": false, "paymentReference": null, "branchId": null,
  "startDate": null, "endDate": null, "launchedAt": null,
  "impressions": 0, "clicks": 0, "conversions": 0,
  "createdAt": "…", "updatedAt": "…"
}
```

### 7.4 Launch and funding

- **Wallet** (default): reserves the budget. Response: the campaign, `Active` (or `Pending` if `schedule.startAt` is in the future). If the wallet is short: 400 `Insufficient wallet balance: ₦5,000 available, ₦10,000 needed`.
- **Card** (`fundingSource: 'card'`): if the wallet already covers the budget, it behaves like wallet funding. Otherwise it opens a top-up for **only the shortfall** (at least ₦2,000) and returns the campaign in `Pending` with `awaitingPayment: true` plus `checkout: { reference, amount, bonus, accessCode, authorizationUrl }`. Open Paystack as in §6. The campaign launches **by itself** once the top-up is credited (webhook or `confirm`). Poll `GET /:id` until `status` is `Active`.
- If anything required is missing: 400 `Before launching, add: exactly one asset, goalId, a budget of at least ₦2,000` (lists all of them).

Screens: BoostPreviewPayment (`onLaunch(methodId)` → `fundingSource`), CampaignStep6Review (launch), CampaignStep5Budget (funding choice).

### 7.5 Stats — `GET /:id/stats`

```json
{
  "id": "…", "kind": "boost", "status": "Active",
  "kpis": { "budget": 10000, "spent": 2000, "left": 8000, "percentConsumed": 20, "redemptions": 0, "grossRevenue": 0, "reach": 0, "returnOnSpend": 0 },
  "funnel": [
    { "id": "impressions", "label": "Impressions", "value": 0 },
    { "id": "taps", "label": "Taps & views", "value": 0 },
    { "id": "saves", "label": "Saves", "value": 0 },
    { "id": "claims", "label": "Claims", "value": 0 },
    { "id": "redeemed", "label": "Redeemed", "value": 0 }
  ],
  "rhythm": [{ "hour": 13, "claims": 4 }],
  "byBranch": [{ "branchId": "…", "name": "Apo Branch", "claims": 4 }],
  "series": [{ "date": "2026-10-14", "spend": 2000, "claims": 4 }]
}
```

Claims, redemptions, revenue, saves, `rhythm` (claims by Lagos hour) and `byBranch` come from the **promoted deals during the campaign's run**, counting every branch of a deal. `series` combines daily spend from the wallet ledger with claims. Screen: BoostPerformance.

### 7.6 Options and forecast

`GET /boosts/options`:

```json
{
  "goals": [{ "id": "claims", "label": "More Deal Claims & Sales" }],
  "audienceScopes": [{ "id": "nearby", "label": "Nearby Customers" }],
  "radiusKm": [1, 3, 5, 10],
  "placements": [{ "id": "feed", "label": "Deal Discovery Feed" }],
  "daypartWindows": [{ "id": "lunch", "label": "Lunch Rush", "start": "11:30", "end": "15:30" }],
  "durationsDays": [3, 5, 7, 14, 30],
  "budgetModes": ["total", "daily"],
  "budgetTiers": [{ "id": "10", "amount": 10000, "label": "Starter" }],
  "minBudget": 2000
}
```

`GET /promotions/options` has `objectives`, `strategies`, `cohorts` and campaign `budgetTiers` (15k / 35k / 70k) instead of `goals` and `audienceScopes`.

`POST /forecast` (real response for ₦20,000 over 5 days within 3 km):

```json
{ "budget": 20000, "durationDays": 5, "dailyPace": 4000, "radiusKm": 3, "reachMin": 8400, "reachMax": 13200, "claimsMin": 63, "claimsMax": 121, "audienceCapped": false, "isEstimate": true }
```

The forecast is calibrated to the wizard's published tiers and capped by an estimate of how many people live within the radius (`audienceCapped`). Show it as an **estimate**. Screens: BoostGoalAudience / BoostBudgetSchedule reach panels, CampaignStep3/5/6 forecast cards.

---

## 8. Screen → endpoint map

| Screen | Endpoints |
|---|---|
| AddProductBasicsCategory / BasicsMedia / PricingVariants, AddService × 3 | `POST/PATCH /catalogue/items` (new fields §1) |
| AddProductBranchAvailability, AddProductLocationPricing, BranchAvailabilityLocationPricing, LocationAssignmentBranchPricing | `GET/PUT /catalogue/items/:id/branch-pricing` |
| ReviewProductSummary, ReviewServiceSummary, ProductPublished × 2, ServicePublishedStatus | unchanged create/update; drop mock fallbacks |
| AddProductsOrServices | `GET /catalogue/items` (replace mock `catalogItems`) |
| CreateDealStep1–4, CreateDealOfferAutoImported, CreateDealLocationAssignment | `POST /catalogue/offers` (§2.1, send all `branchIds`) |
| DealLocationAssignmentPricing | `GET/PUT /catalogue/offers/groups/:id/branch-pricing` |
| CentralDealsManagement (all entries) | `GET /catalogue/offers/admin`, `GET /catalogue/offers/summary`, group status/edit |
| DealDetailsPerformance | `GET /catalogue/offers/groups/:id/stats` |
| CustomerSegments, CreateCustomSegment, SegmentAudienceDetails | `/segments`, `/segments/preview`, `/segments/criteria-options`, `/segments/:id/insights` |
| CampaignsHub | `GET /promotions`, `GET /promotions/summary` |
| CampaignStep1–6 | `/promotions` draft → `PATCH` per step → `/forecast` → `/:id/launch` |
| BoostEngine, BoostGoalAudience, BoostBudgetSchedule, BoostPreviewPayment | `/boosts` (same flow), `/boosts/options`, `/boosts/forecast`, `/boosts/eligible-assets` |
| BoostPerformance | `GET /boosts/:id/stats`, pause / resume / end |
| BoostWallet | `/ad-wallet`, `/ad-wallet/transactions`, `/ad-wallet/prepacks`, top-up + confirm |

---

## 9. Known limits

- **Sponsored delivery isn't built.** Nothing yet serves boosted or promoted content in the consumer feeds or records impressions and taps, so `impressions`, `clicks` and `reach` stay 0 until that exists. Claims, redemptions, revenue and saves are real (from the promoted deals). Spend is paced evenly over the run.
- **Shares** aren't tracked anywhere, so there's no shares metric.
- The public item list filters and sorts by **base** price; per-branch prices are applied to the returned page.
- Offer money fields are strings (see §0).
