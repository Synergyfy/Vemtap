# Prompt for Google AI Stitch: Rebuild Customer Experience Page


**Objective:**
Design a `customer-experience` page to consolidate the User Experience, Unique Business Link, and QR Code management into ONE unified builder page called "Customer Experience". The business owner should feel like they are building one single flow, not managing separate pages.

Please rebuild the page exactly following these step-by-step requirements:

### 1. Top Section (Links & Actions)
At the top of the page, include a header section containing:
- **Business Link:** Display the URL (e.g., `vemtap.com/store/businessname`).
- **QR Code:** Display a thumbnail/view of the QR code beside the link.
- **Action Buttons:**
  - `Copy Link`
  - `Download QR`
  - `Preview Experience`
  - `Open on Phone` (Clicking this should show a QR code for testing or generate a temporary preview link for mobile).
- **Publish Flow Buttons:**
  - `Save Draft` (Saves without affecting live experience).
  - `Preview` (Shows full customer flow).
  - `Publish` (Makes changes live instantly).

### 2. Page Layout: Two-Column Split
Below the top section, split the page into two main columns:
- **LEFT SIDE:** Settings and arrangement builder.
- **RIGHT SIDE:** A sticky, live mobile preview frame.

### 3. Left Side: Settings & Drag-and-Drop Area
Create a drag-and-drop builder for the different experience sections. 

**Requirements for each section item:**
- Must be draggable to reorder.
- Must have an Enable/Disable toggle.
- Must have an Edit button to configure its specific settings.

**List of draggable sections to include:**
- Visitor Form
- Products
- Services
- Forms
- WhatsApp Button
- Website Link
- Social Links
- Booking
- PDF/Menu
- Loyalty
- Coupons
- Other Features

**Specific Configuration for "Visitor Form":**
When editing the Visitor Form, allow the user to configure:
- Turn form ON or OFF.
- Edit "Welcome Text".
- Edit "Success Message" (e.g., "Thank you for visiting us").
- Settings to require the form (must fill first) or allow skipping.
- **Form Fields Management:** Display default fields (Name, Phone Number, Email) and allow adding optional custom fields.

### 4. Right Side: Live Mobile Preview
The right side must contain a phone mockup that instantly updates as changes are made on the left side (toggles, reordering, text edits).

**The preview must simulate the real customer flow:**
1. **Opening Screen:** Show optional logo and welcome message.
2. **Visitor Form Popup:** Show the form exactly how it will appear to customers.
3. **Success Message:** Show the post-submission screen.
4. **Main Experience:** Display the enabled modules (Products, WhatsApp, Booking, etc.) in the exact order arranged by the drag-and-drop list on the left side.

### 5. Design & UX Guidelines
- **Unified Experience:** Ensure the UI communicates that the QR code, link, and experience are all the same thing.
- **Immediate Feedback:** Dragging an item on the left must instantly swap its position in the mobile preview on the right.
- **Aesthetic:** Clean, simple, visual, fast, and mobile-first. Modern styling with clear visual hierarchy.

Please provide the complete, ui flow
