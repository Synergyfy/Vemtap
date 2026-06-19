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
  { id: 'cat-drinks', name: 'Drinks', description: 'Beverages and refreshments', icon: '🥤', productCount: 4, color: 'bg-blue-500' },
  { id: 'cat-food', name: 'Food & Snacks', description: 'Packaged food and snacks', icon: '🍔', productCount: 4, color: 'bg-amber-500' },
  { id: 'cat-fashion', name: 'Fashion', description: 'Clothing and accessories', icon: '👕', productCount: 4, color: 'bg-purple-500' },
  { id: 'cat-electronics', name: 'Electronics', description: 'Gadgets and accessories', icon: '📱', productCount: 4, color: 'bg-cyan-500' },
  { id: 'cat-beauty', name: 'Beauty & Care', description: 'Skincare and beauty products', icon: '💄', productCount: 4, color: 'bg-pink-500' },
  { id: 'cat-pharmacy', name: 'Pharmacy', description: 'Health and wellness', icon: '💊', productCount: 4, color: 'bg-emerald-500' },
];

// ─── PRODUCTS ────────────────────────────────────────────────
export const SEED_PRODUCTS: SeedProduct[] = [
  // Drinks
  { id: 'p1', name: 'Coca-Cola 50cl', sku: 'DRK-001', barcode: 'VMT0001', category: 'Drinks', categoryId: 'cat-drinks', brand: 'Coca-Cola', sellingPrice: 350, costPrice: 250, quantity: 120, minStock: 20, status: 'active', description: 'Classic Coca-Cola 50cl bottle', tags: ['cold', 'beverage'] },
  { id: 'p2', name: 'Fanta Orange 50cl', sku: 'DRK-002', barcode: 'VMT0002', category: 'Drinks', categoryId: 'cat-drinks', brand: 'Fanta', sellingPrice: 350, costPrice: 250, quantity: 85, minStock: 20, status: 'active', description: 'Fanta Orange 50cl bottle', tags: ['cold', 'beverage'] },
  { id: 'p3', name: 'Hollandia Yoghurt 500ml', sku: 'DRK-003', barcode: 'VMT0003', category: 'Drinks', categoryId: 'cat-drinks', brand: 'Hollandia', sellingPrice: 800, costPrice: 600, quantity: 40, minStock: 15, status: 'active', description: 'Hollandia yoghurt drink 500ml', tags: ['dairy', 'yoghurt'] },
  { id: 'p4', name: 'Peak Milk 400g', sku: 'DRK-004', barcode: 'VMT0004', category: 'Drinks', categoryId: 'cat-drinks', brand: 'Peak', sellingPrice: 2800, costPrice: 2200, quantity: 5, minStock: 10, status: 'low_stock', description: 'Peak powdered milk tin 400g', tags: ['dairy', 'milk'] },

  // Food & Snacks
  { id: 'p5', name: 'Indomie Noodles (Carton)', sku: 'FD-001', barcode: 'VMT0005', category: 'Food & Snacks', categoryId: 'cat-food', brand: 'Indomie', sellingPrice: 5500, costPrice: 4800, quantity: 30, minStock: 5, status: 'active', description: 'Indomie instant noodles — 40 packs carton', tags: ['noodles', 'instant'] },
  { id: 'p6', name: 'Golden Penny Spaghetti 500g', sku: 'FD-002', barcode: 'VMT0006', category: 'Food & Snacks', categoryId: 'cat-food', brand: 'Golden Penny', sellingPrice: 800, costPrice: 600, quantity: 60, minStock: 10, status: 'active', description: 'Golden Penny spaghetti 500g pack', tags: ['pasta', 'spaghetti'] },
  { id: 'p7', name: 'Gala Sausage Roll', sku: 'FD-003', barcode: 'VMT0007', category: 'Food & Snacks', categoryId: 'cat-food', brand: 'UAC', sellingPrice: 300, costPrice: 220, quantity: 200, minStock: 30, status: 'active', description: 'Gala sausage roll', tags: ['snack', 'roll'] },
  { id: 'p8', name: 'Dangote Sugar 1kg', sku: 'FD-004', barcode: 'VMT0008', category: 'Food & Snacks', categoryId: 'cat-food', brand: 'Dangote', sellingPrice: 1500, costPrice: 1200, quantity: 0, minStock: 10, status: 'out_of_stock', description: 'Dangote granulated sugar 1kg', tags: ['sugar', 'seasoning'] },

  // Fashion
  { id: 'p9', name: 'Ankara Shirt (XL)', sku: 'FSH-001', barcode: 'VMT0009', category: 'Fashion', categoryId: 'cat-fashion', brand: 'VemWear', sellingPrice: 15000, costPrice: 8000, quantity: 20, minStock: 5, status: 'active', description: 'Premium Ankara print shirt — XL', variants: [{ type: 'Size', value: 'XL' }, { type: 'Color', value: 'Multicolor' }], tags: ['shirt', 'ankara'] },
  { id: 'p10', name: 'Black Chinos Trouser', sku: 'FSH-002', barcode: 'VMT0010', category: 'Fashion', categoryId: 'cat-fashion', brand: 'VemWear', sellingPrice: 12000, costPrice: 6500, quantity: 15, minStock: 5, status: 'active', description: 'Slim-fit black chinos trouser', variants: [{ type: 'Size', value: '32' }], tags: ['trouser', 'chinos'] },
  { id: 'p11', name: 'Leather Belt (Brown)', sku: 'FSH-003', barcode: 'VMT0011', category: 'Fashion', categoryId: 'cat-fashion', brand: 'VemWear', sellingPrice: 5000, costPrice: 2500, quantity: 30, minStock: 8, status: 'active', description: 'Genuine leather belt — brown', variants: [{ type: 'Color', value: 'Brown' }], tags: ['belt', 'leather'] },
  { id: 'p12', name: 'Canvas Sneakers', sku: 'FSH-004', barcode: 'VMT0012', category: 'Fashion', categoryId: 'cat-fashion', brand: 'VemWear', sellingPrice: 8500, costPrice: 4000, quantity: 3, minStock: 5, status: 'low_stock', description: 'Casual white canvas sneakers', variants: [{ type: 'Size', value: '42' }], tags: ['shoes', 'sneakers'] },

  // Electronics
  { id: 'p13', name: 'Type-C Charger Cable', sku: 'EL-001', barcode: 'VMT0013', category: 'Electronics', categoryId: 'cat-electronics', brand: 'Oraimo', sellingPrice: 3500, costPrice: 1800, quantity: 50, minStock: 10, status: 'active', description: 'Fast charging Type-C cable — 1m', tags: ['charger', 'cable'] },
  { id: 'p14', name: 'Bluetooth Earbuds', sku: 'EL-002', barcode: 'VMT0014', category: 'Electronics', categoryId: 'cat-electronics', brand: 'Oraimo', sellingPrice: 12000, costPrice: 7000, quantity: 25, minStock: 5, status: 'active', description: 'Wireless bluetooth earbuds with charging case', tags: ['audio', 'wireless'] },
  { id: 'p15', name: 'Power Bank 10000mAh', sku: 'EL-003', barcode: 'VMT0015', category: 'Electronics', categoryId: 'cat-electronics', brand: 'Oraimo', sellingPrice: 15000, costPrice: 9000, quantity: 18, minStock: 5, status: 'active', description: '10000mAh portable power bank — dual USB', tags: ['power', 'battery'] },
  { id: 'p16', name: 'Phone Screen Protector', sku: 'EL-004', barcode: 'VMT0016', category: 'Electronics', categoryId: 'cat-electronics', brand: 'Generic', sellingPrice: 1500, costPrice: 500, quantity: 100, minStock: 20, status: 'active', description: 'Tempered glass screen protector — universal', tags: ['protector', 'screen'] },

  // Beauty & Care
  { id: 'p17', name: 'Nivea Body Lotion 400ml', sku: 'BT-001', barcode: 'VMT0017', category: 'Beauty & Care', categoryId: 'cat-beauty', brand: 'Nivea', sellingPrice: 4500, costPrice: 3200, quantity: 35, minStock: 8, status: 'active', description: 'Nivea nourishing body lotion — 400ml', tags: ['skincare', 'lotion'] },
  { id: 'p18', name: 'Cantu Shea Butter Leave-In', sku: 'BT-002', barcode: 'VMT0018', category: 'Beauty & Care', categoryId: 'cat-beauty', brand: 'Cantu', sellingPrice: 6500, costPrice: 4000, quantity: 20, minStock: 5, status: 'active', description: 'Cantu shea butter leave-in conditioning repair cream', tags: ['hair', 'cream'] },
  { id: 'p19', name: 'MAC Lipstick Ruby Woo', sku: 'BT-003', barcode: 'VMT0019', category: 'Beauty & Care', categoryId: 'cat-beauty', brand: 'MAC', sellingPrice: 18000, costPrice: 12000, quantity: 8, minStock: 3, status: 'active', description: 'MAC matte lipstick — Ruby Woo', tags: ['makeup', 'lipstick'] },
  { id: 'p20', name: 'Dove Deodorant Spray', sku: 'BT-004', barcode: 'VMT0020', category: 'Beauty & Care', categoryId: 'cat-beauty', brand: 'Dove', sellingPrice: 2800, costPrice: 1800, quantity: 0, minStock: 10, status: 'out_of_stock', description: 'Dove invisible dry deodorant spray', tags: ['deodorant', 'spray'] },

  // Pharmacy
  { id: 'p21', name: 'Paracetamol (Pack of 96)', sku: 'PH-001', barcode: 'VMT0021', category: 'Pharmacy', categoryId: 'cat-pharmacy', brand: 'Emzor', sellingPrice: 1200, costPrice: 800, quantity: 45, minStock: 10, status: 'active', description: 'Emzor paracetamol 500mg — 96 tablets', tags: ['painkiller', 'tablet'] },
  { id: 'p22', name: 'Vitamin C 1000mg', sku: 'PH-002', barcode: 'VMT0022', category: 'Pharmacy', categoryId: 'cat-pharmacy', brand: 'Mason Natural', sellingPrice: 5500, costPrice: 3500, quantity: 22, minStock: 5, status: 'active', description: 'Vitamin C 1000mg — 60 capsules', tags: ['vitamin', 'supplement'] },
  { id: 'p23', name: 'Lonart Antimalarial', sku: 'PH-003', barcode: 'VMT0023', category: 'Pharmacy', categoryId: 'cat-pharmacy', brand: 'Bliss GVS', sellingPrice: 2500, costPrice: 1500, quantity: 7, minStock: 10, status: 'low_stock', description: 'Lonart artemether-lumefantrine antimalarial', tags: ['malaria', 'antimalarial'] },
  { id: 'p24', name: 'First Aid Kit', sku: 'PH-004', barcode: 'VMT0024', category: 'Pharmacy', categoryId: 'cat-pharmacy', brand: 'Generic', sellingPrice: 8000, costPrice: 4500, quantity: 12, minStock: 3, status: 'active', description: 'Complete first aid kit — 50 pieces', tags: ['first-aid', 'emergency'] },
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
