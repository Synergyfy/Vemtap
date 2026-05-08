# AI Agent Instructions - Vemtap Project

This folder contains the project-specific knowledge base for AI coding assistants. Read these files in the specified order before performing any tasks.

## Reading Order

1.  **[CONTEXT.md](file:///.agent/CONTEXT.md)**: Business domain, stakeholders, and full platform scope.
2.  **[ARCHITECTURE.md](file:///.agent/ARCHITECTURE.md)**: Technical stack, modular structure, and backend guards.
3.  **[CONSTRAINTS.md](file:///.agent/CONSTRAINTS.md)**: Security rules, multi-tenancy scoping, and forbidden patterns.
4.  **[ROLES.md](file:///.agent/ROLES.md)**: User roles (Admin, Owner, Manager, Staff, Agent, Customer).
5.  **[MIGRATIONS.md](file:///.agent/MIGRATIONS.md)**: Database schema management workflow (TypeORM + pnpm).
6.  **[TESTING.md](file:///.agent/TESTING.md)**: Standards for Jest (backend) and Playwright (frontend).
7.  **[SUMMARY.md](file:///.agent/SUMMARY.md)**: High-level ecosystem overview and technical deep dives.

## General Operational Rules

- **Never run `pnpm build`**: This is a long-running process and should be avoided unless explicitly requested.
- **Always use `pnpm dev`**: For local development.
- **Use `pnpm` exclusively**: Do not use `npm` or `yarn`.
- **Maintain Documentation**: If you change a core pattern, update the relevant file in this `.agent` folder.
- **No Placeholders**: When generating code or UI, never use "Coming Soon" or placeholder images.
- **Respect Linting**: Follow the project's ESLint and Prettier configurations.

## Workspace Context

- **Backend**: `apps/backend` (NestJS)
- **Frontend**: `apps/VemTap` (Next.js)
- **Shared**: Monorepo managed by Turbo and PNPM.
