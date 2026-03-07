# vemtap Platform

Monorepo for the EntryConect platform. It contains the web frontend (VemTap) and the backend API, managed with Turborepo and pnpm.

## Apps
- `apps/VemTap`: Next.js frontend (project name: `entryconect`)
- `apps/backend`: NestJS backend API (package: `@vemtap/backend`)

## Requirements
- Node.js (LTS recommended)
- pnpm (`pnpm@10.29.1` specified in `package.json`)

## Quick Start
Install dependencies:

```bash
pnpm install
```

Run everything:

```bash
pnpm dev
```

Run apps individually:

```bash
# frontend
pnpm dev:ui

# backend
pnpm dev:api
```

## Build
Build everything:

```bash
pnpm build
```

Build apps individually:

```bash
pnpm build:ui
pnpm build:api
```

## Repo Layout
- `apps/`: application packages
- `turbo.json`: Turborepo pipeline
- `pnpm-workspace.yaml`: workspace configuration

