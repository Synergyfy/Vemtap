# User Roles & Permissions

Vemtap uses a role-based access control (RBAC) system.

## Role Definitions

| Role | Description | Core Permissions |
| :--- | :--- | :--- |
| **Admin** | Platform Operator | Global management, KYC verification, Payout processing, Full Audit access. |
| **Owner** | Business Owner | Full control over their business and branches, billing, and high-level reports. |
| **Manager** | Branch Manager | Operations management for a specific branch (Loyalty, Staff, Visitors). |
| **Staff** | Branch Staff | Daily operations (Scanning QRs, messaging customers, logging visits). |
| **Agent** | Affiliate Partner | Referral link management, Earnings dashboard, Withdrawal requests. |
| **Customer** | End User | Managing personal profile, viewing loyalty points, participating in surveys. |

## Permission Granularity

-   **Business Context**: Most actions are scoped to a `businessId` or `branchId`.
-   **Impersonation**: Admins and specific Agents can be granted permission to impersonate a branch.
-   **Module-level Permissions**: Agents can have granular access (e.g., only `LOYALTY` or `SUPPORT`) when impersonated.

## Guard Logic

-   `RolesGuard`: Checks if the user's role in the JWT matches the required role for the controller/method.
-   `SubscriptionGuard`: Ensures the business has an active subscription for the requested feature.
-   `UserStatusGuard`: Blocks actions for `SUSPENDED` or `INACTIVE` users.
