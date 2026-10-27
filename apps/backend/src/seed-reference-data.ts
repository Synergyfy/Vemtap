/**
 * Seeds the reference data a new business needs, through the real API:
 *
 *   1. an admin account (POST /auth/register/admin with ADMIN_ACCOUNT_CODE),
 *   2. as that admin: business categories + subcategories, subscription plans
 *      (with permissions, so paid plans are purchasable), credit plans,
 *      add-ons and deal category types,
 *   3. one demo business (owner signs up with a PIN like any business) with
 *      catalogue categories, products, a service and live deals.
 *
 * Idempotent: anything that already exists (matched by name / email) is
 * skipped. Secrets are written to `.seed-credentials.local` (git-ignored,
 * mode 600) and never printed.
 *
 *   DEMO_OWNER_EMAIL=you@example.com npm run seed:reference
 *
 * Needs the API running (`npm run start:dev`); SEED_API_URL overrides
 * http://localhost:3002/api/v1. The database is read only for the demo
 * owner's emailed sign-up code.
 */
import { randomBytes, randomInt } from 'crypto';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

const API = (
  process.env.SEED_API_URL || 'http://localhost:3002/api/v1'
).replace(/\/+$/, '');
const CREDENTIALS_FILE = join(__dirname, '..', '.seed-credentials.local');
const ADMIN_EMAIL = (
  process.env.SEED_ADMIN_EMAIL || 'admin@vemtap.com'
).toLowerCase();
const DEMO_OWNER_EMAIL = (
  process.env.DEMO_OWNER_EMAIL || 'demo-owner@vemtap.test'
).toLowerCase();

type Json = Record<string, any>;
interface Credentials {
  admin?: { email: string; password: string };
  demoOwner?: { email: string; pin: string };
}

const summary: Array<[string, string, string]> = [];
const note = (
  section: string,
  name: string,
  result: 'created' | 'exists' | 'updated' | 'skipped',
) => summary.push([section, name, result]);

// ------------------------------------------------------------------ helpers

async function api<T = any>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload: any = text;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    // non-JSON body
  }
  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join('; ')
      : payload?.message || text;
    const error = new Error(
      `${method} ${path} → ${response.status}: ${message}`,
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  // Unwrap the common `{ success, data }` envelope.
  return (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    !Array.isArray(payload) &&
    Object.keys(payload).length <= 4
      ? payload.data
      : payload
  ) as T;
}

/** A list from any of the response shapes the API uses. */
const rows = (value: any): Json[] => {
  if (Array.isArray(value)) return value;
  for (const key of ['data', 'items', 'results', 'rows']) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
};

const byName = (list: Json[], name: string) =>
  list.find(
    (row) =>
      String(row.name ?? '')
        .trim()
        .toLowerCase() === name.trim().toLowerCase(),
  );

const tokenOf = (auth: Json) =>
  auth?.access_token ??
  auth?.accessToken ??
  auth?.token ??
  auth?.data?.access_token;

function strongPassword() {
  // IsStrongPassword: 8+ with upper, lower, digit and symbol.
  return `Vt#${randomBytes(12).toString('base64url')}9a!`;
}

const sixDigitPin = () => String(randomInt(100000, 1000000));

function readCredentials(): Credentials {
  if (!existsSync(CREDENTIALS_FILE)) return {};
  return JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8')) as Credentials;
}

function saveCredentials(credentials: Credentials) {
  writeFileSync(CREDENTIALS_FILE, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  });
  chmodSync(CREDENTIALS_FILE, 0o600);
}

async function login(identifier: string, password: string) {
  const auth = await api<Json>('POST', '/auth/login', { identifier, password });
  const token = tokenOf(auth);
  if (!token) throw new Error(`Login for ${identifier} returned no token`);
  return token as string;
}

// ------------------------------------------------------------------ data

const BUSINESS_CATEGORIES: Array<{
  name: string;
  description: string;
  subcategories: string[];
}> = [
  {
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, bars, and other food services',
    subcategories: [
      'Restaurant',
      'Cafe',
      'Bar',
      'Night Club',
      'Bakery',
      'Fast Food',
    ],
  },
  {
    name: 'Retail',
    description: 'Physical stores selling consumer goods',
    subcategories: [
      'Grocery Store',
      'Clothing Store',
      'Electronics',
      'Pharmacy',
      'Supermarket',
    ],
  },
  {
    name: 'Services',
    description: 'Professional and personal service providers',
    subcategories: [
      'Salon',
      'Spa',
      'Barbershop',
      'Laundry',
      'Professional Services',
    ],
  },
  {
    name: 'Hospitality',
    description: 'Accommodation, travel and event services',
    subcategories: ['Hotel', 'Guest House', 'Event Centre'],
  },
  {
    name: 'Health & Fitness',
    description: 'Gyms, clinics and wellness providers',
    subcategories: ['Gym', 'Clinic'],
  },
];

/** -1 means "no limit", as in src/seed.ts. */
const UNLIMITED = -1;

const PLANS: Array<{ plan: Json; permissions: Json }> = [
  {
    plan: {
      name: 'Starter (Free)',
      monthlyPrice: 0,
      currency: 'NGN',
      isFree: true,
      features: [
        'Basic QR Scanning',
        '1 Branch',
        '50 Customers',
        'Basic Analytics',
      ],
      description: 'Perfect for small businesses just starting out.',
    },
    permissions: {
      messagingEnabled: true,
      smsCredits: 50,
      emailCredits: 50,
      whatsappCredits: 0,
      teamMembersEnabled: true,
      teamMembersLimit: 3,
      loyaltyEnabled: true,
      loyaltyLimit: 1,
      branchesEnabled: true,
      branchLimit: 1,
      analyticsEnabled: true,
      analyticsLevel: 'basic',
      catalogueEnabled: true,
      maxCatalogueItems: 25,
      maxCatalogueCategories: 10,
      maxCatalogueOffers: 5,
      automationsEnabled: false,
      maxAutomations: 0,
      inventoryEnabled: false,
      posEnabled: true,
      posTerminalLimit: 1,
      visitorsEnabled: true,
      inAppChatEnabled: true,
      formsEnabled: true,
      formsLimit: 1,
      businessQrEnabled: true,
      marketingKitEnabled: true,
      marketingKitLimit: 3,
      discoveryEnabled: true,
      staffRolesEnabled: false,
      activityLogEnabled: true,
      qrCodesEnabled: true,
      qrCodesLimit: 5,
      aiCopilotEnabled: false,
      aiCredits: 0,
      autoFeatureDeals: false,
    },
  },
  {
    plan: {
      name: 'Professional',
      monthlyPrice: 15000,
      currency: 'NGN',
      isFree: false,
      isPopular: true,
      trialDurationDays: 14,
      features: [
        'Unlimited Customers',
        '3 Branches',
        'Advanced Analytics',
        'Email/SMS Marketing',
        'Loyalty Program',
      ],
      description: 'For growing businesses moving to the next level.',
    },
    permissions: {
      messagingEnabled: true,
      smsCredits: 100,
      emailCredits: 1000,
      whatsappCredits: 50,
      teamMembersEnabled: true,
      teamMembersLimit: 10,
      loyaltyEnabled: true,
      loyaltyLimit: 5,
      branchesEnabled: true,
      branchLimit: 3,
      analyticsEnabled: true,
      analyticsLevel: 'advanced',
      catalogueEnabled: true,
      maxCatalogueItems: 100,
      maxCatalogueCategories: 30,
      maxCatalogueOffers: 30,
      automationsEnabled: true,
      maxAutomations: 5,
      inventoryEnabled: true,
      inventoryLimit: 10,
      posEnabled: true,
      posTerminalLimit: 3,
      visitorsEnabled: true,
      inAppChatEnabled: true,
      formsEnabled: true,
      formsLimit: 10,
      businessQrEnabled: true,
      marketingKitEnabled: true,
      marketingKitLimit: 20,
      discoveryEnabled: true,
      staffRolesEnabled: true,
      staffRolesLimit: 5,
      activityLogEnabled: true,
      qrCodesEnabled: true,
      qrCodesLimit: 30,
      aiCopilotEnabled: true,
      aiCredits: 50,
      autoFeatureDeals: false,
    },
  },
  {
    plan: {
      name: 'Ultimate',
      monthlyPrice: 45000,
      currency: 'NGN',
      isFree: false,
      trialDurationDays: 14,
      features: [
        'Unlimited Everything',
        '10 Branches',
        'WhatsApp Marketing',
        'API Access',
        'Dedicated Support',
      ],
      description: 'The complete solution for multi-branch organizations.',
    },
    permissions: {
      messagingEnabled: true,
      smsCredits: 500,
      emailCredits: 5000,
      whatsappCredits: 200,
      teamMembersEnabled: true,
      teamMembersLimit: UNLIMITED,
      loyaltyEnabled: true,
      loyaltyLimit: UNLIMITED,
      branchesEnabled: true,
      branchLimit: 10,
      analyticsEnabled: true,
      analyticsLevel: 'advanced',
      catalogueEnabled: true,
      maxCatalogueItems: UNLIMITED,
      maxCatalogueCategories: UNLIMITED,
      maxCatalogueOffers: UNLIMITED,
      automationsEnabled: true,
      maxAutomations: 20,
      inventoryEnabled: true,
      inventoryLimit: UNLIMITED,
      posEnabled: true,
      posTerminalLimit: UNLIMITED,
      visitorsEnabled: true,
      inAppChatEnabled: true,
      formsEnabled: true,
      formsLimit: UNLIMITED,
      businessQrEnabled: true,
      marketingKitEnabled: true,
      marketingKitLimit: UNLIMITED,
      discoveryEnabled: true,
      staffRolesEnabled: true,
      staffRolesLimit: UNLIMITED,
      activityLogEnabled: true,
      qrCodesEnabled: true,
      qrCodesLimit: UNLIMITED,
      aiCopilotEnabled: true,
      aiCredits: 300,
      autoFeatureDeals: true,
    },
  },
];

const CREDIT_PLANS = [
  {
    name: 'SMS Starter (100)',
    description: '100 SMS credits',
    price: 1500,
    smsAmount: 100,
    emailAmount: 0,
    whatsappAmount: 0,
    aiAmount: 0,
  },
  {
    name: 'SMS Growth (500)',
    description: '500 SMS credits',
    price: 6500,
    smsAmount: 500,
    emailAmount: 0,
    whatsappAmount: 0,
    aiAmount: 0,
  },
  {
    name: 'Email Bundle (500)',
    description: '500 email credits',
    price: 1000,
    smsAmount: 0,
    emailAmount: 500,
    whatsappAmount: 0,
    aiAmount: 0,
  },
  {
    name: 'AI Credits (100)',
    description: '100 AI copilot credits',
    price: 2000,
    smsAmount: 0,
    emailAmount: 0,
    whatsappAmount: 0,
    aiAmount: 100,
  },
];

const ADDONS = [
  {
    name: 'Extra Branch',
    description: 'Add one more branch to your plan for 30 days.',
    type: 'RESOURCE',
    price: 5000,
    durationDays: 30,
    targetCapability: 'branches',
    additionalLimit: 1,
  },
  {
    name: 'Extra POS Terminal',
    description: 'Run one more till at your branches for 30 days.',
    type: 'RESOURCE',
    price: 3000,
    durationDays: 30,
    targetCapability: 'posTerminals',
    additionalLimit: 1,
  },
];

const DEAL_CATEGORY_TYPES = [
  {
    name: 'Food & Drinks',
    description: 'Restaurants, cafes, bars and food deals',
  },
  { name: 'Fashion', description: 'Clothing, shoes and accessories' },
  { name: 'Beauty & Wellness', description: 'Salons, spas and self-care' },
  { name: 'Electronics', description: 'Phones, gadgets and appliances' },
  { name: 'Services', description: 'Professional and home services' },
  { name: 'Events', description: 'Tickets, shows and experiences' },
];

const DEMO_CATALOGUE_CATEGORIES = [
  {
    name: 'Mains',
    kind: 'product',
    description: 'Hearty Nigerian and continental plates',
  },
  {
    name: 'Drinks',
    kind: 'product',
    description: 'Fresh juices, mocktails and soft drinks',
  },
  {
    name: 'Desserts',
    kind: 'product',
    description: 'Something sweet to finish',
  },
  { name: 'Experiences', kind: 'service', description: 'Bookable experiences' },
];

const DEMO_ITEMS = [
  {
    name: 'Smoky Party Jollof',
    category: 'Mains',
    price: 4500,
    description: 'Firewood jollof rice with grilled chicken and dodo.',
  },
  {
    name: 'Pounded Yam & Egusi',
    category: 'Mains',
    price: 5200,
    description: 'Soft pounded yam with rich egusi soup and assorted meat.',
  },
  {
    name: 'Grilled Croaker Fish',
    category: 'Mains',
    price: 9500,
    description: 'Whole croaker grilled with pepper sauce and chips.',
  },
  {
    name: 'Chapman Mocktail',
    category: 'Drinks',
    price: 2200,
    description: 'The classic Nigerian Chapman, chilled.',
  },
  {
    name: 'Fresh Zobo',
    category: 'Drinks',
    price: 1500,
    description: 'Hibiscus drink with ginger and pineapple.',
  },
  {
    name: 'Chocolate Lava Cake',
    category: 'Desserts',
    price: 3500,
    description: 'Warm chocolate cake with a molten centre.',
  },
];

const DEMO_SERVICE = {
  name: 'Private Dinner for Two',
  category: 'Experiences',
  price: 35000,
  description: 'A three-course private dinner in our garden lounge.',
};

// ------------------------------------------------------------------ steps

async function ensureAdmin(credentials: Credentials) {
  const adminCode = process.env.ADMIN_ACCOUNT_CODE;
  const saved =
    credentials.admin?.email === ADMIN_EMAIL ? credentials.admin : undefined;
  if (saved) {
    note('Admin', ADMIN_EMAIL, 'exists');
    return login(ADMIN_EMAIL, saved.password);
  }
  if (!adminCode)
    throw new Error(
      'ADMIN_ACCOUNT_CODE is not set in .env — needed to create the admin account.',
    );

  const password = strongPassword();
  try {
    await api('POST', '/auth/register/admin', {
      email: ADMIN_EMAIL,
      firstName: 'Vemtap',
      lastName: 'Admin',
      password,
      adminAccountCode: adminCode,
    });
  } catch (error) {
    if ((error as { status?: number }).status === 409) {
      throw new Error(
        `${ADMIN_EMAIL} already exists but its password is not in ${CREDENTIALS_FILE}. Add it there as {"admin":{"email","password"}} and re-run.`,
      );
    }
    throw error;
  }
  credentials.admin = { email: ADMIN_EMAIL, password };
  saveCredentials(credentials);
  note('Admin', ADMIN_EMAIL, 'created');
  return login(ADMIN_EMAIL, password);
}

async function seedBusinessCategories(token: string) {
  const existing = rows(
    await api('GET', '/categories?limit=100&page=1', undefined, token),
  );
  for (const group of BUSINESS_CATEGORIES) {
    let category = byName(existing, group.name);
    if (category) note('Business category', group.name, 'exists');
    else {
      category = await api<Json>(
        'POST',
        '/admin/categories',
        { name: group.name, description: group.description },
        token,
      );
      note('Business category', group.name, 'created');
    }
    const subs = rows(
      await api(
        'GET',
        `/categories/${category.id}/subcategories?limit=100`,
        undefined,
        token,
      ),
    );
    for (const subName of group.subcategories) {
      if (byName(subs, subName)) {
        note('Subcategory', `${group.name} › ${subName}`, 'exists');
        continue;
      }
      await api(
        'POST',
        '/admin/categories/subcategories',
        { name: subName, categoryId: category.id },
        token,
      );
      note('Subcategory', `${group.name} › ${subName}`, 'created');
    }
  }
}

async function seedPlans(token: string) {
  const existing = rows(await api('GET', '/plans', undefined, token));
  for (const { plan, permissions } of PLANS) {
    let row = byName(existing, plan.name);
    if (row) note('Plan', plan.name, 'exists');
    else {
      row = await api<Json>('POST', '/plans/admin', plan, token);
      note('Plan', plan.name, 'created');
    }
    if (!row.permissionsConfiguredAt) {
      await api(
        'PUT',
        `/plans/admin/${row.id}/permissions`,
        permissions,
        token,
      );
      note('Plan permissions', plan.name, 'updated');
    }
  }
}

async function seedCreditPlans(token: string) {
  const existing = rows(await api('GET', '/credit-plans', undefined, token));
  for (const creditPlan of CREDIT_PLANS) {
    if (byName(existing, creditPlan.name)) {
      note('Credit plan', creditPlan.name, 'exists');
      continue;
    }
    await api(
      'POST',
      '/credit-plans',
      { ...creditPlan, currency: 'NGN', isActive: true },
      token,
    );
    note('Credit plan', creditPlan.name, 'created');
  }
}

async function seedAddons(token: string) {
  const existing = rows(await api('GET', '/addons/admin', undefined, token));
  for (const addon of ADDONS) {
    if (byName(existing, addon.name)) {
      note('Add-on', addon.name, 'exists');
      continue;
    }
    await api(
      'POST',
      '/addons/admin',
      { ...addon, currency: 'NGN', isActive: true },
      token,
    );
    note('Add-on', addon.name, 'created');
  }
}

async function seedDealCategoryTypes(token: string) {
  const existing = rows(
    await api(
      'GET',
      '/discovery/admin/category-types?limit=100',
      undefined,
      token,
    ),
  );
  for (const type of DEAL_CATEGORY_TYPES) {
    if (byName(existing, type.name)) {
      note('Deal category type', type.name, 'exists');
      continue;
    }
    await api('POST', '/discovery/admin/category-types', type, token);
    note('Deal category type', type.name, 'created');
  }
}

/** Newest sign-up code emailed to `email` (the demo owner may have no real inbox). */
async function latestOtp(email: string): Promise<string> {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  await client.connect();
  try {
    const result = await client.query<{ code: string }>(
      'SELECT code FROM otps WHERE email = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC LIMIT 1',
      [email],
    );
    if (!result.rows[0]) throw new Error(`No sign-up code found for ${email}`);
    return result.rows[0].code;
  } finally {
    await client.end();
  }
}

async function ensureDemoOwner(credentials: Credentials, adminToken: string) {
  const saved =
    credentials.demoOwner?.email === DEMO_OWNER_EMAIL
      ? credentials.demoOwner
      : undefined;
  if (saved) {
    note('Demo owner', DEMO_OWNER_EMAIL, 'exists');
    return login(DEMO_OWNER_EMAIL, saved.pin);
  }

  const categories = rows(
    await api('GET', '/categories?limit=100&page=1', undefined, adminToken),
  );
  const food = byName(categories, 'Food & Beverage');
  const restaurant = food
    ? byName(
        rows(
          await api(
            'GET',
            `/categories/${food.id}/subcategories?limit=100`,
            undefined,
            adminToken,
          ),
        ),
        'Restaurant',
      )
    : undefined;

  await api('POST', '/auth/register/owner/request-otp', {
    email: DEMO_OWNER_EMAIL,
    role: 'Owner',
    firstName: 'Demo',
    lastName: 'Owner',
  });
  await api('POST', '/auth/otp/verify', {
    email: DEMO_OWNER_EMAIL,
    code: await latestOtp(DEMO_OWNER_EMAIL),
  });

  const pin = sixDigitPin();
  await api('POST', '/auth/register/owner', {
    email: DEMO_OWNER_EMAIL,
    password: pin,
    firstName: 'Demo',
    lastName: 'Owner',
    businessName: 'Vemtap Demo Bistro',
    ...(food ? { categoryId: food.id } : {}),
    ...(restaurant ? { subcategoryId: restaurant.id } : {}),
    businessNumber: `+23480${randomInt(10000000, 100000000)}`,
    businessAddress: '12 Aminu Kano Crescent, Wuse II',
    city: 'Abuja',
    state: 'FCT',
    latitude: 9.0765,
    longitude: 7.4682,
  });
  credentials.demoOwner = { email: DEMO_OWNER_EMAIL, pin };
  saveCredentials(credentials);
  note('Demo owner', DEMO_OWNER_EMAIL, 'created');
  // A fresh login also puts a business with no plan on the free plan.
  return login(DEMO_OWNER_EMAIL, pin);
}

async function seedDemoBusiness(ownerToken: string) {
  const business = await api<Json>(
    'GET',
    '/businesses/my-business',
    undefined,
    ownerToken,
  );
  const branch =
    rows(business.branches).find((row) => row.isMainBranch) ??
    rows(business.branches)[0];
  if (!branch) throw new Error('Demo business has no branch');

  if (!business.description) {
    await api(
      'PATCH',
      '/businesses/my-business',
      {
        description:
          'Firewood jollof, grills and chilled Chapman in the heart of Wuse II. A demo business for testing Vemtap.',
        amenities: [
          'Dine-In',
          'Takeaway',
          'Free Wi-Fi',
          'POS Card Payment',
          'Cash Accepted',
        ],
        isVisible: true,
      },
      ownerToken,
    );
    note('Demo business', business.name, 'updated');
  } else note('Demo business', business.name, 'exists');

  const catalogueCategories = rows(
    await api('GET', '/catalogue/categories', undefined, ownerToken),
  );
  const categoryIds: Record<string, string> = {};
  for (const category of DEMO_CATALOGUE_CATEGORIES) {
    let row = byName(catalogueCategories, category.name);
    if (row) note('Catalogue category', category.name, 'exists');
    else {
      row = await api<Json>(
        'POST',
        '/catalogue/categories',
        category,
        ownerToken,
      );
      note('Catalogue category', category.name, 'created');
    }
    categoryIds[category.name] = row.id;
  }

  const items = rows(
    await api(
      'GET',
      `/catalogue/items?branchId=${branch.id}&limit=100`,
      undefined,
      ownerToken,
    ),
  );
  const itemIds: Record<string, string> = {};
  const createItem = async (
    item: {
      name: string;
      category: string;
      price: number;
      description: string;
    },
    service = false,
  ) => {
    let row = byName(items, item.name);
    if (row) note(service ? 'Service' : 'Product', item.name, 'exists');
    else {
      row = await api<Json>(
        'POST',
        '/catalogue/items',
        {
          name: item.name,
          description: item.description,
          shortDescription: item.description,
          price: item.price,
          categoryId: categoryIds[item.category],
          branchId: branch.id,
          itemType: service ? 'service' : 'product',
          ...(service
            ? { isBookable: true, duration: '2 hours' }
            : { stockQuantity: 50 }),
        },
        ownerToken,
      );
      note(service ? 'Service' : 'Product', item.name, 'created');
    }
    itemIds[item.name] = row.id;
  };
  for (const item of DEMO_ITEMS) await createItem(item);
  await createItem(DEMO_SERVICE, true);

  const offers = rows(
    await api(
      'GET',
      `/catalogue/offers/admin?branchId=${branch.id}&limit=100`,
      undefined,
      ownerToken,
    ),
  );
  const deals = [
    {
      name: '20% Off Smoky Party Jollof',
      description: 'Lunchtime favourite at 20% off.',
      pricingType: 'percentage_discount',
      discountValue: 20,
      itemIds: [itemIds['Smoky Party Jollof']],
      offerType: 'Food & Drinks',
    },
    {
      name: 'Jollof + Chapman Combo',
      description: 'Party jollof and a chilled Chapman for one price.',
      pricingType: 'fixed_discount_price',
      fixedPrice: 5500,
      itemIds: [itemIds['Smoky Party Jollof'], itemIds['Chapman Mocktail']],
      offerType: 'Food & Drinks',
    },
  ];
  for (const deal of deals) {
    if (byName(offers, deal.name)) {
      note('Deal', deal.name, 'exists');
      continue;
    }
    await api(
      'POST',
      '/catalogue/offers',
      {
        ...deal,
        branchId: branch.id,
        sourceProductId: deal.itemIds[0],
        quantity: 100,
        maxClaimsPerCustomer: 2,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        terms: ['Valid at the main branch only.', 'One deal per order.'],
      },
      ownerToken,
    );
    note('Deal', deal.name, 'created');
  }

  return business.uniqueCode as string;
}

// ------------------------------------------------------------------ main

async function main() {
  console.log(`Seeding reference data through ${API}`);
  const credentials = readCredentials();

  const adminToken = await ensureAdmin(credentials);
  await seedBusinessCategories(adminToken);
  await seedPlans(adminToken);
  await seedCreditPlans(adminToken);
  await seedAddons(adminToken);
  await seedDealCategoryTypes(adminToken);

  const ownerToken = await ensureDemoOwner(credentials, adminToken);
  const storeCode = await seedDemoBusiness(ownerToken);

  console.table(
    summary.map(([section, name, result]) => ({ section, name, result })),
  );
  console.log(`Demo storefront code: ${storeCode}`);
  console.log(
    `Credentials (admin password, demo PIN) are in ${CREDENTIALS_FILE}`,
  );
}

main().catch((error) => {
  console.table(
    summary.map(([section, name, result]) => ({ section, name, result })),
  );
  console.error(
    `\nSeeding stopped: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
