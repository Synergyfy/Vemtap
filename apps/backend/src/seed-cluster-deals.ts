import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserRole,
  UserStatus,
} from './modules/users/entities/user.entity';
import {
  Business,
  BusinessStatus,
} from './modules/businesses/entities/business.entity';
import { Branch } from './modules/branches/entities/branch.entity';
import {
  Cluster,
  ClusterType,
} from './modules/clusters/entities/cluster.entity';
import { ClusterOffer } from './modules/clusters/entities/cluster-offer.entity';
import {
  CatalogueItem,
  CatalogueItemStatus,
  CatalogueItemType,
  DiscountType,
} from './modules/catalogue/entities/catalogue-item.entity';
import {
  CatalogueOffer,
  CatalogueOfferPricingType,
  CatalogueOfferStatus,
} from './modules/catalogue/entities/catalogue-offer.entity';

const PASSWORD = 'password123';
const MARKER_CODE = 'CL-TEST00001';

interface ClusterSeedDef {
  code: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  description: string;
}

interface BranchSeedDef {
  ownerIndex: number;
  name: string;
  username: string;
  clusterIndex: number;
  address: string;
  lat: number;
  lng: number;
  isMainBranch: boolean;
  offer: {
    name: string;
    description: string;
    pricingType: CatalogueOfferPricingType;
    discountValue?: number;
    fixedPrice?: number;
    endDate: Date | null;
    itemPrices: number[];
  };
}

const CLUSTERS: ClusterSeedDef[] = [
  {
    code: 'CL-TEST00001',
    name: 'Banex Market Deals',
    area: 'Banex',
    lat: 9.0234,
    lng: 7.4832,
    radiusMeters: 1500,
    description: 'Test cluster: market deals around Banex Plaza.',
  },
  {
    code: 'CL-TEST00002',
    name: 'Ikeja City Mall Deals',
    area: 'Ikeja',
    lat: 6.6018,
    lng: 3.3515,
    radiusMeters: 1500,
    description: 'Test cluster: deals around Ikeja City Mall.',
  },
  {
    code: 'CL-TEST00003',
    name: 'Lekki Phase One Deals',
    area: 'Lekki',
    lat: 6.4463,
    lng: 3.4709,
    radiusMeters: 1500,
    description: 'Test cluster: deals around Lekki Phase One.',
  },
];

const OWNERS = [
  {
    email: 'cluster.owner1@test.local',
    firstName: 'Bolu',
    lastName: 'Okafor',
    businessName: 'Banex Grill House',
  },
  {
    email: 'cluster.owner2@test.local',
    firstName: 'Amina',
    lastName: 'Yusuf',
    businessName: 'Ikeja Fashion Hub',
  },
  {
    email: 'cluster.owner3@test.local',
    firstName: 'Chidi',
    lastName: 'Nwosu',
    businessName: 'Lekki Coffee Lab',
  },
];

const BRANCHES: BranchSeedDef[] = [
  {
    ownerIndex: 0,
    name: 'Banex Grill House HQ',
    username: 'banex-grill-hq',
    clusterIndex: 0,
    address: 'Banex Plaza, Aminu Kano Crescent',
    lat: 9.0234,
    lng: 7.4832,
    isMainBranch: true,
    offer: {
      name: '20% off Smoky Burger Combo',
      description: 'Get 20% off our signature smoky burger combo at Banex.',
      pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
      discountValue: 20,
      endDate: null,
      itemPrices: [4500, 1800],
    },
  },
  {
    ownerIndex: 1,
    name: 'Ikeja Fashion Hub Main',
    username: 'ikeja-fashion-main',
    clusterIndex: 1,
    address: 'Ikeja City Mall, Alausa',
    lat: 6.6018,
    lng: 3.3515,
    isMainBranch: true,
    offer: {
      name: 'Fixed Price Ankara Gown',
      description: 'Ankara gowns at a fixed price at Ikeja City Mall.',
      pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE,
      fixedPrice: 12500,
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      itemPrices: [15000, 3500],
    },
  },
  {
    ownerIndex: 2,
    name: 'Lekki Coffee Lab Main',
    username: 'lekki-coffee-main',
    clusterIndex: 2,
    address: 'Lekki Phase One, Admiralty Way',
    lat: 6.4463,
    lng: 3.4709,
    isMainBranch: true,
    offer: {
      name: 'Buy 1 Get 1 Cold Brew',
      description: 'Buy one cold brew, get one free at Lekki Coffee Lab.',
      pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
      discountValue: 50,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      itemPrices: [3000, 3000],
    },
  },
  {
    ownerIndex: 1,
    name: 'Banex Fashion Outlet',
    username: 'banex-fashion-outlet',
    clusterIndex: 0,
    address: 'Banex Plaza, Wuse II',
    lat: 9.024,
    lng: 7.4838,
    isMainBranch: false,
    offer: {
      name: '15% off Casual Wear',
      description:
        'Season clearance: 15% off all casual wear at our Banex outlet.',
      pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
      discountValue: 15,
      endDate: null,
      itemPrices: [8000, 6000],
    },
  },
  {
    ownerIndex: 2,
    name: 'Ikeja Coffee Kiosk',
    username: 'ikeja-coffee-kiosk',
    clusterIndex: 1,
    address: 'Allen Avenue, Ikeja',
    lat: 6.6024,
    lng: 3.3521,
    isMainBranch: false,
    offer: {
      name: 'Fixed Price Pastry + Latte',
      description: 'Pastry and latte combo at a fixed price in Ikeja.',
      pricingType: CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE,
      fixedPrice: 3500,
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      itemPrices: [2000, 2500],
    },
  },
  {
    ownerIndex: 0,
    name: 'Lekki Grill Outlet',
    username: 'lekki-grill-outlet',
    clusterIndex: 2,
    address: 'Lekki Phase One, Chevron Drive',
    lat: 6.4469,
    lng: 3.4715,
    isMainBranch: false,
    offer: {
      name: '25% off Weekend Grill Platter',
      description:
        'Weekend special: 25% off the grill platter at our Lekki outlet.',
      pricingType: CatalogueOfferPricingType.PERCENTAGE_DISCOUNT,
      discountValue: 25,
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      itemPrices: [6000, 2000],
    },
  },
];

async function getAdminId(manager: EntityManager): Promise<string | null> {
  const admin = await manager.findOne(User, {
    where: { role: UserRole.ADMIN },
    select: ['id'],
  });
  return admin?.id ?? null;
}

async function getOrCreateOwner(
  manager: EntityManager,
  def: (typeof OWNERS)[number],
) {
  let owner = await manager.findOne(User, {
    where: { email: def.email },
    relations: ['ownedBusiness'],
  });

  if (owner && owner.ownedBusiness) {
    return { owner, business: owner.ownedBusiness };
  }

  if (!owner) {
    const hashed = await bcrypt.hash(PASSWORD, 10);
    owner = await manager.save(
      manager.create(User, {
        email: def.email,
        password: hashed,
        firstName: def.firstName,
        lastName: def.lastName,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      }),
    );
  }

  const business = await manager.save(
    manager.create(Business, {
      name: def.businessName,
      ownerId: owner.id,
      status: BusinessStatus.ACTIVE,
    }),
  );

  owner.businessId = business.id;
  await manager.save(User, owner);

  return { owner, business };
}

async function seedBranch(
  manager: EntityManager,
  branchDef: BranchSeedDef,
  business: Business,
  cluster: Cluster,
  owner: User,
) {
  const branch = await manager.save(
    manager.create(Branch, {
      name: branchDef.name,
      username: branchDef.username,
      businessId: business.id,
      clusterId: cluster.id,
      address: branchDef.address,
      state: 'Lagos',
      city: cluster.area,
      latitude: branchDef.lat,
      longitude: branchDef.lng,
      isActive: true,
      isMainBranch: branchDef.isMainBranch,
      joinDiscoveryNetwork: true,
      allowPromotions: true,
      receivePartnerRequests: true,
      pushNotifications: true,
      emailSummary: true,
    }),
  );

  if (branchDef.isMainBranch) {
    owner.businessId = business.id;
    owner.branchId = branch.id;
    await manager.save(User, owner);
  }

  const items: CatalogueItem[] = [];
  for (let i = 0; i < branchDef.offer.itemPrices.length; i++) {
    const price = branchDef.offer.itemPrices[i];
    const item = await manager.save(
      manager.create(CatalogueItem, {
        name: `${branchDef.name} Item ${i + 1}`,
        price,
        shortDescription: `Seed catalogue item for ${branchDef.name}`,
        description: `Seed catalogue item for ${branchDef.name}`,
        businessId: business.id,
        status: CatalogueItemStatus.ACTIVE,
        itemType: CatalogueItemType.PRODUCT,
        discountType: DiscountType.NONE,
        sku: `SEED-${cluster.uniqueCode.replace('CL-TEST', '')}-${business.id.slice(0, 4)}-${i + 1}`,
        allowBackOrder: false,
        branches: [branch],
      }),
    );
    items.push(item);
  }

  const sum = branchDef.offer.itemPrices.reduce((a, b) => a + b, 0);
  let calculatedPrice = sum;
  if (
    branchDef.offer.pricingType ===
      CatalogueOfferPricingType.PERCENTAGE_DISCOUNT &&
    branchDef.offer.discountValue != null
  ) {
    calculatedPrice =
      Math.round(sum * (1 - branchDef.offer.discountValue / 100) * 100) / 100;
  } else if (
    branchDef.offer.pricingType ===
      CatalogueOfferPricingType.FIXED_DISCOUNT_PRICE &&
    branchDef.offer.fixedPrice != null
  ) {
    calculatedPrice = branchDef.offer.fixedPrice;
  }

  const offerData: Partial<CatalogueOffer> = {
    name: branchDef.offer.name,
    description: branchDef.offer.description,
    longDescription: branchDef.offer.description,
    branchId: branch.id,
    businessId: business.id,
    status: CatalogueOfferStatus.ACTIVE,
    pricingType: branchDef.offer.pricingType,
    discountValue: branchDef.offer.discountValue ?? undefined,
    fixedPrice: branchDef.offer.fixedPrice ?? undefined,
    calculatedPrice,
    quantity: 50,
    maxClaimsPerCustomer: 1,
    claimCodePrefix: 'VEM',
    offerType: 'discount',
    audience: 'everyone_nearby',
    audienceTarget: 'all',
    terms: [
      'Valid during the stated promotion period.',
      'Cannot be combined with other offers.',
      'Redeemable at the branch while stock lasts.',
    ],
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endDate: branchDef.offer.endDate,
    items,
  };

  const offer = await manager.save(manager.create(CatalogueOffer, offerData));

  return { branch, offer, items };
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const existing = await dataSource.getRepository(Cluster).findOne({
    where: { uniqueCode: MARKER_CODE },
    select: ['id'],
  });
  if (existing) {
    console.log(
      `Seed cluster ${MARKER_CODE} already exists. Skipping seed-cluster-deals.`,
    );
    process.exit(0);
    return;
  }

  await dataSource.transaction(async (manager) => {
    const adminId = await getAdminId(manager);

    const clusters = new Map<string, Cluster>();
    for (const def of CLUSTERS) {
      const cluster = await manager.save(
        manager.create(Cluster, {
          name: def.name,
          uniqueCode: def.code,
          description: def.description,
          type: ClusterType.MARKET,
          country: 'Nigeria',
          state: 'Lagos',
          city: 'Lagos',
          area: def.area,
          latitude: def.lat,
          longitude: def.lng,
          radiusMeters: def.radiusMeters,
          isActive: true,
          qrIsActive: true,
          createdBy: adminId ?? undefined,
        }),
      );
      clusters.set(def.code, cluster);
    }

    const owners = new Map<number, { owner: User; business: Business }>();
    for (let i = 0; i < OWNERS.length; i++) {
      owners.set(i, await getOrCreateOwner(manager, OWNERS[i]));
    }

    const seeded: {
      branch: Branch;
      offer: CatalogueOffer;
      cluster: Cluster;
    }[] = [];
    for (const branchDef of BRANCHES) {
      const { owner, business } = owners.get(branchDef.ownerIndex)!;
      const cluster = clusters.get(CLUSTERS[branchDef.clusterIndex].code)!;
      const result = await seedBranch(
        manager,
        branchDef,
        business,
        cluster,
        owner,
      );
      seeded.push({ ...result, cluster });
    }

    // Pin one offer so the pinned-first ranking path is exercised.
    const pinnedBranch = seeded.find(
      (s) => s.cluster.uniqueCode === 'CL-TEST00002',
    );
    if (pinnedBranch) {
      await manager.save(
        manager.create(ClusterOffer, {
          clusterId: pinnedBranch.cluster.id,
          offerId: pinnedBranch.offer.id,
          isPinned: true,
          pinnedBy: adminId ?? undefined,
          pinnedAt: new Date(),
        }),
      );
    }

    console.log('Cluster deals seed complete:\n');
    for (const cluster of clusters.values()) {
      const memberBranches = seeded.filter((s) => s.cluster.id === cluster.id);
      console.log(`  ${cluster.uniqueCode} · ${cluster.name}`);
      console.log(`    branches: ${memberBranches.length}`);
      console.log(`    offers:   ${memberBranches.length}`);
      console.log(
        `    test:     GET /api/v1/clusters/${cluster.uniqueCode}/deals`,
      );
    }
    console.log('\nOwners (password: password123):');
    for (const { owner } of owners.values()) {
      console.log(`  ${owner.email}`);
    }
  });

  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Cluster deals seed failed:', err);
  process.exit(1);
});
