import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { Branch } from '../../src/modules/branches/entities/branch.entity';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

export async function createAuthenticatedUser(
  app: INestApplication,
  role: UserRole = UserRole.CUSTOMER,
  branchId?: string,
) {
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
    const business = await businessRepo.save(
      businessRepo.create({
        name: `Test Business ${timestamp}`,
        ownerId: user.id,
      } as any),
    );

    const branch = await branchRepo.save(
      branchRepo.create({
        name: 'Main Branch',
        businessId: business.id,
        isMainBranch: true,
      } as any),
    );

    user.branchId = branch.id;
    user.businessId = business.id;
    await userRepo.save(user);
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
