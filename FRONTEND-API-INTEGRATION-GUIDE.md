# VemTap Frontend Integration Guide — Deal Engagement & Public Discovery

This guide documents the backend capabilities built to power the deals engagement and discovery features, and how the frontend should consume them. Everything here is implemented in `apps/backend` (NestJS). No backend changes are required to use it.

**Base URL:** all routes live under `/api/v1` (the frontend `api` client already prefixes this via `@/lib/api`).

**Auth model:** "Public" endpoints work without a token (a valid JWT is *accepted* when present, enabling user-specific fields). "Auth" endpoints return `401` without a valid `Authorization: Bearer <token>`.

---

## Part 1 — Deal Engagement (reviews, likes/dislikes, saves)

Implemented in `apps/backend/src/modules/deal-engagement`.

### 1.1 Data model

- `deal_reviews` — one review per deal, with `status` (`pending` / `approved` / `rejected`) and soft delete. New reviews **always start as `pending`** and are only publicly visible after an admin approves them.
- `deal_review_likes` — per-user like on a review (`UNIQUE(review_id, user_id)`).
- `deal_reactions` — **unified like/dislike** on a deal (`UNIQUE(offer_id, user_id)`, `type` ∈ `like` | `dislike`). A user can never both like and dislike the same deal.
- `deal_saves` — per-user saved deals (`UNIQUE(offer_id, user_id)`).
- `catalogue_offers` gained denormalized counters: `likesCount`, `dislikesCount`, `reviewsCount` (maintained automatically; `reviewsCount` counts **approved** reviews only).

### 1.2 Endpoints

#### Reviews

| Method | Route | Auth | Notes |
|--------|-------|------|------|
| `POST` | `/deals/:offerId/reviews` | Public (optional) | Submit a review |
| `GET` | `/deals/:offerId/reviews?page=1&limit=10` | Public | Approved reviews, newest first |
| `GET` | `/deals/:offerId/reviews/preview` | Public | Top 3 approved reviews (by likes) |
| `POST` | `/deals/:offerId/reviews/:reviewId/like` | Auth | Toggle a like on a review |
| `GET` | `/deals/:offerId/engagement` | Public | Aggregated counts + user state |

**`POST /deals/:offerId/reviews`** — body:
```json
{ "comment": "Fantastic deal, redeemed easily!", "name": "Chidi O." }
```
- `comment` required (1–1000 chars, trimmed). `name` optional for logged-in users (falls back to their profile name); **required for anonymous reviewers**.
- Anti-spam: authenticated users get **1 review per user per offer**; anonymous users get **1 review per IP per 24 hours**. Duplicates return `409 Conflict` with a message — surface this to the user instead of an error toast.
- Response `201`:
```json
{
  "id": "9f8b45b1-...",
  "reviewerName": "Chidi O.",
  "comment": "Fantastic deal, redeemed easily!",
  "status": "pending",
  "createdAt": "2026-08-27T10:15:30.000Z"
}
```
- Because the review is `pending`, **do not** append it to the public list yet. Show an inline "Thanks — your review is awaiting moderation" state.

**`GET /deals/:offerId/reviews?page=1&limit=10`** — response:
```json
{
  "reviews": [
    {
      "id": "9f8b45b1-...",
      "reviewerName": "Chidi O.",
      "comment": "Fantastic deal, redeemed easily!",
      "likesCount": 4,
      "createdAt": "2026-08-27T10:15:30.000Z",
      "isLiked": true
    }
  ],
  "total": 37,
  "page": 1
}
```
- Only `approved` reviews are returned.
- `isLiked` is present **only when the request carries a valid JWT**. For anonymous requests it's omitted — treat as `false`.

**`GET /deals/:offerId/reviews/preview`** — response:
```json
{ "reviews": [ { "id": "...", "reviewerName": "...", "comment": "...", "likesCount": 4, "createdAt": "..." } ] }
```
- Top 3 approved reviews ordered by likes, then recency. Use for a "What people are saying" section on the deal detail page.

**`POST /deals/:offerId/reviews/:reviewId/like`** — toggle. Response:
```json
{ "liked": true, "likesCount": 5 }
```
- Calling again removes the like (`{ "liked": false, "likesCount": 4 }`).
- Returns `404` for reviews that are not approved or don't belong to `:offerId` — the client should react by refreshing the review list.

#### Reactions (like / dislike on a deal)

| Method | Route | Auth | Notes |
|--------|-------|------|------|
| `POST` | `/deals/:offerId/reactions` | Auth | Set / toggle reaction |
| `GET` | `/deals/:offerId/reaction-status` | Auth | Current user reaction + counts |
| `GET` | `/deals/:offerId/engagement` | Public | Counts (+ user state when authed) |

**`POST /deals/:offerId/reactions`** — body `{ "type": "like" | "dislike" }`. Response:
```json
{ "type": "like", "likesCount": 12, "dislikesCount": 2 }
```
Toggle semantics:
- No existing reaction → adds it, `type` = requested type.
- Same type again → removes it, `type` = `null`.
- Different type → switches, `type` = new type.

**`GET /deals/:offerId/reaction-status`** — same shape: `{ type: "like" | "dislike" | null, likesCount, dislikesCount }`.

**`GET /deals/:offerId/engagement`** — response:
```json
{ "likesCount": 12, "dislikesCount": 2, "reviewsCount": 37, "type": "like", "isSaved": false }
```
- `type` and `isSaved` are **only present when authenticated**; omit/false for anonymous. Use this single call to hydrate the deal detail page (like button state, save state, counts, review count).

#### Saves (bookmarks)

| Method | Route | Auth | Notes |
|--------|-------|------|------|
| `POST` | `/deals/:offerId/save` | Auth | Toggle save |
| `GET` | `/deals/:offerId/save-status` | Auth | `{ "isSaved": boolean }` |

**`POST /deals/:offerId/save`** → `{ "saved": true }` / `{ "saved": false }` (toggle).

#### Admin moderation (`/admin/reviews`)

All require an **Admin** role token. Used by a moderation queue page.

| Method | Route | Notes |
|--------|-------|-------|
| `GET` | `/admin/reviews?status=pending&page=1&limit=20` | List; `status` optional (`pending`/`approved`/`rejected`) |
| `POST` | `/admin/reviews/:id/approve` | `{ "id": "...", "status": "approved" }` |
| `POST` | `/admin/reviews/:id/reject` | `{ "id": "...", "status": "rejected" }` |
| `DELETE` | `/admin/reviews/:id` | `204 No Content` (soft delete) |

`GET /admin/reviews` item shape:
```json
{
  "id": "...", "offerId": "...", "offerName": "Summer Deal",
  "reviewerName": "Chidi O.", "comment": "...", "likesCount": 0,
  "status": "pending", "userId": "...", "ipHash": "abc123...", "createdAt": "..."
}
```

### 1.3 Frontend implementation notes

- Put new hooks under `apps/VemTap/services/deals/` (or a new `services/deals/engagement.ts`), following the existing `usePublicOffers` pattern with `@tanstack/react-query` and the `api` client.
- **Query keys:** scope by offer id, e.g. `['deals', 'engagement', offerId]`, `['deals', 'reviews', offerId, page]`, `['deals', 'reaction-status', offerId]`.
- **Mutations invalidate:** after a successful like/save/reaction mutation, `invalidateQueries` the engagement + reviews keys for that offer so counts stay consistent.
- **Optimistic updates:** for like/save toggles, update local state immediately, then reconcile with the server response (which returns the authoritative counts). If the user is anonymous and taps a like/save button, the request will `401` — route them to login.
- **409 on duplicate review:** catch `ConflictException` and show the message ("You've already reviewed this deal" / "A review from this device was already submitted in the last 24 hours") rather than a generic error.
- **Pending reviews:** the review submit response has `status: 'pending'`. Do not optimistically append it to the approved list.
- **Pagination:** reviews list returns `total` and `page`; load more with `page+1`, `limit` (max 50).
- **Business slug:** derived by the frontend from `offer.branch.username || offer.branch.uniqueCode` (see `app/deals/page.tsx` → `toPromotionBusiness`). Deal URLs look like `/deals/{businessSlug}/{offerId}`.

---

## Part 2 — Public Discovery (businesses, search, stats, sorts)

Implemented in `apps/backend/src/modules/public-discovery` + a change to `catalogue-offer.service.ts`.

### 2.1 Recently joined businesses

**`GET /public/businesses?sortBy=newest&limit=8`** (Public) — response:
```json
{
  "businesses": [
    {
      "id": "biz-1",
      "name": "The Azure Bistro",
      "logoUrl": "https://example.com/logo.png",
      "description": "Fine dining in Ikeja",
      "address": "42 Admiralty Way, Lekki",
      "state": "Lagos",
      "city": "Ikeja",
      "categoryId": "cat-1",
      "categoryName": "Restaurant",
      "isVerified": true,
      "slug": "azure-bistro",
      "branchCode": "BR123ABC"
    }
  ]
}
```
- Returns **ACTIVE** businesses, newest first. `limit` default `8`, max `50`.
- `slug` is the main branch username (or its `uniqueCode`) — use it for linking to a business page / `/deals/{slug}`.

### 2.2 Unified search

**`GET /public/search?q=keyword&limit=8`** (Public) — response:
```json
{
  "deals": [ /* DealOffer[], same shape as /catalogue/offers/public items */ ],
  "businesses": [ /* same shape as /public/businesses items */ ],
  "categories": [ { "id": "cat-1", "name": "Restaurant", "description": "Eat out" } ]
}
```
- Each group is capped at `limit` (default `8`, max `20`).
- An empty/absent `q` returns all three groups empty — guard the UI against that.
- Deals search matches offer name, offer description, **and** business name; the returned deals are identical to the feed shape so existing deal cards can render them unchanged.

### 2.3 Platform stats

**`GET /public/stats`** (Public) — response:
```json
{ "totalBusinesses": 1200, "totalActiveDeals": 340, "totalClaims": 15200, "totalBranches": 2100 }
```
- Cached server-side for ~5 minutes — don't hammer it on mount of multiple components; fetch once per session/page.

### 2.4 Deal feed sorts (`/catalogue/offers/public`)

The public feed now supports two new sort modes in addition to the existing ones:

| `sortBy` | Behavior |
|----------|----------|
| `newest` (default) | `createdAt` DESC |
| `price_asc` / `price_desc` | by `calculatedPrice` |
| `trending` | by `views` DESC |
| **`popular`** | by **claimedCount** DESC (most claimed first) |
| **`featured`** | by computed score `views + claimedCount * 10` DESC |

Example:
```
GET /catalogue/offers/public?sortBy=popular&page=1&limit=10
```
Response (same `PaginatedOffersResponse` shape used today):
```json
{
  "data": [ /* DealOffer[] */ ],
  "total": 340,
  "page": 1,
  "limit": 10
}
```
- For `popular`/`featured`, the response contains `data/total/page/limit` (no `cursor` fields). For the other sorts the existing cursor fields are still returned. The frontend `PaginatedOffersResponse` type (`{ data, total, page, limit }`) already matches.
- **`DealOffer` fields available** for rendering (from `mapPublicOffers`): `id, name, description, pricingType, fixedPrice, percentageOff, calculatedPrice, originalPrice, discountPercent, status, branchId, branchName, categoryName, items, claimedCount, totalLimit, remainingLimit, startDate, endDate, isExpired, maxClaimsPerCustomer, audienceTarget, terms, claimCodePrefix`.
- Use `popular` for the "Sorted by popularity" hero/trending section on `/deals` and `/customer/discover`, and `featured` for an editorial "Featured deals" row.

### 2.5 Frontend implementation notes

- Add hooks in `apps/VemTap/services/public/` (there's already `services/public/hooks.ts`) or `services/deals/`:
  - `usePublicBusinesses({ sortBy, limit })` → `api.get('/public/businesses', { params })`.
  - `usePublicSearch(q, limit)` → `api.get('/public/search', { params: { q, limit } })`, `enabled: !!q`.
  - `usePublicStats()` → `api.get('/public/stats')`, `staleTime: 5 * 60_000`.
  - `usePublicOffers({ sortBy: 'popular' | 'featured', ... })` — just extend the existing `DealsQueryParams.sortBy` usage; no endpoint change needed.
- **Search debounce:** debounce `q` (~300ms) and cancel stale queries (`queryKey` already includes `q`).
- **Empty states:** search returns empty groups — show a "no results" state.
- **Stats:** use `staleTime`/`gcTime` so the CTA numbers don't refetch on every navigation.

---

## Suggested frontend files to touch

| Concern | File |
|---------|------|
| Deal engagement hooks/types | `apps/VemTap/services/deals/` (new `engagement.ts`, `types.ts`) |
| Public discovery hooks/types | `apps/VemTap/services/public/` |
| Deal detail page (reviews, like, save) | `apps/VemTap/app/deals/[slug]/[id]/page.tsx` |
| Deal feed (popular/featured sorts) | `apps/VemTap/app/deals/page.tsx`, `apps/VemTap/app/customer/discover/page.tsx` |
| Homepage business CTA + stats | homepage hero section |
| Admin review moderation queue | `apps/VemTap/components/admin/` or an admin page |

## API cheat-sheet

```
# Deal engagement
POST   /deals/:offerId/reviews                    # submit (public, optional auth)
GET    /deals/:offerId/reviews                    # approved reviews, paginated
GET    /deals/:offerId/reviews/preview            # top 3 approved
POST   /deals/:offerId/reviews/:reviewId/like     # toggle review like (auth)
POST   /deals/:offerId/reactions                  # { type: like|dislike } (auth)
GET    /deals/:offerId/reaction-status            # (auth)
POST   /deals/:offerId/save                       # toggle save (auth)
GET    /deals/:offerId/save-status                # (auth)
GET    /deals/:offerId/engagement                 # counts + user state (public)
GET    /admin/reviews?status=&page=&limit=        # admin
POST   /admin/reviews/:id/approve                 # admin
POST   /admin/reviews/:id/reject                  # admin
DELETE /admin/reviews/:id                         # admin (soft delete)

# Public discovery
GET    /public/businesses?sortBy=newest&limit=8
GET    /public/search?q=&limit=8
GET    /public/stats

# Deal feed sorts
GET    /catalogue/offers/public?sortBy=popular|featured&page=&limit=
```