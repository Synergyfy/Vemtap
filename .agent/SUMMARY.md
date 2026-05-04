# Vemtap Platform Ecosystem

Vemtap is a multi-tenant business management and customer engagement platform. It bridges the gap between businesses and their customers through loyalty, messaging, and streamlined operations.

## Core Pillars

### 1. Business & Branch Operations
The foundation of the platform allows for complex organizational structures:
- **Businesses**: Top-level entities (e.g., a retail chain).
- **Branches**: Physical or logical locations under a business.
- **Staff Management**: Role-based access for employees at different levels.

### 2. Customer Engagement & Loyalty
Tools designed to keep customers coming back:
- **Loyalty Programs**: Points-based systems, rewards, and tiering.
- **Campaigns & Messaging**: Targeted outreach via SMS, WhatsApp, and internal channels.
- **Surveys & Feedback**: Real-time customer insights.
- **Visitors**: Tracking foot traffic and customer interactions.

### 3. Product & Sales (Catalogue)
- **Digital Catalogue**: Managing products, categories, and inventory.
- **Ordering System**: Cart management and order fulfillment.

### 4. Growth & Partnership (Affiliates & QR Thrive)
- **Affiliate Network**: Incentivized growth where "Agents" earn commissions for referring new businesses.
- **QR Thrive**: A specialized module for QR-based lead generation and visitor tracking.

### 5. Platform Administration (Control Tower)
- **AMIS (SUDO Mode)**: Allows high-level Admins to impersonate businesses/branches for support.
- **Analytics**: Cross-platform data visualization and reporting.
- **KYC & Verification**: Managing partner and agent trust.

---

## Technical Highlights

### Impersonation System (AMIS)
The **Admin Viewer** allows authorized actors to act on behalf of a target `branchId`.
- **Audit Requirement**: Every action taken while impersonating MUST be logged with actor and target context.
- **Frontend**: Managed via the `AdminViewerBanner` component.

### Affiliate Referral Logic
- **Conversion**: Tracked via `AffiliateReferral` entity; converts on the first subscription payment.
- **Payouts**: Threshold-based (₦5,000) with manual admin review.
