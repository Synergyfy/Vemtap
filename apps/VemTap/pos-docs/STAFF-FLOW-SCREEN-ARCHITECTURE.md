# STAFF FLOW SCREEN ARCHITECTURE

## SHARED MODULES \(Reuse Existing Business Screens\)

### Dashboard

Reuse:

- Dashboard Home
- Notifications Summary
- Recent Activities

### POS

Reuse:

- POS Home
- Product Search
- Product Categories
- Barcode Scan
- Quick Product Grid
- Cart
- Checkout
- Payment Screens
- Receipt Screens
- Held Sales
- Cancelled Sales

### Orders

Reuse:

- Orders Dashboard
- Orders List
- Order Details
- Processing Order
- Ready Order
- Completed Order
- Cancelled Order

### Customers

Reuse:

- Customer List
- Customer Profile
- Purchase History
- Transaction History
- Add Customer
- Edit Customer

### Products

Reuse:

- Products List
- Product Details

Permission controlled:

Some staff can:

- Add Product
- Edit Product

Others cannot\.

### Inventory

Reuse:

- Inventory Dashboard
- Inventory List
- Inventory Item Details
- Inventory Movement History
- Low Stock
- Out Of Stock

### Stock Receiving

Reuse:

- Receive Stock Flow

### Stock Adjustments

Reuse:

- Adjustment Flow

### Stock Transfers

Reuse:

- Transfer Flow

### Stock Counting

Reuse:

- Stock Count Flow

### Sales

Reuse:

- Sales Dashboard
- Transaction List
- Transaction Details

### Returns

Reuse:

- Return Flow

### Refunds

Reuse:

- Refund Flow

### Payments

Reuse:

- Payments Dashboard
- Payment Records
- Payment Details

### Receipts

Reuse:

- Receipt Center
- Receipt Details
- Reprint
- Share

### Notifications

Reuse:

- Notification Center
- Notification Details

### Global Search

Reuse:

- Global Search

# STAFF\-ONLY SCREENS

These are the screens that should exist only for staff\.

# MODULE 1: STAFF DASHBOARD

### Screen 1

Staff Home Dashboard

Shows:

- My Sales Today
- My Orders Today
- My Tasks
- Notifications
- Recent Activities

Quick Actions:

- New Sale
- View Tasks
- View Orders

### Screen 2

My Performance Summary

Shows:

- Transactions Processed
- Sales Value
- Orders Handled
- Inventory Activities

# MODULE 2: MY TASKS

### Screen 3

Tasks Dashboard

Shows:

- Assigned Tasks
- Pending Tasks
- Completed Tasks

### Screen 4

Task List

Filters:

- Pending
- In Progress
- Completed

### Screen 5

Task Details

Shows:

- Task Title
- Task Description
- Assigned By
- Due Date

Actions:

- Start Task
- Mark Complete

### Screen 6

Task Completion Confirmation

Success screen\.

### Screen 7

Completed Tasks History

Shows completed work\.

# MODULE 3: MY ACTIVITY

### Screen 8

My Activity Dashboard

Shows:

- Sales Activities
- Inventory Activities
- Order Activities

### Screen 9

My Activity Timeline

Chronological timeline\.

### Screen 10

Activity Details

Detailed activity record\.

# MODULE 4: REGISTER OPERATIONS

### Screen 11

Register Dashboard

Shows:

- Register Status
- Opening Balance
- Current Sales

### Screen 12

Open Register

Fields:

- Opening Cash
- Notes

### Screen 13

Register Open Success

### Screen 14

Close Register

Shows:

- Expected Cash
- Actual Cash

### Screen 15

Cash Reconciliation

Variance comparison\.

### Screen 16

Close Register Success

### Screen 17

My Register History

Previous sessions\.

# MODULE 5: PROFILE

### Screen 18

My Profile

Shows:

- Name
- Role
- Branch
- Contact Details

### Screen 19

Edit Profile

Editable information\.

### Screen 20

Change Password

Fields:

- Current Password
- New Password
- Confirm Password

### Screen 21

Profile Security

Shows:

- Last Login
- Device Sessions

# MODULE 6: SUPPORT

### Screen 22

Support Center

### Screen 23

Create Ticket

### Screen 24

Ticket Details

### Screen 25

Ticket Conversation

### Screen 26

Ticket History

# MODULE 7: SETTINGS

### Screen 27

Settings Home

### Screen 28

Notification Preferences

Options:

- Sales Alerts
- Order Alerts
- Inventory Alerts

### Screen 29

Theme Preferences

Options:

- Light Mode
- Dark Mode
- System Default

### Screen 30

Language Preferences

# MODULE 8: OFFLINE OPERATIONS

### Screen 31

Offline Dashboard

Shows:

- Pending Transactions
- Pending Orders
- Pending Inventory Actions

### Screen 32

Pending Sync Queue

List of unsynced records\.

### Screen 33

Sync Details

Shows:

- Records Waiting
- Upload Status

### Screen 34

Sync Successful

### Screen 35

Sync Failed

Retry options\.

# MODULE 9: SESSION MANAGEMENT

### Screen 36

Session Expired

### Screen 37

Permission Denied

### Screen 38

Account Suspended

### Screen 39

Force Logout Notice

# MODULE 10: UNIVERSAL SYSTEM SCREENS

### Screen 40

Success State

### Screen 41

Error State

### Screen 42

Delete Confirmation

### Screen 43

No Data / Empty State

### Screen 44

Loading State

### Screen 45

Network Error

# FINAL STAFF APP STRUCTURE

### Shared Screens From Business App

Approximately:

- 150\+ screens reused

### Staff\-Only Screens

Approximately:

- 45 dedicated screens

### Total Accessible Screens For Staff

Approximately:

- 195 screens available through permissions

### Total New Screens To Design For Staff

Only:

- 45 screens

# This is how most mature POS systems are built\. Cashiers, inventory officers, and managers use the same core screens, while permissions determine what they can see and do\. Building entirely separate POS, inventory, customer, and sales interfaces for staff would create duplicate maintenance work without adding value\.

