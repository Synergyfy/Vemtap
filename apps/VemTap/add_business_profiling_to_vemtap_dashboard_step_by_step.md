# 🧩 ADD BUSINESS PROFILING TO VEMTAP DASHBOARD (STEP-BY-STEP GUIDE)

This explains clearly how to add the **Vemtap Business Profiling Form (Pre-Approach)** into your dashboard so both **Agents (Sales Reps)** and **Admins** can use it easily — with exact UI screens.

---

# 🎯 1. GOAL

- Agents can fill business profiles from their dashboard
- Admins can see all profiles in one place
- Admins can also create/edit profiles
- Everything is simple, fast, and mobile-friendly

---

# 🧭 2. WHERE IT SHOULD LIVE IN THE DASHBOARD

## Add a New Tab in Sidebar:

**Name:** Business Profiling

### For Agent Dashboard:
- Home
- Customers
- Messages
- **Business Profiling (NEW)**

### For Admin Dashboard:
- Dashboard
- Businesses
- Analytics
- Team
- **Business Profiling (NEW)**

👉 Clicking opens the profiling system

---

# 🧱 3. MAIN PAGES INSIDE BUSINESS PROFILING

Tabs at the top:
- Overview | All Profiles | + New Profile

---

# 📊 4. OVERVIEW PAGE

## Content:
- Total Profiles
- High / Medium / Low priority
- Recent Profiles
- Status summary

## 🎨 UI SCREEN (HOW IT SHOULD LOOK):

Top:
[ Business Profiling ]
[ Overview | All Profiles | + New Profile ]

Cards Row:
[ Total: 120 ] [ High: 40 ] [ Medium: 50 ] [ Low: 30 ]

Below:
Recent Profiles (table)
| Name | Priority | Status |

Below:
Status Chart (simple bars)

👉 Design:
- Clean white background
- Cards with soft shadows
- Priority colors:
  - High = Red
  - Medium = Orange
  - Low = Green

---

# 📋 5. ALL PROFILES PAGE

## Content:
- List of all profiles
- Search + filters

## 🎨 UI SCREEN:

Top:
Search bar: [ Search business... ]
Filters: [ Priority ▼ ] [ Status ▼ ] [ Type ▼ ]

Table:
| Business | Location | Type | Priority | Status | Score | Action |

Example Row:
| Chicken Republic | Wuse | Restaurant | High | Contacted | 18 | View |

👉 Priority = colored badge
👉 Status = dropdown (click to change)

Bottom:
Pagination (Next / Prev)

---

# ➕ 6. CREATE PROFILE PAGE

## Content:
Full form (all sections)

## 🎨 UI SCREEN:

Top:
[ ← Back ]  Business Profiling Form

Sections (accordion style):

▼ Basic Info
[ Input fields ]

▼ Physical Setup
[ Checkboxes ]

▼ QR Placement
[ Options ]

...

Bottom sticky bar:
[ Save Draft ]   [ Save & Generate Insights ]

👉 Design rules:
- Large inputs
- Spacing between sections
- Scrollable
- Sticky buttons at bottom

---

# 🤖 7. AFTER SAVE (INSIGHTS SCREEN)

## Content:
Auto results

## 🎨 UI SCREEN:

Header:
Business Name
Priority Badge (e.g. HIGH)

Sections:

🧠 Recommendations:
- Use Table QR + Window QR

📦 Package:
- Growth Package

💡 Pitch:
- "You have high traffic, we can help capture customers"

Buttons:
[ Edit ]   [ Download PDF ]   [ Mark as Contacted ]

👉 Highlight this section with light background color

---

# 📄 8. PROFILE DETAIL PAGE

## Content:
- All filled data
- Insights
- Status

## 🎨 UI SCREEN:

Top:
Business Name
Priority Badge | Status Dropdown

Tabs:
[ Details | Insights | Notes ]

Details Tab:
- All form answers neatly grouped

Insights Tab:
- Recommendations
- Package
- Pitch

Notes Tab:
- Add notes
- Timeline (future)

Buttons (top right):
[ Edit ] [ Download PDF ]

---

# 📥 9. PDF DOWNLOAD

## Content:
- Clean report

## 🎨 LOOK:
- Logo at top
- Business name
- Sections:
  - Problems
  - Recommendations
  - Package
  - Pitch

👉 Should look professional (client-facing)

---

# 🔄 10. STATUS SYSTEM

## UI:
Status dropdown everywhere:
[ Not Contacted ▼ ]

Options:
- Not Contacted
- Contacted
- Interested
- Closed

👉 Color codes:
- Not Contacted = Grey
- Contacted = Blue
- Interested = Orange
- Closed = Green

---

# 👥 11. PERMISSIONS

## Agent:
- Create
- Edit own
- Update status

## Admin:
- Full access

👉 UI Difference:
Admin sees extra filters + all data

---

# 🔔 12. UX RULES

- Mobile-first (very important)
- Big buttons
- Minimal typing
- Fast loading
- Clear labels

---

# ⚙️ 13. BACKEND REQUIREMENTS

- Save all profiles
- Link to user
- Store scores + status

---

# 🚀 14. BUILD ORDER

1. Database
2. API
3. List page
4. Form page
5. Detail page
6. Insights logic
7. PDF

---

# ✅ FINAL RESULT

- Simple for agents
- Powerful for admin
- Structured sales system

---

# END

