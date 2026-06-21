// VemTap POS Seed Data — Nigerian business context
// Products, Categories, Transactions, Customers, Suppliers

export interface SeedProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  categoryId: string;
  brand: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  minStock: number;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'archived';
  image?: string;
  description: string;
  variants?: { type: string; value: string }[];
  tags: string[];
}

export interface SeedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  productCount: number;
  color: string;
}

export interface SeedTransaction {
  id: string;
  receiptNumber: string;
  items: { productId: string; productName: string; quantity: number; price: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'split';
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  status: 'completed' | 'refunded' | 'partial_refund';
  createdAt: string;
}

export interface SeedCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
  totalVisits: number;
  lastVisit: string;
  notes: string;
}

export interface SeedSupplier {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: string[];
  totalOrders: number;
}

// ─── CATEGORIES ──────────────────────────────────────────────
export const SEED_CATEGORIES: SeedCategory[] = [
  { id: 'cat-fastfood', name: 'Fast Food', description: 'Burgers and wraps', icon: '🍔', productCount: 3, color: 'bg-amber-500' },
  { id: 'cat-drinks', name: 'Beverages', description: 'Cold and hot drinks', icon: '🥤', productCount: 3, color: 'bg-blue-500' },
  { id: 'cat-desserts', name: 'Desserts', description: 'Sweet treats', icon: '🍰', productCount: 3, color: 'bg-pink-500' },
];

// ─── PRODUCTS ────────────────────────────────────────────────
export const SEED_PRODUCTS: SeedProduct[] = [
  // Fast Food
  { id: 'p1', name: 'Classic Beef Burger', sku: 'FF-001', barcode: 'VMT0001', category: 'Fast Food', categoryId: 'cat-fastfood', brand: 'House Made', sellingPrice: 4500, costPrice: 2500, quantity: 50, minStock: 10, status: 'active', description: 'Classic beef patty with cheese', tags: ['burger', 'beef'] },
  { id: 'p2', name: 'Chicken Wrap', sku: 'FF-002', barcode: 'VMT0002', category: 'Fast Food', categoryId: 'cat-fastfood', brand: 'House Made', sellingPrice: 3500, costPrice: 1800, quantity: 45, minStock: 10, status: 'active', description: 'Grilled chicken wrap', tags: ['wrap', 'chicken'] },
  { id: 'p3', name: 'Large French Fries', sku: 'FF-003', barcode: 'VMT0003', category: 'Fast Food', categoryId: 'cat-fastfood', brand: 'House Made', sellingPrice: 2000, costPrice: 800, quantity: 100, minStock: 20, status: 'active', description: 'Crispy salted french fries', tags: ['sides', 'fries'] },

  // Beverages
  { id: 'p4', name: 'Coca-Cola 50cl', sku: 'BV-001', barcode: 'VMT0004', category: 'Beverages', categoryId: 'cat-drinks', brand: 'Coca-Cola', sellingPrice: 800, costPrice: 500, quantity: 120, minStock: 20, status: 'active', description: 'Chilled Coca-Cola', tags: ['soda', 'cold'] },
  { id: 'p5', name: 'Iced Lemon Tea', sku: 'BV-002', barcode: 'VMT0005', category: 'Beverages', categoryId: 'cat-drinks', brand: 'House Made', sellingPrice: 1500, costPrice: 600, quantity: 60, minStock: 15, status: 'active', description: 'Freshly brewed iced lemon tea', tags: ['tea', 'cold'] },
  { id: 'p6', name: 'Bottled Water 75cl', sku: 'BV-003', barcode: 'VMT0006', category: 'Beverages', categoryId: 'cat-drinks', brand: 'Eva', sellingPrice: 300, costPrice: 150, quantity: 200, minStock: 50, status: 'active', description: 'Chilled table water', tags: ['water', 'cold'] },

  // Desserts
  { id: 'p7', name: 'Chocolate Fudge Cake', sku: 'DS-001', barcode: 'VMT0007', category: 'Desserts', categoryId: 'cat-desserts', brand: 'House Made', sellingPrice: 3000, costPrice: 1200, quantity: 20, minStock: 5, status: 'active', description: 'Rich chocolate cake slice', tags: ['cake', 'chocolate'] },
  { id: 'p8', name: 'Vanilla Ice Cream', sku: 'DS-002', barcode: 'VMT0008', category: 'Desserts', categoryId: 'cat-desserts', brand: 'House Made', sellingPrice: 2500, costPrice: 1000, quantity: 30, minStock: 10, status: 'active', description: 'Two scoops of vanilla ice cream', tags: ['ice-cream', 'vanilla'] },
  { id: 'p9', name: 'Warm Apple Pie', sku: 'DS-003', barcode: 'VMT0009', category: 'Desserts', categoryId: 'cat-desserts', brand: 'House Made', sellingPrice: 2800, costPrice: 1100, quantity: 15, minStock: 5, status: 'active', description: 'Freshly baked apple pie', tags: ['pie', 'apple'] },
];

// ─── TRANSACTIONS ────────────────────────────────────────────
const now = new Date();
const h = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

export const SEED_TRANSACTIONS: SeedTransaction[] = [
  {
    id: 'txn-001', receiptNumber: 'RCT-20260619-001',
    items: [
      { productId: 'p1', productName: 'Coca-Cola 50cl', quantity: 3, price: 350, subtotal: 1050 },
      { productId: 'p7', productName: 'Gala Sausage Roll', quantity: 2, price: 300, subtotal: 600 },
    ],
    subtotal: 1650, discount: 0, tax: 0, total: 1650,
    paymentMethod: 'cash', customerId: 'cust-001', customerName: 'Chioma Okafor',
    cashierId: 'staff-001', cashierName: 'Adewale', status: 'completed', createdAt: h(0.5),
  },
  {
    id: 'txn-002', receiptNumber: 'RCT-20260619-002',
    items: [
      { productId: 'p9', productName: 'Ankara Shirt (XL)', quantity: 1, price: 15000, subtotal: 15000 },
      { productId: 'p11', productName: 'Leather Belt (Brown)', quantity: 1, price: 5000, subtotal: 5000 },
    ],
    subtotal: 20000, discount: 2000, tax: 0, total: 18000,
    paymentMethod: 'transfer', customerId: 'cust-002', customerName: 'Oluwaseun Adeyemi',
    cashierId: 'staff-001', cashierName: 'Adewale', status: 'completed', createdAt: h(1),
  },
  {
    id: 'txn-003', receiptNumber: 'RCT-20260619-003',
    items: [
      { productId: 'p14', productName: 'Bluetooth Earbuds', quantity: 1, price: 12000, subtotal: 12000 },
      { productId: 'p13', productName: 'Type-C Charger Cable', quantity: 2, price: 3500, subtotal: 7000 },
    ],
    subtotal: 19000, discount: 0, tax: 0, total: 19000,
    paymentMethod: 'card', customerId: 'cust-003', customerName: 'Emeka Nwankwo',
    cashierId: 'staff-002', cashierName: 'Blessing', status: 'completed', createdAt: h(2),
  },
  {
    id: 'txn-004', receiptNumber: 'RCT-20260619-004',
    items: [
      { productId: 'p17', productName: 'Nivea Body Lotion 400ml', quantity: 2, price: 4500, subtotal: 9000 },
      { productId: 'p18', productName: 'Cantu Shea Butter Leave-In', quantity: 1, price: 6500, subtotal: 6500 },
      { productId: 'p19', productName: 'MAC Lipstick Ruby Woo', quantity: 1, price: 18000, subtotal: 18000 },
    ],
    subtotal: 33500, discount: 3350, tax: 0, total: 30150,
    paymentMethod: 'split', customerId: 'cust-004', customerName: 'Ngozi Eze',
    cashierId: 'staff-001', cashierName: 'Adewale', status: 'completed', createdAt: h(3),
  },
  {
    id: 'txn-005', receiptNumber: 'RCT-20260619-005',
    items: [
      { productId: 'p21', productName: 'Paracetamol (Pack of 96)', quantity: 3, price: 1200, subtotal: 3600 },
      { productId: 'p22', productName: 'Vitamin C 1000mg', quantity: 1, price: 5500, subtotal: 5500 },
    ],
    subtotal: 9100, discount: 0, tax: 0, total: 9100,
    paymentMethod: 'cash', cashierId: 'staff-002', cashierName: 'Blessing', status: 'completed', createdAt: h(4),
  },
  {
    id: 'txn-006', receiptNumber: 'RCT-20260618-001',
    items: [
      { productId: 'p5', productName: 'Indomie Noodles (Carton)', quantity: 2, price: 5500, subtotal: 11000 },
      { productId: 'p6', productName: 'Golden Penny Spaghetti 500g', quantity: 5, price: 800, subtotal: 4000 },
    ],
    subtotal: 15000, discount: 0, tax: 0, total: 15000,
    paymentMethod: 'transfer', customerId: 'cust-005', customerName: 'Fatima Bello',
    cashierId: 'staff-001', cashierName: 'Adewale', status: 'completed', createdAt: h(20),
  },
  {
    id: 'txn-007', receiptNumber: 'RCT-20260618-002',
    items: [
      { productId: 'p15', productName: 'Power Bank 10000mAh', quantity: 1, price: 15000, subtotal: 15000 },
    ],
    subtotal: 15000, discount: 1500, tax: 0, total: 13500,
    paymentMethod: 'cash', customerId: 'cust-003', customerName: 'Emeka Nwankwo',
    cashierId: 'staff-002', cashierName: 'Blessing', status: 'completed', createdAt: h(22),
  },
  {
    id: 'txn-008', receiptNumber: 'RCT-20260618-003',
    items: [
      { productId: 'p10', productName: 'Black Chinos Trouser', quantity: 2, price: 12000, subtotal: 24000 },
      { productId: 'p9', productName: 'Ankara Shirt (XL)', quantity: 1, price: 15000, subtotal: 15000 },
    ],
    subtotal: 39000, discount: 5000, tax: 0, total: 34000,
    paymentMethod: 'card', customerId: 'cust-002', customerName: 'Oluwaseun Adeyemi',
    cashierId: 'staff-001', cashierName: 'Adewale', status: 'completed', createdAt: h(24),
  },
];

// ─── CUSTOMERS ───────────────────────────────────────────────
export const SEED_CUSTOMERS: SeedCustomer[] = [
  { id: 'cust-001', name: 'Chioma Okafor', phone: '08012345678', email: 'chioma@email.com', totalSpent: 45200, totalVisits: 12, lastVisit: h(0.5), notes: 'Prefers cash payments' },
  { id: 'cust-002', name: 'Oluwaseun Adeyemi', phone: '08023456789', email: 'seun.adeyemi@email.com', totalSpent: 152000, totalVisits: 28, lastVisit: h(1), notes: 'VIP customer — fashion buyer' },
  { id: 'cust-003', name: 'Emeka Nwankwo', phone: '08034567890', email: 'emeka.n@email.com', totalSpent: 89500, totalVisits: 15, lastVisit: h(2), notes: 'Tech enthusiast' },
  { id: 'cust-004', name: 'Ngozi Eze', phone: '08045678901', email: 'ngozi.eze@email.com', totalSpent: 120800, totalVisits: 20, lastVisit: h(3), notes: 'Beauty products — bulk buyer' },
  { id: 'cust-005', name: 'Fatima Bello', phone: '08056789012', email: 'fatima.b@email.com', totalSpent: 35000, totalVisits: 8, lastVisit: h(20), notes: 'Grocery shopper' },
];

// ─── SUPPLIERS ───────────────────────────────────────────────
export const SEED_SUPPLIERS: SeedSupplier[] = [
  { id: 'sup-001', businessName: 'Lagos Wholesale Hub', contactPerson: 'Mr. Adekunle', phone: '08098765432', email: 'sales@lagoswholesale.ng', address: 'Trade Fair Complex, Lagos', productsSupplied: ['Drinks', 'Food & Snacks'], totalOrders: 45 },
  { id: 'sup-002', businessName: 'Oraimo Nigeria', contactPerson: 'Sandra Obi', phone: '08087654321', email: 'b2b@oraimo.ng', address: 'Computer Village, Ikeja', productsSupplied: ['Electronics'], totalOrders: 12 },
  { id: 'sup-003', businessName: 'Eleganza Beauty Dist.', contactPerson: 'Mrs. Funke', phone: '08076543210', email: 'orders@eleganza.ng', address: 'Mushin, Lagos', productsSupplied: ['Beauty & Care', 'Pharmacy'], totalOrders: 22 },
];

// ─── HELPERS ─────────────────────────────────────────────────
export const getProductById = (id: string) => SEED_PRODUCTS.find(p => p.id === id);
export const getProductsByCategory = (categoryId: string) => SEED_PRODUCTS.filter(p => p.categoryId === categoryId);
export const getLowStockProducts = () => SEED_PRODUCTS.filter(p => p.status === 'low_stock');
export const getOutOfStockProducts = () => SEED_PRODUCTS.filter(p => p.status === 'out_of_stock');
export const getActiveProducts = () => SEED_PRODUCTS.filter(p => p.status !== 'archived');
export const getTotalInventoryValue = () => SEED_PRODUCTS.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0);
export const getTotalRetailValue = () => SEED_PRODUCTS.reduce((acc, p) => acc + (p.sellingPrice * p.quantity), 0);
export const getTodaysSales = () => {
  const today = new Date().toDateString();
  return SEED_TRANSACTIONS.filter(t => new Date(t.createdAt).toDateString() === today);
};
export const getTodaysRevenue = () => getTodaysSales().reduce((acc, t) => acc + t.total, 0);

export const generateReceiptNumber = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `RCT-${dateStr}-${seq}`;
};

export const generateBarcode = () => {
  return `VMT${String(Math.floor(Math.random() * 99999) + 10000)}`;
};
