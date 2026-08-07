# Plan: Align Vemtap Backend with FOS API Spec (v1.0)

## Goal
Make the existing Vemtap NestJS backend (`apps/backend`) satisfy the FOS Front Office System API contract so the FOS frontend can run against it directly, while keeping the Vemtap frontend (control-tower etc.) working.

## Confirmed decisions
1. **Envelope:** opt-in `{success, data}` per FOS controller (no global wrap). Error bodies get an additive `success: false` field.
2. **Roles:** add `USER` and `SUPER_ADMIN` to `UserRole`; FOS admins are `SUPER_ADMIN`; FOS endpoints accept `ADMIN | SUPER_ADMIN`.
3. **Register:** FOS admin registration via `adminAccountCode` (env secret); accepts `name` (split into first/last).
4. **Budgets/Goals persisted** (new entities + migration); **Receivables/Payables computed** on the fly.

## Gap analysis (current backend vs spec)

| Spec area | Status | Action |
|---|---|---|
| auth login/register/change-password | Exists | Add `name` reg + SUPER_ADMIN role in login payload |
| dashboard stats/snapshots/insights | Exists, matches | Envelope + role update only |
| revenue transactions/aggregates/trends/chart-data/business history | Exists, matches | Envelope + role update |
| pnl statement/cashflows/cashflow-runway/cost-break-even | Exists, matches | Envelope + role update |
| expenses GET/POST | Exists | **Add PATCH + DELETE** |
| pnl/revenue-trends | Exists | **Shape fix:** needs `month` + `costs` (currently `date` + no costs) |
| budgets, budgets/forecasts | **Missing** | New fos-budgets module + entity |
| goals | **Missing** | New fos-goals module + entities |
| receivables | **Missing** | Computed endpoint |
| payables | **Missing** | Computed endpoint |
| businesses/admin | Exists | **Shape fix:** flat `owner` string + `plan/mrr/renewalDate/lastPaymentDate/agentId/agentName/smsUsed/emailUsed` + uppercase status (VemTap normalizes status via `.toLowerCase()`, safe) |
| businesses/stats | Exists | Map statusDistribution to uppercase |
| businesses GET/POST/PATCH/DELETE `/:id` | Missing (admin variants exist) | Add admin aliases + allow ADMIN on `PATCH /businesses/:id` |
| affiliates agents CRUD + revenue | Exists (proxies external backend) | Verify shape vs spec; add envelope |
| messaging sms/email/aggregates | **Missing** | New endpoints |
| funnel/stats | **Missing** | New endpoint returning array |
| notifications | Exists | **Alias `PATCH /notifications/read-all`**; map `isRead`→`read` |
| settings GET/PUT | **Missing** (`/admin/settings` exists w/ diff shape) | New FOS settings wrapper + masked keys |
| settings/team + invite + delete | **Missing** (users/team exists, owner-scoped) | New SUPER_ADMIN endpoints |
| reports | **Missing** | New fos-reports module (pre-formatted strings) |
| ai-assistant insights/chat | **Missing** (`/ai/analyze` exists) | New fos-ai-assistant module |
| forecasting/project | Exists | **Unit fix:** `variableCostMargin` — spec sends `50` (%), backend DTO `@Max(1)` |
| financial-planning targets/scenarios | Exists, matches | Envelope + role update |

---

## Phase 0 — Foundation (do first)

**0.1 Add `USER` and `SUPER_ADMIN` roles** — `apps/backend/src/modules/users/entities/user.entity.ts`
- `UserRole` enum += `USER = 'USER'`, `SUPER_ADMIN = 'SUPER_ADMIN'`.
- Extend `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)` on all FOS controllers and FOS-facing admin routes.
- Confirm `JwtStrategy` accepts the new role strings.

**0.2 Opt-in response envelope** — new `apps/backend/src/common/interceptors/fos-envelope.interceptor.ts`
- Interceptor wraps handler result as `{ success: true, data }` when enabled via `@FosEnvelope()` decorator; leaves 204/voids alone.
- Apply to: dashboard, revenue, pnl, expenses, budgets, goals, receivables, payables, messaging, funnel, notifications, settings, reports, ai-assistant, forecasting, financial-planning controllers.

**0.3 Error body** — `apps/backend/src/common/filters/http-exception.filter.ts`
- Add `success: false` to the response object (additive).

**0.4 Money as numbers** — new shared transformer `apps/backend/src/common/transformers/numeric.transformer.ts`
- Apply to all money columns in `fos-core/entities/*` and `fos_metrics_snapshots`, `fos_financial_targets`, new FOS entities.
- Wrap aggregated SQL `SUM(...)` results with `Number(...)`.

**0.5 Minor bug** — `fos-core/dto/create-financial-transaction.dto.ts`: `paymentMethod` is `@IsNumber()` but entity column is `string` → `@IsString()`.

---

## Phase 1 — Auth alignment

**`apps/backend/src/modules/auth`**
- `RegisterAdminDto`: accept optional `name` (split into `firstName`/`lastName`); create role `SUPER_ADMIN`.
- Keep `adminAccountCode` env gate.
- `generateAuthResponse`: verify `role` surfaces `SUPER_ADMIN`; add `SUPER_ADMIN`/`USER` to role whitelists.

---

## Phase 2 — Existing endpoint shape fixes

**2.1 `GET /pnl/revenue-trends`** — rename `date`→`month`, add `costs` series.

**2.2 `GET /businesses/admin`** — add flat `owner` string, `plan/mrr/renewalDate/lastPaymentDate/agentId/agentName/smsUsed/emailUsed`, uppercase status. Keep existing fields (VemTap `.toLowerCase()` normalizes). `GET /businesses/stats`: uppercase statusDistribution.

**2.3 `GET/POST/PATCH/DELETE /businesses/:id` (admin)** — add routes; allow ADMIN on `PATCH /businesses/:id`.

**2.4 Expenses PATCH/DELETE** — `expenses.controller.ts` + service.

**2.5 Notifications** — `PATCH /notifications/read-all` alias; `read` field mapping.

**2.6 Forecasting** — `variableCostMargin` `@Max(100)` + percent handling.

---

## Phase 3 — New endpoints

**3.1 Budgets** — new `fos-budgets` module: entity `fos_budgets`, `GET/POST /budgets`, `GET /budgets/forecasts`.

**3.2 Goals** — new `fos-goals` module: entities `fos_goals` + `fos_projects`, `GET /goals`.

**3.3 Receivables** — computed `GET /receivables` (renewal schedule + transactions).

**3.4 Payables** — computed `GET /payables` (expenses + commissions + salary).

**3.5 Messaging** — `GET /messaging/sms`, `/messaging/email`, `/messaging/aggregates` derived from `message_logs` + settings pricing.

**3.6 Funnel** — `GET /funnel/stats` returning array.

**3.7 Settings** — `GET/PUT /settings` (masked keys), `GET /settings/team`, `POST /settings/team/invite`, `DELETE /settings/team/:id`.

**3.8 Reports** — new `fos-reports` module: `GET /reports` with pre-formatted strings.

**3.9 AI Assistant** — new `fos-ai-assistant` module: `GET /ai-assistant/insights`, `POST /ai-assistant/chat`.

---

## Phase 4 — Migrations, seeds, tests, verification

**Migrations** (`pnpm migration:generate` in `apps/backend`):
1. `FosBudgetsEntity`, `FosGoalsProjectsEntities` — new tables.
2. Numeric transformer changes are app-level (no migration).

**Seeds** — extend `seed-fos-transactions.ts` / add `seed-fos-budgets-goals.ts`.

**Tests** (Jest per `.agent/TESTING.md`):
- Unit: new services, envelope interceptor, numeric transformer.
- Controller/e2e: happy path + 401/403/404 for new/modified routes.

**Verification checklist** (mirror spec §8).

## Risks / open flags
- **Affiliates agents** proxy an external backend — verify proxied shape matches spec `AgentListItem`; add mapping layer if not.
- **Business status** case change — audit VemTap consumers of `/businesses/admin` during Phase 2.
- **Receivables/payables/funnel** derivations best-effort; product confirm calculation model.
- **`/settings` secret keys** — mask on read.

---

## Implementation status (2026-08-06)

All phases implemented and committed to working tree (not committed to git). 106 tests pass across 15 suites; typecheck clean; lint clean on new files (pre-existing `no-unsafe-*`/`any` baseline in touched shared files left as-is).

### Deviations from spec (need FOS-team/product sign-off)

1. **`owner` field conflict on `GET /businesses/admin`:** VemTap's control-tower reads `owner` as an object (`owner.firstName/email`), FOS spec types it as a string. Kept `owner` as object (VemTap compatibility) and added `ownerName` string. FOS frontend must read `ownerName` (one-line change) or we flip `owner` to string and patch VemTap.
2. **`businesses/admin` `status`:** returned uppercase (`ACTIVE/PENDING/...`) per spec. Safe for VemTap (it normalizes via `.toLowerCase()`).
3. **Settings team invite:** no invite-email flow; creates ADMIN/SUPER_ADMIN directly with a bcrypt-hashed random password (or `DEFAULT_INVITE_PASSWORD` env) returned once in the response. No hardcoded default password.
4. **`/funnel/stats`:** returns an array with a single computed snapshot (per spec §7.3 recommendation). Derived from `fos_transactions` (QRTHRIVE), `qr_thrive_user_mappings`, `external_lead_statuses`; `qrScans` is approximated from QRTHRIVE transaction volume — needs a real scan data source for accuracy.
5. **`/budgets/forecasts`:** `scenario` query param accepted but ignored (persisted `fos_forecast_scenarios` don't store a scenario); items are mapped from saved forecast results with `scenario: 'EXPECTED'`.
6. **Receivables/payables:** computed on the fly (subscription renewals + expenses). `agentId`/`agentName` on business list/detail are `null` until the external affiliate mapping is wired.

### Migration & seeds
- **Generated** via TypeORM: `1786038704018-AddFosBudgetsGoalsSettingsColumns.ts` (fos_budgets, fos_goals, fos_projects, settings columns, `users_role_enum` rebuild for USER/SUPER_ADMIN). **Run** against the dev DB with `pnpm migration:run` and verified (tables present, enum updated).
- Seed: `pnpm seed:fos-budgets-goals` (DataSource-based; boots no Nest app). Ran successfully — fos_budgets=1, fos_goals=1, fos_projects=1.
- `Setting` entity gained `dateFormat`, `theme`, `paystackSecretKey`, `termiiApiKey` columns.
