# VEMTAP — Business Dashboard Walkthrough (Owner Role)

> **Purpose:** Reference for UI/UX redesign. Describes every page/section visible to the **Owner** role in the business dashboard, what data it shows, what actions exist, and how flows connect. Generated from current `apps/VemTap` codebase (Sept 2026).

---

## 0. Global Shell

- **Layout:** `DashboardSidebar` + `DashboardMobileNav` (bottom tab) + top bar + main scroll area.
- **Top Bar (all pages):** Business/branch switcher (logo, branch name), task checklist bell (pending onboarding %), orders bell (new orders count), notifications bell, fullscreen toggle, user menu (Profile, Settings, Help, Install PWA, Logout).
- **Sidebar (owner):** Sections: *My Store* (Sales, Products & Stock, Customers), *Customer Engagement* (In-App Chat, Channels, Forms), *Customer Experience* (My Business QR, Marketing Kit), *Get Customers* (Discovery, Deals), *Analytics*, *Manage Location* (Staff, Locations), *QRThrive*, *Settings* (Profile, Subscription, Support, Compliance). Searchable, collapsible, favorites pinning.
- **Bottom Sheet Modals:** All `<Modal>` now default to bottom-sheet on mobile (`rounded-t-[28px]`, slide up `y:100%→0`), centered scale on desktop. Close only via **X**.
- **Branch Context:** Most pages are branch-scoped via `useActiveBranch()`. “All Branches” shows a warning banner and disables branch-specific data.

---

## 1. Dashboard (`/dashboard`) — The Home

**Hero Header (blue banner):**
- Greeting: “Good Morning/Afternoon/Evening, {firstName}”
- Hero KPI: **Today’s Sales** — large `₦{salesValue}` pulled from `analytics.stats` or `dashboard.stats`.
- Overlapping 3 snapshot cards (absolute `-bottom-10`): Total Visitors, Customers Captured, Active Loyalty Members — white `rounded-2xl`, icon color-coded.

**Below the fold (pt-6 spacing):**
- `DashboardBannerWrapper` (AI insights banner)
- `OnboardingChecklist` (tasks %)
- **Quick Actions** (horizontal scroll on mobile, 4-col grid on desktop): Create Deals → `/discovery/deals`, POS Terminal → `/pos`, Add Product → `/catalogue/products?action=add`, Refer a Business → `/business-partnership`. Role-filtered for cashier/inventory/marketing.
- **Business Health** — collapsible metrics: Customer Growth, QR Scan Activity (bars with % trend).
- **Recent Activity** feed — 1 visible row + “Show all” expand, from `analytics.recentVisitors` / `dashboard.recentVisitors`.
- **Manage Your Business** grid (8 modules): Customers, Deals, Sales, Partnership, Insights, Channels, Loyalty, Settings — each navigates to its section.

---

## 2. My Store

### 2.1 Sales (`/dashboard/sales`)

- **Blue Banner:** `Sales Dashboard / Overview` + Today’s Revenue `₦{totalRevenue}` (sum of today’s `completedSales`).
- **Overlapping 3 Cards:** Today’s Sales (count), Active Orders (`heldSales.length`), Avg Order (`totalRevenue / count`).
- **Content:**
  - **New Sale** CTA (large blue button) → `/dashboard/pos`
  - **Secondary Actions:** View Orders → `/pos/orders`, Sales History → `/pos/sales`
  - **Recent Transactions** table (5 latest, sorted by date) — ID, time, items count, total `₦`, status badge. “View All” → `/pos/sales`.

### 2.2 POS Home (`/dashboard/pos`)

- Product grid, cart panel, held sales, customer selector, discount modal, payment flow. (POS-specific, not fully covered here — see `components/dashboard/pos`.)

### 2.3 Orders (`/dashboard/pos/orders`)

- **Blue Banner:** Management / Orders & Claims + Total Orders ` {stats.total}`.
- **Tab Switcher (overlapping):** Orders | Deal Claims.
- **Orders Tab:** Summary stats (3-col: Total, Pending, Completed + claim stats), filter by status, list of orders with customer, total, date, status. Actions: view, process, delete.
- **Claims Tab:** List of deal claims with verify/redeem.

### 2.4 Products & Stock (`/dashboard/products-stock`)

- **Header:** No blue banner — white header via `POSPageHeader`: “Products & Stock — Manage your catalogue and track inventory levels”.
- **Stats Grid (2×2 on mobile, 4 on desktop):** Total Products (blue), Total Stock Units (Active count), Inventory Value (`costPrice * stockQuantity` sum), Needs Attention (Low + Out of Stock count with alert icon).
- **Quick Actions:** Add Product → `/catalogue/products`, Receive Stock → `/inventory/receiving`, View Catalogue → `/catalogue`, Manage Inventory → `/inventory`.
- **Low Stock Items** (amber section) + **Recently Added Products** (5 latest, image, name, category, price, stock).

### 2.5 Catalogue

- **`/dashboard/catalogue`** — Overview landing.
  - Header with category icon.
  - **Stats:** Products count, Services count, Categories, Pending Requests (orders).
  - **Recently Added** (5 items) + **Low Stock** + quick links to products/categories/orders.
- **`/dashboard/catalogue/products`** — Main list.
  - **Header:** Catalogue / Manage your products and services + Add Product/Service button.
  - **Tab Switcher:** Products (count) | Services (count) — filters `itemType`.
  - Search bar + category dropdown.
  - **Desktop:** `DataTable` with columns: Product (image+name), Category, Price (handles service `contact`/`range`/`starting_from`), Stock (or “Service”), Loyalty Points, Total Value (hidden for services), Deal (Active Deal badge), Status, Actions (portal dropdown: View Details → `/products/[id]`, Edit, Make Deal → `MakeDealFlow`, Delete).
  - **Mobile:** Compact ecommerce rows: `14x14` image, title, subtitle, price label, `ChevronRight` → `/products/[id]`. `2×2` not — list.
  - Pagination at bottom (`pb-28` to clear bottom nav).
  - **Modals:** `AddProductMethodModal` (Manual/Bulk/Barcode) for products; `ProductModal` (3 steps: Details, Pricing, Images) for products; `ServiceForm` (4 steps: Details, Pricing, Service Info, Images) for services — both bottom-sheet on mobile, category creation inline, crop via `z-[600]`.
- **`/dashboard/catalogue/products/[id]`** — Details page.
  - Non-sticky header (`isSticky={false}`), `pb-28`.
  - Actions: Edit (ServiceForm or ProductModal), Make Deal (amber gradient), Delete.
  - Left: main image + gallery (3-col grid).
  - Right: Pricing (with discount strikethrough + badge), Current Status badge, Inventory & Logistics (Stock, SKU, Backorders, Loyalty), Product Information (Category chip, Full Description).
- **Other catalogue pages:** `/categories`, `/offers`, `/orders`, `/bookings`, `/menus`, `/import` — manage categories, bundle offers (Deal), inbound orders, bookings, publication menus.

---

## 3. Customers

### 3.1 Visitors Overview (`/dashboard/visitors`)

- **Tabs:** Overview | Customer List | Segments | Activity | New vs Returning | Import.
- KPIs, visit trends, recent visitors.

### 3.2 Customer List (`/dashboard/visitors/all`)

- Table of customers (name, phone, email, visits, tier), search, segments, import.

### 3.3 Loyalty (`/dashboard/loyalty`)

- Programs, rewards, points, redemption flow. Claims integration.

---

## 4. Customer Engagement

### 4.1 In-App Chat (`/dashboard/messaging/chat`)

- Full-height chat layout (`overflow-hidden` when active). Contacts list + conversation pane.

### 4.2 Channels (`/dashboard/messaging`)

- Channel setup cards: SMS, WhatsApp, Email, In-App. Status, credits.

### 4.3 Forms (`/dashboard/engagement/forms`)

- List of forms, create/edit, responses, active form preview. Uses `CreateSegmentModal`, form builder.

---

## 5. Customer Experience

### 5.1 My Business QR (`/dashboard/customer-experience`)

- QR code display, download, setup steps for customer capture.

### 5.2 Marketing Kit (`/dashboard/marketing-assets`)

- Printable assets (flyers, stickers, posters), asset preview, download.

---

## 6. Get Customers (Discovery & Growth)

### 6.1 Discovery (`/dashboard/discovery`)

- **Blue Banner:** Network / Discovery + “Connect & Grow — Get more customers from nearby businesses.” Overlapping tab pills: Overview, Partners, Customers, Results, Settings.
- **Warning:** “Select a branch” amber card when `isAllBranches`.
- **Overview Tab:**
  - **KPI Grid (2×2 on mobile, 4 on desktop, compact):** People Reached, Customers Visited, Offers Redeemed, Revenue Generated — `p-4 sm:p-6`, `text-xl sm:text-3xl`.
  - **CTA Cards (3):** Create Deal (primary blue) → `/discovery/deals`, Find Partners (outline) → Partners tab, View Results → Results tab.
  - **Highlights:** Best Deal (visits) + Top Partner (customers sent).
  - **Recent Customer Visits** (4) with time ago, promo badge.
- **Partners Tab:**
  - Sub-tabs: Active Partners | Find Partners (map + radius slider + GPS live location watch) | Incoming Requests (with accept/reject reason) | Recommend Business.
  - `NearbyMap` (recharts + dynamic import), partner list with Connect button → invite modal.
- **Customers / Results / Settings Tabs:** Customer list, discovery results chart, discovery settings (radius, visibility).

### 6.2 Deals (`/dashboard/discovery/deals`)

- **Blue Banner:** Marketplace / Deals + “Attract Customers — Create and manage deals.” Plus button. Overlapping: none.
- **Filters:** Status dropdown (Active/All/Expired/Paused with counts) + Type filter (All / Has Products / Has Services). `price-preview` tax integration.
- **Deals Grid:** 2-col mobile, 4-col desktop. Cards: image, title, discount badge, `price` vs `originalPrice`, deal price, days left, claim progress, star seller.
- **Empty/Error States:** first-deal CTA, no-filter-match, error retry.
- **Create Flow:** 5-step wizard `CreatePromotionFlow` (Deal Type: Discount/Free Item/Special/Free Delivery/Custom → Deal Details: Title, Products Included [All/Select/Custom], Type-specific fields, Description, Dates, Images, Advanced [Quantity, Audience, Max Claims Per Customer, Claim Code Prefix, Terms with AI generate] → Audience → Preview → Publish). Also supports **Import Product** flow: `Import Product` button (amber outline) next to Create Deal → product selector modal (search products) → `MakeDealFlow` (3 steps: Deal Type, Deal Details pre-filled from product, Preview).

### 6.3 Deal Reviews (`/dashboard/feedback/deal-reviews`)

- Reviews for deals, ratings, response actions.

### 6.4 Business Partnership (`/dashboard/business-partnership`)

- Network, Agreements, Earnings, Resources, Wallet, Rewards, Settings, Card, Leaderboard, Analytics subpages. Referral and commission handling.

---

## 7. Analytics (`/dashboard/analytics`)

- **Overview:** Executive summary, AI reports, sales reports, inventory reports, customers, discovery, footfall, marketing, peak times.
- Each subpage has charts (recharts Bar), filters by date/branch, export.

---

## 8. Manage Location

### 8.1 Staff (`/dashboard/staff`)

- Team list, invite, roles (owner/manager/cashier/inventory/marketing/customer_service), permissions, activity log. Invite modal, role change.

### 8.2 Locations (`/dashboard/settings/branches`)

- Branch list, add/edit branch, set location (map + GPS), hours, contact.

---

## 9. QRThrive (`/dashboard/explore-qrthrive`)

- Explore QRThrive marketplace, SSO, leads. External QR system integration.

---

## 10. Settings

- **Profile (`/dashboard/settings/profile`):** Business info, logo, user profile, plan badge (platinum etc via `getPlan` from `subscriptionStore`), business hours, etc. Uses `DynamicQRCode`.
- **Subscription (`/dashboard/settings/subscription`):** Current plan, capabilities, upgrade, manage page (`/manage`), details.
- **Support (`/dashboard/support`):** Help, automations, agents.
- **Compliance (`/dashboard/compliance`):** Documents, status.
- **Other:** Privacy, Engagement (user forms, socials, experience).

---

## 11. Product & Service Flows — Key Interactions

- **Add Product:** Products tab → Add Product → Method modal (Manual → ProductModal 3 steps; Bulk → `/import`; Barcode → scanner) → on success shows “Make this a Deal” amber success card → optional `MakeDealFlow`.
- **Add Service:** Services tab → Add Service → ServiceForm 4 steps (Details + category creation inline; Pricing: fixed/starting_from/range/contact with min/max; Service Info: duration pills, serviceMode pills [location/customer/online/flexible], bookable toggle + bookingMethod [vemtap/call/whatsapp/external] + manual `externalBookingLink` input for whatsapp/call/external; Images: crop `z-[600]`). Ghost-click debounced (500ms). Success → optional Make Deal.
- **Make Deal:** Three entry points:
  1. `🔥 Make Deal` in product/service row dropdown → `MakeDealFlow` (Deal Type grid → Deal Details with product prefill: title `{name} Special Offer`, image toggle “Use product image”, price with “This price is only for this deal” + side-by-side Product vs Deal price, dates, terms → Preview card + reassurance → Publish). Payload: `pricingType: fixed_discount_amount` (flat ₦) for Discount/Flash, `fixed_discount_price` for Special, `sum` else; includes `sourceProductId` + `itemIds` + `offerType`.
  2. Deals → Import Product → product search → MakeDealFlow.
  3. Deals → Create Deal → Custom (from scratch).
- **Table Actions:** All use portal dropdown (`fixed` + `z-[9999]`, `createPortal`, `data-menu-dropdown/trigger`) to avoid `overflow-hidden` clipping. Mobile: compact rows with image+title+price+chevron → details page.

---

## 12. Notable UI Patterns to Preserve/Improve

- **Blue Banner Pattern:** `p-4 sm:p-6 max-w-7xl mx-auto` + `section -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 sm:px-6 pt-5 pb-14 rounded-b-[2rem]` + overlapping cards `-bottom-10` + `pt-8` content. Tightened from previous `pt-10 pb-20` + `-bottom-16`.
- **Cards:** White `rounded-2xl sm:rounded-3xl`, `border-gray-100`, `shadow-sm`, `p-4 sm:p-6`, icon `size-8 sm:size-10`, label `text-[10px] sm:text-[13px]`, value `text-xl sm:text-3xl`.
- **Overlapping Tabs:** Discovery deals use pills `h-12 rounded-xl`; discovery uses `bg-white p-1.5 rounded-2xl` with `h-12`.
- **Mobile Native:** Bottom-sheet modals, compact `2×2` grids on `/products-stock`, `grid-cols-2` on mobile for stats, `pb-28` to clear bottom nav, `ChevronRight` in circle for list rows.

---

## 13. Tech Notes for Designer

- **Stack:** Next.js 16 (app dir), Tailwind, Framer Motion, React Query, Zustand (`useSubscriptionStore`, `subscriptionStore`, `useAuthStore`), `react-hook-form` + `zod`, `react-easy-crop`, Cloudinary upload (`/api/upload` base64 fallback).
- **API Prefix:** `api/v1`, `NEXT_PUBLIC_API_URL`. Branch-scoped queries via `useActiveBranch`.
- **Pricing Logic:** `CatalogueOfferPricingType: sum | percentage_discount | fixed_discount_price | fixed_discount_amount` (new). `CatalogueItem: priceType: fixed/starting_from/range/contact`, `priceRangeMin/Max`, `duration`, `serviceMode`, `isBookable`, `bookingMethod`, `externalBookingLink`.
- **Bottom Nav:** `DashboardMobileNav` fixed `bottom-0` — all pages need `pb-28 md:pb-8` to avoid overlap.

---

*End of walkthrough. For any page, read its `page.tsx` under `apps/VemTap/app/dashboard/` — the sections above map 1:1 to files.*
