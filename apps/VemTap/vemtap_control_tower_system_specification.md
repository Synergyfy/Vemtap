# VEMTAP CONTROL TOWER SYSTEM SPECIFICATION

## 🎯 PURPOSE
This document defines the full Control Tower system that allows Admin and authorized Agents to temporarily access Business and Customer accounts in a secure, time-limited, and fully monitored way.

The system ensures:
- Controlled access (no permanent takeover)
- Time-bound sessions
- Strict permissions
- Full activity tracking
- Automatic assignment (optional) and manual assignment

---

# 🧩 1. SYSTEM OVERVIEW

Control Tower enables:
1. Business Account Access
2. Customer Account Access

Access is always:
- Temporary
- Permission-based
- Fully logged

---

# 🧭 2. ADMIN DASHBOARD NAVIGATION

Menu: Control Tower

Tabs:
1. Active Sessions
2. Access Requests (optional)
3. History / Logs

Primary CTA:
- Grant Access

---

# 🔐 3. ACCESS TYPES

## A. Automatic Assignment
Triggered by:
- New support ticket
- Complaint
- System alert

Flow:
1. Event occurs
2. System determines target (business/customer)
3. System assigns available agent
4. Agent receives notification

## B. Manual Assignment
Admin selects:
- Target type (Business / Customer)
- Target account
- Agent
- Duration
- Permission level

---

# ⏱️ 4. TIME-LIMIT SYSTEM

All sessions must have duration:
- 10 mins
- 30 mins
- 1 hour
- Custom (admin-defined)

Behavior:
- Timer starts when session begins
- Countdown visible to agent
- Warning at T-1 minute
- Auto logout at expiry

Admin Controls:
- Extend session
- End session immediately

---

# 👨‍💻 5. AGENT SESSION FLOW

1. Agent receives assignment notification
2. Agent clicks "Start Session"
3. System creates session record
4. Session token issued (scoped)
5. Agent enters restricted dashboard
6. Timer starts

---

# 🧑‍💻 6. RESTRICTED DASHBOARD (IMPERSONATION VIEW)

## A. Business Account View
Agent CAN:
- View customers
- View/update orders (if allowed)
- View/reply messages (if allowed)
- View analytics (optional)

Agent CANNOT:
- Access billing
- View/change passwords
- Access API keys
- Modify owner profile

## B. Customer Account View
Agent CAN:
- View profile
- View orders/history
- Assist with issues

Agent CANNOT:
- Change password/email
- Delete account

---

# 🔒 7. PERMISSION LEVELS (WITHIN CONTROL TOWER)

Each session has a permission level:
- VIEW_ONLY
- VIEW_EDIT
- VIEW_REPLY

Permissions are enforced on every action.

---

# 🚫 8. SESSION RESTRICTIONS

During session:
- No access outside scoped account
- No export/download (unless allowed)
- No destructive actions (delete) unless explicitly permitted

---

# ⏳ 9. AUTO LOGOUT SYSTEM

At expiry:
1. Show warning (1 min before)
2. Force terminate session
3. Revoke session token
4. Redirect agent out of impersonation
5. Record end time

---

# 🧾 10. FULL ACTIVITY LOGGING

Log ALL actions within session.

Tracked Events:
- Session start/end
- Pages visited
- Actions performed (CRUD)
- Messages sent

Log Fields:
- session_id
- agent_id
- target_type
- target_id
- action
- metadata (JSON)
- timestamp

---

# 📊 11. ADMIN CONTROL TOWER UI

## TAB 1: ACTIVE SESSIONS
Columns:
- Agent Name
- Target (Business/Customer)
- Permission Level
- Time Remaining
- Status

Actions:
- Extend Time
- End Session

## TAB 2: ACCESS REQUESTS (OPTIONAL)
- Agent requests access
- Admin approves/rejects

## TAB 3: HISTORY / LOGS
- Filter by date, agent, target
- View detailed activity per session

---

# 🔔 12. NOTIFICATIONS

## Agent Notifications:
- New assignment
- Session expiring
- Session ended

## Admin Notifications:
- Session started
- Session ended
- Suspicious activity (optional)

Channels:
- In-app
- Email (optional)

---

# 🧠 13. AUTO ASSIGNMENT LOGIC

## Basic:
- Assign to first available agent

## Advanced (future):
- Based on workload
- Role/skill matching
- Priority queue

---

# ⚙️ 14. DATABASE STRUCTURE

## control_tower_sessions
- id
- agent_id
- business_id (nullable)
- customer_id (nullable)
- target_type (business/customer)
- permission_level
- start_time
- end_time
- status (pending/active/ended/expired)

## control_tower_logs
- id
- session_id
- action
- metadata (JSON)
- timestamp

## access_requests (optional)
- id
- requested_by
- target_type
- target_id
- status (pending/approved/rejected)

---

# 🔐 15. SECURITY REQUIREMENTS

MUST HAVE:
- Token-based session access
- Scoped access (agent + target)
- No password exposure

RECOMMENDED:
- IP tracking
- Device tracking
- Rate limiting

RULE:
No session = No access

---

# 🎛️ 16. ADMIN CONTROLS

Admin can:
- Grant access
- Assign agent
- Set duration
- Set permission level
- Extend or terminate sessions
- View logs

---

# 🎨 17. UI DESIGN REQUIREMENTS

## Control Tower Page
- Summary cards (active sessions)
- Table layout
- Filters

## Grant Access Modal
Fields:
- Target Type (Business / Customer)
- Target Selector
- Assign Agent
- Duration Selector
- Permission Level

---

# 🔁 18. INTEGRATION WITH AGENT SYSTEM

- Only agents with permission can be assigned
- Agent workload can influence auto-assignment
- Activity logs linked to agent profiles

---

# 🔗 19. INTEGRATION WITH CHAT SYSTEM

- Admin can notify agent via internal chat
- Agents can escalate issues via chat during session

---

# 🚀 20. FUTURE EXTENSIONS

- Session screen recording
- Replay mode
- Risk detection (AI)

---

# ⚠️ 21. SYSTEM RULES

- All sessions must be time-bound
- All actions must be logged
- No hidden or silent access
- No access to sensitive credentials

---

# ✅ FINAL FLOW

1. Issue detected or admin triggers access
2. Agent assigned (auto/manual)
3. Agent starts session
4. Timer begins
5. Agent works in restricted view
6. All actions logged
7. Session expires or is terminated
8. Logs available for review

---

END OF SPECIFICATION

