# Deal Reviews & Platinum Moderation Integration Guide

This guide documents the API endpoints, payload structures, status lifecycles, and TypeScript integration examples for the frontend team to implement **Deal Review Ratings (1–5 Stars)** and **Platinum-Gated Review Moderation**.

---

## 1. Overview & Key Rules

1. **Ratings (1–5 Stars, Optional)**:
   - Customers can provide an optional numeric star rating `1` to `5` when submitting a review.
   - The backend tracks each review's rating and automatically calculates the deal's `averageRating` across all approved reviews.
2. **Review Moderation Toggle (`requireReviewApproval`)**:
   - **Default (`false`)**: Reviews are auto-approved (`status: approved`) upon creation and immediately appear on public deal pages.
   - **Enabled (`true`)**: Reviews enter `status: pending` and require the merchant (or admin) to approve them before public display.
   - **Platinum Gating**: Only businesses subscribed to the **Platinum** plan are permitted to enable `requireReviewApproval = true`. Attempting to enable it on lower tiers returns `403 Forbidden`.
3. **Existing Reactions System**:
   - Deal-level reactions (`likesCount`, `dislikesCount`, `/save`) and review-level upvotes (`likesCount`, `isLiked`) remain fully operational alongside star ratings.

---

## 2. Public / Customer Endpoints

### 2.1 Submit a Deal Review
Submit a review (and optional rating) for a deal offer.

- **Method**: `POST`
- **Path**: `/api/v1/deals/:offerId/reviews`
- **Auth**: Public (Optional Bearer token — if authenticated, uses the user's name; if anonymous, `name` is required).

#### Request Body
```json
{
  "name": "Chidi Okafor",
  "comment": "Super quick redemption and tasty combo deal!",
  "rating": 5
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `comment` | `string` | **Yes** | Review comment (1–1000 characters). |
| `name` | `string` | Conditional | Reviewer name (required for anonymous users; optional for authenticated users). |
| `rating` | `number` | **No** | Integer from `1` to `5`. |

#### Response (`201 Created`)
```json
{
  "id": "7b8f9e61-9c3f-42e8-b789-0c3dfc2b1234",
  "reviewerName": "Chidi Okafor",
  "comment": "Super quick redemption and tasty combo deal!",
  "rating": 5,
  "status": "approved",
  "createdAt": "2026-08-28T15:30:00.000Z"
}
```
*Note: If the business has moderation enabled, `status` will be `"pending"`.*

---

### 2.2 List Approved Deal Reviews (Paginated)
Fetch approved reviews for a deal offer.

- **Method**: `GET`
- **Path**: `/api/v1/deals/:offerId/reviews?page=1&limit=10`
- **Auth**: Public (If Bearer token provided, `isLiked` indicates whether the logged-in user upvoted the review).

#### Query Parameters
| Param | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `number` | `1` | Page number. |
| `limit` | `number` | `10` | Reviews per page (max 50). |

#### Response (`200 OK`)
```json
{
  "reviews": [
    {
      "id": "7b8f9e61-9c3f-42e8-b789-0c3dfc2b1234",
      "reviewerName": "Chidi Okafor",
      "comment": "Super quick redemption and tasty combo deal!",
      "rating": 5,
      "likesCount": 3,
      "createdAt": "2026-08-28T15:30:00.000Z",
      "isLiked": false
    }
  ],
  "total": 24,
  "page": 1
}
```

---

### 2.3 Deal Reviews Preview (Top 3)
Fetch top 3 approved reviews ordered by upvotes and recency.

- **Method**: `GET`
- **Path**: `/api/v1/deals/:offerId/reviews/preview`
- **Auth**: Public

#### Response (`200 OK`)
```json
{
  "reviews": [
    {
      "id": "7b8f9e61-9c3f-42e8-b789-0c3dfc2b1234",
      "reviewerName": "Chidi Okafor",
      "comment": "Super quick redemption and tasty combo deal!",
      "rating": 5,
      "likesCount": 12,
      "createdAt": "2026-08-28T15:30:00.000Z"
    }
  ]
}
```

---

### 2.4 Deal Engagement Summary
Fetch aggregated deal counters including likes, dislikes, total reviews count, and average rating.

- **Method**: `GET`
- **Path**: `/api/v1/deals/:offerId/engagement`
- **Auth**: Public (Authenticated optional for user reaction status)

#### Response (`200 OK`)
```json
{
  "likesCount": 42,
  "dislikesCount": 2,
  "reviewsCount": 18,
  "averageRating": 4.85,
  "type": "like",
  "isSaved": true
}
```

---

### 2.5 Upvote / Like a Review
Toggle upvote on a review.

- **Method**: `POST`
- **Path**: `/api/v1/deals/:offerId/reviews/:reviewId/like`
- **Auth**: Bearer Token (Authenticated)

#### Response (`201 Created`)
```json
{
  "liked": true,
  "likesCount": 4
}
```

---

## 3. Merchant Dashboard Endpoints (Business Owner / Manager)

These endpoints allow merchants to manage and moderate reviews for all deals belonging to their business.

### 3.1 List Business Deal Reviews
- **Method**: `GET`
- **Path**: `/api/v1/deals/business/reviews`
- **Auth**: Bearer Token (`OWNER` or `MANAGER`)

#### Query Parameters
| Param | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `status` | `string` | - | Filter by status: `pending`, `approved`, `rejected`. |
| `offerId` | `string` | - | Filter reviews for a specific deal UUID. |
| `page` | `number` | `1` | Page number. |
| `limit` | `number` | `20` | Items per page (max 50). |

#### Response (`200 OK`)
```json
{
  "reviews": [
    {
      "id": "7b8f9e61-9c3f-42e8-b789-0c3dfc2b1234",
      "offerId": "9a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
      "offerName": "Family Burger Combo",
      "reviewerName": "Ada Lovelace",
      "comment": "Delicious food and friendly staff!",
      "rating": 5,
      "likesCount": 0,
      "status": "pending",
      "userId": "user-uuid-or-null",
      "ipHash": "a6c2...e81",
      "createdAt": "2026-08-28T16:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### 3.2 Approve a Review
Publish a pending or rejected review.

- **Method**: `POST`
- **Path**: `/api/v1/deals/business/reviews/:id/approve`
- **Auth**: Bearer Token (`OWNER` or `MANAGER`)

#### Response (`201 Created`)
```json
{
  "id": "7b8f9e61-9c3f-42e8-b789-0c3dfc2b1234",
  "status": "approved"
}
```

---

### 3.3 Reject a Review
Reject a pending review so it remains hidden from public view.

- **Method**: `POST`
- **Path**: `/api/v1/deals/business/reviews/:id/reject`
- **Auth**: Bearer Token (`OWNER` or `MANAGER`)

#### Response (`201 Created`)
```json
{
  "id": "7b8f9e61-9c3f-42e8-b789-0c3dfc2b1234",
  "status": "rejected"
}
```

---

### 3.4 Delete a Review
Permanently soft-delete a review on the merchant's deal.

- **Method**: `DELETE`
- **Path**: `/api/v1/deals/business/reviews/:id`
- **Auth**: Bearer Token (`OWNER` or `MANAGER`)

#### Response (`204 No Content`)

---

## 4. Moderation Toggle & Platinum Gating

Merchants can configure whether customer reviews require manual review approval before publishing.

### 4.1 Update Business Settings (Enable/Disable Moderation)
- **Method**: `PATCH`
- **Path**: `/api/v1/businesses/my-business`
- **Auth**: Bearer Token (`OWNER`)

#### Request Body
```json
{
  "requireReviewApproval": true
}
```

#### Success Response (`200 OK`)
```json
{
  "id": "biz-uuid",
  "name": "Azure Bistro",
  "requireReviewApproval": true
}
```

#### Error Response when Non-Platinum (`403 Forbidden`)
If a business on Free, Starter, Silver, or Gold tries to enable `requireReviewApproval = true`:
```json
{
  "statusCode": 403,
  "message": "Deal review moderation control is exclusively available on the Platinum plan. Please upgrade to enable this feature.",
  "error": "Forbidden"
}
```

---

## 5. TypeScript Types & API Integration Code

You can drop these TypeScript definitions and API helpers into `apps/VemTap/lib/api/dealReviews.ts` (or your existing deal API client):

```typescript
import api from '@/lib/api/index';

export type DealReviewStatus = 'pending' | 'approved' | 'rejected';

export interface DealReview {
  id: string;
  offerId?: string;
  offerName?: string;
  reviewerName: string;
  comment: string;
  rating: number | null;
  likesCount: number;
  status?: DealReviewStatus;
  createdAt: string;
  isLiked?: boolean;
}

export interface DealEngagementSummary {
  likesCount: number;
  dislikesCount: number;
  reviewsCount: number;
  averageRating: number | null;
  type?: 'like' | 'dislike' | null;
  isSaved?: boolean;
}

export interface CreateDealReviewPayload {
  comment: string;
  name?: string;
  rating?: number; // 1 - 5
}

export interface BusinessReviewsQueryParams {
  status?: DealReviewStatus;
  offerId?: string;
  page?: number;
  limit?: number;
}

export const dealReviewsApi = {
  // Public
  createReview: (offerId: string, payload: CreateDealReviewPayload) =>
    api.post<DealReview>(`/deals/${offerId}/reviews`, payload),

  getApprovedReviews: (offerId: string, page = 1, limit = 10) =>
    api.get<{ reviews: DealReview[]; total: number; page: number }>(
      `/deals/${offerId}/reviews?page=${page}&limit=${limit}`
    ),

  getReviewsPreview: (offerId: string) =>
    api.get<{ reviews: DealReview[] }>(`/deals/${offerId}/reviews/preview`),

  getEngagement: (offerId: string) =>
    api.get<DealEngagementSummary>(`/deals/${offerId}/engagement`),

  toggleReviewLike: (offerId: string, reviewId: string) =>
    api.post<{ liked: boolean; likesCount: number }>(
      `/deals/${offerId}/reviews/${reviewId}/like`
    ),

  // Merchant Management
  getBusinessReviews: (params?: BusinessReviewsQueryParams) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.offerId) q.set('offerId', params.offerId);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return api.get<{
      reviews: DealReview[];
      total: number;
      page: number;
      limit: number;
    }>(`/deals/business/reviews?${q.toString()}`);
  },

  approveReview: (reviewId: string) =>
    api.post<{ id: string; status: 'approved' }>(
      `/deals/business/reviews/${reviewId}/approve`
    ),

  rejectReview: (reviewId: string) =>
    api.post<{ id: string; status: 'rejected' }>(
      `/deals/business/reviews/${reviewId}/reject`
    ),

  deleteReview: (reviewId: string) =>
    api.delete(`/deals/business/reviews/${reviewId}`),

  // Toggle Moderation (Platinum Gated)
  updateModerationSetting: (requireReviewApproval: boolean) =>
    api.patch('/businesses/my-business', { requireReviewApproval }),
};
```

---

## 6. Suggested UI Flows

### Public Deal Review Submission Modal / Form
1. Render a 5-star selector component (optional rating).
2. Input field for reviewer name (if customer is unauthenticated).
3. Textarea for the review comment.
4. On submit success:
   - If response `status === 'approved'`: Show success message *"Review posted!"* and append to reviews list.
   - If response `status === 'pending'`: Show alert message *"Thank you! Your review has been submitted and is pending moderation."*

### Merchant Dashboard Settings
1. Under **Business Settings > Reviews & Engagement**, display a toggle switch: **"Moderate Deal Reviews Before Publishing"**.
2. If the user's plan is not **Platinum**:
   - Show a **"Platinum Only"** badge beside the toggle.
   - When clicked by a non-Platinum merchant, open an **Upgrade to Platinum** modal.
3. In **Dashboard > Feedback / Reviews**, add a **Deal Reviews** tab where merchants can filter by **Pending**, **Approved**, and **Rejected**, with single-click **Approve** and **Reject** action buttons.
