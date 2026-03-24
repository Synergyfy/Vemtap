# Agent Management & Impersonation System (AMIS) Documentation

This document outlines the architecture and integration steps for the **Agent Management & Impersonation System (AMIS)** in the VemTap backend.

## 1. Core Concepts

- **Agents:** Platform-level users (UserRole.AGENT) who assist businesses.
- **Impersonation Token:** A branch-specific, time-bound token that allows an Agent or Admin to act as a branch user.
- **Audit Logs:** Immutable records of all impersonated or state-changing actions.
- **Module Permissions:** Granular access control for Agents (e.g., only TICKET access).

---

## 2. API Endpoints

### 2.1 Admin: Create Agent
Create a new agent with specific module permissions.
- **Endpoint:** `POST /api/v1/administration/agents`
- **Roles:** `Admin`

**Payload:**
```typescript
interface AdminCreateAgentDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string; // Unique phone number enforced
  permissions: BackendModule[]; // e.g., ["LOYALTY", "TICKETS"]
}

enum BackendModule {
  LOYALTY = 'LOYALTY',
  VISITORS = 'VISITORS',
  TICKETS = 'TICKETS',
  REPORTS = 'REPORTS',
  MESSAGING = 'MESSAGING',
  PAYMENTS = 'PAYMENTS',
  SETTINGS = 'SETTINGS',
  BRANCHES = 'BRANCHES',
  BUSINESSES = 'BUSINESSES',
  ALL = 'ALL',
}
```

---

### 2.2 Admin: Generate Impersonation Token
Generate a token to allow an Agent or Admin to impersonate a branch.
- **Endpoint:** `POST /api/v1/administration/impersonation/token`
- **Roles:** `Admin`

**Payload:**
```typescript
interface GenerateImpersonationTokenDto {
  actorId: string; // Admin or Agent UUID
  targetBranchId: string; // Branch UUID to impersonate
  expiresAt: string; // ISO Date String
}
```

**Response:**
```typescript
interface ImpersonationTokenResponse {
  token: string; // The UUID token to be used in headers
  expiresAt: Date;
  actorId: string;
  targetBranchId: string;
}
```

---

### 2.3 Agent: Get/Update Profile
Manage the agent's own profile settings.
- **Endpoints:** 
  - `GET /api/v1/agent/profile`
  - `PATCH /api/v1/agent/profile`
- **Roles:** `Agent`, `Admin`

**Profile Response:**
```typescript
interface AgentProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  permissions: BackendModule[];
}
```

---

### 2.4 Admin: View Audit Logs
Fetch and filter immutable logs of all agent/admin activity.
- **Endpoint:** `GET /api/v1/administration/audit-logs`
- **Roles:** `Admin`

**Query Parameters:**
- `actorId`: (Optional) Filter by agent/admin.
- `businessId`: (Optional) Filter by business context.
- `branchId`: (Optional) Filter by branch context.
- `module`: (Optional) Filter by module name.
- `page`: (Default: 1)
- `limit`: (Default: 10)

---

## 3. Integration Strategy (Frontend)

To perform an action as a branch (Impersonation):

1.  **Get Token:** Admin calls `/administration/impersonation/token`.
2.  **Attach Header:** Add the token to the `x-impersonation-token` header in all subsequent requests for that branch.
3.  **Automatic Context:** The backend `ImpersonationGuard` will automatically resolve the correct `branchId` and `businessId` based on the token.

**Example Request:**
```javascript
// Example using axios
const response = await api.post('/loyalty/programs', payload, {
  headers: {
    'x-impersonation-token': 'YOUR_TOKEN_HERE'
  }
});
```

---

## 4. Edge Cases & Errors

| Status | Error Message | Scenario |
| :--- | :--- | :--- |
| `400` | `Phone number already in use` | Creating an agent with a non-unique phone number. |
| `400` | `Invalid or expired impersonation token` | Token has expired or was manually invalidated. |
| `403` | `You do not have permission for the [MODULE] module` | Agent attempting an action in a module they aren't assigned to. |
| `403` | `You are not the actor for this impersonation token` | Token belongs to a different Admin/Agent. |
| `404` | `Branch not found` | Impersonation target branch does not exist. |

---

## 5. Security & Immutability
- **Immutable Logs:** Audit logs cannot be edited or deleted via any API.
- **Constraint Enforcement:** Unique constraints on `email`, `phone`, and `token` prevent duplicate or spoofed accounts.
- **Global Protection:** The `AuditInterceptor` is registered globally, ensuring no state-changing request by an Admin or Agent goes unrecorded.
