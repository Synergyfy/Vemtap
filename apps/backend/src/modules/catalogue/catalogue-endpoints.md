# Catalogue & QR Ordering Endpoints

This document outlines the API endpoints for the Vemtap Catalogue and QR Ordering system, following the lifecycle of a business setting up its menu and a customer placing an order.

---

## 🏗️ Phase 1: Business Setup (Admin)

### 1. Create a Category
**Endpoint:** `POST /api/v1/catalogue/categories`  
**Description:** Organize products into groups like "Appetizers", "Main Course", or "Drinks".
- **Payload:** `{ "name": "Appetizers" }`
- **Auth:** Required (Admin/Owner)

### 2. Add an Item to a Branch
**Endpoint:** `POST /api/v1/catalogue/items`  
**Description:** Create a product and link it to a specific branch.
- **Payload:**
  ```json
  {
    "name": "Classic Burger",
    "price": 12.99,
    "shortDescription": "Juicy beef patty with cheese",
    "categoryId": "uuid-of-category",
    "branchId": "uuid-of-branch",
    "stockQuantity": 50,
    "allowBackOrder": false
  }
  ```
- **Auth:** Required (Admin/Owner)

### 3. Share/Import Item to Another Branch
**Endpoint:** `POST /api/v1/catalogue/items/:id/import/:branchId`  
**Description:** If a business has multiple branches, they can "import" an existing product into another branch without recreating it.
- **Auth:** Required (Admin/Owner)

### 4. Branch-Specific Customization (The "Clone" Magic)
**Endpoint:** `PATCH /api/v1/catalogue/items/:id`  
**Description:** If you edit an item for a specific branch (`applyGlobally: false`), the system automatically **clones** it. This ensures that changing the price in "Lagos Branch" doesn't affect "Abuja Branch".
- **Payload:** `{ "price": 15.00, "branchId": "uuid-of-lagos", "applyGlobally": false }`
- **Auth:** Required (Admin/Owner)

---

## 📱 Phase 2: Customer Browsing (Public)

### 1. View Categories
**Endpoint:** `GET /api/v1/public/catalogue/categories/business/:businessId`  
**Description:** Customer scans a QR code and sees all available categories for that business.

### 2. Browse Branch Menu
**Endpoint:** `GET /api/v1/public/catalogue/items/branch/:branchId`  
**Description:** List all active items for a specific branch with search and filtering.
- **Query Params:** `?search=Burger&categoryId=uuid`

### 3. Item Details
**Endpoint:** `GET /api/v1/public/catalogue/items/:id?branchId=:branchId`  
**Description:** Get detailed information about a product, specific to the branch context.

---

## 🛒 Phase 3: Ordering Flow

### 1. Place an Order
**Endpoint:** `POST /api/v1/catalogue/orders`  
**Description:** Customer submits their selection. The system automatically creates a customer profile (if new) or links to an existing one via phone number.
- **Payload:**
  ```json
  {
    "firstName": "Azeem",
    "lastName": "Orderer",
    "phone": "+23480...",
    "branchId": "uuid",
    "tableNumber": "Table 12",
    "items": [
      { "itemId": "uuid", "quantity": 1 }
    ]
  }
  ```

---

## 👨‍🍳 Phase 4: Order Fulfillment (Admin)

### 1. List Recent Orders
**Endpoint:** `GET /api/v1/catalogue/orders?branchId=:branchId`  
**Description:** Staff views incoming orders for their branch.

### 2. Process Order
**Endpoint:** `PATCH /api/v1/catalogue/orders/:id/status`  
**Description:** Update order status as it moves from kitchen to table.
- **Payload:** `{ "status": "processing" }` (or `completed`, `cancelled`)
- **Auth:** Required (Admin/Staff)
