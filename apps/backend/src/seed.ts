import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { BusinessesService } from './modules/businesses/businesses.service';
import { UserRole } from './modules/users/entities/user.entity';
import { BranchesService } from './modules/branches/branches.service';
import { CategoriesService } from './modules/categories/categories.service';
import { PlansService } from './modules/subscriptions/plans.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const businessesService = app.get(BusinessesService);
  const branchesService = app.get(BranchesService);
  const categoriesService = app.get(CategoriesService);
  const plansService = app.get(PlansService);

  console.log('Seeding data...');

  // 1. Create Owner & Business
  let owner = await usersService.findByEmail('business@latap.com');
  if (!owner) {
    const hashedPassword = await bcrypt.hash('business123', 10);
    owner = await usersService.create({
      firstName: 'John',
      lastName: 'Smith',
      email: 'business@latap.com',
      password: hashedPassword,
      role: UserRole.OWNER,
    });
    console.log('Created Owner: business@latap.com');

    // Create Business for Owner (this automatically creates Main Branch and links owner)
    const biz = await businessesService.create({
      name: 'The Azure Bistro',
      monthlyVisitors: '501-2000',
      ownerId: owner.id,
    });
    console.log('Created Business: The Azure Bistro');

    // Update Main Branch with settings
    const branches = await branchesService.findAll(owner.id);
    const mainBranch = branches[0];
    if (mainBranch) {
      await branchesService.update(owner.id, mainBranch.id, {
        welcomeMessage: 'Welcome to Azure Bistro!',
        rewardEnabled: true,
      });
      console.log('Updated Main Branch settings');
    }
  }

  // 2. Create Manager (Linked to Branch)
  const business = await businessesService.findByOwner(owner.id);

  let branchId: string | undefined;
  if (business) {
    const branches = await branchesService.findAll(owner.id);
    branchId = branches[0]?.id;
  }

  const manager = await usersService.findByEmail('manager@latap.com');
  if (!manager) {
    const hashedPassword = await bcrypt.hash('manager123', 10);
    await usersService.create({
      firstName: 'Sarah',
      lastName: 'Supervisor',
      email: 'manager@latap.com',
      password: hashedPassword,
      role: UserRole.MANAGER,
      branchId: branchId,
    });
    console.log('Created Manager: manager@latap.com');
  }

  // 3. Create Staff
  const staff = await usersService.findByEmail('staff@latap.com');
  if (!staff) {
    const hashedPassword = await bcrypt.hash('staff123', 10);
    await usersService.create({
      firstName: 'Michael',
      lastName: 'Cashier',
      email: 'staff@latap.com',
      password: hashedPassword,
      role: UserRole.STAFF,
      branchId: branchId,
    });
    console.log('Created Staff: staff@latap.com');
  }

  // 4. Create Admin
  const admin = await usersService.findByEmail('admin@latap.com');
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await usersService.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@latap.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    console.log('Created Admin: admin@latap.com');
  }

  // 5. Create Customer
  const customer = await usersService.findByEmail('customer@latap.com');
  if (!customer) {
    const hashedPassword = await bcrypt.hash('customer123', 10);
    await usersService.create({
      firstName: 'Jane',
      lastName: 'Customer',
      email: 'customer@latap.com',
      password: hashedPassword,
      role: UserRole.CUSTOMER,
    });
    console.log('Created Customer: customer@latap.com');
  }

  // 6. Seed Categories & Subcategories
  const existingCategories = await categoriesService.findAllCategories({
    page: 1,
    limit: 1,
  });

  if (existingCategories.meta.total === 0) {
    const seedData = [
      {
        name: 'Food & Beverage',
        description: 'Restaurants, cafes, bars, and other food services',
        subcategories: ['Restaurant', 'Cafe', 'Bar', 'Night Club'],
      },
      {
        name: 'Retail',
        description: 'Physical stores selling consumer goods',
        subcategories: ['Grocery Store', 'Clothing Store', 'Electronics'],
      },
      {
        name: 'Services',
        description: 'Professional and personal service providers',
        subcategories: ['Salon', 'Spa', 'Professional Services'],
      },
      {
        name: 'Hospitality',
        description: 'Accommodation and travel services',
        subcategories: ['Hotel', 'Guest House'],
      },
    ];

    for (const catData of seedData) {
      const category = await categoriesService.createCategory({
        name: catData.name,
        description: catData.description,
      });
      console.log(`Created Category: ${category.name}`);

      for (const subName of catData.subcategories) {
        await categoriesService.createSubcategory({
          name: subName,
          description: `${subName} under ${catData.name}`,
          categoryId: category.id,
        });
        console.log(`  Created Subcategory: ${subName}`);
      }
    }
  }

  // 7. Seed Subscription Plans
  const existingPlans = await plansService.findAll();
  if (existingPlans.length === 0) {
    const plansToSeed = [
      {
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
        branchLimit: 1,
        maxCatalogueItems: 30,
        maxAutomations: 1,
        description: 'Perfect for small businesses just starting out.',
      },
      {
        name: 'Professional',
        monthlyPrice: 15000,
        currency: 'NGN',
        isFree: false,
        isPopular: true,
        features: [
          'Unlimited Customers',
          '3 Branches',
          'Advanced Analytics',
          'Email/SMS Marketing',
          'Loyalty Program',
        ],
        branchLimit: 3,
        messagingEnabled: true,
        smsCredits: 100,
        emailCredits: 1000,
        loyaltyEnabled: true,
        maxCatalogueItems: 100,
        maxAutomations: 5,
        description: 'For growing businesses moving to the next level.',
      },
      {
        name: 'Ultimate',
        monthlyPrice: 45000,
        currency: 'NGN',
        isFree: false,
        features: [
          'Unlimited Everything',
          '10 Branches',
          'WhatsApp Marketing',
          'API Access',
          'Dedicated Support',
        ],
        branchLimit: 10,
        messagingEnabled: true,
        smsCredits: 500,
        emailCredits: 5000,
        whatsappCredits: 200,
        loyaltyEnabled: true,
        catalogueEnabled: true,
        maxCatalogueItems: 1000,
        maxAutomations: 20,
        description: 'The complete solution for multi-branch organizations.',
      },
    ];

    for (const planData of plansToSeed) {
      await plansService.create(planData as any);
      console.log(`Created Subscription Plan: ${planData.name}`);
    }
  }

  console.log('Seeding complete!');
  await app.close();
}

bootstrap();
