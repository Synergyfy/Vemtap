# In-App Messaging & WebSocket Documentation

This document covers the implementation, usage, and integration of the in-app (In-House) messaging system, including REST endpoints and real-time WebSocket communication.

---

## 1. Overview
VemTap's in-app messaging allows real-time communication between Customers (Visitors) and Business Staff. It supports:
- **Thread-based conversations** (organized by branch and customer).
- **Real-time updates** via WebSockets (Socket.io).
- **Message quoting** (replying to specific messages).
- **Typing indicators** to show when a user is active.
- **Push notifications** for offline or background alerts.

---

## 2. REST API Endpoints

### A. Customer (Visitor) Endpoints
*Base path: `/api/v1/customer/messaging`*

#### 1. Get Threads
- **Endpoint:** `GET /threads`
- **Description:** Returns all active in-house conversation threads for the authenticated customer, sorted by last activity (newest first).
- **Response Data:** `ConversationThread[]`

#### 2. Get Thread Messages
- **Endpoint:** `GET /threads/:threadId`
- **Description:** Fetches all messages within a specific thread.
- **Response Data:** `Message[]` (includes `replyTo` for quoted messages).

#### 3. Send Reply
- **Endpoint:** `POST /threads/:threadId/reply`
- **Payload:**
  ```typescript
  {
    "content": "string",     // Required: The message text
    "replyToId": "uuid"      // Optional: ID of the message being quoted
  }
  ```
- **Response:** The newly created `Message` object.

---

### B. Business Staff Endpoints
*Base path: `/api/v1/messaging`*

#### 1. Get Inbox Threads
- **Endpoint:** `GET /inbox/:channel`
- **Query Params:** `branchId` (Required for Owners/Staff)
- **Description:** Get all threads for a specific branch and channel (use `IN_HOUSE` for in-app chat).
- **Response Data:** `ConversationThread[]`

#### 2. Get Thread Messages
- **Endpoint:** `GET /inbox/threads/:threadId`
- **Query Params:** `branchId`
- **Response Data:** `Message[]`

#### 3. Send Reply (Staff)
- **Endpoint:** `POST /inbox/threads/:threadId/reply`
- **Query Params:** `branchId`
- **Payload:** `ReplyDto` (same as Customer reply)

#### 4. Mark as Read
- **Endpoint:** `POST /inbox/threads/:threadId/read`
- **Query Params:** `branchId`
- **Description:** Clears the unread count for the branch on this thread.

---

## 3. WebSocket Integration

VemTap uses **Socket.io** for real-time messaging.

- **Namespace:** `/messaging`
- **Authentication:** Must provide a valid JWT in `auth.token` or `Authorization` header.

### A. Connection
When a client connects, they are automatically joined to:
- `user_{userId}`: Personal room for notifications.
- `branch_{branchId}`: (Staff only) For branch-wide updates.

### B. Client-to-Server Events (Subscribers)

#### 1. `joinThread`
Join a specific thread's room to receive real-time messages for that chat.
- **Payload:** `{ "threadId": "uuid" }`
- **Effect:** Joins room `thread_{threadId}`.

#### 2. `leaveThread`
Leave a thread's room.
- **Payload:** `{ "threadId": "uuid" }`

#### 3. `typing`
Inform others in the thread that you are typing.
- **Payload:** `{ "threadId": "uuid", "isTyping": boolean }`

### C. Server-to-Client Events (Emitters)

#### 1. `newMessage`
Triggered whenever a new message is saved.
- **Room:** `thread_{threadId}`
- **Payload:** `Message` object.

#### 2. `inboxUpdate`
Updates the list of threads in the sidebar/inbox view.
- **Room:** `branch_{branchId}`
- **Payload:**
  ```json
  {
    "type": "new_message",
    "threadId": "uuid",
    "message": { ... }
  }
  ```

#### 3. `userTyping`
Broadcasts typing status to others in the thread.
- **Room:** `thread_{threadId}`
- **Payload:** `{ "userId": "uuid", "threadId": "uuid", "isTyping": boolean }`

#### 4. `notification`
General real-time notification for a new message.
- **Room:** `user_{userId}` or `branch_{branchId}`
- **Payload:**
  ```json
  {
    "type": "new_message",
    "title": "New Message",
    "body": "...",
    "threadId": "uuid",
    "message": { ... }
  }
  ```

---

## 4. Push Notifications

Push notifications are sent via **Web Push (VAPID)** when a user is not actively connected to the WebSocket or has the app in the background.

### A. Registration
- **Endpoint:** `POST /api/v1/notifications/push/register`
- **Payload:** `{ "token": "string", "isUser": boolean }`
- **Note:** The `token` is typically the JSON-stringified PushSubscription object from the browser.

### B. Flow
1. Server attempts to send a real-time WebSocket notification.
2. Server also triggers `PushNotificationService.sendNotification`.
3. If a valid `pushToken` exists for the target, a Web Push payload is sent.

---

## 5. DTOs and Interfaces

### ReplyDto
```typescript
export class ReplyDto {
  content: string;     // Message content
  replyToId?: string;  // UUID of the message being quoted
}
```

### ConversationThread (Simplified)
```typescript
interface ConversationThread {
  id: string;
  channel: 'IN_HOUSE' | 'SMS' | 'WHATSAPP' | 'EMAIL';
  lastMessageContent: string;
  lastActivityAt: Date;
  customerUnreadCount: number;
  branchUnreadCount: number;
  customerId: string;
  branchId: string;
}
```

### Message (Simplified)
```typescript
interface Message {
  id: string;
  content: string;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  replyToId?: string;
  replyTo?: Message; // Populated if replyToId is present
  timestamp: Date;
}
```
