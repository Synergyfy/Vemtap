# PART 3 — ADMIN DASHBOARD

# 45\.0 ADMIN DASHBOARD OVERVIEW

## PURPOSE

The Admin Dashboard serves as the control center for the entire Marketing Assets Module\.

While businesses create and download marketing materials, administrators manage everything behind the scenes\.

The Admin Dashboard controls:

- Templates
- Categories
- Mockups
- AI Instructions
- Brand Rules
- Asset Monitoring
- Analytics
- Permissions
- System Settings

The Admin Dashboard is responsible for ensuring businesses always have access to high\-quality marketing assets\.

# 46\.0 ADMIN MENU STRUCTURE

Inside Vemtap Admin Dashboard:

```
Marketing Assets
│
├── Dashboard Overview
├── Categories
├── Templates
├── Template Builder
├── Mockups
├── AI Content Manager
├── Brand Rules
├── Generated Assets
├── Downloads
├── Analytics
├── Audit Logs
├── Permissions
└── System Settings
```

# 47\.0 ADMIN DASHBOARD OVERVIEW

## PURPOSE

Provide administrators with a quick summary of the entire Marketing Assets ecosystem\.

# 47\.1 OVERVIEW CARDS

Display:

### Total Businesses Using Marketing Assets

Example:

```
2,350 Businesses
```

### Total Templates

Example:

```
120 Templates
```

### Total Assets Generated

Example:

```
48,300 Assets
```

### Total Downloads

Example:

```
102,400 Downloads
```

### Total QR Scans

Example:

```
1,240,000 Scans
```

### Active Categories

Example:

```
10 Categories
```

# 47\.2 QUICK ACTIONS

Display:

```
Create Template
Create Category
Upload Mockup
Manage AI Prompts
```

# 48\.0 CATEGORY MANAGEMENT

## PURPOSE

Categories determine which templates businesses can access\.

# 48\.1 CATEGORY LIST PAGE

Display:

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987205270&cot=14)*

| Category | Businesses | Templates | Status |
| --- | --- | --- | --- |
| Restaurant | 550 | 18 | Active |
| Fashion Store | 300 | 12 | Active |
| Salon | 210 | 10 | Active |

# 48\.2 CREATE CATEGORY

Admin clicks:

```
Create Category
```

## CATEGORY FORM

### Category Name

Example:

```
Restaurant
```

### Description

Example:

```
Businesses that sell food and beverages.
```

### Category Icon

Upload icon\.

### Status

Options:

```
Active
Inactive
```

# 48\.3 EDIT CATEGORY

Admin can:

- Change Name
- Change Description
- Change Status

# 48\.4 DELETE CATEGORY

Only allowed when:

- No templates exist
- No businesses are assigned

Otherwise:

```
Category cannot be deleted.
```

# 49\.0 TEMPLATE MANAGEMENT

## PURPOSE

Templates are the foundation of the Marketing Assets Module\.

Templates define:

- Layout
- Messaging Structure
- QR Placement
- Design Style

# 49\.1 TEMPLATE LIST PAGE

Display:

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987205274&cot=14)*

| Template | Category | Usage Count | Status |
| --- | --- | --- | --- |
| Scan To Order | Restaurant | 2,400 | Active |
| View Catalog | Fashion | 1,800 | Active |

# 49\.2 TEMPLATE ACTIONS

Each template contains:

```
View
Edit
Duplicate
Disable
Delete
```

# 49\.3 CREATE TEMPLATE

Admin clicks:

```
Create Template
```

System opens Template Builder\.

# 50\.0 TEMPLATE BUILDER

## PURPOSE

Allows Admin to visually build reusable marketing templates\.

# 50\.1 TEMPLATE INFORMATION

### Template Name

Example:

```
Scan To Order
```

### Category

Example:

```
Restaurant
```

### Description

Example:

```
Encourages customers to scan and place orders.
```

# 50\.2 LAYOUT SETTINGS

Admin chooses:

### QR Position

```
Top
Center
Bottom
Left
Right
```

### Logo Position

```
Top Left
Top Center
Top Right
```

### CTA Position

```
Above QR
Below QR
Footer
```

# 50\.3 TEMPLATE PLACEHOLDERS

Admin inserts dynamic variables:

```
{{business_name}}

{{logo}}

{{qr_code}}

{{phone}}

{{email}}

{{website}}

{{branch_name}}

{{branch_address}}
```

System automatically replaces placeholders\.

# 50\.4 TEMPLATE PREVIEW

Live preview updates automatically\.

Admin sees exactly how businesses will see the template\.

# 50\.5 TEMPLATE VERSIONING

Every template update creates:

```
Version 1
Version 2
Version 3
```

Old assets continue using previous versions\.

# 51\.0 TEMPLATE STYLES MANAGEMENT

Admin manages:

### Classic

### Modern

### Premium

### Luxury

### Minimal

### Bold

# 51\.1 STYLE SETTINGS

Each style controls:

- Font Sizes
- Font Families
- Color Placement
- Layout Spacing
- CTA Design
- QR Appearance

# 52\.0 FORMAT MANAGEMENT

Admin defines supported formats\.

# AVAILABLE FORMATS

```
A5
A4
A3
Flyer
Banner
Window Sticker
Table Stand
Acrylic Stand
Social Media Post
```

# FORMAT SETTINGS

Admin defines:

### Width

### Height

### Bleed Area

### Print Margin

### Resolution

# 53\.0 MOCKUP MANAGEMENT

## PURPOSE

Mockups help businesses visualize printed materials\.

# 53\.1 MOCKUP LIBRARY

Display:

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987205280&cot=14)*

| Mockup | Type | Status |
| --- | --- | --- |
| Restaurant Wall | Poster | Active |
| Table Stand | Table | Active |

# 53\.2 CREATE MOCKUP

Admin uploads:

### Mockup Name

### Mockup Image

### Mockup Category

### Supported Formats

# 53\.3 MOCKUP TYPES

Supported:

### Wall Poster

### Table Stand

### Counter Display

### Window Sticker

### Reception Desk

### Outdoor Banner

### Roll\-Up Banner

# 53\.4 MOCKUP RENDER ENGINE

When businesses generate assets:

System automatically overlays designs onto selected mockups\.

# 54\.0 AI CONTENT MANAGER

## PURPOSE

Controls how AI generates marketing copy\.

# 54\.1 AI CATEGORY PROMPTS

Admin creates instructions\.

Example:

### Restaurant

```
Generate engaging food-related marketing messages.
```

### Fashion

```
Generate trendy promotional shopping content.
```

### Salon

```
Generate appointment-focused beauty marketing messages.
```

# 54\.2 AI SAFETY RULES

Prevent:

- Offensive language
- Misleading claims
- False advertising
- Spam content

# 54\.3 AI USAGE MONITORING

Track:

### Requests

### Success Rate

### Failures

### Usage By Business

# 55\.0 BRAND RULES MANAGEMENT

## PURPOSE

Maintain design quality across the platform\.

# BRAND RULES

Admin defines:

### Allowed Fonts

### Allowed Colors

### Minimum Logo Size

### QR Safe Zones

### CTA Rules

# 55\.1 BRAND COMPLIANCE CHECKER

Before asset generation:

System validates:

```
Logo Visible
QR Readable
Colors Valid
Text Visible
```

# 56\.0 GENERATED ASSETS MANAGEMENT

## PURPOSE

Allow admins to monitor generated assets\.

# 56\.1 ASSET LIST

Display:

# 56\.2 ASSET ACTIONS

Admin can:

```
View
Download
Archive
Delete
```

# 56\.3 ASSET DETAILS PAGE

Show:

### Business Name

### Creator

### Branch

### Template

### Format

### Downloads

### QR Scans

### Creation Date

# 57\.0 DOWNLOAD MANAGEMENT

## PURPOSE

Monitor all downloads\.

# DOWNLOAD TABLE

Display:

# DOWNLOAD ANALYTICS

Track:

### Most Downloaded Assets

### Most Popular Formats

### Download Trends

# 58\.0 ADMIN ANALYTICS

## PURPOSE

Provide platform\-wide reporting\.

# 58\.1 BUSINESS ANALYTICS

Show:

### Total Businesses

### Active Businesses

### Inactive Businesses

# 58\.2 TEMPLATE ANALYTICS

Show:

### Most Used Templates

### Least Used Templates

### Category Performance

# 58\.3 FORMAT ANALYTICS

Show:

### Most Downloaded Format

### Least Downloaded Format

# 58\.4 QR ANALYTICS

Show:

### Total QR Scans

### Top Scanning Businesses

### Top Scanning Assets

### Scan Trends

# 59\.0 AUDIT LOGS

## PURPOSE

Track every important activity\.

# 59\.1 LOG EVENTS

Track:

### Template Created

### Template Updated

### Template Deleted

### Mockup Uploaded

### AI Prompt Updated

### Asset Deleted

### Permission Changed

### Category Updated

# 59\.2 AUDIT LOG TABLE

Display:

# 60\.0 PERMISSIONS MANAGEMENT

## PURPOSE

Control admin access levels\.

# SUPER ADMIN

Can access:

- Everything

# MARKETING ADMIN

Can access:

- Templates
- Mockups
- AI Prompts

Cannot:

- Manage Permissions

# ANALYTICS ADMIN

Can access:

- Reports
- Analytics

Cannot:

- Edit Templates

# SUPPORT ADMIN

Can access:

- Generated Assets
- Downloads

Cannot:

- Change System Settings

# 61\.0 SYSTEM SETTINGS

## PURPOSE

Configure module\-wide settings\.

# SETTINGS AVAILABLE

### Enable AI Assistant

```
ON/OFF
```

### Enable Mockups

```
ON/OFF
```

### Enable Downloads

```
ON/OFF
```

### Enable Asset Generation

```
ON/OFF
```

### Enable Multi\-Branch Support

```
ON/OFF
```

# 62\.0 TEMPLATE APPROVAL WORKFLOW

## PURPOSE

Prevent unfinished templates from reaching businesses\.

# WORKFLOW

```
Draft
↓
Review
↓
Approved
↓
Published
```

Only Published templates appear inside Business Dashboard\.

# 63\.0 NOTIFICATION SYSTEM

Admin receives alerts for:

### Asset Generation Failures

### AI Service Failures

### Mockup Upload Errors

### Template Publishing Errors

### Storage Capacity Warnings

# 64\.0 ADMIN SUCCESS CRITERIA

The Admin Dashboard is considered successful when administrators can:

1. Create and manage categories\.
2. Create and manage templates\.
3. Build template layouts visually\.
4. Manage mockups\.
5. Configure AI marketing instructions\.
6. Monitor asset generation\.
7. Track downloads and scans\.
8. Review analytics\.
9. Manage permissions\.
10. Control the entire Marketing Assets ecosystem from one dashboard\.

Without requiring developer intervention for day\-to\-day operations\.

This completes **Part 3 — Admin Dashboard**\.

The next major section should be **Part 4 — System Architecture &amp; Technical Requirements**, where we define:

- Database Schema
- Tables &amp; Relationships
- Asset Generation Engine
- QR Engine
- Storage Architecture
- API Specifications
- Permission Architecture
- File Processing Workflow
- AI Service Architecture
- Performance Requirements
- Scalability Requirements
- Security Requirements

# PART 4 — SYSTEM ARCHITECTURE &amp; TECHNICAL REQUIREMENTS

# 65\.0 SYSTEM ARCHITECTURE OVERVIEW

## PURPOSE

This section defines the technical architecture required to build and scale the Vemtap Marketing Assets Module\.

This document serves as the blueprint for:

- Backend Developers
- Frontend Developers
- Database Engineers
- DevOps Engineers
- QA Engineers
- Product Team

The architecture must support:

- Thousands of businesses
- Millions of QR scans
- Thousands of asset generations daily
- High\-resolution file generation
- Multi\-branch businesses
- Future AI expansion

# 66\.0 HIGH\-LEVEL ARCHITECTURE

```
Business Dashboard
        │
        ▼
Marketing Assets Frontend
        │
        ▼
Marketing Assets API
        │
 ┌──────┼──────┐
 ▼      ▼      ▼
Database  File Storage  AI Service
 │         │         │
 ▼         ▼         ▼
QR Engine Asset Engine AI Content Engine
```

# 67\.0 CORE SYSTEM COMPONENTS

The Marketing Assets Module consists of:

### Component 1

Frontend Application

### Component 2

Marketing Assets API

### Component 3

Template Engine

### Component 4

QR Generation Engine

### Component 5

Asset Rendering Engine

### Component 6

Mockup Rendering Engine

### Component 7

AI Content Engine

### Component 8

File Storage System

### Component 9

Analytics Engine

### Component 10

Permission Engine

# 68\.0 DATABASE ARCHITECTURE

## OVERVIEW

The Marketing Assets Module requires dedicated tables\.

These tables must remain separate from operational modules\.

# 69\.0 DATABASE TABLES

Required tables:

```
categories
templates
template_styles
template_formats
mockups
brand_profiles
assets
asset_versions
asset_downloads
asset_analytics
ai_generations
audit_logs
```

# 70\.0 CATEGORIES TABLE

Stores business categories\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987498903&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| name | String |
| slug | String |
| description | Text |
| icon | String |
| status | Enum |
| created\_at | Timestamp |
| updated\_at | Timestamp |

# 71\.0 TEMPLATES TABLE

Stores all marketing templates\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987498906&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| category\_id | UUID |
| name | String |
| description | Text |
| preview\_image | String |
| version | Integer |
| status | Enum |
| created\_by | UUID |
| created\_at | Timestamp |
| updated\_at | Timestamp |

# 72\.0 TEMPLATE STYLES TABLE

Stores style definitions\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987718936&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| name | String |
| font\_family | String |
| primary\_color | String |
| spacing | JSON |
| layout\_rules | JSON |

# 73\.0 TEMPLATE FORMATS TABLE

Stores supported output formats\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987718978&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| name | String |
| width | Integer |
| height | Integer |
| bleed\_area | Integer |
| resolution | Integer |

# 74\.0 MOCKUPS TABLE

Stores mockup assets\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987718981&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| name | String |
| category\_id | UUID |
| image\_url | String |
| type | String |
| status | Enum |

# 75\.0 BRAND PROFILES TABLE

Stores business branding information\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987718998&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| business\_id | UUID |
| logo\_url | String |
| primary\_color | String |
| secondary\_color | String |
| accent\_color | String |
| tagline | String |
| font\_family | String |

# 76\.0 ASSETS TABLE

Stores generated assets\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987719004&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| business\_id | UUID |
| branch\_id | UUID |
| template\_id | UUID |
| style\_id | UUID |
| format\_id | UUID |
| asset\_name | String |
| qr\_destination | String |
| status | Enum |
| created\_by | UUID |
| created\_at | Timestamp |

# 77\.0 ASSET VERSIONS TABLE

Stores asset revisions\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987719009&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| asset\_id | UUID |
| version\_number | Integer |
| file\_url | String |
| created\_at | Timestamp |

# 78\.0 ASSET DOWNLOADS TABLE

Tracks downloads\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987719015&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| asset\_id | UUID |
| downloaded\_by | UUID |
| downloaded\_at | Timestamp |

# 79\.0 AI GENERATIONS TABLE

Stores AI activity\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987719022&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| business\_id | UUID |
| category\_id | UUID |
| prompt | Text |
| response | Text |
| created\_at | Timestamp |

# 80\.0 AUDIT LOGS TABLE

Stores system activities\.

### Fields

*[Table view](https://miro.com/app/board/uXjVGoaDz9E=/?moveToWidget=3458764673987719025&cot=14)*

| Field | Type |
| --- | --- |
| id | UUID |
| user\_id | UUID |
| action | String |
| entity\_type | String |
| entity\_id | UUID |
| ip\_address | String |
| created\_at | Timestamp |

# 81\.0 RELATIONSHIP STRUCTURE

```
Category
   │
   ▼
Templates
   │
   ▼
Assets
   │
   ▼
Downloads
```

```
Business
   │
   ▼
Brand Profile
   │
   ▼
Generated Assets
```

# 82\.0 QR ENGINE

## PURPOSE

Generate dynamic QR codes\.

# QR ENGINE RESPONSIBILITIES

### Generate QR Codes

### Update QR Destination

### Track QR Scans

### Record Scan Analytics

### Support Dynamic Routing

# 83\.0 QR DESTINATION TYPES

Supported destinations:

### Menu

### Ordering

### Booking

### Loyalty

### Feedback

### Promotions

### Product Catalog

### Waitlist

### Reservation

# 84\.0 QR GENERATION FLOW

```
User Selects Destination
        │
        ▼
Generate Dynamic URL
        │
        ▼
Generate QR Image
        │
        ▼
Save QR Record
        │
        ▼
Insert Into Asset
```

# 85\.0 ASSET GENERATION ENGINE

## PURPOSE

Creates final artwork\.

# ASSET GENERATION FLOW

```
Template
   +
Style
   +
Brand Profile
   +
QR Code
   +
Business Data
   =
Generated Asset
```

# 86\.0 ASSET RENDERING PROCESS

Step 1

Load Template

Step 2

Load Business Branding

Step 3

Load QR Code

Step 4

Insert Dynamic Content

Step 5

Apply Style Rules

Step 6

Generate High Resolution Design

Step 7

Save Output

# 87\.0 MOCKUP ENGINE

## PURPOSE

Generate realistic previews\.

# MOCKUP FLOW

```
Generated Asset
      │
      ▼
Mockup Engine
      │
      ▼
Overlay Asset
      │
      ▼
Create Realistic Preview
```

# 88\.0 FILE STORAGE ARCHITECTURE

## STORAGE TYPES

### Logos

### Generated Assets

### Mockups

### Downloads

### Asset Versions

### AI Generated Assets

# STORAGE STRUCTURE

```
/businesses

/brands

/assets

/assets/versions

/mockups

/downloads
```

# 89\.0 FILE TYPES SUPPORTED

### PNG

### Transparent PNG

### PDF

### Print Ready PDF

### JPG Preview

### WEBP Preview

# 90\.0 FILE NAMING STANDARD

Example:

```
asset_12345_a4_v1.pdf
```

Example:

```
asset_12345_banner_v3.png
```

# 91\.0 API ARCHITECTURE

## PURPOSE

Allow frontend and backend communication\.

# 92\.0 CATEGORY APIS

### Get Categories

```javascript
GET /api/categories
```

### Create Category

```javascript
POST /api/categories
```

### Update Category

```javascript
PUT /api/categories/{id}
```

### Delete Category

```javascript
DELETE /api/categories/{id}
```

# 93\.0 TEMPLATE APIS

### Get Templates

```javascript
GET /api/templates
```

### Create Template

```javascript
POST /api/templates
```

### Update Template

```javascript
PUT /api/templates/{id}
```

### Delete Template

```javascript
DELETE /api/templates/{id}
```

# 94\.0 ASSET APIS

### Generate Asset

```javascript
POST /api/assets/generate
```

### Save Asset

```javascript
POST /api/assets/save
```

### Update Asset

```javascript
PUT /api/assets/{id}
```

### Delete Asset

```javascript
DELETE /api/assets/{id}
```

### Get Asset

```javascript
GET /api/assets/{id}
```

# 95\.0 DOWNLOAD APIS

### Download Asset

```javascript
GET /api/assets/download/{id}
```

### Download History

```javascript
GET /api/downloads
```

# 96\.0 ANALYTICS APIS

### Asset Analytics

```javascript
GET /api/analytics/assets
```

### QR Analytics

```javascript
GET /api/analytics/qr
```

### Business Analytics

```javascript
GET /api/analytics/business
```

# 97\.0 AI CONTENT APIS

### Generate Content

```javascript
POST /api/ai/generate
```

### AI Usage

```javascript
GET /api/ai/usage
```

# 98\.0 PERMISSION ARCHITECTURE

## ROLE\-BASED ACCESS CONTROL \(RBAC\)

Every action must pass through permission checks\.

# BUSINESS OWNER

Full Access

# MANAGER

Limited Access

# STAFF

View &amp; Download Access

# ADMIN

System Management

# SUPER ADMIN

Platform Control

# 99\.0 PERFORMANCE REQUIREMENTS

## PAGE LOADS

Maximum:

```
2 Seconds
```

## TEMPLATE LOADS

Maximum:

```
1 Second
```

## ASSET GENERATION

Maximum:

```
10 Seconds
```

## DOWNLOAD GENERATION

Maximum:

```
15 Seconds
```

# 100\.0 SCALABILITY REQUIREMENTS

System must support:

### 100,000\+ Businesses

### 10 Million\+ Assets

### 100 Million\+ QR Scans

### Thousands of Concurrent Users

# 101\.0 SECURITY REQUIREMENTS

## AUTHENTICATION

All APIs require authentication\.

## AUTHORIZATION

Role validation required\.

## FILE PROTECTION

Private files require signed URLs\.

## DATA ENCRYPTION

Encrypt:

- User Data
- Asset Metadata
- API Tokens

# 102\.0 BACKUP REQUIREMENTS

Daily backups\.

Weekly backups\.

Monthly backups\.

Disaster recovery plan required\.

# 103\.0 MONITORING REQUIREMENTS

Monitor:

### API Errors

### Asset Generation Failures

### Download Failures

### AI Failures

### Storage Usage

### QR Service Health

# 104\.0 LOGGING REQUIREMENTS

Log:

### API Requests

### Asset Generation

### Downloads

### User Actions

### Template Changes

### AI Requests

# 105\.0 TECHNICAL SUCCESS CRITERIA

The Marketing Assets Module is technically successful when:

1. Templates load instantly\.
2. QR codes generate correctly\.
3. Assets render accurately\.
4. Mockups display properly\.
5. Downloads work reliably\.
6. Analytics update correctly\.
7. AI generates content successfully\.
8. Multi\-branch assets remain isolated\.
9. System scales without performance degradation\.
10. All actions are secure, logged, and auditable\.

This completes **Part 4 — System Architecture &amp; Technical Requirements**\.

