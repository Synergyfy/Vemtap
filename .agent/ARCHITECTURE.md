# Technical Architecture - Vemtap

The Vemtap project is built as a TypeScript monorepo using **Turbo** and **PNPM**.

## Tech Stack

-   **Backend**: NestJS 11+, Node 22+
-   **Frontend**: Next.js (Turbo)
-   **Database**: PostgreSQL
-   **ORM**: TypeORM 0.3+
-   **Cache**: Redis (via BullMQ and Cache Manager)
-   **Auth**: Passport JWT + Social (Google)
-   **Messaging**: Twilio, WhatsApp API, Socket.io
-   **Observability**: OpenTelemetry, Pino Logging

## Project Structure

-   **`apps/backend`**: The core NestJS API service.
    -   `src/modules`: Feature-based modular architecture (Loyalty, Catalogue, Businesses, Affiliates, etc.).
    -   `src/common`: Shared guards, filters, interceptors, and decorators.
    -   `src/database`: TypeORM migrations and data source configuration.
-   **`apps/VemTap`**: The primary Next.js dashboard/frontend.
    -   `components/admin`: Platform-level management components.
    -   `components/business`: Business-specific operational components.

## Key Technical Patterns

### 1. Request Lifecycle (Backend)
1.  **Global Middleware**: Helmet, Compression, CORS.
2.  **Guards** (Ordered): 
    - `ThrottlerGuard`: Rate limiting.
    - `JwtAuthGuard`: JWT validation.
    - `ImpersonationGuard`: SUDO / Admin Viewer context injection.
    - `CustomerImpersonationGuard`: Acting as a customer.
    - `UserStatusGuard`: Status verification (Active, Pending, Suspended).
    - `RolesGuard`: Role-based access control (RBAC).
    - `SubscriptionGuard`: Plan-based feature gating.
3.  **Interceptors**: `ClassSerializerInterceptor` (DTO cleanup), `ObservabilityLoggingInterceptor`.
4.  **Filters**: `AllExceptionsFilter` for unified error responses.

### 2. Impersonation System (AMIS / SUDO Mode)
-   Uses the `x-impersonation-token` header and `AdminViewerBanner` component.
-   The `ImpersonationGuard` resolves the actor and target branch context.
-   Actions performed under SUDO mode are strictly audited for security.

### 3. Messaging & Jobs
-   Asynchronous tasks (Email, SMS, WhatsApp) are handled via **BullMQ** with Redis.
-   Real-time updates are pushed via **Socket.io**.
-   **Twilio** and **WhatsApp API** are the primary external communication providers.

### 4. Branch Username System
-   Branches can have a unique `username` field (3-30 chars, lowercase, alphanumeric + hyphens).
-   Access branch UBL page via `/b/[username]` instead of `/[slug]/[deviceCode]`.
-   New endpoint: `GET /tap/context-by-username/:username` returns the same context as `/tap/context/:code`.
-   Username validation includes reserved word checking and uniqueness enforcement.
-   Auto-generation from branch name if not provided during creation.
