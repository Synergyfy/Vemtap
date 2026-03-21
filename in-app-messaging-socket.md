# In-App Messaging & WebSocket Documentation

This document provides a comprehensive guide to the VemTap in-house messaging system. It covers the architecture, REST API endpoints, real-time WebSocket communication, push notifications, and the TypeScript interfaces required for integration.

---

## 1. Overview
VemTap's in-app messaging provides a seamless, real-time communication channel between **Customers (Visitors)** and **Business Staff (Owners/Managers/Staff)**. 

### Key Features
- **Thread-Based Conversations**: All messages are organized into unique threads mapped to a Customer, a Branch, and a Channel (`IN_HOUSE`).
- **Real-Time Updates**: Instant message delivery and UI updates via Socket.io.
- **Quoting & Replies**: Support for replying to specific messages (quoting) to maintain context.
- **Typing Indicators**: Real-time feedback when the other party is typing.
- **Unread Counters**: Automatic tracking of unread messages for both customers and staff.
- **Push Notifications**: Fallback alerts via Web Push (VAPID) when users are offline or in the background.
- **Free of Charge**: Unlike SMS or WhatsApp, in-house messaging does not consume credits.

---

## 2. Authentication & Connection

### WebSocket Connection
VemTap uses **Socket.io** on the `/messaging` namespace.
- **Gateway URL**: `wss://[your-domain]/messaging`
- **Auth**: You must provide a valid JWT in the `auth.token` object or `Authorization` header during the handshake.

**Connection Flow:**
1. Client initiates connection with JWT.
2. Server verifies token and identifies the user.
3. Server automatically joins the client to:
   - `user_{userId}`: Personal room for targeted notifications.
   - `branch_{branchId}`: (Staff only) For branch-wide updates and inbox notifications.

---

## 3. How to Start a Chat

### A. From the Customer Side (Visitor)
Customers can only start a conversation with a branch they have physically visited (verified via `Visit` entity).
- **Endpoint**: `POST /api/v1/customer/messaging/threads/start`
- **Logic**: If an active `IN_HOUSE` thread already exists between the customer and branch, it is reused; otherwise, a new one is created.
- **Payload**: `StartConversationDto`

### B. From the Branch Side (Owner/Staff)
Staff can initiate a conversation by sending a direct message to a customer or through a campaign.
- **Endpoint**: `POST /api/v1/messaging/send`
- **Logic**: The system resolves or creates a thread for the given customer and branch, then delivers the message.
- **Payload**: `SendMessageDto`

---

## 4. REST API Reference

### Customer (Visitor) Endpoints
*Base path: `/api/v1/customer/messaging`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/threads` | Get all active in-house threads for the customer. |
| `POST` | `/threads/start` | Start/Initiate a conversation with a branch. |
| `GET` | `/threads/:threadId` | Fetch message history for a thread (Newest first). |
| `POST` | `/threads/:threadId/reply` | Send a reply to an existing thread. |

### Business Staff Endpoints
*Base path: `/api/v1/messaging`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/inbox/:channel` | Get threads for a branch (e.g., `IN_HOUSE`, `SMS`). |
| `GET` | `/inbox/threads/:threadId` | Fetch message history for a specific thread. |
| `POST` | `/inbox/threads/:threadId/reply` | Send a reply to a customer. |
| `POST` | `/inbox/threads/:threadId/read` | Manually mark a thread as read for the branch. |
| `POST` | `/send` | Send a single message or start a campaign. |

---

## 5. WebSocket Events

### Client-to-Server (Subscribers)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `joinThread` | `{ threadId: uuid }` | Joins the room `thread_{threadId}` to receive live messages. |
| `leaveThread` | `{ threadId: uuid }` | Leaves the room `thread_{threadId}`. |
| `typing` | `{ threadId: uuid, isTyping: boolean }` | Notifies the server of typing status. |

### Server-to-Client (Listeners)
| Event | Payload | Description |
| :--- | :--- | :--- |
| `newMessage` | `Message` | Broadcast to `thread_{threadId}` when a new message arrives. |
| `inboxUpdate` | `{ type: string, threadId: uuid, message: Message }` | Sent to `branch_{branchId}` to update the staff inbox list. |
| `userTyping` | `{ userId: uuid, threadId: uuid, isTyping: boolean }` | Broadcast to others in the thread room. |
| `notification` | `{ type: string, title: string, body: string, threadId: uuid }` | Sent to `user_{userId}` or `branch_{branchId}` for background alerts. |

---

## 6. Push Notifications
Push notifications are sent via **Web Push (VAPID)**.

### Registration
Users must register their browser's push subscription token.
- **Endpoint (User/Staff)**: `POST /api/v1/notifications/push-token`
- **Endpoint (Visitor/Customer)**: `POST /api/v1/notifications/visitor-push-token`
- **Payload**: `{ "token": "JSON_STRING_OF_SUBSCRIPTION" }`

### Delivery Flow
1. A message is sent via REST or Socket.
2. The server emits a real-time WebSocket `notification`.
3. Simultaneously, `PushNotificationService` attempts to send a Web Push notification to the recipient's registered `pushToken`.

---

## 7. TypeScript Interfaces & Enums

### Enums
```typescript
export enum Channel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  IN_HOUSE = 'IN_HOUSE',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',   // From Customer to Business
  OUTBOUND = 'OUTBOUND', // From Business to Customer
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum ThreadStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RESOLVED = 'RESOLVED',
}
```

### Payloads (DTOs)
```typescript
/** POST /customer/messaging/threads/start */
export interface StartConversationDto {
  branchId: string;
  content: string;
}

/** POST .../reply */
export interface ReplyDto {
  content: string;
  replyToId?: string; // For quoting a specific message
}

/** POST /messaging/send */
export interface SendMessageDto {
  channel: Channel;
  content?: string;
  customerIds?: string[]; // Array of UUIDs
  branchId?: string;
  templateId?: string;
}
```

### Response Data (Entities)
```typescript
export interface ConversationThread {
  id: string;
  branchId: string;
  businessId: string;
  customerId: string;
  channel: Channel;
  status: ThreadStatus;
  lastActivityAt: Date;
  lastMessageContent: string;
  branchUnreadCount: number;
  customerUnreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  branchId: string;
  customerId: string;
  content: string;
  channel: Channel;
  direction: MessageDirection;
  status: MessageStatus;
  from: string; // Phone, Email, or Name
  to: string;
  replyToId?: string;
  replyTo?: Message; // Populated if quoting
  timestamp: Date;
}
```

---

## 8. Implementation Notes
- **Marking as Read**: When a staff member fetches `GET /inbox/threads/:threadId`, the `branchUnreadCount` is automatically reset to `0`. Similarly, `getCustomerThreadMessages` resets the `customerUnreadCount`.
- **System Automation**: Inbound messages can trigger automated replies (Welcome messages, Off-hours alerts, or FAQ keywords) if configured in **Chat Settings**.
- **Placeholders**: The `content` can contain placeholders like `{FirstName}`, `{BusinessName}`, or `{Points}`, which the server replaces dynamically before delivery.
