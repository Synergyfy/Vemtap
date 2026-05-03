import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { UserRole, UserStatus } from './modules/users/entities/user.entity';
import { PlansService } from './modules/subscriptions/plans.service';
import { CategoriesService } from './modules/categories/categories.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const plansService = app.get(PlansService);
  const categoriesService = app.get(CategoriesService);

  console.log('Seeding admin and plans...');

  // 1. Create Admin
  const adminEmail = 'admin@vemtap.com';
  const admin = await usersService.findByEmail(adminEmail);
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await usersService.create({
      firstName: 'VemTap',
      lastName: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    console.log(`Created Admin: ${adminEmail}`);
  } else {
    console.log(`Admin ${adminEmail} already exists.`);
  }

  // 2. Seed Subscription Plans
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
  } else {
    console.log('Subscription plans already exist.');
  }

  // 3. Seed Categories & Subcategories
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
  } else {
    console.log('Categories already exist.');
  }

  console.log('Seeding complete!');
  await app.close();
}

bootstrap();
