import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../src/modules/branches/entities/branch.entity';
import { Business } from '../src/modules/businesses/entities/business.entity';

describe('Branch Username Backfill & Uniqueness (e2e)', () => {
  let app: INestApplication;
  let branchRepo: Repository<Branch>;
  let businessRepo: Repository<Business>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    branchRepo = app.get<Repository<Branch>>(getRepositoryToken(Branch));
    businessRepo = app.get<Repository<Business>>(getRepositoryToken(Business));
  });

  it('should have all branches with unique usernames', async () => {
    const branchesWithoutUsernames = await branchRepo
      .createQueryBuilder('branch')
      .where('branch.username IS NULL')
      .getMany();

    expect(branchesWithoutUsernames).toHaveLength(0);
  });

  it('should have unique usernames across all branches', async () => {
    const branches = await branchRepo
      .createQueryBuilder('branch')
      .select('branch.username', 'username')
      .where('branch.username IS NOT NULL')
      .getMany();

    const usernames = branches.map((b) => b.username);
    const uniqueUsernames = new Set(usernames);

    expect(uniqueUsernames.size).toBe(usernames.length);
    expect(usernames.length).toBeGreaterThan(0);
  });

  it('should reject duplicate username on update', async () => {
    // Get two branches
    const branches = await branchRepo.find({ take: 2 });

    if (branches.length < 2) {
      console.log('Skipping test: Need at least 2 branches');
      return;
    }

    const [branch1, branch2] = branches;

    // Try to update branch2 with branch1's username
    return request(app.getHttpServer())
      .patch(`/branches/${branch2.id}`)
      .set('Authorization', 'Bearer TEST_TOKEN') // Would need proper auth
      .send({ username: branch1.username })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
