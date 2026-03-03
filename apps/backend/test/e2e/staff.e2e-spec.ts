import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import {
  UserRole,
  User,
  UserStatus,
} from '../../src/modules/users/entities/user.entity';
import { Business } from '../../src/modules/businesses/entities/business.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createTestApp } from '../utils/create-app';

describe('Staff Management (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userRepository: any;
  let businessRepository: any;

  const OWNER_ID = '123e4567-e89b-12d3-a456-426614174000';
  const OTHER_OWNER_ID = '123e4567-e89b-12d3-a456-426614174010';
  const STAFF_ID = '123e4567-e89b-12d3-a456-426614174004';
  const BIZ_ONE_ID = '123e4567-e89b-12d3-a456-426614174001';
  const BIZ_TWO_ID = '123e4567-e89b-12d3-a456-426614174002';

  beforeAll(async () => {
    app = await createTestApp();

    jwtService = app.get<JwtService>(JwtService);
    userRepository = app.get(getRepositoryToken(User));
    businessRepository = app.get(getRepositoryToken(Business));

    // Seed in correct order to avoid constraint issues and partial updates

    // 1. Create Users without businessId first
    await userRepository.save([
      {
        id: OWNER_ID,
        email: 'owner@team.com',
        password: 'password',
        firstName: 'Owner',
        lastName: 'One',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      },
      {
        id: OTHER_OWNER_ID,
        email: 'other@team.com',
        password: 'password',
        firstName: 'Other',
        lastName: 'Owner',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
      },
    ]);

    // 2. Create Businesses referencing owners
    await businessRepository.save([
      { id: BIZ_ONE_ID, name: 'Biz One', ownerId: OWNER_ID },
      { id: BIZ_TWO_ID, name: 'Biz Two', ownerId: OTHER_OWNER_ID },
    ]);

    // 3. Update Owners with businessId and add Staff
    await userRepository.save([
      {
        id: OWNER_ID,
        email: 'owner@team.com',
        password: 'password',
        firstName: 'Owner',
        lastName: 'One',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        businessId: BIZ_ONE_ID,
      },
      {
        id: OTHER_OWNER_ID,
        email: 'other@team.com',
        password: 'password',
        firstName: 'Other',
        lastName: 'Owner',
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        businessId: BIZ_TWO_ID,
      },
      {
        id: STAFF_ID,
        email: 'staff@team.com',
        password: 'password',
        firstName: 'Staff',
        lastName: 'Two',
        role: UserRole.STAFF,
        status: UserStatus.ACTIVE,
        businessId: BIZ_ONE_ID,
        permissions: ['staff'], // Staff needs this to view/manage other staff if the endpoint requires it
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: string, role: UserRole, businessId?: string) =>
    jwtService.sign({ sub: userId, role, businessId });

  describe('/users/staff (GET)', () => {
    it('should return staff for owner', () => {
      const token = generateToken(OWNER_ID, UserRole.OWNER, BIZ_ONE_ID);
      return request(app.getHttpServer())
        .get('/api/v1/users/staff')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/staff/invite (POST)', () => {
    it('should allow owner to invite staff', () => {
      const token = generateToken(OWNER_ID, UserRole.OWNER, BIZ_ONE_ID);
      return request(app.getHttpServer())
        .post('/api/v1/users/staff/invite')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'New',
          lastName: 'Staff',
          email: 'new@team.com',
          role: UserRole.STAFF,
        })
        .expect(201);
    });

    it('should forbid staff from inviting other staff', () => {
      const token = generateToken(STAFF_ID, UserRole.STAFF, BIZ_ONE_ID);
      return request(app.getHttpServer())
        .post('/api/v1/users/staff/invite')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Illegal',
          lastName: 'Invite',
          email: 'fail@team.com',
          role: UserRole.STAFF,
        })
        .expect(403);
    });
  });

  describe('/users/staff/:id (DELETE)', () => {
    it('should allow owner to remove staff', () => {
      const token = generateToken(OWNER_ID, UserRole.OWNER, BIZ_ONE_ID);
      return request(app.getHttpServer())
        .delete(`/api/v1/users/staff/${STAFF_ID}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('should prevent owner from removing staff from ANOTHER business', () => {
      const token = generateToken(OTHER_OWNER_ID, UserRole.OWNER, BIZ_TWO_ID);
      return request(app.getHttpServer())
        .delete(`/api/v1/users/staff/${OWNER_ID}`) // Trying to delete owner of biz-1
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
