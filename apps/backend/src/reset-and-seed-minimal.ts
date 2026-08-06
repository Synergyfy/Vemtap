import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './database/data-source';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CategoriesService } from './modules/categories/categories.service';
import { PlansService } from './modules/subscriptions/plans.service';

const TABLES_ORDER = [
  'customers',
  'visits',
  'form_responses',
  'form_answers',
  'campaign_contacts',
  'campaigns',
  'reward_redemptions',
  'point_transactions',
  'rewards',
  'reward_templates',
  'redemption_codes',
  'point_codes',
  'catalogue_order_items',
  'catalogue_orders',
  'catalogue_cart_items',
  'catalogue_carts',
  'catalogue_offers',
  'catalogue_items',
  'catalogue_categories',
  'message_campaigns',
  'flow_executions',
  'flow_logs',
  'automation_logs',
  'message_logs',
  'automation_rules',
  'message_templates',
  'flow_templates',
  'flow_trigger_configs',
  'flows',
  'chat_categories',
  'conversation_threads',
  'credit_transactions',
  'business_credit_wallets',
  'business_credits',
  'credit_plans',
  'messages',
  'subscriptions',
  'plans',
  'settings',
  'contacts',
  'segments',
  'products',
  'quotes',
  'quote_negotiations',
  'orders',
  'product_types',
  'forms',
  'form_fields',
  'form_templates',
  'form_field_templates',
  'support_tickets',
  'ticket_messages',
  'ticket_activities',
  'support_tickets',
  'devices',
  'impersonation_tokens',
  'customer_impersonation_tokens',
  'audit_logs',
  'branches',
  'businesses',
  'categories',
  'subcategories',
  'otps',
  'notifications',
  'password_reset_histories',
  'users',
  'surveys',
];

const CATEGORIES_DATA = [
  {
    name: 'Retail & Shops',
    description:
      'Businesses that sell physical products directly to customers either in a shop, store, market stall, or online.',
    subcategories: [
      'Supermarket / Grocery Store',
      'Boutique / Fashion Store',
      'Shoe Store',
      'Phone & Accessories Store',
      'Electronics Store',
      'Computer Store',
      'Cosmetics / Beauty Products Store',
      'Perfume Store',
      'Baby Store',
      'Toy Store',
      'Gift Shop',
      'Bookshop / Stationery',
      'Jewelry Store',
      'Home Appliances Store',
      'Furniture Store',
      'Building Materials Store',
      'Lighting / Electrical Shop',
      'Kitchenware Store',
      'Sports Equipment Store',
      'Pet Store',
      'Pharmacy / Drug Store',
      'Agricultural Produce Shop',
      'Auto Spare Parts Shop',
      'Market Trader / General Merchandise',
      'Others',
    ],
  },
  {
    name: 'Food & Hospitality',
    description:
      'Businesses that prepare, sell, or serve food, drinks, or provide accommodation to customers.',
    subcategories: [
      'Restaurant',
      'Fast Food / Quick Service',
      'Local Food Canteen / Bukka',
      'Café / Coffee Shop',
      'Bakery',
      'Ice Cream Shop',
      'Juice / Smoothie Bar',
      'Bar / Lounge',
      'Nightclub',
      'Catering Services',
      'Event Food Vendor',
      'Hotel',
      'Guest House',
      'Short-let Apartment',
      'Resort',
      'Others',
    ],
  },
  {
    name: 'Beauty & Personal Care',
    description:
      'Businesses that help customers improve their appearance, grooming, hygiene, and personal care.',
    subcategories: [
      'Hair Salon',
      'Barbing Salon',
      'Nail Studio',
      'Spa / Massage',
      'Makeup Artist',
      'Skincare / Facial Studio',
      'Beauty Clinic',
      'Tattoo Studio',
      'Piercing Studio',
      'Cosmetics Studio',
      'Others',
    ],
  },
  {
    name: 'Health & Medical',
    description:
      'Businesses that provide healthcare, medical services, or wellness treatments.',
    subcategories: [
      'Hospital',
      'Clinic',
      'Dental Clinic',
      'Eye Clinic / Optometrist',
      'Pharmacy',
      'Laboratory / Diagnostic Center',
      'Physiotherapy',
      'Mental Health / Therapy Center',
      'Maternity Center',
      'Medical Supply Store',
      'Others',
    ],
  },
  {
    name: 'Professional Services',
    description:
      'Businesses that provide expert advice, consulting, or professional services.',
    subcategories: [
      'Law Firm / Legal Services',
      'Accounting / Audit Firm',
      'Tax Consultant',
      'Business Consultant',
      'Marketing Agency',
      'Branding Agency',
      'Advertising Agency',
      'HR Consulting',
      'Management Consulting',
      'Public Relations (PR)',
      'Others',
    ],
  },
  {
    name: 'Technology & Digital Services',
    description:
      'Businesses that provide technology services, digital solutions, or IT-related services.',
    subcategories: [
      'Software Development',
      'Website Development',
      'Mobile App Development',
      'IT Support Services',
      'Cybersecurity Services',
      'Data & Analytics Services',
      'SaaS / Tech Platform',
      'Digital Marketing Agency',
      'Social Media Management',
      'Graphic Design',
      'UI/UX Design',
      'Printing & Branding Services',
      'Computer Repair',
      'Phone Repair',
      'Internet Service Provider',
      'Others',
    ],
  },
  {
    name: 'Education & Training',
    description:
      'Businesses that provide learning, academic training, or skill development.',
    subcategories: [
      'Nursery / Primary School',
      'Secondary School',
      'University / Polytechnic',
      'Private Tutor',
      'Training Institute',
      'Professional Certification Training',
      'Tech Bootcamp',
      'Driving School',
      'Music School',
      'Language School',
      'Online Course Provider',
      'Coaching Center',
      'Others',
    ],
  },
  {
    name: 'Real Estate & Property',
    description:
      'Businesses involved in buying, selling, renting, managing, or developing properties.',
    subcategories: [
      'Real Estate Agency',
      'Property Developer',
      'Property Management',
      'Land Sales Company',
      'Facility Management',
      'Surveying Services',
      'Estate Valuation',
      'Short-let Management',
      'Others',
    ],
  },
  {
    name: 'Automotive',
    description:
      'Businesses that sell vehicles or provide car-related services.',
    subcategories: [
      'Car Dealership',
      'Used Car Dealer',
      'Car Rental',
      'Mechanic Workshop',
      'Auto Spare Parts',
      'Car Wash',
      'Auto Electrical Repair',
      'Tire Shop',
      'Vehicle Inspection',
      'Vehicle Tracking Services',
      'Others',
    ],
  },
  {
    name: 'Logistics & Transportation',
    description:
      'Businesses that move people, goods, or deliveries from one place to another.',
    subcategories: [
      'Courier Service',
      'Delivery Company',
      'Logistics Company',
      'Trucking Services',
      'Bike Delivery',
      'Moving Company',
      'Bus Transport Company',
      'Taxi / Ride Hailing',
      'Freight Forwarding',
      'Shipping Company',
      'Others',
    ],
  },
  {
    name: 'Construction & Home Services',
    description:
      'Businesses that build, repair, install, or maintain homes, buildings, or infrastructure.',
    subcategories: [
      'Construction Company',
      'Building Contractor',
      'Architecture Firm',
      'Interior Design',
      'Plumbing Services',
      'Electrical Installation',
      'Painting Services',
      'Carpentry',
      'Tiling Services',
      'Welding / Metal Fabrication',
      'Cleaning Services',
      'Pest Control',
      'Security Services',
      'Others',
    ],
  },
  {
    name: 'Events & Entertainment',
    description:
      'Businesses that provide entertainment, event planning, and event services.',
    subcategories: [
      'Event Planning',
      'Wedding Planner',
      'Event Hall / Venue',
      'DJ Services',
      'Photography',
      'Videography',
      'MC / Host',
      'Equipment Rental',
      'Stage & Lighting',
      'Decor Services',
      'Entertainment Company',
      'Others',
    ],
  },
  {
    name: 'Finance & Financial Services',
    description:
      'Businesses that help people manage, invest, borrow, insure, or move money.',
    subcategories: [
      'Bank',
      'Microfinance Bank',
      'Fintech Company',
      'POS Agent / POS Business',
      'Bureau De Change',
      'Insurance Company',
      'Investment Company',
      'Loan Services',
      'Mortgage Services',
      'Cooperative Society',
      'Others',
    ],
  },
  {
    name: 'Agriculture & Farming',
    description:
      'Businesses involved in farming, livestock, food production, or agricultural supply.',
    subcategories: [
      'Crop Farming',
      'Livestock Farming',
      'Poultry Farm',
      'Fish Farm',
      'Agro Processing',
      'Farm Produce Trading',
      'Fertilizer & Farm Input Supply',
      'Agricultural Equipment Supply',
      'Others',
    ],
  },
  {
    name: 'Manufacturing & Production',
    description: 'Businesses that produce goods or manufacture products.',
    subcategories: [
      'Food Processing',
      'Beverage Production',
      'Clothing Manufacturing',
      'Furniture Manufacturing',
      'Plastic Manufacturing',
      'Cosmetics Manufacturing',
      'Pharmaceutical Manufacturing',
      'Packaging Production',
      'Printing Production',
      'Others',
    ],
  },
  {
    name: 'Religious & Non-Profit Organizations',
    description:
      'Organizations that operate for religious, charity, or social impact purposes.',
    subcategories: [
      'Church',
      'Mosque',
      'NGO',
      'Charity Organization',
      'Foundation',
      'Community Organization',
      'Others',
    ],
  },
  {
    name: 'Government & Public Services',
    description: 'Government institutions or public service providers.',
    subcategories: [
      'Government Office',
      'Public Agency',
      'Public Utility Service',
      'Public Healthcare Facility',
      'Public School',
      'Others',
    ],
  },
  {
    name: 'Others',
    description:
      'If your business does not fit into any of the categories above, select this option and specify what your business does.',
    subcategories: ['Others'],
  },
];

const PLANS_DATA = [
  {
    name: 'Starter (Free)',
    monthlyPrice: 0,
    quarterlyPrice: 0,
    yearlyPrice: 0,
    currency: 'NGN',
    isFree: true,
    trialDurationDays: 0,
    features: [
      'Basic QR Scanning',
      '1 Branch',
      '50 Customers',
      'Basic Analytics',
      '10 SMS Credits',
      '100 Email Credits',
    ],
    messagingEnabled: false,
    smsCredits: 10,
    emailCredits: 100,
    whatsappCredits: 0,
    teamMembersEnabled: false,
    teamMembersLimit: null,
    loyaltyLimit: null,
    loyaltyEnabled: false,
    branchesEnabled: false,
    branchLimit: 1,
    analyticsEnabled: false,
    analyticsLevel: 'basic',
    catalogueEnabled: false,
    maxCatalogueItems: null,
    maxCatalogueCategories: null,
    maxCatalogueOffers: null,
    automationsEnabled: false,
    maxAutomations: null,
    isActive: true,
    description: 'Perfect for small businesses just starting out.',
    isPopular: false,
  },
  {
    name: 'Professional',
    monthlyPrice: 15000,
    quarterlyPrice: 40000,
    yearlyPrice: 140000,
    currency: 'NGN',
    isFree: false,
    trialDurationDays: 14,
    features: [
      'Unlimited Customers',
      '3 Branches',
      'Advanced Analytics',
      'Email/SMS Marketing',
      'Loyalty Program',
      'Basic Automations',
      '5 Team Members',
    ],
    messagingEnabled: true,
    smsCredits: 100,
    emailCredits: 1000,
    whatsappCredits: 50,
    teamMembersEnabled: true,
    teamMembersLimit: 5,
    loyaltyLimit: 1,
    loyaltyEnabled: true,
    branchesEnabled: true,
    branchLimit: 3,
    analyticsEnabled: true,
    analyticsLevel: 'advanced',
    catalogueEnabled: false,
    maxCatalogueItems: 100,
    maxCatalogueCategories: 10,
    maxCatalogueOffers: 20,
    automationsEnabled: true,
    maxAutomations: 5,
    isActive: true,
    description: 'For growing businesses moving to the next level.',
    isPopular: true,
  },
  {
    name: 'Ultimate',
    monthlyPrice: 45000,
    quarterlyPrice: 120000,
    yearlyPrice: 420000,
    currency: 'NGN',
    isFree: false,
    trialDurationDays: 14,
    features: [
      'Unlimited Everything',
      '10 Branches',
      'WhatsApp Marketing',
      'API Access',
      'Dedicated Support',
      'Advanced Automations',
      'Unlimited Team Members',
      'Full Analytics Suite',
      'Catalogue with Unlimited Items',
    ],
    messagingEnabled: true,
    smsCredits: 500,
    emailCredits: 5000,
    whatsappCredits: 200,
    teamMembersEnabled: true,
    teamMembersLimit: -1,
    loyaltyLimit: -1,
    loyaltyEnabled: true,
    branchesEnabled: true,
    branchLimit: 10,
    analyticsEnabled: true,
    analyticsLevel: 'premium',
    catalogueEnabled: true,
    maxCatalogueItems: -1,
    maxCatalogueCategories: -1,
    maxCatalogueOffers: -1,
    automationsEnabled: true,
    maxAutomations: -1,
    isActive: true,
    description: 'The complete solution for multi-branch organizations.',
    isPopular: false,
  },
];

async function deleteAllData() {
  console.log('Connecting to database...');
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();

  console.log('Deleting all data from tables...');

  for (const table of TABLES_ORDER) {
    try {
      await ds.query(`DELETE FROM "${table}"`);
      console.log(`Deleted all rows from: ${table}`);
    } catch (error: any) {
      console.log(`Skipped ${table}: ${error.message}`);
    }
  }

  console.log('All data deleted successfully!');
  await ds.destroy();
}

async function seedPlansAndCategories() {
  console.log('Starting NestJS application...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const plansService = app.get(PlansService);
  const categoriesService = app.get(CategoriesService);

  console.log('Seeding plans...');
  for (const planData of PLANS_DATA) {
    try {
      await plansService.create(planData as any);
      console.log(`Created Plan: ${planData.name}`);
    } catch (error: any) {
      console.error(`Error creating plan ${planData.name}:`, error.message);
    }
  }

  console.log('\nSeeding categories and subcategories...');
  for (const catData of CATEGORIES_DATA) {
    try {
      let category = (
        await categoriesService.findAllCategories({
          search: catData.name,
          limit: 1,
        })
      ).items[0];

      if (!category) {
        category = await categoriesService.createCategory({
          name: catData.name,
          description: catData.description,
        });
        console.log(`Created category: ${catData.name}`);
      } else {
        console.log(`Category already exists: ${catData.name}`);
      }

      for (const subName of catData.subcategories) {
        const subExists = category.subcategories?.find(
          (s) => s.name === subName,
        );
        if (!subExists) {
          await categoriesService.createSubcategory({
            name: subName,
            categoryId: category.id,
          });
          console.log(`  Created subcategory: ${subName}`);
        }
      }
    } catch (error: any) {
      console.error(`Error seeding category ${catData.name}:`, error.message);
    }
  }

  console.log('\nSeeding complete!');
  await app.close();
}

async function main() {
  await deleteAllData();
  await seedPlansAndCategories();
  console.log('\n=== DONE ===');
  console.log(
    'Database has been reset with only plans, categories, and subcategories.',
  );
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
