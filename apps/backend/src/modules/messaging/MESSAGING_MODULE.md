# Messaging Module Documentation

This document provides a comprehensive overview of the inner workings of the Messaging Module, with a specific focus on the WhatsApp workflow, endpoints, data interfaces, and how they seamlessly fit together within the system.

## Module Overview

The Messaging Module is the central hub for handling omnichannel communications (SMS, WhatsApp, Email). It provides a generic interface that abstracts away third-party providers such as Termii. It handles:
- **Campaigns**: Broadcasting messages to wide audiences based on customer segments.
- **Direct Messaging**: Engaging directly with customers or contacts.
- **Inboxes**: Conversational threads initiated by inbound messages.
- **Automated Responses**: Triggering rules based on message content.

## The WhatsApp Workflow (via Termii)

The WhatsApp workflow leverages the `TermiiProvider`, offering a unified integration across SMS and WhatsApp.

### 1. Outbound WhatsApp Message
1. **Initiation**: A user triggers a request through the `POST /messaging/send` endpoint, passing a payload with `"channel": "WHATSAPP"`.
2. **Context Resolution**: The Controller automatically infers the `businessId` and `branchId` from the authenticated user's session context for billing and attribution purposes.
3. **Dispatch**: The request makes its way into `MessagingEngineService`, which checks the business's credit limit (WhatsApp costs roughly 15 credits vs. 4 for SMS).
4. **Provider Interaction**: The `MessagingEngineService` delegates the message to `TermiiProvider.sendMessage()`. The `TermiiProvider` formats the request, injecting API keys and structuring the external request to point towards Termii's `/sms/send` endpoints with the internal flag `channel="whatsapp"`.
5. **Persistence**: The provider responds with a uniform `ProviderResponse` object containing the generated `messageId` and `status: "queued"`. The database saves the Outgoing `Message` mapping to the correct thread or campaign context.

### 2. Inbound WhatsApp Message (Webhooks)
1. **Receipt**: Customers reply to the WhatsApp message, pushing real-time payloads back from Termii to our system via `POST /webhooks/termii/sms`.
2. **Parsing**: The unified `TermiiWebhookController` passes the raw payload to `TermiiProvider.parseWebhook()`.
3. **Interpretation**: The provider maps standard variables identifying it as `type="inbound"` and formats it accurately against the `InboundMessage` uniform system interface.
4. **Engine Routing**: The payload enters `MessagingEngineService.handleInbound()`.
   - Checks against `InboxThreads` and links the incoming text to previous conversations via the customer's phone number.
   - Evaluates any active `AutomationRule` workflows for auto-responses.
   - Saves the inbound message to the respective thread, allowing managers to handle customer support natively in the business dashboard.

---

## Endpoints

### 1. Send Message
**Endpoint:** `POST /messaging/send`
**Description:** Triggers a direct message, group message, or a massive campaign dispatch depending on the payload variables supplied. 
**Payload (`SendMessageDto`):**
```ts
{
  "businessId": "string",      // Required. Ensures business context validation and credit deduction.
  "branchId": "string",        // Derived from staff context automatically. Necessary for data separation.
  "channel": "SMS" | "WHATSAPP" | "EMAIL", 
  "audienceType": "ALL_CUSTOMERS",   // Allows mass campaign scheduling.
  "templateId": "string",            // Select predefined/approved message templates.
  "content": "string",               // Provide raw text.
  "contactIds": ["string", "string"] // Targeted list of IDs to send the direct message to.
}
```
**Why and How it works:** This payload handles varying degrees of scale. By combining `channel`, `audienceType`, and `contactIds`, it multiplexes campaign logic and individual direct DMs into a single endpoint.

### 2. Create Template
**Endpoint:** `POST /messaging/templates`
**Description:** Defines reusable message templates requiring prior Admin approvals.
**Payload (`CreateTemplateDto`):**
```ts
{
  "name": "string",
  "channel": "SMS" | "WHATSAPP" | "EMAIL",
  "content": "string"
}
```

### 3. Get Campaigns
**Endpoint:** `GET /messaging/campaigns`
**Query Parameters:** `?branchId=xyz`
**Description:** Retrieves all campaign details explicitly scoped down to an active operational branch.

### 4. Dashboard Analytics
**Endpoint:** `GET /messaging/analytics`
**Query Parameters:** `?branchId=xyz&channel=WHATSAPP`
**Description:** Provides aggregation reports matching total sent, delivered, failures, and operational costs. 

### 5. Inbox Thread Management
- **Retrieve Thread Channels:** `GET /messaging/inbox/:channel`
  *Description:* Displays a conversational list, sorting open active threads by the channel (SMS/WhatsApp). 
- **Retrieve Messages inside Thread:** `GET /messaging/inbox/threads/:threadId`
  *Description:* Pulls historical chronologically ordered conversational logs.
- **Reply to Customer Thread:** `POST /messaging/inbox/threads/:threadId/reply`
  *Description:* Given a `{ "content": "Hello!" }` payload, routes replies organically using the background engine into the existing conversational ID scope.

### 6. Termii Webhook 
**Endpoint:** `POST /webhooks/termii/sms` *(Public)*
**Description:** Serves simultaneously as an origin for callback status changes (delivery reports) and inbound consumer replies matching either SMS or WhatsApp mediums.

---

## Payload Strategies & Core Interfaces

To ensure resilience, avoid hard-coupling with third-party providers (like Termii), and simplify the codebase, strictly structured contracts coordinate interactions between internal systems and outbound gateways.

### 1. `SendMessagePayload` (Interface)
This is strictly internal. It is the standardized payload the Engine relays down to any provider integration.
```ts
export interface SendMessagePayload {
  to: string;       // Target Phone number/Phone integer 
  from?: string;    // Registration ID or WhatsApp Business Tag
  content: string;  // Internal explicit message content
  channel: Channel; // The medium (Channel.WHATSAPP)
  mediaUrl?: string;// Attachment strings for WhatsApp media workflows
}
```
**Why:** The standard format restricts `TermiiProvider` from handling disparate variables like `audienceType` or Database entity `TemplateIds`. The `MessagingEngineService` processes those first, compiles raw phone numbers, resolves the template contents, and finally sends this clean interface to the external API gateway.

### 2. `ProviderResponse` (Interface)
```ts
export interface ProviderResponse {
  messageId: string | null;            // Critical for tracking delivery reports.
  status: 'queued' | 'sent' | 'failed'; // Internal normalized states.
  rawResponse?: any;                   // Auditing/Debugging safety net.
}
```
**Why:** Termii endpoints respond sequentially contrasting JSON formats compared to Twilio or Infobip. This `ProviderResponse` forces all gateway bridges inside the `Providers` folder to homogenize their callback values. The core database logic therefore treats a "WhatsApp queue response" and an "SMS sent response" using the universally understood variables avoiding `undefined` panics or database injection errors.

### 3. `InboundMessage` & `DeliveryReport` (Interfaces)
**Inbound Webhook Adapter Interfaces:**
```ts
export interface InboundMessage {
  from: string;
  to: string;
  content: string;
  providerMessageId: string;
  channel: Channel;
  timestamp: Date;
  rawPayload: any;
}
```
**Why:** Termii sends webhook HTTP POST triggers continuously for Delivery callbacks alongside live inbound message responses. Using `parseWebhook()`, the controller distills the generic Termii `request.body` down into an explicit `InboundMessage` payload. The `content` triggers regex engine automations while `from` pairs uniquely back to internal `Contact` rows triggering `InboxThread` database insertions.
