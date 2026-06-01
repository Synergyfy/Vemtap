# VEMTAP MARKETING ASSETS MODULE \- FULL EXPANDED PRODUCT REQUIREMENTS DOCUMENT \(PRD\)

1. PROJECT OVERVIEW<br>The Marketing Assets Module enables businesses to generate professional QR\-based marketing materials directly from their Vemtap dashboard\. The goal is to eliminate manual design requests, reduce support workload, accelerate onboarding, and allow businesses to deploy marketing materials instantly\.
2. BUSINESS TYPES IN SCOPE<br>Restaurants, Cafes, Lounges, Fashion Stores, Retail Stores, Supermarkets, Salons, Barbershops, Hotels, Guest Houses and similar SME businesses\.

Excluded: Hospitals, Eye Clinics, Pharmacies, Airports, Government Agencies and other enterprise organizations that use specialized operational systems\.

1. BUSINESS GOALS<br>• Self\-service asset generation<br>• Faster QR deployment<br>• Consistent branding<br>• Increased QR scan adoption<br>• Reduced design costs<br>• Scalable onboarding
2. USER ROLES<br>Business Owner<br>Branch Manager<br>Staff with Marketing Permission<br>Platform Administrator<br>Super Administrator
3. BUSINESS DASHBOARD MODULE STRUCTURE<br>Marketing Assets Menu
- Overview
- Template Library
- Create Asset
- Asset Library
- Downloads
- Analytics
- Brand Settings
11. MARKETING ASSETS OVERVIEW PAGE<br>Display:<br>Business Logo<br>Business Name<br>Category<br>Subscription Plan<br>Active Branches<br>Total Assets<br>Total Downloads<br>Total QR Scans<br>Recently Generated Assets

Actions:<br>Generate New Asset<br>Manage Brand Assets<br>View Library

1. CATEGORY DETECTION ENGINE<br>System automatically reads business category during page load\.

Example:<br>Restaurant → Restaurant Templates<br>Salon → Salon Templates<br>Fashion Store → Fashion Templates

Businesses cannot access templates outside their category\.

1. TEMPLATE LIBRARY<br>Each template card displays:<br>Preview image<br>Template name<br>Use case<br>Recommended placement<br>Generate button

Restaurant Templates:<br>Menu QR<br>Order QR<br>Reserve Table<br>Feedback<br>Loyalty<br>Promotions<br>Today's Specials<br>Waitlist

Fashion:<br>Catalog<br>New Arrivals<br>Promotions<br>Collection Showcase<br>Feedback<br>Loyalty

Salon:<br>Book Appointment<br>Service Menu<br>Promotions<br>Loyalty<br>Feedback

Hotel:<br>Reservation<br>Guest Feedback<br>Service Request<br>Promotions<br>Loyalty

1. CREATE ASSET WORKFLOW<br>Step 1: Select Template<br>Step 2: Load Design Workspace<br>Step 3: Customize Content<br>Step 4: Select Style<br>Step 5: Select Output Format<br>Step 6: Generate Design<br>Step 7: Preview<br>Step 8: Save<br>Step 9: Download
2. DESIGN WORKSPACE<br>Left Panel:<br>Live Preview

Center:<br>Canvas

Right Panel:<br>Headline<br>Subheadline<br>Call To Action<br>Branch Selector<br>QR Destination<br>Style Settings<br>Color Settings<br>Logo Controls<br>Contact Information Controls

1. QR DESTINATION OPTIONS<br>Restaurant:<br>Menu<br>Order Page<br>Feedback<br>Loyalty<br>Reservation<br>Waitlist

Fashion:<br>Catalog<br>Collections<br>Promotions<br>Feedback

Salon:<br>Booking<br>Services<br>Feedback

Hotel:<br>Reservations<br>Guest Services<br>Feedback

1. STYLE ENGINE<br>Classic<br>Modern<br>Premium<br>Luxury<br>Minimal<br>Bold

Changing style updates layout instantly without page refresh\.

1. BRANDING ENGINE<br>System automatically loads:<br>Business logo<br>Brand colors<br>Business name<br>Tagline<br>Phone number<br>Email<br>Website<br>Branch information

Assets remain brand\-consistent\.

1. OUTPUT FORMATS<br>Table Stand<br>A5 Poster<br>A4 Poster<br>A3 Poster<br>Square Acrylic<br>Rectangle Acrylic<br>Window Sticker<br>Roll\-Up Banner<br>Flyer<br>Social Media Post
2. DESIGN GENERATION ENGINE<br>When Generate Design is clicked:
3. Fetch brand profile
4. Fetch branch information
5. Generate QR code
6. Apply template
7. Apply style
8. Render preview
9. Create downloadable files
10. Save version
11. MOCKUP PREVIEW SYSTEM<br>Wall Poster<br>Table Stand<br>Counter Display<br>Window Sticker<br>Roll\-Up Banner<br>Outdoor Banner

Users can visualize placement before printing\.

1. AI CONTENT ASSISTANT<br>Generate improved headlines, descriptions and CTAs\.

Example:<br>'View Menu'<br>becomes<br>'Hungry? Scan To Explore Today's Specials'

User can Accept, Reject or Edit\.

1. SAVE ASSET PROCESS<br>Store:<br>Asset Name<br>Template<br>Style<br>Branch<br>Version<br>Creator<br>Date Created<br>QR Destination<br>Output Format
2. DOWNLOAD SYSTEM<br>Formats:<br>PNG<br>Transparent PNG<br>PDF<br>Print Ready PDF

Downloads generated asynchronously for large files\.

1. ASSET LIBRARY<br>Displays:<br>Thumbnail<br>Asset Name<br>Branch<br>Template<br>Date Created<br>Status

Actions:<br>View<br>Edit<br>Duplicate<br>Download<br>Delete<br>Archive

1. SEARCH AND FILTERS<br>Filter by:<br>Date<br>Branch<br>Template<br>Format<br>Creator<br>Status

Search by asset name\.

1. MULTI\-BRANCH SUPPORT<br>Switching branches automatically updates:<br>QR Code<br>Address<br>Phone Number<br>Branch Name<br>Contact Information
2. ANALYTICS<br>Track:<br>Assets Created<br>Downloads<br>QR Scans<br>Top Templates<br>Most Active Branches<br>Most Downloaded Assets
3. ADMIN DASHBOARD<br>Admin can:<br>Create Template<br>Edit Template<br>Delete Template<br>Disable Template<br>Duplicate Template<br>Publish Template
4. TEMPLATE BUILDER<br>Fields:<br>Template Name<br>Category<br>Layout Type<br>Default Headline<br>Default CTA<br>Default Description<br>Supported Formats<br>Preview Images
5. CATEGORY MANAGEMENT<br>Restaurants<br>Fashion Stores<br>Salons<br>Barbershops<br>Hotels<br>Guest Houses<br>Retail Stores<br>Supermarkets<br>Cafes<br>Lounges
6. MOCKUP MANAGEMENT<br>Admin uploads mockups and assigns them to supported formats\.
7. AI PROMPT MANAGEMENT<br>Admin defines category\-specific AI instructions used during content generation\.
8. BRAND PROFILE MANAGEMENT<br>Stores:<br>Logo<br>Brand Colors<br>Fonts<br>Tagline<br>Website<br>Social Links
9. PERMISSIONS<br>Business Users:<br>Generate Assets<br>Edit Assets<br>Download Assets

Admins:<br>Manage Templates<br>Manage Categories<br>Manage Mockups<br>View Analytics

1. DATABASE TABLES<br>businesses<br>branches<br>brand\_profiles<br>categories<br>templates<br>template\_formats<br>assets<br>asset\_versions<br>downloads<br>mockups<br>analytics<br>audit\_logs
2. API REQUIREMENTS<br>GET Templates<br>GET Categories<br>POST Generate Asset<br>POST AI Content<br>POST Download<br>PUT Update Asset<br>DELETE Asset<br>GET Analytics
3. ERROR HANDLING<br>Missing logo<br>Missing brand color<br>Missing QR destination<br>Unsupported format<br>Failed generation<br>Failed download

System must provide clear user\-friendly messages\.

1. PERFORMANCE REQUIREMENTS<br>Template load &lt;2 seconds\.<br>Preview refresh &lt;1 second\.<br>Asset generation &lt;10 seconds for standard assets\.
2. SECURITY<br>Role\-based access control\.<br>Audit logging\.<br>Download authorization\.<br>Branch\-level permissions\.
3. AUDIT LOGS<br>Track:<br>Asset creation<br>Asset edits<br>Downloads<br>Template changes<br>Admin actions
4. FUTURE PHASES<br>Print ordering\.<br>Delivery integration\.<br>Seasonal campaign packs\.<br>Premium template marketplace\.<br>AI layout generation\.<br>Campaign scheduling\.
5. SUCCESS CRITERIA<br>A business owner should be able to create, customize, preview, save and download professional marketing assets without contacting Vemtap support or a designer\.

# 

