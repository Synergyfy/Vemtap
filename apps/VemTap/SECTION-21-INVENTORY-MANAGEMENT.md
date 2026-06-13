# SECTION 21 INVENTORY MANAGEMENT

## PROJECT CONTEXT

Design the complete mobile\-first Inventory Management module for Vemtap\.

This module must be completely separate from the Products &amp; Services module\.

### Important Difference

# **Products &amp; Services**

Defines what the business sells\.

Example:

- Coca Cola
- Rice
- Men's Shirt
- Haircut
- Car Wash

# **Inventory**

Tracks stock quantity movement\.

Example:

Coca Cola

Opening Stock: 100

Sold: 20

Added: 50

Remaining: 130

Inventory is the operational engine behind:

- POS
- Orders
- Sales
- Product Availability
- Low Stock Alerts
- Stock Audits
- Inventory Analytics
- Future Multi\-Location Management

The inventory system must automatically update whenever:

- A sale occurs
- An order is fulfilled
- Stock is added
- Stock is removed
- Stock is adjusted

The experience should feel:

- Professional
- Fast
- Accurate
- Audit\-ready
- Easy for non\-technical business owners

# BRAND GUIDELINES

Platform

Vemtap

Primary Color

\#066CF4

Design Style

- Mobile\-first
- Modern inventory software
- Clean
- Business\-focused
- Easy to scan
- Data\-driven

Use Vemtap branding consistently\.

# MODULE FLOW

Inventory Dashboard

↓

Stock Management

↓

Stock Adjustment

↓

Low Stock Monitoring

↓

Stock Movement Tracking

↓

Inventory Analytics

↓

Inventory Reports

# GLOBAL NAVIGATION

Top Navigation

Page Title

Notifications

Help

Bottom Navigation

Home

Products

Inventory

Sales

More

# SCREEN 1: INVENTORY DASHBOARD

## Goal

Provide a complete overview of stock health\.

# Header

Title

Inventory

Subtitle

Track and manage stock levels across your business\.

# INVENTORY OVERVIEW CARDS

Horizontal Scroll Cards

## Total Stock Units

Example

12,450

Icon

Package

## Low Stock Products

Example

18

Icon

Alert Triangle

## Out Of Stock Products

Example

7

Icon

X Circle

## Inventory Value

Example

₦4,250,000

Future Ready

Icon

Wallet

## Recent Adjustments

Example

35

Icon

Refresh Cw

# QUICK ACTIONS

Large Action Cards

Add Stock

Remove Stock

Adjust Stock

View Movement Log

Low Stock Alerts

Generate Report

# STOCK HEALTH SUMMARY

Visual Progress Card

Healthy Stock

Low Stock

Out Of Stock

Color\-Coded Indicators

# RECENT INVENTORY ACTIVITY

Timeline Feed

Stock Added

Stock Removed

Stock Adjusted

Sale Deducted Stock

Order Deducted Stock

# LOW STOCK PREVIEW

Products Near Reorder Level

Product Name

Current Quantity

Minimum Level

Action Button

Restock

# OUT OF STOCK PREVIEW

Products Currently Unavailable

Product Name

Last Available Date

Action Button

Add Stock

# INVENTORY PERFORMANCE

Mini Charts

Stock In

Stock Out

Inventory Adjustments

# EMPTY STATE

Illustration

Headline

No Inventory Data Yet

Message

Add products and stock to begin tracking inventory\.

Button

Add Stock

# SCREEN 2: STOCK MANAGEMENT

## Goal

Manage all inventory movements\.

# Header

Stock Management

# STOCK ACTIONS

Large Action Cards

Add Stock

Remove Stock

Transfer Stock

Future Ready

Adjust Stock

# INVENTORY SEARCH

Search By

Product Name

SKU

Barcode

# PRODUCT INVENTORY LIST

Each Card Contains

Product Image

Product Name

SKU

Current Stock

Status

Action Button

Manage

# SCREEN 2A: ADD STOCK

## Goal

Increase inventory quantity\.

# Header

Add Stock

# PRODUCT SELECTION

Search Product

Select Product

# STOCK DETAILS

Current Quantity

Quantity To Add

New Quantity Preview

# STOCK SOURCE

Supplier

Optional

Purchase Reference

Optional

Invoice Number

Optional

# NOTES

Reason For Stock Addition

# BUTTON

Add Stock

# SUCCESS SCREEN

Stock Added Successfully

Updated Quantity Display

# SCREEN 2B: REMOVE STOCK

## Goal

Remove inventory manually\.

# Header

Remove Stock

# PRODUCT SELECTION

Search Product

# STOCK DETAILS

Current Quantity

Quantity To Remove

Remaining Quantity Preview

# REASON FOR REMOVAL

Damaged

Expired

Lost

Returned To Supplier

Manual Adjustment

Other

# NOTES

Optional

# BUTTON

Remove Stock

# WARNING MESSAGE

This action will reduce available inventory\.

# SCREEN 2C: TRANSFER STOCK \(FUTURE\)

## Goal

Transfer inventory between locations\.

# Header

Transfer Stock

# FROM LOCATION

Dropdown

# TO LOCATION

Dropdown

# PRODUCT

Select Product

# QUANTITY

Transfer Quantity

# REVIEW

Confirm Transfer

# BUTTON

Transfer Stock

# SCREEN 2D: ADJUST STOCK

## Goal

Correct inventory discrepancies\.

# Header

Adjust Stock

# PRODUCT

Search Product

# CURRENT QUANTITY

Display

# ACTUAL COUNT

Input

# DIFFERENCE

Automatically Calculated

# REASON

Stock Count Correction

Inventory Audit

System Error

Damaged Items

Other

# NOTES

Required

# BUTTON

Save Adjustment

# CONFIRMATION MODAL

Before adjustment is applied\.

# SCREEN 2E: PRODUCT INVENTORY DETAILS

## Goal

View complete inventory history\.

# PRODUCT INFORMATION

Product Image

Product Name

SKU

Category

# INVENTORY OVERVIEW

Current Stock

Minimum Stock Level

Maximum Stock Level

Future Ready

# STOCK HEALTH

Healthy

Low Stock

Out Of Stock

# STOCK MOVEMENT SUMMARY

Added

Removed

Sold

Adjusted

# ACTION BUTTONS

Add Stock

Remove Stock

Adjust Stock

View Log

# SCREEN 3: LOW STOCK ALERTS

## Goal

Automatically notify businesses about inventory shortages\.

# Header

Low Stock Alerts

# ALERT SUMMARY

Low Stock Products

Out Of Stock Products

Critical Stock Products

# ALERT LIST

Each Card Contains

Product Name

Current Quantity

Minimum Quantity

Status

# ALERT STATUS

Low Stock

Critical

Out Of Stock

# RECOMMENDED ACTION

Restock Now

Adjust Stock

Archive Product

# FILTERS

All Alerts

Low Stock

Critical

Out Of Stock

# AUTOMATIC ALERT SETTINGS

Enable Low Stock Alerts

Toggle

Enable Email Alerts

Toggle

Enable SMS Alerts

Toggle

Enable Push Notifications

Toggle

# STOCK THRESHOLD SETTINGS

Default Threshold

Custom Threshold Per Product

# SCREEN 3A: ALERT DETAILS

## Goal

View specific inventory warning\.

# PRODUCT INFORMATION

# INVENTORY LEVELS

Current

Minimum

Difference

# RECOMMENDED ACTIONS

Add Stock

Contact Supplier

Future Ready

Adjust Threshold

# SCREEN 4: STOCK MOVEMENT LOG

## Goal

Maintain complete inventory audit trail\.

Every inventory action must be recorded\.

This becomes extremely important as businesses grow\.

# Header

Stock Movement Log

# LOG FILTERS

Today

This Week

This Month

Custom Range

# MOVEMENT TYPES

Stock Added

Stock Removed

Stock Sold

Stock Returned

Stock Adjusted

Stock Transferred

# SEARCH

Product Name

SKU

Reference Number

User Name

# MOVEMENT LOG LIST

Each Record Contains

Date

Time

Product Name

Action Type

Quantity Changed

Previous Quantity

New Quantity

User

Reference

# MOVEMENT DETAILS PAGE

## Goal

View complete audit record\.

Transaction ID

Product Name

Action Type

Quantity Before

Quantity After

Difference

Date &amp; Time

Performed By

Reason

Notes

Related Sale

Future Link

Related Order

Future Link

# EXPORT LOGS

PDF

Excel

CSV

# SCREEN 5: INVENTORY ANALYTICS

## Goal

Provide inventory intelligence\.

# Header

Inventory Analytics

# INVENTORY OVERVIEW

Total Stock

Inventory Value

Stock Turnover

Future Ready

# CHARTS

Stock Added Trend

Stock Removed Trend

Stock Adjustment Trend

Inventory Health Trend

# TOP MOVING PRODUCTS

Most Sold Products

Fastest Moving Products

# LOW PERFORMING PRODUCTS

Slow Moving Inventory

Dead Stock

Future Ready

# INVENTORY INSIGHTS

Examples

15 products are below minimum stock level\.

Inventory decreased by 8% this month\.

Most stock movements came from POS sales\.

# SCREEN 6: INVENTORY REPORTS

## Goal

Generate inventory reports\.

# REPORT TYPES

Current Stock Report

Low Stock Report

Out Of Stock Report

Stock Movement Report

Inventory Summary Report

# REPORT FILTERS

Date Range

Categories

Products

Stock Status

# EXPORT OPTIONS

PDF

Excel

CSV

Email Report

# AUTOMATION INTEGRATION

Inventory automatically updates when:

POS Sale Completed

Order Fulfilled

Manual Stock Added

Manual Stock Removed

Inventory Adjusted

Transfer Completed

# NOTIFICATIONS

Design notifications for:

Low Stock

Out Of Stock

Stock Added

Stock Removed

Inventory Adjustment Completed

Inventory Report Ready

# SUCCESS STATES

Stock Added

Stock Removed

Stock Adjusted

Inventory Updated

Report Generated

# ERROR STATES

Insufficient Stock

Adjustment Failed

Transfer Failed

Inventory Conflict

Network Error

# EMPTY STATES

No Inventory

No Stock Movements

No Alerts

No Reports

# LOADING STATES

Loading Inventory

Updating Stock

Generating Report

Syncing Inventory

# FUTURE READY COMPONENTS

Design architecture placeholders for:

Multi\-Location Inventory

Supplier Management

Purchase Orders

Inventory Forecasting

Barcode Printing

Warehouse Management

Stock Reservations

Automatic Reordering

# UX REQUIREMENTS

Generate every:

- Screen
- Sub\-screen
- Dashboard
- Stock Management Flows
- Add Stock Flow
- Remove Stock Flow
- Adjustment Flow
- Alert Center
- Movement Logs
- Analytics
- Reports
- Modals
- Drawers
- Confirmation Dialogs
- Success States
- Error States
- Empty States
- Loading States

Use:

- Mobile\-first layouts
- Modern inventory software patterns
- Large touch targets
- Clear stock visibility
- Consistent Vemtap branding
- Primary color \#066CF4
- Rounded cards
- Soft shadows
- Audit\-friendly design

# The Inventory module should function as a complete stock management and inventory control system that powers POS, Orders, Analytics, and future warehouse operations while remaining simple enough for small businesses to use daily\.

