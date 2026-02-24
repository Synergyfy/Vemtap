Eliztap NFC Hardware Hub – Product Requirements
Document (PRD)
1. Introduction
This document explains in simple English how the Eliztap NFC Hardware Hub should work. It is written for
developers, designers, and project managers.

The goal is to build a system where businesses can: - See NFC devices - Understand how they work - Book
devices - Customize branding - Receive devices - Manage and reuse devices - Track performance

This system will run on:

hardware.eliztap.com

2. Purpose of the System
The Hardware Hub will:

Show available NFC products
Allow businesses to request and book devices
Automatically create user accounts
Connect orders to suppliers
Manage branding
Track devices
Allow links to be changed anytime
Support reuse of devices
3. Target Users
3.1 Business Owners
Shop owners
Restaurants
Event organizers
Service providers
SMEs
They want easy tools to get reviews, menus, profiles, and digital links.

• • • • • • • • • • • • •
3.2 Eliztap Admin Team
Sales staff
Operations staff
Support staff
Management
They manage orders, suppliers, devices, and customers.

3.3 Suppliers
NFC manufacturers
Printing companies
Packaging companies
They produce and ship devices.

4. System Overview
The system has three main parts:

Public Website (No Login)
Business Portal (Login Required)
Admin Dashboard (Staff Only)
5. Public Website Features (hardware.eliztap.com)
5.1 Homepage
Purpose: Welcome visitors and explain the service.

Must show: - Main message - Benefits - How it works - Buttons to view devices - Trust messages

5.2 Device Catalog Page
Purpose: Show all available NFC devices.

Features: - Device pictures - Name - Use case - Price range - Delivery time - "View Details" button

Filters: - By industry - By price - By size - By usage

• • • • • • •
1.
2.
3.
5.3 Device Details Page
Each device must have: - Multiple photos - Description - What it is used for - Supported phones - Branding
options - Delivery time - Warranty info - FAQ - "Book Order" button

5.4 Branding Gallery Page
Shows: - Sample branded devices - Different colors - Logo placements - Past client examples

5.5 How It Works Page
Shows simple steps:

Choose device
Book order
Customize branding
Production
Delivery
Activation
5.6 FAQ Page
Answers common questions: - Phone compatibility - Setup - Replacement - Editing links - Returns - Support

6. Booking System
6.1 Cart Page
Users can select: - Device type - Quantity - Branding option - Country

Shows: - Estimated price - Production time - Shipping time

6.2 Business Information Form
Required fields: - Business name - Owner name - Phone number - Email - Address - Industry

Optional: - Website - Number of branches

6.3 Confirmation Page
After booking:

Shows message: "Thank you. Our team will contact you shortly."

System must: - Save order - Send email - Send SMS - Alert admin

1.
2.
3.
4.
5.
6.
7. Account Creation System
7.1 Automatic Account Setup
When booking is completed:

If email is new: - Create account - Generate password - Send login link

If email exists: - Link order to account

7.2 User Login System
Users can: - Login - Reset password - Change password - Enable security options

8. Business Dashboard (portal.eliztap.com)
8.1 Dashboard Home
Shows: - Active devices - Orders - Notifications - Tips

8.2 My Devices Section
For each device: - Device ID - Status - Current link - Edit link button - Usage count

8.3 Orders Section
Shows: - Order history - Payment status - Tracking - Invoices

8.4 Branding Section
Allows users to: - Upload logo - Choose colors - Preview design - Approve design

8.5 Analytics Section
Shows: - Number of taps - Daily usage - Review clicks - Conversion rate

8.6 Support Section
Users can: - Open tickets - Chat with support - Request replacement - Report damage

9. Dynamic NFC Link System
9.1 Redirect System
Every NFC must point to:

go.eliztap.com/deviceID

This page redirects to: - Review page - Menu - Website - Profile

9.2 Link Management
Business owners can: - Change links anytime - Schedule changes - Add multiple links - Set fallback links

9.3 Reuse System
When device is returned or inactive: - Admin can reset - Clear old data - Assign to new user

10. Admin Dashboard (admin.eliztap.com)
10.1 User Management
Admins can: - View users - Suspend accounts - Reset passwords - Assign managers

10.2 Order Management
Shows: - Order list - Status - Payments - Supplier info

Status flow: Pending → Approved → Paid → Production → Shipped → Delivered → Active

10.3 Device Registry
Stores: - Device UID - Batch number - Client - Status - Activation date

10.4 Supplier Management
Admins manage: - Supplier list - Prices - MOQ - Lead time - Quality ratings

10.5 Pricing Control
Admins can: - Set base price - Add margin - Create discounts - Adjust per country

10.6 Support Management
Admins handle: - Tickets - Escalations - Refunds - Replacements

11. Supplier Integration System
11.1 Purchase Orders
System generates: - Order document - Branding files - Device specs

11.2 Production Tracking
Suppliers upload: - Photos - Videos - Progress reports

11.3 Shipping Tracking
Stores: - Courier name - Tracking number - Delivery status

12. Device Provisioning System
12.1 Batch Registration
When devices arrive: - Scan UID - Register batch - Assign owner

12.2 Activation Process
Admin clicks: "Activate"

System: - Enables redirect - Links account - Starts analytics

13. Notifications System
System sends: - Email - SMS - In-app alerts

For: - Orders - Payments - Shipping - Activation - Support

14. Security & Data Protection
Must include: - Encrypted passwords - Secure payments - Access control - Activity logs - Daily backups

15. Reporting System
Admins can see: - Sales reports - Revenue - Device usage - Supplier performance - Customer growth

Exports: - PDF - Excel

16. Integration With Main Eliztap Platform
Hardware Hub must connect with: - Review system - Business profiles - CRM - Finance system - Inventory
system

17. Performance Requirements
System must: - Load in under 3 seconds - Support 100,000+ users - Handle 10,000+ devices - Work on
mobile

18. Scalability Plan
Future support: - Multiple countries - Multiple currencies - Multiple suppliers - Reseller accounts - White-
label partners

19. Phase Development Plan
Phase 1 (MVP)
Public catalog
Booking system
Basic admin
Manual supplier flow
Phase 2 (Growth)
Payment gateway
Auto provisioning
Supplier APIs
Advanced analytics
Phase 3 (Platform)
Global logistics
AI forecasting
Smart pricing
Reseller portal
• • • • • • • • • • • •
20. Success Metrics
Measure: - Visitors to bookings - Orders to delivery - Activation rate - Repeat orders - Customer retention

21. Future Enhancements
Planned features: - Mobile app - Device insurance - Subscription hardware - Leasing options - Smart
campaigns - Offline sync

22. Approval
This document must be approved by: - Product Owner - Technical Lead - Operations Lead - Management

Before development starts.