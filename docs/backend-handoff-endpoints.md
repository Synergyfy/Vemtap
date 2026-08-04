# Frontend Integration: Backend Handoff Endpoints

This document is for frontend integration. It describes the backend contracts changed or added for customer loyalty, support, tap tracking, notifications, account security, email verification, and linked devices.

## Integration Conventions

- Base URL: `/api/v1`
- Authentication: `Authorization: Bearer <access_token>` unless an endpoint is marked public.
- Content type: `application/json`
- IDs are UUIDs unless otherwise stated.
- Authenticated endpoints use the user from the JWT. Do not send a user ID to select another account.
- Validation errors normally return HTTP `400`.
- Missing or invalid authentication returns HTTP `401`.
- A valid token with insufficient role returns HTTP `403`.
- Missing records normally return HTTP `404`.

## Loyalty

### Award Points to a Customer

`POST /api/v1/loyalty/points/give`

Roles: `Owner`, `Manager`, `Staff`

The customer is resolved from the authenticated business operation. Prefer
`customerId`; `userId` is accepted as a compatibility alias for existing
clients. `customerCode` remains supported for code-based POS flows.

```json
{
  "customerId": "a3d1b1b6-46ab-4d9e-aee4-1fa7f2f93121",
  "points": 50,
  "reason": "Manual award",
  "branchId": "f6e9a9b9-23bc-4e22-a9a5-8a0f4d4e5f11"
}
```

The branch must be accessible to the acting staff member. The customer must
be a customer account; customer identity is not selected from an arbitrary
business context.

### Apply a Reward Template

`POST /api/v1/loyalty/reward-templates/:id/apply`

Roles: `Owner`, `Manager`

```json
{
  "branchId": "f6e9a9b9-23bc-4e22-a9a5-8a0f4d4e5f11",
  "totalQuantity": 100,
  "expiryDate": "2026-12-31T23:59:59.000Z",
  "audienceType": "all"
}
```

The template is not mutated. A branch-scoped reward instance is created with
the template's name, description, points, category, images, and `templateId`.

### Redeem a Reward Directly

`POST /api/v1/loyalty/redemption/redeem-reward`

Roles: `Customer`

```json
{
  "rewardId": "d9b2d63d-a233-4123-8478-438acb679b32"
}
```

The customer is always taken from the JWT. The operation validates balance,
expiry, active state, and stock atomically, and returns a generated consumed
redemption code for consistent redemption reporting.

### Verify a Redemption Code

`POST /api/v1/loyalty/verify-redemption`

Roles: `Owner`, `Manager`, `Staff`

```json
{
  "code": "123456789"
}
```

Verification is read-only and requires POS permission plus access to the code's
branch. It returns `valid`, reward details, usage state, expiry, and a reason
such as `NOT_FOUND`, `ALREADY_USED`, `EXPIRED`, or `INACTIVE_REWARD`.

### Get Customer Point Balance

`GET /api/v1/loyalty/points/balance`

Roles: `Customer`

Returns the authenticated customer's points balance. The business filter is optional.

Query parameters:

| Name         | Type | Required | Description                                                                 |
| ------------ | ---- | -------- | --------------------------------------------------------------------------- |
| `businessId` | UUID | No       | Restrict the balance to one business. Omit for the global customer balance. |

Example:

```http
GET /api/v1/loyalty/points/balance?businessId=8f7d8b4d-5d2d-4c30-8f9a-1e4b1a9d5f10
Authorization: Bearer <token>
```

Response `200`:

```json
150
```

Global response example:

```json
450
```

### Get Customer Point History

`GET /api/v1/loyalty/points/logs`

Roles: `Customer`

Returns point transactions for the authenticated customer. Omitting `businessId` aggregates history across all businesses.

Query parameters:

| Name         | Type    | Required | Default | Description                       |
| ------------ | ------- | -------- | ------- | --------------------------------- |
| `businessId` | UUID    | No       | None    | Restrict history to one business. |
| `page`       | Integer | No       | `1`     | Page number, minimum `1`.         |
| `limit`      | Integer | No       | `10`    | Page size, minimum `1`.           |

Response `200`:

```json
{
  "data": [
    {
      "id": "9b0d6f6d-11e3-46a7-8f2f-3a3a4cc44f10",
      "amount": 50,
      "type": "earned",
      "reason": "Purchased coffee",
      "createdAt": "2026-08-04T12:00:00.000Z",
      "branch": {
        "id": "f6e9a9b9-23bc-4e22-a9a5-8a0f4d4e5f11",
        "name": "Main Branch"
      },
      "givenBy": {
        "id": "a3d1b1b6-46ab-4d9e-aee4-1fa7f2f93121",
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "alice@example.com"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "hasNextPage": false,
  "nextCursor": null,
  "prevCursor": null
}
```

The backend response fields are `amount` and `type`. If the frontend model uses `pointsAmount` and `transactionType`, map them at the API boundary. The `type` values are lowercase `earned` and `redeemed`.

### Get Public Rewards

`GET /api/v1/loyalty/rewards`

Public endpoint.

At least one of `branchId`, `branchCode`, or `businessId` is required. `businessId` enables a business-wide reward listing when no branch is available.

Query parameters:

| Name              | Type    | Required    | Description                            |
| ----------------- | ------- | ----------- | -------------------------------------- |
| `branchId`        | UUID    | Conditional | Return rewards for one branch.         |
| `branchCode`      | String  | Conditional | Resolve and filter by branch code.     |
| `businessId`      | UUID    | Conditional | Return rewards across a business.      |
| `search`          | String  | No          | Case-insensitive reward name search.   |
| `newest`          | Boolean | No          | Sort newest first.                     |
| `oldest`          | Boolean | No          | Sort oldest first.                     |
| `lowestQuantity`  | Boolean | No          | Sort by remaining quantity ascending.  |
| `highestQuantity` | Boolean | No          | Sort by remaining quantity descending. |
| `aboutToExpire`   | Boolean | No          | Sort by expiry date ascending.         |
| `highestPoints`   | Boolean | No          | Sort by points required descending.    |
| `lowestPoints`    | Boolean | No          | Sort by points required ascending.     |
| `page`            | Integer | No          | Default `1`.                           |
| `limit`           | Integer | No          | Default `10`.                          |

Response `200`:

```json
{
  "data": [
    {
      "id": "d9b2d63d-a233-4123-8478-438acb679b32",
      "name": "Free Coffee",
      "description": "Get a free coffee with 100 points",
      "pointsRequired": 100,
      "category": "FOOD_AND_BEVERAGE",
      "coverImage": "https://cdn.example.com/rewards/coffee.jpg",
      "galleryImages": [],
      "totalQuantity": 50,
      "remainingQuantity": 40,
      "isActive": true,
      "expiryDate": "2026-12-31T23:59:59.000Z",
      "businessId": "8f7d8b4d-5d2d-4c30-8f9a-1e4b1a9d5f10",
      "branchId": "f6e9a9b9-23bc-4e22-a9a5-8a0f4d4e5f11",
      "templateId": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

Only active, non-expired, available rewards are returned. A reward with `totalQuantity: -1` is treated as unlimited.

### Get Customer Loyalty Analytics

`GET /api/v1/loyalty/analytics`

Roles: `Customer`

Query parameters:

| Name   | Type    | Required | Default | Description                                 |
| ------ | ------- | -------- | ------- | ------------------------------------------- |
| `days` | Integer | No       | `30`    | Number of days included in visit analytics. |

Response `200`:

```json
{
  "totalVisits": 12,
  "currentPointsBalance": 450,
  "netSavings": 1500,
  "visitTrends": [{ "month": "Aug", "visits": 12 }],
  "pointsByVenue": [{ "venueName": "Downtown Cafe", "points": 300 }],
  "topVenues": [{ "venueName": "Downtown Cafe", "points": 8 }],
  "trends": {
    "totalVisits": "+25%",
    "rewardPoints": "+10%",
    "netSavings": "+15%"
  }
}
```

Trend values are strings. A zero previous-month value is represented as `0` or the current absolute value according to the service calculation.

## Tap and Visit Tracking

### Record a Device Visit

`POST /api/v1/tap/record/:code`

Roles: `Customer`

Records a visit using a device code. The route delegates to the existing fraud-controlled portal visit service.

Path parameters:

| Name   | Type   | Required | Description                            |
| ------ | ------ | -------- | -------------------------------------- |
| `code` | String | Yes      | Device code printed on the tap device. |

Optional header:

```http
x-visit-session-token: <previous-session-token>
```

The route also reads the request IP and user agent. Request body is optional and is currently ignored by this compatibility route.

Response `201`:

```json
{
  "visitId": "38bb2ccf-11c3-4d3a-a13f-2e9c7a2d4c70",
  "sessionToken": "f4d4e3b0-3cf2-4d87-a12b-7ad4bb3cb6e8",
  "isNewVisit": true
}
```

The existing canonical route remains available:

`POST /api/v1/visitors/portal-visit`

Body:

```json
{
  "deviceCode": "LT-8829-X",
  "sessionToken": "f4d4e3b0-3cf2-4d87-a12b-7ad4bb3cb6e8",
  "referredByBranchId": "f6e9a9b9-23bc-4e22-a9a5-8a0f4d4e5f11",
  "catalogueOfferId": "5e9b6b53-0ed0-478e-90b9-07d1f9f142da"
}
```

Visit protections include session idempotency, a four-hour customer/branch cooldown, device-to-branch resolution, and IP rate limiting.

## Support

### Create a Support Ticket

`POST /api/v1/support/tickets`

Roles: `Customer`, `Staff`, `Manager`, `Owner`

Body DTO: `CreateTicketDto`

```json
{
  "subject": "Issue with points",
  "category": "Points Inquiry",
  "message": "I did not receive points for my last visit.",
  "priority": "Normal"
}
```

Fields:

| Field      | Type   | Required | Allowed values                                           |
| ---------- | ------ | -------- | -------------------------------------------------------- |
| `subject`  | String | Yes      | Non-empty string.                                        |
| `category` | String | Yes      | Non-empty string.                                        |
| `message`  | String | Yes      | Non-empty string.                                        |
| `priority` | String | No       | `Low`, `Normal`, `High`, `Urgent`; defaults to `Normal`. |

Response `201`:

```json
{
  "id": "9b0d6f6d-11e3-46a7-8f2f-3a3a4cc44f10",
  "userId": "a3d1b1b6-46ab-4d9e-aee4-1fa7f2f93121",
  "subject": "Issue with points",
  "category": "Points Inquiry",
  "status": "Pending",
  "priority": "Normal",
  "type": "Ticket",
  "createdAt": "2026-08-04T12:00:00.000Z",
  "updatedAt": "2026-08-04T12:00:00.000Z"
}
```

### Get Public Support FAQs

`GET /api/v1/support/faqs`

Public endpoint.

Optional query parameter:

| Name     | Type   | Required | Description                      |
| -------- | ------ | -------- | -------------------------------- |
| `search` | String | No       | Searches page title and summary. |

Response `200`:

```json
{
  "categories": [
    {
      "id": "category-id",
      "title": "Getting Started",
      "order": 1,
      "sections": [
        {
          "id": "section-id",
          "title": "Using VemTap",
          "order": 1,
          "pages": [
            {
              "id": "page-id",
              "title": "How do I record a visit?",
              "path": "/help/recording-visits",
              "summary": "Learn how device visits are tracked.",
              "thumbnail": null,
              "order": 1
            }
          ]
        }
      ]
    }
  ]
}
```

The full public knowledge-base APIs are also available under `/api/v1/knowledge-base`.

## Notifications

### Register a User Push Token

`POST /api/v1/notifications/push-token`

Authenticated endpoint.

Body DTO: `RegisterPushTokenDto`

```json
{
  "token": "browser-push-token-abc-123"
}
```

`token` must be a non-empty string with at least eight characters.

Response `201`:

```json
{
  "success": true
}
```

### Register a Visitor Push Token

`POST /api/v1/notifications/visitor/push-token`

Authenticated endpoint used for visitor/contact push registration.

Body and response are the same as the user push-token endpoint.

### Get Notification Preferences

`GET /api/v1/notifications/preferences`

All authenticated roles are allowed.

Response `200`:

```json
{
  "push": true,
  "email": true,
  "sms": true,
  "marketing": true,
  "orderUpdates": true,
  "loyalty": true,
  "support": true,
  "rewardAlerts": true,
  "activityDigest": true,
  "smsSecurity": false
}
```

### Update Notification Preferences

`PATCH /api/v1/notifications/preferences`

All authenticated roles are allowed. Partial updates are supported.

Body DTO: `UpdateNotificationPreferencesDto`

```json
{
  "push": true,
  "email": false,
  "rewardAlerts": false,
  "activityDigest": true,
  "smsSecurity": true
}
```

All fields are optional booleans:

`push`, `email`, `sms`, `marketing`, `orderUpdates`, `loyalty`, `support`, `rewardAlerts`, `activityDigest`, `smsSecurity`.

Response `200` returns the complete merged preference object in the same shape as the GET response.

## Account Security

### Start 2FA Setup

`POST /api/v1/auth/2fa/setup`

All authenticated roles are allowed.

No body.

Response `201`:

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauthUrl": "otpauth://totp/VemTap:user%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=VemTap"
}
```

The secret is returned once so the client can create an authenticator-app entry. The encrypted secret is stored server-side.

### Confirm and Enable 2FA

`POST /api/v1/auth/2fa/confirm`

All authenticated roles are allowed.

Body DTO: `TwoFactorCodeDto`

```json
{
  "code": "123456"
}
```

Response `201`:

```json
{
  "enabled": true
}
```

The code must be a six-digit TOTP code. A small previous/current/next time-step window is accepted.

### Disable 2FA

`POST /api/v1/auth/2fa/disable`

All authenticated roles are allowed.

Body:

```json
{
  "code": "123456"
}
```

Response `201`:

```json
{
  "enabled": false
}
```

### Login with 2FA

`POST /api/v1/auth/login`

The existing login payload accepts an optional `twoFactorCode`:

```json
{
  "identifier": "customer@example.com",
  "password": "password123",
  "twoFactorCode": "123456"
}
```

If 2FA is enabled and the code is omitted, the response is:

```json
{
  "requiresTwoFactor": true
}
```

With a valid code, the normal authentication response includes a session identifier:

```json
{
  "access_token": "<jwt>",
  "sessionId": "7a5c4c7f-c22a-4c93-9706-f7f54a07c5bb",
  "user": {
    "id": "a3d1b1b6-46ab-4d9e-aee4-1fa7f2f93121",
    "email": "customer@example.com",
    "role": "Customer"
  },
  "isNewUser": false
}
```

Google login accepts the same optional `twoFactorCode` for existing users with 2FA enabled.

## Email Verification

### Send Verification Email

`POST /api/v1/auth/email-verification/send`

All authenticated roles are allowed.

No body. The email is taken from the authenticated user.

Response `201`:

```json
{
  "verified": false,
  "message": "Verification email sent"
}
```

If the account is already verified:

```json
{
  "verified": true,
  "message": "Email is already verified"
}
```

### Verify Email

`POST /api/v1/auth/email-verification/verify`

Public endpoint.

Body DTO: `VerifyEmailDto`

```json
{
  "email": "customer@example.com",
  "code": "1234"
}
```

The code is purpose-scoped to email verification and expires after ten minutes.

Response `200`:

```json
{
  "verified": true
}
```

### Email Verification State

The user record contains the persisted boolean field `emailVerified`. It is initialized to `false` and set to `true` only after a valid verification code is consumed.

## Linked Devices and Sessions

Login creates a persisted session record. JWTs contain the session ID, and revoked sessions are rejected by the JWT strategy.

### List Linked Devices

`GET /api/v1/users/linked-devices`

All authenticated roles are allowed.

Response `200`:

```json
[
  {
    "id": "7a5c4c7f-c22a-4c93-9706-f7f54a07c5bb",
    "deviceName": "Web browser",
    "platform": "web",
    "userAgent": "Mozilla/5.0",
    "ipAddress": "203.0.113.10",
    "lastActiveAt": "2026-08-04T12:00:00.000Z",
    "revokedAt": null,
    "createdAt": "2026-08-04T12:00:00.000Z"
  }
]
```

### Rename a Linked Device

`PATCH /api/v1/users/linked-devices/:id`

All authenticated roles are allowed. A user can only rename a session belonging to that user.

Body DTO: `RenameSessionDto`

```json
{
  "deviceName": "Personal laptop"
}
```

`deviceName` is required, must be a non-empty string, and is limited to 80 characters.

Response `200`:

```json
{
  "id": "7a5c4c7f-c22a-4c93-9706-f7f54a07c5bb",
  "deviceName": "Personal laptop",
  "platform": "web",
  "lastActiveAt": "2026-08-04T12:00:00.000Z",
  "revokedAt": null
}
```

### Revoke a Linked Device

`DELETE /api/v1/users/linked-devices/:id`

All authenticated roles are allowed. The session is marked revoked rather than physically deleted.

Response `200`:

```json
{
  "success": true
}
```

The revoked session's JWT will fail subsequent authentication checks when its `sid` is validated.

## Frontend Push Integration

The browser subscription flow must use the public VAPID key from `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and send the resulting token to:

`POST /api/v1/notifications/push-token`

The backend web-push configuration uses the matching key pair:

| Variable                       | Purpose                                       |
| ------------------------------ | --------------------------------------------- |
| `VAPID_PUBLIC_KEY`             | Public VAPID key used by the web-push server. |
| `VAPID_PRIVATE_KEY`            | Private VAPID key used to sign push requests. |
| `VAPID_EMAIL`                  | Contact address included in VAPID details.    |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Compatibility fallback for the public key.    |

The frontend public key and backend VAPID keys must come from the same key pair. A disabled/misconfigured push service returns a non-queued result rather than changing the request contract.

## Frontend Integration Checklist

- Map loyalty `amount` to the frontend points amount field and lowercase `type` to the frontend transaction type.
- Use `businessId` for global reward and loyalty requests when no branch is selected.
- Send support `priority` as `Low`, `Normal`, `High`, or `Urgent`; do not send `Medium`.
- Use `/tap/record/:code` for authenticated device visit recording.
- Read analytics trends from `trends.totalVisits`, `trends.rewardPoints`, and `trends.netSavings`.
- Load FAQs from `/support/faqs` instead of hardcoded FAQ data.
- Persist Alert Matrix settings through `/notifications/preferences` instead of browser-only storage.
- Use `/users/linked-devices` for the Linked Devices screen.
- Handle `{ "requiresTwoFactor": true }` from login by prompting for a six-digit authenticator code and retrying login.
- Store the returned `sessionId` only if the frontend needs to identify the current linked device; the access token remains the authentication credential.
- Refresh the current-user profile after successful email verification so `emailVerified` is reflected in UI state.
