# VEMTAP MARKETING ASSETS MODULE

# FULL PRODUCT REQUIREMENTS DOCUMENT \(PRD\)

## PART 1 — PRODUCT OVERVIEW

# 1\.0 PROJECT INFORMATION

### Product Name

Vemtap Marketing Assets Module

### Product Type

Business Dashboard Feature

### Platform

Vemtap Business Dashboard

### Version

Version 1\.0

### Primary Users

- Restaurant Owners
- Fashion Store Owners
- Salon Owners
- Barbershop Owners
- Hotel Owners
- Guest House Owners
- Cafe Owners
- Lounge Owners
- Retail Store Owners
- Supermarket Owners

# 2\.0 PROJECT OVERVIEW

The Marketing Assets Module is a self\-service marketing design system that allows businesses to instantly generate professional QR\-code marketing materials directly from their Vemtap dashboard\.

The goal is to allow businesses to promote customer engagement without needing:

- Graphic designers
- Vemtap staff assistance
- External design software
- Third\-party agencies

The system automatically generates professional marketing assets using information already available inside the business account\.

Examples:

- Business Logo
- Business Name
- Brand Colors
- Branch Details
- Dynamic QR Codes
- Business Contact Information

The generated designs can be downloaded immediately and sent for printing\.

# 3\.0 PROBLEM STATEMENT

Today, most businesses require marketing materials to encourage customers to:

- View menus
- Place orders
- Join loyalty programs
- Book appointments
- Leave feedback
- View product catalogs
- Participate in promotions

To achieve this, businesses usually:

### Step 1

Contact Vemtap Support

### Step 2

Explain what design they need

### Step 3

Provide content

### Step 4

Wait for a designer

### Step 5

Review the design

### Step 6

Request revisions

### Step 7

Receive final artwork

This process:

- Consumes time
- Increases support workload
- Creates delays
- Does not scale

As Vemtap grows to thousands of businesses, this manual process becomes impossible to maintain\.

# 4\.0 SOLUTION

Create a fully automated Marketing Assets Module that enables businesses to:

### Create

Marketing materials themselves

### Customize

Text and messaging

### Preview

Final design before downloading

### Download

Print\-ready files instantly

### Reuse

Previously generated designs

### Generate

Unlimited marketing campaigns

Without contacting Vemtap support\.

# 5\.0 BUSINESS OBJECTIVES

The Marketing Assets Module should help Vemtap achieve the following goals:

### Goal 1

Increase QR adoption among businesses\.

### Goal 2

Increase customer scans\.

### Goal 3

Reduce dependency on support staff\.

### Goal 4

Create consistent branding across businesses\.

### Goal 5

Improve onboarding experience\.

### Goal 6

Allow rapid deployment of marketing materials\.

### Goal 7

Support thousands of businesses simultaneously\.

# 6\.0 SUCCESS METRICS

The module is considered successful when:

### Business Metrics

- 80% of businesses generate at least one asset\.
- 60% of businesses download assets\.
- QR scan rates increase\.

### Operational Metrics

- Reduction in design support requests\.
- Reduction in manual design workload\.
- Faster onboarding\.

### User Metrics

Businesses can generate assets within 5 minutes\.

# 7\.0 BUSINESS TYPES SUPPORTED

The Marketing Assets Module supports only standard commercial businesses\.

### Restaurants

Examples:

- Restaurants
- Fast Food
- Local Restaurants
- Fine Dining

### Fashion Businesses

Examples:

- Fashion Stores
- Clothing Stores
- Shoe Stores
- Boutique Shops

### Beauty Businesses

Examples:

- Salons
- Barbershops
- Beauty Studios

### Hospitality Businesses

Examples:

- Hotels
- Guest Houses
- Lodges

### Food &amp; Beverage

Examples:

- Cafes
- Coffee Shops
- Lounges

### Retail

Examples:

- Retail Stores
- Convenience Stores
- Supermarkets

# 8\.0 BUSINESS TYPES EXCLUDED

The following categories must NOT have access to this module because they already have specialized operational systems\.

### Excluded Categories

- Hospitals
- Eye Clinics
- Dental Clinics
- Medical Laboratories
- Pharmacies
- Airports
- Government Institutions
- Ministries
- Agencies
- Educational Institutions

When an excluded category logs in:

The Marketing Assets menu should not appear\.

# 9\.0 CORE FEATURES

Version 1 includes:

### Feature 1

Template Library

### Feature 2

Design Generator

### Feature 3

Asset Customization

### Feature 4

Brand Auto\-Population

### Feature 5

QR Integration

### Feature 6

Mockup Preview

### Feature 7

Asset Library

### Feature 8

Download Center

### Feature 9

Multi\-Branch Support

### Feature 10

AI Content Assistant

# PART 2 — BUSINESS DASHBOARD

# 10\.0 BUSINESS DASHBOARD STRUCTURE

Inside Business Dashboard:

A new menu should be added\.

```
Marketing Assets
```

When clicked:

System opens Marketing Assets Module\.

# 11\.0 PAGE STRUCTURE

The Marketing Assets module contains:

```
Marketing Assets
│
├── Overview
├── Template Library
├── Create Asset
├── Asset Library
├── Downloads
├── Analytics
└── Brand Settings
```

# 12\.0 OVERVIEW PAGE

This is the landing page\.

Purpose:

Provide a quick summary of marketing activity\.

# 12\.1 BUSINESS INFORMATION CARD

Displayed at top\.

Shows:

### Business Logo

Automatically loaded\.

### Business Name

Example:

```
Royal Spice Restaurant
```

### Category

Example:

```
Restaurant
```

### Active Branches

Example:

```
3 Branches
```

### QR Status

Example:

```
Active
```

# 12\.2 QUICK ACTION BUTTONS

Show:

### Generate Asset

Primary Button

### View Asset Library

Secondary Button

### Brand Settings

Secondary Button

# 12\.3 STATISTICS CARDS

Display:

### Total Assets

Example:

```
45 Assets
```

### Total Downloads

Example:

```
210 Downloads
```

### Total QR Scans

Example:

```
4,350 Scans
```

### Most Used Template

Example:

```
Menu QR
```

# 13\.0 CATEGORY DETECTION ENGINE

When page loads:

System reads:

```
business.category
```

from database\.

Example:

```
Restaurant
```

The system automatically loads:

- Restaurant Templates
- Restaurant AI Prompts
- Restaurant Mockups

Business never selects category manually\.

Everything is personalized automatically\.

# 14\.0 TEMPLATE LIBRARY

Purpose:

Allow businesses to choose pre\-built marketing templates\.

# 14\.1 TEMPLATE CARD DESIGN

Each template card contains:

### Preview Image

### Template Name

### Description

### Recommended Usage

### Generate Button

Example:

```
Scan To View Menu

Allow customers scan and view your menu.

[ Generate ]
```

# 15\.0 RESTAURANT TEMPLATE LIBRARY

Templates available:

### Scan To View Menu

### Scan To Order

### Reserve A Table

### Join Waitlist

### Leave Feedback

### Join Loyalty Program

### Today's Specials

### Weekend Promotions

### New Menu Launch

### Delivery Orders

# 16\.0 FASHION STORE TEMPLATE LIBRARY

Templates available:

### View Catalog

### New Arrivals

### Shop Collection

### Seasonal Sales

### Promotions

### Customer Feedback

### Loyalty Program

### New Product Launch

# 17\.0 SALON &amp; BARBERSHOP TEMPLATE LIBRARY

Templates available:

### Book Appointment

### Service Menu

### Loyalty Program

### Promotions

### Leave Feedback

### VIP Membership

### New Service Launch

# 18\.0 HOTEL TEMPLATE LIBRARY

Templates available:

### Book Reservation

### Guest Feedback

### Request Service

### Loyalty Program

### Promotions

### Special Packages

### Weekend Deals

# 19\.0 CREATE ASSET WORKFLOW

When business clicks:

```
Generate
```

System opens Asset Creation Workspace\.

Asset creation consists of 7 steps\.

```
Step 1 → Template
Step 2 → Content
Step 3 → QR Destination
Step 4 → Style
Step 5 → Format
Step 6 → Preview
Step 7 → Generate
```

# 20\.0 DESIGN WORKSPACE

This is the primary working area\.

Layout:

```
------------------------------------------------
| Preview Area | Customization Panel |
------------------------------------------------
```

The preview updates in real\-time\.

# 21\.0 CONTENT CUSTOMIZATION

Fields available:

### Headline

Example:

```
Ready To Order?
```

### Subheadline

Example:

```
Scan to view today's specials.
```

### CTA

Example:

```
Fast • Easy • Contactless
```

### Footer Message

Example:

```
Open Daily 8am - 10pm
```

# 22\.0 QR DESTINATION ENGINE

Business chooses where QR should lead\.

Restaurant Examples:

- Menu
- Order Page
- Loyalty Program
- Feedback Form
- Reservation Page
- Waitlist

Fashion Examples:

- Product Catalog
- Promotions
- New Arrivals

Salon Examples:

- Booking Page
- Service List

When selected:

QR updates automatically\.

# 23\.0 BRAND AUTO\-FILL SYSTEM

The system automatically inserts:

### Logo

### Brand Colors

### Business Name

### Contact Information

### Website

### Email

### Phone Number

### Branch Address

No manual entry required\.

# 24\.0 DESIGN STYLE ENGINE

Available styles:

### Classic

### Modern

### Premium

### Luxury

### Minimal

### Bold

Each style changes:

- Typography
- Layout
- QR Position
- Visual Elements
- Call\-To\-Action Placement

# 25\.0 OUTPUT FORMAT SELECTION

Business chooses final design format\.

Available formats:

### Table Stand

### A5 Poster

### A4 Poster

### A3 Poster

### Square Acrylic

### Rectangle Acrylic

### Window Sticker

### Roll\-Up Banner

### Flyer

### Social Media Post

The system displays a visual preview of each format before selection\.

# 26\.0 DESIGN GENERATION ENGINE

When user clicks:

```
Generate Design
```

System performs:

### Step 1

Retrieve brand profile

### Step 2

Retrieve selected branch

### Step 3

Generate QR code

### Step 4

Apply selected template

### Step 5

Apply selected style

### Step 6

Render final design

### Step 7

Generate downloadable files

### Step 8

Store asset

# 27\.0 PREVIEW SCREEN

After generation:

Display:

### Large Preview

Actions:

- Zoom In
- Zoom Out
- Fullscreen
- Regenerate

# 28\.0 MOCKUP PREVIEW ENGINE

Below generated design:

Show:

### Wall Poster

### Table Stand

### Counter Display

### Window Sticker

### Outdoor Banner

### Reception Desk

The selected design is automatically placed inside realistic environments\.

This helps businesses visualize real\-world installation before printing\.

This completes **Part 1 \(Product Overview\)** and the first major section of **Part 2 \(Business Dashboard Foundation, Template System, Asset Creation Workflow, Design Engine, and Preview Engine\)\.**

The next section should continue with:

# PART 2B — BUSINESS DASHBOARD \(CONTINUED\)

# 29\.0 AI CONTENT ASSISTANT

## OVERVIEW

The AI Content Assistant helps businesses create more engaging marketing messages for their assets\.

Many business owners struggle with writing:

- Headlines
- Promotions
- Calls\-to\-action
- Marketing copy

The AI assistant helps improve these automatically\.

# 29\.1 ACCESSING AI ASSISTANT

Inside Design Workspace:

Display button:

```
✨ Generate Creative Version
```

When clicked:

AI Assistant Panel opens\.

# 29\.2 WHAT AI CAN GENERATE

The AI can improve:

### Headline

Example:

Before:

```
View Our Menu
```

After:

```
Hungry? Scan To Explore Our Delicious Menu
```

### Subheadline

Before:

```
Scan To Order
```

After:

```
Order Your Favorite Meal In Seconds
```

### Call\-To\-Action

Before:

```
Scan Here
```

After:

```
Scan Now And Enjoy A Faster Experience
```

### Promotional Message

Before:

```
Special Offer Available
```

After:

```
Today's Special Deals Are Waiting For You
```

# 29\.3 CATEGORY\-SPECIFIC AI

AI must generate content based on business category\.

### Restaurant

Focus on:

- Food
- Orders
- Dining
- Reservations

### Fashion Store

Focus on:

- Style
- Shopping
- Collections
- New Arrivals

### Salon

Focus on:

- Beauty
- Appointments
- Self\-care

### Hotel

Focus on:

- Guest Experience
- Reservations
- Comfort

# 29\.4 AI RESPONSE OPTIONS

After AI generates content:

Show:

```
Accept
Edit
Regenerate
Cancel
```

# 29\.5 AI USAGE LIMITS

To prevent abuse:

### Free Plan

10 AI Generations Monthly

### Silver Plan

100 AI Generations Monthly

### Gold Plan

500 AI Generations Monthly

### Platinum Plan

Unlimited

# 30\.0 SAVE ASSET SYSTEM

## OVERVIEW

Businesses should never lose their work\.

Every generated asset can be saved\.

# 30\.1 SAVE ASSET BUTTON

Display:

```
Save Asset
```

# 30\.2 SAVE MODAL

When clicked:

Show:

### Asset Name

Required

Example:

```
June Menu Poster
```

### Branch

Required

Example:

```
Wuse 2 Branch
```

### Notes

Optional

Example:

```
Used for June Campaign
```

# 30\.3 STORED INFORMATION

Store:

- Asset ID
- Asset Name
- Template Used
- Style Used
- Format Used
- Branch
- QR Destination
- Creator
- Created Date
- Last Modified Date

# 31\.0 ASSET LIBRARY

## OVERVIEW

The Asset Library stores all generated assets\.

Think of it as the business's marketing archive\.

# 31\.1 ASSET LIBRARY PAGE

Display:

```
Marketing Assets
→ Asset Library
```

# 31\.2 ASSET GRID VIEW

Each asset card displays:

### Thumbnail

### Asset Name

### Template

### Format

### Branch

### Creation Date

### Last Modified Date

# 31\.3 ASSET ACTIONS

Each asset contains:

```
View
Edit
Duplicate
Download
Archive
Delete
```

# 31\.4 DUPLICATE ASSET

Purpose:

Allow businesses to create variations quickly\.

Example:

Original:

```
Weekend Promotion
```

Duplicate:

```
Weekend Promotion Copy
```

User edits content without affecting original\.

# 31\.5 ARCHIVE ASSET

Archived assets:

- Remain stored
- Cannot be edited
- Can be restored

# 31\.6 DELETE ASSET

Before deletion:

Show confirmation:

```
Are you sure you want to delete this asset?

Yes Delete
Cancel
```

Deleted assets move to recycle bin\.

Retention:

30 days\.

# 32\.0 SEARCH &amp; FILTER SYSTEM

## SEARCH BAR

Search by:

- Asset Name
- Template Name
- Branch Name

Example:

```
Search Assets...
```

# 32\.1 FILTERS

### Date Range

Example:

```
Last 7 Days
Last 30 Days
Custom Range
```

### Branch

Example:

```
All Branches
Wuse 2
Maitama
Garki
```

### Template Type

Example:

```
Menu QR
Feedback QR
Loyalty QR
Promotion QR
```

### Format

Example:

```
A4
A3
Banner
Flyer
```

# 33\.0 DOWNLOAD CENTER

## OVERVIEW

All generated files are stored in Download Center\.

# 33\.1 DOWNLOAD PAGE

Display:

```
Marketing Assets
→ Downloads
```

# 33\.2 DOWNLOAD RECORDS

Show:

- File Name
- Asset Name
- Format
- Download Date
- Status

# 33\.3 DOWNLOAD FORMATS

Supported:

### PNG

Standard Image

### Transparent PNG

For professional printing

### PDF

Regular PDF

### Print Ready PDF

High Resolution

CMYK Compatible

Bleed Included

# 33\.4 DOWNLOAD HISTORY

Track:

- Who downloaded
- Date downloaded
- Number of downloads

# 34\.0 MULTI\-BRANCH SUPPORT

## OVERVIEW

Businesses with multiple branches must generate branch\-specific assets\.

# 34\.1 BRANCH SELECTOR

Display:

```
Select Branch
```

Options:

```
Wuse 2
Maitama
Garki
```

# 34\.2 WHAT CHANGES WHEN BRANCH CHANGES

Automatically update:

### QR Code

### Address

### Contact Number

### Branch Name

### Branch Manager

\(Optional\)

# 34\.3 BRANCH ASSET ISOLATION

Assets generated for:

```
Wuse 2
```

should remain linked to:

```
Wuse 2
```

and not appear as Maitama assets\.

# 35\.0 ANALYTICS DASHBOARD

## OVERVIEW

Businesses need visibility into asset performance\.

# 35\.1 ANALYTICS PAGE

Display:

```
Marketing Assets
→ Analytics
```

# 35\.2 OVERVIEW METRICS

Show:

### Total Assets Created

### Total Downloads

### Total QR Scans

### Total AI Generations

### Total Active Assets

# 35\.3 TOP PERFORMING ASSETS

Display:

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673967670058&cot=14)*

| Asset | Scans |
| --- | --- |
| Menu Poster | 1,200 |
| Loyalty Poster | 980 |
| Feedback QR | 620 |

# 35\.4 MOST USED TEMPLATE

Example:

```
Menu QR Template
```

# 35\.5 BRANCH PERFORMANCE

Display:

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673967670177&cot=14)*

| Branch | Scans |
| --- | --- |
| Wuse 2 | 2,300 |
| Maitama | 1,700 |
| Garki | 900 |

# 35\.6 QR SCAN TREND CHART

Show:

Daily

Weekly

Monthly

Scan performance\.

# 36\.0 BRAND SETTINGS

## OVERVIEW

This section controls branding\.

# 36\.1 BRAND PROFILE PAGE

Display:

### Logo

### Brand Name

### Tagline

### Website

### Phone

### Email

### Social Links

# 36\.2 BRAND COLORS

Allow businesses to define:

### Primary Color

### Secondary Color

### Accent Color

# 36\.3 FONT SETTINGS

Allow selection from approved fonts\.

Example:

```
Montserrat
Poppins
Roboto
Inter
```

# 36\.4 BRAND PREVIEW

Show live preview of branding\.

# 37\.0 USER PERMISSIONS

## BUSINESS OWNER

Can:

- Create Assets
- Edit Assets
- Delete Assets
- Manage Brand Settings
- View Analytics

## MANAGER

Can:

- Create Assets
- Edit Assets
- Download Assets

Cannot:

- Delete Assets
- Manage Billing

## STAFF

Can:

- View Assets
- Download Assets

Cannot:

- Edit Assets
- Delete Assets

# 38\.0 VALIDATION RULES

## BEFORE GENERATION

System must verify:

### Business Logo Exists

If missing:

```
Please upload your business logo.
```

### Brand Color Exists

If missing:

```
Please configure brand colors.
```

### QR Destination Selected

If missing:

```
Please select a QR destination.
```

### Branch Selected

If required\.

### Headline Exists

Cannot be empty\.

# 39\.0 EMPTY STATES

## NO ASSETS

Show:

```
You haven't created any marketing assets yet.

Create Your First Asset
```

## NO DOWNLOADS

Show:

```
No downloads available yet.
```

## NO ANALYTICS

Show:

```
Analytics will appear after customers begin scanning your QR codes.
```

# 40\.0 LOADING STATES

## TEMPLATE LOADING

Display skeleton cards\.

## PREVIEW LOADING

Display loading animation\.

## FILE GENERATION

Display:

```
Generating Design...
```

Progress indicator required\.

# 41\.0 ERROR HANDLING

## GENERATION FAILED

Show:

```
Unable to generate design.

Please try again.
```

## DOWNLOAD FAILED

Show:

```
Download failed.

Retry Download
```

## NETWORK ERROR

Show:

```
Connection lost.

Check internet connection.
```

## AI ERROR

Show:

```
Unable to generate content.

Please try again later.
```

# 42\.0 SUCCESS STATES

## ASSET CREATED

Show:

```
Marketing asset generated successfully.
```

## ASSET SAVED

Show:

```
Asset saved successfully.
```

## DOWNLOAD SUCCESSFUL

Show:

```
Download completed successfully.
```

# 43\.0 MOBILE EXPERIENCE

## OVERVIEW

The entire Marketing Assets module must be mobile responsive\.

Many business owners will use mobile devices\.

# 43\.1 MOBILE NAVIGATION

Replace sidebar with:

```
Hamburger Menu
```

# 43\.2 MOBILE TEMPLATE GRID

Desktop:

```
4 Columns
```

Tablet:

```
2 Columns
```

Mobile:

```
1 Column
```

# 43\.3 MOBILE DESIGN WORKSPACE

Desktop:

```
Preview + Controls
```

Side by Side

Mobile:

```
Preview
↓
Controls
```

Stacked Layout

# 43\.4 MOBILE DOWNLOADS

Users must be able to:

- Preview
- Download
- Share

directly from mobile devices\.

# 43\.5 MOBILE PERFORMANCE

Requirements:

- Page Load &lt; 3 seconds
- Preview Load &lt; 2 seconds
- Asset Generation &lt; 10 seconds

# 44\.0 BUSINESS DASHBOARD SUCCESS CRITERIA

A business owner should be able to:

1. Open Marketing Assets\.
2. Select a template\.
3. Customize content\.
4. Generate QR\-based marketing materials\.
5. Preview realistic mockups\.
6. Save designs\.
7. Download print\-ready files\.
8. Track performance\.
9. Manage assets across multiple branches\.

Without contacting Vemtap support, hiring a designer, or leaving the Vemtap platform\.

