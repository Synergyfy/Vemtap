# Analytics API Integration Guide: Footfall, Visit Duration & Branch Scoping

This document details the updated **Analytics API** endpoints, including **multi-tenant branch scoping** and the **dynamic visit duration metrics**.

---

## 1. Key Updates Overview

1. **Strict Tenant-Scoped Branch Validation**:
   - Querying with `?branchId=<branchId>` is validated against the authenticated user's business (`user.businessId`).
   - If a user attempts to pass a `branchId` from another business/tenant, the backend safely falls back to an empty result set (`[]`) instead of leaking cross-tenant data.
2. **Aggregated "All Branches" Querying**:
   - Omitting `branchId` or passing `?branchId=all` aggregates metrics across all branches owned by the business, including direct business-level visits.
3. **Dynamic Visit Duration Metrics**:
   - `GET /analytics/footfall` now returns a structured `visitDuration` object containing `averageStay`, `trendText`, and a breakdown across 3 duration brackets (`< 15 mins`, `15-45 mins`, `45+ mins`) with formatted visitor counts (`p`) and percentages (`time`).

---

## 2. Authentication & Authorization

All analytics endpoints require:
- **Authorization Header**: `Bearer <JWT_TOKEN>`
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, `AnalyticsLevelGuard`

| Endpoint | Required Role | Required Permission | Required Plan Tier |
| :--- | :--- | :--- | :--- |
| `GET /analytics/dashboard` | `OWNER`, `MANAGER`, `ADMIN`, `STAFF` | `analytics`, `dashboard` | `basic` (or above) |
| `GET /analytics/footfall` | `OWNER`, `MANAGER`, `ADMIN` | `analytics` | `advanced` (or above) |
| `GET /analytics/peak-times` | `OWNER`, `MANAGER`, `ADMIN` | `analytics` | `advanced` (or above) |

---

## 3. Query Parameter: Branch Filtering

All tenant analytics endpoints accept the optional query parameter `branchId`:

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `branchId` | `string` | No | Target branch ID or `'all'`. If omitted or `'all'`, aggregates all branches for the business. | `?branchId=all`<br>`?branchId=550e8400-e29b-41d4-a716-446655440000` |

---

## 4. Endpoints & Response Specifications

### A. Footfall Analytics (Visits & Duration)
`GET /api/v1/analytics/footfall`

#### Query Parameters:
```http
GET /api/v1/analytics/footfall?branchId=all
```

#### Response Payload (`200 OK`):
```json
{
  "stats": [
    { "label": "Total Footfall", "value": "1,240" },
    { "label": "Unique Visitors", "value": "980" },
    { "label": "Repeat Visits", "value": "260" },
    { "label": "Avg Daily Visits", "value": "42" }
  ],
  "hourlyData": [
    { "hour": "8 AM", "count": 12 },
    { "hour": "9 AM", "count": 28 },
    { "hour": "10 AM", "count": 45 },
    { "hour": "11 AM", "count": 62 },
    { "hour": "12 PM", "count": 94 },
    { "hour": "1 PM", "count": 88 },
    { "hour": "2 PM", "count": 75 },
    { "hour": "3 PM", "count": 80 },
    { "hour": "4 PM", "count": 110 },
    { "hour": "5 PM", "count": 135 },
    { "hour": "6 PM", "count": 150 },
    { "hour": "7 PM", "count": 120 },
    { "hour": "8 PM", "count": 90 },
    { "hour": "9 PM", "count": 40 }
  ],
  "trafficByEntrance": [
    {
      "name": "Main Entrance Counter",
      "count": 744,
      "percentage": "60%"
    },
    {
      "name": "VIP Lounge QR",
      "count": 496,
      "percentage": "40%"
    }
  ],
  "visitDuration": {
    "averageStay": "18m 45s",
    "trendText": "+4.2%",
    "distribution": [
      {
        "label": "< 15 mins",
        "p": "558",
        "time": "45%"
      },
      {
        "label": "15-45 mins",
        "p": "471",
        "time": "38%"
      },
      {
        "label": "45+ mins",
        "p": "211",
        "time": "17%"
      }
    ]
  }
}
```

---

### B. Dashboard Overview Analytics
`GET /api/v1/analytics/dashboard`

#### Query Parameters:
```http
GET /api/v1/analytics/dashboard?branchId=all
```

#### Response Payload (`200 OK`):
```json
{
  "stats": [
    { "label": "Total Visitors", "value": 1240 },
    { "label": "New Visitors", "value": 310 },
    { "label": "Total Taps", "value": 1850 },
    { "label": "Messages Sent", "value": 420 }
  ],
  "peakTimes": {},
  "messagingRoi": {},
  "engagementQuality": {},
  "topPerformers": []
}
```

---

### C. Peak Times Analytics
`GET /api/v1/analytics/peak-times`

#### Query Parameters:
```http
GET /api/v1/analytics/peak-times?branchId=all
```

#### Response Payload (`200 OK`):
```json
{
  "weeklyData": [
    { "day": "Mon", "hours": [5, 12, 20, 35, 45, 50, 40, 25, 15, 8] },
    { "day": "Tue", "hours": [8, 15, 25, 40, 55, 60, 48, 30, 18, 10] },
    { "day": "Wed", "hours": [10, 18, 30, 42, 58, 62, 50, 32, 20, 12] },
    { "day": "Thu", "hours": [12, 20, 32, 45, 60, 65, 52, 35, 22, 14] },
    { "day": "Fri", "hours": [15, 28, 45, 60, 80, 95, 85, 60, 40, 25] },
    { "day": "Sat", "hours": [20, 40, 65, 85, 110, 130, 115, 80, 55, 30] },
    { "day": "Sun", "hours": [18, 35, 55, 70, 90, 105, 95, 65, 45, 20] }
  ],
  "hoursLabels": [
    "10am",
    "12pm",
    "2pm",
    "4pm",
    "6pm",
    "8pm",
    "10pm",
    "12am"
  ],
  "smartSuggestion": {
    "peakTime": "Saturdays between 6pm - 8pm",
    "recommendation": "Based on your peak times (Saturdays between 6pm - 8pm), we suggest adding **2 additional staff** members during this window."
  }
}
```

---

## 5. TypeScript Types for Frontend

You can drop these interfaces directly into your frontend project:

```typescript
export interface AnalyticsStat {
  label: string;
  value: string | number;
  trend?: string;
  isUp?: boolean;
  change?: number;
}

export interface HourlyTraffic {
  hour: string;
  count: number;
}

export interface TrafficByEntrance {
  name: string;
  count: number;
  percentage: string;
}

export interface VisitDurationDistribution {
  label: string; // e.g. "< 15 mins", "15-45 mins", "45+ mins"
  p: string;     // Visitor count formatted, e.g. "558"
  time: string;  // Percentage string, e.g. "45%"
}

export interface VisitDuration {
  averageStay: string; // e.g. "18m 45s"
  trendText: string;   // e.g. "+4.2%"
  distribution: VisitDurationDistribution[];
}

export interface FootfallAnalyticsResponse {
  stats: AnalyticsStat[];
  hourlyData: HourlyTraffic[];
  trafficByEntrance: TrafficByEntrance[];
  visitDuration: VisitDuration;
}

export interface WeeklyData {
  day: string;
  hours: number[];
}

export interface SmartSuggestion {
  peakTime: string;
  recommendation?: string;
}

export interface PeakTimesAnalyticsResponse {
  weeklyData: WeeklyData[];
  hoursLabels: string[];
  smartSuggestion: SmartSuggestion | null;
}
```

---

## 6. Frontend Integration Examples (React / Next.js)

### Example: Fetching Footfall & Rendering Visit Duration Card

```tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FootfallAnalyticsResponse } from './types';

interface FootfallDashboardProps {
  selectedBranchId: string; // 'all' or branch UUID
}

export const FootfallDashboard: React.FC<FootfallDashboardProps> = ({ selectedBranchId }) => {
  const [data, setData] = useState<FootfallAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFootfall() {
      try {
        setLoading(true);
        const res = await axios.get<FootfallAnalyticsResponse>('/api/v1/analytics/footfall', {
          params: { branchId: selectedBranchId },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load footfall analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFootfall();
  }, [selectedBranchId]);

  if (loading) return <div>Loading footfall metrics...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="analytics-grid">
      {/* 1. Key Stat Cards */}
      <div className="stat-cards">
        {data.stats.map((s) => (
          <div key={s.label} className="card">
            <h4>{s.label}</h4>
            <p className="value">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 2. Visit Duration Card */}
      <div className="duration-card">
        <h3>Visit Duration</h3>
        <div className="avg-stay">
          <span>Average Stay</span>
          <strong>{data.visitDuration.averageStay}</strong>
          <span className="trend positive">{data.visitDuration.trendText}</span>
        </div>

        <div className="distribution-bars">
          {data.visitDuration.distribution.map((dist) => (
            <div key={dist.label} className="dist-row">
              <span className="label">{dist.label}</span>
              <div className="bar-wrapper">
                <div className="bar-fill" style={{ width: dist.time }} />
              </div>
              <span className="pct">{dist.time} ({dist.p} visitors)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```
