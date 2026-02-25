# VEMTAP WHATSAPP FLOW ENGINE (PHASE 1)
## Product Requirements Document (PRD)

---

# 1. PRODUCT OVERVIEW

This document explains in full detail how to build the Vemtap WhatsApp Flow Engine without any drag-and-drop builder in the business dashboard.

In Phase 1:
- Businesses will NOT build flows themselves.
- Vemtap Admin will create and manage flow templates.
- Businesses will only toggle automation ON or OFF and edit message text where allowed.
- The system will run fully on WhatsApp first.

Future phases will extend to SMS and Email using the same engine architecture.

---

# 2. OBJECTIVE

Build an internal automation engine that:
- Automatically sends WhatsApp messages
- Listens to replies
- Applies conditions
- Assigns loyalty points
- Tags users
- Runs delays
- Logs all actions

The business owner only sees simple automation settings.

---

# 3. SYSTEM ARCHITECTURE OVERVIEW

The system will consist of 6 main components:

1. Flow Template Manager (Admin Only)
2. Business Flow Activation Settings
3. Flow Engine Processor (Backend)
4. WhatsApp Integration Layer (Termii API)
5. Webhook Listener
6. Queue & Delay Processor

All components must be modular.

---

# 4. DATABASE STRUCTURE

## 4.1 flow_templates (Admin controlled)
Stores master automation logic.

Fields:
- id
- name
- description
- trigger_type (e.g., new_customer, revisit, inactive)
- json_definition
- status (active/inactive)
- created_at
- updated_at

---

## 4.2 business_flow_instances
Created when a business activates a template.

Fields:
- id
- business_id
- template_id
- is_active (true/false)
- custom_settings (JSON for message edits, loyalty amount etc.)
- created_at
- updated_at

---

## 4.3 flow_sessions
Tracks live automation execution per visitor.

Fields:
- id
- visitor_id
- business_id
- flow_instance_id
- current_node_id
- status (running, waiting_reply, delayed, completed)
- next_execution_time (nullable)
- created_at
- updated_at

---

## 4.4 visitors

Fields:
- id
- phone_number (primary identity)
- name
- email
- loyalty_balance
- created_at
- updated_at

---

## 4.5 visitor_tags

Fields:
- id
- visitor_id
- tag_name
- created_at

---

## 4.6 loyalty_transactions

Fields:
- id
- visitor_id
- business_id
- points
- reason
- created_at

---

# 5. FLOW TEMPLATE STRUCTURE (JSON FORMAT)

Each template will store automation logic in JSON format.

Example structure:

{
  "trigger": "new_customer",
  "nodes": [
    {
      "id": "node1",
      "type": "send_message",
      "message": "Welcome to {{business_name}} 🎉",
      "next": "node2"
    },
    {
      "id": "node2",
      "type": "condition",
      "condition": "if_reply_yes",
      "true_next": "node3",
      "false_next": "node4"
    },
    {
      "id": "node3",
      "type": "assign_loyalty",
      "points": 50,
      "next": "end"
    }
  ]
}

---

# 6. ADMIN FLOW TEMPLATE MANAGEMENT

Admin Dashboard must allow:

- Create new template
- Edit JSON definition
- Define trigger type
- Activate/Deactivate template

Templates are global.
Businesses cannot edit JSON logic.

---

# 7. BUSINESS DASHBOARD (NO DRAG AND DROP)

Inside business dashboard:

Menu: Automation Settings

Each available template appears as:

Automation Name
Description
Toggle: ON / OFF
Editable fields (if allowed):
- Welcome message text
- Loyalty points amount
- Delay duration

When business toggles ON:
- Create record in business_flow_instances

When toggled OFF:
- Mark instance inactive

---

# 8. TRIGGERS

Supported triggers (Phase 1):

1. new_customer (after NFC form submission)
2. repeat_visit
3. inactive_customer (no visit in X days)

When trigger event occurs:
- Backend searches for active business_flow_instances
- Load template JSON
- Start flow_session

---

# 9. FLOW ENGINE PROCESSOR

This is the core backend service.

Process:

1. Load flow JSON
2. Start at first node
3. Execute node
4. Update flow_sessions.current_node_id
5. Continue until:
   - Waiting for reply
   - Delay required
   - Flow ends

---

# 10. NODE TYPES (PHASE 1)

## 10.1 send_message

Action:
- Replace variables
- Call Termii WhatsApp API
- Send message
- Update session to waiting_reply (if next node is condition)

---

## 10.2 condition

Triggered when webhook receives reply.

Logic:
- Check message text
- Compare against condition rules
- Move to true_next or false_next

---

## 10.3 delay

Action:
- Set next_execution_time
- Mark status = delayed
- Queue job to resume later

---

## 10.4 assign_loyalty

Action:
- Increase visitor.loyalty_balance
- Insert loyalty_transactions record
- Continue flow

---

## 10.5 tag_user

Action:
- Insert record into visitor_tags
- Continue flow

---

## 10.6 end

Action:
- Mark flow_session status = completed

---

# 11. WHATSAPP INTEGRATION (TERMII)

System Requirements:

1. Connect business WhatsApp via Termii
2. Store API credentials securely
3. Send outgoing messages through Termii API
4. Receive incoming messages via webhook endpoint

Webhook Endpoint:

POST /webhook/whatsapp

Process:
- Identify visitor by phone number
- Find active flow_session
- Resume flow execution

---

# 12. QUEUE SYSTEM

Required for:
- Delay nodes
- Scheduled follow-ups

Use background worker system.

When next_execution_time is reached:
- Resume flow
- Continue node execution

---

# 13. LOGGING & MONITORING

Each step must log:
- Flow started
- Message sent
- Reply received
- Loyalty assigned
- Flow completed

Create flow_logs table:
- flow_session_id
- action
- metadata
- timestamp

---

# 14. ERROR HANDLING

System must handle:
- Message delivery failure
- Webhook failure
- Invalid JSON node
- Expired delay jobs

All errors must be logged.

---

# 15. SECURITY

- Verify webhook signatures
- Encrypt API credentials
- Prevent cross-business data leakage
- Validate all user inputs

---

# 16. PHASE 2 (FUTURE EXPANSION)

Extend engine to support:
- SMS channel
- Email channel

Do NOT hardcode WhatsApp logic.
Instead design nodes like:

"channel": "whatsapp"

Later:
"channel": "sms"
"channel": "email"

---

# 17. DEVELOPMENT PHASE ORDER

Phase 1:
- Database setup
- WhatsApp integration
- send_message node
- condition node
- Basic trigger

Phase 2:
- Delay node
- Loyalty node
- Tag node

Phase 3:
- Inactive trigger
- Advanced analytics

---

# 18. SUCCESS METRICS

System must:
- Send messages reliably
- Process replies in real-time
- Assign loyalty correctly
- Resume delayed flows correctly
- Maintain data integrity

---

# FINAL NOTE

This system must be built as a scalable automation engine.

Businesses will experience simple toggle-based automation.

Vemtap owns:
- Logic
- Data
- Engagement flow
- Loyalty engine

This completes Phase 1 WhatsApp Flow Engine specification.

