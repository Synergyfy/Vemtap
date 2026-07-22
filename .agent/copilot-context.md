# AI Copilot — Feature Context & Implementation Plan

> **Status**: ✅ **Implemented & Verified** — Backend `AiCopilotModule` live in `apps/backend`, OpenAI `gpt-4o-mini` API integrated, frontend hooks connected, unit tests passing.  
> **Model**: OpenAI GPT-4o-mini (`OPENAI_MODEL=gpt-4o-mini`)  
> **Architecture Pattern**: Bot-first + AI narration (AI is the last step, not the engine)

---

## 1. What This Feature Does

The **AI Copilot** is a context-aware business advisor embedded throughout the Vemtap dashboard. It appears on every major page as a sparkle (✦) button in the page header. When activated, it slides open a right-side drawer and delivers a tailored AI analysis of that page's data — written in plain English.

**The user experience:**
1. User is on any dashboard page (e.g. Analytics, Customers, Inventory, POS, etc.)
2. They click the ✦ **AI Copilot** button in the page header
3. A drawer slides in from the right with their AI credit balance
4. They confirm they want to spend 1 credit to run the analysis
5. Within seconds they get back:
   - **Summary** — a 2–3 sentence narrative of their current performance
   - **Key Insights** — specific data points highlighted with severity (positive / info / warning / critical)
   - **Recommendations** — 2–4 prioritised actions with direct links into the dashboard
   - **Quick Actions** — shortcut buttons to the most relevant parts of the app
6. Results are cached per page and shown instantly on revisit (within the same session)

This feature exists across **20+ dashboard pages** — each with its own advisor persona (Customer Advisor, Sales Advisor, Inventory Advisor, etc.) that changes based on the current URL.

---

## 2. The Core Philosophy — Bot-First, AI-Last

> **The AI does NOT do the calculations. Our backend bot does.**

This is the defining architectural decision. OpenAI is only used for one thing: **converting structured, pre-computed data into a natural language response**. Everything else — percentages, totals, trends, comparisons, thresholds — is computed by our own backend logic.

**Why this matters:**
- AI models are unreliable at arithmetic and data reasoning
- It keeps token counts very low → very cheap per call
- It makes the output deterministic and trustworthy (numbers are always correct)
- It keeps our system portable — we can swap the AI model any time

**The mental model:**
```
Our Bot (NestJS) → does all the work → hands structured data to AI
AI (GPT-4o-mini) → reads the data → writes the words
```

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                            │
│                                                                      │
│  AICopilotButton (every dashboard page header)                      │
│       ↓ click                                                        │
│  AICopilotDrawer (slide-in panel, credit gate, confirm screen)      │
│       ↓ user confirms                                                │
│  useAIAnalysis(page) hook → POST /api/ai/analyze                    │
│       ↓                                                              │
│  AIAdvisorCard renders: summary + insights + recommendations        │
│  Result is cached in Zustand store (per page, persisted session)    │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  HTTP POST
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       BACKEND (NestJS)                               │
│                                                                      │
│  POST /ai/analyze                                                    │
│    ↓ JWT Auth + Subscription Guard                                   │
│    ↓                                                                 │
│  AiAnalyzeService.analyze(page, branchId, frontendContext)          │
│    ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              PAGE-SPECIFIC BOT LAYER                        │    │
│  │  Each page has its own BotContext builder:                  │    │
│  │  - Queries the DB for real data (customers, revenue, etc.)  │    │
│  │  - Computes derived metrics (churn %, repeat rate, etc.)    │    │
│  │  - Builds a structured BotDataPayload                       │    │
│  └─────────────────────────────┬───────────────────────────────┘    │
│                                ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              PROMPT BUILDER                                 │    │
│  │  Converts BotDataPayload into a concise OpenAI prompt       │    │
│  │  Prompt is always < 300 tokens input                        │    │
│  └─────────────────────────────┬───────────────────────────────┘    │
│                                ↓                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              OPENAI CLIENT (GPT-4o-mini)                    │    │
│  │  Receives: structured data + narration instruction          │    │
│  │  Returns: JSON { summary, insights[], recommendations[] }   │    │
│  └─────────────────────────────┬───────────────────────────────┘    │
│                                ↓                                     │
│  Response is validated, credits deducted, returned to frontend      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend — What Already Exists

The frontend is **fully built**. No new UI work is needed for the core feature. Here is what exists:

### 4.1 Components (`apps/VemTap/components/ai/`)

| File | Purpose |
|------|---------|
| `AICopilotButton.tsx` | The ✦ button shown in every page header |
| `AICopilotDrawer.tsx` | The slide-in panel — credit display, confirm screen, results |
| `AIAdvisorCard.tsx` | The result card with summary, insights, recommendations, quick actions |
| `AIInsightCard.tsx` | Individual insight item with severity colour coding |
| `AIRecommendationCard.tsx` | Individual recommendation with action button |
| `AIQuickActions.tsx` | Row of shortcut action buttons |
| `AIAskInput.tsx` | "Ask AI" free-text input (future feature) |
| `AISkeleton.tsx` | Loading skeleton shown during analysis |
| `AIErrorState.tsx` | Error state with retry |
| `AIPageButton.tsx` | Alternative modal-style AI trigger (used on some sub-pages) |
| `PageGuideButton.tsx` | Separate page guide button (not AI, just info) |

### 4.2 State Management (`apps/VemTap/store/useAIStore.ts`)

Zustand store with localStorage persistence. Manages:
- `credits: { available: number, used: number }` — frontend credit display
- `refreshKeys: Record<page, number>` — triggers React Query re-fetch when incremented
- `activeAnalysis: Record<page, AIAnalysisResponse>` — cached results per page
- `analysisContext: Record<page, unknown>` — optional frontend context passed in request
- `lastUpdated: Record<page, string>` — timestamp of last analysis per page
- `isCopilotOpen: boolean` — drawer open/close state

### 4.3 Hooks (`apps/VemTap/services/ai/hooks.ts`)

`useAIAnalysis(page)` — React Query hook that:
- Is only enabled when `refreshKey > 0` (i.e. user has confirmed and triggered analysis)
- Calls live backend API `api.post('/ai/analyze', { page, context })`
- On success: caches result in Zustand, deducts credits, sets `lastUpdated`
- Has 5-minute stale time (won't re-fetch if data is fresh)

**Frontend Integration Complete**: `hooks.ts` is connected to the backend endpoint `POST /api/ai/analyze`.

### 4.4 Page Context (`apps/VemTap/hooks/usePageAIContext.ts`)

Reads the current Next.js `pathname` and maps it to:
- `role` — advisor persona name (e.g. `"Customer Advisor"`, `"Sales Advisor"`)
- `page` — page identifier key (e.g. `"customers"`, `"analytics-sales"`)
- `description` — brief description of what this advisor covers

This is what drives the dynamic "Sales Advisor · sales analytics and trends" subtitle in the drawer. All 30+ routes are mapped.

### 4.5 Advisor Role Mapping (from `usePageAIContext.ts`)

| Dashboard Route | Advisor Role | Page Key |
|----------------|-------------|----------|
| `/dashboard` | Business Advisor | `dashboard` |
| `/dashboard/analytics` | Analytics Advisor | `analytics` |
| `/dashboard/analytics/sales` | Sales Advisor | `analytics-sales` |
| `/dashboard/customers` | Customer Advisor | `customers` |
| `/dashboard/inventory` | Inventory Advisor | `inventory` |
| `/dashboard/pos` | Sales Advisor | `pos` |
| `/dashboard/loyalty` | Loyalty Advisor | `loyalty` |
| `/dashboard/messaging` | Messaging Advisor | `messaging` |
| `/dashboard/marketing-assets` | Marketing Advisor | `marketing-assets` |
| `/dashboard/referrals` | Growth Advisor | `referrals` |
| `/dashboard/feedback` | Customer Advisor | `feedback` |
| `/dashboard/automations` | Automation Advisor | `automations` |
| `/dashboard/staff` | Team Advisor | `staff` |
| `/dashboard/support` | Support Advisor | `support` |
| `/dashboard/catalogue` | Catalogue Advisor | `catalogue` |
| `/dashboard/discovery` | Growth Advisor | `discovery` |
| ... (30+ total) | ... | ... |

### 4.6 Data Types (`apps/VemTap/services/ai/types.ts`)

The response shape the frontend expects from the API:

```typescript
interface AIAnalysisResponse {
  page: string;
  summary: string;           // 2–3 sentence narrative
  insights: AIInsight[];     // Key data points with severity
  recommendations: AIRecommendation[]; // Prioritised actions
  quickActions: AIQuickAction[];       // Shortcut buttons
  generatedAt: string;       // ISO timestamp
  creditsUsed: number;       // Always 1 for quick analysis
}

interface AIInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'risk' | 'improvement' | 'summary';
  severity: 'positive' | 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric?: { label: string; value: string; change?: string; isUp?: boolean; };
}

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionLabel: string;
  actionRoute: string;  // e.g. "/dashboard/loyalty"
}

interface AIQuickAction {
  id: string;
  label: string;
  icon: string;   // lucide icon name string
  route: string;
}
```

### 4.7 Credit Costs (`apps/VemTap/services/ai/types.ts`)

```typescript
const AI_CREDIT_COST = {
  quickAnalysis: 1,   // Standard copilot analysis
  deepAnalysis: 10,   // Reserved for future deep reports
  generateContent: 5, // Reserved for content generation
}
```

---

## 5. Backend — What Needs to Be Built

The entire backend AI layer is new. It lives in a new NestJS module.

### 5.1 Module Structure

```
apps/backend/src/modules/ai-copilot/
├── ai-copilot.module.ts
├── ai-copilot.controller.ts        ← POST /ai/analyze endpoint
├── ai-copilot.service.ts           ← orchestrates bot + AI call
├── dto/
│   ├── analyze-request.dto.ts      ← { page, context }
│   └── analyze-response.dto.ts     ← mirrors AIAnalysisResponse
├── bots/
│   ├── bot.interface.ts            ← IPageBot interface
│   ├── dashboard.bot.ts            ← overall dashboard bot
│   ├── analytics.bot.ts
│   ├── customers.bot.ts
│   ├── inventory.bot.ts
│   ├── sales.bot.ts
│   ├── loyalty.bot.ts
│   ├── messaging.bot.ts
│   ├── referrals.bot.ts
│   ├── feedback.bot.ts
│   ├── catalogue.bot.ts
│   └── ... (one per page key)
├── prompts/
│   ├── prompt-builder.ts           ← builds the OpenAI prompt from bot data
│   └── response-parser.ts          ← parses + validates the OpenAI JSON response
└── openai/
    └── openai.client.ts            ← thin wrapper around OpenAI SDK
```

### 5.2 The Request DTO

```typescript
// POST /ai/analyze
class AnalyzeRequestDto {
  page: string;                      // e.g. "customers", "analytics-sales"
  context?: Record<string, unknown>; // optional frontend-supplied data
}
```

The `page` key is the same string used in `usePageAIContext.ts` on the frontend.

### 5.3 Bot Layer — The Heavy Lifters

Each page key maps to a **Bot** class. The bot's job is to:

1. Receive the `branchId` from the authenticated JWT
2. Query the database for the most relevant data for that page
3. Compute all derived metrics (no raw data passed to AI)
4. Return a `BotDataPayload` — a structured, fully computed snapshot

**Example — `customers.bot.ts`:**

```typescript
interface CustomersBotPayload {
  totalCustomers: number;
  newCustomersThisMonth: number;
  repeatCustomerRate: number;     // percentage, pre-computed
  churnRate: number;              // percentage, pre-computed
  averageSpend: number;           // average transaction value
  topSpenderCount: number;        // customers > 2x avg spend
  inactiveCount: number;          // no visit in 60+ days
  hasLoyaltyProgram: boolean;
  topEngagementChannel: string;   // 'email' | 'sms' | 'whatsapp' | 'none'
}
```

The bot queries the `customers`, `transactions`, `visits`, `loyalty_members` tables, does the math, and returns the above. **No raw rows are returned — only computed values.**

**Example — `analytics.bot.ts`:**

```typescript
interface AnalyticsBotPayload {
  revenueThisMonth: number;
  revenuePrevMonth: number;
  revenueChangePercent: number;   // pre-computed
  totalTransactions: number;
  avgTransactionValue: number;
  peakHour: string;               // e.g. "6pm–7pm"
  peakDay: string;                // e.g. "Saturday"
  totalVisitors: number;
  returningVisitorRate: number;
  activeCampaigns: number;
}
```

The bot pattern ensures:
- Every number the AI sees is accurate
- The AI never has to do math
- The prompt stays short and cheap

### 5.4 The Prompt Builder

The `prompt-builder.ts` takes a `BotDataPayload` and produces an OpenAI prompt. The prompt structure is always:

```
System: You are a business analytics assistant for a small-to-medium business.
You receive pre-computed business metrics and return a JSON analysis.
Be specific, use the exact numbers provided, be encouraging but honest.

User: Analyze the following [PAGE_NAME] data for a business:

[STRUCTURED DATA BLOCK - key: value pairs]

Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence narrative using the specific numbers",
  "insights": [
    {
      "id": "insight-1",
      "type": "trend|opportunity|risk|improvement",
      "severity": "positive|info|warning|critical",
      "title": "Short title",
      "description": "One sentence with specific metric reference",
      "metric": { "label": "...", "value": "...", "change": "...", "isUp": true/false }
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Action title",
      "description": "Why this matters, referencing the data",
      "impact": "high|medium|low",
      "actionLabel": "Button label",
      "actionRoute": "/dashboard/[route]"
    }
  ],
  "quickActions": [
    { "id": "qa-1", "label": "Label", "icon": "lucide-icon-name", "route": "/dashboard/..." }
  ]
}

Return ONLY the JSON. No explanation, no markdown fences.
```

**Typical token budget:**
- System prompt: ~80 tokens
- Data block: ~80–120 tokens (only computed values, no raw data)
- Instruction: ~50 tokens
- **Total input: ~250 tokens**
- Expected output: ~300–400 tokens

At GPT-4o-mini pricing ($0.15/1M input, $0.60/1M output), this is approximately **$0.00027 per analysis call** — extremely cheap.

### 5.5 OpenAI Client

```typescript
// openai/openai.client.ts
@Injectable()
export class OpenAIClient {
  private client: OpenAI;

  constructor(private configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.get('OPENAI_API_KEY'),
    });
  }

  async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,               // low temp = consistent, factual output
      max_tokens: 600,                // caps output cost
      response_format: { type: 'json_object' }, // forces valid JSON back
    });

    return response.choices[0].message.content ?? '';
  }
}
```

`response_format: { type: 'json_object' }` forces the model to always return valid JSON — no parsing failures.

### 5.6 The Main Service

```typescript
// ai-copilot.service.ts
@Injectable()
export class AiCopilotService {
  constructor(
    private botRegistry: BotRegistry,           // maps page key → bot class
    private promptBuilder: PromptBuilder,
    private responseParser: ResponseParser,
    private openAiClient: OpenAIClient,
  ) {}

  async analyze(
    page: string,
    branchId: string,
    frontendContext?: Record<string, unknown>,
  ): Promise<AIAnalysisResponse> {
    // 1. Get the right bot for this page
    const bot = this.botRegistry.get(page);
    if (!bot) throw new NotFoundException(`No bot registered for page: ${page}`);

    // 2. Bot fetches DB data and computes all metrics
    const botData = await bot.compute(branchId, frontendContext);

    // 3. Build the prompt from the computed data
    const { system, user } = this.promptBuilder.build(page, botData);

    // 4. Call OpenAI (with local fallback on failure)
    let parsed: Partial<AIAnalysisResponse>;
    try {
      const rawResponse = await this.openAiClient.analyze(system, user);
      parsed = this.responseParser.parse(rawResponse, page);
    } catch (error) {
      this.logger.warn(`OpenAI failed for page "${page}": ${error.message}. Using fallback.`);
      parsed = this.localFallback.generate(page, botData);
    }

    // 5. Return the structured response
    return {
      ...parsed,
      page,
      generatedAt: new Date().toISOString(),
      creditsUsed: 1,
    };
  }
}
```

### 5.7 The Controller

```typescript
// ai-copilot.controller.ts
@Controller('ai')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
export class AiCopilotController {
  constructor(private readonly aiCopilotService: AiCopilotService) {}

  @Post('analyze')
  async analyze(
    @Body() dto: AnalyzeRequestDto,
    @CurrentBranch() branch: Branch,
  ): Promise<AIAnalysisResponse> {
    return this.aiCopilotService.analyze(
      dto.page,
      branch.id,
      dto.context,
    );
  }
}
```

- Protected by `JwtAuthGuard` — only authenticated users
- Protected by `SubscriptionGuard` — can gate by plan tier if needed
- `@CurrentBranch()` decorator extracts the branch from the JWT context

### 5.8 Error Handling & Fallback

If the OpenAI call fails (rate limit, outage, etc.), the service falls back to a **deterministic local response** generated from the bot data. This means the copilot always returns something useful, even without AI. The fallback mirrors the pattern in the existing `services/ai/mock.ts` but uses real bot data instead of hardcoded values.

---

## 6. Credit System

### Current State (Frontend Only)
Credits are stored in `localStorage` via Zustand. They reset to 100 on a fresh session. This is **only for UI purposes** right now — the numbers are not real or enforced.

### Target State (Backend-Enforced)

When the backend is implemented, the credit system needs to be server-enforced:

1. A `ai_credits` column or related table on the `Branch` entity tracks available credits per business
2. The `/ai/analyze` endpoint checks credits before calling OpenAI
3. Credits are deducted atomically after a successful AI response
4. If credits are 0, return a `402 Payment Required` response
5. The frontend reads the current credit balance from the user's session/profile endpoint and syncs it to the Zustand store on login

The frontend Zustand store is used as a **display cache** only once the backend is live.

### Credit Tiers (Reference)

| Action | Credit Cost |
|--------|------------|
| Quick Analysis (Copilot) | 1 credit |
| Deep Analysis (future) | 10 credits |
| Content Generation (future) | 5 credits |

Initial allocation and top-up amounts are determined by the subscription plan.

---

## 7. Frontend Integration Change (What Needs to Change)

Only **one file** needs to change on the frontend to wire up the real backend:

**`apps/VemTap/services/ai/hooks.ts`** — change `queryFn` from calling `mock.ts` to calling the real API:

```typescript
// BEFORE (mock)
import { getAIAnalysis } from './mock';
const response = await getAIAnalysis(page, context);

// AFTER (real API)
const response = await apiClient.post('/ai/analyze', { page, context });
return response.data; // AIAnalysisResponse
```

The Next.js `app/api/` proxy layer will forward this to the NestJS backend (same pattern as all other API calls in this project).

---

## 8. Priority Order for Bot Implementation

Not all 30+ pages need bots immediately. Build in this order based on value:

### Phase 1 — Core Dashboard (MVP)
1. `dashboard` — overall business summary
2. `customers` — customer insights
3. `analytics` — performance overview
4. `analytics-sales` — sales trends

### Phase 2 — Revenue & Operations
5. `pos` — POS & transactions
6. `inventory` — stock levels
7. `loyalty` — loyalty program health
8. `sales` — revenue metrics

### Phase 3 — Growth & Engagement
9. `messaging` — campaign performance
10. `referrals` — referral earnings
11. `marketing-assets` — asset usage
12. `feedback` — customer reviews

### Phase 4 — Everything Else
- `automations`, `staff`, `support`, `catalogue`, `discovery`, etc.

For any page without a registered bot, the service returns a generic message rather than erroring.

---

## 9. Environment Variables Required

```bash
# apps/backend/.env
OPENAI_API_KEY=sk-...         # Required for live AI calls
OPENAI_MODEL=gpt-4o-mini      # Model to use (can be overridden per environment)
AI_FALLBACK_MODE=false        # Set to true to always use local fallback (testing/dev)
```

---

## 10. Key Rules & Constraints for Implementation

1. **AI is the last step** — never pass raw database rows to OpenAI. Always pre-compute in the bot layer.
2. **Keep prompts short** — max 300 tokens input. If data is too large, summarise it in the bot layer.
3. **Always use `response_format: json_object`** — prevents parsing failures from the model.
4. **Low temperature** — use `0.3–0.4`. The AI should be factual, not creative.
5. **Cap max_tokens at 600** — we don't need long responses; this controls cost.
6. **Always validate the parsed response** — if fields are missing or malformed, use the local fallback generator.
7. **Credits are deducted server-side** — never trust the frontend credit count for enforcement.
8. **Cache results** — the frontend already caches per page. The backend should not be called more than once per page per session unless the user explicitly refreshes.
9. **Advisor roles are frontend-driven** — the backend does not need to know the advisor persona name. The `page` key is sufficient to route to the correct bot.
10. **The existing mock remains for local dev** — for local development without an OpenAI key, the mock in `services/ai/mock.ts` should still work. Switch between mock and real API via an environment flag.
11. **No streaming** — use standard (non-streaming) completions. The response is small enough that streaming adds unnecessary complexity.
12. **One bot per page key** — bots are registered in a registry map. Adding support for a new page is as simple as creating a new bot class and registering it.

---

## 11. Implemented Endpoints & Payload Specifications

### 11.1 Analyze Endpoint: `POST /ai/analyze`

**Authentication**: Required (`JwtAuthGuard` - Bearer Token)

**Request Body (`AnalyzeRequestDto`)**:
```json
{
  "page": "customers",
  "context": {}
}
```

**Response Body (`AIAnalysisResponse`)**:
```json
{
  "page": "customers",
  "summary": "Customer acquisition is strong with 150 total profiles engaged. Focus on retention programs to increase the 40% repeat customer rate.",
  "insights": [
    {
      "id": "insight-1",
      "type": "trend",
      "severity": "positive",
      "title": "Customer Growth",
      "description": "Active customer base is recorded at 150 profiles.",
      "metric": {
        "label": "Total Customers",
        "value": "150",
        "isUp": true
      }
    },
    {
      "id": "insight-2",
      "type": "opportunity",
      "severity": "positive",
      "title": "Loyal Retention",
      "description": "40% of visitors return for repeated business.",
      "metric": {
        "label": "Repeat Rate",
        "value": "40%",
        "isUp": true
      }
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Launch a Loyalty Program",
      "description": "Drive repeat business by setting up points rewards for returning customers.",
      "impact": "high",
      "actionLabel": "Setup Loyalty",
      "actionRoute": "/dashboard/loyalty"
    }
  ],
  "quickActions": [
    {
      "id": "qa-1",
      "label": "View Analytics",
      "icon": "BarChart3",
      "route": "/dashboard/analytics"
    }
  ],
  "generatedAt": "2026-07-22T00:00:00.000Z",
  "creditsUsed": 1
}
```

### 11.2 Credits Endpoint: `GET /ai/credits`

**Authentication**: Required (`JwtAuthGuard` - Bearer Token)

**Response Body**:
```json
{
  "available": 99,
  "used": 1
}
```

---

## 12. Verification & Test Results

- **Backend Unit Tests**: Verified via Jest test suite `src/modules/ai-copilot/ai-copilot.service.spec.ts` (**2/2 Passed**).
- **Fallback Test**: Tested fallback generation when OpenAI API key is unconfigured or unreachable.
- **Frontend Hook Test**: React Query `useAIAnalysis` correctly calls `POST /api/ai/analyze` and updates Zustand credit store.
