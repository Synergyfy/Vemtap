# MARKETING ASSETS MODULE REDESIGN \(SIMPLIFY UX WITHOUT CHANGING FUNCTIONALITY\)

## IMPORTANT

Do NOT remove any existing backend functionality, business logic, tracking, QR functionality, template functionality, analytics functionality, download functionality, or existing data structures\.

This task is primarily a UX/UI restructuring and simplification exercise\.

The goal is to make the Marketing Assets module extremely simple, clean, mobile\-first, easy to understand, and easy for non\-technical business owners to use\.

Think:

- Less screens
- Less clicks
- Less navigation
- Less technical language
- No duplicate pages
- No repetitive tabs
- No confusing setup flows

The business owner should feel like they are creating a poster, flyer, banner, or social media graphic, not configuring a marketing system\.

# DESIGN PRINCIPLES

Follow these principles throughout the redesign:

### 1\. Mobile First

Design for mobile first\.

Then progressively enhance for tablet and desktop\.

### 2\. Remove Complexity

Hide system complexity from business users\.

Do not expose internal concepts such as:

- CTA Library
- QR Destination Management
- Template Engines
- Asset Categories Management
- Placement Engines
- Internal Tracking Systems

These should work behind the scenes\.

### 3\. No Duplicate Pages

Do not create multiple pages serving the same purpose\.

Example:

❌ Dashboard \+ Asset Library

Instead:

✅ Dashboard becomes the Asset Library

### 4\. Keep Existing Functionality

Keep all current functionality available:

- Template system
- QR insertion
- QR resizing
- QR positioning
- Logo insertion
- Logo resizing
- Text editing
- Asset downloads
- Asset duplication
- Asset deletion
- Asset editing
- QR tracking
- Scan analytics

Only simplify how users access them\.

# BUSINESS SIDE STRUCTURE

Reduce the entire Marketing Assets module to only:

### Dashboard

and

### Create/Edit Asset Flow

Nothing else\.

# PAGE 1: MARKETING ASSETS DASHBOARD

This becomes both:

- Dashboard
- Asset Library

No separate Asset Library page should exist\.

## Header

Marketing Assets

Short description:

"Create posters, flyers, banners, business cards, and social graphics using your QR code\."

## Statistics Cards

Only show:

- Assets Created
- Downloads
- Total Scans

DO NOT show:

- Orders Generated
- Customers Captured
- Revenue
- Reviews
- Loyalty Metrics

Reason:

Marketing Assets may link to WhatsApp, websites, social media, forms, menus, catalogs, external links, and many other destinations\.

Scans are the only universal metric\.

## Primary Action

Large button:

- Create New Asset

This should be the main call\-to\-action\.

## Existing Assets List

Display all created assets here\.

This replaces Asset Library\.

Each asset card should show:

- Thumbnail
- Asset Name
- Asset Type
- Date Created
- Scan Count

Actions:

- View
- Edit
- Download
- Duplicate
- Delete

No additional pages needed\.

# CREATE NEW ASSET FLOW

When user clicks:

- Create New Asset

Open a simple 3\-step flow\.

# STEP 1: CHOOSE TEMPLATE

This should be the first screen\.

Do NOT ask:

- Goals
- Campaign Objectives
- Placement Questions
- Marketing Questions

Go directly to template selection\.

## Template Gallery

Load templates directly from Admin Templates\.

Examples:

- Portrait Poster
- Landscape Poster
- Flyer
- Table Tent
- Counter Display
- Roll\-Up Banner
- Business Card
- Social Media Square
- Instagram Story

Show:

- Preview
- Name
- Orientation/Size

User selects one\.

Continue\.

# STEP 2: CUSTOMIZE

Open visual editor\.

This is where all editing happens\.

Do not split editing into multiple pages\.

Keep everything in one editor experience\.

## Editable Elements

### Headline

Business can edit\.

### Description

Business can edit\.

### Button/Call\-To\-Action Text

Business can edit\.

### QR Code

Business can:

- Change QR Source
- Resize QR
- Reposition QR

Available QR sources:

- My Vemtap Profile
- Customer Registration
- Product Catalog
- Menu
- WhatsApp
- Website
- Custom Link

Keep existing QR functionality intact\.

### Logo

Business can:

- Resize
- Reposition

Keep existing functionality\.

### Text Elements

Business can:

- Edit
- Reposition

### Background

Business can:

- Change color
- Upload image
- Change background image

## Editor Behaviour

Prefer direct editing\.

Click element → Edit element\.

Avoid opening multiple settings pages\.

Think Canva\-style editing experience\.

# STEP 3: PREVIEW &amp; DOWNLOAD

Single final screen\.

Show full preview\.

Actions:

- Back
- Save
- Download

Download options:

- PNG
- JPG
- PDF

Keep existing functionality\.

# ADMIN SIDE STRUCTURE

Simplify Admin side\.

Reduce navigation\.

# ADMIN PAGE 1: TEMPLATES

This becomes the main admin page\.

Purpose:

Create and manage templates\.

## Template List

Show:

- Template Preview
- Template Name
- Asset Type
- Status
- Usage Count

Actions:

- Create
- Edit
- Duplicate
- Disable
- Delete

# CREATE TEMPLATE FLOW

Admin uploads template design\.

Admin places placeholders\.

Supported placeholders:

- Business Name
- Logo
- QR Code
- Headline
- Description
- Phone
- Email
- Website

Save template\.

Template becomes available immediately on Business side\.

# ADMIN PAGE 2: ANALYTICS

Show:

- Total Templates
- Total Assets Created
- Total Downloads
- Total Scans

Charts:

- Most Used Templates
- Assets Created Over Time
- Downloads Over Time
- Scans Over Time

# ADMIN PAGE 3: SETTINGS

Global controls only\.

Examples:

- Enable Marketing Assets
- Enable Downloads
- Enable QR Tracking

Keep simple\.

# REMOVE OR MERGE REDUNDANT PAGES

Merge or eliminate any standalone pages that duplicate functionality such as:

- Asset Library
- Template Categories
- Placement Guides
- Recommendations
- CTA Libraries
- Separate Download Centers

If functionality is needed, keep it behind the scenes or merge it into existing screens\.

# FINAL TARGET EXPERIENCE

Business owner should be able to:

1. Open Marketing Assets\.
2. Click Create New Asset\.
3. Choose a template\.
4. Customize content and QR\.
5. Preview\.
6. Download\.

Completed in under 2 minutes\.

The interface should feel simple enough for a small shop owner, restaurant owner, fashion store owner, church administrator, salon owner, supermarket manager, or any non\-technical business user to understand immediately without training\.

# Do not remove any functionality\. Only reorganize, simplify, and improve the user experience while preserving all existing capabilities and integrations\.

