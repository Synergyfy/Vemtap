# VEMTAP FOS - Financial Operations System API Reference

Base URL: `/api/v1` (e.g. `http://localhost:3002/api/v1`)

Auth: All endpoints require `Bearer <JWT_TOKEN>` in Authorization header and `ADMIN` role.

---

## Module 1: Dashboard (`/dashboard`)

### GET /dashboard/stats

Aggregate financial statistics for the dashboard overview.

**Response:**
```json
{
  "totalRevenue": 1250000,
  "netProfit": 450000,
  "totalBusinesses": 340,
  "activeAgents": 28,
  "smsSent": 15200,
  "vemtapRevenue": 850000,
  "qrthriveRevenue": 400000,
  "commissionsPaid": 175000,
  "cashBalance": 2500000,
  "churnRate": 5.2,
  "conversionRate": 12.8
}
```

**Computation:**
| Field | Source |
|-------|--------|
| totalRevenue | SUM of SUBSCRIPTION + SMS transaction amounts |
| netProfit | SUM of all transaction profits |
| totalBusinesses | Unique businessIds from SUBSCRIPTION transactions |
| activeAgents | Unique agentIds from transactions |
| smsSent | SUM of SMS transaction amounts |
| vemtapRevenue | SUM where platform=VEMTAP AND type=SUBSCRIPTION |
| qrthriveRevenue | SUM where platform=QRTHRIVE |
| commissionsPaid | SUM where type=COMMISSION |
| cashBalance | Total inflow amount - total outflow cost |
| churnRate | Latest MetricsSnapshot.churnRate |
| conversionRate | Latest MetricsSnapshot.conversionRate |

---

### GET /dashboard/snapshots

Last 30 days of daily metrics snapshots for % change computation.

**Response:**
```json
[
  {
    "date": "2026-01-15",
    "totalRevenue": 1250000,
    "totalProfit": 450000,
    "totalBusinesses": 340,
    "churnRate": 5.2,
    "conversionRate": 12.8
  }
]
```

**Usage:** Frontend takes last 2 snapshots to compute % change arrows.

---

### GET /dashboard/insights

Intelligent alerts and performance insights.

**Response:**
```json
[
  {
    "type": "HIGH_PERFORMANCE",
    "title": "Best Performing Agent",
    "message": "Agent abc12345 generated NGN 250,000 in MRR this month",
    "severity": "SUCCESS"
  },
  {
    "type": "SMS_ALERT",
    "title": "High SMS Usage Alert",
    "message": "Business xyz789 has used 5,000 SMS credits",
    "severity": "WARNING"
  },
  {
    "type": "FINANCIAL_RUNWAY",
    "title": "Healthy Runway",
    "message": "You have approximately 8.5 months of runway remaining",
    "severity": "SUCCESS"
  }
]
```

**Severity levels:** `INFO`, `SUCCESS`, `WARNING`, `DANGER`

**Insight types:**
- `HIGH_PERFORMANCE` — Agent with highest MRR (SUCCESS)
- `SMS_ALERT` — Business SMS usage >= 4000 (WARNING)
- `FINANCIAL_RUNWAY` — Runway check (< 3 months = DANGER, < 6 = WARNING, >= 6 = SUCCESS)

---

## Module 2: PnL (`/pnl`)

### GET /pnl/break-even

Break-even analysis data.

**Response:**
```json
{
  "activeBusinesses": 340,
  "arpu": 3676.47,
  "breakEvenBusinesses": 200,
  "breakEvenRevenue": 735294,
  "progressPercent": 58.82,
  "remainingGap": 514706,
  "isProfitable": false,
  "totalMonthlyCosts": 500000,
  "monthlyFixedCosts": 250000,
  "grossRevenue": 1250000
}
```

**Computation:**
| Field | Formula |
|-------|---------|
| grossRevenue | SUM of SUBSCRIPTION + SMS amounts |
| monthlyFixedCosts | SUM of EXPENSE amounts |
| totalMonthlyCosts | SUM(EXPENSES) + SUM(COMMISSIONS) |
| arpu | grossRevenue / activeBusinesses |
| commissionRate | totalCommissions / grossRevenue |
| breakEvenRevenue | monthlyFixedCosts / (1 - commissionRate) |
| breakEvenBusinesses | ceil(breakEvenRevenue / arpu) |
| progressPercent | (grossRevenue / breakEvenRevenue) * 100 |
| isProfitable | grossRevenue > 0 AND grossRevenue >= breakEvenRevenue |

---

### GET /pnl/runway

Cash runway analysis.

**Response:**
```json
{
  "openingCashBalance": 2500000,
  "closingCashBalance": 2100000,
  "monthlyNetCashFlow": -400000,
  "monthlyBurnRate": 400000,
  "runwayMonths": 5.25
}
```

**Computation:**
| Field | Formula |
|-------|---------|
| inflow | SUM of all transaction amounts |
| outflow | SUM of all transaction costs |
| monthlyBurnRate | SUM(EXPENSES) + SUM(COMMISSIONS) |
| closingCashBalance | inflow - outflow |
| runwayMonths | closingCashBalance / monthlyBurnRate |

---

## Module 3: Financial Planning (`/financial-planning`)

### POST /financial-planning/targets

Create a new budget target.

**Request:**
```json
{
  "periodType": "monthly",
  "targetRevenue": 5000000,
  "targetBusinesses": 500,
  "targetSmsUsage": 10000,
  "targetEmailUsage": 5000,
  "profitMargin": 30,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| periodType | Enum: `daily`, `weekly`, `monthly`, `yearly` |
| targetRevenue | Number >= 0 |
| targetBusinesses | Number >= 0 |
| targetSmsUsage | Number >= 0 |
| targetEmailUsage | Number >= 0 |
| profitMargin | Number 0-100 |
| startDate | ISO date string |
| endDate | ISO date string |

**Response:**
```json
{
  "id": "uuid",
  "periodType": "monthly",
  "targetRevenue": 5000000,
  "targetBusinesses": 500,
  "targetSmsUsage": 10000,
  "targetEmailUsage": 5000,
  "profitMargin": 30,
  "achievedRevenuePercentage": 45.5,
  "achievedProfitPercentage": 38.2,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

---

### GET /financial-planning/targets

Fetch saved budget targets.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| periodType | string (optional) | Filter by period type: `daily`, `weekly`, `monthly`, `yearly` |

**Response:** Array of target objects (same shape as POST response).

---

### POST /financial-planning/scenarios

Simulate financial scenarios (Best / Expected / Worst case projections).

**Request:**
```json
{
  "currentBusinesses": 340,
  "growthRate": 10,
  "churnRate": 5,
  "pricing": 5000,
  "agentFactor": 1.5,
  "projectionMonths": 12,
  "profitMargin": 30
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| currentBusinesses | Number >= 0 |
| growthRate | Number 0-100 |
| churnRate | Number 0-20 |
| pricing | Number >= 0 |
| agentFactor | Number 0.5-5 |
| projectionMonths | Number 1-24 |
| profitMargin | Number 0-100 |

**Formula (per month per scenario):**
```
businesses *= (1 + (growthRate/100) * agentFactor) * (1 - churnRate/100)
monthRevenue = businesses * pricing
monthProfit = monthRevenue * (profitMargin / 100)
```

**Multipliers:**
| Scenario | Growth | Churn | Factor | Pricing |
|----------|--------|-------|--------|---------|
| Best | x1.5 | x0.8 | x1.2 | 1x |
| Expected | 1x | 1x | 1x | 1x |
| Worst | x0.3 | +5 | x0.7 | x0.7 |

**Response:**
```json
{
  "best": {
    "totalProfit": 5000000,
    "monthlyBreakdown": [
      { "month": 1, "businesses": 340, "profit": 500000 }
    ]
  },
  "expected": {
    "totalProfit": 3000000,
    "monthlyBreakdown": [
      { "month": 1, "businesses": 340, "profit": 300000 }
    ]
  },
  "worst": {
    "totalProfit": 1000000,
    "monthlyBreakdown": [
      { "month": 1, "businesses": 340, "profit": 100000 }
    ]
  }
}
```

---

## Module 4: Forecasting (`/forecasting`)

### POST /forecasting/project

Run a forecast projection engine.

**Request:**
```json
{
  "baseBusinesses": 340,
  "arpu": 3676.47,
  "fixedCosts": 250000,
  "grossRevenue": 1250000,
  "variableCostMargin": 0.6,
  "cashBalance": 2500000,
  "qrThriveLeadsPerMonth": 0,
  "period": 12,
  "growthRate": 10,
  "churnRate": 5,
  "conversionRate": 15
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| baseBusinesses | Number >= 0 |
| arpu | Number >= 0 |
| fixedCosts | Number >= 0 |
| grossRevenue | Number >= 0 |
| variableCostMargin | Number 0-1 |
| cashBalance | Number >= 0 |
| qrThriveLeadsPerMonth | Number >= 0 |
| period | Number 1-36 |
| growthRate | Number 0-50 |
| churnRate | Number 0-30 |
| conversionRate | Number 0-100 |

**Formula (per month):**
```
newConversions = qrThriveLeadsPerMonth * (conversionRate / 100)
organicNew = round(currentBiz * (growthRate / 100))
churned = round(currentBiz * (churnRate / 100))
currentBiz = currentBiz + organicNew + newConversions - churned
mrr = currentBiz * arpu
profit = mrr * variableCostMargin - fixedCosts
inflow = mrr
outflow = mrr * (1 - variableCostMargin) + fixedCosts
currentCash += profit
```

**Response:**
```json
{
  "summary": {
    "projectedMrr": 1800000,
    "mrrGrowthPercent": 44.0,
    "totalProjectedProfit": 7200000,
    "isDeclining": false,
    "healthAlert": "HEALTHY"
  },
  "monthlyData": [
    {
      "month": "Month 1",
      "businesses": 340,
      "mrr": 1250000,
      "profit": 500000,
      "inflow": 1250000,
      "outflow": 750000,
      "cashBalance": 2100000
    }
  ]
}
```

**Health alerts:**
- `HEALTHY` — Cash balance >= starting balance AND MRR growth >= 0
- `HIGH_RISK` — Cash declining OR MRR shrinking

---

### POST /forecasting/persist

Save a forecast scenario to the database.

**Request:**
```json
{
  "scenarioName": "Q1 2026 Projection",
  "parameters": {
    "growthRate": 10,
    "churnRate": 5,
    "conversionRate": 15,
    "period": 12
  },
  "result": {
    "summary": { ... },
    "monthlyData": [ ... ]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "scenarioName": "Q1 2026 Projection",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "parameters": {
    "growthRate": 10,
    "churnRate": 5,
    "conversionRate": 15,
    "period": 12
  },
  "summary": {
    "projectedMrr": 1800000,
    "mrrGrowthPercent": 44,
    "totalProjectedProfit": 7200000,
    "isDeclining": false,
    "healthAlert": "HEALTHY"
  }
}
```

---

### GET /forecasting/history

Fetch previously saved forecasts.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "scenarioName": "Q1 2026 Projection",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "parameters": {
        "growthRate": 10,
        "churnRate": 5,
        "conversionRate": 15,
        "period": 12
      },
      "summary": {
        "projectedMrr": 1800000,
        "mrrGrowthPercent": 44,
        "totalProjectedProfit": 7200000,
        "isDeclining": false,
        "healthAlert": "HEALTHY"
      }
    }
  ]
}
```

---

## Database Tables

| Table | Entity | Purpose |
|-------|--------|---------|
| `fos_transactions` | FinancialTransaction | Financial ledger (all money movements) |
| `fos_metrics_snapshots` | MetricsSnapshot | Daily aggregated metrics |
| `fos_financial_targets` | FinancialTarget | Budget planner targets |
| `fos_forecast_scenarios` | ForecastScenario | Saved forecast scenarios |

All tables use `synchronize: true` in test/dev mode — tables are auto-created by TypeORM.

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common error codes:
| HTTP Status | Meaning |
|-------------|---------|
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (not ADMIN role) |
| 400 | Validation error (invalid DTO fields) |
| 500 | Internal server error |

---

## Endpoint Quick Reference

| Method | Path | Auth | Module |
|--------|------|------|--------|
| GET | /dashboard/stats | ADMIN | fos-dashboard |
| GET | /dashboard/snapshots | ADMIN | fos-dashboard |
| GET | /dashboard/insights | ADMIN | fos-dashboard |
| GET | /pnl/break-even | ADMIN | fos-pnl |
| GET | /pnl/runway | ADMIN | fos-pnl |
| POST | /financial-planning/targets | ADMIN | fos-financial-planning |
| GET | /financial-planning/targets | ADMIN | fos-financial-planning |
| POST | /financial-planning/scenarios | ADMIN | fos-financial-planning |
| POST | /forecasting/project | ADMIN | fos-forecasting |
| POST | /forecasting/persist | ADMIN | fos-forecasting |
| GET | /forecasting/history | ADMIN | fos-forecasting |
