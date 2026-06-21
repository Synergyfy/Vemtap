# VEMTAP COMMERCE RESTRUCTURE PROMPT

We are NOT redesigning or removing functionality\.

We are NOT deleting any existing modules, screens, workflows, permissions, reports, inventory features, POS features, customer features, receipts, barcode features, stock management features, staff features, register features, analytics, or settings\.

Everything already built and planned must remain intact\.

The goal is to reorganize the navigation, information architecture, and user experience so that the system feels simple, clean, and easy to understand for business owners, managers, cashiers, and inventory staff\.

The current structure exposes too many technical menus and internal system concepts, creating confusion for businesses\.

We want to simplify the user experience while keeping all existing functionality\.

# CORE PRINCIPLE

Businesses do not think in software modules\.

Businesses think in workflows:

1. Add products and stock\.
2. Sell products\.
3. Track customers\.
4. View business performance\.

The UI should reflect this mental model\.

# NEW COMMERCE STRUCTURE

Replace the current Commerce navigation structure:

Commerce<br>├── Catalogue<br>├── Inventory<br>└── POS

with:

Commerce<br>├── Products &amp; Stock<br>├── Sales<br>└── Customers

All existing functionality must remain available under these three primary sections\.

# SECTION 1: PRODUCTS &amp; STOCK

Purpose:

Manage products, inventory, stock receiving, barcode management, stock movements, stock counting, and inventory control\.

When users open Products &amp; Stock, they should land on a simple overview screen showing:

- Total Products
- Total Stock Units
- Inventory Value
- Low Stock Products
- Out Of Stock Products

Quick Actions:

- Add Product
- Receive Stock

Below the summary cards show:

- Recent Products
- Low Stock Products
- Out Of Stock Products

The following existing modules and screens must remain available inside Products &amp; Stock:

PRODUCTS

- Products Dashboard
- Products List
- Product Details
- Add Product
- Edit Product
- Archive Product
- Product Categories
- Product Variants
- Product Images
- Product Pricing
- Product Inventory Information

BARCODES

- Barcode Center
- Barcode Generator
- Barcode Labels
- Barcode Printing
- Barcode History

INVENTORY

- Inventory Dashboard
- Inventory List
- Inventory Details
- Inventory Movement History
- Low Stock
- Out Of Stock

STOCK RECEIVING

- Receive Stock
- Supplier Selection
- Product Selection
- Quantity Entry
- Receiving Review
- Receiving History

STOCK ADJUSTMENTS

- Adjustments
- Damaged Stock
- Lost Stock
- Expired Stock
- Internal Use
- Adjustment History

STOCK TRANSFERS

- Transfers
- Transfer Review
- Transfer History

STOCK COUNTING

- Stock Count
- Variance Review
- Reconciliation
- Count History

Do not expose all these as primary navigation items\.

They should be organized through tabs, contextual actions, sub\-pages, and secondary navigation\.

# SECTION 2: SALES

Purpose:

Handle all sales activities and POS operations\.

When users open Sales, they should land on a simple Sales Dashboard showing:

- Today's Sales
- Today's Revenue
- Number Of Transactions
- Active Orders

Large Primary Action:

New Sale

Secondary Actions:

- View Orders
- View Sales History

Recent Activity:

- Recent Sales
- Recent Orders

The following existing modules and screens must remain available inside Sales:

POS

- POS Home
- Product Search
- Product Categories
- Barcode Scan
- Product Quick Select
- Cart
- Cart Details
- Discounts
- Add Customer
- Checkout
- Payment Methods
- Payment Confirmation
- Sale Complete
- Receipt Preview
- Print Receipt
- Share Receipt
- Held Sales
- Resume Held Sales
- Cancelled Sales

ORDERS

- Orders Dashboard
- Orders List
- Order Details
- Processing Orders
- Ready Orders
- Completed Orders
- Cancelled Orders

SALES

- Sales Dashboard
- Sales Transactions
- Transaction Details
- Sales Timeline

RETURNS

- Returns Dashboard
- Return Processing
- Return History

REFUNDS

- Refund Dashboard
- Refund Processing
- Refund History

PAYMENTS

- Payments Dashboard
- Payment Records
- Payment Details

RECEIPTS

- Receipt Center
- Receipt Details
- Reprint Receipt
- Receipt Sharing

REGISTERS

- Register Dashboard
- Open Register
- Close Register
- Cash Reconciliation
- Register History

Do not expose these as separate top\-level navigation items\.

They should live naturally inside Sales workflows\.

# SECTION 3: CUSTOMERS

Purpose:

Manage customer relationships and customer intelligence\.

This is Vemtap's strongest competitive advantage\.

Every sale should be connected to a customer profile whenever possible\.

When users open Customers, they should see:

- Total Customers
- New Customers
- Returning Customers
- Top Customers

Search Bar

Recent Customers

Quick Action:

Add Customer

The following existing modules and screens must remain available inside Customers:

CUSTOMERS

- Customer Dashboard
- Customer List
- Customer Profile
- Purchase History
- Transaction History
- Return History
- Add Customer
- Edit Customer

LOYALTY

- Loyalty Dashboard
- Points
- Rewards
- Redemption History

REFERRALS

- Referral Dashboard
- Referral History
- Referral Rewards

CUSTOMER INSIGHTS

- Customer Lifetime Value
- Repeat Purchase Rate
- Retention Rate
- Top Customers

All customer\-related functionality should remain accessible\.

# ROLE\-BASED EXPERIENCE

Navigation should adapt based on staff role\.

CASHIER

Primary Navigation:

- Dashboard
- Sales
- Customers
- Notifications
- More

Focus:

Sales operations\.

INVENTORY OFFICER

Primary Navigation:

- Dashboard
- Products &amp; Stock
- Notifications
- More

Focus:

Inventory operations\.

STORE MANAGER

Primary Navigation:

- Dashboard
- Products &amp; Stock
- Sales
- Customers
- More

BUSINESS OWNER

Primary Navigation:

- Dashboard
- Products &amp; Stock
- Sales
- Customers
- More

Plus access to all other Vemtap modules\.

# MOBILE DESIGN REQUIREMENTS

Mobile\-first design\.

Bottom Navigation:

Dashboard

Products &amp; Stock

Sales

Customers

More

Large touch targets\.

Minimal clicks\.

Simple language\.

Avoid technical inventory terminology where possible\.

Prioritize actions over menus\.

Frequently used actions should always be visible\.

# TABLET DESIGN REQUIREMENTS

Use collapsible side navigation\.

Show more summary cards\.

Support split views where appropriate\.

# DESKTOP DESIGN REQUIREMENTS

Use left sidebar navigation\.

Support multi\-column layouts\.

Support advanced tables and reports\.

Show richer dashboards\.

# IMPORTANT RULE

Do not remove, merge away, or delete any existing business functionality\.

Do not remove screens\.

Do not remove workflows\.

Do not remove reports\.

Do not remove inventory features\.

Do not remove barcode functionality\.

Do not remove POS functionality\.

Do not remove customer functionality\.

Do not remove receipts\.

Do not remove orders\.

Do not remove staff permissions\.

Do not remove analytics\.

Keep all existing capabilities intact\.

The task is to reorganize and simplify the navigation and user experience so that business owners immediately understand:

1. Products &amp; Stock = Manage what I sell\.
2. Sales = Sell products and process transactions\.
3. Customers = Track who buys from me\.

# The system should feel significantly simpler while retaining 100% of the existing functionality underneath\.

