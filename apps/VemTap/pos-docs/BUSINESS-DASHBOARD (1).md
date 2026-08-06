# BUSINESS DASHBOARD

# MOBILE\-FIRST DESIGN

# PART 2 \(Orders, Customers, Suppliers, Purchases, Staff, Roles &amp; Permissions, Registers, Payments, Receipts\)

## Design Requirements

Design a modern mobile\-first business management application\.

Target users:

- Business Owners
- Store Managers
- Cashiers
- Inventory Officers
- Supervisors

Design Style:

- Mobile\-first
- Clean and modern
- Card\-based UI
- Large touch targets
- Step\-by\-step workflows
- Minimal typing
- Easy navigation
- Optimized for daily business operations

# MODULE 16: ORDERS

## SCREEN 110: ORDERS DASHBOARD

Purpose:<br>Order management overview\.

Summary Cards:

- Total Orders Today
- Pending Orders
- Processing Orders
- Ready Orders
- Completed Orders
- Cancelled Orders

Quick Actions:

- Create Order
- View Orders

Recent Orders Section

Order Status Overview

Visual Order Funnel:

Pending → Processing → Ready → Completed

## SCREEN 111: ORDERS LIST

Purpose:<br>Browse all orders\.

Search Bar

Filters:

- Pending
- Processing
- Ready
- Completed
- Cancelled

Order Cards:

- Order Number
- Customer Name
- Total Amount
- Order Date
- Status Badge

Actions:

- View Order
- Update Status

Floating Action Button:

- New Order

## SCREEN 112: ORDER DETAILS

Purpose:<br>Detailed order information\.

Sections:

### Order Information

- Order Number
- Order Date
- Order Status

### Customer Information

- Name
- Phone Number

### Ordered Products

- Product
- Quantity
- Price

### Payment Summary

- Subtotal
- Discount
- Total

Actions:

- Update Status
- Print Order
- Cancel Order

## SCREEN 113: CREATE ORDER

Purpose:<br>Create new customer order\.

Fields:

- Select Customer
- Add Products
- Quantity
- Notes

Summary Section

Buttons:

- Save Order
- Proceed To Processing

## SCREEN 114: PROCESSING ORDER

Purpose:<br>Manage active orders\.

Displays:

- Order Information
- Products
- Preparation Notes

Actions:

- Mark Ready
- Cancel Order

Progress Indicator

## SCREEN 115: READY ORDER

Purpose:<br>Order ready for pickup or delivery\.

Displays:

- Order Number
- Customer
- Pickup Instructions

Actions:

- Notify Customer
- Mark Completed

## SCREEN 116: COMPLETED ORDER

Purpose:<br>Finalized order\.

Displays:

- Completion Time
- Products
- Customer

Actions:

- View Receipt
- View Customer

## SCREEN 117: CANCELLED ORDER

Purpose:<br>Cancelled order details\.

Displays:

- Order Information
- Cancellation Reason
- Cancelled By

Actions:

- Duplicate Order
- View History

# MODULE 17: CUSTOMERS

## SCREEN 118: CUSTOMERS DASHBOARD

Purpose:<br>Customer overview\.

Summary Cards:

- Total Customers
- New Customers
- Returning Customers
- Top Customers

Quick Actions:

- Add Customer
- View Customers

Recent Customers

Customer Growth Chart

## SCREEN 119: CUSTOMER LIST

Purpose:<br>Browse customers\.

Search:

- Name
- Phone
- Email

Filters:

- New
- Returning
- Top Spenders

Customer Cards:

- Name
- Phone
- Total Purchases
- Last Visit

Actions:

- View Profile

Floating Action Button:

- Add Customer

## SCREEN 120: CUSTOMER PROFILE

Purpose:<br>Customer details\.

Sections:

### Customer Information

- Name
- Phone
- Email

### Customer Statistics

- Total Purchases
- Total Spend
- Last Purchase

Quick Actions:

- Edit Customer
- Create Sale

Tabs:

- Purchases
- Transactions
- Returns

## SCREEN 121: PURCHASE HISTORY

Purpose:<br>Customer purchase history\.

Purchase Cards:

- Purchase Date
- Amount
- Products Count

Actions:

- View Details

Filters:

- Date Range

## SCREEN 122: TRANSACTION HISTORY

Purpose:<br>Customer transaction records\.

Transaction Cards:

- Receipt Number
- Amount
- Payment Method

Actions:

- View Transaction

## SCREEN 123: RETURN HISTORY

Purpose:<br>Customer returns\.

Return Cards:

- Product
- Return Date
- Reason

Actions:

- View Return

## SCREEN 124: ADD CUSTOMER

Purpose:<br>Create customer profile\.

Fields:

- Full Name
- Phone Number
- Email
- Address
- Notes

Button:

- Save Customer

## SCREEN 125: EDIT CUSTOMER

Purpose:<br>Update customer information\.

Editable Fields:

- Personal Information
- Contact Details
- Notes

Actions:

- Save Changes

# MODULE 18: SUPPLIERS

## SCREEN 126: SUPPLIERS DASHBOARD

Purpose:<br>Supplier overview\.

Summary Cards:

- Total Suppliers
- Active Suppliers
- Recent Deliveries
- Purchase Orders

Quick Actions:

- Add Supplier
- Create Purchase Order

Recent Suppliers

## SCREEN 127: SUPPLIER LIST

Purpose:<br>Browse suppliers\.

Search Bar

Supplier Cards:

- Supplier Name
- Phone
- Products Supplied

Actions:

- View Profile

Floating Action Button:

- Add Supplier

## SCREEN 128: SUPPLIER PROFILE

Purpose:<br>Supplier details\.

Sections:

### Supplier Information

- Name
- Phone
- Email
- Address

### Statistics

- Purchase Orders
- Total Purchases

Tabs:

- Purchases
- Deliveries

Actions:

- Edit Supplier
- Create Purchase Order

## SCREEN 129: ADD SUPPLIER

Purpose:<br>Register supplier\.

Fields:

- Business Name
- Contact Person
- Phone
- Email
- Address
- Notes

Button:

- Save Supplier

## SCREEN 130: EDIT SUPPLIER

Purpose:<br>Update supplier details\.

Editable supplier information\.

Save Changes Button

# MODULE 19: PURCHASES

## SCREEN 131: PURCHASE DASHBOARD

Purpose:<br>Procurement overview\.

Summary Cards:

- Purchase Orders
- Pending Deliveries
- Completed Deliveries
- Purchase Value

Quick Actions:

- New Purchase Order

Recent Purchases

## SCREEN 132: PURCHASE ORDERS LIST

Purpose:<br>Browse purchase orders\.

Filters:

- Draft
- Pending
- Received
- Cancelled

Purchase Order Cards:

- PO Number
- Supplier
- Amount
- Status

Actions:

- View Details

## SCREEN 133: CREATE PURCHASE ORDER

Purpose:<br>Create procurement request\.

Fields:

- Supplier
- Products
- Quantity
- Cost

Summary Section

Actions:

- Save Draft
- Submit Order

## SCREEN 134: PURCHASE ORDER DETAILS

Purpose:<br>Detailed purchase order\.

Sections:

### Supplier

### Ordered Products

### Costs

### Status Timeline

Actions:

- Edit
- Cancel
- Receive Delivery

## SCREEN 135: RECEIVE PURCHASE ORDER

Purpose:<br>Record supplier delivery\.

Displays:

- Ordered Quantity
- Delivered Quantity

Actions:

- Confirm Delivery
- Update Inventory

## SCREEN 136: PURCHASE HISTORY

Purpose:<br>Historical procurement records\.

Cards:

- Supplier
- Amount
- Date

Filters:

- Supplier
- Date

# MODULE 20: STAFF

## SCREEN 137: STAFF DASHBOARD

Purpose:<br>Employee overview\.

Summary Cards:

- Total Staff
- Active Staff
- Cashiers
- Inventory Officers

Quick Actions:

- Add Staff

Recent Staff Activity

## SCREEN 138: STAFF DIRECTORY

Purpose:<br>Browse employees\.

Search Bar

Staff Cards:

- Photo
- Name
- Role
- Status

Actions:

- View Profile

Floating Action Button:

- Add Staff

## SCREEN 139: STAFF PROFILE

Purpose:<br>Employee details\.

Sections:

### Personal Information

### Role

### Assigned Branch

### Activity Summary

Actions:

- Edit Staff
- Deactivate Staff

## SCREEN 140: ADD STAFF

Purpose:<br>Create employee account\.

Fields:

- Full Name
- Phone
- Email
- Role
- Branch

Actions:

- Create Staff

## SCREEN 141: EDIT STAFF

Purpose:<br>Update employee details\.

Editable Fields

Save Changes Button

## SCREEN 142: DEACTIVATE STAFF

Purpose:<br>Disable staff access\.

Displays:

- Staff Name
- Role

Reason Field

Buttons:

- Confirm
- Cancel

# MODULE 21: ROLES &amp; PERMISSIONS

## SCREEN 143: ROLES LIST

Purpose:<br>Manage access roles\.

Role Cards:

- Owner
- Manager
- Cashier
- Inventory Officer

Actions:

- View Role
- Create Role

## SCREEN 144: CREATE ROLE

Purpose:<br>Create custom role\.

Fields:

- Role Name
- Description

Button:

- Continue To Permissions

## SCREEN 145: ROLE DETAILS

Purpose:<br>Role information\.

Displays:

- Role Name
- Description
- Users Assigned

Actions:

- Edit Role

## SCREEN 146: PERMISSIONS MATRIX

Purpose:<br>Assign permissions\.

Modules:

- POS
- Products
- Inventory
- Orders
- Customers
- Suppliers
- Purchases
- Reports
- Settings

Permissions:

- View
- Create
- Edit
- Delete
- Approve

Mobile\-friendly toggle matrix\.

# MODULE 22: REGISTERS

## SCREEN 147: REGISTER DASHBOARD

Purpose:<br>Cash register overview\.

Cards:

- Open Registers
- Closed Registers
- Cash Balance

Quick Actions:

- Open Register
- Close Register

## SCREEN 148: REGISTERS LIST

Purpose:<br>View all registers\.

Register Cards:

- Register Name
- Status
- Cashier

Actions:

- View Details

## SCREEN 149: OPEN REGISTER

Purpose:<br>Start cashier session\.

Fields:

- Opening Cash Amount
- Notes

Button:

- Open Register

## SCREEN 150: CLOSE REGISTER

Purpose:<br>End cashier session\.

Displays:

- Expected Cash
- Actual Cash

Fields:

- Closing Amount

Button:

- Close Register

## SCREEN 151: CASH RECONCILIATION

Purpose:<br>Compare expected and actual cash\.

Displays:

- Sales Total
- Cash Collected
- Variance

Actions:

- Approve
- Report Difference

## SCREEN 152: REGISTER HISTORY

Purpose:<br>Historical register sessions\.

Cards:

- Register
- Cashier
- Date
- Closing Balance

# MODULE 23: PAYMENTS

## SCREEN 153: PAYMENTS DASHBOARD

Purpose:<br>Payment overview\.

Summary Cards:

- Total Payments
- Cash Payments
- Transfer Payments
- Card Payments

Recent Payments List

## SCREEN 154: PAYMENT RECORDS

Purpose:<br>Browse payments\.

Filters:

- Payment Method
- Date

Payment Cards:

- Receipt Number
- Amount
- Method

Actions:

- View Details

## SCREEN 155: PAYMENT DETAILS

Purpose:<br>Payment information\.

Displays:

- Transaction
- Customer
- Amount
- Payment Method
- Payment Date

Actions:

- Print Receipt
- View Sale

# MODULE 24: RECEIPTS

## SCREEN 156: RECEIPT CENTER

Purpose:<br>Manage receipts\.

Search:

- Receipt Number
- Customer

Recent Receipts List

Actions:

- View Receipt
- Reprint
- Share

## SCREEN 157: RECEIPT DETAILS

Purpose:<br>View receipt\.

Displays:

### Business Information

### Products Purchased

### Totals

### Payment Information

Actions:

- Print
- Share
- Download

## SCREEN 158: RECEIPT REPRINT

Purpose:<br>Reprint receipt\.

Options:

- Bluetooth Printer
- Network Printer

Button:

- Print Receipt

## SCREEN 159: RECEIPT SHARING

Purpose:<br>Send receipt digitally\.

Options:

- WhatsApp
- SMS
- Email

Preview Section

Send Button

# MODULE 25: REPORTS

## SCREEN 160: REPORTS DASHBOARD

Purpose:<br>Central reporting hub\.

Summary Cards:

- Sales Reports
- Inventory Reports
- Product Reports
- Customer Reports
- Staff Reports

Quick Report Cards:

- Today's Sales
- Weekly Revenue
- Inventory Value
- Top Products

Recent Generated Reports

Quick Actions:

- Generate Report
- Export Report

Report Categories Grid

## SCREEN 161: SALES REPORTS

Purpose:<br>Sales performance reports\.

Metrics:

- Total Sales
- Total Revenue
- Number Of Transactions
- Average Order Value

Charts:

- Daily Sales Trend
- Weekly Sales Trend
- Monthly Sales Trend

Tables:

- Sales By Payment Method
- Sales By Branch
- Sales By Staff

Actions:

- Filter Report
- Export Report

## SCREEN 162: INVENTORY REPORTS

Purpose:<br>Inventory reporting\.

Metrics:

- Inventory Value
- Products In Stock
- Low Stock Products
- Out Of Stock Products

Reports:

- Stock Movement Report
- Inventory Valuation Report
- Low Stock Report
- Dead Stock Report

Charts:

- Inventory Growth Trend
- Stock Movement Trend

Actions:

- Filter
- Export

## SCREEN 163: PRODUCT REPORTS

Purpose:<br>Product performance reporting\.

Metrics:

- Best Selling Products
- Slow Moving Products
- Most Returned Products
- Highest Revenue Products

Charts:

- Product Sales Trend
- Product Revenue Trend

Tables:

- Product Rankings
- Product Performance Scores

Actions:

- Filter
- Export

## SCREEN 164: CUSTOMER REPORTS

Purpose:<br>Customer insights reports\.

Metrics:

- Total Customers
- New Customers
- Returning Customers
- Repeat Purchase Rate

Charts:

- Customer Growth
- Customer Spending Trend

Reports:

- Top Customers
- Customer Purchase Frequency
- Customer Lifetime Value

Actions:

- Filter
- Export

## SCREEN 165: STAFF REPORTS

Purpose:<br>Staff performance reporting\.

Metrics:

- Sales By Staff
- Transactions By Staff
- Refunds Processed
- Orders Processed

Charts:

- Staff Performance Comparison

Tables:

- Top Performing Staff
- Activity Summary

Actions:

- Filter
- Export

## SCREEN 166: REPORT FILTERS

Purpose:<br>Configure report criteria\.

Filter Options:

Date Range

- Today
- Yesterday
- Last 7 Days
- Last 30 Days
- Custom Range

Other Filters:

- Branch
- Staff
- Product
- Category
- Customer
- Payment Method

Buttons:

- Apply Filters
- Reset Filters

## SCREEN 167: EXPORT REPORT

Purpose:<br>Export generated reports\.

Formats:

- PDF
- Excel
- CSV

Export Settings:

- File Name
- Report Period
- Included Sections

Buttons:

- Download
- Share

# MODULE 26: ANALYTICS

## SCREEN 168: ANALYTICS DASHBOARD

Purpose:<br>Business intelligence overview\.

Summary Cards:

- Revenue
- Transactions
- Products Sold
- Customer Growth

Charts:

- Revenue Trend
- Sales Trend
- Inventory Trend
- Customer Trend

Analytics Categories:

- Sales Analytics
- Revenue Analytics
- Product Analytics
- Inventory Analytics
- Customer Analytics

## SCREEN 169: SALES ANALYTICS

Purpose:<br>Analyze sales behavior\.

Metrics:

- Total Transactions
- Average Order Value
- Peak Sales Hours
- Peak Sales Days

Charts:

- Sales By Hour
- Sales By Day
- Sales By Week

Insights Section:

Automated business insights\.

Examples:

- Best sales day
- Highest transaction period

## SCREEN 170: REVENUE ANALYTICS

Purpose:<br>Analyze business revenue\.

Metrics:

- Revenue Today
- Weekly Revenue
- Monthly Revenue
- Yearly Revenue

Charts:

- Revenue Trend
- Revenue Growth
- Revenue By Payment Method

Insights:

- Revenue Growth Rate
- Revenue Decline Alerts

## SCREEN 171: PRODUCT PERFORMANCE ANALYTICS

Purpose:<br>Analyze products\.

Metrics:

- Top Selling Products
- Low Performing Products
- Most Returned Products
- Most Profitable Products

Charts:

- Product Performance Ranking
- Revenue By Product

Insights:

- Fast Moving Products
- Slow Moving Products

## SCREEN 172: INVENTORY ANALYTICS

Purpose:<br>Inventory intelligence\.

Metrics:

- Inventory Value
- Stock Turnover Rate
- Dead Stock
- Reorder Recommendations

Charts:

- Inventory Growth
- Stock Consumption Trend

Insights:

- Reorder Alerts
- Overstock Warnings

## SCREEN 173: CUSTOMER ANALYTICS

Purpose:<br>Understand customer behavior\.

Metrics:

- Customer Growth
- Repeat Customers
- Average Customer Spend
- Customer Lifetime Value

Charts:

- Customer Retention
- Customer Spending Trend

Insights:

- Most Valuable Customers
- At\-Risk Customers

# MODULE 27: NOTIFICATIONS

## SCREEN 174: NOTIFICATION CENTER

Purpose:<br>Central business alerts center\.

Tabs:

- All
- Unread
- Inventory
- Sales
- Staff
- Orders

Notification Cards:

- Title
- Description
- Time
- Status

Examples:

- Low Stock Alert
- Product Out Of Stock
- New Order Received
- Refund Processed
- Staff Activity

Actions:

- Mark Read
- View Details

## SCREEN 175: NOTIFICATION DETAILS

Purpose:<br>Detailed notification view\.

Displays:

- Notification Title
- Description
- Related Record
- Timestamp

Actions:

- Open Related Record
- Mark Read
- Delete Notification

# MODULE 28: ACTIVITY LOGS

## SCREEN 176: ACTIVITY LOGS

Purpose:<br>Business audit trail\.

Filters:

- User
- Module
- Date

Activity Cards:

- User Name
- Action
- Module
- Time

Examples:

- Product Created
- Stock Added
- Sale Completed
- Refund Issued

Search Activity

## SCREEN 177: ACTIVITY DETAILS

Purpose:<br>Detailed audit information\.

Displays:

- User
- Action Performed
- Previous Value
- New Value
- Timestamp

Related Record Link

# MODULE 29: SETTINGS

## SCREEN 178: SETTINGS HOME

Purpose:<br>Settings navigation hub\.

Settings Categories:

- Business Information
- POS Settings
- Receipt Settings
- Inventory Settings
- Barcode Settings
- Tax Settings

Card\-Based Layout

## SCREEN 179: BUSINESS INFORMATION

Purpose:<br>Business profile management\.

Fields:

- Business Name
- Business Logo
- Phone Number
- Email
- Address
- Website

Actions:

- Save Changes

## SCREEN 180: POS SETTINGS

Purpose:<br>Configure POS behavior\.

Settings:

- Default Payment Method
- Allow Discounts
- Allow Negative Sales
- Hold Sales Enabled

Toggles

Save Button

## SCREEN 181: RECEIPT SETTINGS

Purpose:<br>Receipt customization\.

Fields:

- Logo Upload
- Receipt Header
- Receipt Footer

Options:

- Show Tax
- Show Cashier Name
- Show Customer Information

Receipt Preview

Save Button

## SCREEN 182: INVENTORY SETTINGS

Purpose:<br>Inventory controls\.

Settings:

- Low Stock Threshold
- Auto Reorder Alerts
- Negative Stock Rules

Toggles &amp; Inputs

Save Button

## SCREEN 183: BARCODE SETTINGS

Purpose:<br>Barcode preferences\.

Options:

- Barcode Format
- Label Size
- Label Layout

Preview Section

Save Button

## SCREEN 184: TAX SETTINGS

Purpose:<br>Tax management\.

Fields:

- Tax Name
- Tax Percentage

Options:

- Inclusive Tax
- Exclusive Tax

Save Button

# MODULE 30: HELP &amp; SUPPORT

## SCREEN 185: SUPPORT CENTER

Purpose:<br>Business support hub\.

Sections:

- Open Tickets
- Resolved Tickets
- Help Articles
- Contact Support

Quick Actions:

- Create Ticket

## SCREEN 186: CREATE SUPPORT TICKET

Purpose:<br>Submit issue\.

Fields:

- Subject
- Category
- Priority
- Description

Attachment Upload

Button:

- Submit Ticket

## SCREEN 187: TICKET DETAILS

Purpose:<br>View ticket\.

Displays:

- Ticket ID
- Status
- Category
- Priority
- Description

Actions:

- Reply
- Close Ticket

## SCREEN 188: TICKET CONVERSATION

Purpose:<br>Chat\-style support thread\.

Message Bubbles:

- Business Messages
- Support Messages

Attachment Support

Message Composer

## SCREEN 189: TICKET HISTORY

Purpose:<br>Past support requests\.

Ticket Cards:

- Subject
- Status
- Date

Filters:

- Open
- Closed
- Resolved

# GLOBAL MOBILE SCREENS

## SCREEN 190: GLOBAL SEARCH

Purpose:<br>Search entire system\.

Search Categories:

- Products
- Customers
- Orders
- Suppliers
- Transactions

Unified Search Results

## SCREEN 191: EMPTY STATES

Purpose:<br>No data screens\.

Examples:

- No Products
- No Customers
- No Orders
- No Sales

Illustration \+ CTA Button

## SCREEN 192: SUCCESS STATES

Purpose:<br>Successful actions\.

Examples:

- Product Created
- Sale Completed
- Stock Received

Success Icon

Primary Action Button

## SCREEN 193: ERROR STATES

Purpose:<br>Error handling\.

Examples:

- Network Error
- Save Failed
- Payment Failed

Retry Button

## SCREEN 194: DELETE CONFIRMATION

Purpose:<br>Confirm destructive actions\.

Displays:

- Item Name
- Warning Message

Buttons:

- Delete
- Cancel

## SCREEN 195: ARCHIVE CONFIRMATION

Purpose:<br>Archive records\.

Displays:

- Record Information
- Archive Impact

Buttons:

- Archive
- Cancel

## SCREEN 196: PERMISSION DENIED

Purpose:<br>Restricted access screen\.

Displays:

- Access Denied Message
- Required Permission

Button:

- Contact Admin

## SCREEN 197: OFFLINE MODE

Purpose:<br>No internet connection\.

Displays:

- Offline Status
- Pending Actions

Button:

- Retry Connection

## SCREEN 198: SYNC IN PROGRESS

Purpose:<br>Data synchronization\.

Displays:

- Sync Progress Indicator
- Items Being Synced

## SCREEN 199: SYNC SUCCESSFUL

Purpose:<br>Sync completed\.

Displays:

- Sync Complete Message
- Last Sync Time

Button:

- Continue

## SCREEN 200: SESSION EXPIRED

Purpose:<br>Authentication timeout\.

Displays:

- Session Expired Message

Buttons:

- Login Again
- Return To Home

