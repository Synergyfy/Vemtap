import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CategoriesService } from './modules/categories/categories.service';

const CATEGORIES_DATA = [
  {
    name: 'Retail & Shops',
    description: 'Businesses that sell physical products directly to customers either in a shop, store, market stall, or online.',
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
    description: 'Businesses that prepare, sell, or serve food, drinks, or provide accommodation to customers.',
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
    description: 'Businesses that help customers improve their appearance, grooming, hygiene, and personal care.',
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
    description: 'Businesses that provide healthcare, medical services, or wellness treatments.',
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
    description: 'Businesses that provide expert advice, consulting, or professional services.',
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
    description: 'Businesses that provide technology services, digital solutions, or IT-related services.',
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
    description: 'Businesses that provide learning, academic training, or skill development.',
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
    description: 'Businesses involved in buying, selling, renting, managing, or developing properties.',
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
    description: 'Businesses that sell vehicles or provide car-related services.',
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
    description: 'Businesses that move people, goods, or deliveries from one place to another.',
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
    description: 'Businesses that build, repair, install, or maintain homes, buildings, or infrastructure.',
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
    description: 'Businesses that provide entertainment, event planning, and event services.',
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
    description: 'Businesses that help people manage, invest, borrow, insure, or move money.',
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
    description: 'Businesses involved in farming, livestock, food production, or agricultural supply.',
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
    description: 'Organizations that operate for religious, charity, or social impact purposes.',
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
    description: 'If your business does not fit into any of the categories above, select this option and specify what your business does.',
    subcategories: ['Others'],
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriesService = app.get(CategoriesService);

  console.log('Seeding categories and subcategories...');

  for (const catData of CATEGORIES_DATA) {
    try {
      let category = (await categoriesService.findAllCategories({ search: catData.name, limit: 1 })).items[0];
      
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
        const subExists = category.subcategories?.find(s => s.name === subName);
        if (!subExists) {
          await categoriesService.createSubcategory({
            name: subName,
            categoryId: category.id,
          });
          console.log(`  Created subcategory: ${subName}`);
        }
      }
    } catch (error) {
      console.error(`Error seeding category ${catData.name}:`, error.message);
    }
  }

  console.log('Seeding complete!');
  await app.close();
}

bootstrap();
