import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../utils/create-app';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import { Visit } from '../../src/modules/visitors/entities/visit.entity';
import { AuthService } from '../../src/modules/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Visited Branches (E2E)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let businessRepo: Repository<Business>;
  let branchRepo: Repository<Branch>;
  let visitRepo: Repository<Visit>;
  let authService: AuthService;

  let customerToken: string;
  let branch1Id: string;
  let branch2Id: string;
  let customerId: string;

  beforeAll(async () => {
    app = await createTestApp();

    userRepo = app.get(getRepositoryToken(User));
    businessRepo = app.get(getRepositoryToken(Business));
    branchRepo = app.get(getRepositoryToken(Branch));
    visitRepo = app.get(getRepositoryToken(Visit));
    authService = app.get(AuthService);

    const testId = Date.now().toString();
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Owner & Business
    const owner = (await userRepo.save(
      userRepo.create({
        email: `owner-vb-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'Test',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      } as any),
    )) as unknown as User;

    const business = (await businessRepo.save(
      businessRepo.create({
        name: 'VB Test Biz',
        ownerId: owner.id,
      } as any),
    )) as unknown as Business;

    // 2. Create Branches
    const branch1 = (await branchRepo.save(
      branchRepo.create({
        name: 'Branch Alpha',
        businessId: business.id,
        isActive: true,
      } as any),
    )) as unknown as Branch;
    branch1Id = branch1.id;

    const branch2 = (await branchRepo.save(
      branchRepo.create({
        name: 'Branch Beta',
        businessId: business.id,
        isActive: true,
      } as any),
    )) as unknown as Branch;
    branch2Id = branch2.id;

    // 3. Create Customer
    const customer = (await userRepo.save(
      userRepo.create({
        email: `cust-vb-${testId}@test.com`,
        password: hashedPassword,
        firstName: 'Customer',
        lastName: 'Test',
        role: UserRole.CUSTOMER,
        status: UserStatus.ACTIVE,
      } as any),
    )) as unknown as User;
    customerId = customer.id;

    const loginRes = await authService.login({
      identifier: customer.email,
      password,
    });

    customerToken = loginRes.access_token;

    // 4. Create Visits
    // Visit Branch 1 (Older)
    await visitRepo.save(
      visitRepo.create({
        customerId,
        branchId: branch1Id,
        businessId: business.id,
        createdAt: new Date(Date.now() - 10000),
      }),
    );

    // Visit Branch 2 (Newer)
    await visitRepo.save(
      visitRepo.create({
        customerId,
        branchId: branch2Id,
        businessId: business.id,
        createdAt: new Date(Date.now() - 5000),
      }),
    );

    // Visit Branch 1 again (Newest)
    await visitRepo.save(
      visitRepo.create({
        customerId,
        branchId: branch1Id,
        businessId: business.id,
        createdAt: new Date(),
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return visited branches ordered by last visit DESC', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors/visited-branches')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);

    // Branch 1 should be first because its newest visit is most recent
    expect(res.body.data[0].id).toBe(branch1Id);
    expect(res.body.data[0].visitCount).toBe(2);

    expect(res.body.data[1].id).toBe(branch2Id);
    expect(res.body.data[1].visitCount).toBe(1);
  });

  it('should filter visited branches by search', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors/visited-branches?search=Alpha')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Branch Alpha');
  });

  it('should support pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors/visited-branches?page=1&limit=1')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);
  });
});
