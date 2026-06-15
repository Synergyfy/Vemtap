# ANTIGRAVITY AI PROMPT
# VEMTAP — MARKETING ASSETS MODULE
# Full Build Specification

---

## CONTEXT

You are building a new module called **Marketing Assets** inside the Vemtap platform.

Vemtap is a business management platform used by restaurants, eye clinics, pharmacies, salons, fashion stores, hotels, schools, and other business categories. Businesses already have a registered account with the following data stored:

- Business Name
- Business Logo
- Business Category
- Primary Color
- Secondary Color
- Accent Color
- QR Code (Dynamic)
- Phone Number
- Email
- Website
- Address
- Branch Name(s)

The Marketing Assets module allows businesses to generate professional QR marketing materials instantly from their dashboard — without needing a designer, without contacting support, and without leaving the platform.

The entire experience must feel effortless. A business owner should be able to open this page, generate a print-ready design, and download it in under 60 seconds.

---

## WHAT YOU ARE BUILDING

Two surfaces:

1. **Business Dashboard** — Marketing Assets page (primary)
2. **Admin Dashboard** — Marketing Assets Manager (secondary)

Build them in this order. The business-facing experience is the priority.

---

---

# PART 1: BUSINESS DASHBOARD
# MARKETING ASSETS PAGE

---

## NAVIGATION

Add **Marketing Assets** as a main menu item in the business dashboard sidebar.

Icon: a paint brush or poster icon.

Position it logically alongside other primary features in the sidebar.

---

## PAGE STRUCTURE

The Marketing Assets page uses a **single-page layout with three tabs**.

Do not use separate pages or heavy navigation. Everything lives on one screen.

---

### Page Header

Display at the top of the page:

```
Marketing Assets
Create professional QR marketing materials in seconds.
```

Below the title, display a pill or badge showing the detected business category:

```
Business Type: Restaurant
```

or

```
Business Type: Eye Clinic
```

This must be **auto-detected** from the business account. It is not user-selectable on this page.

---

### Tab Navigation

Render three tabs below the header:

```
[ Templates ]   [ My Assets ]   [ Downloads ]
```

Default active tab: **Templates**

---

---

## TAB 1: TEMPLATES

This is the main tab. This is where businesses discover and generate assets.

---

### Layout

Display template cards in a responsive grid.

- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

---

### Category Locking — CRITICAL

**Businesses must only see templates that match their registered category.**

This is non-negotiable. It must be enforced at the data and UI level.

- Restaurant accounts see only Restaurant templates
- Eye Clinic accounts see only Eye Clinic templates
- Pharmacy accounts see only Pharmacy templates
- Salon accounts see only Salon templates
- Fashion Store accounts see only Fashion Store templates
- Hotel accounts see only Hotel templates

A restaurant must never see a Patient Check-In template.
A clinic must never see a Food Ordering template.

If the business category does not match any available template category, display a friendly message:

```
Templates for your business category are coming soon.
We're working on it.
```

---

### Template Card Design

Each card displays:

- **Preview Image** — A visual thumbnail of the template design
- **Template Name** — e.g. "Scan To View Menu"
- **Short Description** — One line explaining purpose
- **Generate Button** — Primary CTA

Example card:

```
[ Preview Image ]

Scan To View Menu
Allow customers to scan and view your menu.

[ Generate Asset ]
```

---

### Restaurant Templates (8 templates)

| Template Name | Purpose |
|---|---|
| Scan To View Menu | Allow customers to scan and access the menu |
| Scan To Order | Allow customers to place orders via QR |
| Today's Specials | Highlight daily promotions |
| Join Loyalty Program | Allow customers to enrol in rewards |
| Leave A Review | Collect customer feedback |
| Join Waitlist | Allow customers to join the queue |
| Reserve A Table | Allow customers to book a table |
| Scan For Promotions | Display current offers and discounts |

---

### Eye Clinic Templates (7 templates)

| Template Name | Purpose |
|---|---|
| Patient Check-In | Allow patients to check in digitally |
| Book An Appointment | Allow patients to schedule eye exams |
| Join The Queue | Allow patients to manage their queue position |
| Patient Feedback | Collect patient experience feedback |
| View Optical Catalog | Showcase eyewear products |
| Follow-Up Reminder | Help patients manage follow-up visits |
| Branch Locator | Help patients find nearby branches |

---

### Pharmacy Templates (6 templates)

| Template Name | Purpose |
|---|---|
| View Product Catalog | Display pharmacy products |
| Prescription Refill | Allow patients to request refills |
| Join Loyalty Program | Reward returning customers |
| Health Awareness Campaign | Promote seasonal health messages |
| Customer Feedback | Gather customer opinions |
| Branch Locator | Help customers find nearby branches |

---

### Salon Templates (5 templates)

| Template Name | Purpose |
|---|---|
| Book An Appointment | Allow clients to schedule services |
| View Service Menu | Display available salon services |
| Leave A Review | Collect client feedback |
| Join Loyalty Program | Reward returning clients |
| View Promotions | Showcase offers and discounts |

---

### Fashion Store Templates (5 templates)

| Template Name | Purpose |
|---|---|
| View New Collection | Showcase latest arrivals |
| Discover Our Products | Allow customers to browse catalog |
| Join Loyalty Program | Reward repeat shoppers |
| Leave A Review | Collect customer feedback |
| View Current Promotions | Display active discounts |

---

### Hotel Templates (5 templates)

| Template Name | Purpose |
|---|---|
| Make A Reservation | Allow guests to book rooms |
| Request Room Service | Allow guests to place service requests |
| Guest Feedback | Collect guest experience feedback |
| View Amenities | Display hotel facilities |
| View Restaurant Menu | Allow guests to view in-house dining menu |

---

---

## GENERATION FLOW

When a business clicks **Generate Asset**, open a modal or full-screen overlay.

This is a **5-step wizard**. Display a step indicator at the top showing progress.

```
Step 1 of 5 — Preview
Step 2 of 5 — Customise
Step 3 of 5 — Style
Step 4 of 5 — Size
Step 5 of 5 — Generate
```

Navigation: **Back** and **Next** buttons. Allow the user to go back to any previous step without losing their selections.

---

### STEP 1 — TEMPLATE PREVIEW

Display a live preview of the selected template.

The preview must automatically populate with data already stored in the business account:

- Business Name
- Business Logo
- QR Code
- Primary Brand Color
- Secondary Brand Color
- Phone Number

Show the template as it will look with real business data inserted.

Below the preview, show a summary panel:

```
Template: Scan To View Menu
Business: Chicken Republic Wuse 2
QR Destination: Menu Page
Branch: Wuse 2
```

If the business has multiple branches, show a **Branch Selector** dropdown at this step:

```
Select Branch:
[ Wuse 2 ▾ ]
```

Changing the branch updates the QR code and branch name in the preview in real time.

CTA: **Next — Customise Text**

---

### STEP 2 — CUSTOMISE TEXT

Display three editable fields, pre-filled automatically based on the selected template:

**Headline**
```
Ready To Order?
```

**Subheadline**
```
Scan to view our full menu.
```

**Call To Action**
```
Fast • Easy • Contactless
```

These are editable. The user can change any field.

Below the fields, show a **live mini-preview** that updates as the user types. Changes appear in real time.

Also display a note:

```
💡 AI-powered creative copy — Coming Soon
```

This is a placeholder for the future AI Content Assistant feature. Show it as a disabled, greyed-out button or badge. Do not build the AI functionality yet.

CTA: **Next — Choose Style**

---

### STEP 3 — DESIGN STYLE

Display style options as visual cards with sample previews.

Each style card shows:
- Style name
- Small visual example of that style applied to a sample design
- Brief one-line description

Styles:

| Style | Description |
|---|---|
| Classic | Professional and traditional |
| Modern | Clean and contemporary |
| Premium | Elegant and sophisticated |
| Luxury | High-end appearance |
| Minimal | Simple and uncluttered |
| Bold | High visibility and strong attention |

Only one style can be selected at a time. Highlight the selected card.

CTA: **Next — Choose Size**

---

### STEP 4 — OUTPUT SIZE

Display size options as selectable cards, organised into two groups:

**Print Formats**

| Size | Use Case |
|---|---|
| Table Stand | Restaurant tables, counters |
| A5 Poster | Small display poster |
| A4 Poster | Standard office/store poster |
| A3 Poster | Large display poster |
| Square Acrylic | Wall-mounted acrylic display |
| Rectangle Acrylic | Reception and counter acrylic |
| Window Sticker | Doors and glass surfaces |
| Roll-Up Banner | Entrance and event banners |
| Flyer | Handouts and distribution |

**Digital Formats**

| Size | Use Case |
|---|---|
| Social Media Post | Square format for Instagram/Facebook |
| Story Format | Vertical format for Stories/WhatsApp |
| Website Banner | Horizontal banner for web use |

Only one size can be selected at a time.

CTA: **Next — Generate Design**

---

### STEP 5 — GENERATE

Show a summary of all selections:

```
Template:     Scan To View Menu
Business:     Chicken Republic Wuse 2
Branch:       Wuse 2
Style:        Modern
Size:         A4 Poster
Headline:     Ready To Order?
Subheadline:  Scan to view our full menu.
CTA:          Fast • Easy • Contactless
```

Display a large primary button:

```
[ Generate Design ]
```

When clicked:

1. Show a loading state with a progress indicator
2. Display message: *Generating your design...*
3. Target generation time: under 5 seconds
4. Maximum generation time: 10 seconds

On completion, close the wizard and display the **Generated Design View**.

---

---

## GENERATED DESIGN VIEW

After generation is complete, display the result in a dedicated view within the page.

---

### Design Preview Panel

- Display the generated design at large size
- Zoom in / Zoom out controls
- Fullscreen button
- The design must render at high resolution

---

### Mockup Preview Section

Below the design preview, show a row of mockup options:

```
Preview As:
[ Wall Poster ]  [ Table Stand ]  [ Counter Display ]  [ Glass Sticker ]  [ Reception Desk ]  [ Outdoor Banner ]
```

When a mockup is selected, render a **realistic environmental mockup** showing the generated design placed in that environment.

Example:

- Wall Poster → Show the design mounted on a restaurant or clinic wall
- Table Stand → Show the design in a tent-card holder on a table
- Glass Sticker → Show the design applied to a glass door or window

Mockup images are uploaded and managed by Admin (see Part 2).

The design artwork is overlaid onto the mockup using standard image compositing. The design does not change — only the environment changes.

---

### Action Buttons

Below the preview:

```
[ Download PNG ]   [ Download PDF ]   [ Download Print-Ready PDF ]   [ Save Asset ]
```

**Download PNG** — Standard image, RGB, screen resolution
**Download PDF** — Standard PDF for digital sharing
**Download Print-Ready PDF** — High resolution, CMYK, with bleed marks
**Save Asset** — Save to My Assets library

On save, display a confirmation:

```
✓ Asset saved to My Assets.
```

---

---

## TAB 2: MY ASSETS

This tab displays all assets previously generated by the business.

---

### Layout

Display saved assets in a card grid:

- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column

---

### Asset Card

Each card displays:

- Thumbnail of the design
- Template Name
- Date Created
- Branch (if multi-branch)
- Action menu (three-dot icon)

---

### Action Menu Options

```
View
Edit
Duplicate
Download
Delete
```

**View** — Opens the design in full preview mode
**Edit** — Re-opens the generation wizard pre-filled with this asset's settings
**Duplicate** — Creates a copy of the asset in the library
**Download** — Opens download options (PNG, PDF, Print-Ready PDF)
**Delete** — Shows confirmation dialog before deleting

---

### Edit and Version Control

When a business edits a saved asset, display a dialog:

```
How would you like to save?

( ) Save Changes       — Update the existing asset
( ) Save As New Version — Create a copy and keep the original

[ Cancel ]   [ Save ]
```

This prevents accidental overwriting of original designs.

---

### Empty State

If no assets have been generated yet, show:

```
No assets yet.
Go to Templates and generate your first marketing material.

[ Browse Templates ]
```

---

### Search and Filter

Above the asset grid, display:

- **Search bar** — Search by asset name
- **Filter dropdown** — Filter by: Date Created, Template Type, Asset Size, Branch

---

---

## TAB 3: DOWNLOADS

This tab provides a download history of all files previously downloaded.

---

### Table Layout

Display a table with columns:

```
File Name | Asset Type | Size | Date | Download
```

Each row has a **Download** button that re-downloads the file.

Include filters:

- Date range
- File type (PNG, PDF, Print-Ready PDF)

---

---

# PART 2: ADMIN DASHBOARD
# MARKETING ASSETS MANAGER

---

## NAVIGATION

Add **Marketing Assets** as a section inside the Admin Dashboard.

Sub-label: *Template & Asset Management*

---

## ADMIN PAGE STRUCTURE

Use a tabbed layout with five tabs:

```
[ Templates ]   [ Categories ]   [ Mockups ]   [ AI Prompts ]   [ Print Sizes ]
```

> Note: The AI Prompts tab should be built but can be left with placeholder content for now, as the AI Content Assistant feature is Coming Soon.

---

---

## ADMIN TAB 1: TEMPLATES

This is where all templates are created and managed.

---

### Template List View

Display all templates in a table:

```
Template Name | Category | Status | Actions
```

**Status** options: Active / Inactive

**Actions**: Edit | Duplicate | Delete

---

### Create Template

Button at top right:

```
[ + Create Template ]
```

Opens a form with fields:

| Field | Type | Notes |
|---|---|---|
| Template Name | Text | e.g. "Scan To View Menu" |
| Category | Dropdown | Select from available categories |
| Headline | Text | Default headline text |
| Subheadline | Text | Default subheadline text |
| Call To Action | Text | Default CTA text |
| Preview Image | Image Upload | Thumbnail shown to businesses |
| Status | Toggle | Active or Inactive |

Save button: **Create Template**

---

### Edit Template

Clicking Edit on any template opens the same form pre-filled with existing data.

Save button: **Save Changes**

---

### Duplicate Template

Creates a copy of the template with the name prefixed:

```
Copy of — Scan To View Menu
```

The copy is set to Inactive by default.

---

### Delete Template

Show confirmation dialog:

```
Are you sure you want to delete this template?
This action cannot be undone.

[ Cancel ]   [ Delete ]
```

---

---

## ADMIN TAB 2: CATEGORIES

This is where business categories are managed.

---

### Category List View

Display all categories in a table:

```
Category Name | Template Count | Status | Actions
```

**Actions**: Edit | Delete

---

### Create Category

Button:

```
[ + Add Category ]
```

Fields:

| Field | Type |
|---|---|
| Category Name | Text |
| Description | Text |
| Icon | Image Upload |
| Status | Toggle (Active/Inactive) |

---

### Important Rule

Deleting a category that has active templates must display a warning:

```
This category has 8 active templates.
Deleting it will make those templates unavailable to businesses.

[ Cancel ]   [ Delete Anyway ]
```

---

---

## ADMIN TAB 3: MOCKUPS

This is where environmental mockup images are managed.

---

### Mockup List View

Display mockups in a grid showing:

- Mockup thumbnail
- Mockup Name
- Category
- Status
- Edit / Delete actions

---

### Upload Mockup

Button:

```
[ + Upload Mockup ]
```

Fields:

| Field | Type | Notes |
|---|---|---|
| Mockup Name | Text | e.g. "Restaurant Wall Poster" |
| Category | Dropdown | Which business category it applies to |
| Image | Image Upload | The mockup background image |
| Design Placement Area | Coordinates | X, Y, Width, Height for overlay placement |
| Status | Toggle | Active or Inactive |

The **Design Placement Area** defines exactly where the generated design artwork is composited onto the mockup image. This must be configurable so the overlay lands precisely.

---

### Mockup Categories

Admin should be able to assign mockups to:

- All Categories (universal)
- Specific category only (e.g. Restaurant only)

---

---

## ADMIN TAB 4: AI PROMPTS

> This tab supports the future AI Content Assistant feature, which is **Coming Soon**.
> Build the tab and the data structure. Leave the content as placeholder for now.

---

### Purpose

When the AI Content Assistant is activated in a future phase, it will use category-specific prompts to generate better marketing copy.

---

### Prompt List View

Display a table:

```
Category | Prompt Preview | Last Updated | Edit
```

---

### Edit Prompt

Clicking Edit opens a text area:

```
Category: Restaurant

AI Instruction:
[ Generate attractive food-focused marketing copy that increases
  customer engagement and drives ordering behaviour. Use
  appetising language. Keep tone friendly and energetic.        ]

[ Save Prompt ]
```

---

### Note to Developer

Do not connect these prompts to any AI service yet. Store them in the database. They will be activated in a future phase.

---

---

## ADMIN TAB 5: PRINT SIZES

This is where all output size specifications are managed.

---

### Size List View

Display a table:

```
Size Name | Width | Height | Bleed | Safe Area | Status | Actions
```

---

### Create Print Size

Button:

```
[ + Add Print Size ]
```

Fields:

| Field | Type | Unit |
|---|---|---|
| Size Name | Text | e.g. "A4 Poster" |
| Width | Number | mm |
| Height | Number | mm |
| Bleed Area | Number | mm (applied to all edges) |
| Safe Area | Number | mm (inset from bleed) |
| Format Type | Dropdown | Print or Digital |
| Status | Toggle | Active or Inactive |

---

### Default Print Sizes (Pre-loaded)

Pre-populate the following sizes on first setup:

| Size Name | Width | Height | Bleed | Safe Area | Type |
|---|---|---|---|---|---|
| Table Stand | 100mm | 150mm | 3mm | 5mm | Print |
| A5 Poster | 148mm | 210mm | 3mm | 5mm | Print |
| A4 Poster | 210mm | 297mm | 3mm | 5mm | Print |
| A3 Poster | 297mm | 420mm | 3mm | 5mm | Print |
| Square Acrylic | 200mm | 200mm | 3mm | 5mm | Print |
| Rectangle Acrylic | 200mm | 300mm | 3mm | 5mm | Print |
| Window Sticker | 148mm | 210mm | 3mm | 5mm | Print |
| Roll-Up Banner | 850mm | 2000mm | 5mm | 10mm | Print |
| Flyer | 148mm | 210mm | 3mm | 5mm | Print |
| Social Media Post | 1080px | 1080px | 0 | 80px | Digital |
| Story Format | 1080px | 1920px | 0 | 100px | Digital |
| Website Banner | 1200px | 400px | 0 | 60px | Digital |

---

---

# PART 3: DATABASE REQUIREMENTS

---

## Tables to Create

### marketing_templates

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Template name |
| category_id | UUID | FK to categories |
| default_headline | String | |
| default_subheadline | String | |
| default_cta | String | |
| preview_image_url | String | |
| status | Enum | active / inactive |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

### marketing_categories

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | e.g. Restaurant |
| description | String | |
| icon_url | String | |
| status | Enum | active / inactive |

---

### generated_assets

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| business_id | UUID | FK to businesses |
| branch_id | UUID | FK to branches (nullable) |
| template_id | UUID | FK to marketing_templates |
| style | String | classic / modern / premium / luxury / minimal / bold |
| output_size | String | FK or string reference to print size |
| headline | String | User-edited value |
| subheadline | String | User-edited value |
| cta | String | User-edited value |
| qr_destination | String | URL or destination reference |
| file_path_png | String | |
| file_path_pdf | String | |
| file_path_print_pdf | String | |
| version | Integer | For version control, starts at 1 |
| parent_asset_id | UUID | Nullable, links to original if this is a new version |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

### mockups

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | e.g. Wall Poster |
| category_id | UUID | Nullable, if null applies to all |
| image_url | String | |
| placement_x | Integer | Pixels |
| placement_y | Integer | Pixels |
| placement_width | Integer | Pixels |
| placement_height | Integer | Pixels |
| status | Enum | active / inactive |

---

### print_sizes

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | |
| width | Decimal | mm or px |
| height | Decimal | mm or px |
| bleed | Decimal | |
| safe_area | Decimal | |
| format_type | Enum | print / digital |
| unit | Enum | mm / px |
| status | Enum | active / inactive |

---

### ai_prompts

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| category_id | UUID | FK to categories |
| prompt_text | Text | Instruction for AI |
| updated_at | Timestamp | |

> Note: This table is built now but the AI service integration happens in a future phase.

---

### asset_downloads

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| asset_id | UUID | FK to generated_assets |
| business_id | UUID | |
| file_type | Enum | png / pdf / print_pdf |
| downloaded_at | Timestamp | |

---

---

# PART 4: SECURITY REQUIREMENTS

- Businesses can only view, edit, and download their own generated assets
- Branch managers can only access assets assigned to their branch
- Admin has full access to all templates, categories, mockups, sizes, and prompts
- All asset file paths must be protected and not publicly guessable (use signed URLs or equivalent)
- Category locking must be enforced server-side, not just client-side

---

---

# PART 5: PERFORMANCE REQUIREMENTS

| Action | Target | Maximum |
|---|---|---|
| Template list load | < 1 second | 2 seconds |
| Design generation | < 5 seconds | 10 seconds |
| Mockup render | < 2 seconds | 4 seconds |
| Asset library load | < 1.5 seconds | 3 seconds |
| File download trigger | < 2 seconds | 5 seconds |

---

---

# PART 6: FUTURE PHASES — ARCHITECTURE NOTES

> Do not build the following now. But ensure the architecture supports them.

---

### Phase 2 — AI Content Assistant

When activated:
- A button labelled **Generate Creative Version** appears in Step 2 (Customise Text)
- Clicking it calls the AI service with the category-specific prompt from `ai_prompts` table
- AI returns an improved headline, subheadline, and CTA
- User can accept or keep their own text

The `ai_prompts` table and the disabled UI button must be built now as placeholders.

---

### Phase 3 — Print & Deliver

When activated:
- After downloading, an option to **Order Print** appears
- Business selects quantity, material, and delivery address
- Vemtap connects to print partner API
- Business pays and tracks order

Architecture note: The `generated_assets` table must store final file paths accessible by print partners.

---

### Phase 4 — Seasonal Campaign Packs

Predefined template bundles for:
- Ramadan
- Christmas
- Valentine's Day
- Easter
- Independence Day

Architecture note: Add a `campaign_pack_id` nullable field to `marketing_templates` now.

---

### Phase 5 — Template Marketplace

Premium templates purchasable by businesses.

Architecture note: Add a `is_premium` boolean and `price` field to `marketing_templates` now.

---

---

# PART 7: UI AND DESIGN REQUIREMENTS

- The interface must be fully responsive — desktop, tablet, and mobile
- Use the existing Vemtap design system for all components, spacing, typography, and color
- The Templates tab must feel like browsing a product catalog — visual cards, not forms
- The generation wizard must feel fast and progress-driven — always show the user where they are
- The mockup preview section must feel like a live product visualiser
- All loading states must show a spinner or skeleton screen — never a blank or frozen screen
- Empty states must always include a helpful action button, not just a message
- All destructive actions (Delete) must require a confirmation dialog

---

---

# DELIVERY CHECKLIST

Before marking this module complete, verify:

- [ ] Business category is auto-detected and correctly locks templates
- [ ] All templates per category are created and displaying
- [ ] Template cards show preview images, names, descriptions, and Generate button
- [ ] Generation wizard has all 5 steps with back/next navigation
- [ ] All business data (name, logo, QR, colors) auto-populates in Step 1
- [ ] Branch selector works and updates QR + branch name in real time
- [ ] Text fields in Step 2 are pre-filled and editable with live preview
- [ ] "AI Creative Version — Coming Soon" placeholder is visible but disabled in Step 2
- [ ] Style selector shows 6 styles as visual cards
- [ ] Size selector shows all print and digital formats grouped correctly
- [ ] Generation loading state works within 5–10 second window
- [ ] Generated design preview shows with zoom and fullscreen controls
- [ ] Mockup preview system shows at least 4 mockups per category
- [ ] Download options work: PNG, PDF, Print-Ready PDF
- [ ] Save Asset stores correctly to My Assets
- [ ] My Assets tab shows saved assets with View, Edit, Duplicate, Download, Delete actions
- [ ] Edit triggers version control dialog (Save Changes vs Save As New Version)
- [ ] Search and filter works in My Assets
- [ ] Downloads tab shows download history
- [ ] Admin: Create, Edit, Duplicate, Delete templates works
- [ ] Admin: Categories management works with template count shown
- [ ] Admin: Mockup upload with placement area configuration works
- [ ] Admin: AI Prompts tab is built with placeholder content (not connected)
- [ ] Admin: Print Sizes manager works with all default sizes pre-loaded
- [ ] All default print sizes pre-populated in database
- [ ] Security: businesses cannot access other businesses' assets
- [ ] Security: category locking enforced server-side
- [ ] All performance targets met
- [ ] Fully responsive on mobile, tablet, and desktop

---

*End of Antigravity Prompt — Vemtap Marketing Assets Module v1.0*
