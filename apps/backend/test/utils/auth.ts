import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { SubscriptionsService } from '../../src/modules/subscriptions/subscriptions.service';
import { Plan } from '../../src/modules/subscriptions/entities/plan.entity';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

async function ensureFreePlanExists(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const planRepo = dataSource.getRepository(Plan);

  const existing = await planRepo.findOne({ where: { isFree: true } });
  if (!existing) {
    await planRepo.save(
      planRepo.create({
        name: 'Free Plan',
        isFree: true,
        isActive: true,
        catalogueEnabled: true,
        loyaltyEnabled: true,
        messagingEnabled: true,
        branchesEnabled: true,
        automationsEnabled: true,
        analyticsEnabled: true,
        teamMembersEnabled: true,
        branchLimit: 10,
        maxCatalogueItems: 1000,
        maxCatalogueCategories: 100,
        maxCatalogueOffers: 50,
        smsCredits: 100,
        emailCredits: 1000,
        whatsappCredits: 50,
      }),
    );
  } else if (!existing.catalogueEnabled) {
    // Update existing plan if it doesn't have catalogue enabled
    existing.catalogueEnabled = true;
    existing.isActive = true;
    await planRepo.save(existing);
  }
}

export async function createAuthenticatedUser(
  app: INestApplication,
  role: UserRole = UserRole.CUSTOMER,
  branchId?: string,
) {
  await ensureFreePlanExists(app);
  
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);
  const businessRepo = dataSource.getRepository(Business);
  const branchRepo = dataSource.getRepository(Branch);

  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const timestamp = Date.now() + Math.floor(Math.random() * 1000);
  const user = userRepo.create({
    email: `test-${role.toLowerCase()}-${timestamp}@example.com`,
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
    role,
    status: UserStatus.ACTIVE,
    branchId,
  });

  await userRepo.save(user);

  // If Owner, they NEED a business and a main branch to function in the new architecture
  if (role === UserRole.OWNER && !branchId) {
    const business = (await businessRepo.save(
      businessRepo.create({
        name: `Test Business ${timestamp}`,
        ownerId: user.id,
      } as any),
    )) as any;

    const branch = (await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: business.id,
        isMainBranch: true,
      } as any),
    )) as any;

    user.branchId = branch.id;
    user.businessId = business.id;
    await userRepo.save(user);

    // Auto-subscribe to free plan to enable catalogue and other features
    const subService = app.get(SubscriptionsService);
    try {
      await subService.subscribeToFreePlan(business.id);
    } catch (e) {
      console.warn('Failed to auto-subscribe in test helper:', e.message);
    }
  }

  // Login to get token (Token will now contain branchId and businessId)
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      identifier: user.email,
      password: password,
    })
    .expect(200);

  return {
    user,
    token: response.body.access_token,
    response: response.body,
  };
}
