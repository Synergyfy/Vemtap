# VemTap Frontend Walkthrough — Public-Facing Pages

> Every page, section, and component a user sees **without logging in**.

---

## Table of Contents

1. [Global Layout (All Pages)](#1-global-layout-all-pages)
2. [Homepage `/`](#2-homepage-)
3. [Pricing `/pricing`](#3-pricing-)
4. [Pricing V2 `/pricing-2`](#4-pricing-v2-)
5. [How It Works `/how-it-works`](#5-how-it-works-)
6. [Features `/features`](#6-features-)
7. [For Businesses `/for-businesses`](#7-for-businesses-)
8. [Business Landing `/business-landing`](#8-business-landing-)
9. [Solutions `/solutions`](#9-solutions-)
10. [Solutions — Hardware `/solutions/hardware`](#10-solutions--hardware-)
11. [Solutions — Software `/solutions/software`](#11-solutions--software-)
12. [Contact `/contact`](#12-contact-)
13. [FAQ `/faq`](#13-faq-)
14. [Testimonials `/testimonials`](#14-testimonials-)
15. [Deals `/deals`](#15-deals-)
16. [Promotions `/promotions`](#16-promotions-)
17. [Trust & Security `/trust`](#17-trust--security-)
18. [Terms of Service `/terms`](#18-terms-of-service-)
19. [Privacy Policy `/privacy`](#19-privacy-policy-)
20. [Cookie Policy `/cookie-policy`](#20-cookie-policy-)
21. [Data Processing Agreement `/dpa`](#21-data-processing-agreement-)
22. [Whitepaper `/whitepaper`](#22-whitepaper-)
23. [Support `/support`](#23-support-)
24. [Status `/status`](#24-status-)
25. [Login `/login` & Get Started `/get-started`](#25-login--get-started)
26. [Navbar & Footer](#26-navbar--footer)

---

## 1. Global Layout (All Pages)

Every public page is wrapped in a shared layout consisting of:

### Providers (Root Layout)
- **QueryProvider** — TanStack React Query for server state
- **AuthProvider** — Zustand-based authentication context
- **GoogleAuthProvider** — Google OAuth integration
- **OfflineSyncProvider** — Offline queue for actions
- **PwaInstallProvider** — PWA install prompt management
- **ToastProvider** — Global toast notifications
- **ConflictModal** — Data conflict resolution UI
- **AdminViewerBanner** — Admin viewer mode indicator
- **FloatingBackButton** — Persistent back navigation

### Persistent UI Elements
- **Navbar** — Fixed/sticky top navigation bar (scroll-based blur background)
- **Footer** — 4-column footer with links and social icons
- **CookieBanner** — GDPR/NDPA cookie consent banner
- **SupportChatbot** — Floating chatbot widget

---

## 2. Homepage `/`

**File**: `app/page.tsx` — Client Component  
**Layout**: Navbar + Footer

The homepage is the most content-rich page on the platform. It is structured as a vertical stack of 11 distinct sections:

---

### 2.1 Hero Section (`HomeHero`)

**Type**: Auto-advancing carousel (Embla Carousel)  
**Slides**: 3, auto-advance every 8 seconds  
**Navigation**: Dots + prev/next arrows

#### Slide 1 — Consumer Variant
- Headline: "Discover Deals & Businesses Near You"
- Subheadline: "Explore exclusive offers from local businesses"
- CTA: "Explore Deals"
- Background: Gradient with location imagery

#### Slide 2 — Business Variant
- Headline: "Turn Every Visitor Into A Customer You Can Reach Again"
- Subheadline: "Capture leads, send promotions, grow your business"
- CTA: "Get Started Free"
- Background: Business/dashboard imagery

#### Slide 3 — Discovery Variant
- Headline: "Tap. Discover. Connect."
- Subheadline: "Scan QR codes or tap NFC tags to unlock deals"
- CTA: "How It Works"
- Background: NFC/QR scan imagery

#### LocationPrompt (Modal)
- Triggered when no location is available
- Requests browser geolocation permission
- Offers manual location entry as fallback
- Uses reverse geocoding to resolve coordinates to address

---

### 2.2 Featured Deals (`FeaturedDeals`)

**Badge**: "Trending"  
**Layout**: Horizontal scrollable row of deal cards  
**Data**: `usePublicOffers({ limit: 8, sortBy: 'trending' })` — falls back to mock data

Each `DealCard` displays:
- Deal image/cover photo
- Deal title and business name
- Discount/price info
- Category tag
- Distance (if location available)
- Heart/save icon

---

### 2.3 You May Like (`YouMayLike`)

**Heading**: "Recommended for you"  
**Layout**: Horizontal scrollable row  
**Data**: `usePublicOffers({ limit: 10 })`

Cards include:
- Deal image
- Title, business name
- Like (heart) button with count
- Comment button with count
- Save/bookmark button
- Category and distance info

---

### 2.4 New on Vemtap (`NewOnVemtap`)

**Heading**: "New on Vemtap"  
**Layout**: Horizontal scrollable row  
**Data**: `usePublicBusinesses({ sortBy: 'newest', limit: 8 })`

Business cards show:
- Business logo
- Business name
- Category
- Location/address
- "New" badge

---

### 2.5 Popular Now (`PopularNow`)

**Heading**: "Popular Right Now"  
**Layout**: Horizontal scrollable row  
**Data**: `usePublicOffers({ limit: 8, sortBy: 'trending' })`

Similar card layout to Featured Deals, sorted by popularity/trending score.

---

### 2.6 Category Rail (`CategoryRail`)

**Heading**: "Explore by Category"  
**Layout**: Horizontal scrollable row of category icons  
**Data**: `useCategories()`

Categories displayed:
1. Food & Hospitality
2. Retail & Shops
3. Beauty
4. Technology
5. Real Estate
6. Automotive
7. Professional Services
8. Events
9. Health
10. Education

Each category is an icon + label, linking to filtered deals view.

---

### 2.7 Around You (`AroundYouSection`)

**Heading**: "Around You"  
**Layout**: Horizontal scrollable deal cards  
**Data**: Location-based deals sorted by distance (Haversine formula)

Behavior:
- If location is available: shows nearby deals sorted by proximity
- If no location: shows `LocationPrompt` to request geolocation
- Falls back to non-location-sorted deals if permission denied

---

### 2.8 How It Works — Simple (`HowItWorksSimple`)

**Heading**: "How It Works"  
**Layout**: 3-step horizontal card flow

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | 🔍 | **Discover** | Find deals and businesses near you |
| 2 | 📋 | **Explore** | Browse offers, products, and services |
| 3 | 🤝 | **Connect** | Engage with businesses directly |

---

### 2.9 QR Network Section (`QrNetworkSection`)

**Heading**: "Look Out for VEMTAP Around You"  
**Layout**: Visual flow diagram

Flow:
```
VEMTAP QR → Scan → Discover → Explore
```

Shows how users interact with physical QR codes placed by businesses. Visual representation of the scan-to-discover experience.

---

### 2.10 Business CTA (`BusinessCTA`)

**Theme**: Dark background  
**Heading**: "Own a Business? Get Discovered on VEMTAP."

Stats displayed:
- 1.2K+ Monthly Views
- 89 New Leads
- 4.8★ Rating
- 95% Retention

CTA: Links to `/business-landing`

---

### 2.11 Consumer CTA (`ConsumerCTA`)

**Heading**: "There's Something Interesting Near You"  
**Layout**: Two side-by-side CTA buttons

- **"Explore Deals"** → `/deals`
- **"Find Businesses"** → `/deals`

---

## 3. Pricing `/pricing`

**File**: `app/pricing/page.tsx` — Client Component

### 3.1 Hero
- Badge: "Transparent Pricing"
- Heading: "Simple Pricing For Every Business"
- Subtitle: "Choose a plan that fits your business goals"

### 3.2 Billing Toggle
Three options with discount incentives:
| Period | Discount |
|--------|----------|
| Monthly | — |
| Quarterly | -10% |
| Yearly | -20% |

### 3.3 Pricing Cards
- **Layout**: 4-column grid on desktop
- **Data**: Fetched from `usePricingPlans()` API
- **Currency**: Nigerian Naira (₦)

Each card shows:
- Plan name
- Price per period
- Feature list with checkmarks
- CTA button ("Get Started" or "Contact Sales")
- "Most Popular" badge on recommended plan
- Enterprise plans filtered out of the grid

### 3.4 Plan Comparison Table (`PlanComparisonTable`)
- Full feature comparison across all plans
- Horizontal scrollable on mobile
- Checkmarks and feature values per plan tier

### 3.5 Enterprise CTA
- Dark themed section
- Heading: "Need A Custom Enterprise Solution?"
- CTA: "Contact Sales" → `/contact`

### 3.6 FAQ Accordion (5 questions)
1. What payment methods do you accept?
2. Can I upgrade or downgrade my plan?
3. Are there any setup fees?
4. What happens when my plan expires?
5. How do I cancel my subscription?

---

## 4. Pricing V2 `/pricing-2`

**File**: `app/pricing-2/page.tsx` — Client Component

### 4.1 Hero
- Badge: "New Pricing V2"
- Heading: "Scalable plans for every business size"

### 4.2 Pricing Component
Uses the shared `<Pricing>` component from `components/landing/Pricing.tsx`.

### 4.3 CTA Section
- Heading: "Ready to transform your visitor experience?"
- Two buttons:
  - "Get Started for Free" → `/get-started`
  - "Book a Demo" → `/contact`

---

## 5. How It Works `/how-it-works`

**File**: `app/how-it-works/page.tsx` — Client Component  
**This is the most content-dense public page.**

### 5.1 Hero
- Badge: "VEMTAP Business Guide"
- Heading: "Get Discovered. Get Customers. Keep Them Coming Back."
- Embedded YouTube video (ID: `JUdg-g3_VSE`)

### 5.2 15 Accordion Sections

Each section is expandable/collapsible:

#### 01 — What Is VEMTAP?
Overview of the platform's five pillars:
- **Discover** — Customers find you
- **Engage** — Interact with them
- **Convert** — Turn visits into sales
- **Retain** — Keep them coming back
- **Grow** — Scale your business

#### 02 — The Problem VEMTAP Solves
Pain points for local businesses:
- Customers visit but never return
- No way to reach them after they leave
- Expensive advertising with poor ROI
- No customer data or insights

#### 03 — How VEMTAP Helps Your Business
8-item grid of capabilities:
1. QR Code Check-ins
2. NFC Tap Registration
3. Lead Collection
4. Smart Messaging
5. Growth Analytics
6. Marketing Assets
7. Customer Retention
8. Business Discovery

#### 04 — The VEMTAP Customer Growth Cycle
8-step cyclical flow:
1. Customer discovers business
2. Scans QR / taps NFC
3. Registers contact info
4. Receives welcome message
5. Gets personalized offers
6. Returns for repeat visits
7. Refers others
8. Business grows

#### 05 — Get Discovered by Customers Around You
How the discovery network works:
- Business listings appear in search
- Location-based recommendations
- Category-based browsing
- Distance-sorted results

#### 06 — The VEMTAP Business Discovery Network
Network effects:
- Cross-promotion between businesses
- Shared discovery feed
- Referral traffic generation
- Community building

#### 07 — Discover Businesses Through QR Codes
Physical-to-digital bridge:
- QR codes on storefronts, products, tables
- Instant access to business profile
- No app required to scan
- Works with native camera apps

#### 08 — What Can Customers Discover?
Content types visible to customers:
- Business profile and hours
- Active deals and promotions
- Products and services
- Reviews and ratings
- Contact information

#### 09 — What Can Your Business Do With VEMTAP?
10 capabilities listed:
1. Create a business profile
2. List products and services
3. Publish deals and promotions
4. Collect customer leads
5. Send WhatsApp/SMS campaigns
6. Track visit analytics
7. Generate QR codes
8. Order NFC hardware
9. Manage multiple locations
10. Access growth reports

#### 10 — Businesses With Existing Customers
How to migrate existing customer base:
- Import customer lists
- Send invitation campaigns
- QR codes at point of sale
- Staff training guidance

#### 11 — More Than Advertising
7-step value flow:
1. Capture → 2. Store → 3. Analyze → 4. Segment → 5. Target → 6. Convert → 7. Retain

#### 12 — Why Join the VEMTAP Network?
Benefits:
- Zero setup fees
- No hardware required (QR is free)
- GDPR compliant
- Real-time analytics
- Multi-channel messaging
- Growing consumer network

#### 13 — What Makes VEMTAP Different?
Differentiators:
- Location-first approach
- Physical + digital integration
- No app download required for consumers
- Nigerian-market optimized
- Affordable pricing in Naira

#### 14 — Who Is VEMTAP For?
4 business stages:
1. **Startups** — Build your first customer base
2. **Growing Businesses** — Scale your reach
3. **Established Businesses** — Retain and upsell
4. **Multi-Location Chains** — Centralized management

#### 15 — Plans & Pricing
Quick overview of plan tiers:
| Plan | Price |
|------|-------|
| Free | ₦0 |
| Silver | ₦8,000/mo |
| Gold | ₦15,000/mo |
| Platinum | ₦27,000/mo |
| Enterprise | Custom |

### 5.3 Final CTA
- Heading: "Your next customer may already be nearby."
- Three buttons:
  - "Get Started" → `/get-started`
  - "View Plans & Pricing" → `/pricing`
  - "Talk to a Representative" → `/contact`

---

## 6. Features `/features`

**File**: `app/features/page.tsx` — Client Component

### 6.1 Hero
- Badge: "Platform Capabilities"
- Heading: "Everything You Need To Capture, Engage & Retain."

### 6.2 Features Grid — 6 Categories

#### Customer Capture
1. QR Check-ins
2. NFC Tap Registration
3. Lead Collection Forms
4. Customer Database
5. Instant Sync

#### Smart Messaging
1. WhatsApp Campaigns
2. SMS Promotions
3. Auto-Announcements
4. Smart Follow-ups
5. Behavior Triggers

#### QR & NFC Solutions
1. Dynamic QR Codes
2. Static Branding
3. Custom Design
4. Multi-format Exports
5. Print-Ready Files

#### Growth Analytics
1. Customer Insights
2. Visit Tracking
3. Growth Reports
4. Campaign ROI
5. Scan Heatmaps

#### Marketing Assets
1. Poster Templates
2. Table Tent Designs
3. Counter Displays
4. Business Cards
5. Social Graphics

#### Discovery Network
1. Business Listings
2. Local Discovery
3. Cross-Promotions
4. Traffic Generation
5. Referral Engine

### 6.3 Enterprise Section
Dark themed with 4 highlights:
- 99.9% Uptime
- GDPR Ready
- Global CDN
- API Access

### 6.4 Final CTA
- Heading: "Start Growing Your Business Today"
- Buttons: "Start Free" + "Contact Sales"

---

## 7. For Businesses `/for-businesses`

**File**: `app/for-businesses/page.tsx` — Client Component

### 7.1 Hero
- Badge: "Customer Engagement Platform"
- Heading: "Turn Every Customer Into A Customer You Can Reach Again."
- Video hero: Phone mockup playing `/assets/videos/hero.webm`
- Floating stat card: "+124 Customers"
- CTAs: "Get Started" + "Watch Demo" (opens video modal)

### 7.2 Problem Section
**Heading**: "Most Businesses Lose Customers Every Day"

5 pain points:
1. Customers Visit Once and Never Return
2. No Customer Database
3. No Follow Up System
4. Expensive Advertising That Doesn't Work
5. Lost Sales Opportunities

### 7.3 Solution Section
**Theme**: Blue background  
**Heading**: "Vemtap Solves This"

6 solution cards:
1. Customer Capture
2. Smart Messaging
3. Growth Analytics
4. Marketing Assets
5. Customer Retention
6. Business Discovery

### 7.4 How It Works Preview
6-step horizontal flow:
```
Generate QR → Place QR → Customer Scans → Customer Registers → Data Captured → Follow Up
```

### 7.5 Benefits Section
**Heading**: "Why Businesses Choose Vemtap"

4 bullet benefits:
- Zero setup fees
- No hardware needed
- GDPR compliant
- 24/7 support

6 benefit cards with icons and descriptions.

### 7.6 Discovery Network Section
**Heading**: "Get Discovered By More Customers"
- Link to marketplace

### 7.7 Testimonials
3 testimonial cards:
- John O. — Coffee House Owner
- [Additional testimonials with photos and quotes]

### 7.8 Final CTA
**Heading**: "Start Growing Your Customer Base Today"  
Buttons: "Get Started" + "Contact Sales"

### 7.9 Video Modal
Plays `/assets/videos/vemtap-exp.webm` — platform experience walkthrough.

---

## 8. Business Landing `/business-landing`

**File**: `app/business-landing/page.tsx` — Client Component

> **Note**: This is a **duplicate** of `/for-businesses` with identical structure, sections, and content. The code is the same.

---

## 9. Solutions `/solutions`

**File**: `app/solutions/page.tsx` — Server Component

### 9.1 Hero (`SolutionHero`)
- Heading: Solutions overview
- Brief platform description

### 9.2 Case Studies (`SolutionCaseStudies`)
- Real-world use cases
- Industry-specific examples

### Sub-pages
- `/solutions/hardware` — NFC hardware details
- `/solutions/software` — Dashboard software details
- `/solutions/white-label` — Layout only, no content

---

## 10. Solutions — Hardware `/solutions/hardware`

### 10.1 NFC Hardware Overview
- Premium NFC infrastructure
- NXP NTAG chip technology
- 99.9% reliability rating

### 10.2 Hardware Catalog
| Product | Description |
|---------|-------------|
| Merchant Plates | NFC-enabled business display plates |
| Identity Cards | NFC staff/customer ID cards |
| Smart Stickers | Adhesive NFC tags for any surface |

### 10.3 Specifications
- ISO 14443-A compliant
- Read range details
- Durability specs

### 10.4 Reliability Section
- Water resistance ratings
- Temperature tolerance
- Scan count lifecycle

---

## 11. Solutions — Software `/solutions/software`

### 11.1 Dashboard Features
- Auto-Retention tools
- CRM Intelligence
- Loyalty Logic engine
- Open API access

### 11.2 Analytics Preview
- Visual dashboard mockup
- Key metrics display

### 11.3 Pricing Component
- Embedded `<Pricing>` component from landing
- Plan comparison

---

## 12. Contact `/contact`

**File**: `app/contact/page.tsx` — Server Component

### 12.1 Header
- Heading: "We'd Love to Hear from You"

### 12.2 Contact Methods (5 cards)

| Method | Details |
|--------|---------|
| **Call Us** | +2349013666883, Mon–Sat 9AM–6PM |
| **WhatsApp** | Pre-filled message → wa.me link |
| **Live Chat** | 24/7 availability (opens chat widget) |
| **Email** | support@vemtap.com (avg 2hr response) |
| **Visit Office** | B29 Awesome Plaza, Opp Chicken Republic, Apo Resettlement, Abuja |

### 12.3 Contact Form
Fields:
- Full Name* (required)
- Email* (required)
- Phone (optional)
- Subject (dropdown)
- Message* (required)

Submission: Via mailto link.

---

## 13. FAQ `/faq`

**File**: `app/faq/page.tsx` — Client Component

### 13.1 Hero
- Badge: "Help Center"
- Heading: "Frequently Asked Questions" (gradient text)

### 13.2 Category Groups (9 questions total)

#### General (3 questions)
1. Do customers need to download an app?
2. What is NFC and how does it work?
3. What if a customer's phone doesn't support NFC?

#### Tags & Setup (3 questions)
4. How long does setup take?
5. Where should I place my QR code / NFC tag?
6. Are the NFC tags waterproof?

#### Software & Data (3 questions)
7. Can I integrate with my existing CRM?
8. How is my customer data protected?
   - AES-256 encryption
   - TLS 1.3 in transit
   - GDPR & CCPA compliant
9. Can I manage multiple locations?

### 13.3 Support CTA
- Heading: "Still have questions?"
- Button: "Contact Support" → `/contact`

---

## 14. Testimonials `/testimonials`

**File**: `app/testimonials/page.tsx` — Client Component

### 14.1 Header
- Heading: "Trusted by innovators worldwide"
- Subheading: "Real results from real teams"

### 14.2 Carousel (6 testimonials)

| Author | Company | Metric |
|--------|---------|--------|
| David Callahan | Enterprise | 8X Conversion Boost |
| Sarah Mitchel | Retail | 45% ROI Increase |
| Tom Becker | SaaS | 3.2k New Signups |
| Jennifer Wu | Tech | 100% Sync Rate |
| Alex Rivera | Fitness | 12ms Latency |
| Marcus Iron | — | 5.0 User Rating |

### 14.3 Category Grid
Same 6 testimonials in a 3-column grid with category tags:
- Enterprise
- Retail
- SaaS
- Tech
- Fitness

### 14.4 Final CTA
- Heading: "Ready to start your story?"
- Buttons: "Get Started Free" + "Browse Solutions"

---

## 15. Deals `/deals`

**File**: `app/deals/page.tsx` — Client Component (wrapped in Suspense)

### 15.1 Hero Carousel
3 slides with auto-advance:
1. Daily Deals
2. Flash Sale
3. New Arrivals

### 15.2 Category Quick Links
8 horizontal pills:
1. Nearby Deals
2. Flash Sales
3. New Arrivals
4. Free Deals
5. Top Rated
6. Food & Drinks
7. Fashion
8. Electronics

### 15.3 Search Bar
- Filter toggle button
- Search input field

### 15.4 Sidebar Filters (Desktop)
| Filter | Type |
|--------|------|
| Category | Dropdown |
| Price Range | From / To inputs |
| Free Only | Toggle switch |
| Distance | Slider (0–50km) |
| Sort By | Popular / Newest / Trending / Featured / Price |

### 15.5 Deals Grid
- `PromotionCard` components
- Real API data from `usePublicOffers`
- Responsive grid layout

### 15.6 Location Integration
- Browser geolocation
- Reverse geocoding for address resolution
- localStorage persistence for location

---

## 16. Promotions `/promotions`

**File**: `app/promotions/page.tsx` — Client Component

### 16.1 Location-First Landing
- Heading: "Explore Deals Near You"
- Location search input
- "Use My Current Location" button

### 16.2 Popular Categories
- Grid of category buttons
- Derived from mock data

### 16.3 Trending Today
- Top 3 trending promotions
- Flame icon indicator

### 16.4 Category Pills
- Horizontal scrollable filter row

### 16.5 Deals Grid
- `PromotionCard` components
- **Note**: Uses `MOCK_PROMOTIONS` static data (not live API)

---

## 17. Trust & Security `/trust`

**File**: `app/trust/page.tsx` — Server Component

### 17.1 Hero
- Badge: "Security Center"
- Heading: "Trust & Security" (blue gradient)

### 17.2 6 Trust Sections (2-column grid)

1. **Enterprise-Level Data Protection** — NDPA compliant
2. **Advanced Security Infrastructure** — HTTPS/TLS, AES-256, AWS/GCloud
3. **Controlled Access & Accountability** — RBAC, audit trails
4. **Full Data Control for Businesses** — Data ownership and export
5. **Secure QR Code Technology** — QRThrive security layer
6. **Proactive Threat Management** — Monitoring and response

### 17.3 Bottom CTA
- Heading: "Built for Trust"
- Badges: "NDPA Compliant" + "Enterprise Grade"

---

## 18. Terms of Service `/terms`

**File**: `app/terms/page.tsx` — Server Component

### Layout
- Sidebar table of contents (sticky, scrollable)
- Main article content

### 21 Sections
1. Introduction
2. Definitions
3. Eligibility
4. Services Overview
5. Account Registration
6. Acceptable Use
7. Data Protection
8. Intellectual Property
9. Service Availability
10. Fees and Payment
11. Third-Party Services
12. Limitation of Liability
13. Indemnification
14. Termination
15. Data Retention
16. Confidentiality
17. Security Measures
18. Force Majeure
19. Governing Law (Nigeria)
20. Changes to Terms
21. Contact Information

---

## 19. Privacy Policy `/privacy`

**File**: `app/privacy/page.tsx` — Server Component  
**Effective Date**: January 31, 2026

### 20 Sections

1. Introduction
2. Scope
3. Information Collection
   - Personal Information
   - Customer Interaction Data
   - Technical Data
   - Behavioral Data
4. Purpose of Collection
5. Legal Basis for Processing
6. Data Sharing
7. International Transfers
8. Data Retention
9. Security Measures (highlighted: TLS, AES-256, RBAC, MFA)
10. Breach Notification
11. Your Rights (6 rights in grid)
    - Right to Access
    - Right to Rectification
    - Right to Erasure
    - Right to Restrict Processing
    - Right to Data Portability
    - Right to Object
12. Data Minimization
13. Access Control
14. Children's Privacy
15. Cookies
16. Third-Party Links
17. Data Protection Officer (DPO)
18. Policy Updates
19. Contact Information
20. Compliance (NDPA)

---

## 20. Cookie Policy `/cookie-policy`

**File**: `app/cookie-policy/page.tsx` — Server Component

### 11 Sections

1. Introduction
2. What Are Cookies
3. Types of Cookies
   - Strictly Necessary
   - Performance / Analytics
   - Functional
   - Marketing / Advertising
4. How We Use Cookies
5. Third-Party Cookies
6. Consent Management
7. Managing Cookies
8. Cookie Retention
9. Policy Updates
10. Contact Information
11. Compliance (NDPA)

---

## 21. Data Processing Agreement `/dpa`

**File**: `app/dpa/page.tsx` — Server Component

### 22 Sections

1. Definitions
2. Scope
3. Nature and Duration of Processing
4. Types of Personal Data Processed
5. Categories of Data Subjects
6. Controller Obligations
7. Processor Obligations
8. Security Measures (highlighted)
9. Sub-Processors
10. International Transfers
11. Data Subject Rights
12. Breach Management (48-hour notification)
13. Retention and Deletion
14. Audit Rights
15. Confidentiality
16. Liability
17. Service Level Agreement (SLA)
18. Termination
19. Governing Law
20. Annex A — Processing Details
21. Annex B — Security Measures
22. Contact Information

---

## 22. Whitepaper `/whitepaper`

**File**: `app/whitepaper/page.tsx` — Client Component

### 22.1 Cover
- Badge: "Official Whitepaper 2026"
- Heading: "NFC Hardware & White-Label Infrastructure"
- Buttons: "Download PDF" + "View Specs"

### 22.2 Three Tech Sections

#### Premium NFC Infrastructure
- NXP NTAG chips
- 99.9% reliability
- ISO 14443-A compliant

#### White-Label Sovereignty
- Custom CNAME
- Branded control panel
- Full aesthetic customization

#### Global Compliance
- GDPR compliant
- AES-128 encryption
- ISO 14443-A standards

### 22.3 Hardware Pricing Table

| Product | Price | MOQ |
|---------|-------|-----|
| NFC Smart Cards | Custom Quote | Listed |
| Digital Window Stickers | Custom Quote | Listed |
| Industrial NFC Plates | Custom Quote | Listed |

### 22.4 White-Label Partnership
- Custom Domain Routing
- Full Aesthetics Control
- License Setup: Project Quote Basis

### 22.5 Contact
- Email: sales@vemtap.com
- Phone: +234 800-VEMTAP

---

## 23. Support `/support`

**File**: `app/support/page.tsx`

Support center page with:
- Help categories
- Contact options
- Knowledge base links
- Live chat widget integration

---

## 24. Status `/status`

**File**: `app/status/page.tsx`

System status page displaying:
- Current system operational status
- Service uptime indicators
- Recent incidents/maintenance notices

---

## 25. Login `/login` & Get Started `/get-started`

### Login
**File**: `app/login/page.tsx`
- Email/password login form
- Google OAuth option
- "Forgot Password?" link → `/forgot-password`
- "Don't have an account? Get Started" link

### Get Started (Sign Up)
**File**: `app/get-started/page.tsx`
- Registration form
- Business name, email, password fields
- Google OAuth option
- "Already have an account? Login" link
- Leads to `/auth/onboarding` after registration

---

## 26. Navbar & Footer

### Navbar (`components/layout/Navbar.tsx`)

**Desktop Navigation Links**:
| Label | Route |
|-------|-------|
| Home | `/` |
| Nearby Deals | `/deals` |
| How It Works | `/how-it-works` |
| Pricing | `/pricing` |
| For Businesses | `/business-landing` |

**Desktop CTAs**:
- "For Businesses" text link → `/for-businesses`
- If authenticated: "My Dashboard" → role-based dashboard
- If not authenticated: "Login" → `/login`, "Get Started" → `/get-started`

**Mobile Navigation** (same as desktop +):
- Trust → `/trust`
- Support → `/support`

**Behavior**: Fixed/sticky with scroll-based background blur effect.

### Footer (`components/layout/Footer.tsx`)

**4-Column Layout**:

| Column | Links |
|--------|-------|
| **Discover** | Deals, Businesses, Categories, Search, Locations → `/deals` |
| **For Businesses** | Why VEMTAP (`/business-landing`), Features (`/features`), Pricing (`/pricing`), Business Login (`/login`), Get Started (`/get-started`) |
| **Company** | About (`/business-landing`), Contact (`/contact`), Help (`/support`), Privacy (`/privacy`), Terms (`/terms`) |
| **Social** | Facebook, Instagram, LinkedIn, X (Twitter) → vemtap accounts |

**Bottom Bar Links**:
- Privacy Policy
- Terms of Service
- Cookie Policy
- DPA
- Trust & Security
- Status

---

## Summary of All Public Routes

| # | Route | Type | Description |
|---|-------|------|-------------|
| 1 | `/` | Client | Homepage with 11 sections |
| 2 | `/pricing` | Client | Dynamic pricing from API |
| 3 | `/pricing-2` | Client | Static pricing V2 |
| 4 | `/how-it-works` | Client | 15-section business guide |
| 5 | `/features` | Client | 6-category feature grid |
| 6 | `/for-businesses` | Client | Business landing page |
| 7 | `/business-landing` | Client | Duplicate of for-businesses |
| 8 | `/solutions` | Server | Solutions overview |
| 9 | `/solutions/hardware` | — | NFC hardware details |
| 10 | `/solutions/software` | — | Dashboard software details |
| 11 | `/contact` | Server | Contact form + methods |
| 12 | `/faq` | Client | 9 FAQ questions |
| 13 | `/testimonials` | Client | 6 testimonials |
| 14 | `/deals` | Client | Live deals with filters |
| 15 | `/promotions` | Client | Mock promotions |
| 16 | `/trust` | Server | Trust & security info |
| 17 | `/terms` | Server | 21-section ToS |
| 18 | `/privacy` | Server | 20-section privacy policy |
| 19 | `/cookie-policy` | Server | 11-section cookie policy |
| 20 | `/dpa` | Server | 22-section DPA |
| 21 | `/whitepaper` | Client | NFC whitepaper |
| 22 | `/support` | — | Support center |
| 23 | `/status` | — | System status |
| 24 | `/login` | — | Authentication |
| 25 | `/get-started` | — | Registration |

---

*Generated from codebase at `C:\Users\USER\Desktop\FRONNTEND\Vemtap`*
