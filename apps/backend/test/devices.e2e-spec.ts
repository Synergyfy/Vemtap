import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { UserRole, User } from '../src/modules/users/entities/user.entity';
import { Business } from '../src/modules/businesses/entities/business.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Devices & Security (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: any;
  let businessRepository: any;

  beforeAll(async () => {
    process.env.DB_TYPE = 'sqlite';
    // Match the secret in .env or set it explicitly for the app
    process.env.JWT_SECRET = 'eliztap_super_secret_key_2026';
    process.env.JWT_EXPIRATION = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userRepository = moduleFixture.get(getRepositoryToken(User));
    businessRepository = moduleFixture.get(getRepositoryToken(Business));

    // 1. Create Owner User first (without businessId)
    await userRepository.save({
      id: 'owner-id',
      email: 'owner@example.com',
      password: 'password',
      firstName: 'Owner',
      lastName: 'User',
      role: UserRole.OWNER,
    });

    // 2. Create Business referencing the owner
    await businessRepository.save({
      id: 'biz-1',
      name: 'Test Business',
      ownerId: 'owner-id',
    });

    // 3. Update Owner with businessId and create other users
    await userRepository.save([
      {
        id: 'owner-id',
        businessId: 'biz-1',
      },
      {
        id: 'customer-id',
        email: 'customer@example.com',
        password: 'password',
        firstName: 'Customer',
        lastName: 'User',
        role: UserRole.CUSTOMER,
      },
      {
        id: 'staff-id',
        email: 'staff@example.com',
        password: 'password',
        firstName: 'Staff',
        lastName: 'User',
        role: UserRole.STAFF,
        businessId: 'biz-1',
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
    it('/devices (POST) - Should fail for CUSTOMER role (403)', () => {
      const token = generateToken('customer-id');
      return request(app.getHttpServer())
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', code: 'T-1' })
        .expect(403);
    });

    it('/devices (POST) - Should fail for STAFF role (403)', () => {
      const token = generateToken('staff-id');
      return request(app.getHttpServer())
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', code: 'T-2' })
        .expect(403);
    });

    it('/devices (POST) - Should pass for OWNER role', () => {
      const token = generateToken('owner-id');
      return request(app.getHttpServer())
        .post('/api/v1/devices')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Main Gate', code: 'LT-MG-01', location: 'Entrance' })
        .expect(201);
    });
  });
});
