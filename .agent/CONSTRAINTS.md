# Technical Constraints & Security

Follow these strict rules to maintain system integrity and security.

## Security "Must-Dos"

1.  **Never Return Passwords**: Always use `@Exclude()` or `ClassSerializerInterceptor` to ensure sensitive fields like `password` are never leaked in API responses.
2.  **Enforce Roles**: Every non-public endpoint MUST be protected by `@Roles()` and the `RolesGuard`.
3.  **Validate Input**: Use `class-validator` and `class-transformer` decorators in all DTOs (see `[VALIDATION.md](file:///.agent/VALIDATION.md)`). Ensure `whitelist: true` and `forbidNonWhitelisted: true` are respected. Never accept raw unvalidated parameters.
4.  **Audit Impersonation**: All state-changing actions performed via AMIS MUST be logged in the audit trail.
5.  **Multi-Tenancy**: Always ensure queries are scoped to the correct `businessId` or `branchId` to prevent data leakage between businesses.

## Technical "Don'ts"

1.  **No Synchronous Work on Main Thread**: Heavy operations (Email, SMS, Image Processing) MUST be offloaded to BullMQ workers.
2.  **No Raw SQL**: Always prefer TypeORM QueryBuilder or Repository methods. Raw SQL is only allowed as a last resort with explicit escaping.
3.  **No Hardcoded Secrets**: Use `ConfigService` to access environment variables.
4.  **No Manual DB Edits**: All schema changes MUST go through TypeORM migrations.
5.  **Avoid npm**: Always use `pnpm` for package management and script execution.

## Hard Limits

-   **OTP Expiry**: Fixed at 10 minutes.
-   **JWT Expiry**: Configured in `.env` (usually 24h).
-   **Minimum Withdrawal**: ₦5,000 for affiliates (where applicable).
-   **Referral Code Format**: Must follow `VEM-{PREFIX}-{RANDOM}`.
