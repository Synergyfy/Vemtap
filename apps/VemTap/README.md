VemTap is the EntryConect web frontend built with Next.js.

## Requirements
- Node.js (LTS recommended)
- pnpm

## Getting Started
Install dependencies from the repo root:

```bash
pnpm install
```

Run the frontend dev server:

```bash
pnpm dev:ui
```

If you prefer running from this app folder:

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Scripts
- `pnpm dev`: start Next.js in dev mode
- `pnpm build`: build the app
- `pnpm start`: run the production server
- `pnpm lint`: run ESLint
- `pnpm test:e2e`: run Playwright E2E tests
- `pnpm test:e2e:ui`: run Playwright with UI
- `pnpm test:e2e:headed`: run Playwright headed
- `pnpm test:e2e:report`: open the Playwright report

## Notes
This app is part of the EntryConect platform. See the repo root `README.md` for monorepo-wide commands and setup.
