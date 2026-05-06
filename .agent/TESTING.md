# Testing Standards

Quality is non-negotiable. Every feature must include relevant tests.

## Backend Testing (Jest)

-   **Unit Tests**: Located alongside the service (`*.service.spec.ts`). Focus on business logic in isolation.
-   **Integration Tests**: Test interactions between modules.
-   **E2E Tests**: Located in `apps/backend/test/`. Use Supertest to verify API endpoints.
    ```bash
    cd apps/backend
    pnpm test:e2e
    ```

### Username Feature Tests

-   **Unit Tests** (`username.util.spec.ts`): Test username validation, generation, and reserved words.
-   **Service Tests** (`branches.service.spec.ts`): Test `findByUsername()`, `validateUsername()`, `generateUniqueUsername()`, and username handling in `create()` and `update()`.
-   **E2E Tests** (`device-tap-username.e2e-spec.ts`): Test `GET /tap/context-by-username/:username` endpoint.
    - Valid username returns 200 with context
    - Invalid username returns 404
    - Inactive branch username returns 404

## Frontend Testing (Playwright)

-   **E2E Tests**: Located in the root `tests/` or `apps/VemTap/tests/`.
-   **Command**: `pnpm test:e2e` from the root.

## Rules for Tests

1.  **Mocking**: Use `jest.mock()` or custom mocks for external services (Twilio, Google Auth, etc.).
2.  **Database**: E2E tests should use a dedicated test database (usually configured in `.env.test`).
3.  **Coverage**: Aim for 80%+ coverage on core business services.
4.  **Snapshots**: Use UI snapshots for frontend components to catch regressions.

## CI/CD Integration

Tests are automatically run on every Pull Request via GitHub Actions. A failing test will block the merge.
