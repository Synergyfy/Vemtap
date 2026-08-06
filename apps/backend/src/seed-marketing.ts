import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { MarketingAIPrompt } from './modules/marketing-assets/entities/marketing-ai-prompt.entity';
import { MarketingMockup } from './modules/marketing-assets/entities/marketing-mockup.entity';
import { MarketingTemplate } from './modules/marketing-assets/entities/marketing-template.entity';
import { MarketingCategory } from './modules/marketing-assets/entities/marketing-category.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Seeding Marketing Assets Data...');

  // 0. Seed Categories
  const categoryRepo = dataSource.getRepository(MarketingCategory);
  const categoriesCount = await categoryRepo.count();
  const CATEGORIES: Array<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    sortOrder: number;
  }> = [
    {
      name: 'Restaurant',
      slug: 'restaurant',
      description: 'Restaurants, fast food, fine dining',
      icon: 'UtensilsCrossed',
      color: '#EF4444',
      sortOrder: 1,
    },
    {
      name: 'Fashion Store',
      slug: 'fashion-store',
      description: 'Clothing, boutique, shoe stores',
      icon: 'Shirt',
      color: '#EC4899',
      sortOrder: 2,
    },
    {
      name: 'Salon & Barbershop',
      slug: 'salon-barbershop',
      description: 'Salons, barbershops, beauty studios',
      icon: 'Scissors',
      color: '#8B5CF6',
      sortOrder: 3,
    },
    {
      name: 'Hotel',
      slug: 'hotel',
      description: 'Hotels, guest houses, lodges',
      icon: 'Building2',
      color: '#3B82F6',
      sortOrder: 4,
    },
    {
      name: 'Cafe',
      slug: 'cafe',
      description: 'Cafes, coffee shops, lounges',
      icon: 'Coffee',
      color: '#F59E0B',
      sortOrder: 5,
    },
    {
      name: 'Retail',
      slug: 'retail',
      description: 'Retail stores, convenience stores, supermarkets',
      icon: 'ShoppingBag',
      color: '#10B981',
      sortOrder: 6,
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Nightclubs, lounges, entertainment venues',
      icon: 'Music',
      color: '#F97316',
      sortOrder: 7,
    },
  ];
  if (categoriesCount === 0) {
    await categoryRepo.save(CATEGORIES.map((c) => categoryRepo.create(c)));
    console.log(`  Seeded ${CATEGORIES.length} Categories.`);
  }

  const allCats = await categoryRepo.find();
  const categoryMap = new Map(allCats.map((c) => [c.name.toLowerCase(), c]));

  // 1. Seed AI Prompts
  const promptRepo = dataSource.getRepository(MarketingAIPrompt);
  const promptsCount = await promptRepo.count();
  if (promptsCount === 0) {
    const prompts = [
      promptRepo.create({
        name: 'Google Review Request',
        category: 'Review Request',
        promptTemplate:
          'Write a short, engaging one-sentence prompt in a {tone} tone asking customers of a {businessType} named {businessName} to scan the QR code and write a Google review. Keep it under 20 words.',
      }),
      promptRepo.create({
        name: 'Instagram Follow Hook',
        category: 'Social Follow',
        promptTemplate:
          'Write a high-converting tagline in a {tone} tone for {businessName} ({businessType}) inviting visitors to follow them on Instagram for secret deals. Keep it under 15 words.',
      }),
      promptRepo.create({
        name: 'Contactless Menu Promo',
        category: 'Contactless Menu',
        promptTemplate:
          'Write a clear, hospitable caption in a {tone} tone for a {businessType} named {businessName} urging guests to scan the QR to browse their digital menu. Under 15 words.',
      }),
      promptRepo.create({
        name: 'Surprise Discount Headline',
        category: 'Discount Promo',
        promptTemplate:
          'Write an irresistible headline in a {tone} tone for {businessName} ({businessType}) asking customers to scan to unlock a surprise loyalty discount. Under 10 words.',
      }),
    ];
    await promptRepo.save(prompts);
    console.log('  Seeded 4 AI Prompt Templates.');
  }

  // 2. Seed Mockups
  const mockupRepo = dataSource.getRepository(MarketingMockup);
  const mockupsCount = await mockupRepo.count();
  if (mockupsCount === 0) {
    const mockups = [
      mockupRepo.create({
        name: 'Wooden Stand Table Tent',
        type: 'table_tent',
        imageUrl:
          'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
        overlayConfig: {
          x: 30,
          y: 40,
          width: 40,
          height: 60,
          perspective: 1000,
          rotateY: 15,
        },
      }),
      mockupRepo.create({
        name: 'Glass Shopfront Poster',
        type: 'poster',
        imageUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
        overlayConfig: {
          x: 20,
          y: 10,
          width: 60,
          height: 80,
          perspective: 0,
          rotateY: 0,
        },
      }),
      mockupRepo.create({
        name: 'Acrylic Table Card',
        type: 'table_tent',
        imageUrl:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        overlayConfig: {
          x: 35,
          y: 45,
          width: 30,
          height: 50,
          perspective: 800,
          rotateY: -10,
        },
      }),
    ];
    await mockupRepo.save(mockups);
    console.log('  Seeded 3 Mockup Presets.');
  }

  // 3. Seed Base Templates
  const templateRepo = dataSource.getRepository(MarketingTemplate);
  const templatesCount = await templateRepo.count();
  if (templatesCount === 0) {
    const templates = [
      templateRepo.create({
        name: 'Sleek Dark Table Tent',
        category: 'Restaurant',
        categories: [
          categoryMap.get('restaurant'),
          categoryMap.get('cafe'),
        ].filter((c): c is MarketingCategory => c != null),
        type: 'table_tent',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=200&q=80',
        layoutConfig: {
          backgroundColor: '#0F172A',
          textColor: '#FFFFFF',
          title: 'Savor the Flavor',
          subtitle: 'Scan to Browse Our Menu',
          tagline: 'Your table, your menu.',
          accentColor: '#2563EB',
          borderColor: '#1E293B',
          logoPosition: 'top',
        },
        qrCodeConfig: {
          color: '#FFFFFF',
          backgroundColor: '#0F172A',
          margin: 2,
        },
      }),
      templateRepo.create({
        name: 'Minimal Light Review Poster',
        category: 'Retail',
        categories: [
          categoryMap.get('retail'),
          categoryMap.get('restaurant'),
        ].filter((c): c is MarketingCategory => c != null),
        type: 'poster',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=200&q=80',
        layoutConfig: {
          backgroundColor: '#FFFFFF',
          textColor: '#0F172A',
          title: 'Review Us on Google',
          subtitle: 'Your feedback shapes our shop',
          tagline: 'Scan to leave a review.',
          accentColor: '#F59E0B',
          borderColor: '#E2E8F0',
          logoPosition: 'bottom',
        },
        qrCodeConfig: {
          color: '#0F172A',
          backgroundColor: '#FFFFFF',
          margin: 4,
        },
      }),
      templateRepo.create({
        name: 'Neon Nightclub Table Tent',
        category: 'Entertainment',
        categories: [
          categoryMap.get('entertainment'),
          categoryMap.get('cafe'),
        ].filter((c): c is MarketingCategory => c != null),
        type: 'table_tent',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=200&q=80',
        layoutConfig: {
          backgroundColor: '#000000',
          textColor: '#F472B6',
          title: 'VIP Specials',
          subtitle: 'Scan for Bottle Service Menu',
          tagline: 'Scan, tap & enjoy the night.',
          accentColor: '#10B981',
          borderColor: '#374151',
          logoPosition: 'top',
        },
        qrCodeConfig: {
          color: '#F472B6',
          backgroundColor: '#000000',
          margin: 2,
        },
      }),
    ];
    await templateRepo.save(templates);
    console.log('  Seeded 3 Default Base Templates.');
  }

  console.log('Marketing Assets Seeding Complete!');
  await app.close();
}

bootstrap();
