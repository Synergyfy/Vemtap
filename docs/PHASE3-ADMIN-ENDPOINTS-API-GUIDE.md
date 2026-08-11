# VemTap Phase 3 Admin Audit — API Integration Guide for Frontend Team

This document serves as the authoritative API reference for the frontend team to integrate the Phase 3 backend endpoints built to close audit gaps across Messaging, Loyalty, Discovery Partnerships, Administration, and Notifications.

---

## Base URL & Authentication

- **Base URL**: `http://localhost:3000/api/v1` (or your configured environment base URL)
- **Authentication**: All endpoints require a standard Bearer Token header:
  ```http
  Authorization: Bearer <ADMIN_JWT_TOKEN>
  Content-Type: application/json
  ```
- **Access Role**: Unless specified otherwise, these administrative endpoints require `UserRole.ADMIN`.

---

## 1. Messaging Admin Templates (Item A1)

### 1.1 List All Admin Messaging Templates
Fetch all system and branch messaging templates platform-wide.

- **HTTP Method**: `GET`
- **Endpoint Path**: `/api/v1/messaging/admin/templates`
- **Access Level**: `UserRole.ADMIN`

#### Request Header & Query
```http
GET /api/v1/messaging/admin/templates HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```
*No query parameters required.*

#### Sample Response (`200 OK`)
```json
[
  {
    "id": "tpl-9843-abcd-1234",
    "name": "Welcome New Customer",
    "channel": "SMS",
    "content": "Hi {name}, welcome to our store! Use code WELCOME10 for 10% off.",
    "status": "pending",
    "category": "MARKETING",
    "language": "English (US)",
    "isSystem": true,
    "branchId": null,
    "businessId": null,
    "createdById": "user-admin-uuid",
    "createdAt": "2026-08-04T12:00:00.000Z",
    "updatedAt": "2026-08-04T12:00:00.000Z",
    "branch": null
  },
  {
    "id": "tpl-1122-efgh-5678",
    "name": "Order Pickup Alert",
    "channel": "WHATSAPP",
    "content": "Hello {name}, your order #{orderId} is ready for pickup!",
    "status": "approved",
    "category": "UTILITY",
    "language": "English (US)",
    "isSystem": false,
    "branchId": "br-550e8400-e29b-41d4-a716-446655440000",
    "businessId": "biz-880e8400-e29b-41d4-a716-446655440000",
    "createdById": "user-owner-uuid",
    "createdAt": "2026-08-03T10:15:00.000Z",
    "updatedAt": "2026-08-04T08:30:00.000Z",
    "branch": {
      "id": "br-550e8400-e29b-41d4-a716-446655440000",
      "name": "Ikeja Main Branch"
    }
  }
]
```

---

### 1.2 Update Template Approval Status
Approve, reject, or mark a messaging template as pending.

- **HTTP Method**: `POST`
- **Endpoint Path**: `/api/v1/messaging/admin/templates/:id/status`
- **Access Level**: `UserRole.ADMIN`

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | **Yes** | Identifier of the message template |

#### Sample Request Body (`UpdateTemplateStatusDto`)
```json
{
  "status": "approved"
}
```
*Valid enum values*: `"pending"`, `"approved"`, `"rejected"`.

#### Sample Response (`200 OK`)
```json
{
  "id": "tpl-9843-abcd-1234",
  "name": "Welcome New Customer",
  "channel": "SMS",
  "content": "Hi {name}, welcome to our store! Use code WELCOME10 for 10% off.",
  "status": "approved",
  "category": "MARKETING",
  "language": "English (US)",
  "isSystem": true,
  "branchId": null,
  "createdAt": "2026-08-04T12:00:00.000Z",
  "updatedAt": "2026-08-04T15:30:00.000Z"
}
```

---

## 2. Loyalty Reward Templates (Item A2)

### 2.1 Update Reward Template
Update template properties such as name, description, required points, category, cover image, or gallery images.

- **HTTP Method**: `PATCH`
- **Endpoint Path**: `/api/v1/loyalty/reward-templates/:id`
- **Access Level**: `UserRole.ADMIN`

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | **Yes** | Identifier of the reward template |

#### Sample Request Body (`UpdateRewardTemplateDto`)
All fields are optional:
```json
{
  "name": "Premium Artisanal Coffee",
  "description": "Redeem a fresh cup of organic roast coffee of your choice",
  "pointsRequired": 75,
  "category": "DRINK",
  "coverImage": "https://cdn.vemtap.com/images/rewards/coffee-premium.png",
  "galleryImages": [
    "https://cdn.vemtap.com/images/rewards/coffee-side1.png",
    "https://cdn.vemtap.com/images/rewards/coffee-side2.png"
  ]
}
```

#### Sample Response (`200 OK`)
```json
{
  "id": "tpl-7711-reward-uuid",
  "name": "Premium Artisanal Coffee",
  "description": "Redeem a fresh cup of organic roast coffee of your choice",
  "pointsRequired": 75,
  "category": "DRINK",
  "coverImage": "https://cdn.vemtap.com/images/rewards/coffee-premium.png",
  "galleryImages": [
    "https://cdn.vemtap.com/images/rewards/coffee-side1.png",
    "https://cdn.vemtap.com/images/rewards/coffee-side2.png"
  ],
  "createdById": "admin-user-id",
  "createdAt": "2026-08-01T09:00:00.000Z",
  "updatedAt": "2026-08-04T15:31:00.000Z"
}
```

---

### 2.2 Delete Reward Template
Permanently delete a reward template.

- **HTTP Method**: `DELETE`
- **Endpoint Path**: `/api/v1/loyalty/reward-templates/:id`
- **Access Level**: `UserRole.ADMIN`

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` (UUID) | **Yes** | Identifier of the reward template |

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "message": "Reward template deleted successfully"
}
```

---

### 2.3 Apply Reward Template to a Branch
Instantiate a specific branch reward from an existing template.

- **HTTP Method**: `POST`
- **Endpoint Path**: `/api/v1/loyalty/reward-templates/:id/apply`
- **Access Level**: `UserRole.OWNER`, `UserRole.MANAGER` (Permission: `marketing`)

#### Sample Request Body (`ApplyRewardTemplateDto`)
```json
{
  "branchId": "br-550e8400-e29b-41d4-a716-446655440000",
  "totalQuantity": 100,
  "expiryDate": "2026-12-31T23:59:59.000Z",
  "audienceType": "ALL"
}
```

#### Sample Response (`201 Created`)
```json
{
  "id": "rwd-8899-inst-uuid",
  "name": "Premium Artisanal Coffee",
  "description": "Redeem a fresh cup of organic roast coffee of your choice",
  "pointsRequired": 75,
  "category": "DRINK",
  "coverImage": "https://cdn.vemtap.com/images/rewards/coffee-premium.png",
  "totalQuantity": 100,
  "remainingQuantity": 100,
  "expiryDate": "2026-12-31T23:59:59.000Z",
  "audienceType": "ALL",
  "templateId": "tpl-7711-reward-uuid",
  "businessId": "biz-880e8400-e29b-41d4-a716-446655440000",
  "branchId": "br-550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-08-04T15:32:00.000Z"
}
```

---

## 3. Partnership Reward Tier Config Persistence (Item A15)

### 3.1 Fetch B2B Partnership Reward Tier Config
Retrieves saved partnership reward tier thresholds, multipliers, and earnings settings.

- **HTTP Method**: `GET`
- **Endpoint Path**: `/api/v1/discovery/admin/partnerships/rewards`
- **Access Level**: `UserRole.ADMIN`

#### Request Header
```http
GET /api/v1/discovery/admin/partnerships/rewards HTTP/1.1
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

#### Sample Response (`200 OK`)
```json
{
  "tiers": [
    {
      "id": "tier-bronze",
      "name": "Bronze Partner",
      "minSharedCustomers": 0,
      "minRevenue": 0,
      "commissionRatePercent": 5,
      "badgeUrl": "https://cdn.vemtap.com/badges/bronze.png"
    },
    {
      "id": "tier-silver",
      "name": "Silver Partner",
      "minSharedCustomers": 50,
      "minRevenue": 250000,
      "commissionRatePercent": 10,
      "badgeUrl": "https://cdn.vemtap.com/badges/silver.png"
    },
    {
      "id": "tier-gold",
      "name": "Gold Partner",
      "minSharedCustomers": 200,
      "minRevenue": 1000000,
      "commissionRatePercent": 15,
      "badgeUrl": "https://cdn.vemtap.com/badges/gold.png"
    }
  ],
  "defaultMultiplier": 1.0,
  "autoUpgradeEnabled": true
}
```

---

### 3.2 Save/Update B2B Partnership Reward Tier Config
Persists updated partnership tier configurations to the system database.

- **HTTP Method**: `PUT` or `PATCH`
- **Endpoint Path**: `/api/v1/discovery/admin/partnerships/rewards`
- **Access Level**: `UserRole.ADMIN`

#### Sample Request Body
```json
{
  "tiers": [
    {
      "id": "tier-bronze",
      "name": "Bronze Partner",
      "minSharedCustomers": 0,
      "minRevenue": 0,
      "commissionRatePercent": 5,
      "badgeUrl": "https://cdn.vemtap.com/badges/bronze.png"
    },
    {
      "id": "tier-silver",
      "name": "Silver Partner",
      "minSharedCustomers": 100,
      "minRevenue": 500000,
      "commissionRatePercent": 12,
      "badgeUrl": "https://cdn.vemtap.com/badges/silver.png"
    },
    {
      "id": "tier-gold",
      "name": "Gold Partner",
      "minSharedCustomers": 300,
      "minRevenue": 1500000,
      "commissionRatePercent": 18,
      "badgeUrl": "https://cdn.vemtap.com/badges/gold.png"
    }
  ],
  "defaultMultiplier": 1.2,
  "autoUpgradeEnabled": true
}
```

#### Sample Response (`200 OK`)
```json
{
  "success": true,
  "tiers": {
    "tiers": [
      {
        "id": "tier-bronze",
        "name": "Bronze Partner",
        "minSharedCustomers": 0,
        "minRevenue": 0,
        "commissionRatePercent": 5,
        "badgeUrl": "https://cdn.vemtap.com/badges/bronze.png"
      },
      {
        "id": "tier-silver",
        "name": "Silver Partner",
        "minSharedCustomers": 100,
        "minRevenue": 500000,
        "commissionRatePercent": 12,
        "badgeUrl": "https://cdn.vemtap.com/badges/silver.png"
      },
      {
        "id": "tier-gold",
        "name": "Gold Partner",
        "minSharedCustomers": 300,
        "minRevenue": 1500000,
        "commissionRatePercent": 18,
        "badgeUrl": "https://cdn.vemtap.com/badges/gold.png"
      }
    ],
    "defaultMultiplier": 1.2,
    "autoUpgradeEnabled": true
  }
}
```

---

## 4. Manual Admin NFC Quota Grant (Item A14)

### 4.1 Grant NFC Quota to a Business
Records a manual administrative quota allocation of NFC hardware tags/cards for a target business, persisting the action into the backend `AuditLog` ledger.

- **HTTP Method**: `POST`
- **Endpoint Path**: `/api/v1/administration/nfc-grants`
- **Access Level**: `UserRole.ADMIN`

#### Request Payload (`AdminNfcGrantDto`)
```json
{
  "businessId": "biz-880e8400-e29b-41d4-a716-446655440000",
  "quantity": 50,
  "grantType": "PROMOTIONAL_EVENT",
  "notes": "Granted 50 additional NFC tags for Lagos Trade Expo"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `businessId` | `string` (UUID) | **Yes** | Target business ID receiving the grant |
| `quantity` | `number` | **Yes** | Number of units granted (must be $\ge 1$) |
| `grantType` | `string` | No | Grant category code (defaults to `"MANUAL_GRANT"`) |
| `notes` | `string` | No | Administrative comment or memo |

#### Sample Response (`201 Created`)
```json
{
  "success": true,
  "message": "Granted 50 NFC quota units to business biz-880e8400-e29b-41d4-a716-446655440000",
  "businessId": "biz-880e8400-e29b-41d4-a716-446655440000",
  "grantedQuantity": 50,
  "grantType": "PROMOTIONAL_EVENT",
  "auditLogId": "audit-4422-9900-uuid",
  "timestamp": "2026-08-04T15:33:00.000Z"
}
```

---

## 5. FCM Push Device Token Registration (Item A21)

### 5.1 Register FCM / Push Device Token
Registers the Firebase Cloud Messaging (FCM) or Web Push token for the authenticated user session to enable real-time push alerts.

- **HTTP Method**: `POST`
- **Endpoint Path**: `/api/v1/notifications/device-token` *(or `/api/v1/notifications/push-token`)*
- **Access Level**: Authenticated User (`UserRole.ADMIN`, `OWNER`, `MANAGER`, `STAFF`, `AGENT`, `CUSTOMER`)

#### Request Payload (`RegisterPushTokenDto`)
```json
{
  "token": "fcm_token_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Yes** | FCM / Web Push device registration token |

#### Sample Response (`201 Created`)
```json
{
  "success": true,
  "message": "Push notification token registered successfully"
}
```

---

## Summary Table for Frontend Integration

| Feature ID | Feature Name | Endpoint Method & Route | Frontend Usage |
| :--- | :--- | :--- | :--- |
| **A1** | Admin Templates List | `GET /messaging/admin/templates` | Populates Admin Messaging Template table |
| **A1** | Update Template Status | `POST /messaging/admin/templates/:id/status` | Triggered when Admin approves or rejects a template |
| **A2** | Edit Reward Template | `PATCH /loyalty/reward-templates/:id` | Triggered when Admin edits reward template details |
| **A2** | Delete Reward Template | `DELETE /loyalty/reward-templates/:id` | Triggered when Admin deletes a reward template |
| **A15** | Get Partnership Tier Config | `GET /discovery/admin/partnerships/rewards` | Loads tier thresholds in Partnership Rewards Settings UI |
| **A15** | Save Partnership Tier Config | `PUT /discovery/admin/partnerships/rewards` | Called when clicking "Save Tier Config" button |
| **A14** | Manual NFC Quota Grant | `POST /administration/nfc-grants` | Called by Admin NFC Grants modal/form |
| **A21** | Device Push Token Register | `POST /notifications/device-token` | Called on frontend initialization after FCM token creation |
