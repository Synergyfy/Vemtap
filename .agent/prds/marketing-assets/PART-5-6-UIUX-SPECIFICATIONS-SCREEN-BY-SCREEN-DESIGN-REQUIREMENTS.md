# PART 5 — UI/UX SPECIFICATIONS &amp; SCREEN\-BY\-SCREEN DESIGN REQUIREMENTS

# 106\.0 UI/UX DESIGN PRINCIPLES

## PURPOSE

The Marketing Assets Module must be:

### Simple

Business owners should understand it immediately\.

### Fast

No complicated design process\.

### Professional

Generated assets must look professionally designed\.

### Guided

Users should never feel lost\.

### Mobile Friendly

Works perfectly on desktop, tablet, and mobile\.

### Self\-Service

Users should complete everything without contacting support\.

# 107\.0 DESIGN SYSTEM STANDARDS

## PAGE WIDTH

Desktop:

```
1440px
```

Tablet:

```
768px – 1024px
```

Mobile:

```
320px – 767px
```

# 108\.0 COMMON PAGE STRUCTURE

All Marketing Assets pages must follow:

```
--------------------------------------------------
Breadcrumb Navigation
--------------------------------------------------

Page Header
Title
Description

--------------------------------------------------

Quick Actions

--------------------------------------------------

Main Content

--------------------------------------------------
```

# 109\.0 SIDEBAR MENU DESIGN

Inside Business Dashboard:

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

# SIDEBAR BEHAVIOR

Current page must be highlighted\.

Hover State:

Background changes\.

Active State:

Primary brand color\.

# 110\.0 OVERVIEW PAGE DESIGN

## PURPOSE

Provide quick insight into marketing performance\.

# PAGE HEADER

```
Marketing Assets

Create and manage marketing materials for your business.
```

# HEADER ACTIONS

Display:

```
[ Generate Asset ]

[ Asset Library ]

[ Brand Settings ]
```

# 111\.0 BUSINESS INFORMATION CARD

Full width card\.

Display:

```
--------------------------------------------------
Logo

Royal Spice Restaurant

Restaurant

3 Branches

QR Active
--------------------------------------------------
```

# CARD ELEMENTS

### Logo

Circular

80px

### Business Name

Bold

Large

### Category Badge

Colored badge

### QR Status Badge

Green

If Active

Red

If Inactive

# 112\.0 STATISTICS SECTION

Display 4 cards\.

Desktop:

```
---------------------------------
| Card | Card | Card | Card |
---------------------------------
```

Mobile:

```
Card
Card
Card
Card
```

# CARD DESIGN

Show:

### Metric

Large Number

### Label

Small Text

### Trend Indicator

Up or Down Arrow

# 113\.0 RECENT ASSETS SECTION

Display latest assets\.

Layout:

```
Thumbnail

Asset Name

Template

Date

Actions
```

Actions:

```
View

Download

Duplicate
```

# 114\.0 TEMPLATE LIBRARY PAGE

## PURPOSE

Allow businesses browse templates\.

# PAGE HEADER

```
Template Library

Choose a marketing template.
```

# SEARCH BAR

Top right\.

Placeholder:

```
Search Templates...
```

# FILTERS

Display:

```
Category

Popular

Recently Added

Most Used
```

# 115\.0 TEMPLATE GRID

Desktop:

4 Columns

Tablet:

2 Columns

Mobile:

1 Column

# TEMPLATE CARD DESIGN

Display:

### Preview Image

### Template Name

### Description

### Category Tag

### Popular Badge

\(Optional\)

### Generate Button

```
Generate
```

# CARD HOVER EFFECT

On hover:

- Slight zoom
- Shadow increase

# 116\.0 CREATE ASSET PAGE

## PURPOSE

Main design workspace\.

# LAYOUT

Desktop:

```
---------------------------------------------------
Preview Panel | Customization Panel
---------------------------------------------------
```

Mobile:

```
Preview

Customization
```

# PAGE HEADER

```
Create Marketing Asset
```

# PROGRESS INDICATOR

Display:

```
1 Template

2 Content

3 QR

4 Style

5 Format

6 Preview

7 Generate
```

Current step highlighted\.

# 117\.0 PREVIEW PANEL

Left side\.

Contains:

### Asset Preview

### Zoom Controls

```
+
-
```

### Fullscreen Button

### Refresh Preview

# PREVIEW AREA

White background\.

Centered design\.

# 118\.0 CUSTOMIZATION PANEL

Right side\.

Scrollable\.

Sections:

```
Content

QR Destination

Style

Format

Branch

Actions
```

# 119\.0 CONTENT SECTION

Contains:

### Headline

Text Input

### Subheadline

Text Area

### CTA

Text Input

### Footer Message

Text Area

Character count displayed\.

# 120\.0 QR DESTINATION SECTION

Dropdown selector\.

Options dynamically loaded\.

Example:

```
Menu

Order Page

Feedback

Reservation
```

Selected option updates preview immediately\.

# 121\.0 STYLE SECTION

Display visual style cards\.

Example:

```
Classic

Modern

Luxury

Premium
```

Each style shows:

Mini preview\.

Selected style:

Highlighted border\.

# 122\.0 FORMAT SECTION

Display format cards\.

Example:

```
A4

A3

Flyer

Banner
```

Card contains:

### Format Name

### Dimensions

### Preview Thumbnail

# 123\.0 BRANCH SECTION

Only visible for multi\-branch businesses\.

Dropdown:

```
Select Branch
```

When changed:

Preview updates automatically\.

# 124\.0 ACTION SECTION

Display:

```
Save Draft

Generate Design

Cancel
```

Generate Design:

Primary Button

# 125\.0 PREVIEW SCREEN

After generation\.

Layout:

```
Large Preview

Mockups

Download Options
```

# GENERATED ASSET VIEWER

Display:

### Full Design

### Zoom

### Fullscreen

### Regenerate

### Save

# 126\.0 MOCKUP PREVIEW SECTION

Below preview\.

Title:

```
See It In Action
```

Display mockup tabs:

```
Wall Poster

Table Stand

Window Sticker

Counter Display

Banner
```

Selected tab shows realistic mockup\.

# 127\.0 DOWNLOAD PANEL

Right side\.

Display:

```
PNG

PDF

Print Ready PDF

Transparent PNG
```

Each format contains:

### File Size

### Resolution

### Download Button

# 128\.0 ASSET LIBRARY PAGE

## PURPOSE

Manage saved assets\.

# VIEW TOGGLE

Display:

```
Grid View

Table View
```

# GRID VIEW

Display asset cards\.

Card Contains:

### Thumbnail

### Asset Name

### Branch

### Date

### Actions

# TABLE VIEW

Display:

# 129\.0 ASSET DETAILS DRAWER

Opens from right\.

Displays:

### Preview

### Asset Information

### Downloads

### QR Scans

### Version History

Actions:

```
Edit

Duplicate

Download

Delete
```

# 130\.0 DOWNLOADS PAGE

## PURPOSE

Centralized file management\.

# DOWNLOAD TABLE

Display:

# FILTERS

```
Date

Format

Branch
```

# DOWNLOAD STATUS BADGES

### Ready

Green

### Processing

Orange

### Failed

Red

# 131\.0 ANALYTICS PAGE

## PURPOSE

Performance tracking\.

# ANALYTICS HEADER

Display:

```
Total Scans

Total Downloads

Assets Created
```

# CHART SECTION

Display:

### QR Scan Trends

### Download Trends

### Asset Creation Trends

# CHART TYPES

Use:

### Line Chart

### Bar Chart

### Pie Chart

# 132\.0 TOP ASSETS TABLE

Display:

# 133\.0 BRAND SETTINGS PAGE

## PURPOSE

Manage branding\.

# PAGE LAYOUT

Two columns\.

Left:

Brand Settings Form

Right:

Live Preview

# 134\.0 BRAND FORM

Contains:

### Logo Upload

Drag &amp; Drop

### Business Name

### Tagline

### Website

### Phone Number

### Email Address

# 135\.0 COLOR SETTINGS

Display:

### Primary Color

Color Picker

### Secondary Color

Color Picker

### Accent Color

Color Picker

Preview updates instantly\.

# 136\.0 FONT SETTINGS

Display approved fonts\.

Visual font previews required\.

# 137\.0 LIVE PREVIEW PANEL

Shows:

```
Logo

Business Name

Brand Colors

Sample QR Asset
```

Updates in real\-time\.

# 138\.0 GLOBAL MODALS

## CONFIRMATION MODAL

Used for:

Delete

Archive

Reset

Structure:

```
Title

Description

Cancel

Confirm
```

# SUCCESS MODAL

Display:

```
Success

Your asset was created successfully.
```

# ERROR MODAL

Display:

```
Something went wrong.

Please try again.
```

# 139\.0 EMPTY STATES

Every page must have dedicated empty states\.

# TEMPLATE LIBRARY EMPTY

```
No templates available.
```

# ASSET LIBRARY EMPTY

```
You have not created any assets yet.

Create Your First Asset
```

# DOWNLOADS EMPTY

```
No downloads available.
```

# ANALYTICS EMPTY

```
Analytics will appear once customers begin scanning your QR codes.
```

# 140\.0 LOADING STATES

Every page must support loading placeholders\.

Use skeleton loaders\.

Do not show blank pages\.

# 141\.0 MOBILE EXPERIENCE

## MOBILE OVERVIEW

Marketing Assets must be fully usable from a phone\.

# MOBILE NAVIGATION

Sidebar becomes:

```
☰ Menu
```

# MOBILE WORKSPACE

Preview stacked above controls\.

# MOBILE BUTTONS

Full width\.

Minimum height:

```
48px
```

# MOBILE TABLES

Convert tables into cards\.

# MOBILE DOWNLOADS

Support:

### Download

### Share

### Open File

# 142\.0 ACCESSIBILITY REQUIREMENTS

Support:

### Keyboard Navigation

### Screen Readers

### Proper Contrast Ratios

### Focus States

### Alternative Text

# 143\.0 UI/UX SUCCESS CRITERIA

The UI/UX is considered successful when a first\-time business owner can:

1. Find a template\.
2. Generate an asset\.
3. Customize content\.
4. Preview mockups\.
5. Save assets\.
6. Download print\-ready files\.

Without training, documentation, or support assistance\.

This completes **Part 5 — UI/UX Specifications &amp; Screen\-by\-Screen Design Requirements**\.

# PART 6 — ASSET GENERATION ENGINE, TEMPLATE LOGIC, SMART AUTOMATION &amp; AI WORKFLOW

# 144\.0 OVERVIEW

## PURPOSE

This section defines the intelligence layer of the Marketing Assets Module\.

The goal is to eliminate manual design work by automatically generating professional marketing materials using data already available inside Vemtap\.

The system should automatically:

- Select business data
- Populate designs
- Generate QR codes
- Apply branding
- Apply templates
- Render assets
- Generate mockups
- Improve marketing copy with AI

without requiring design skills from business owners\.

# 145\.0 ASSET GENERATION ECOSYSTEM

The entire generation process consists of:

# 146\.0 ASSET GENERATION PIPELINE

## FULL WORKFLOW

# 147\.0 BUSINESS DATA INJECTION ENGINE

## PURPOSE

Automatically populate templates using business information\.

The user should never need to repeatedly type business information\.

# DATA SOURCES

Pull from:

### Business Profile

### Branch Profile

### Brand Profile

### QR Configuration

### Marketing Settings

# AUTO\-POPULATED FIELDS

# EXAMPLE

Template:

Generated Output:

# 148\.0 DYNAMIC PLACEHOLDER SYSTEM

## PURPOSE

Allow templates to automatically insert business\-specific information\.

# AVAILABLE PLACEHOLDERS

### Business Information

### Branding

### Branch Information

### QR Information

# TEMPLATE EXAMPLE

Admin Template:

Generated:

# 149\.0 TEMPLATE LOGIC ENGINE

## PURPOSE

Control how every template behaves\.

# TEMPLATE STRUCTURE

Each template contains:

### Layout

### Elements

### Rules

### Styles

### Placeholders

### Format Support

# TEMPLATE OBJECT

# 150\.0 TEMPLATE RULES ENGINE

Templates must contain rules\.

Example:

# EXAMPLE VALIDATION

If Logo Missing:

# 151\.0 CATEGORY TEMPLATE AUTOMATION

## PURPOSE

Automatically show category\-relevant templates\.

# RESTAURANT

Show:

# FASHION STORE

Show:

# SALON

Show:

# HOTEL

Show:

Businesses should never see irrelevant templates\.

# 152\.0 QR DESTINATION MAPPING ENGINE

## PURPOSE

Automatically connect QR codes to the correct destination\.

# QR DESTINATIONS

Supported:

# MAPPING LOGIC

Example:

Automatically maps to:

Example:

Automatically maps to:

# 153\.0 DYNAMIC QR ENGINE

## PURPOSE

QR codes should remain editable after printing\.

# EXAMPLE

Business prints:

Later changes ordering page\.

QR remains the same\.

Destination changes behind the scenes\.

Benefits:

- No reprinting
- Better flexibility
- Long\-term usage

# 154\.0 QR TRACKING ENGINE

Every scan must be tracked\.

# CAPTURE

### Scan Date

### Scan Time

### Device Type

### Location

### Branch

### QR Type

# EXAMPLE

# 155\.0 BRAND AUTOMATION ENGINE

## PURPOSE

Apply branding automatically\.

# LOAD

### Logo

### Colors

### Fonts

### Tagline

# AUTOMATIC APPLICATION

Every generated asset automatically follows:

# EXAMPLE

Royal Spice:

All generated assets follow those colors\.

# 156\.0 STYLE AUTOMATION ENGINE

## PURPOSE

Apply visual personality automatically\.

# CLASSIC

Professional

Simple

# MODERN

Contemporary

Minimal

# PREMIUM

Elegant

Sophisticated

# LUXURY

High\-end

Premium Visuals

# BOLD

High Attention

Strong CTA

# STYLE BEHAVIOR

Styles change:

- Fonts
- Layouts
- Spacing
- CTA Designs
- QR Placement

without changing content\.

# 157\.0 FORMAT ENGINE

## PURPOSE

Adapt the same design to multiple output formats\.

# EXAMPLE

Same Design:

Can become:

# FORMAT AUTOMATION

System automatically:

- Resizes elements
- Repositions content
- Maintains readability

# 158\.0 SMART CONTENT ENGINE

## PURPOSE

Prevent poor marketing copy\.

# SYSTEM CHECKS

Evaluate:

### Headline Length

### CTA Length

### Text Visibility

### Readability

# EXAMPLE

Bad:

Recommended:

# 159\.0 AI CONTENT ENGINE

## PURPOSE

Generate stronger marketing copy\.

# INPUT

User provides:

# OUTPUT

AI Generates:

# AI CAN GENERATE

### Headlines

### Subheadlines

### CTAs

### Promotions

### Campaign Messages

# 160\.0 CATEGORY\-SPECIFIC AI PROMPTS

## RESTAURANTS

Focus:

## FASHION

Focus:

## SALON

Focus:

## HOTELS

Focus:

# 161\.0 AI QUALITY CONTROLS

AI must reject:

### Offensive Content

### Hate Speech

### Adult Content

### Medical Claims

### False Promotions

### Misleading Advertising

# 162\.0 AI TONE OPTIONS

Businesses can choose:

### Friendly

### Professional

### Luxury

### Exciting

### Premium

### Playful

# EXAMPLE

Professional:

Playful:

# 163\.0 ASSET QUALITY ENGINE

## PURPOSE

Validate designs before generation\.

# CHECKS

### QR Visibility

### Text Visibility

### Logo Visibility

### Contrast Ratio

### Spacing

### Alignment

# EXAMPLE

If QR too small:

before generation\.

# 164\.0 SMART DESIGN RECOMMENDATIONS

System can suggest:

### Better Headlines

### Better CTA

### Better Format

### Better Style

# EXAMPLE

User selects:

for:

System suggests:

# 165\.0 MOCKUP AUTOMATION ENGINE

## PURPOSE

Automatically generate realistic previews\.

# PROCESS

# EXAMPLES

### Restaurant Wall

### Table Stand

### Front Door Sticker

### Reception Counter

### Outdoor Banner

# 166\.0 DOWNLOAD PREPARATION ENGINE

Before download:

System generates:

### PNG

### PDF

### Print PDF

### Transparent PNG

# QUALITY SETTINGS

Print Files:

Minimum\.

Color Profile:

for printing\.

# 167\.0 ASSET VERSIONING ENGINE

## PURPOSE

Track changes\.

# EXAMPLE

Businesses can restore older versions\.

# 168\.0 AUTOMATED STORAGE ENGINE

After generation:

Store:

### Preview File

### Original Asset

### Print Version

### Mockups

### Metadata

# 169\.0 AUTOMATED ANALYTICS ENGINE

Every asset tracks:

### Views

### Downloads

### QR Scans

### Scan Locations

### Device Types

# EXAMPLE DASHBOARD

# 170\.0 FUTURE AI AUTOMATION \(PHASE 2\)

Not included in Version 1\.

# FUTURE FEATURES

### AI Layout Generation

AI builds entire design automatically\.

### AI Campaign Creation

Generate complete marketing campaigns\.

### AI Seasonal Promotions

Automatically create:

- Christmas Campaigns
- Ramadan Campaigns
- Easter Campaigns
- Independence Day Campaigns
- Black Friday Campaigns

### AI Multi\-Format Generation

Generate:

with one click\.

# 171\.0 ASSET GENERATION SUCCESS CRITERIA

The Asset Generation Engine is successful when:

1. Business selects a template\.
2. System automatically loads business branding\.
3. QR code is generated automatically\.
4. Content is optimized automatically\.
5. Design is rendered professionally\.
6. Mockups are generated automatically\.
7. Print\-ready files are created automatically\.
8. Asset is stored automatically\.
9. Analytics begin tracking automatically\.
10. Entire process completes within seconds\.

Without requiring design skills, technical knowledge, or support assistance\.

