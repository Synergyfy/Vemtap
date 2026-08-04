import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../src/modules/branches/entities/branch.entity';
import { Business } from '../src/modules/businesses/entities/business.entity';

describe('Device Tap - Username (e2e)', () => {
  let app: INestApplication;
  let branchRepo: Repository<Branch>;
  let businessRepo: Repository<Business>;
  let testBranch: Branch;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    branchRepo = app.get<Repository<Branch>>(getRepositoryToken(Branch));
    businessRepo = app.get<Repository<Business>>(getRepositoryToken(Business));

    // Create a test business first
    const business = await businessRepo.save(
      businessRepo.create({
        name: 'Test Business',
        officialEmail: 'test@example.com',
        status: 'active' as any,
      }),
    );

    // Create a test branch with username
    testBranch = await branchRepo.save(
      branchRepo.create({
        name: 'Test Branch',
        username: 'test-branch-e2e',
        isActive: true,
        businessId: business.id,
        isMainBranch: true,
      }),
    );
  });

  it('should return context for valid username', async () => {
    return request(app.getHttpServer())
      .get(`/tap/context-by-username/test-branch-e2e`)
      .expect(200)
      .expect((res) => {
        expect(res.body.branch).toBeDefined();
        expect(res.body.device).toBeDefined();
      });
  });

  it('should return 404 for invalid username', async () => {
    return request(app.getHttpServer())
      .get('/tap/context-by-username/nonexistent-username-12345')
      .expect(404);
  });

  it('should return 404 for username with inactive branch', async () => {
    // Create an inactive branch
    const business = await businessRepo.findOne({
      where: { name: 'Test Business' },
    });
    const inactiveBranch = await branchRepo.save(
      branchRepo.create({
        name: 'Inactive Branch',
        username: 'inactive-branch',
        isActive: false,
        businessId: business!.id,
      }),
    );

    return request(app.getHttpServer())
      .get('/tap/context-by-username/inactive-branch')
      .expect(404);
  });

  afterAll(async () => {
    // Cleanup
    if (testBranch) {
      await branchRepo.delete(testBranch.id);
    }
    const business = await businessRepo.findOne({
      where: { name: 'Test Business' },
    });
    if (business) {
      await businessRepo.delete(business.id);
    }
    await app.close();
  });
});
