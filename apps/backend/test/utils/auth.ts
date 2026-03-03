import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

export async function createAuthenticatedUser(
  app: INestApplication,
  role: UserRole = UserRole.CUSTOMER,
) {
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const password = 'Password123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  const timestamp = Date.now();
  const user = userRepo.create({
    email: `test-${role.toLowerCase()}-${timestamp}@example.com`,
    password: hashedPassword,
    firstName: 'Test',
    lastName: 'User',
    role,
    status: UserStatus.ACTIVE,
  });

  await userRepo.save(user);

  // Login to get token
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
