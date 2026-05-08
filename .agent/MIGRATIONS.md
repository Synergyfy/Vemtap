# Database Migration Workflow (TypeORM)

The project uses TypeORM for schema management. Never modify the database schema manually.

## Workflow

1.  **Modify Entity**: Update the relevant `.entity.ts` file in `apps/backend/src/modules/**/entities/`.
2.  **Generate Migration**:
    ```bash
    cd apps/backend
    pnpm migration:generate src/database/migrations/DescribeYourChange
    ```
3.  **Review Migration**: Check the generated file in `src/database/migrations/` to ensure it correctly reflects your changes.
4.  **Run Migration**:
    ```bash
    pnpm migration:run
    ```

## Best Practices

-   **Atomic Changes**: Keep migrations small and focused.
-   **No Destructive Actions**: Be extremely careful with `DROP COLUMN` or `DROP TABLE`. Always try to use `ALTER` or soft-deletes if possible.
-   **Seeding**: If your change requires new default data, update `src/database/seeds/` or the main seed script.

## Deployment Environments

-   **Staging**: `pnpm migration:run:staging`
-   **Production**: `pnpm migration:run:prod`

> [!WARNING]
> Always backup the database before running migrations in production.
