# Project Mandates

- **Package Manager:** This project uses `pnpm`. Always use `pnpm` instead of `npm` or `yarn` for installing dependencies and running scripts.
- **Workspace:** This is a pnpm workspace. Run commands from the root or navigate to the specific app directory as needed.
- **Migrations:** When generating or running migrations in `apps/backend`, use `pnpm run migration:generate` and `pnpm run migration:run`.
