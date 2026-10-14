# Verification and trial integration guide

How the business verification screens and the trial / subscription screens talk to the backend. Everything here is on `dev`.

- Base URL: `{API}/api/v1`. Auth: `Authorization: Bearer <token>` (Owner / Manager unless noted).
- Errors use the standard envelope: `{ success: false, statusCode, message, … }`, where `message` is a string or, for validation errors, an array.
- Money is in naira. Dates are ISO 8601.

---

## Part 1 — Business verification (bytID)

Verification has two halves. The business is verified when **both** pass:

1. **Identity:** the person running the account proves who they are with an ID and a selfie.
2. **Business:** the CAC registration matches the business, or an unregistered business is reviewed by a person.

If both pass automatically, the business is verified straight away and the owner gets a notification. Anything uncertain (face or name mismatch, passport flagged by bytID, CAC name or owner mismatch, unregistered business, manual review request) goes to an admin, who approves or rejects it.

### 1.1 ID types the identity screen should offer

| Option | `idType` | Needs | Cost to VEMTAP (bytID) |
|---|---|---|---|
| NIN (recommended) | `nin` | 11-digit NIN + selfie | ₦150 + ₦50 selfie |
| Driver's licence | `drivers_license` | licence number + selfie | ₦200 + ₦50 |
| Voter's card (new) | `voters_card` | VIN + selfie | ₦200 + ₦50 |
| International passport | `passport` | photo of the data page + selfie | ₦100 + ₦50 |

A NIN slip upload is no longer needed. Passports have no registry, so bytID checks the document itself, and some will go to review.

### 1.2 The flow

```
VerifyYourBusiness ─▶ VerifyYourIdentity (pick idType)
   ─▶ POST /verification/liveness-sessions ─▶ open `url` (selfie) ─▶ back to app
   ─▶ IdVerification: POST /verification/identity
        verified ─▶ IdVerificationSuccess ─▶ BusinessRegistration
        needs_review ─▶ IdVerificationNeedsReview (try again / other ID / manual review)
        failed ─▶ IdVerificationNeedsReview
   ─▶ BusinessRegistration
        registered ─▶ CacVerification: POST /verification/business ─▶ CacVerificationSuccess / review
        not registered ─▶ UnregisteredBusiness: POST /verification/business/unregistered ─▶ VerificationInProgress
   ─▶ GET /verification/status decides: YouReVerified | VerificationInProgress | StatusCenter
```

### 1.3 Endpoints

#### `GET /verification/status` (Owner / Manager / Staff)
Drives `BusinessVerificationStatusCenter`, `VerificationInProgress`, `YouReVerified`, `BusinessVerificationTrust` and both success screens.

```json
{
  "status": "in_progress",
  "isVerified": false,
  "verifiedAt": null,
  "nextStep": "business",
  "identity": {
    "id": "…", "kind": "identity", "idType": "nin", "status": "verified",
    "maskedId": "•••••••8901", "recordName": "ADAEZE TEST OKAFOR",
    "reasons": [], "faceMatch": { "status": "matched", "score": 95 },
    "createdAt": "…", "reviewedAt": null, "reviewNote": null
  },
  "business": null
}
```
- `status`: `unverified` · `in_progress` · `needs_review` · `verified` · `rejected`
- `nextStep`: `identity` · `business` · `review` · `done`
- Check `status`: `pending` · `verified` · `needs_review` · `failed`
- `reasons` (show a friendly line for each): `id_not_found`, `face_not_matched`, `face_unavailable`, `name_mismatch`, `registry_unavailable`, `provider_error`, `cac_not_found`, `business_name_mismatch`, `owner_not_listed`, `company_not_active`, `unregistered_business`, `manual_review_requested`, plus bytID document reasons for passports.

#### `POST /verification/liveness-sessions`
Body: `{ "redirectUrl": "vemtap://verification/liveness" }` (optional).
Response: `{ sessionId, url, status: "pending", expiresAt }`.
Open `url` with `WebBrowser.openAuthSessionAsync(url, redirectUrl)`. The person gets 3 tries. Then submit the ID with `livenessSessionId: sessionId`. A session can be used once, within an hour.

#### `POST /verification/identity`
```json
{
  "idType": "nin",
  "idNumber": "12345678901",
  "firstName": "Adaeze",
  "lastName": "Okafor",
  "dob": "1990-01-15",
  "livenessSessionId": "liv_…",
  "documentUrl": "https://res.cloudinary.com/…"
}
```
- `idNumber` is required except for passports.
- `documentUrl` is **required for passports**. Upload the data-page photo first with `POST /uploads` (`folderOverride: vemtap/verification/<businessId>`); other hosts are rejected.
- Names are those on the ID. The backend compares the registry's names with the **account** name (first and last, any order, middle names ignored).

Response: the check (same shape as `identity` above). Errors: `400` validation · `400 The selfie check has expired or was already used. Please take it again.` · `429` too many attempts · `503` registry down, or bytID not configured / temporarily unavailable.

#### `POST /verification/business`
Body: `{ "registrationNumber": "RC1234567" }` (RC / BN / IT; spaces and dashes allowed).
Response: the check. It passes when the CAC legal name matches the business name (company suffixes ignored), the owner is a director or beneficial owner (business-name records list none), and the company is active.

#### `POST /verification/business/unregistered`
Body: `{ "note": "Home kitchen since 2021", "documentUrls": ["https://res.cloudinary.com/…"] }` (both optional; up to 5 uploaded URLs). Always `needs_review`.

#### `POST /verification/manual-review`
Body: `{ "checkId": "…", "note": "My NIN has my maiden name" }`. `checkId` defaults to the latest identity check. This is the "Request manual review" button on `IdVerificationNeedsReview`.

#### Admin (role Admin)
- `GET /verification/admin/:businessId`: every check, with `nameMatch`, `documentUrls`, `note`, review fields.
- `POST /verification/admin/:businessId/approve` · `/reject` with body `{ "note": "…" }`. Approve verifies the business and passes checks waiting for review. Reject sets `rejected` (the owner can try again). The owner is notified either way.
- The existing `GET /businesses/admin/pending-verification` list now includes `verificationStatus` on each business.

#### Webhook (configure in bytID)
`POST {API}/api/v1/verification/webhooks/bytid`. Signed with `Bytid-Signature`; set the endpoint secret as `BYTID_WEBHOOK_SECRET`.

### 1.4 Server configuration
| Variable | Value |
|---|---|
| `BYTID_API_KEY` | `uvk_test_…` (sandbox) / `uvk_live_…` (live) |
| `BYTID_WEBHOOK_SECRET` | `whsec_…` from the bytID webhook endpoint |
| `BYTID_BASE_URL` | optional, default `https://api.bytid.com/v1` |

Without `BYTID_API_KEY`, identity and CAC checks return 503 `Identity verification is not configured`.

**Sandbox numbers** (last two digits pick the result): `…00` not found, `…99` registry outage, `…98` face mismatch (→ review), anything else verified as "ADAEZE TEST OKAFOR". To pass the name match in sandbox, the test account must be named **Adaeze Okafor**. bytID can mark a sandbox selfie passed without a camera: `POST /liveness/sessions/{id}/simulate` with `{ "outcome": "passed" }`, called with the sandbox key.

The old Dojah endpoints `POST /verification/nin` and `/verification/cac` are removed.

---

## Part 2 — Trial and subscriptions

### 2.1 Rules
- **Free trial:** one per business, on a paid plan with `trialDurationDays > 0`. **No card and no payment.**
- **Trials are never charged.** When a trial ends, the business returns to the free plan, and the owner gets an in-app notice, a push notification and an email. Reminders go out 3 days and 1 day before the end.
- Paying is a separate step: `initialize-payment` → Paystack → the webhook activates the subscription.

### 2.2 Plans — `GET /plans?onlyActive=true` (public)
Each plan has `id`, `name`, `monthlyPrice`, `quarterlyPrice`, `yearlyPrice` (+ tax-inclusive `pricing`), `trialDurationDays`, `isFree`, feature fields. **Only show plans with `permissionsConfiguredAt` set**: the backend refuses to sell or trial a plan whose permissions an admin hasn't configured (400 `This plan is not yet available for subscription…`).

### 2.3 Endpoints
| Method & path | Body / query | Response |
|---|---|---|
| `GET /subscriptions/active` (Owner/Manager/Staff) | | Active subscription + `plan`, `isTrial`, `trialEndsAt`, **`daysRemaining`**, **`trialEligible`**, **`trialUsedAt`**. `null` if none. |
| `GET /subscriptions/trial/eligibility` | | `{ eligible, trialUsedAt }` |
| `POST /subscriptions/trial` | `{ planId, billingPeriod?: 'monthly'\|'quarterly'\|'yearly' }` | Same shape as `/active` (status `trial`). 400 `already used its free trial` / `does not offer a free trial` / `free plan has no trial`. |
| `GET /subscriptions/price-preview` | `planId`, `billingPeriod`, `promoCode?`, `addonIds?` | Subtotal, tax, total |
| `POST /subscriptions/initialize-payment` | `{ planId, billingPeriod, promoCode?, addonIds?, addonQuantities?, callbackUrl? }` | Paystack `{ reference, access_code, authorization_url, … }`. With `isTrial: true` → 400 `Free trials need no payment. Start one with POST /subscriptions/trial.` |
| `GET /payments/verify/:reference` (Owner/Admin) | | `{ success, status, amount }` |
| `GET /subscriptions/billing-history` | `page`, `limit` | `{ data: [{ id, reference, amount, currency, status, purpose, planId, billingPeriod, subtotal, taxAmount, createdAt }], total, page, limit, hasNextPage }` |
| `GET /subscriptions/payment-method` | | `{ hasCard, card: { brand, last4, expMonth, expYear, bank } \| null, autoRenews }` |
| `GET /subscriptions/capabilities` | | What the current plan allows |
| `POST /subscriptions/cancel` | | Cancels the current subscription |
| `GET /addons`, `GET /addons/my`, `POST /addons/purchase`, `DELETE /addons/:businessAddonId/cancel` | | Add-ons |

### 2.4 Paying from the app
1. `POST /subscriptions/initialize-payment` with `callbackUrl: 'vemtap://payments/return'` (http, https or `vemtap` only) → open `authorization_url` with `WebBrowser.openAuthSessionAsync(url, 'vemtap://payments/return')`.
2. When the browser closes, poll `GET /subscriptions/active` every 2–3 s (up to ~30 s) until `plan.id` is the chosen plan and `status === 'active'`. `GET /payments/verify/:reference` shows the payment state meanwhile.
3. The Paystack webhook activates the subscription even if the app was closed.

### 2.5 Which trial screen to show (from `GET /subscriptions/active`)
| State | Screen |
|---|---|
| `isTrial` and `daysRemaining > 3` | `TrialActiveStatus` |
| `isTrial` and `daysRemaining ≤ 3` | `TrialEndingRenewGrowth` |
| on the free plan, `trialEligible === false`, and the previous trial ended | `TrialExpiredReactivate` |
| on the free plan and `trialEligible` | `FreeTrialConfirmation` / `BusinessPlanTrialOverview` |
| paid and active | normal dashboard; `BusinessSubscriptionBilling` for details |

Notifications with `data.type` `trial_ending` / `trial_ended` link to `/business/subscribe`.
