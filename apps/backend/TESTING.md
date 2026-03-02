# Backend Testing Guide

This guide explains how to run the automated tests for the backend.

## Prerequisites

1.  **Node.js**: Ensure Node.js (v18+) is installed.
2.  **pnpm**: Install dependencies using `pnpm install`.
3.  **Database**: Ensure you have a running PostgreSQL instance (local or remote) and configure the connection details in `.env.test`.

## Environment Setup

### 1. Configure Test Environment

Create a `.env.test` file in `apps/backend/` by copying `.env.example` or creating a new one.

**Important:** Ensure `DB_NAME` includes `test` (e.g., `neondb_test`) to prevent accidental operations on production databases. The test scripts enforce this.

Example `.env.test`:
```env
PORT=3002
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=neondb_test
DB_SSL=false
JWT_SECRET=test-secret-key-1234567890
```

### 2. Windows vs Mac/Linux

We use `cross-env` to set environment variables in scripts, so tests run consistently on all platforms, including Windows.

- **Mac/Linux**: `NODE_ENV=test` works natively.
- **Windows**: `set NODE_ENV=test` is required natively, but `cross-env NODE_ENV=test` handles this automatically for you.

## Running Tests

### Unit Tests
Run unit tests (fast, isolated, mocked dependencies):
```bash
pnpm test
```

### E2E Tests
Run end-to-end tests (slower, real database, real HTTP requests):
```bash
pnpm test:e2e
```
This command automatically:
1.  Sets `NODE_ENV=test`.
2.  Runs `scripts/create-test-db.ts` to ensure the test database exists.
3.  Resets the database schema (drops and recreates tables).
4.  Runs the tests using Jest.

### Test Watch Mode
Run tests in watch mode for development:
```bash
pnpm test:watch
```

## CI/CD (GitHub Actions)

The workflow is defined in `.github/workflows/test.yml`.

- **Trigger**: Runs on push/PR to `mono-master` and `dev`.
- **Runner (`runs-on: ubuntu-latest`)**: This specifies that the tests run on a Linux virtual machine hosted by GitHub. This is standard practice even if you develop on Windows, as Linux is the target deployment environment.
- **Services**: Spins up isolated PostgreSQL and Redis containers for the duration of the test run.
