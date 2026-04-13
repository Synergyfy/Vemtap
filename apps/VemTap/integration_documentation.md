# QR-Thrive & VemTap Integration Documentation

This document provides a comprehensive guide for frontend developers on how to interact with the integration layers of QR-Thrive and VemTap.

---

## 1. Authentication & Security

Both systems use a shared **Internal API Key** for server-to-server and integration-specific communication.

### QR-Thrive API Authorization
*   **Header**: `X-API-KEY`
*   **Value**: The `INTERNAL_API_KEY` defined in the `.env` file.

### VemTap API Authorization
*   **Header**: `x-vemtap-api-key`
*   **Value**: The `VEMTAP_INTEGRATION_KEY` defined in the `.env` file.

---

## 2. QR-Thrive Integration API
**Base URL**: `http://localhost:3005/api/v1/integration` (Development)

### **2.1. User Management**

#### **Provision User**
`POST /users`  
Creates an integration user in QR-Thrive. If the user exists, it returns the existing user.

**Request Body (`IntegrationUserDto`):**
```typescript
interface IntegrationUserDto {
  email: string;
  firstName: string;
  lastName: string;
}
```

**Response Example:**
```json
{
  "id": "cuid-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### **Generate Magic Link (SSO)**
`POST /users/:userId/magic-link`  
Generates a one-time magic link for the user to sign in to QR-Thrive without a password.

**Response Example:**
```json
{
  "token": "magic-token-abc",
  "url": "http://localhost:3000/auth/magic-link?token=magic-token-abc",
  "expiresAt": "2024-04-12T21:00:00Z"
}
```

---

### **2.2. QR Code Management**

#### **Create QR Code**
`POST /users/:userId/qr-codes`  
Creates a new QR code for a specific user.

**Request Body (`CreateQRCodeDto`):**
```typescript
interface CreateQRCodeDto {
  name: string;
  description?: string;
  folderId?: string;
  type: QRType; // e.g., 'url', 'vcard', 'wifi'
  isDynamic?: boolean;
  data: any;    // Type-specific data (e.g., { url: '...' })
  design: any;  // Colors, shapes, etc.
  frame: any;   // Frame text and style
  logo?: string;
  width?: number;
  height?: number;
  margin?: number;
}
```

#### **Get QR Code Details**
`GET /users/:userId/qr-codes/:id`  
Fetches configuration and status of a specific QR code.

---

### **2.3. Analytics & Feedback**

#### **Get Scan Analytics**
`GET /users/:userId/qr-codes/:id/scans`  
Returns a list of scans with metadata (IP, Location, Device).

#### **Get Form Responses**
`GET /users/:userId/qr-codes/:id/responses`  
If the QR code type is `form`, this returns the submissions.

---

### **2.4. Subscription Management**

#### **Fetch QR-Thrive Plans**
`GET /plans`  
Returns all available QR-Thrive subscription tiers.

#### **Sync Subscription**
`POST /users/:userId/subscription`  
Updates the user's subscription status based on VemTap payments.

**Request Body:**
```json
{
  "planId": "standard-plan-uuid",
  "status": "active" 
}
```

---

## 3. VemTap Integration API
**Base URL**: `http://localhost:3001/api/v1` (Development)

### **3.1. Plan Fetching**
`GET /plans`  
Returns the full list of VemTap subscription plans.

**Plan Interface:**
```typescript
interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  quarterlyPrice: number;
  yearlyPrice: number;
  currency: string;
  isFree: boolean;
  trialDurationDays: number;
  features: string[];
  qrThrivePlanId: string | null; // Linked QR-Thrive tier
}
```

### **3.2. Automatic Provisioning**
`POST /users/provision`  
Used by external systems (or QR-Thrive) to create a user and business in VemTap after a payment.

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "planId": "vemtap-plan-uuid"
}
```

---

## 4. Bidirectional Flows

### **Flow A: Unified SSO (VemTap -> QR-Thrive)**
1. Frontend calls VemTap to request access to QR-Thrive.
2. VemTap Backend calls QR-Thrive `POST /integration/users/:userId/magic-link`.
3. QR-Thrive returns a magic link.
4. VemTap Frontend redirects user to QR-Thrive dashboard with the token.

### **Flow B: Paid Provisioning (QR-Thrive -> VemTap)**
1. User pays for a "Bundle" on QR-Thrive.
2. QR-Thrive calls VemTap `POST /api/v1/users/provision`.
3. VemTap creates the User/Business and provides a standard account.

### **Flow C: Callback Updates**
QR-Thrive sends webhooks to VemTap's callback endpoint:
`POST /api/v1/integration/qr-thrive/callback`
*   **Purpose**: Update branding, sync users, or notify of scan milestones.

---

## 5. Enums Reference

### **QRType**
`url`, `text`, `vcard`, `wifi`, `email`, `sms`, `whatsapp`, `phone`, `instagram`, `facebook`, `linkedin`, `twitter`, `youtube`, `tiktok`, `socials`, `links`, `image`, `event`, `pdf`, `video`, `mp3`, `app`, `business`, `menu`, `coupon`, `form`.

### **BillingPeriod**
`monthly`, `quarterly`, `yearly`.

### **Role**
`USER`, `ADMIN`, `OWNER`, `MANAGER`, `STAFF`, `CUSTOMER`, `AGENT`.
