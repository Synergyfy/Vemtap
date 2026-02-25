# VEMTAP BUSINESS DASHBOARD – WHATSAPP AUTOMATION
## Product Requirements Document (PRD)

---

# 1. PURPOSE OF THIS DOCUMENT

This document explains in full detail how to build the BUSINESS DASHBOARD side of the Vemtap WhatsApp Automation System.

This document is ONLY for:
- Business Dashboard Developers

Businesses will NOT build flows.
Businesses will only:
- Turn automation ON or OFF
- Edit allowed message text
- Adjust simple settings (like loyalty points or delay days)

All automation logic is controlled by Admin templates.

---

# 2. OBJECTIVE

The Business Dashboard must allow SMEs to:

1. View available automations
2. Activate or deactivate automation
3. Customize message content (where allowed)
4. Adjust simple configuration values
5. View automation performance
6. View visitor engagement logs

The system must be simple and easy to understand.

---

# 3. DASHBOARD NAVIGATION STRUCTURE

Add new main menu item:

Automation

Under Automation:

1. Automation Settings
2. Active Automations
3. Automation Logs
4. Performance Overview

---

# 4. AUTOMATION SETTINGS PAGE

This page shows all available automation templates that Admin has made available.

Each automation must appear as a card with:

- Automation Name
- Short Description
- Status Toggle (ON / OFF)
- "Configure" Button

---

# 5. ACTIVATING AN AUTOMATION

When business turns toggle ON:

System must:

1. Create record in business_flow_instances table
2. Copy template version number
3. Store business_id
4. Store default configuration settings
5. Mark is_active = true

If toggle OFF:

1. Mark is_active = false
2. Prevent new sessions from starting
3. Existing sessions continue until completed

---

# 6. CONFIGURE AUTOMATION PAGE

When business clicks "Configure":

Show editable settings depending on template.

Example for Welcome Automation:

Fields:
- Welcome Message Text
- Loyalty Points to Assign
- Delay Before Follow-up (hours or days)

Editable fields must come from Admin-defined template configuration options.

Configuration data must be stored inside:

business_flow_instances.custom_settings (JSON)

---

# 7. MESSAGE CUSTOMIZATION RULES

Message text may contain dynamic variables:

Supported variables:
- {{business_name}}
- {{visitor_name}}
- {{loyalty_points}}
- {{branch_name}}

When saving configuration:

System must validate:
- Variables are valid
- Message is not empty
- Message length is within WhatsApp limit

---

# 8. AUTOMATION TYPES (PHASE 1)

Business must be able to activate:

1. New Customer Welcome
   Trigger: After NFC form submission

2. Repeat Visit Reward
   Trigger: Visitor taps again

3. Inactive Customer Reminder
   Trigger: No visit after X days

Each automation must clearly explain what it does.

---

# 9. AUTOMATION LOGS PAGE

This page allows business to see engagement history.

Table must show:

- Visitor Name
- Phone Number
- Automation Name
- Current Status
- Last Message Sent
- Last Activity Date

Business must be able to click a row to view details.

---

# 10. AUTOMATION SESSION DETAILS VIEW

When business clicks a session:

Display:
- Visitor information
- Flow status
- Message history
- Loyalty points assigned
- Tags applied

This is read-only.
Business cannot edit logic here.

---

# 11. PERFORMANCE OVERVIEW PAGE

Display simple analytics:

1. Total Messages Sent
2. Total Replies Received
3. Reply Rate (%)
4. Loyalty Points Issued
5. Active Automations Count

Analytics must support date range filter.

---

# 12. TRIGGER BEHAVIOR (BUSINESS SIDE VIEW)

Business must understand when automation runs.

For each automation, display:

Trigger Type
Example:
"This automation runs when a customer submits their details after tapping your NFC card."

No technical terms should be shown.

---

# 13. BUSINESS DATA PROTECTION

Business must only see:
- Their own visitors
- Their own sessions
- Their own analytics

System must enforce strict business_id filtering.

---

# 14. ERROR DISPLAY RULES

If WhatsApp sending fails:

Business dashboard must display:

"Message delivery failed. Please check your WhatsApp connection."

Do not expose API technical errors.

---

# 15. WHATSAPP CONNECTION STATUS

Automation page must show connection status:

Status Indicator:
- Connected (Green)
- Disconnected (Red)

If disconnected:
- Disable automation toggle
- Show "Reconnect WhatsApp" button

---

# 16. USER EXPERIENCE RULES

The business experience must:

- Be simple
- Avoid technical language
- Avoid showing JSON
- Avoid showing nodes or flow diagrams
- Focus on results

---

# 17. DEVELOPMENT PHASE ORDER (BUSINESS SIDE)

Phase 1:
- Automation list page
- Toggle activation logic
- Configuration form

Phase 2:
- Logs page
- Session details view
- WhatsApp connection indicator

Phase 3:
- Performance analytics page

---

# 18. FUTURE EXPANSION DESIGN

Even though Phase 1 is WhatsApp only,
The system must be designed so that:

In future we can show channel selection:
- WhatsApp
- SMS
- Email

Without redesigning dashboard structure.

---

# FINAL NOTE

The Business Dashboard must feel like:

"Smart automation working for me automatically"

NOT:

"Complex marketing software"

Simplicity is critical for Nigerian SMEs.

This completes the Business Dashboard PRD for WhatsApp Automation Phase 1.

