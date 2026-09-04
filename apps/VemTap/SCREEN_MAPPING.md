# VEMTAP Screen Mapping & UX Redesign Architecture

> **Purpose**: This document maps the Stitch AI generated mobile-native UI screen designs located in `apps/VemTap/Screens/` to their target page routes and component flows across the VemTap platform. It serves as the authoritative blueprint for rebuilding the Landing Page (`/`), Customer Discovery Engine (`/discovery`), Public Business Storefronts (`/b/[slug]`), Catalogue Views, and Deals Flow.

---

## 1. Executive Summary & Design System

The Stitch AI screen designs represent a **Corporate Modern, Mobile-First, Thumb-Friendly** design language engineered specifically for local discovery and customer engagement in the Nigerian market.

### Core Design Tokens
- **Brand Primary**: VEMTAP Blue (`#066CF4` / `#0055C4`)
- **Background Surface**: Neutral Ice Gray (`#F7F9FB`)
- **Card Surfaces**: Pure White (`#FFFFFF`) with `1px` subtle borders (`#E2E8F0` / `#E0E3E5`)
- **Typography**: Inter family (Display, Headline, Body, Label) with 700-weight Naira (`₦`) currency formatting
- **Ergonomics**: Bottom sheet overlays for inputs & filters, bottom touch target navigation, 44px+ minimum tap zones.

---

## 2. Duplicate Resolution & Selection Strategy

When duplicate or closely related screens were generated between **Batch 1** and **Remaining Batches**, the best-of-breed design was selected based on information density, component modularity, and mobile UX clarity:

| Feature Area | Batch 1 Candidate | Remaining Batches Candidate | Chosen Winner & Rationale |
| :--- | :--- | :--- | :--- |
| **Deals Home / Offers Feed** | `deals_home` | `deals_home` | **Remaining Batches `deals_home`**: Includes richer filter tags, dynamic countdown timers, and vendor badges. |
| **Business Storefront Main** | `customer_home_discovery_home` | `public_business_profile_main` & `business_profile_full_populated_view` | **Remaining Batches `business_profile_full_populated_view`**: Provides full tabbed structure (Overview, Products, Services, Deals, Reviews) instead of flat preview. |
| **Catalogue & Product Grid** | `explore_categories` | `products_services_full_populated_catalogue` | **Remaining Batches `products_services_full_populated_catalogue`**: Better supports search, filter pills, and dual product/service toggle. |

---

## 3. Screen Mapping Matrix by Route

### A. Landing Page & Onboarding Flow (`/`)

The new landing page (`/`) combines a high-converting hero experience with interactive preview modals for both customers and business owners.

| Screen Name | Source Folder | Relative Asset Path | Target Codebase Route | UX Purpose / Component Role |
| :--- | :--- | :--- | :--- | :--- |
| **Welcome Discover Vemtap** | Batch 1 | `welcome_discover_vemtap/` | `/` (Landing Hero & Mobile View) | Hero banner, value proposition, "Start Exploring" CTA, and "Register Business" link. |
| **How Vemtap Works** | Batch 1 | `how_vemtap_works/` | `/#how-it-works` or `/how-it-works` | 3-step visual guide (Discover → Scan QR → Claim Deals & Earn Rewards). |
| **Splash App Launch** | Batch 1 | `splash_app_launch/` | PWA Splash / `/welcome` | Mobile app onboarding splash screen for PWA / native mobile wrap. |
| **Account Entry Sign In** | Batch 1 | `account_entry_sign_in/` | `/auth/login` & `/login` | Mobile-optimized phone/email authentication card with social login. |
| **QR Scan Entry** | Batch 1 | `qr_scan_entry/` | `/scan` & `/qr` | Instant camera QR scanner view for customer check-in and deal redemption. |

---

### B. Customer Discovery Engine (`/discovery` & `/customer/home`)

The customer discovery portal enables users to find nearby verified businesses, deals, and local services.

| Screen Name | Source Folder | Relative Asset Path | Target Codebase Route | UX Purpose / Component Role |
| :--- | :--- | :--- | :--- | :--- |
| **Customer Discovery Home** | Batch 1 | `customer_home_discovery_home/` | `/discovery` or `/customer/home` | Main customer hub with location pill, category chips, featured deals, and local business grid. |
| **Explore Categories** | Batch 1 | `explore_categories/` | `/discovery/categories` | Visual grid of business categories (Dining, Salons, Retail, Supermarkets, Automotive). |
| **Discover Search** | Batch 1 | `discover_search/` | `/discovery/search` | Search overlay with recent searches, trending keywords, and predictive autocomplete. |
| **Manual Location Selection** | Batch 1 | `manual_location_selection/` | Modal inside `/discovery` | State/City/Area selector for manual location filtering (e.g., Ikeja, Abuja CBD). |
| **Location Permission** | Batch 1 | `location_permission/` | Bottom sheet / Prompt | High-converting GPS location access request sheet. |
| **Location Confirmed** | Batch 1 | `location_confirmed/` | Toast / Feedback banner | Instant feedback pill showing active selected discovery area. |

---

### C. Deals & Offers Engine (`/discovery/deals`)

A dedicated deals hub for discovering time-sensitive discounts and vouchers.

| Screen Name | Source Folder | Relative Asset Path | Target Codebase Route | UX Purpose / Component Role |
| :--- | :--- | :--- | :--- | :--- |
| **Deals Home (Best)** | Remaining Batches | `deals_home/` | `/discovery/deals` or `/customer/deals` | Main deals feed with filter tags (Hot Deals, Nearby, Flash Sales, Exclusive). |
| **Deal Details** | Remaining Batches | `deal_details/` | `/discovery/deals/[id]` | Full offer page with countdown clock, terms, business info, map snippet, and "Claim Deal" CTA. |
| **Claim Deal Customer Info** | Remaining Batches | `claim_deal_customer_information/` | Modal/Sheet in `/discovery/deals/[id]` | Pre-filled customer contact verification before issuing digital voucher. |
| **Save / Claim Action State** | Remaining Batches | `save_claim_action_state/` | Visual state component | Toggle button states for Bookmark, Saved, and Claimed items. |
| **Deal Claimed Confirmation** | Remaining Batches | `deal_claimed_confirmation/` | `/customer/deals/claimed/success` | Success screen displaying digital voucher barcode/QR code for in-store redemption. |
| **My Claimed Deal** | Remaining Batches | `my_claimed_deal/` | `/customer/deals/my-deals` | Customer wallet pass view showing active, used, and expired deal vouchers. |
| **Deal Search Results** | Remaining Batches | `deal_search_results/` | `/discovery/deals/search` | Filtered list view for deal searches with empty states and sort controls. |
| **Deal Sort Bottom Sheet** | Remaining Batches | `deal_sort_bottom_sheet_state/` | Bottom Sheet | Sort options (Nearest, Highest Discount, Ending Soonest, Most Popular). |
| **Deal Filters Bottom Sheet** | Remaining Batches | `deal_filters_bottom_sheet_state/` | Bottom Sheet | Multi-attribute filter sheet (Price range, Distance, Discount %, Category). |
| **Share Deal Bottom Sheet** | Remaining Batches | `share_deal_bottom_sheet_state/` | Bottom Sheet | Quick share to WhatsApp, Instagram, Copy Link, and QR code sharing. |
| **Deal Reviews** | Remaining Batches | `deal_reviews/` | `/discovery/deals/[id]/reviews` | Customer ratings, verified purchase badges, and review submissions. |
| **Deal Business Preview** | Remaining Batches | `deal_business_preview/` | Embedded Component | Merchant preview card embedded inside deal details page. |

---

### D. Public Business Storefront (`/b/[slug]`)

Public-facing digital storefront for any registered business, accessible via QR scan or direct URL.

| Screen Name | Source Folder | Relative Asset Path | Target Codebase Route | UX Purpose / Component Role |
| :--- | :--- | :--- | :--- | :--- |
| **Public Business Profile Main** | Remaining Batches | `public_business_profile_main/` | `/b/[slug]` | Hero cover, avatar, verification badge, action buttons (Call, Map, Share), and sticky navigation tabs. |
| **Full Populated Profile** | Remaining Batches | `business_profile_full_populated_view/` | `/b/[slug]` (Default view) | Full merchant profile with live offers, popular products, operating status, and customer reviews. |
| **Business Overview / About** | Remaining Batches | `business_overview_about/` | `/b/[slug]` (About Tab) | Merchant story, verified business credentials, facilities, and photo gallery. |
| **Business Hours** | Remaining Batches | `business_hours/` | Component / Sheet | Live operating status badge (Open Now / Closed) and weekly schedule breakdown. |
| **Business Location** | Remaining Batches | `business_location/` | Component / Map Sheet | Interactive map location, address copy, and "Get Directions" navigation trigger. |
| **Business Contact** | Remaining Batches | `business_contact/` | Component / Sheet | Phone, WhatsApp business chat trigger, website link, and social profiles. |
| **Business Reviews** | Remaining Batches | `business_reviews/` | `/b/[slug]` (Reviews Tab) | Overall star rating distribution, verified customer reviews, and owner replies. |
| **Business Actions Sheet** | Remaining Batches | `business_actions_quick_action_bottom_sheet/` | Bottom Sheet | Quick actions sheet (Save to Favorites, Call Business, Share, Report Issue). |
| **Business Share Sheet** | Remaining Batches | `business_share_bottom_sheet/` | Bottom Sheet | Storefront QR code and direct share triggers. |

---

### E. Products & Services Catalogue (`/catalogue` & `/b/[slug]/...`)

Catalog management and customer product/service browsing views.

| Screen Name | Source Folder | Relative Asset Path | Target Codebase Route | UX Purpose / Component Role |
| :--- | :--- | :--- | :--- | :--- |
| **Full Populated Catalogue** | Remaining Batches | `products_services_full_populated_catalogue/` | `/catalogue` & `/b/[slug]/catalogue` | Dual-tab (Products vs Services) global and merchant catalogue view. |
| **Business Products** | Remaining Batches | `business_products/` & `products_business_view/` | `/b/[slug]/products` | Grid layout of physical inventory with price tags, availability status, and add-to-cart/inquire triggers. |
| **Business Services** | Remaining Batches | `business_services/` & `services_business_view/` | `/b/[slug]/services` | Service menu with duration, pricing, description, and "Book Service" triggers. |
| **Product Details** | Remaining Batches | `product_details/` | `/catalogue/products/[id]` or `/b/[slug]/products/[id]` | Full product page with carousel gallery, specifications, pricing, and purchase/inquiry CTA. |
| **Product Image Gallery** | Remaining Batches | `product_image_gallery_state/` | Fullscreen Modal | High-resolution image zoom and multi-angle product gallery overlay. |
| **Product Category Filter** | Remaining Batches | `product_category_filter_state/` | Bottom Sheet | Filter catalogue by specific product sub-categories. |
| **Service Details** | Remaining Batches | `service_details/` | `/catalogue/services/[id]` or `/b/[slug]/services/[id]` | Service breakdown page with provider profile, requirements, and booking slot selection. |
| **Service Booking Action** | Remaining Batches | `service_booking_information_action_state/` | Bottom Sheet / Step | Service appointment request & date/time slot picker sheet. |
| **Service Category Filter** | Remaining Batches | `service_category_filter_state/` | Bottom Sheet | Filter catalogue by specific service categories. |
| **Catalogue Search Results** | Remaining Batches | `catalogue_search_results/` | `/catalogue/search` | Search results page for global or business-specific products and services. |
| **Saved Items State** | Remaining Batches | `saved_product_service_state/` | `/customer/saved` | Customer's saved products, bookmarked services, and favorite merchants. |

---

## 4. Proposed Screen Groupings & Implementation Flows

### Flow 1: High-Converting Landing Page (`/`)
1. **Hero Section** (`welcome_discover_vemtap`): Mobile app mockup on modern backdrop with primary CTA "Start Exploring".
2. **Interactive How It Works** (`how_vemtap_works`): 3-step animated flow demonstrating QR scanning & deal redemption.
3. **Live Discovery Preview** (`customer_home_discovery_home`): Embedded mini-preview of trending deals and local businesses.
4. **Merchant Pitch CTA**: "Own a Business? Join VemTap" triggering the merchant registration flow.

### Flow 2: Seamless Customer Deal Claiming (`/discovery/deals/[id]`)
1. **Browse Feed** (`deals_home`) → **Select Deal** (`deal_details`)
2. **Click "Claim Deal"** → Open `claim_deal_customer_information` sheet
3. **Confirm Details** → Navigate to `deal_claimed_confirmation` with generated barcode/QR pass
4. **Wallet Integration** → Save to `my_claimed_deal` wallet for in-store scanning

### Flow 3: Complete Public Storefront Experience (`/b/[slug]`)
1. **Main Header & Quick Actions** (`public_business_profile_main`)
2. **Tabbed Content Navigation**:
   - **Overview Tab**: `business_overview_about` + `business_hours` + `business_location` + `business_contact`
   - **Deals Tab**: `business_deals`
   - **Products Tab**: `business_products` → `product_details`
   - **Services Tab**: `business_services` → `service_details` → `service_booking_information_action_state`
   - **Reviews Tab**: `business_reviews`

---

## 5. Next Steps & Implementation Roadmap

1. **Phase 1 (Landing Page Redesign)**: Rebuild `/app/page.tsx` using the `welcome_discover_vemtap` and `how_vemtap_works` screen components.
2. **Phase 2 (Public Storefront `/b/[slug]`)**: Rebuild public merchant storefront with tabbed navigation and bottom sheets.
3. **Phase 3 (Discovery Hub `/discovery`)**: Rebuild customer discovery, deal claiming, and location selector sheets.
4. **Phase 4 (Catalogue & Details `/catalogue`)**: Implement unified product/service detail pages and image gallery overlays.
