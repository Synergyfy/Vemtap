# Gemini Project Context: vemtap-workspace

This project, known as **EntryConect (VemTap)**, is a comprehensive platform for NFC-powered visitor engagement and loyalty. It is structured as a monorepo using `pnpm` workspaces and `Turborepo` to manage both the frontend and backend applications.

## Project Overview

- **Monorepo Manager:** `pnpm` (version 10.29.1)
- **Task Orchestrator:** `Turborepo`
- **Main Applications:**
  - **Frontend (`apps/VemTap`):** A Next.js application providing the user interface for businesses and customers.
  - **Backend (`apps/backend`):** A NestJS API that handles data management, authentication, and integrations.

---

## Architecture & Tech Stack

### Frontend Architecture (`apps/VemTap`)
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, Radix UI
- **State Management:** Zustand
- **Data Fetching & API Integration:** 
  - **Mandate:** All API integrations MUST be performed through custom hooks using **TanStack Query** (`@tanstack/react-query`).
  - **Location:** Custom hooks are organized by feature under `apps/VemTap/services/<feature>/hooks.ts`.
  - **Pattern:** These hooks utilize `useQuery` for data fetching and `useMutation` for state-changing operations, wrapping the underlying `api` utility from `lib/api.ts`.
- **Forms & Validation:** React Hook Form, Zod
- **Integrations:** Cloudinary (media), OpenAI (AI features), Paystack (payments)

### Backend Architecture (`apps/backend`)
- **Framework:** NestJS (Modular Architecture)
- **Database:** PostgreSQL with TypeORM
- **Asynchronous Tasks:** BullMQ (Redis-backed)
- **System Organization:** Follows a modular design where each feature (e.g., `auth`, `businesses`, `loyalty`) is encapsulated in its own module directory under `src/modules/`.
- **The Role of Guards:** Guards are used to enforce security and business rules before a request reaches the controller:
  - `JwtAuthGuard`: Validates the JWT token in the `Authorization` header.
  - `RolesGuard`: Enforces Role-Based Access Control (RBAC) (e.g., `Admin`, `BusinessOwner`, `Agent`).
  - `UserStatusGuard`: Checks if a user's account is active, pending, or suspended.
  - `SubscriptionGuard`: Verifies that the business has the required subscription level for specific features.
- **Documentation:** Swagger UI is automatically generated and available at `/api-docs`.

---

## Development Standards & Conventions

### Technical Integrity
- **No `any` Policy:** Use of the `any` type is strictly discouraged. All variables, parameters, and return types must be explicitly typed using Interfaces, Types, DTOs, or Entities.
- **Strong Typing:** Frontend components and backend services should share or mirror types to ensure end-to-end type safety.

### API & Swagger Documentation
Every backend endpoint MUST be fully documented using `@nestjs/swagger` decorators:
- **Description:** Use `@ApiOperation({ summary: '...', description: '...' })` to explain the endpoint's purpose.
- **Sample Payload:** Use `@ApiBody({ type: MyDto })` and ensure DTO properties have `@ApiProperty()` decorators with examples.
- **Sample Response:** Use `@ApiResponse({ status: 200, type: MyResponseDto, description: '...' })` to define the success shape and expected error codes.

### API Integration (Frontend)
- **Mandate:** Never call the `api` utility directly within UI components. Always use or create a custom hook in the appropriate `services/` directory.
- **Custom Hooks:** Ensure hooks are properly typed with the expected response and error shapes.

### Backend Development
- **DTOs:** All controllers must use DTOs with `class-validator` decorators for incoming data.
- **Logic Placement:** Keep controllers lean. All business logic, database queries, and third-party integrations must reside in Services.

---

## Development Workflow

### Key Commands

Run these commands from the root directory:

| Command | Description |
| :--- | :--- |
| `pnpm install` | Install all workspace dependencies. |
| `pnpm dev` | Start both frontend and backend in development mode. |
| `pnpm dev:ui` | Start only the Next.js frontend. |
| `pnpm dev:api` | Start only the NestJS backend. |
| `pnpm build` | Build both applications for production. |
| `pnpm test:e2e` | Run Playwright end-to-end tests. |

### Backend Specific Commands

Navigate to `apps/backend` or use `pnpm --filter @vemtap/backend <command>`:

- `pnpm run migration:generate -- name`: Generate a new TypeORM migration.
- `pnpm run migration:run`: Run pending migrations.
- `pnpm run seed`: Run the database seeding script.
- `pnpm run db:reset`: Reset the database and sync schema (use with caution).

---

## Testing & Environment

### Environment Variables
- **Frontend:** Requires `NEXT_PUBLIC_API_URL` (default: `http://localhost:3002/api/v1`).
- **Backend:** Requires standard `DB_*` variables for PostgreSQL and `REDIS_URL` for BullMQ.

### Testing
- E2E tests are located in the root `tests/` directory and managed by Playwright.
- Backend unit and integration tests use Jest and are located within `apps/backend/src` and `apps/backend/test`.
