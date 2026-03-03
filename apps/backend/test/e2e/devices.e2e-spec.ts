import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { UserRole, User } from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createTestApp } from '../utils/create-app';

describe('Devices & Security (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: any;
  let businessRepository: any;

  beforeAll(async () => {
    app = await createTestApp();

    jwtService = app.get<JwtService>(JwtService);
    userRepository = app.get(getRepositoryToken(User));
    businessRepository = app.get(getRepositoryToken(Business));

    // 1. Create Owner User first (without businessId)
    await userRepository.save({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'owner@example.com',
      password: 'password',
      firstName: 'Owner',
      lastName: 'User',
      role: UserRole.OWNER,
    });

    // 2. Create Business referencing the owner
    await businessRepository.save({
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Business',
      ownerId: '123e4567-e89b-12d3-a456-426614174000',
    });

    // 3. Update Owner with businessId and create other users
    await userRepository.save([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        businessId: '123e4567-e89b-12d3-a456-426614174001',
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        email: 'customer@example.com',
        password: 'password',
        firstName: 'Customer',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174003',
        email: 'staff@example.com',
        password: 'password',
        firstName: 'Staff',
        lastName: 'User',
        role: UserRole.STAFF,
        businessId: '123e4567-e89b-12d3-a456-426614174001',
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: string) => {
    // Role will be fetched from DB by JwtStrategy
    return jwtService.sign({ sub: userId });
  };

  describe('Global Security', () => {
    it('/public-test (GET) - Should be public', () => {
      return request(app.getHttpServer())
        .get('/api/v1/public-test')
        .expect(200)
        .expect('This is public');
    });

    it('/devices (GET) - Should fail without token (Global Guard)', () => {
      return request(app.getHttpServer()).get('/api/v1/devices').expect(401);
    });
  });

  describe('Role Guarding', () => {
    it('/devices (GET) - Should allow OWNER to list devices', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174000');
      return request(app.getHttpServer())
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/devices (GET) - Should forbid STAFF from listing devices', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174003');
      return request(app.getHttpServer())
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('/devices (GET) - Should forbid CUSTOMER from listing devices', () => {
      const token = generateToken('123e4567-e89b-12d3-a456-426614174002');
      return request(app.getHttpServer())
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
