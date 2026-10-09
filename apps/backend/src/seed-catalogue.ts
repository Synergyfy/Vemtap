import { NestFactory } from '@nestjs/core';
import { DataSource, EntityManager } from 'typeorm';
import { AppModule } from './app.module';
import { User } from './modules/users/entities/user.entity';
import { Business } from './modules/businesses/entities/business.entity';
import { Branch } from './modules/branches/entities/branch.entity';
import { Category } from './modules/businesses/entities/category.entity';
import { Subcategory } from './modules/businesses/entities/subcategory.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
  CatalogueItemType,
  DiscountType,
  ServicePriceType,
  ServiceMode,
  ServiceBookingMethod,
} from './modules/catalogue/entities/catalogue-item.entity';
import { CatalogueCategory } from './modules/catalogue/entities/catalogue-category.entity';
import {
  CatalogueOffer,
  CatalogueOfferPricingType,
  CatalogueOfferStatus,
} from './modules/catalogue/entities/catalogue-offer.entity';

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  burger: img('photo-1568901346375-23c9450c58cd'),
  pizza: img('photo-1513104890138-7c749659a591'),
  pasta: img('photo-1621996346565-e3dbc646d9a9'),
  wings: img('photo-1527477396000-e27163b481c2'),
  friedChicken: img('photo-1562967914-608f82629710'),
  grillPlatter: img('photo-1544025162-d76694265947'),
  salad: img('photo-1512621776951-a57141f2eefd'),
  coffee: img('photo-1509042239860-f550ce710b93'),
  latteArt: img('photo-1572442388796-11668a67e53d'),
  cake: img('photo-1578985545062-69928b1d9587'),
  cheesecake: img('photo-1533134242443-d4fd215305ad'),
  smoothie: img('photo-1502741224143-90386d7f8c82'),
  juice: img('photo-1600271886742-f049cd451bba'),
  cocktail: img('photo-1551024709-8f23befc6f87'),
  sushi: img('photo-1579871494447-9811cf80d66c'),
  sandwich: img('photo-1528735602780-2552fd46c7af'),
  restaurantInterior: img('photo-1517248135467-4c7edcad34c4'),
  restaurantTable: img('photo-1516450360452-9312f5e86fc7'),
  restaurantWarm: img('photo-1543007630-9710e4a00a20'),
  restaurantLounge: img('photo-1513542789411-b6a5d4f31634'),
  pancakes: img('photo-1567620905732-2d1ec7ab7445'),
  denimJacket: img('photo-1551537482-f2075a1d41f2'),
  tshirt: img('photo-1521572163474-6864f9cf17ab'),
  jeans: img('photo-1542272604-787c3835535d'),
  sneakers: img('photo-1542291026-7eec264c27ff'),
  shoes: img('photo-1549298916-b41d501d3772'),
  clothingRack: img('photo-1441986300917-64674bd600d8'),
  storeFront: img('photo-1441984904996-e0b6ba687e04'),
  bag: img('photo-1584917865442-de89df76afd3'),
  watch: img('photo-1523275335684-37898b6baf30'),
  sunglasses: img('photo-1572635196237-14b3f281503f'),
  dress: img('photo-1595777457583-95e059d581b8'),
  heels: img('photo-1543163521-1bf539c55dd2'),
  jewelry: img('photo-1515562141207-7a88fb7ce338'),
  perfume: img('photo-1541643600914-78b084683601'),
  makeup: img('photo-1596462502278-27bfdc403348'),
  salon: img('photo-1560066984-138dadb4c035'),
  barber: img('photo-1585747860715-2ba37e788b70'),
  nails: img('photo-1604654894610-df63bc536371'),
  tailor: img('photo-1556905055-8f358a7a47b2'),
};

interface ItemSeed {
  key: string;
  categoryKey: string;
  name: string;
  price: number;
  shortDescription: string;
  description: string;
  mainImage: string;
  galleryImages: string[];
  itemType: CatalogueItemType;
  discountType: DiscountType;
  discountValue?: number;
  stockQuantity?: number;
  costPrice?: number;
  minStock?: number;
  brand?: string;
  weight?: string;
  dimensions?: string;
  variants?: { type: string; value: string }[];
  tags: string[];
  loyaltyPoints?: number;
  priceType?: ServicePriceType;
  priceRangeMin?: number;
  priceRangeMax?: number;
  duration?: string;
  serviceMode?: ServiceMode;
  isBookable?: boolean;
  bookingMethod?: ServiceBookingMethod;
}

interface OfferSeed {
  name: string;
  description: string;
  longDescription: string;
  pricingType: CatalogueOfferPricingType;
  discountValue?: number;
  fixedPrice?: number;
  itemKeys: string[];
  branchKey?: string;
  mainImage: string;
  galleryImages: string[];
  quantity: number;
  maxClaimsPerCustomer: number;
  isFeatured: boolean;
  loyaltyPoints: number;
  views: number;
  visits: number;
  likesCount: number;
  dislikesCount: number;
  daysLeft: number;
  delivery?: {
    scope: string;
    radius: number;
    unit: string;
    minOrderAmount: number;
  };
}

interface BranchSeedDef {
  key: string;
  username?: string;
  isMain: boolean;
  branch: Partial<Branch>;
}

interface BusinessSeedDef {
  ownerEmail: string;
  business: Partial<Business>;
  branches: BranchSeedDef[];
  categoryName: string;
  subcategoryName?: string;
  categories: { key: string; name: string }[];
  items: ItemSeed[];
  offers: OfferSeed[];
}

const BUSINESS_DEFS: BusinessSeedDef[] = [
  {
    ownerEmail: 'sundaypatrick406@gmail.com',
    categoryName: 'Food & Beverage',
    subcategoryName: 'Restaurant',
    business: {
      name: 'Patrick Ventures',
      description:
        'A modern kitchen and grill house serving smash burgers, wood-fired pizza and comfort classics in Wuse 2, Abuja.',
      logoUrl: IMG.restaurantInterior,
      address: '1 Adetokunbo Ademola Crescent, Wuse 2',
      state: 'Federal Capital Territory',
      city: 'Abuja',
      latitude: 9.0718,
      longitude: 7.4843,
      phone: '+2348091110001',
      whatsappNumber: '+2348091110001',
      officialEmail: 'hello@patrickventures.ng',
      website: 'https://patrickventures.ng',
      isVerified: true,
      isVisible: true,
      socials: {
        instagram: 'https://instagram.com/patrickventures',
        twitter: 'https://twitter.com/patrickventures',
      },
      openingHours: {
        monday: { from: '10:00', to: '22:00' },
        tuesday: { from: '10:00', to: '22:00' },
        wednesday: { from: '10:00', to: '22:00' },
        thursday: { from: '10:00', to: '22:00' },
        friday: { from: '10:00', to: '22:00' },
        saturday: { from: '10:00', to: '23:00' },
        sunday: { from: '12:00', to: '21:00' },
      },
      posSettings: {
        currency: 'NGN',
        taxEnabled: true,
        taxRate: 7.5,
        taxLabel: 'VAT',
        receiptHeader: 'Patrick Ventures',
        loyaltyEnabled: true,
        lowStockAlerts: true,
      },
    },
    branches: [
      {
        key: 'wuse',
        isMain: true,
        branch: {
          name: 'Main Branch',
          address: '1 Adetokunbo Ademola Crescent, Wuse 2',
          state: 'Federal Capital Territory',
          city: 'Abuja',
          latitude: 9.0718,
          longitude: 7.4843,
          logoUrl: IMG.restaurantInterior,
          phone: '+2348091110001',
          whatsappNumber: '+2348091110001',
          officialEmail: 'hello@patrickventures.ng',
          website: 'https://patrickventures.ng',
          about:
            'The flagship Patrick Ventures kitchen in Wuse 2: dine-in, takeaway and private catering across Abuja.',
          businessHours: {
            monday: { from: '10:00', to: '22:00' },
            tuesday: { from: '10:00', to: '22:00' },
            wednesday: { from: '10:00', to: '22:00' },
            thursday: { from: '10:00', to: '22:00' },
            friday: { from: '10:00', to: '22:00' },
            saturday: { from: '10:00', to: '23:00' },
            sunday: { from: '12:00', to: '21:00' },
          },
          engagement: {
            instagram: 'https://instagram.com/patrickventures',
            reviewUrl: 'https://g.page/r/patrickventures',
          },
        },
      },
      {
        key: 'apo',
        username: 'patrick-apo',
        isMain: false,
        branch: {
          name: 'Apo Branch',
          address: 'Apo Roundabout, Apo',
          state: 'Federal Capital Territory',
          city: 'Abuja',
          latitude: 9.0133,
          longitude: 7.4911,
          logoUrl: IMG.restaurantWarm,
          phone: '+2348091110003',
          whatsappNumber: '+2348091110003',
          officialEmail: 'apo@patrickventures.ng',
          website: 'https://patrickventures.ng',
          about:
            'Patrick Ventures Apo: quick-service grill and takeaway outlet at Apo Roundabout.',
          businessHours: {
            monday: { from: '10:00', to: '22:00' },
            tuesday: { from: '10:00', to: '22:00' },
            wednesday: { from: '10:00', to: '22:00' },
            thursday: { from: '10:00', to: '22:00' },
            friday: { from: '10:00', to: '22:00' },
            saturday: { from: '10:00', to: '23:00' },
            sunday: { from: '12:00', to: '21:00' },
          },
          engagement: {
            instagram: 'https://instagram.com/patrickventures',
            reviewUrl: 'https://g.page/r/patrickventures',
          },
        },
      },
    ],
    categories: [
      { key: 'mains', name: 'Signature Mains' },
      { key: 'treats', name: 'Sides & Treats' },
      { key: 'experiences', name: 'Catering & Experiences' },
    ],
    items: [
      {
        key: 'burger',
        categoryKey: 'mains',
        name: 'Signature Smash Burger',
        price: 6500,
        shortDescription:
          'Double smashed beef patty, aged cheddar and house sauce.',
        description:
          'Two 100g beef patties smashed on a cast-iron griddle, layered with melted aged cheddar, caramelised onions, pickles and our smoky house sauce in a toasted brioche bun. Served with a side of skin-on fries.',
        mainImage: IMG.burger,
        galleryImages: [IMG.friedChicken, IMG.grillPlatter],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        stockQuantity: 45,
        costPrice: 2800,
        minStock: 10,
        brand: 'Patrick Kitchen',
        weight: '380 g',
        dimensions: '12 x 12 x 10 cm',
        variants: [
          { type: 'size', value: 'Single' },
          { type: 'size', value: 'Double' },
        ],
        tags: ['burger', 'beef', 'signature', 'grill'],
        loyaltyPoints: 65,
      },
      {
        key: 'pizza',
        categoryKey: 'mains',
        name: 'Pepperoni Feast Pizza',
        price: 12000,
        shortDescription:
          'Wood-fired 12-inch pizza loaded with spicy pepperoni.',
        description:
          'Hand-stretched dough fermented for 48 hours, topped with San Marzano tomato sauce, mozzarella and a generous layer of spicy beef pepperoni. Baked in a wood-fired oven for a crisp, charred crust.',
        mainImage: IMG.pizza,
        galleryImages: [IMG.pasta, IMG.salad],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        stockQuantity: 30,
        costPrice: 5200,
        minStock: 8,
        brand: 'Patrick Kitchen',
        weight: '1.2 kg',
        dimensions: '32 x 32 x 4 cm',
        variants: [
          { type: 'size', value: '12 inch' },
          { type: 'crust', value: 'Classic' },
          { type: 'crust', value: 'Thin' },
        ],
        tags: ['pizza', 'pepperoni', 'wood-fired'],
        loyaltyPoints: 120,
      },
      {
        key: 'pasta',
        categoryKey: 'mains',
        name: 'Creamy Alfredo Pasta',
        price: 9500,
        shortDescription: 'Fettuccine tossed in a rich parmesan cream sauce.',
        description:
          'Fresh fettuccine folded through a slow-simmered parmesan cream sauce with garlic butter, sautéed mushrooms and grilled chicken breast. Finished with cracked black pepper and parsley.',
        mainImage: IMG.pasta,
        galleryImages: [IMG.salad, IMG.restaurantWarm],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.NONE,
        stockQuantity: 25,
        costPrice: 3800,
        minStock: 6,
        brand: 'Patrick Kitchen',
        weight: '550 g',
        tags: ['pasta', 'chicken', 'creamy'],
        loyaltyPoints: 95,
      },
      {
        key: 'wings',
        categoryKey: 'mains',
        name: 'Peri-Peri Chicken Wings',
        price: 8000,
        shortDescription: 'Char-grilled wings glazed in fiery peri-peri sauce.',
        description:
          'Eight juicy chicken wings marinated for 12 hours, char-grilled and tossed in our house peri-peri glaze. Served with cooling ranch dip and celery sticks.',
        mainImage: IMG.wings,
        galleryImages: [IMG.friedChicken, IMG.grillPlatter],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.FIXED,
        discountValue: 500,
        stockQuantity: 60,
        costPrice: 3400,
        minStock: 12,
        brand: 'Patrick Kitchen',
        weight: '700 g',
        tags: ['chicken', 'spicy', 'grill', 'wings'],
        loyaltyPoints: 80,
      },
      {
        key: 'cake',
        categoryKey: 'treats',
        name: 'Chocolate Fudge Cake',
        price: 4500,
        shortDescription: 'Decadent triple-layer chocolate fudge cake slice.',
        description:
          'Three layers of moist dark chocolate sponge filled and frosted with silky fudge ganache, served slightly warm with a dusting of cocoa. Baked fresh every morning.',
        mainImage: IMG.cake,
        galleryImages: [IMG.cheesecake, IMG.coffee],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.NONE,
        stockQuantity: 20,
        costPrice: 1500,
        minStock: 5,
        brand: 'Patrick Bakery',
        weight: '180 g',
        tags: ['dessert', 'cake', 'chocolate'],
        loyaltyPoints: 45,
      },
      {
        key: 'smoothie',
        categoryKey: 'treats',
        name: 'Fresh Mango Smoothie',
        price: 3500,
        shortDescription: 'Chilled mango smoothie blended with yoghurt.',
        description:
          'Ripe Nigerian mangoes blended with creamy yoghurt, a squeeze of lime and a touch of honey. No added sugar, served ice-cold in a 500ml cup.',
        mainImage: IMG.smoothie,
        galleryImages: [IMG.juice, IMG.cocktail],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.NONE,
        stockQuantity: 40,
        costPrice: 1200,
        minStock: 10,
        brand: 'Patrick Kitchen',
        weight: '500 ml',
        tags: ['drink', 'smoothie', 'mango'],
        loyaltyPoints: 35,
      },
      {
        key: 'catering',
        categoryKey: 'experiences',
        name: 'Private Event Catering',
        price: 150000,
        shortDescription:
          'Full-service catering for birthdays, corporate and private events.',
        description:
          'Our team brings the Patrick Ventures kitchen to your venue: live grill station, buffet setup, service staff and custom menus for 20 to 200 guests. Price starts from ₦150,000 and is finalised after a tasting session.',
        mainImage: IMG.restaurantLounge,
        galleryImages: [
          IMG.restaurantTable,
          IMG.restaurantWarm,
          IMG.grillPlatter,
        ],
        itemType: CatalogueItemType.SERVICE,
        discountType: DiscountType.NONE,
        tags: ['catering', 'events', 'private-dining'],
        priceType: ServicePriceType.STARTING_FROM,
        priceRangeMin: 150000,
        priceRangeMax: 1500000,
        duration: '3 hours',
        serviceMode: ServiceMode.CUSTOMER,
        isBookable: true,
        bookingMethod: ServiceBookingMethod.VEMTAP,
      },
      {
        key: 'chefs-table',
        categoryKey: 'experiences',
        name: "Chef's Table Experience",
        price: 45000,
        shortDescription: 'Seven-course tasting menu at the chef’s counter.',
        description:
          'An intimate seven-course tasting menu served at the pass, with the head chef introducing each course. Includes a welcome cocktail and wine pairing. Limited to 8 guests per seating.',
        mainImage: IMG.sushi,
        galleryImages: [IMG.latteArt, IMG.cocktail],
        itemType: CatalogueItemType.SERVICE,
        discountType: DiscountType.NONE,
        tags: ['tasting-menu', 'experience', 'fine-dining'],
        priceType: ServicePriceType.FIXED,
        duration: '90 mins',
        serviceMode: ServiceMode.LOCATION,
        isBookable: true,
        bookingMethod: ServiceBookingMethod.VEMTAP,
      },
    ],
    offers: [
      {
        name: 'Burger + Wings Combo',
        description: 'Signature Smash Burger + Peri-Peri Wings at 20% off.',
        longDescription:
          'The perfect duo: our best-selling Signature Smash Burger paired with eight peri-peri chicken wings, 20% off when you order them together. Available for dine-in, takeaway and delivery.',
        pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
        discountValue: 20,
        itemKeys: ['burger', 'wings'],
        mainImage: IMG.burger,
        galleryImages: [IMG.wings, IMG.friedChicken, IMG.grillPlatter],
        quantity: 100,
        maxClaimsPerCustomer: 2,
        isFeatured: true,
        loyaltyPoints: 150,
        views: 186,
        visits: 21,
        likesCount: 32,
        dislikesCount: 1,
        daysLeft: 30,
        delivery: {
          scope: 'city_wide',
          radius: 10,
          unit: 'km',
          minOrderAmount: 5000,
        },
      },
      {
        name: 'Family Pizza Night',
        description: '₦2,500 off any pizza + pasta order for the family.',
        longDescription:
          'Friday just got better. Order the Pepperoni Feast Pizza with a Creamy Alfredo Pasta and get ₦2,500 off the total. Feeds 3–4 people.',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT,
        discountValue: 2500,
        itemKeys: ['pizza', 'pasta'],
        mainImage: IMG.pizza,
        galleryImages: [IMG.pasta, IMG.restaurantTable],
        quantity: 50,
        maxClaimsPerCustomer: 1,
        isFeatured: false,
        loyaltyPoints: 200,
        views: 94,
        visits: 9,
        likesCount: 14,
        dislikesCount: 0,
        daysLeft: 21,
        delivery: {
          scope: 'same_area',
          radius: 5,
          unit: 'km',
          minOrderAmount: 8000,
        },
      },
      {
        name: 'Sweet Treat Duo',
        description: 'Chocolate Fudge Cake + Mango Smoothie for a flat ₦6,500.',
        longDescription:
          'Treat yourself: a warm slice of triple-layer chocolate fudge cake and a chilled fresh mango smoothie for one flat price of ₦6,500 instead of ₦8,000.',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE,
        fixedPrice: 6500,
        itemKeys: ['cake', 'smoothie'],
        mainImage: IMG.cake,
        galleryImages: [IMG.smoothie, IMG.cheesecake, IMG.coffee],
        quantity: 40,
        maxClaimsPerCustomer: 1,
        isFeatured: false,
        loyaltyPoints: 80,
        views: 61,
        visits: 5,
        likesCount: 9,
        dislikesCount: 0,
        daysLeft: 45,
      },
      {
        name: 'Apo Lunch Combo',
        branchKey: 'apo',
        description: '15% off the Smash Burger + Mango Smoothie lunch pairing.',
        longDescription:
          'Lunchtime in Apo just got easier: the Signature Smash Burger and a Fresh Mango Smoothie at 15% off, every weekday from 11am to 3pm at our Apo Roundabout outlet.',
        pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
        discountValue: 15,
        itemKeys: ['burger', 'smoothie'],
        mainImage: IMG.burger,
        galleryImages: [IMG.smoothie, IMG.juice],
        quantity: 60,
        maxClaimsPerCustomer: 2,
        isFeatured: false,
        loyaltyPoints: 100,
        views: 88,
        visits: 8,
        likesCount: 12,
        dislikesCount: 0,
        daysLeft: 30,
        delivery: {
          scope: 'city_wide',
          radius: 8,
          unit: 'km',
          minOrderAmount: 4000,
        },
      },
      {
        name: 'Apo Family Grill Night',
        branchKey: 'apo',
        description: '₦1,500 off Peri-Peri Wings + Alfredo Pasta.',
        longDescription:
          'Friday grill night at the Apo outlet: eight peri-peri chicken wings and a Creamy Alfredo Pasta for ₦1,500 less. Perfect for sharing after work.',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT,
        discountValue: 1500,
        itemKeys: ['wings', 'pasta'],
        mainImage: IMG.wings,
        galleryImages: [IMG.pasta, IMG.grillPlatter],
        quantity: 40,
        maxClaimsPerCustomer: 1,
        isFeatured: false,
        loyaltyPoints: 180,
        views: 57,
        visits: 4,
        likesCount: 7,
        dislikesCount: 0,
        daysLeft: 21,
      },
    ],
  },
  {
    ownerEmail: 'sundayochuko101@gmail.com',
    categoryName: 'Retail',
    subcategoryName: 'Clothing Store',
    business: {
      name: 'Ochuko Ventures',
      description:
        'Contemporary fashion and accessories store in Maitama — curated apparel, sneakers and personal styling services.',
      logoUrl: IMG.storeFront,
      address: '56 Gana Street, Maitama',
      state: 'Federal Capital Territory',
      city: 'Abuja',
      latitude: 9.0778,
      longitude: 7.4978,
      phone: '+2348091110002',
      whatsappNumber: '+2348091110002',
      officialEmail: 'hello@ochukoventures.ng',
      website: 'https://ochukoventures.ng',
      isVerified: true,
      isVisible: true,
      socials: {
        instagram: 'https://instagram.com/ochukoventures',
        twitter: 'https://twitter.com/ochukoventures',
      },
      openingHours: {
        monday: { from: '09:00', to: '20:00' },
        tuesday: { from: '09:00', to: '20:00' },
        wednesday: { from: '09:00', to: '20:00' },
        thursday: { from: '09:00', to: '20:00' },
        friday: { from: '09:00', to: '20:00' },
        saturday: { from: '09:00', to: '20:00' },
        sunday: { from: '13:00', to: '18:00' },
      },
      posSettings: {
        currency: 'NGN',
        taxEnabled: true,
        taxRate: 7.5,
        taxLabel: 'VAT',
        receiptHeader: 'Ochuko Ventures',
        loyaltyEnabled: true,
        lowStockAlerts: true,
      },
    },
    branches: [
      {
        key: 'maitama',
        isMain: true,
        branch: {
          name: 'Main Branch',
          address: '56 Gana Street, Maitama',
          state: 'Federal Capital Territory',
          city: 'Abuja',
          latitude: 9.0778,
          longitude: 7.4978,
          logoUrl: IMG.storeFront,
          phone: '+2348091110002',
          whatsappNumber: '+2348091110002',
          officialEmail: 'hello@ochukoventures.ng',
          website: 'https://ochukoventures.ng',
          about:
            'Flagship Ochuko Ventures store in Maitama: curated fashion, footwear and accessories with in-store styling.',
          businessHours: {
            monday: { from: '09:00', to: '20:00' },
            tuesday: { from: '09:00', to: '20:00' },
            wednesday: { from: '09:00', to: '20:00' },
            thursday: { from: '09:00', to: '20:00' },
            friday: { from: '09:00', to: '20:00' },
            saturday: { from: '09:00', to: '20:00' },
            sunday: { from: '13:00', to: '18:00' },
          },
          engagement: {
            instagram: 'https://instagram.com/ochukoventures',
            reviewUrl: 'https://g.page/r/ochukoventures',
          },
        },
      },
    ],
    categories: [
      { key: 'apparel', name: 'Apparel' },
      { key: 'accessories', name: 'Accessories' },
      { key: 'services', name: 'Personal Services' },
    ],
    items: [
      {
        key: 'jacket',
        categoryKey: 'apparel',
        name: 'Classic Denim Jacket',
        price: 18500,
        shortDescription:
          'Washed indigo denim jacket with a relaxed unisex fit.',
        description:
          'A wardrobe staple cut from 12oz washed indigo denim with antique brass buttons, twin chest pockets and an adjustable waist tab. Relaxed unisex fit that layers over everything.',
        mainImage: IMG.denimJacket,
        galleryImages: [IMG.tshirt, IMG.jeans],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        stockQuantity: 18,
        costPrice: 9000,
        minStock: 4,
        brand: 'Ochuko Studio',
        dimensions: 'One size range S–XL',
        variants: [
          { type: 'size', value: 'S' },
          { type: 'size', value: 'M' },
          { type: 'size', value: 'L' },
          { type: 'size', value: 'XL' },
        ],
        tags: ['denim', 'jacket', 'unisex'],
        loyaltyPoints: 185,
      },
      {
        key: 'sneakers',
        categoryKey: 'apparel',
        name: 'Urban Runner Sneakers',
        price: 32000,
        shortDescription: 'Lightweight knit runners with cushioned soles.',
        description:
          'Breathable knit upper with a foam-cushioned midsole and grippy rubber outsole. Designed for all-day comfort — from market runs to gym sessions.',
        mainImage: IMG.sneakers,
        galleryImages: [IMG.shoes, IMG.clothingRack],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.FIXED,
        discountValue: 3000,
        stockQuantity: 12,
        costPrice: 17000,
        minStock: 3,
        brand: 'Ochuko Studio',
        weight: '620 g',
        dimensions: '30 x 18 x 11 cm',
        variants: [
          { type: 'size', value: '41' },
          { type: 'size', value: '42' },
          { type: 'size', value: '43' },
          { type: 'size', value: '44' },
        ],
        tags: ['sneakers', 'shoes', 'sport'],
        loyaltyPoints: 320,
      },
      {
        key: 'bag',
        categoryKey: 'accessories',
        name: 'Leather Crossbody Bag',
        price: 24000,
        shortDescription:
          'Hand-finished leather crossbody with brass hardware.',
        description:
          'Full-grain leather crossbody bag with an adjustable strap, brass zip pulls and a suede-lined interior pocket for cards and phone. Hand-finished edges.',
        mainImage: IMG.bag,
        galleryImages: [IMG.watch, IMG.sunglasses],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.NONE,
        stockQuantity: 9,
        costPrice: 11000,
        minStock: 2,
        brand: 'Ochuko Studio',
        dimensions: '24 x 17 x 8 cm',
        variants: [
          { type: 'colour', value: 'Tan' },
          { type: 'colour', value: 'Black' },
        ],
        tags: ['bag', 'leather', 'accessories'],
        loyaltyPoints: 240,
      },
      {
        key: 'sunglasses',
        categoryKey: 'accessories',
        name: 'Aviator Sunglasses',
        price: 9500,
        shortDescription: 'UV400 aviators with a gold metal frame.',
        description:
          'Classic aviator silhouette with polarised UV400 lenses, a lightweight gold-tone metal frame and adjustable silicone nose pads. Includes a hard case and microfibre cloth.',
        mainImage: IMG.sunglasses,
        galleryImages: [IMG.bag, IMG.jewelry],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        stockQuantity: 22,
        costPrice: 3200,
        minStock: 5,
        brand: 'Ochuko Studio',
        weight: '90 g',
        tags: ['sunglasses', 'accessories', 'summer'],
        loyaltyPoints: 95,
      },
      {
        key: 'scarf',
        categoryKey: 'accessories',
        name: 'Cashmere Blend Scarf',
        price: 7500,
        shortDescription: 'Soft cashmere-wool blend scarf in oatmeal.',
        description:
          'A featherweight cashmere-wool blend scarf with hand-rolled edges. Warm without bulk — perfect for harmattan mornings and air-conditioned offices.',
        mainImage: IMG.clothingRack,
        galleryImages: [IMG.dress, IMG.heels],
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.NONE,
        stockQuantity: 15,
        costPrice: 2900,
        minStock: 4,
        brand: 'Ochuko Studio',
        dimensions: '180 x 35 cm',
        variants: [
          { type: 'colour', value: 'Oatmeal' },
          { type: 'colour', value: 'Charcoal' },
        ],
        tags: ['scarf', 'cashmere', 'accessories'],
        loyaltyPoints: 75,
      },
      {
        key: 'styling',
        categoryKey: 'services',
        name: 'Personal Styling Session',
        price: 10000,
        shortDescription: 'One-on-one styling session with a personal shopper.',
        description:
          'A 60-minute session with our in-house stylist: wardrobe review, body-shape analysis and a curated shopping list. Includes 10% off anything purchased during the session. Available in-store or online via video call.',
        mainImage: IMG.salon,
        galleryImages: [IMG.clothingRack, IMG.makeup],
        itemType: CatalogueItemType.SERVICE,
        discountType: DiscountType.NONE,
        tags: ['styling', 'personal-shopper', 'fashion'],
        priceType: ServicePriceType.RANGE,
        priceRangeMin: 10000,
        priceRangeMax: 25000,
        duration: '60 mins',
        serviceMode: ServiceMode.FLEXIBLE,
        isBookable: true,
        bookingMethod: ServiceBookingMethod.VEMTAP,
      },
      {
        key: 'tailoring',
        categoryKey: 'services',
        name: 'Bespoke Tailoring',
        price: 45000,
        shortDescription:
          'Made-to-measure garments tailored to your exact fit.',
        description:
          'From measurements to final fitting: agbada, suits, dresses and shirts cut and sewn to your exact measurements. Fabric consultation included; price starts from ₦45,000 depending on fabric and style.',
        mainImage: IMG.tailor,
        galleryImages: [IMG.barber, IMG.nails],
        itemType: CatalogueItemType.SERVICE,
        discountType: DiscountType.NONE,
        tags: ['tailoring', 'bespoke', 'made-to-measure'],
        priceType: ServicePriceType.STARTING_FROM,
        priceRangeMin: 45000,
        priceRangeMax: 350000,
        duration: '2 weeks',
        serviceMode: ServiceMode.LOCATION,
        isBookable: true,
        bookingMethod: ServiceBookingMethod.WHATSAPP,
      },
    ],
    offers: [
      {
        name: 'Style Refresh Bundle',
        description: 'Denim Jacket + Cashmere Scarf together at 25% off.',
        longDescription:
          'Refresh your rotation: the Classic Denim Jacket and Cashmere Blend Scarf bundled at 25% off. Mix and match sizes and colours at checkout.',
        pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
        discountValue: 25,
        itemKeys: ['jacket', 'scarf'],
        mainImage: IMG.denimJacket,
        galleryImages: [IMG.clothingRack, IMG.tshirt, IMG.jeans],
        quantity: 80,
        maxClaimsPerCustomer: 1,
        isFeatured: true,
        loyaltyPoints: 250,
        views: 142,
        visits: 12,
        likesCount: 21,
        dislikesCount: 0,
        daysLeft: 30,
      },
      {
        name: 'Sneaker + Shades Steal',
        description: '₦5,000 off when you pair the runners with aviators.',
        longDescription:
          'Upgrade your everyday fit: Urban Runner Sneakers paired with Aviator Sunglasses for ₦5,000 less than buying them separately.',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT,
        discountValue: 5000,
        itemKeys: ['sneakers', 'sunglasses'],
        mainImage: IMG.sneakers,
        galleryImages: [IMG.sunglasses, IMG.shoes],
        quantity: 40,
        maxClaimsPerCustomer: 1,
        isFeatured: false,
        loyaltyPoints: 300,
        views: 73,
        visits: 6,
        likesCount: 11,
        dislikesCount: 1,
        daysLeft: 21,
        delivery: {
          scope: 'nation_wide',
          radius: 50,
          unit: 'km',
          minOrderAmount: 20000,
        },
      },
      {
        name: 'Full Look Fixed Deal',
        description: 'Jacket + Sneakers + Crossbody Bag for a flat ₦42,000.',
        longDescription:
          'The complete look, one flat price: Classic Denim Jacket, Urban Runner Sneakers and the Leather Crossbody Bag for ₦42,000 — a saving of over ₦32,000.',
        pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE,
        fixedPrice: 42000,
        itemKeys: ['jacket', 'sneakers', 'bag'],
        mainImage: IMG.bag,
        galleryImages: [IMG.denimJacket, IMG.sneakers, IMG.storeFront],
        quantity: 30,
        maxClaimsPerCustomer: 1,
        isFeatured: false,
        loyaltyPoints: 420,
        views: 58,
        visits: 4,
        likesCount: 8,
        dislikesCount: 0,
        daysLeft: 45,
      },
    ],
  },
];

function calculateCalculatedPrice(
  pricingType: CatalogueOfferPricingType,
  sum: number,
  discountValue?: number,
  fixedPrice?: number,
): number {
  const round2 = (v: number) => Math.round(v * 100) / 100;
  switch (pricingType) {
    case CatalogueOfferPricingType.PERCENTAGE_DISCOUNT:
      return round2(sum * (1 - (discountValue ?? 0) / 100));
    case CatalogueOfferPricingType.FIXED_DISCOUNT_AMOUNT:
      return round2(Math.max(0, sum - (discountValue ?? 0)));
    case CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE:
      return round2(fixedPrice ?? sum);
    default:
      return round2(sum);
  }
}

async function seedBusiness(
  manager: EntityManager,
  def: BusinessSeedDef,
): Promise<{ items: number; offers: number }> {
  const owner = await manager.findOne(User, {
    where: { email: def.ownerEmail },
  });
  if (!owner) {
    throw new Error(`Owner not found: ${def.ownerEmail}`);
  }

  const business = await manager.findOne(Business, {
    where: { ownerId: owner.id },
  });
  if (!business) {
    throw new Error(`Business not found for owner: ${def.ownerEmail}`);
  }

  const category = await manager.findOne(Category, {
    where: { name: def.categoryName },
  });
  const subcategory = def.subcategoryName
    ? await manager.findOne(Subcategory, {
        where: { name: def.subcategoryName, categoryId: category?.id },
      })
    : null;

  await manager.update(Business, business.id, {
    ...def.business,
    categoryId: category?.id,
    subcategoryId: subcategory?.id,
  } as any);

  const branchMap = new Map<string, Branch>();
  let mainBranch: Branch | null = null;

  for (const branchDef of def.branches) {
    let branch: Branch | null = await manager.findOne(Branch, {
      where: branchDef.isMain
        ? { businessId: business.id, isMainBranch: true }
        : { businessId: business.id, username: branchDef.username },
    });

    if (!branch) {
      branch = await manager.save(
        manager.create(Branch, {
          name: branchDef.branch.name,
          username: branchDef.username,
          businessId: business.id,
        }),
      );
      console.log(`  Created branch "${branchDef.branch.name}"`);
    }

    await manager.query(
      `UPDATE branches SET
         name = $1, address = $2, state = $3, city = $4,
         latitude = $5::numeric, longitude = $6::numeric,
         "logoUrl" = $7, phone = $8, "whatsappNumber" = $9,
         "officialEmail" = $10, website = $11, about = $12,
         "businessHours" = $13::jsonb, engagement = $14::jsonb,
         location = ST_SetSRID(ST_MakePoint($6::float8, $5::float8), 4326)::geography,
         "isActive" = true, "isMainBranch" = $15::boolean,
         "joinDiscoveryNetwork" = true, "allowPromotions" = true,
         "receivePartnerRequests" = true
       WHERE id = $16::uuid`,
      [
        branchDef.branch.name,
        branchDef.branch.address,
        branchDef.branch.state,
        branchDef.branch.city,
        branchDef.branch.latitude,
        branchDef.branch.longitude,
        branchDef.branch.logoUrl,
        branchDef.branch.phone,
        branchDef.branch.whatsappNumber,
        branchDef.branch.officialEmail,
        branchDef.branch.website,
        branchDef.branch.about,
        JSON.stringify(branchDef.branch.businessHours),
        JSON.stringify(branchDef.branch.engagement),
        branchDef.isMain,
        branch.id,
      ],
    );

    branchMap.set(branchDef.key, branch);
    if (branchDef.isMain) mainBranch = branch;
  }

  if (!mainBranch) {
    throw new Error(`No main branch defined for business: ${business.name}`);
  }

  await manager.delete(CatalogueOffer, { businessId: business.id });
  await manager.delete(CatalogueItem, { businessId: business.id });
  await manager.delete(CatalogueCategory, { businessId: business.id });

  const categoryMap = new Map<string, CatalogueCategory>();
  for (const cat of def.categories) {
    const saved = await manager.save(
      manager.create(CatalogueCategory, {
        name: cat.name,
        businessId: business.id,
      }),
    );
    categoryMap.set(cat.key, saved);
  }

  const itemMap = new Map<string, CatalogueItem>();
  let skuIndex = 1;
  for (const item of def.items) {
    const sku = `DEMO-${business.uniqueCode.slice(0, 3)}-${String(
      skuIndex,
    ).padStart(2, '0')}`;
    const saved = await manager.save(
      manager.create(CatalogueItem, {
        name: item.name,
        price: item.price,
        shortDescription: item.shortDescription,
        description: item.description,
        mainImage: item.mainImage,
        galleryImages: item.galleryImages,
        businessId: business.id,
        categoryId: categoryMap.get(item.categoryKey)?.id,
        status: CatalogueItemStatus.ACTIVE,
        itemType: item.itemType,
        sku,
        barcode: `VMT${String(skuIndex).padStart(4, '0')}${business.uniqueCode.slice(0, 3)}`,
        discountType: item.discountType,
        discountValue: item.discountValue ?? null,
        stockQuantity: item.stockQuantity,
        costPrice: item.costPrice ?? null,
        minStock: item.minStock ?? null,
        brand: item.brand,
        weight: item.weight,
        dimensions: item.dimensions,
        variants: item.variants,
        tags: item.tags,
        allowBackOrder: true,
        enableLoyaltyPoints: item.loyaltyPoints != null,
        loyaltyPoints: item.loyaltyPoints ?? null,
        loyaltyPointsValue: item.loyaltyPoints ?? null,
        priceType: item.priceType ?? ServicePriceType.FIXED,
        priceRangeMin: item.priceRangeMin ?? null,
        priceRangeMax: item.priceRangeMax ?? null,
        duration: item.duration ?? null,
        serviceMode: item.serviceMode ?? ServiceMode.LOCATION,
        isBookable: item.isBookable ?? false,
        bookingMethod: item.bookingMethod ?? null,
      }),
    );
    for (const branch of branchMap.values()) {
      await manager.query(
        `INSERT INTO catalogue_item_branches ("itemId", "branchId") VALUES ($1::uuid, $2::uuid)`,
        [saved.id, branch.id],
      );
    }
    itemMap.set(item.key, saved);
    skuIndex++;
  }

  let offerIndex = 1;
  for (const offer of def.offers) {
    const offerBranch = offer.branchKey
      ? branchMap.get(offer.branchKey)
      : mainBranch;
    if (!offerBranch) {
      throw new Error(`Offer branch not found: ${offer.branchKey}`);
    }
    const items = offer.itemKeys.map((key) => {
      const found = itemMap.get(key);
      if (!found) throw new Error(`Offer item not found: ${key}`);
      return found;
    });
    const sum = items.reduce((acc, it) => acc + Number(it.price || 0), 0);
    const calculatedPrice = calculateCalculatedPrice(
      offer.pricingType,
      sum,
      offer.discountValue,
      offer.fixedPrice,
    );

    await manager.save(
      manager.create(CatalogueOffer, {
        name: offer.name,
        description: offer.description,
        longDescription: offer.longDescription,
        mainImage: offer.mainImage,
        galleryImages: offer.galleryImages,
        quantity: offer.quantity,
        pricingType: offer.pricingType,
        discountValue: offer.discountValue ?? undefined,
        fixedPrice: offer.fixedPrice ?? undefined,
        calculatedPrice,
        loyaltyPoints: offer.loyaltyPoints,
        businessId: business.id,
        branchId: offerBranch.id,
        status: CatalogueOfferStatus.ACTIVE,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + offer.daysLeft * 24 * 60 * 60 * 1000),
        offerType: 'discount',
        audience: 'everyone_nearby',
        audienceTarget: 'all',
        terms: [
          'Valid during the stated promotion period.',
          'Cannot be combined with other offers.',
          'One redemption per customer unless stated otherwise.',
          'Redeemable at the branch while stock lasts.',
        ],
        claimCodePrefix: `VEM${offerIndex}`,
        maxClaimsPerCustomer: offer.maxClaimsPerCustomer,
        deliveryScope: offer.delivery?.scope ?? null,
        deliveryRadius: offer.delivery?.radius ?? null,
        deliveryUnit: offer.delivery?.unit ?? null,
        deliveryRegion: offer.delivery ? 'Abuja' : null,
        minOrderAmount: offer.delivery?.minOrderAmount ?? null,
        isFeatured: offer.isFeatured,
        views: offer.views,
        visits: offer.visits,
        likesCount: offer.likesCount,
        dislikesCount: offer.dislikesCount,
        revenue: 0,
        sourceProductId: items.length === 1 ? items[0].id : null,
        items,
      }),
    );
    offerIndex++;
  }

  return { items: def.items.length, offers: def.offers.length };
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  const dataSource = app.get(DataSource);

  await dataSource.transaction(async (manager) => {
    for (const def of BUSINESS_DEFS) {
      const result = await seedBusiness(manager, def);
      console.log(
        `${def.business.name}: ${result.items} catalogue items, ${result.offers} deals`,
      );
    }
  });

  console.log('Catalogue seeding complete!');
  await app.close();
  process.exit(0);
}

bootstrap().catch((error) => {
  console.error('Catalogue seeding failed:', error);
  process.exit(1);
});
